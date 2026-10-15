import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Edit3, 
  Trash2,
  Tag,
  PlayCircle
} from 'lucide-react';
import { MassEvent, LiturgicalSeason, ProgramStatus, LiturgicalCycle, FeastType, LiturgicalColor } from '../types/cantus';
import { getLiturgicalSeasonLabel, getLiturgicalSeasonColorClass, getProgramStatusLabel, getLiturgicalCycleForYear } from '../utils/cantusUtils';

interface MassCalendarModuleProps {
  masses: MassEvent[];
  onOpenProgramBuilder: (massId: string) => void;
  onSaveMass: (mass: MassEvent) => void;
  onDeleteMass: (massId: string) => void;
  onOpenNewMassModal: () => void;
}

export const MassCalendarModule: React.FC<MassCalendarModuleProps> = ({
  masses,
  onOpenProgramBuilder,
  onSaveMass,
  onDeleteMass,
  onOpenNewMassModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');

  // Available years in dataset
  const years = Array.from(new Set(masses.map(m => m.date.substring(0, 4)))).sort().reverse();

  const filteredMasses = masses.filter((m) => {
    const title = m.title || m.name || '';
    const accompanist = m.accompanist || '';
    const season = m.liturgicalSeason || m.season;

    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.date.includes(searchTerm) ||
                          accompanist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeason = selectedSeason === 'ALL' || season === selectedSeason;
    const matchesStatus = selectedStatus === 'ALL' || m.status === selectedStatus;
    const matchesYear = selectedYear === 'ALL' || m.date.startsWith(selectedYear);

    return matchesSearch && matchesSeason && matchesStatus && matchesYear;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-stone-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-amber-500" />
            <span>01. Lịch Thánh Lễ Phụng Vụ</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý lịch hát lễ theo năm dương lịch & năm phụng vụ A/B/C.
          </p>
        </div>

        <button
          onClick={onOpenNewMassModal}
          className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Thánh Lễ Mới</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-stone-200 dark:border-slate-700 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm tên Thánh lễ, ngày..."
            className="w-full bg-stone-50 dark:bg-slate-900 text-xs pl-9 pr-3 py-2 rounded-lg border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Season filter */}
        <select
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(e.target.value)}
          className="bg-stone-50 dark:bg-slate-900 text-xs px-3 py-2 rounded-lg border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
        >
          <option value="ALL">Tất cả Mùa Phụng Vụ</option>
          <option value="THUONG_NIEN">Mùa Thường Niên</option>
          <option value="MUA_VONG">Mùa Vọng</option>
          <option value="GIANG_SINH">Mùa Giáng Sinh</option>
          <option value="MUA_CHAY">Mùa Chay</option>
          <option value="PHUC_SINH">Mùa Phục Sinh</option>
          <option value="LE_TRONG">Lễ Trọng</option>
          <option value="DAC_BIET">Lễ Kính / Đặc Biệt</option>
        </select>

        {/* Status filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-stone-50 dark:bg-slate-900 text-xs px-3 py-2 rounded-lg border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
        >
          <option value="ALL">Tất cả Trạng Thái</option>
          <option value="DRAFT">Bản Nháp</option>
          <option value="APPROVED">Đã Chốt</option>
          <option value="USED">Đã Sử Dụng</option>
        </select>

        {/* Year filter */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="bg-stone-50 dark:bg-slate-900 text-xs px-3 py-2 rounded-lg border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
        >
          <option value="ALL">Tất cả các Năm</option>
          {years.map(y => (
            <option key={y} value={y}>Năm {y}</option>
          ))}
        </select>
      </div>

      {/* Mass List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMasses.map((m) => {
          const season = m.liturgicalSeason || m.season;
          const seasonColor = getLiturgicalSeasonColorClass(season);
          const statusInfo = getProgramStatusLabel(m.status);

          return (
            <div
              key={m.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${seasonColor.bg} ${seasonColor.text} ${seasonColor.border}`}>
                    {getLiturgicalSeasonLabel(season)}
                  </span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="pt-1">
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-bold">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>{m.date} {m.time ? `(${m.time})` : ''}</span>
                    <span className="text-slate-400 font-normal">· Chu kỳ Năm {m.cycle}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-2">
                    {m.title || m.name}
                  </h3>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-1">
                  <p>• Số bài hát: <span className="font-semibold text-slate-800 dark:text-slate-200">{m.program.length} bài</span></p>
                  <p>• Người đàn: <span className="font-semibold text-slate-800 dark:text-slate-200">{m.accompanist || 'Chưa chọn'}</span></p>
                  <p>• Ca trưởng / Phụ trách: <span className="font-semibold text-slate-800 dark:text-slate-200">{m.conductor || 'Chưa chọn'}</span></p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-stone-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <button
                  onClick={() => onDeleteMass(m.id)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                  title="Xóa Thánh lễ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onOpenProgramBuilder(m.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-2 rounded-xl font-bold text-xs shadow transition-all"
                >
                  <span>Soạn Chương Trình</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredMasses.length === 0 && (
          <div className="col-span-full bg-stone-50 dark:bg-slate-800/50 rounded-2xl p-8 text-center border border-dashed border-stone-300 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Không tìm thấy Thánh lễ nào phù hợp bộ lọc.</p>
          </div>
        )}
      </div>
    </div>
  );
};
