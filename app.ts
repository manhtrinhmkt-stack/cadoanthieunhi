import express from 'express';
import cookieParser from 'cookie-parser';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Initialize Gemini Client safely
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Router for API endpoints (mounted on /api)
const apiRouter = express.Router();

// =============================================================
// AI SONG SUGGESTION ENDPOINT
// =============================================================

apiRouter.post('/gemini/suggest-songs', async (req: any, res: any) => {
  try {
    const { massName, season, feastType, availableSongs, theme } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(500).json({ success: false, error: 'Chưa cấu hình GEMINI_API_KEY.' });
    }

    const prompt = `Bạn là chuyên gia Phụng vụ & Thánh nhạc Công giáo Việt Nam cho ứng dụng Cantus.
Hãy gợi ý danh sách bài hát phù hợp nhất cho Thánh lễ:
- Tên ngày lễ: ${massName || 'Chúa nhật'}
- Mùa phụng vụ: ${season || 'Mùa Thường Niên'}
- Loại lễ: ${feastType || 'Chúa nhật'}
- Chủ đề/Bài đọc Tin Mừng: ${theme || 'Gợi ý tổng quát theo phụng vụ'}

Danh sách bài hát sẵn có trong thư viện ca đoàn hiện tại:
${JSON.stringify(availableSongs || [], null, 2)}

Yêu cầu:
1. Đề xuất bài cho từng vị trí: Nhập lễ (NL), Đáp ca (DC), Alleluia (ALL), Dâng lễ (DL), Hiệp lễ (HL), Kết lễ (KL).
2. Ưu tiên chọn các bài từ thư viện sẵn có nếu phù hợp. Nếu bài chưa có trong thư viện, gợi ý bài nổi tiếng quen thuộc trong Thánh nhạc Việt Nam (Kim Long, Thành Tâm, Phanxicô, Mi Trầm, Hải Ánh...).
3. Nêu lý do gợi ý ngắn gọn (1 câu) gắn liền với ý nghĩa lời Chúa hoặc mùa phụng vụ.
4. Trả về định dạng JSON theo đúng cấu trúc.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  position: { type: Type.STRING, description: 'NL, DC, ALL, DL, HL, HOẶC KL' },
                  positionName: { type: Type.STRING, description: 'Tên vị trí tiếng Việt (e.g. Nhập lễ)' },
                  songTitle: { type: Type.STRING },
                  composer: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  suggestedKey: { type: Type.STRING },
                  suggestedRhythm: { type: Type.STRING },
                  isFromLibrary: { type: Type.BOOLEAN }
                },
                required: ['position', 'positionName', 'songTitle', 'composer', 'reason']
              }
            },
            liturgicalAdvice: {
              type: Type.STRING,
              description: 'Lời khuyên phụng vụ hoặc lưu ý về màu áo/điệu nhạc cho Thánh lễ này.'
            }
          },
          required: ['suggestions', 'liturgicalAdvice']
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error('Không nhận được phản hồi từ AI');
    }

    const parsedData = JSON.parse(jsonText);
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi khi gọi AI gợi ý bài hát'
    });
  }
});

// Diagnostic Health Route
apiRouter.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    message: 'Cantus API Server is running',
    timestamp: new Date().toISOString()
  });
});

// Mount router on API paths
app.use('/api', apiRouter);
app.use('/api/index', apiRouter);
app.use('/', apiRouter);

// Global Error Handler middleware to ALWAYS return JSON
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[Express Global Error]:', err);
  res.status(500).json({
    success: false,
    error: err?.message || 'Lỗi xử lý hệ thống máy chủ.'
  });
});
