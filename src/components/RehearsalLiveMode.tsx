import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, FileText, Volume2, Music, Mic, UserCheck, Play, Pause } from 'lucide-react';
import { MassEvent, Song } from '../types/cantus';
import { getMassPositionLabel, getLiturgicalSeasonLabel } from '../utils/cantusUtils';

interface RehearsalLiveModeProps {
  currentMass: MassEvent;
  songs: Song[];
  onClose: () => void;
}

export const RehearsalLiveMode: React.FC<RehearsalLiveModeProps> = ({
  currentMass,
  songs,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentItem = currentMass.program[currentIndex];

  const matchedSong = songs.find(
    s => s.title.toLowerCase().trim() === (currentItem?.title || '').toLowerCase().trim()
  );

  const handleNext = () => {
    if (currentIndex < currentMass.program.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!currentItem) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-white p-6 flex items-center justify-center">
        <p>Chưa có bài hát nào trong chương trình.</p>
        <button onClick={onClose} className="ml-4 bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl">Đóng</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 select-none">
      {/* Live Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs bg-amber-500 text-slate-950 font-extrabold px-2.5 py-1 rounded-md uppercase">
            CHẾ ĐỘ TẬP HÁT / ĐANG HÁT
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-slate-200 mt-1">
            {currentMass.name} ({currentMass.date})
          </h2>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Thoát Chế Độ</span>
        </button>
      </div>

      {/* Main Song Display (Large readable font for tablet/music stand) */}
      <div className="max-w-4xl mx-auto w-full my-auto space-y-6 text-center">
        <div className="inline-block bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black text-base sm:text-xl px-4 py-1.5 rounded-full uppercase tracking-wider">
          {currentItem.positionLabel || getMassPositionLabel(currentItem.position)} ({currentIndex + 1}/{currentMass.program.length})
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-amber-400 tracking-tight leading-tight">
          {currentItem.title}
        </h1>

        <p className="text-lg sm:text-2xl font-bold text-slate-300">
          Sáng tác: {currentItem.composer || 'Nhạc sĩ'}
        </p>

        {/* Key & Rhythm Badges */}
        <div className="flex items-center justify-center gap-4 flex-wrap text-sm sm:text-lg pt-2">
          <div className="bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700">
            <span className="text-slate-400">Tông:</span> <strong className="text-amber-400 font-extrabold">{currentItem.key || 'Gốc'}</strong>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700">
            <span className="text-slate-400">Điệu:</span> <strong className="text-white font-bold">{currentItem.rhythm || 'Standard'}</strong>
          </div>
          {currentItem.hasSolo && (
            <div className="bg-purple-950/60 text-purple-300 px-4 py-2 rounded-2xl border border-purple-800 font-bold">
              Solo: {currentItem.soloSinger || 'Có phần Solo'}
            </div>
          )}
        </div>

        {/* Mass Specific Notes */}
        {currentItem.notes && (
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-sm sm:text-base text-amber-200/90 italic max-w-2xl mx-auto">
            "{currentItem.notes}"
          </div>
        )}

        {/* Fixed Notes if matched */}
        {matchedSong?.fixedNotes && (
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 italic max-w-xl mx-auto">
            Ghi chú bài hát: {matchedSong.fixedNotes}
          </div>
        )}

        {/* Audio / PDF Links */}
        <div className="flex items-center justify-center gap-4 pt-2">
          {matchedSong?.pdfUrl && (
            <a
              href={matchedSong.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Mở Bản Nhạc PDF</span>
            </a>
          )}

          {matchedSong?.audioUrl && (
            <a
              href={matchedSong.audioUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all"
            >
              <Volume2 className="w-4 h-4" />
              <span>Nghe Audio Mẫu</span>
            </a>
          )}
        </div>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-4 gap-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Bài Trước</span>
        </button>

        <div className="flex space-x-1.5">
          {currentMass.program.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-3 h-3 rounded-full transition-all ${
                currentIndex === idx ? 'bg-amber-400 w-6' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === currentMass.program.length - 1}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-slate-950 font-bold px-6 py-3 rounded-2xl text-sm transition-all shadow-lg"
        >
          <span>Bài Kế Tiếp</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
