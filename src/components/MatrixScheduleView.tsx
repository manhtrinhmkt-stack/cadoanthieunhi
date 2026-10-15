import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  FileSpreadsheet, 
  Download, 
  Edit3, 
  Trash2, 
  X, 
  Check,
  BookOpen,
  User,
  Sparkles,
  Music,
  Mic,
  Volume2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { MassEvent, MassProgramItem, Song, MassPosition } from '../types/cantus';
import { matchVietnameseText, exportToExcel, formatDateToDDMMYYYY, getLiturgicalHeaderStyle } from '../utils/cantusUtils';

interface MatrixScheduleViewProps {
  masses: MassEvent[];
  songs: Song[];
  onSaveMass: (m: MassEvent, newSongsToCreate?: Song[]) => void;
  onDeleteMass: (id: string) => void;
  onOpenEditDetails: (m: MassEvent) => void;
  onOpenNewMass: () => void;
  onOpenPdfPrint: (m: MassEvent) => void;
}

export const MatrixScheduleView: React.FC<MatrixScheduleViewProps> = ({
  masses,
  songs,
  onSaveMass,
  onDeleteMass,
  onOpenEditDetails,
  onOpenNewMass,
  onOpenPdfPrint,
}) => {
  const [filterMonth, setFilterMonth] = useState<string>('ALL');
  const [filterSearch, setFilterSearch] = useState<string>('');
  
  // View density mode: compact fit to screen or comfortable expanded
  const [isCompactView, setIsCompactView] = useState<boolean>(true);

  // Editing cell state modal
  const [activeCellEdit, setActiveCellEdit] = useState<{
    massId: string;
    position?: MassPosition;
    field: 'TITLE' | 'SOLO' | 'FEAST_NAME';
    currentTitle: string;
    currentComposer: string;
    currentPage: string;
    currentSolo: string;
    currentOrganist: string;
  } | null>(null);

  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [composerInput, setComposerInput] = useState('');
  const [pageInput, setPageInput] = useState('');
  const [soloInput, setSoloInput] = useState('');
  const [organistInput, setOrganistInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeCellEdit && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [activeCellEdit]);

  // Filter masses sorted by date
  const sortedMasses = [...masses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const filteredMasses = sortedMasses.filter(m => {
    const monthMatch = filterMonth === 'ALL' || (m.date || '').substring(5, 7) === filterMonth.padStart(2, '0');
    const searchMatch = !filterSearch.trim() || 
                        matchVietnameseText(m.title || m.name || '', filterSearch) || 
                        (m.date || '').includes(filterSearch) ||
                        m.program.some(p => matchVietnameseText(p.title || '', filterSearch) || matchVietnameseText(p.composer || '', filterSearch));
    return monthMatch && searchMatch;
  });

  // Helper to get ALL program items for a specific position in a mass (Supports multiple songs per slot)
  const getItemsByPos = (m: MassEvent, pos: MassPosition): MassProgramItem[] => {
    return m.program.filter(p => p.position === pos && ((p.title && p.title.trim().length > 0) || p.soloSinger || p.soloist || p.organist || p.instrumentalist));
  };

  // Cell Click Handler
  const handleCellClick = (m: MassEvent, position: MassPosition | undefined, field: 'TITLE' | 'SOLO' | 'FEAST_NAME') => {
    let titleVal = '';
    let composerVal = '';
    let pageVal = '';
    let soloVal = '';
    let organistVal = '';

    if (field === 'FEAST_NAME') {
      titleVal = m.title || m.name || '';
    } else if (position) {
      const items = getItemsByPos(m, position);
      const item = items[0];
      titleVal = item?.title || '';
      composerVal = item?.composer || '';
      pageVal = item?.key || item?.pageNumber || '';
      soloVal = item?.soloSinger || item?.soloist || '';
      organistVal = item?.organist || item?.instrumentalist || item?.accompanist || '';

      if (titleVal) {
        const found = songs.find(s => matchVietnameseText(s.title, titleVal));
        if (found) {
          if (!composerVal && found.composer) composerVal = found.composer;
          if (!pageVal && (found.storageCode || found.pageNumber)) pageVal = found.storageCode || found.pageNumber || '';
        }
      }
    }

    setActiveCellEdit({
      massId: m.id,
      position,
      field,
      currentTitle: titleVal,
      currentComposer: composerVal,
      currentPage: pageVal,
      currentSolo: soloVal,
      currentOrganist: organistVal
    });

    setAutocompleteQuery(titleVal);
    setComposerInput(composerVal);
    setPageInput(pageVal);
    setSoloInput(soloVal);
    setOrganistInput(organistVal);
    setShowDropdown(false);
  };

  // Save Cell Edit Change
  const handleSaveCellEdit = (selectedSongFromList?: Song) => {
    if (!activeCellEdit) return;
    const { massId, position, field } = activeCellEdit;

    const targetMass = masses.find(m => m.id === massId);
    if (!targetMass) return;

    const updatedMass: MassEvent = JSON.parse(JSON.stringify(targetMass));

    const finalTitle = selectedSongFromList ? selectedSongFromList.title : autocompleteQuery.trim();
    const finalComposer = selectedSongFromList ? selectedSongFromList.composer : composerInput.trim();
    const finalPage = selectedSongFromList ? (selectedSongFromList.storageCode || selectedSongFromList.pageNumber || pageInput.trim()) : pageInput.trim();

    if (field === 'FEAST_NAME') {
      updatedMass.title = finalTitle;
      updatedMass.name = finalTitle;
    } else if (position) {
      let item = updatedMass.program.find(p => p.position === position);
      if (!item) {
        item = {
          id: 'p-' + Date.now(),
          songId: null,
          position,
          positionLabel: position === 'NL' ? 'Nhập lễ' : position === 'DC' ? 'Đáp ca' : position === 'DL' ? 'Dâng lễ' : position === 'HL' ? 'Hiệp lễ' : 'Kết lễ',
          title: '',
        };
        updatedMass.program.push(item);
      }

      item.title = finalTitle;
      item.composer = finalComposer;
      item.key = finalPage;
      item.pageNumber = finalPage;
      if (soloInput.trim()) {
        item.hasSolo = true;
        item.soloSinger = soloInput.trim();
        item.soloist = soloInput.trim();
      } else {
        item.hasSolo = false;
        item.soloSinger = '';
        item.soloist = '';
      }
      if (organistInput.trim()) {
        item.organist = organistInput.trim();
        item.instrumentalist = organistInput.trim();
      } else {
        item.organist = '';
        item.instrumentalist = '';
      }

      const matchedSong = selectedSongFromList || songs.find(s => matchVietnameseText(s.title, finalTitle));
      if (matchedSong) {
        item.songId = matchedSong.id;
        if (!item.composer) item.composer = matchedSong.composer;
        if (!item.key) item.key = matchedSong.storageCode || matchedSong.pageNumber || '';
      }
    }

    // Auto-add new song to song library if missing
    const newSongsToCreate: Song[] = [];
    if (finalTitle) {
      const exists = songs.some(s => matchVietnameseText(s.title, finalTitle));
      if (!exists) {
        newSongsToCreate.push({
          id: 'song-' + Date.now(),
          title: finalTitle,
          composer: finalComposer,
          categories: position ? [position] : [],
          defaultPosition: position || 'NL',
          storageCode: finalPage,
          pageNumber: finalPage,
          createdAt: new Date().toISOString()
        });
      }
    }

    onSaveMass(updatedMass, newSongsToCreate);
    setActiveCellEdit(null);
  };

  // Export Matrix to Excel
  const handleExportMatrixExcel = () => {
    const rows = filteredMasses.map(m => {
      const seasonLabel = getLiturgicalHeaderStyle(m.liturgicalSeason || m.season).name;
      const nlItems = getItemsByPos(m, 'NL').map(i => `${i.title} (${i.composer || ''})`).join('; ');
      const dcItems = getItemsByPos(m, 'DC').map(i => `${i.title} (${i.composer || ''}) ${i.soloSinger ? '[Solo: ' + i.soloSinger + ']' : ''}`).join('; ');
      const allItems = getItemsByPos(m, 'ALL').map(i => `${i.title} (${i.composer || ''})`).join('; ');
      const dlItems = getItemsByPos(m, 'DL').map(i => `${i.title} (${i.composer || ''})`).join('; ');
      const hlItems = getItemsByPos(m, 'HL').map(i => `${i.title} (${i.composer || ''}) ${i.soloSinger ? '[Solo: ' + i.soloSinger + ']' : ''}`).join('; ');
      const klItems = getItemsByPos(m, 'KL').map(i => `${i.title} (${i.composer || ''})`).join('; ');

      return {
        'Ngày': formatDateToDDMMYYYY(m.date),
        'Mùa Phụng Vụ': seasonLabel,
        'Ngày lễ': m.title || m.name || '',
        'Nhập lễ': nlItems,
        'Đáp ca (gồm Solo)': dcItems,
        'Alleluia / Tung hô': allItems,
        'Dâng lễ': dlItems,
        'Hiệp lễ': hlItems,
        'Kết lễ': klItems,
      };
    });

    exportToExcel(rows, `Bang_Lich_Hat_Thanh_Ca_Mat_Tran_${new Date().toISOString().substring(0, 10)}`);
  };

  const filteredSongSuggestions = songs.filter(s => 
    matchVietnameseText(s.title, autocompleteQuery) || 
    matchVietnameseText(s.composer || '', autocompleteQuery)
  ).slice(0, 6);

  // Positions defined for rows (Compact, clean Vietnamese labels)
  const rowsConfig: { pos: MassPosition; label: string; bgClass: string; textClass: string }[] = [
    { pos: 'NL', label: 'Nhập lễ', bgClass: 'bg-white', textClass: 'text-amber-950' },
    { pos: 'DC', label: 'Đáp ca', bgClass: 'bg-purple-50/30', textClass: 'text-purple-950' },
    { pos: 'ALL', label: 'Alleluia', bgClass: 'bg-white', textClass: 'text-indigo-950' },
    { pos: 'DL', label: 'Dâng lễ', bgClass: 'bg-amber-50/30', textClass: 'text-amber-950' },
    { pos: 'HL', label: 'Hiệp lễ', bgClass: 'bg-white', textClass: 'text-emerald-950' },
    { pos: 'KL', label: 'Kết lễ', bgClass: 'bg-stone-50/30', textClass: 'text-slate-900' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 space-y-2">
      
      {/* EXCEL MATRIX SPREADSHEET GRID WITH STICKY HEADERS & STICKY FIRST COLUMN */}
      <div className="flex-1 min-h-0 bg-white rounded-lg border border-stone-300 shadow-xs overflow-auto flex flex-col">
        <table className="w-full h-full border-collapse text-xs select-none">
          <thead>
            {/* Row 1: Ngày (Dates) - Sticky Top & Colored according to Liturgical Season! */}
            <tr className="bg-stone-100 text-slate-900 border-b border-stone-300">
              <th className="sticky top-0 left-0 z-40 bg-stone-200 border-r border-b border-stone-300 px-3 py-2 font-extrabold text-slate-900 text-center min-w-[100px] sm:min-w-[120px] text-xs shadow-xs">
                Ngày
              </th>
              {filteredMasses.map(m => {
                const style = getLiturgicalHeaderStyle(m.liturgicalSeason || m.season);
                return (
                  <th
                    key={m.id}
                    className={`sticky top-0 z-30 px-3 py-2 font-extrabold text-center min-w-[160px] sm:min-w-[190px] ${style.headerBg} ${style.headerHover} ${style.headerText} cursor-pointer transition-colors border-r border-b ${style.headerBorder}`}
                    onClick={() => onOpenEditDetails(m)}
                    title={`Xem / sửa / xóa toàn bộ lễ ngày ${formatDateToDDMMYYYY(m.date)}`}
                  >
                    <div className="flex items-center justify-center gap-1.5 text-xs">
                      <span className="font-extrabold tracking-tight">{formatDateToDDMMYYYY(m.date)}</span>
                      <Edit3 className="w-3 h-3 opacity-70 hover:opacity-100" />
                    </div>
                  </th>
                );
              })}
            </tr>

            {/* Row 2: Mùa & Tên lễ - Sticky Top Row 2 with 100% Opaque Solid Background */}
            <tr className="bg-white border-b border-stone-300 divide-x divide-stone-200">
              <th className="sticky top-[33px] left-0 z-40 bg-stone-200 border-r border-b border-stone-300 px-3 py-1.5 font-bold text-slate-900 text-center text-xs shadow-xs">
                Mùa & Tên lễ
              </th>
              {filteredMasses.map(m => {
                const style = getLiturgicalHeaderStyle(m.liturgicalSeason || m.season);
                return (
                  <td
                    key={m.id}
                    className={`sticky top-[33px] z-30 bg-white px-3 py-1.5 text-center hover:bg-stone-50 cursor-pointer transition-colors border-r border-b ${style.headerBorder}`}
                    onClick={() => handleCellClick(m, undefined, 'FEAST_NAME')}
                  >
                    <div className="space-y-0.5">
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border ${style.badgeBg} ${style.badgeText} ${style.badgeBorder}`}>
                        {style.name}
                      </span>
                      <div className="font-bold text-slate-900 text-xs line-clamp-1">
                        {m.title || m.name || <span className="text-stone-400 italic font-normal text-[11px]">+ Tên lễ...</span>}
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-200 text-xs">
            {/* Loop over positions: Nhập lễ, Đáp ca (with Solo included!), Alleluia, Dâng lễ, Hiệp lễ, Kết lễ */}
            {rowsConfig.map(({ pos, label, bgClass, textClass }) => (
              <tr key={pos} className={`${bgClass} hover:bg-stone-100/60 divide-x divide-stone-200 transition-colors`}>
                
                {/* Sticky Left Column for Position Label - 100% Opaque Solid Background */}
                <td className="sticky left-0 z-20 bg-stone-100 font-extrabold text-slate-900 text-center border-r border-stone-300 px-3.5 py-2.5 shadow-2xs">
                  {label}
                </td>

                {filteredMasses.map(m => {
                  const items = getItemsByPos(m, pos);
                  return (
                    <td
                      key={m.id}
                      className="px-3.5 py-2.5 sm:px-4 sm:py-3 text-center cursor-pointer hover:bg-amber-50/70 transition-colors"
                      onClick={() => handleCellClick(m, pos, 'TITLE')}
                    >
                      {items.length > 0 ? (
                        <div className="space-y-1">
                          {items.map((item, idx) => {
                            const pageStr = item.key || item.pageNumber || '';
                            const soloName = item.soloSinger || item.soloist;
                            const organistName = item.organist || item.instrumentalist || item.accompanist;

                            return (
                              <div key={item.id || idx} className="space-y-0.5 border-b border-stone-200/50 pb-1 last:border-b-0 last:pb-0">
                                <div className={`font-bold ${textClass} text-xs line-clamp-2`}>
                                  {items.length > 1 ? `${idx + 1}. ${item.title}` : item.title}
                                </div>

                                <div className="flex flex-wrap items-center justify-center gap-1 text-[10px] text-stone-600">
                                  {item.composer && <span className="font-medium text-stone-700">{item.composer}</span>}
                                  {pageStr && (
                                    <span className="bg-amber-100 text-amber-950 font-bold px-1 py-0 rounded text-[9px] border border-amber-200">
                                      Tr. {pageStr}
                                    </span>
                                  )}
                                </div>

                                {/* Solo & Organist info directly inside slot */}
                                {(soloName || organistName) && (
                                  <div className="flex flex-wrap items-center justify-center gap-1 pt-0.5">
                                    {soloName && (
                                      <span className="bg-purple-100 text-purple-950 font-bold px-1.5 py-0.2 rounded text-[9px] border border-purple-200">
                                        🎤 Solo: {soloName}
                                      </span>
                                    )}
                                    {organistName && (
                                      <span className="bg-sky-50 text-sky-950 font-medium px-1.5 py-0.2 rounded text-[9px] border border-sky-200">
                                        🎹 Đàn: {organistName}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-stone-400 font-normal italic text-[11px] hover:text-stone-600">+ Thêm</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* QUICK EDIT CELL MODAL */}
      {activeCellEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-4 py-3 font-extrabold text-sm flex items-center justify-between border-b border-slate-800">
              <span className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Chỉnh Sửa Nhanh Ô Bảng</span>
              </span>
              <button 
                onClick={() => setActiveCellEdit(null)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {activeCellEdit.field === 'FEAST_NAME' ? (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Tên Thánh Lễ / Lễ Trọng
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={autocompleteQuery}
                    onChange={e => setAutocompleteQuery(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-md focus:ring-2 focus:ring-slate-900 font-medium"
                    placeholder="VD: Chúa Nhật I Mùa Vọng..."
                  />
                </div>
              ) : (
                <>
                  {/* Song Title Autocomplete */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Tên Bài Hát
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      value={autocompleteQuery}
                      onChange={e => {
                        setAutocompleteQuery(e.target.value);
                        setShowDropdown(true);
                      }}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-md focus:ring-2 focus:ring-slate-900 font-bold text-slate-900"
                      placeholder="Nhập hoặc tìm bài hát trong kho..."
                    />

                    {/* Dropdown Suggestions */}
                    {showDropdown && autocompleteQuery.trim() && filteredSongSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-300 rounded-md shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-stone-100">
                        {filteredSongSuggestions.map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setAutocompleteQuery(s.title);
                              setComposerInput(s.composer || '');
                              setPageInput(s.storageCode || s.pageNumber || '');
                              setShowDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-indigo-50 transition-colors flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-extrabold text-slate-900">{s.title}</div>
                              <div className="text-[11px] text-stone-500">{s.composer}</div>
                            </div>
                            {(s.storageCode || s.pageNumber) && (
                              <span className="text-[10px] bg-indigo-100 text-indigo-900 px-1.5 py-0.5 rounded font-bold">
                                Tr. {s.storageCode || s.pageNumber}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Composer & Page */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Tác Giả
                      </label>
                      <input
                        type="text"
                        value={composerInput}
                        onChange={e => setComposerInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        placeholder="Tác giả..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Số Trang Sách
                      </label>
                      <input
                        type="text"
                        value={pageInput}
                        onChange={e => setPageInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        placeholder="VD: 125, A-04..."
                      />
                    </div>
                  </div>

                  {/* Solo & Organist Input */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        🎤 Người hát Solo
                      </label>
                      <input
                        type="text"
                        value={soloInput}
                        onChange={e => setSoloInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-md focus:ring-2 focus:ring-purple-500 font-semibold"
                        placeholder="Tên ca sĩ / xướng..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        🎹 Người đệm Đàn
                      </label>
                      <input
                        type="text"
                        value={organistInput}
                        onChange={e => setOrganistInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-md focus:ring-2 focus:ring-sky-500 font-semibold"
                        placeholder="Tên nhạc công..."
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Actions */}
            <div className="bg-stone-50 px-4 py-3 border-t border-stone-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveCellEdit(null)}
                className="px-3 py-1.5 rounded-md border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-100"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={() => handleSaveCellEdit()}
                className="px-4 py-1.5 rounded-md bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs shadow-2xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Lưu Thay Đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
