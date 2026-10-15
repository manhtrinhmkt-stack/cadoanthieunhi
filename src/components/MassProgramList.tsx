import React, { useState } from 'react';
import { 
  Calendar, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  Printer, 
  Check, 
  X, 
  ChevronDown,
  AlertTriangle,
  BookOpen,
  GripVertical,
  Sparkles,
  Zap,
  Filter,
  Layers,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { MassEvent, MassProgramItem, Song, LiturgicalSeason, ProgramStatus, MassPosition } from '../types/cantus';
import { 
  getMassPositionLabel, 
  getLiturgicalSeasonLabel, 
  getLiturgicalHeaderStyle,
  matchVietnameseText,
  generateAutoSundayMass,
  formatDateToDDMMYYYY,
  exportToExcel
} from '../utils/cantusUtils';
import { MatrixScheduleView } from './MatrixScheduleView';

interface MassProgramListProps {
  masses: MassEvent[];
  songs: Song[];
  onSaveMass: (m: MassEvent, newSongsToCreate?: Song[]) => void;
  onDeleteMass: (id: string) => void;
  onDuplicateMass: (source: MassEvent, newDate: string) => void;
  onOpenPdfPrint: (m: MassEvent) => void;
}

export const MassProgramList: React.FC<MassProgramListProps> = ({
  masses,
  songs,
  onSaveMass,
  onDeleteMass,
  onDuplicateMass,
  onOpenPdfPrint,
}) => {
  // View mode switcher: 'THEO_MUA' | 'THEO_THANG' | 'THEO_NAM' | 'BANG_EXCEL'
  const [viewMode, setViewMode] = useState<'THEO_MUA' | 'THEO_THANG' | 'THEO_NAM' | 'BANG_EXCEL'>('BANG_EXCEL');

  // Sub-filters
  const [selectedSeason, setSelectedSeason] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const currentYearStr = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [filterSearch, setFilterSearch] = useState<string>('');

  // Mobile Sidebar Toggle
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modal Editor state
  const [editingMass, setEditingMass] = useState<MassEvent | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Drag and drop state for row reordering
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);

  // Additional Modals state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [duplicateModalSource, setDuplicateModalSource] = useState<MassEvent | null>(null);
  const [duplicateNewDate, setDuplicateNewDate] = useState<string>(new Date().toISOString().substring(0, 10));

  // Edit item expanded row index
  const [expandedItemIndex, setExpandedItemIndex] = useState<number | null>(null);

  // Autocomplete state for each program row
  const [searchDropdowns, setSearchDropdowns] = useState<{ [key: number]: { query: string; show: boolean } }>({});

  // Available Years list
  const years = Array.from(new Set(masses.map(m => (m.date || '').substring(0, 4)))).sort().reverse();
  if (!years.includes(currentYearStr)) years.unshift(currentYearStr);

  // Filtered masses logic
  const filteredMasses = masses.filter(m => {
    const searchMatch = !filterSearch.trim() || 
      matchVietnameseText(m.title || m.name || '', filterSearch) || 
      (m.date || '').includes(filterSearch) ||
      m.program.some(p => matchVietnameseText(p.title || '', filterSearch) || matchVietnameseText(p.composer || '', filterSearch));

    if (!searchMatch) return false;

    if (viewMode === 'THEO_MUA') {
      if (selectedSeason === 'ALL') return true;
      const massSeason = m.liturgicalSeason || m.season || 'THUONG_NIEN';
      if (selectedSeason === 'LE_TRONG') {
        return ['LE_TRONG', 'DAC_BIET', 'KHAC'].includes(massSeason);
      }
      return massSeason === selectedSeason;
    }

    if (viewMode === 'THEO_THANG') {
      if (selectedMonth === 'ALL') return true;
      const monthNum = (m.date || '').substring(5, 7);
      return monthNum === selectedMonth;
    }

    if (viewMode === 'THEO_NAM') {
      if (selectedYear === 'ALL') return true;
      return (m.date || '').startsWith(selectedYear);
    }

    return true;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Auto create Sunday Mass
  const handleAutoCreateSunday = () => {
    const autoMass = generateAutoSundayMass(masses);
    setEditingMass(autoMass);
    setExpandedItemIndex(null);
    setSearchDropdowns({});
    setIsEditModalOpen(true);
  };

  // Open Popup Modal Editor
  const handleOpenEditModal = (m: MassEvent | null) => {
    if (m) {
      setEditingMass(JSON.parse(JSON.stringify(m)));
    } else {
      const newMass = generateAutoSundayMass(masses);
      setEditingMass(newMass);
    }
    setExpandedItemIndex(null);
    setSearchDropdowns({});
    setIsEditModalOpen(true);
  };

  // Fill Standard Sunday Template in Modal
  const handleFillStandardSundayTemplate = () => {
    if (!editingMass) return;
    const standardProgram: MassProgramItem[] = [
      { id: 'p1', songId: null, position: 'NL', positionLabel: 'Nhập lễ', order: 1, hasSolo: false, title: '', composer: '', key: '', rhythm: 'Ballad' },
      { id: 'p2', songId: null, position: 'DC', positionLabel: 'Đáp ca', order: 2, hasSolo: false, title: '', composer: '', key: '', rhythm: 'Chant' },
      { id: 'p3', songId: null, position: 'ALL', positionLabel: 'Alleluia', order: 3, hasSolo: false, title: '', composer: '', key: '', rhythm: 'March' },
      { id: 'p4', songId: null, position: 'DL', positionLabel: 'Dâng lễ', order: 4, hasSolo: false, title: '', composer: '', key: '', rhythm: 'Ballad' },
      { id: 'p5', songId: null, position: 'HL', positionLabel: 'Hiệp lễ', order: 5, hasSolo: false, title: '', composer: '', key: '', rhythm: 'Ballad' },
      { id: 'p6', songId: null, position: 'KL', positionLabel: 'Kết lễ', order: 6, hasSolo: false, title: '', composer: '', key: '', rhythm: 'March' },
    ];
    setEditingMass({
      ...editingMass,
      program: standardProgram
    });
  };

  // Add extra position row
  const handleAddProgramRow = () => {
    if (!editingMass) return;
    const newRow: MassProgramItem = {
      id: 'p-' + Date.now(),
      songId: null,
      position: 'HL',
      positionLabel: 'Hiệp lễ',
      order: editingMass.program.length + 1,
      hasSolo: false,
      title: '',
      composer: '',
      key: '',
      rhythm: 'Ballad'
    };
    setEditingMass({
      ...editingMass,
      program: [...editingMass.program, newRow]
    });
    setExpandedItemIndex(editingMass.program.length);
  };

  // Drag and drop reorder logic
  const handleDragStart = (idx: number) => {
    setDraggedRowIndex(idx);
  };

  const handleDrop = (targetIdx: number) => {
    if (draggedRowIndex === null || !editingMass) return;
    if (draggedRowIndex === targetIdx) return;

    const updated = [...editingMass.program];
    const [moved] = updated.splice(draggedRowIndex, 1);
    updated.splice(targetIdx, 0, moved);

    setEditingMass({ ...editingMass, program: updated });
    setDraggedRowIndex(null);
  };

  // Delete row in editor
  const handleDeleteRow = (idx: number) => {
    if (!editingMass) return;
    const items = editingMass.program.filter((_, i) => i !== idx);
    setEditingMass({ ...editingMass, program: items });
  };

  // Save Editor changes
  const handleSaveEditor = (forcedStatus?: ProgramStatus) => {
    if (!editingMass || !editingMass.date || !editingMass.title) return;

    const finalMass: MassEvent = {
      ...editingMass,
      status: forcedStatus || editingMass.status,
      season: editingMass.liturgicalSeason
    };

    // Auto-create new songs
    const newSongsToCreate: Song[] = [];
    finalMass.program.forEach(p => {
      if (p.title && p.title.trim()) {
        const cleanTitle = p.title.trim();
        const existing = songs.find(s => matchVietnameseText(s.title, cleanTitle));
        if (!existing) {
          newSongsToCreate.push({
            id: 's-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            title: cleanTitle,
            composer: p.composer?.trim() || 'Chưa rõ',
            storageCode: p.key?.trim() || p.pageNumber?.trim() || '',
            pageNumber: p.key?.trim() || p.pageNumber?.trim() || '',
            categories: [p.position],
            defaultPosition: p.position,
            defaultRhythm: p.rhythm || 'Ballad',
            createdAt: new Date().toISOString()
          });
        }
      }
    });

    onSaveMass(finalMass, newSongsToCreate);
    setIsEditModalOpen(false);
    setEditingMass(null);
  };

  const seasonsList: { key: string; label: string }[] = [
    { key: 'ALL', label: 'Tất cả các mùa' },
    { key: 'MUA_VONG', label: 'Mùa Vọng' },
    { key: 'GIANG_SINH', label: 'Mùa Giáng Sinh' },
    { key: 'MUA_CHAY', label: 'Mùa Chay' },
    { key: 'PHUC_SINH', label: 'Mùa Phục Sinh' },
    { key: 'THUONG_NIEN', label: 'Mùa Thường Niên' },
    { key: 'LE_TRONG', label: 'Lễ Trọng & Khác' },
  ];

  const monthNames = [
    { key: 'ALL', label: 'Tất cả tháng' },
    { key: '01', label: 'Tháng 1' },
    { key: '02', label: 'Tháng 2' },
    { key: '03', label: 'Tháng 3' },
    { key: '04', label: 'Tháng 4' },
    { key: '05', label: 'Tháng 5' },
    { key: '06', label: 'Tháng 6' },
    { key: '07', label: 'Tháng 7' },
    { key: '08', label: 'Tháng 8' },
    { key: '09', label: 'Tháng 9' },
    { key: '10', label: 'Tháng 10' },
    { key: '11', label: 'Tháng 11' },
    { key: '12', label: 'Tháng 12' },
  ];

  // Export Matrix to Excel
  const handleExportMatrixExcel = () => {
    const rows = filteredMasses.map(m => {
      const seasonLabel = getLiturgicalHeaderStyle(m.liturgicalSeason || m.season).name;
      const getPosStr = (pos: MassPosition) => m.program.filter(p => p.position === pos).map(i => `${i.title}${i.composer ? ' (' + i.composer + ')' : ''}${i.soloSinger ? ' [Solo: ' + i.soloSinger + ']' : ''}`).join('; ');

      return {
        'Ngày': formatDateToDDMMYYYY(m.date),
        'Mùa Phụng Vụ': seasonLabel,
        'Ngày lễ': m.title || m.name || '',
        'Nhập lễ': getPosStr('NL'),
        'Đáp ca (gồm Solo)': getPosStr('DC'),
        'Alleluia / Tung hô': getPosStr('ALL'),
        'Dâng lễ': getPosStr('DL'),
        'Hiệp lễ': getPosStr('HL'),
        'Kết lễ': getPosStr('KL'),
      };
    });

    exportToExcel(rows, `Bang_Lich_Hat_Thanh_Ca_Mat_Tran_${new Date().toISOString().substring(0, 10)}`);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-4 items-stretch h-full min-h-0 overflow-hidden">

      {/* MOBILE SIDEBAR TOGGLE BUTTON */}
      <div className="lg:hidden w-full bg-white p-3 rounded-lg border border-stone-200 shadow-2xs flex items-center justify-between shrink-0">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-md border border-stone-200"
        >
          <Filter className="w-4 h-4 text-indigo-700" />
          <span>{isMobileSidebarOpen ? 'Ẩn Bộ Lọc Sidebar' : 'Hiện Bộ Lọc & Chức Năng'}</span>
        </button>

        <span className="text-xs font-bold bg-indigo-100 text-indigo-950 px-2.5 py-1 rounded-full">
          {filteredMasses.length} Ngày lễ
        </span>
      </div>

      {/* LEFT SIDEBAR CONTROLS PANEL */}
      <aside className={`w-full lg:w-72 shrink-0 bg-white border border-stone-200 rounded-xl p-4 shadow-2xs space-y-4 lg:overflow-y-auto lg:max-h-full ${
        isMobileSidebarOpen ? 'block' : 'hidden lg:block'
      }`}>
        {/* Sidebar Title */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm sm:text-base">
            <Filter className="w-4.5 h-4.5 text-indigo-700" />
            <span>Bộ Lọc & Chức Năng</span>
          </div>
          <span className="text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200 px-2 py-0.5 rounded-full">
            {filteredMasses.length} Lễ
          </span>
        </div>

        {/* Quick Search */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-700 block">
            Tìm Kiếm Bài Hát / Ngày Lễ
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Nhập tên bài, tác giả..."
              className="w-full bg-stone-50 pl-8 pr-2.5 py-1.5 rounded-md border border-stone-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>
        </div>

        {/* View Mode Mode Switcher */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-700 block">
            Chế Độ Hiển Thị Bảng
          </label>
          <div className="grid grid-cols-1 gap-1">
            <button
              onClick={() => setViewMode('BANG_EXCEL')}
              className={`px-3 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
                viewMode === 'BANG_EXCEL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Bảng Ma Trận Lưới Excel</span>
            </button>

            <button
              onClick={() => setViewMode('THEO_MUA')}
              className={`px-3 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
                viewMode === 'THEO_MUA'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Theo Mùa Phụng Vụ</span>
            </button>

            <button
              onClick={() => setViewMode('THEO_THANG')}
              className={`px-3 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
                viewMode === 'THEO_THANG'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>Theo Tháng</span>
            </button>

            <button
              onClick={() => setViewMode('THEO_NAM')}
              className={`px-3 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
                viewMode === 'THEO_NAM'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Theo Năm</span>
            </button>
          </div>
        </div>

        {/* Dynamic Contextual Sub-Filters */}
        {viewMode === 'THEO_MUA' && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 block">Lọc Theo Mùa:</label>
            <select
              value={selectedSeason}
              onChange={e => setSelectedSeason(e.target.value)}
              className="w-full bg-stone-50 p-2 rounded-md border border-stone-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800"
            >
              {seasonsList.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
        )}

        {viewMode === 'THEO_THANG' && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 block">Lọc Theo Tháng:</label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full bg-stone-50 p-2 rounded-md border border-stone-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800"
            >
              {monthNames.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>
        )}

        {viewMode === 'THEO_NAM' && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 block">Lọc Theo Năm:</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full bg-stone-50 p-2 rounded-md border border-stone-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800"
            >
              <option value="ALL">Tất cả các năm</option>
              {years.map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="pt-2 border-t border-stone-200 space-y-2">
          <button
            onClick={handleAutoCreateSunday}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs p-2.5 rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1.5"
            title="Tự động tính ngày Chúa Nhật kế tiếp và tạo khung bài hát chuẩn"
          >
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>Tự Động Tạo Lễ Chúa Nhật</span>
          </button>

          <button
            onClick={() => handleOpenEditModal(null)}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs p-2.5 rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Thêm Chương Trình Lễ Mới</span>
          </button>

          <button
            onClick={handleExportMatrixExcel}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs p-2.5 rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1.5"
            title="Xuất tập tin Excel"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Xuất Tập Tin Excel Matrix</span>
          </button>
        </div>

        {/* Liturgical Colors Legend */}
        <div className="pt-2 border-t border-stone-200 text-[11px] space-y-1.5 text-stone-600">
          <div className="font-bold text-slate-900">Màu Phụng Vụ Quy Chuẩn:</div>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            <span className="flex items-center gap-1 text-emerald-900"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> Mùa Thường Niên</span>
            <span className="flex items-center gap-1 text-purple-900"><span className="w-2.5 h-2.5 rounded bg-purple-600 inline-block"></span> Mùa Vọng / Chay</span>
            <span className="flex items-center gap-1 text-amber-900"><span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block"></span> Giáng Sinh & Phục Sinh</span>
            <span className="flex items-center gap-1 text-rose-900"><span className="w-2.5 h-2.5 rounded bg-rose-600 inline-block"></span> Lễ Trọng / Tử Đạo</span>
          </div>
        </div>
      </aside>

      {/* RIGHT WORKSPACE AREA (100% WIDTH TABLE MATRIX) */}
      <main className="flex-1 flex flex-col min-w-0 w-full h-full min-h-0 overflow-hidden space-y-3">
        <MatrixScheduleView
          masses={filteredMasses}
          songs={songs}
          onSaveMass={onSaveMass}
          onDeleteMass={onDeleteMass}
          onOpenEditDetails={(m) => handleOpenEditModal(m)}
          onOpenNewMass={() => handleOpenEditModal(null)}
          onOpenPdfPrint={onOpenPdfPrint}
        />
      </main>

      {/* POPUP MODAL EDITOR FOR MASS PROGRAM */}
      {isEditModalOpen && editingMass && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full my-auto border border-stone-200 shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-indigo-700 text-white p-4 font-bold flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Edit3 className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white">
                    {editingMass.id.startsWith('m-') ? 'Thêm Chương Trình Thánh Lễ Mới' : 'Chỉnh Sửa Chương Trình Thánh Lễ'}
                  </h3>
                  <p className="text-xs text-indigo-100 font-medium">
                    Kéo thả vị trí biểu tượng tay nắm, chọn bài hát hoặc nhập bài hát mới
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs sm:text-sm">
              {/* 1. Thông tin chung */}
              <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                    1. Thông tin lễ
                  </h4>
                  <button
                    type="button"
                    onClick={handleFillStandardSundayTemplate}
                    className="text-indigo-950 font-extrabold text-xs bg-indigo-100 hover:bg-indigo-200 px-3 py-1 rounded border border-indigo-300 transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                    <span>⚡ Nạp Mẫu Lễ Chúa Nhật Chuẩn</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-stone-800 block mb-1">
                      Tên Lễ / Chúa Nhật:
                    </label>
                    <input
                      type="text"
                      value={editingMass.title || editingMass.name || ''}
                      onChange={(e) => setEditingMass({ ...editingMass, title: e.target.value, name: e.target.value })}
                      placeholder="e.g. Chúa Nhật I Mùa Vọng"
                      className="w-full bg-white p-2.5 rounded-md border border-stone-300 font-bold text-slate-900 focus:outline-none focus:border-indigo-500 text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-800 block mb-1">
                      Ngày diễn ra:
                    </label>
                    <input
                      type="date"
                      value={editingMass.date || ''}
                      onChange={(e) => setEditingMass({ ...editingMass, date: e.target.value })}
                      className="w-full bg-white p-2.5 rounded-md border border-stone-300 font-bold text-slate-900 focus:outline-none focus:border-indigo-500 text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-800 block mb-1">
                      Mùa Phụng Vụ:
                    </label>
                    <select
                      value={editingMass.liturgicalSeason || 'THUONG_NIEN'}
                      onChange={(e) => setEditingMass({ ...editingMass, liturgicalSeason: e.target.value as LiturgicalSeason, season: e.target.value as LiturgicalSeason })}
                      className="w-full bg-white p-2.5 rounded-md border border-stone-300 font-bold text-slate-900 focus:outline-none focus:border-indigo-500 text-xs sm:text-sm"
                    >
                      <option value="THUONG_NIEN">Mùa Thường Niên</option>
                      <option value="MUA_VONG">Mùa Vọng</option>
                      <option value="GIANG_SINH">Mùa Giáng Sinh</option>
                      <option value="MUA_CHAY">Mùa Chay</option>
                      <option value="PHUC_SINH">Mùa Phục Sinh</option>
                      <option value="LE_TRONG">Lễ Trọng & Đặc Biệt</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Danh sách bài hát theo vị trí */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                    2. Danh sách bài hát (Nắm kéo thả tay nắm để xếp lại thứ tự)
                  </h4>

                  <button
                    type="button"
                    onClick={handleAddProgramRow}
                    className="text-indigo-950 font-bold text-xs flex items-center gap-1 bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 rounded border border-indigo-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Thêm vị trí bài hát</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {editingMass.program.map((item, idx) => {
                    const isExpanded = expandedItemIndex === idx;
                    const dropdownState = searchDropdowns[idx] || { query: item.title || '', show: false };
                    const suggestions = songs.filter(s => matchVietnameseText(s.title, dropdownState.query));

                    return (
                      <div
                        key={item.id || idx}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(idx)}
                        className={`bg-white p-3 rounded-lg border shadow-2xs space-y-2 transition-all ${
                          draggedRowIndex === idx ? 'opacity-40 border-indigo-500 bg-indigo-50/50' : 'border-stone-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Nắm Thả Thứ Tự (Drag Handle Grip) */}
                          <div 
                            className="p-1 cursor-grab active:cursor-grabbing text-stone-400 hover:text-indigo-700 flex items-center justify-center shrink-0"
                            title="Nắm kéo thả để sắp xếp lại thứ tự"
                          >
                            <GripVertical className="w-5 h-5" />
                          </div>

                          {/* Compact Narrow Position Selector leaving plenty of room for Song Title */}
                          <div className="w-32 sm:w-36 shrink-0">
                            <select
                              value={item.position}
                              onChange={(e) => {
                                const newPos = e.target.value as MassPosition;
                                const newItems = [...editingMass.program];
                                newItems[idx] = {
                                  ...newItems[idx],
                                  position: newPos,
                                  positionLabel: getMassPositionLabel(newPos)
                                };
                                setEditingMass({ ...editingMass, program: newItems });
                              }}
                              className="bg-indigo-50 p-2 rounded font-bold text-indigo-950 text-xs sm:text-sm border border-indigo-200 w-full focus:outline-none focus:border-indigo-500"
                            >
                              <option value="NL">1. Nhập Lễ</option>
                              <option value="DC">2. Đáp Ca</option>
                              <option value="ALL">3. Alleluia</option>
                              <option value="DL">4. Dâng Lễ</option>
                              <option value="HL">5. Hiệp Lễ</option>
                              <option value="KL">6. Kết Lễ</option>
                              <option value="TK">7. Tiếp Liên</option>
                              <option value="OTHER">8. Khác</option>
                            </select>
                          </div>

                          {/* Song Title Combined Input */}
                          <div className="relative flex-1 min-w-[180px]">
                            <input
                              type="text"
                              value={item.title || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const newItems = [...editingMass.program];
                                newItems[idx] = { ...newItems[idx], title: val };
                                setEditingMass({ ...editingMass, program: newItems });

                                setSearchDropdowns({
                                  ...searchDropdowns,
                                  [idx]: { query: val, show: true }
                                });
                              }}
                              onFocus={() => {
                                // Only show dropdown if title is empty or if user actively edits
                                if (!item.title) {
                                  setSearchDropdowns({
                                    ...searchDropdowns,
                                    [idx]: { query: '', show: true }
                                  });
                                }
                              }}
                              placeholder="Gõ tên bài hát..."
                              className="w-full bg-stone-50 p-2 rounded-md border border-stone-300 font-bold text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                            />

                            {/* Autocomplete Suggestions Popup */}
                            {dropdownState.show && dropdownState.query.trim().length > 0 && suggestions.length > 0 && (
                              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-md shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-stone-100">
                                {suggestions.map(s => (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => {
                                      const newItems = [...editingMass.program];
                                      newItems[idx] = {
                                        ...newItems[idx],
                                        songId: s.id,
                                        title: s.title,
                                        composer: s.composer || newItems[idx].composer,
                                        key: s.storageCode || s.pageNumber || newItems[idx].key,
                                        pageNumber: s.storageCode || s.pageNumber || newItems[idx].pageNumber,
                                        rhythm: s.defaultRhythm || newItems[idx].rhythm
                                      };
                                      setEditingMass({ ...editingMass, program: newItems });
                                      setSearchDropdowns({
                                        ...searchDropdowns,
                                        [idx]: { query: s.title, show: false }
                                      });
                                    }}
                                    className="w-full text-left p-2 hover:bg-amber-50 flex items-center justify-between text-xs sm:text-sm"
                                  >
                                    <div>
                                      <strong className="text-slate-900 block font-bold">{s.title}</strong>
                                      <span className="text-xs text-stone-500">Tác giả: {s.composer || 'Chưa rõ'}</span>
                                    </div>
                                    <span className="text-xs font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                                      Chọn bài
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Composer / Author Input */}
                          <div className="w-28 sm:w-32">
                            <input
                              type="text"
                              value={item.composer || ''}
                              onChange={(e) => {
                                const newItems = [...editingMass.program];
                                newItems[idx] = { ...newItems[idx], composer: e.target.value };
                                setEditingMass({ ...editingMass, program: newItems });
                              }}
                              placeholder="Tác giả..."
                              className="w-full bg-stone-50 p-2 rounded-md border border-stone-200 text-xs text-slate-800 font-medium"
                            />
                          </div>

                          {/* Page Number / Storage Code Input */}
                          <div className="w-20 sm:w-24">
                            <input
                              type="text"
                              value={item.key || item.pageNumber || ''}
                              onChange={(e) => {
                                const newItems = [...editingMass.program];
                                newItems[idx] = { ...newItems[idx], key: e.target.value, pageNumber: e.target.value };
                                setEditingMass({ ...editingMass, program: newItems });
                              }}
                              placeholder="Trang sách..."
                              className="w-full bg-stone-50 p-2 rounded-md border border-stone-200 text-xs text-slate-800 font-medium"
                            />
                          </div>

                          {/* Options toggle */}
                          <button
                            type="button"
                            onClick={() => setExpandedItemIndex(isExpanded ? null : idx)}
                            className={`px-2.5 py-2 rounded text-xs font-semibold border flex items-center gap-1 ${
                              isExpanded || item.hasSolo || item.organist || item.rhythm
                                ? 'bg-amber-100 text-amber-950 border-amber-300 font-bold'
                                : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                            }`}
                            title="Tùy chọn Solo, Đàn, Điệu..."
                          >
                            <span>Tùy chọn</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Delete Row Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(idx)}
                            className="p-2 text-stone-400 hover:text-red-600 rounded transition-colors"
                            title="Xóa vị trí"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Expanded details (Solo, Organist, Rhythm) */}
                        {isExpanded && (
                          <div className="bg-stone-50 p-3 rounded-md border border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                            <div>
                              <label className="font-bold text-stone-700 block mb-1">
                                🎤 Người hát Solo / Xướng:
                              </label>
                              <input
                                type="text"
                                value={item.soloSinger || item.soloist || ''}
                                onChange={(e) => {
                                  const newItems = [...editingMass.program];
                                  newItems[idx] = { 
                                    ...newItems[idx], 
                                    hasSolo: e.target.value.trim().length > 0,
                                    soloSinger: e.target.value,
                                    soloist: e.target.value
                                  };
                                  setEditingMass({ ...editingMass, program: newItems });
                                }}
                                placeholder="Tên ca sĩ / xướng..."
                                className="w-full bg-white p-2 rounded border border-stone-300 font-medium"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-stone-700 block mb-1">
                                🎹 Người Đàn / Nhạc công:
                              </label>
                              <input
                                type="text"
                                value={item.organist || item.instrumentalist || item.accompanist || ''}
                                onChange={(e) => {
                                  const newItems = [...editingMass.program];
                                  newItems[idx] = { 
                                    ...newItems[idx], 
                                    organist: e.target.value,
                                    instrumentalist: e.target.value,
                                    accompanist: e.target.value
                                  };
                                  setEditingMass({ ...editingMass, program: newItems });
                                }}
                                placeholder="Tên người đệm đàn..."
                                className="w-full bg-white p-2 rounded border border-stone-300 font-medium"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-stone-700 block mb-1">
                                Điệu nhạc:
                              </label>
                              <input
                                type="text"
                                value={item.rhythm || ''}
                                onChange={(e) => {
                                  const newItems = [...editingMass.program];
                                  newItems[idx] = { ...newItems[idx], rhythm: e.target.value };
                                  setEditingMass({ ...editingMass, program: newItems });
                                }}
                                placeholder="Ballad, March, Chant..."
                                className="w-full bg-white p-2 rounded border border-stone-300 font-medium"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 p-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-md font-semibold text-stone-700 bg-stone-200 hover:bg-stone-300 text-xs sm:text-sm cursor-pointer"
                >
                  Hủy
                </button>

                {!editingMass.id.startsWith('m-') && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Bạn có chắc chắn muốn XÓA hoàn toàn chương trình lễ ngày ${formatDateToDDMMYYYY(editingMass.date)} không?`)) {
                        onDeleteMass(editingMass.id);
                        setIsEditModalOpen(false);
                      }
                    }}
                    className="px-3.5 py-2 rounded-md font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Xóa Lễ Này</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveEditor('DRAFT')}
                  className="px-4 py-2 rounded-md font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-xs sm:text-sm cursor-pointer"
                >
                  Lưu Bản Nháp
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveEditor('APPROVED')}
                  className="px-5 py-2 rounded-md font-extrabold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-2xs text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Chốt Lễ Này</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
