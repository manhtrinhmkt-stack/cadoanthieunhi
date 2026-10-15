import React from 'react';
import { History, X, Calendar, Check, ArrowRight } from 'lucide-react';
import { MassEvent } from '../types/cantus';
import { getMassPositionLabel } from '../utils/cantusUtils';

interface PastYearsModalProps {
  currentMass: MassEvent;
  allMasses: MassEvent[];
  onCopyFromPastMass: (sourceMass: MassEvent) => void;
  onClose: () => void;
}

export const PastYearsModal: React.FC<PastYearsModalProps> = ({
  currentMass,
  allMasses,
  onCopyFromPastMass,
  onClose,
}) => {
  const currentTitle = currentMass.title || currentMass.name || '';
  const currentSeason = currentMass.liturgicalSeason || currentMass.season;

  // Find past masses that match similar Sunday or name
  const pastMatches = allMasses.filter(m => {
    const mTitle = m.title || m.name || '';
    const mSeason = m.liturgicalSeason || m.season;
    return m.id !== currentMass.id &&
      (mTitle.toLowerCase().includes(currentTitle.toLowerCase().substring(0, 10)) ||
       (mSeason && mSeason === currentSeason));
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-stone-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Chế Độ "Nhìn Lại Các Năm Trước"</h3>
              <p className="text-[11px] text-slate-500">{currentTitle} (Năm {currentMass.cycle})</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300">
          So sánh chương trình hát của cùng dịp lễ này trong các năm theo chu kỳ phụng vụ <strong>Năm A, B, C</strong> để tham khảo ý tưởng & tránh lặp lại bài hát lân cận:
        </p>

        <div className="space-y-4">
          {pastMatches.map((m) => (
            <div
              key={m.id}
              className="bg-stone-50 dark:bg-slate-900 p-4 rounded-xl border border-stone-200 dark:border-slate-700 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between font-bold border-b border-stone-200 dark:border-slate-700 pb-2">
                <div>
                  <span className="text-amber-600 dark:text-amber-400 block">{m.date} - {m.title || m.name}</span>
                  <span className="text-[11px] text-slate-400">Chu kỳ Phụng vụ: Năm {m.cycle} · Đàn: {m.accompanist || 'N/A'}</span>
                </div>

                <button
                  onClick={() => {
                    onCopyFromPastMass(m);
                    onClose();
                  }}
                  className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition-all"
                >
                  <span>Lấy chương trình này</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {m.program.map((p, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-stone-200 dark:border-slate-700">
                    <span className="font-extrabold text-amber-600 dark:text-amber-400 block">{p.positionLabel}:</span>
                    <span className="font-bold text-slate-900 dark:text-white block">{p.title}</span>
                    <span className="text-[10px] text-slate-400">{p.composer}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {pastMatches.length === 0 && (
            <div className="p-6 text-center text-slate-400 italic bg-stone-50 dark:bg-slate-900 rounded-xl">
              Chưa có dữ liệu Thánh lễ tương ứng của các năm trước trong hệ thống.
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
