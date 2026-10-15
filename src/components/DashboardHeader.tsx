import React from 'react';
import { Calendar, Music, FolderArchive, Plus, Search, Sparkles } from 'lucide-react';
import { MassEvent, Song, SheetArchive } from '../types/cantus';

interface DashboardHeaderProps {
  masses: MassEvent[];
  songs: Song[];
  sheets: SheetArchive[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onNewMassProgram: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  masses,
  songs,
  sheets,
  searchQuery,
  setSearchQuery,
  onNewMassProgram,
}) => {
  const todayStr = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const totalMasses = masses.length;
  const totalSongs = songs.length;
  const totalSheets = sheets.reduce((acc, s) => acc + (s.currentQty || s.quantity || 0), 0);

  return (
    <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs space-y-4">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <span className="text-xs sm:text-sm font-extrabold text-amber-900 bg-amber-100/90 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-300">
            Xin chào, Bình An trong Chúa!
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 capitalize">
            {todayStr}
          </h2>
        </div>

        <button
          onClick={onNewMassProgram}
          className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-3 rounded-2xl font-black text-sm shadow-xs transition-all shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>+ Soạn chương trình mới</span>
        </button>
      </div>

      {/* Stats Counter Cards & Global Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold shrink-0">
            <Calendar className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 block">{totalMasses}</span>
            <span className="text-xs font-bold text-stone-500 uppercase">Chương trình đã lưu</span>
          </div>
        </div>

        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-900 flex items-center justify-center font-bold shrink-0">
            <Music className="w-6 h-6 text-sky-700" />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 block">{totalSongs}</span>
            <span className="text-xs font-bold text-stone-500 uppercase">Bài hát trong kho</span>
          </div>
        </div>

        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold shrink-0">
            <FolderArchive className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 block">{totalSheets} bản</span>
            <span className="text-xs font-bold text-stone-500 uppercase">Tài liệu giấy hiện có</span>
          </div>
        </div>
      </div>
    </div>
  );
};
