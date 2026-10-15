import React, { useState } from 'react';
import { Sparkles, X, Check, RefreshCw, AlertCircle, Music } from 'lucide-react';
import { MassEvent, Song, MassProgramItem } from '../types/cantus';

interface AiSuggestModalProps {
  currentMass: MassEvent;
  songs: Song[];
  onApplySuggestions: (newItems: MassProgramItem[]) => void;
  onClose: () => void;
}

export const AiSuggestModal: React.FC<AiSuggestModalProps> = ({
  currentMass,
  songs,
  onApplySuggestions,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('');
  const [result, setResult] = useState<{
    suggestions: {
      position: string;
      positionName: string;
      songTitle: string;
      composer: string;
      reason: string;
      suggestedKey?: string;
      suggestedRhythm?: string;
    }[];
    liturgicalAdvice: string;
  } | null>(null);

  const [errorMsg, setErrorMsg] = useState('');

  const fetchAiSuggestions = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/gemini/suggest-songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          massName: currentMass.name,
          season: currentMass.season,
          feastType: currentMass.feastType,
          availableSongs: songs.map(s => ({ title: s.title, composer: s.composer, defaultPosition: s.defaultPosition })),
          theme: theme || 'Gợi ý phụng vụ tổng quát'
        })
      });

      const json = await response.json();
      if (json.success && json.data) {
        setResult(json.data);
      } else {
        throw new Error(json.error || 'Lỗi gợi ý bài hát');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể kết nối dịch vụ Gemini AI');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result || !result.suggestions) return;

    const newItems: MassProgramItem[] = result.suggestions.map((s, idx) => ({
      id: 'ai-p-' + Date.now() + '-' + idx,
      position: (s.position as any) || 'HL',
      positionLabel: s.positionName || s.position,
      songId: songs.find(so => so.title.toLowerCase().trim() === s.songTitle.toLowerCase().trim())?.id || null,
      title: s.songTitle,
      composer: s.composer || 'Nhạc sĩ',
      key: s.suggestedKey || 'G',
      rhythm: s.suggestedRhythm || 'Ballad',
      hasSolo: false,
      soloSinger: '',
      accompanist: currentMass.accompanist || '',
      notes: s.reason
    }));

    onApplySuggestions(newItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-stone-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Gợi Ý Bài Hát Thông Minh (Gemini AI)</h3>
              <p className="text-[11px] text-slate-500">{currentMass.name}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Theme */}
        <div className="space-y-2 text-xs">
          <label className="block font-semibold text-slate-700 dark:text-slate-300">
            Ý lực Lời Chúa / Chủ đề bài đọc Tin Mừng (Tùy chọn):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. Dụ ngôn tiệc cưới, người mục tử lành nghề, dâng hiến..."
              className="flex-1 bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            />
            <button
              onClick={fetchAiSuggestions}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow transition-all whitespace-nowrap"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
              <span>{loading ? 'Đang tạo...' : 'Tạo gợi ý AI'}</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 text-rose-800 p-3 rounded-xl border border-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* AI Results */}
        {result && (
          <div className="space-y-4 pt-2">
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-xs space-y-1">
              <span className="font-bold text-amber-700 dark:text-amber-300 block">Lời khuyên phụng vụ:</span>
              <p className="text-slate-700 dark:text-slate-300 italic">{result.liturgicalAdvice}</p>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white block">
                Danh sách bài hát được chọn gợi ý ({result.suggestions.length} bài):
              </span>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {result.suggestions.map((s, idx) => (
                  <div key={idx} className="bg-stone-50 dark:bg-slate-900 p-3 rounded-xl border border-stone-200 dark:border-slate-700 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-amber-600 dark:text-amber-400">[{s.positionName || s.position}] {s.songTitle}</span>
                      <span className="text-slate-400 font-semibold">{s.composer}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 italic text-[11px]">Lý do: {s.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 bg-stone-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2.5 rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                onClick={handleApply}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Áp dụng vào chương trình</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
