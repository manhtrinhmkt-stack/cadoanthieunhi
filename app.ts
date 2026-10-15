import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

import {
  bootstrapDefaultAdmin,
  getUserByUsername,
  createSession,
  getAndValidateSession,
  destroySession,
  changeUserPassword,
  getAppData,
  saveAppData
} from './serverAuth';

dotenv.config();

export const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Bootstrap default administrator account if needed
bootstrapDefaultAdmin().catch(err => {
  console.error('[Bootstrap] Failed to bootstrap admin:', err);
});

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

// Auth Middleware
async function requireAuth(req: any, res: any, next: any) {
  const cookieToken = req.cookies?.cantus_session;
  const headerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;

  const token = cookieToken || headerToken;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Chưa đăng nhập hoặc phiên làm việc hết hạn.' });
  }

  const session = await getAndValidateSession(token);
  if (!session) {
    res.clearCookie('cantus_session');
    return res.status(401).json({ success: false, error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }

  req.userSession = session;
  next();
}

// Router for API endpoints (handles both /api/* and /* paths gracefully on Vercel)
const apiRouter = express.Router();

// =============================================================
// AUTHENTICATION API ROUTES
// =============================================================

// POST /auth/login
apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
    }

    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    const passwordValid = bcrypt.compareSync(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    // Create 30-day session
    const session = await createSession(user.username);

    // Set HttpOnly cookie with 30-day lifespan
    res.cookie('cantus_session', session.token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax',
      path: '/'
    });

    res.json({
      success: true,
      token: session.token,
      user: {
        username: user.username,
        displayName: user.displayName || user.username
      }
    });
  } catch (error: any) {
    console.error('[API Login] Error:', error);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ khi đăng nhập.' });
  }
});

// GET /auth/me (Session Check & Auto-Refresh)
apiRouter.get('/auth/me', async (req, res) => {
  try {
    const cookieToken = req.cookies?.cantus_session;
    const headerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null;

    const token = cookieToken || headerToken;
    if (!token) {
      return res.status(401).json({ success: false, authenticated: false });
    }

    const session = await getAndValidateSession(token);
    if (!session) {
      res.clearCookie('cantus_session');
      return res.status(401).json({ success: false, authenticated: false });
    }

    const user = await getUserByUsername(session.username);

    // Refresh cookie
    res.cookie('cantus_session', session.token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      path: '/'
    });

    res.json({
      success: true,
      authenticated: true,
      token: session.token,
      user: {
        username: session.username,
        displayName: user?.displayName || session.username
      }
    });
  } catch (error: any) {
    console.error('[API Me] Error:', error);
    res.status(500).json({ success: false, error: 'Lỗi kiểm tra phiên.' });
  }
});

// POST /auth/logout
apiRouter.post('/auth/logout', async (req, res) => {
  try {
    const cookieToken = req.cookies?.cantus_session;
    const headerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null;

    const token = cookieToken || headerToken;
    if (token) {
      await destroySession(token);
    }

    res.clearCookie('cantus_session');
    res.json({ success: true, message: 'Đã đăng xuất thành công.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Lỗi đăng xuất.' });
  }
});

// POST /auth/change-password
apiRouter.post('/auth/change-password', requireAuth, async (req: any, res: any) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    const username = req.userSession.username;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Vui lòng điền đầy đủ mật khẩu hiện tại và mật khẩu mới.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }

    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản.' });
    }

    const isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Mật khẩu hiện tại không chính xác.' });
    }

    await changeUserPassword(username, newPassword);

    res.json({ success: true, message: 'Thay đổi mật khẩu thành công!' });
  } catch (error: any) {
    console.error('[API Change Password] Error:', error);
    res.status(500).json({ success: false, error: 'Lỗi khi thay đổi mật khẩu.' });
  }
});

// =============================================================
// APP DATA STORAGE ROUTES (PROXIED TO FIRESTORE / LOCAL BACKUP)
// =============================================================

// GET /data/load
apiRouter.get('/data/load', requireAuth, async (req: any, res: any) => {
  try {
    const data = await getAppData();
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('[API Data Load] Error:', error);
    res.status(500).json({ success: false, error: 'Lỗi khi tải dữ liệu từ Firestore.' });
  }
});

// POST /data/save
apiRouter.post('/data/save', requireAuth, async (req: any, res: any) => {
  try {
    const { masses, songs, sheets } = req.body || {};
    await saveAppData({ masses, songs, sheets });
    res.json({ success: true, message: 'Đã lưu đồng bộ dữ liệu an toàn!' });
  } catch (error: any) {
    console.error('[API Data Save] Error:', error);
    res.status(500).json({ success: false, error: 'Lỗi khi lưu dữ liệu.' });
  }
});

// =============================================================
// AI SONG SUGGESTION ENDPOINT
// =============================================================

apiRouter.post('/gemini/suggest-songs', requireAuth, async (req: any, res: any) => {
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
      model: 'gemini-3.8-flash',
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

// Mount router on both /api prefix and root for maximum Vercel compatibility
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global Error Handler middleware to ALWAYS return JSON instead of Express HTML error pages
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[Express Global Error]:', err);
  res.status(500).json({
    success: false,
    error: err?.message || 'Lỗi xử lý hệ thống máy chủ.'
  });
});

