import React from 'react';
import { 
  Calendar, 
  FileText, 
  Music, 
  FolderArchive, 
  BarChart3, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  Users, 
  Printer, 
  CheckCircle2, 
  AlertTriangle,
  PlayCircle
} from 'lucide-react';
import { MassEvent, Song, SheetPrintArchive } from '../types/cantus';
import { getLiturgicalSeasonLabel, getLiturgicalSeasonColorClass, getProgramStatusLabel } from '../utils/cantusUtils';

interface DashboardOverviewProps {
  upcomingMass: MassEvent | null;
  allMasses: MassEvent[];
  allSongs: Song[];
  allArchives: SheetPrintArchive[];
  onNavigateTab: (tab: string) => void;
  onOpenMassProgram: (massId: string) => void;
  onOpenRehearsalMode: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  upcomingMass,
  allMasses,
  allSongs,
  allArchives,
  onNavigateTab,
  onOpenMassProgram,
  onOpenRehearsalMode,
}) => {
  const season = upcomingMass ? (upcomingMass.liturgicalSeason || upcomingMass.season) : undefined;
  const seasonColor = season ? getLiturgicalSeasonColorClass(season) : null;
  const statusInfo = upcomingMass ? getProgramStatusLabel(upcomingMass.status) : null;

  return (
    <div className="space-y-6">
      {/* Top Banner: Next Upcoming Mass */}
      {upcomingMass ? (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-amber-500 text-slate-950 font-extrabold text-xs px-2.5 py-1 rounded-md uppercase tracking-wider">
                  Thánh lễ Sắp Tới
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-md font-semibold ${seasonColor?.bg} ${seasonColor?.text}`}>
                  {getLiturgicalSeasonLabel(season)} ({upcomingMass.date})
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${statusInfo?.color}`}>
                  Trạng thái: {statusInfo?.label}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-300">
                {upcomingMass.title || upcomingMass.name}
              </h2>

              <p className="text-sm text-slate-300">
                Chương trình gồm <span className="font-bold text-white">{upcomingMass.program.length} bài hát</span> · 
                Đàn: <span className="font-semibold text-amber-200">{upcomingMass.accompanist || 'Chưa phân công'}</span> · 
                Phụ trách: <span className="font-semibold text-amber-200">{upcomingMass.conductor || 'Chưa phân công'}</span>
              </p>

              {(upcomingMass.generalNote || upcomingMass.notes) && (
                <p className="text-xs text-slate-400 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 italic">
                  "{upcomingMass.generalNote || upcomingMass.notes}"
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <button
                onClick={() => onOpenMassProgram(upcomingMass.id)}
                className="flex-1 lg:flex-initial flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-amber-500/20 transition-all"
              >
                <span>Soạn / Xem Chương Trình</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenRehearsalMode}
                className="flex-1 lg:flex-initial flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-lg transition-all"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Mở Chế Độ Tập Hát</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 text-slate-300 rounded-2xl p-6 text-center">
          <p className="text-sm">Chưa có Thánh lễ sắp tới nào. Hãy thêm Thánh lễ mới trong Lịch Thánh lễ.</p>
        </div>
      )}

      {/* 4 Primary Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigateTab('calendar')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-stone-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-400 shadow-sm hover:shadow-md transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-amber-600 dark:group-hover:text-amber-400">
            Lịch Thánh Lễ
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý theo ngày, tuần, tháng & mùa phụng vụ ({allMasses.length} ngày lễ đã lưu)
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('library')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-stone-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-400 shadow-sm hover:shadow-md transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Music className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-amber-600 dark:group-hover:text-amber-400">
            Kho Bài Hát
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {allSongs.length} bài hát có sẵn · PDF, audio & lịch sử hát nhiều năm
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('inventory')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-stone-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-400 shadow-sm hover:shadow-md transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FolderArchive className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-amber-600 dark:group-hover:text-amber-400">
            Kho Bản In
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {allArchives.length} đầu tài liệu giấy · Mã HL-0025, vị trí tủ, mượn-trả
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('stats')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-stone-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-400 shadow-sm hover:shadow-md transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-amber-600 dark:group-hover:text-amber-400">
            Thống Kê Tra Cứu
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tra cứu hai chiều, tần suất lặp bài & nhìn lại các năm trước
          </p>
        </button>
      </div>
    </div>
  );
};
