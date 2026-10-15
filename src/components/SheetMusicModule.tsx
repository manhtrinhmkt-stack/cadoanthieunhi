import React, { useState } from 'react';
import { 
  FolderArchive, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  AlertTriangle 
} from 'lucide-react';
import { SheetArchive, Song, MassPosition } from '../types/cantus';
import { generateStorageCode, matchVietnameseText, formatDateToDDMMYYYY } from '../utils/cantusUtils';

interface SheetMusicModuleProps {
  sheets: SheetArchive[];
  songs: Song[];
  onSaveSheet: (sheet: SheetArchive, newSongToCreate?: Song) => void;
  onDeleteSheet: (id: string) => void;
}

export const SheetMusicModule: React.FC<SheetMusicModuleProps> = ({
  sheets,
  songs,
  onSaveSheet,
  onDeleteSheet,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSheet, setEditingSheet] = useState<SheetArchive | null>(null);

  const [deleteConfirmSheet, setDeleteConfirmSheet] = useState<SheetArchive | null>(null);

  // Form states for combined input
  const [songInputQuery, setSongInputQuery] = useState('');
  const [showSongDropdown, setShowSongDropdown] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);

  const [composerInput, setComposerInput] = useState('');
  const [storageCodeInput, setStorageCodeInput] = useState('');
  const [printDateInput, setPrintDateInput] = useState(new Date().toISOString().substring(0, 10));
  const [quantityInput, setQuantityInput] = useState(30);
  const [locationInput, setLocationInput] = useState('Tủ A - Ngăn 01');
  const [noteInput, setNoteInput] = useState('');

  const [codeWarning, setCodeWarning] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Autocomplete suggestions
  const songSuggestions = songs.filter(s => 
    matchVietnameseText(s.title, songInputQuery) || matchVietnameseText(s.composer, songInputQuery)
  );

  // Filter sheets
  const filteredSheets = sheets.filter(s => 
    matchVietnameseText(s.songTitle, searchQuery) ||
    matchVietnameseText(s.composer, searchQuery) ||
    matchVietnameseText(s.storageCode, searchQuery) ||
    matchVietnameseText(s.location, searchQuery)
  );

  const handleOpenAdd = () => {
    setEditingSheet(null);
    setSongInputQuery('');
    setSelectedSongId(null);
    setComposerInput('');
    const existingCodes = sheets.map(s => s.storageCode);
    setStorageCodeInput(generateStorageCode('HL', existingCodes));
    setPrintDateInput(new Date().toISOString().substring(0, 10));
    setQuantityInput(30);
    setLocationInput('Tủ A - Ngăn 01');
    setNoteInput('');
    setCodeWarning('');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleCheckStorageCode = (code: string) => {
    setStorageCodeInput(code);
    const existing = sheets.find(s => s.storageCode.toLowerCase().trim() === code.toLowerCase().trim() && s.id !== editingSheet?.id);
    if (existing) {
      setCodeWarning(`Mã '${code}' hiện đang dùng cho bài '${existing.songTitle}'. Bạn vẫn có thể lưu nếu đây là tập/bản in bổ sung.`);
    } else {
      setCodeWarning('');
    }
  };

  const handleSaveSheetForm = () => {
    setFormError(null);
    if (!songInputQuery.trim()) {
      setFormError('Vui lòng nhập tên bài hát.');
      return;
    }
    if (!storageCodeInput.trim()) {
      setFormError('Vui lòng nhập mã lưu trữ bản in (e.g. NL-001, HL-025).');
      return;
    }

    let newSongToCreate: Song | undefined = undefined;
    let finalSongId = selectedSongId;

    if (!finalSongId) {
      const existing = songs.find(s => matchVietnameseText(s.title, songInputQuery));
      if (existing) {
        finalSongId = existing.id;
      } else {
        const createdSong: Song = {
          id: 's-' + Date.now(),
          title: songInputQuery.trim(),
          composer: composerInput.trim() || 'Chưa rõ',
          categories: ['HL'],
          defaultPosition: 'HL',
          storageCode: storageCodeInput.trim(),
          createdAt: new Date().toISOString()
        };
        newSongToCreate = createdSong;
        finalSongId = createdSong.id;
      }
    }

    const sheet: SheetArchive = {
      id: editingSheet ? editingSheet.id : 'a-' + Date.now(),
      songId: finalSongId || '',
      songTitle: songInputQuery.trim(),
      composer: composerInput.trim() || 'Chưa rõ',
      storageCode: storageCodeInput.trim(),
      printDate: printDateInput || new Date().toISOString().substring(0, 10),
      quantity: Number(quantityInput) || 1,
      currentQty: Number(quantityInput) || 1,
      currentQuantity: Number(quantityInput) || 1,
      location: locationInput.trim() || 'Tủ A - Ngăn 01',
      note: noteInput.trim() || '',
      createdAt: editingSheet?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveSheet(sheet, newSongToCreate);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FolderArchive className="w-5 h-5 text-slate-800" />
              <span>Kho Bản Nhạc In Giấy ({sheets.length} đầu tài liệu)</span>
            </h2>
            <p className="text-xs text-stone-500 font-medium mt-0.5">Lưu trữ các bản in giấy, mã lưu trữ vật lý (`NL-001`, `HL-025`) & vị trí ngăn tủ.</p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-4.5 py-2.5 rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>+ Thêm bản nhạc in mới</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên bài hát, nhạc sĩ, mã lưu trữ (HL-025)..."
            className="w-full bg-stone-50 pl-9 pr-3 py-2 rounded-md border border-stone-200 text-slate-900 font-medium text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Mobile Card List View (Phones & Tablets) */}
      <div className="md:hidden space-y-2.5">
        {filteredSheets.map(s => (
          <div key={s.id} className="bg-white rounded-xl p-3 border border-stone-200 shadow-2xs space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5 flex-1 min-w-0">
                <span className="bg-indigo-50 text-indigo-950 px-2 py-0.5 rounded-md border border-indigo-200 font-mono font-bold text-xs inline-block">
                  {s.storageCode}
                </span>
                <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{s.songTitle}</h4>
                <p className="text-xs text-stone-500 font-normal">{s.composer}</p>
              </div>

              <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-xs shrink-0">
                {s.quantity || s.currentQty} bản
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-600 pt-1 border-t border-stone-100">
              <div>Vị trí: <strong className="text-slate-900">{s.location}</strong></div>
              <div className="text-right">Ngày in: <strong>{formatDateToDDMMYYYY(s.printDate)}</strong></div>
            </div>

            {s.note && (
              <p className="text-[11px] text-stone-500 italic bg-stone-50 p-1.5 rounded">
                Ghi chú: {s.note}
              </p>
            )}

            <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-stone-100">
              <button
                onClick={() => {
                  setEditingSheet(s);
                  setSongInputQuery(s.songTitle);
                  setSelectedSongId(s.songId || null);
                  setComposerInput(s.composer);
                  setStorageCodeInput(s.storageCode);
                  setPrintDateInput(s.printDate || new Date().toISOString().substring(0, 10));
                  setQuantityInput(s.quantity || 30);
                  setLocationInput(s.location);
                  setNoteInput(s.note || '');
                  setCodeWarning('');
                  setFormError(null);
                  setShowAddModal(true);
                }}
                className="min-h-[34px] px-3 bg-stone-100 hover:bg-stone-200 text-slate-900 font-bold text-xs rounded-md flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-700" />
                <span>Sửa</span>
              </button>

              <button
                onClick={() => setDeleteConfirmSheet(s)}
                className="min-h-[34px] px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-md flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa</span>
              </button>
            </div>
          </div>
        ))}

        {filteredSheets.length === 0 && (
          <div className="bg-white rounded-xl p-8 border border-stone-200 text-center text-stone-400 italic text-xs">
            Không tìm thấy bản in nào phù hợp.
          </div>
        )}
      </div>

      {/* Desktop Sheets Table */}
      <div className="hidden md:block bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700 border-collapse">
            <thead className="bg-stone-50/90 font-bold text-slate-900 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3.5 sm:px-5 sm:py-4">Mã Lưu Trữ</th>
                <th className="px-4 py-3.5 sm:px-5 sm:py-4">Tên Bài Hát & Nhạc Sĩ</th>
                <th className="px-4 py-3.5 sm:px-5 sm:py-4">Ngày In</th>
                <th className="px-4 py-3.5 sm:px-5 sm:py-4">Số Lượng</th>
                <th className="px-4 py-3.5 sm:px-5 sm:py-4">Vị Trí Tủ Lưu</th>
                <th className="px-4 py-3.5 sm:px-5 sm:py-4">Ghi Chú</th>
                <th className="px-4 py-3.5 sm:px-5 sm:py-4">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredSheets.map(s => (
                <tr key={s.id} className="hover:bg-indigo-50/40 transition-colors">
                  <td className="px-4 py-3.5 sm:px-5 sm:py-4 font-bold text-indigo-950 font-mono">
                    <span className="bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                      {s.storageCode}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 sm:px-5 sm:py-4">
                    <strong className="text-slate-900 block font-bold text-xs sm:text-sm">{s.songTitle}</strong>
                    <span className="text-stone-500 font-normal text-xs">{s.composer}</span>
                  </td>
                  <td className="px-4 py-3.5 sm:px-5 sm:py-4 font-medium text-stone-600 font-sans">{formatDateToDDMMYYYY(s.printDate)}</td>
                  <td className="px-4 py-3.5 sm:px-5 sm:py-4 font-semibold text-emerald-800">{s.quantity || s.currentQty} bản</td>
                  <td className="px-4 py-3.5 sm:px-5 sm:py-4 font-semibold text-slate-900">{s.location}</td>
                  <td className="px-4 py-3.5 sm:px-5 sm:py-4 text-stone-500 italic">{s.note || '-'}</td>
                  <td className="px-4 py-3.5 sm:px-5 sm:py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingSheet(s);
                          setSongInputQuery(s.songTitle);
                          setSelectedSongId(s.songId || null);
                          setComposerInput(s.composer);
                          setStorageCodeInput(s.storageCode);
                          setPrintDateInput(s.printDate || new Date().toISOString().substring(0, 10));
                          setQuantityInput(s.quantity || 30);
                          setLocationInput(s.location);
                          setNoteInput(s.note || '');
                          setCodeWarning('');
                          setFormError(null);
                          setShowAddModal(true);
                        }}
                        className="p-1.5 text-amber-800 hover:bg-amber-100 rounded cursor-pointer"
                        title="Sửa"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmSheet(s)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSheets.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400 italic">
                    Không tìm thấy bản in nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 space-y-3 border border-stone-200 shadow-2xl text-xs sm:text-sm">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <h3 className="font-bold text-slate-900 text-base">{editingSheet ? 'Sửa Bản Nhạc In' : 'Thêm Bản Nhạc In Mới'}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-stone-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>

            <div className="relative">
              <label className="text-stone-600 font-semibold block mb-1">Tên bài hát (*):</label>
              <input
                type="text"
                value={songInputQuery}
                onChange={(e) => {
                  setSongInputQuery(e.target.value);
                  setSelectedSongId(null);
                  setShowSongDropdown(true);
                }}
                onFocus={() => setShowSongDropdown(true)}
                placeholder="Gõ tên bài hát để chọn từ kho hoặc nhập mới..."
                className="w-full bg-stone-50 p-2 rounded-md border border-stone-300 font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
              />

              {showSongDropdown && songInputQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-md shadow-xl max-h-40 overflow-y-auto z-50 divide-y divide-stone-100">
                  {songSuggestions.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSongInputQuery(s.title);
                        setComposerInput(s.composer);
                        setSelectedSongId(s.id);
                        setShowSongDropdown(false);
                      }}
                      className="w-full text-left p-2 hover:bg-amber-50 flex items-center justify-between"
                    >
                      <div>
                        <strong className="text-slate-900 block font-semibold">{s.title}</strong>
                        <span className="text-xs text-stone-500">Nhạc sĩ: {s.composer}</span>
                      </div>
                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                        Chọn bài
                      </span>
                    </button>
                  ))}

                  {songSuggestions.length === 0 && (
                    <div className="p-2 text-center text-stone-500 text-xs">
                      Tự động tạo bài mới trong Kho bài hát khi lưu!
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="text-stone-600 font-semibold block mb-1">Nhạc sĩ / Tác giả:</label>
              <input
                type="text"
                value={composerInput}
                onChange={(e) => setComposerInput(e.target.value)}
                placeholder="e.g. Kim Long, Hải Ánh..."
                className="w-full bg-stone-50 p-2 rounded-md border border-stone-300 font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="text-stone-600 font-semibold block mb-1">Mã lưu trữ (* e.g. NL-001, HL-025):</label>
              <input
                type="text"
                value={storageCodeInput}
                onChange={(e) => handleCheckStorageCode(e.target.value)}
                placeholder="NL-001, HL-025..."
                className="w-full bg-stone-50 p-2 rounded-md border border-stone-300 font-mono font-bold text-amber-900"
              />
              {codeWarning && (
                <p className="text-xs font-semibold text-rose-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{codeWarning}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-stone-600 font-semibold block mb-1">Ngày in:</label>
                <input
                  type="date"
                  value={printDateInput}
                  onChange={(e) => setPrintDateInput(e.target.value)}
                  className="w-full bg-stone-50 p-2 rounded-md border border-stone-300 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="text-stone-600 font-semibold block mb-1">Số lượng bản in:</label>
                <input
                  type="number"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(Number(e.target.value))}
                  className="w-full bg-stone-50 p-2 rounded-md border border-stone-300 font-semibold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-stone-600 font-semibold block mb-1">Vị trí lưu tủ tài liệu giấy:</label>
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="e.g. Tủ A - Ngăn 02"
                className="w-full bg-stone-50 p-2 rounded-md border border-stone-300 font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="text-stone-600 font-semibold block mb-1">Ghi chú đợt in:</label>
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="e.g. In bổ sung cho năm 2026..."
                className="w-full bg-stone-50 p-2 rounded-md border border-stone-300 font-medium text-slate-900"
              />
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <button 
              type="button"
              onClick={handleSaveSheetForm} 
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Lưu bản nhạc in
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirmSheet && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 space-y-3 border border-stone-200 shadow-2xl text-center text-xs sm:text-sm">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">Xác Nhận Xóa Bản In</h3>
            <p className="text-stone-600">
              Bạn có chắc muốn xóa mã in <strong>{deleteConfirmSheet.storageCode}</strong> ({deleteConfirmSheet.songTitle})?
            </p>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setDeleteConfirmSheet(null)} className="flex-1 bg-stone-100 font-semibold py-2 rounded-md">Hủy</button>
              <button
                onClick={() => {
                  onDeleteSheet(deleteConfirmSheet.id);
                  setDeleteConfirmSheet(null);
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2 rounded-md shadow-xs"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
