import React, { useState, useEffect } from 'react';
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
  ChevronUp,
  AlertTriangle,
  BookOpen,
  GripVertical,
  Sparkles,
  Zap,
  Filter,
  Layers,
  FileSpreadsheet,
  Download,
  LayoutGrid,
  CheckCircle2,
  Clock,
  Mic,
  Volume2
} from 'lucide-react';
import { MassEvent, MassProgramItem, Song, LiturgicalSeason, ProgramStatus, MassPosition } from '../types/cantus';
import { 
  getMassPositionLabel, 
  getMassPositionBadgeColor,
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
  // Responsive Display Mode: CARDS (Mobile-First Day Cards) vs MATRIX (Desktop Excel Grid)
  const [displayMode, setDisplayMode] = useState<'CARDS' | 'MATRIX'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return 'CARDS';
    }
    return 'MATRIX';
  });

  // Filter View mode: 'THEO_MUA' | 'THEO_THANG' | 'THEO_NAM' | 'ALL'
  const [viewMode, setViewMode] = useState<'THEO_MUA' | 'THEO_THANG' | 'THEO_NAM' | 'ALL'>('ALL');

  // Sub-filters
  const [selectedSeason, setSelectedSeason] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const currentYearStr = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [filterSearch, setFilterSearch] = useState<string>('');

  // Mobile Sidebar Drawer Toggle
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modal Editor state
  const [editingMass, setEditingMass] = useState<MassEvent | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmingDeleteInModal, setIsConfirmingDeleteInModal] = useState(false);

  // Drag and drop state for row reordering
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);

  // Inline delete confirm state for Day Card (nút xóa nằm trong ngày, ko nằm ở bảng)
  const [cardDeleteConfirmId, setCardDeleteConfirmId] = useState<string | null>(null);

  // Duplicate Modal state
  const [duplicateModalSource, setDuplicateModalSource] = useState<MassEvent | null>(null);
  const [duplicateNewDate, setDuplicateNewDate] = useState<string>('');
  const [duplicateNewTitle, setDuplicateNewTitle] = useState<string>('');

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
    setIsConfirmingDeleteInModal(false);
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
    setIsConfirmingDeleteInModal(false);
    setExpandedItemIndex(null);
    setSearchDropdowns({});
    setIsEditModalOpen(true);
  };

  // Open Duplicate Modal for a specific Day
  const handleOpenDuplicate = (m: MassEvent) => {
    setDuplicateModalSource(m);
    // Suggest 7 days later
    try {
      const d = new Date(m.date);
      d.setDate(d.getDate() + 7);
      setDuplicateNewDate(d.toISOString().substring(0, 10));
    } catch {
      setDuplicateNewDate(new Date().toISOString().substring(0, 10));
    }
    setDuplicateNewTitle(`${m.title || m.name || 'Thánh lễ'} (Bản sao)`);
  };

  const handleConfirmDuplicate = () => {
    if (!duplicateModalSource || !duplicateNewDate) return;
    onDuplicateMass({
      ...duplicateModalSource,
      title: duplicateNewTitle || duplicateModalSource.title
    }, duplicateNewDate);
    setDuplicateModalSource(null);
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

  // Reorder logic for desktop drag & drop
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

  // Touch & Mobile-Friendly Row Reorder (Up / Down)
  const handleMoveRowUp = (idx: number) => {
    if (!editingMass || idx <= 0) return;
    const updated = [...editingMass.program];
    const temp = updated[idx - 1];
    updated[idx - 1] = updated[idx];
    updated[idx] = temp;
    setEditingMass({ ...editingMass, program: updated });
  };

  const handleMoveRowDown = (idx: number) => {
    if (!editingMass || idx >= editingMass.program.length - 1) return;
    const updated = [...editingMass.program];
    const temp = updated[idx + 1];
    updated[idx + 1] = updated[idx];
    updated[idx] = temp;
    setEditingMass({ ...editingMass, program: updated });
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
    { key: 'ALL', label: 'Tất cả các tháng' },
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

  // Helper format day of week
  const formatDayOfWeek = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = d.getDay();
      const days = ['Chúa Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      return days[day] || '';
    } catch {
      return '';
    }
  };

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
    <div className="flex-1 flex flex-col lg:flex-row gap-3.5 items-stretch min-h-0 md:h-full md:overflow-hidden">

      {/* TOP RESPONSIVE CONTROL BAR (MOBILE & DESKTOP) */}
      <div className="lg:hidden w-full bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs space-y-2 shrink-0">
        
        {/* Toggle Mode: CARDS vs MATRIX */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg border border-stone-200">
          <button
            onClick={() => setDisplayMode('CARDS')}
            className={`flex-1 min-h-[38px] flex items-center justify-center gap-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              displayMode === 'CARDS'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-stone-700 hover:text-slate-900 hover:bg-stone-200/60'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-amber-400" />
            <span>📱 Thẻ Ngày Lễ</span>
          </button>

          <button
            onClick={() => setDisplayMode('MATRIX')}
            className={`flex-1 min-h-[38px] flex items-center justify-center gap-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              displayMode === 'MATRIX'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-stone-700 hover:text-slate-900 hover:bg-stone-200/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>📊 Bảng Ma Trận</span>
          </button>
        </div>

        {/* Quick Actions Row */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="flex-1 min-h-[36px] flex items-center justify-center gap-1.5 text-stone-800 font-bold text-xs bg-stone-50 hover:bg-stone-100 px-2.5 py-1.5 rounded-lg border border-stone-200 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-indigo-700" />
            <span>{isMobileSidebarOpen ? 'Ẩn Bộ Lọc' : 'Bộ Lọc & Tìm'}</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-900 px-1.5 py-0.2 rounded-full font-extrabold ml-0.5">
              {filteredMasses.length}
            </span>
          </button>

          <button
            onClick={handleAutoCreateSunday}
            className="flex-1 min-h-[36px] flex items-center justify-center gap-1 text-white font-bold text-xs bg-emerald-700 hover:bg-emerald-800 px-2.5 py-1.5 rounded-lg shadow-2xs cursor-pointer"
            title="Tự động tạo Chúa Nhật kế tiếp"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>+ Tạo Chúa Nhật</span>
          </button>

          <button
            onClick={() => handleOpenEditModal(null)}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-2xs cursor-pointer"
            title="Thêm lễ mới"
          >
            <Plus className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* LEFT SIDEBAR CONTROLS PANEL */}
      <aside className={`w-full lg:w-72 shrink-0 bg-white border border-stone-200 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3.5 lg:overflow-y-auto lg:max-h-full ${
        isMobileSidebarOpen ? 'block' : 'hidden lg:block'
      }`}>
        {/* Sidebar Title */}
        <div className="flex items-center justify-between pb-2.5 border-b border-stone-200">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
            <Filter className="w-4 h-4 text-indigo-700" />
            <span>Bộ Lọc & Chức Năng</span>
          </div>
          <span className="text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200 px-2 py-0.5 rounded-full">
            {filteredMasses.length} Ngày lễ
          </span>
        </div>

        {/* Display Mode Toggle for Desktop */}
        <div className="hidden lg:block space-y-1.5">
          <label className="text-xs font-bold text-stone-700 block">
            Chế Độ Xem:
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setDisplayMode('CARDS')}
              className={`p-2 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                displayMode === 'CARDS'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
              <span>Thẻ Ngày Lễ</span>
            </button>

            <button
              onClick={() => setDisplayMode('MATRIX')}
              className={`p-2 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                displayMode === 'MATRIX'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ma Trận Excel</span>
            </button>
          </div>
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
              placeholder="Tên bài hát, nhạc sĩ, ngày lễ..."
              className="w-full bg-stone-50 pl-8 pr-2.5 py-2 rounded-md border border-stone-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>
        </div>

        {/* Filter Selection Modes */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-700 block">
            Lọc Theo Danh Mục:
          </label>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <button
              onClick={() => setViewMode('ALL')}
              className={`px-2 py-1.5 rounded-md font-bold transition-all text-center cursor-pointer ${
                viewMode === 'ALL'
                  ? 'bg-indigo-700 text-white'
                  : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
              }`}
            >
              Tất Cả
            </button>
            <button
              onClick={() => setViewMode('THEO_MUA')}
              className={`px-2 py-1.5 rounded-md font-bold transition-all text-center cursor-pointer ${
                viewMode === 'THEO_MUA'
                  ? 'bg-indigo-700 text-white'
                  : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
              }`}
            >
              Theo Mùa
            </button>
            <button
              onClick={() => setViewMode('THEO_THANG')}
              className={`px-2 py-1.5 rounded-md font-bold transition-all text-center cursor-pointer ${
                viewMode === 'THEO_THANG'
                  ? 'bg-indigo-700 text-white'
                  : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
              }`}
            >
              Theo Tháng
            </button>
            <button
              onClick={() => setViewMode('THEO_NAM')}
              className={`px-2 py-1.5 rounded-md font-bold transition-all text-center cursor-pointer ${
                viewMode === 'THEO_NAM'
                  ? 'bg-indigo-700 text-white'
                  : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
              }`}
            >
              Theo Năm
            </button>
          </div>
        </div>

        {/* Contextual Sub-Filters */}
        {viewMode === 'THEO_MUA' && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 block">Chọn Mùa Phụng Vụ:</label>
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
            <label className="text-xs font-bold text-stone-700 block">Chọn Tháng:</label>
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
            <label className="text-xs font-bold text-stone-700 block">Chọn Năm:</label>
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
            className="w-full min-h-[40px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs p-2.5 rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="Tự động tính ngày Chúa Nhật kế tiếp và tạo khung bài hát chuẩn"
          >
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>Tự Động Tạo Lễ Chúa Nhật</span>
          </button>

          <button
            onClick={() => handleOpenEditModal(null)}
            className="w-full min-h-[40px] bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs p-2.5 rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Thêm Chương Trình Lễ Mới</span>
          </button>

          <button
            onClick={handleExportMatrixExcel}
            className="w-full min-h-[38px] bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs p-2 rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="Xuất tập tin Excel"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Xuất Tập Tin Excel Matrix</span>
          </button>
        </div>

        {/* Liturgical Colors Legend */}
        <div className="pt-2 border-t border-stone-200 text-[11px] space-y-1.5 text-stone-600">
          <div className="font-bold text-slate-900">Màu Phụng Vụ:</div>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            <span className="flex items-center gap-1 text-emerald-900"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> Mùa Thường Niên</span>
            <span className="flex items-center gap-1 text-purple-900"><span className="w-2.5 h-2.5 rounded bg-purple-600 inline-block"></span> Mùa Vọng / Chay</span>
            <span className="flex items-center gap-1 text-amber-900"><span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block"></span> Giáng Sinh & Phục Sinh</span>
            <span className="flex items-center gap-1 text-rose-900"><span className="w-2.5 h-2.5 rounded bg-rose-600 inline-block"></span> Lễ Trọng</span>
          </div>
        </div>
      </aside>

      {/* MAIN WORKSPACE CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 w-full min-h-0 md:h-full md:overflow-hidden">
        
        {/* VIEW 1: DAY CARDS VIEW (OPTIMIZED FOR MOBILE PHONES & EASY DAY MANAGEMENT) */}
        {displayMode === 'CARDS' && (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-0.5">
            {/* Header info bar */}
            <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs flex items-center justify-between gap-2 text-xs font-semibold text-stone-700">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-indigo-700" />
                <span>Hiển thị <strong>{filteredMasses.length}</strong> ngày lễ theo dạng Thẻ</span>
              </div>

              <button
                onClick={() => setDisplayMode('MATRIX')}
                className="text-indigo-900 font-bold hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <span>Xem dạng bảng lưới</span>
                <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
              </button>
            </div>

            {/* List of Day Cards */}
            {filteredMasses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {filteredMasses.map(m => {
                  const style = getLiturgicalHeaderStyle(m.liturgicalSeason || m.season);
                  const isApproved = m.status === 'APPROVED' || m.status === 'USED';
                  const isConfirmingDeleteThisCard = cardDeleteConfirmId === m.id;

                  return (
                    <div 
                      key={m.id}
                      className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden flex flex-col hover:border-indigo-300 transition-all"
                    >
                      {/* Top Liturgical Color Band Header */}
                      <div className={`p-3 border-b ${style.headerBg} ${style.headerText} ${style.headerBorder} flex items-start justify-between gap-2`}>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold opacity-90">
                              {formatDayOfWeek(m.date)}
                            </span>
                            <span className="text-sm font-extrabold tracking-tight">
                              {formatDateToDDMMYYYY(m.date)}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${style.badgeBg} ${style.badgeText} ${style.badgeBorder}`}>
                              {style.name}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-sm sm:text-base mt-0.5 line-clamp-1">
                            {m.title || m.name || 'Thánh Lễ'}
                          </h3>
                        </div>

                        {/* Status badge */}
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                          isApproved 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {isApproved ? 'Đã Chốt' : 'Bản Nháp'}
                        </span>
                      </div>

                      {/* Song Items List for this Day */}
                      <div className="p-3 flex-1 space-y-2 text-xs divide-y divide-stone-100">
                        {m.program && m.program.length > 0 ? (
                          m.program.map((item, idx) => {
                            const pos = item.position;
                            const badgeColor = getMassPositionBadgeColor(pos);
                            const pageStr = item.key || item.pageNumber;
                            const soloName = item.soloSinger || item.soloist;
                            const organistName = item.organist || item.instrumentalist || item.accompanist;

                            return (
                              <div key={item.id || idx} className="pt-2 first:pt-0 space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                                      {item.positionLabel || getMassPositionLabel(pos)}
                                    </span>
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-900 line-clamp-1">
                                      {item.title || <span className="text-stone-400 italic font-normal">Chưa chọn bài</span>}
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px] text-stone-500 font-medium">
                                      {item.composer && <span>{item.composer}</span>}
                                      {pageStr && (
                                        <span className="bg-amber-100 text-amber-950 px-1 py-0 rounded text-[9px] font-bold">
                                          Tr. {pageStr}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Solo / Organist info badge */}
                                {(soloName || organistName) && (
                                  <div className="flex flex-wrap items-center gap-1.5 pl-6 text-[10px]">
                                    {soloName && (
                                      <span className="bg-purple-100 text-purple-950 font-bold px-1.5 py-0.2 rounded border border-purple-200 flex items-center gap-1">
                                        <Mic className="w-2.5 h-2.5 text-purple-700" />
                                        <span>Solo: {soloName}</span>
                                      </span>
                                    )}
                                    {organistName && (
                                      <span className="bg-sky-50 text-sky-950 font-medium px-1.5 py-0.2 rounded border border-sky-200 flex items-center gap-1">
                                        <Volume2 className="w-2.5 h-2.5 text-sky-700" />
                                        <span>Đàn: {organistName}</span>
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="py-4 text-center text-stone-400 italic text-xs">
                            Chưa có bài hát nào trong ngày lễ này.
                          </div>
                        )}
                      </div>

                      {/* Day Action Buttons (Nút xóa nằm ngay trong ngày lễ, ko nằm ở bảng!) */}
                      <div className="p-2.5 bg-stone-50 border-t border-stone-200">
                        {isConfirmingDeleteThisCard ? (
                          <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-300 space-y-2 animate-in fade-in duration-150">
                            <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>Xác nhận xóa ngày lễ {formatDateToDDMMYYYY(m.date)}?</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  onDeleteMass(m.id);
                                  setCardDeleteConfirmId(null);
                                }}
                                className="flex-1 min-h-[34px] bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-md shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Xác Nhận Xóa</span>
                              </button>
                              <button
                                onClick={() => setCardDeleteConfirmId(null)}
                                className="min-h-[34px] px-3 bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold text-xs rounded-md cursor-pointer"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-1.5">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEditModal(m)}
                              className="flex-1 min-h-[36px] bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-lg px-2.5 py-1.5 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                              <span>Sửa Chương Trình</span>
                            </button>

                            {/* Print / PDF Button */}
                            <button
                              onClick={() => onOpenPdfPrint(m)}
                              className="min-h-[36px] min-w-[36px] bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg flex items-center justify-center cursor-pointer transition-all"
                              title="Xem & In PDF"
                            >
                              <Printer className="w-4 h-4 text-stone-700" />
                            </button>

                            {/* Duplicate Button */}
                            <button
                              onClick={() => handleOpenDuplicate(m)}
                              className="min-h-[36px] min-w-[36px] bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg flex items-center justify-center cursor-pointer transition-all"
                              title="Nhân bản sang Chúa Nhật kế"
                            >
                              <Copy className="w-4 h-4 text-stone-700" />
                            </button>

                            {/* NÚT XÓA NẰM TRONG NGÀY (Theo đúng yêu cầu của người dùng) */}
                            <button
                              onClick={() => setCardDeleteConfirmId(m.id)}
                              className="min-h-[36px] min-w-[36px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg flex items-center justify-center cursor-pointer transition-all"
                              title="Xóa ngày lễ này"
                            >
                              <Trash2 className="w-4 h-4 text-rose-600" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 border border-stone-200 text-center space-y-3">
                <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-sm">Không tìm thấy ngày lễ nào</h4>
                  <p className="text-xs text-stone-500">Thử thay đổi từ khóa tìm kiếm hoặc chọn mùa/tháng khác.</p>
                </div>
                <button
                  onClick={handleAutoCreateSunday}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Tự động tạo Chúa Nhật kế tiếp</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: EXCEL MATRIX VIEW (MA TRẬN LƯỚI NGANG) */}
        {displayMode === 'MATRIX' && (
          <div className="flex-1 flex flex-col min-w-0 w-full min-h-0 md:h-full md:overflow-hidden">
            <MatrixScheduleView
              masses={filteredMasses}
              songs={songs}
              onSaveMass={onSaveMass}
              onDeleteMass={onDeleteMass}
              onOpenEditDetails={(m) => handleOpenEditModal(m)}
              onOpenNewMass={() => handleOpenEditModal(null)}
              onOpenPdfPrint={onOpenPdfPrint}
            />
          </div>
        )}

      </main>

      {/* POPUP MODAL EDITOR FOR MASS PROGRAM */}
      {isEditModalOpen && editingMass && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-4xl w-full my-auto border border-stone-200 shadow-2xl flex flex-col max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-indigo-700 text-white p-3.5 sm:p-4 font-bold flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Edit3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    {editingMass.id.startsWith('m-') ? 'Thêm Chương Trình Thánh Lễ Mới' : 'Chỉnh Sửa Chương Trình Thánh Lễ'}
                  </h3>
                  <p className="text-[11px] text-indigo-100 font-medium hidden sm:block">
                    Dùng nút ▲ ▼ để sắp xếp thứ tự, chọn bài hát hoặc nhập bài hát mới
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3.5 sm:p-5 overflow-y-auto space-y-4 sm:space-y-5 text-xs sm:text-sm">
              {/* 1. General Info */}
              <div className="bg-stone-50 p-3 sm:p-4 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                    1. Thông tin lễ
                  </h4>
                  <button
                    type="button"
                    onClick={handleFillStandardSundayTemplate}
                    className="text-indigo-950 font-extrabold text-xs bg-indigo-100 hover:bg-indigo-200 px-2.5 py-1 rounded-md border border-indigo-300 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                    <span>Nạp Khung Chúa Nhật Chuẩn</span>
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

              {/* 2. Program song items list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                    2. Danh sách bài hát (Bấm ▲ ▼ để đổi thứ tự trên di động)
                  </h4>

                  <button
                    type="button"
                    onClick={handleAddProgramRow}
                    className="text-indigo-950 font-bold text-xs flex items-center gap-1 bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Thêm vị trí bài hát</span>
                  </button>
                </div>

                <div className="space-y-2.5">
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
                        className={`bg-white p-2.5 sm:p-3 rounded-lg border shadow-2xs space-y-2 transition-all ${
                          draggedRowIndex === idx ? 'opacity-40 border-indigo-500 bg-indigo-50/50' : 'border-stone-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Desktop Drag Handle & Mobile Up/Down Reorder Buttons */}
                          <div className="flex items-center gap-0.5 shrink-0">
                            {/* Grip handle for desktop */}
                            <div 
                              className="hidden sm:flex p-1 cursor-grab active:cursor-grabbing text-stone-400 hover:text-indigo-700 items-center justify-center"
                              title="Nắm kéo thả để sắp xếp lại thứ tự"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>

                            {/* Mobile Touch Reorder Buttons */}
                            <div className="flex items-center bg-stone-100 rounded border border-stone-200">
                              <button
                                type="button"
                                onClick={() => handleMoveRowUp(idx)}
                                disabled={idx === 0}
                                className="p-1 text-stone-600 hover:text-indigo-700 disabled:opacity-20 cursor-pointer"
                                title="Chuyển lên trên"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveRowDown(idx)}
                                disabled={idx === editingMass.program.length - 1}
                                className="p-1 text-stone-600 hover:text-indigo-700 disabled:opacity-20 cursor-pointer"
                                title="Chuyển xuống dưới"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Position Selector */}
                          <div className="w-28 sm:w-36 shrink-0">
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

                          {/* Song Title Input with Autocomplete */}
                          <div className="relative flex-1 min-w-[150px]">
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
                                    className="w-full text-left p-2 hover:bg-amber-50 flex items-center justify-between text-xs sm:text-sm cursor-pointer"
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

                          {/* Composer Input */}
                          <div className="w-24 sm:w-32">
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

                          {/* Page Number */}
                          <div className="w-18 sm:w-24">
                            <input
                              type="text"
                              value={item.key || item.pageNumber || ''}
                              onChange={(e) => {
                                const newItems = [...editingMass.program];
                                newItems[idx] = { ...newItems[idx], key: e.target.value, pageNumber: e.target.value };
                                setEditingMass({ ...editingMass, program: newItems });
                              }}
                              placeholder="Trang..."
                              className="w-full bg-stone-50 p-2 rounded-md border border-stone-200 text-xs text-slate-800 font-medium"
                            />
                          </div>

                          {/* Options toggle */}
                          <button
                            type="button"
                            onClick={() => setExpandedItemIndex(isExpanded ? null : idx)}
                            className={`px-2 py-2 rounded text-xs font-semibold border flex items-center gap-1 cursor-pointer ${
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
                            className="p-2 text-stone-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                            title="Xóa vị trí này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Expanded details (Solo, Organist, Rhythm) */}
                        {isExpanded && (
                          <div className="bg-stone-50 p-3 rounded-md border border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
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

            {/* Modal Footer with Safe Inline Delete Confirmation */}
            <div className="bg-stone-50 p-3 sm:p-4 border-t border-stone-200 shrink-0">
              {isConfirmingDeleteInModal ? (
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-300 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-xs sm:text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Bạn có chắc chắn muốn XÓA VĨNH VIỄN chương trình ngày {formatDateToDDMMYYYY(editingMass.date)}?</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteMass(editingMass.id);
                        setIsConfirmingDeleteInModal(false);
                        setIsEditModalOpen(false);
                      }}
                      className="min-h-[36px] px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-2xs cursor-pointer"
                    >
                      Xác Nhận Xóa
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDeleteInModal(false)}
                      className="min-h-[36px] px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold text-xs rounded-lg cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="min-h-[38px] px-3.5 py-2 rounded-lg font-semibold text-stone-700 bg-stone-200 hover:bg-stone-300 text-xs sm:text-sm cursor-pointer"
                    >
                      Đóng
                    </button>

                    {!editingMass.id.startsWith('m-') && (
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDeleteInModal(true)}
                        className="min-h-[38px] px-3 py-2 rounded-lg font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
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
                      className="min-h-[38px] px-3.5 py-2 rounded-lg font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-xs sm:text-sm cursor-pointer"
                    >
                      Lưu Bản Nháp
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveEditor('APPROVED')}
                      className="min-h-[38px] px-4.5 py-2 rounded-lg font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-2xs text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Chốt Lễ Này</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL DUPLICATE MASS */}
      {duplicateModalSource && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-indigo-700" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Sao Chép Chương Trình Lễ
                </h3>
              </div>
              <button
                onClick={() => setDuplicateModalSource(null)}
                className="p-1 hover:bg-stone-100 rounded-lg text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Sao chép toàn bộ danh mục bài hát từ lễ ngày <strong>{formatDateToDDMMYYYY(duplicateModalSource.date)}</strong> sang một ngày lễ mới:
            </p>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="font-bold text-stone-800 block mb-1">Tên Thánh Lễ Mới:</label>
                <input
                  type="text"
                  value={duplicateNewTitle}
                  onChange={e => setDuplicateNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">Ngày diễn ra mới:</label>
                <input
                  type="date"
                  value={duplicateNewDate}
                  onChange={e => setDuplicateNewDate(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setDuplicateModalSource(null)}
                className="px-3.5 py-2 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold text-xs cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleConfirmDuplicate}
                className="px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao Chép Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
