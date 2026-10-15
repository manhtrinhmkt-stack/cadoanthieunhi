import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  History, 
  Copy, 
  Share2, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  CheckCircle2, 
  Printer, 
  Music, 
  PlayCircle,
  FileDown,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { MassEvent, MassProgramItem, Song, SheetPrintArchive, ProgramStatus, MassPosition } from '../types/cantus';
import { 
  getMassPositionLabel, 
  getMassPositionBadgeColor, 
  getLiturgicalSeasonLabel, 
  getLiturgicalSeasonColorClass,
  getProgramStatusLabel,
  checkRepetitionWarning,
  checkLentAlleluiaWarning
} from '../utils/cantusUtils';

interface ProgramBuilderModuleProps {
  currentMass: MassEvent;
  allMasses: MassEvent[];
  songs: Song[];
  archives: SheetPrintArchive[];
  onUpdateMassProgram: (updatedMass: MassEvent) => void;
  onOpenEditPositionModal: (item: MassProgramItem | null) => void;
  onOpenAiSuggestModal: () => void;
  onOpenPastYearsModal: () => void;
  onOpenCopyModal: () => void;
  onOpenExportModal: () => void;
  onOpenRehearsalMode: () => void;
}

export const ProgramBuilderModule: React.FC<ProgramBuilderModuleProps> = ({
  currentMass,
  allMasses,
  songs,
  archives,
  onUpdateMassProgram,
  onOpenEditPositionModal,
  onOpenAiSuggestModal,
  onOpenPastYearsModal,
  onOpenCopyModal,
  onOpenExportModal,
  onOpenRehearsalMode,
}) => {
  const season = currentMass.liturgicalSeason || currentMass.season;
  const seasonColor = getLiturgicalSeasonColorClass(season);
  const statusInfo = getProgramStatusLabel(currentMass.status);

  // Status Change Handler
  const handleStatusChange = (newStatus: ProgramStatus) => {
    onUpdateMassProgram({ ...currentMass, status: newStatus });
  };

  // Reorder Handler
  const moveItem = (index: number, direction: 'UP' | 'DOWN') => {
    const newProg = [...currentMass.program];
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newProg.length) return;

    const temp = newProg[index];
    newProg[index] = newProg[targetIdx];
    newProg[targetIdx] = temp;

    onUpdateMassProgram({ ...currentMass, program: newProg });
  };

  // Remove Position Item
  const removeItem = (itemId: string) => {
    const newProg = currentMass.program.filter(p => p.id !== itemId);
    onUpdateMassProgram({ ...currentMass, program: newProg });
  };

  // Find linked sheet print archive for a song
  const getLinkedArchive = (songTitle: string) => {
    if (!songTitle) return null;
    return archives.find(a => a.songTitle.toLowerCase().trim() === songTitle.toLowerCase().trim());
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-stone-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${seasonColor.bg} ${seasonColor.text} ${seasonColor.border}`}>
                {getLiturgicalSeasonLabel(season)}
              </span>
              <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-semibold">
                Chu kỳ Năm {currentMass.cycle}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {currentMass.date}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {currentMass.title || currentMass.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Đàn: <span className="font-semibold text-slate-800 dark:text-slate-200">{currentMass.accompanist || 'Chưa chọn'}</span> · 
              Phụ trách: <span className="font-semibold text-slate-800 dark:text-slate-200">{currentMass.conductor || 'Chưa chọn'}</span>
            </p>
          </div>

          {/* Program Status Workflow Switcher */}
          <div className="flex items-center gap-2 bg-stone-100 dark:bg-slate-900 p-1.5 rounded-xl border border-stone-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 pl-2">Trạng thái:</span>
            {(['DRAFT', 'APPROVED', 'USED'] as ProgramStatus[]).map((st) => {
              const active = currentMass.status === st;
              const info = getProgramStatusLabel(st);
              return (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                    active 
                      ? `${info.color} shadow-sm border border-stone-300 dark:border-slate-600`
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {info.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Smart Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenAiSuggestModal}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs px-3.5 py-2 rounded-xl font-bold shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Gợi ý Bài Hát AI</span>
            </button>

            <button
              onClick={onOpenPastYearsModal}
              className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs px-3.5 py-2 rounded-xl font-semibold transition-all"
              title="Xem chương trình của cùng Chúa nhật này trong chu kỳ các năm A / B / C trước"
            >
              <History className="w-3.5 h-3.5 text-amber-500" />
              <span>Nhìn lại các năm trước</span>
            </button>

            <button
              onClick={onOpenCopyModal}
              className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs px-3.5 py-2 rounded-xl font-semibold transition-all"
            >
              <Copy className="w-3.5 h-3.5 text-sky-500" />
              <span>Sao chép chương trình</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs px-3.5 py-2 rounded-xl font-bold shadow-sm transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Xuất Zalo / PDF</span>
            </button>

            <button
              onClick={onOpenRehearsalMode}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3.5 py-2 rounded-xl font-bold shadow-sm transition-all"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Đang Hát Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* Program Items List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <span>Danh Sách Bài Hát ({currentMass.program.length} bài)</span>
          </h2>

          <button
            onClick={() => onOpenEditPositionModal(null)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm bài vị trí khác</span>
          </button>
        </div>

        {currentMass.program.map((item, idx) => {
          const itemTitle = item.title || '';
          const badgeClass = getMassPositionBadgeColor(item.position);
          const repWarning = checkRepetitionWarning(itemTitle, currentMass.date, allMasses, currentMass.id);
          const lentWarning = checkLentAlleluiaWarning(season, item.position, itemTitle);
          const linkedArchive = getLinkedArchive(itemTitle);

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-all space-y-3 relative group"
            >
              {/* Item Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-slate-700/60 pb-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${badgeClass}`}>
                    {item.positionLabel || getMassPositionLabel(item.position)}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {item.title || <span className="text-slate-400 italic">Chưa chọn bài hát</span>}
                  </h3>
                </div>

                {/* Reorder and Edit Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => moveItem(idx, 'UP')}
                    disabled={idx === 0}
                    className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 rounded-md transition-colors"
                    title="Di chuyển lên"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => moveItem(idx, 'DOWN')}
                    disabled={idx === currentMass.program.length - 1}
                    className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 rounded-md transition-colors"
                    title="Di chuyển xuống"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onOpenEditPositionModal(item)}
                    className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs px-2.5 py-1.5 rounded-lg font-bold transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Sửa bài</span>
                  </button>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                    title="Xóa khỏi chương trình"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Item Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-slate-400">Tác giả:</span>{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.composer || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Tông:</span>{' '}
                  <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">{item.key || 'Gốc'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Điệu:</span>{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.rhythm || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Solo:</span>{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.hasSolo ? (item.soloSinger || 'Có hát solo') : 'Không'}</span>
                </div>
              </div>

              {/* Specific Mass Notes */}
              {item.notes && (
                <div className="bg-stone-50 dark:bg-slate-900/80 p-2.5 rounded-xl border border-stone-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 italic flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Ghi chú hát: {item.notes}</span>
                </div>
              )}

              {/* Linked Sheet Print Inventory Status Bar */}
              <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-stone-100 dark:border-slate-700/40 text-xs">
                {linkedArchive ? (
                  <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-lg font-medium border border-emerald-200 dark:border-emerald-800">
                    <Printer className="w-3.5 h-3.5" />
                    <span>Kho bản in: <strong className="font-bold">{linkedArchive.storageCode}</strong> · Còn <strong className="font-bold">{linkedArchive.currentQuantity} bản</strong> ({linkedArchive.location})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-lg font-medium border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Chưa liên kết kho bản in (Đánh dấu cần in)</span>
                  </div>
                )}
              </div>

              {/* Repetition Warning Banner */}
              {repWarning.isRecent && (
                <div className="bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Cảnh báo lặp bài:</strong> Bài này đã hát cách đây {repWarning.daysDiff} ngày ({repWarning.lastUsedDate} - {repWarning.lastMassName}). Bạn có thể cân nhắc đổi bài hoặc giữ nguyên nếu phù hợp.
                  </span>
                </div>
              )}

              {/* Lent Alleluia Warning */}
              {lentWarning && (
                <div className="bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 p-2.5 rounded-xl border border-rose-300 dark:border-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Lưu ý Phụng Vụ:</strong> Mùa Chay không hát Alleluia. Hãy chuyển sang câu Tung Hô Tin Mừng Mùa Chay thích hợp.
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
