import React, { useState, useEffect } from 'react';
import { X, Search, Check, Music, UserCheck } from 'lucide-react';
import { MassProgramItem, Song, MassPosition } from '../types/cantus';
import { getMassPositionLabel } from '../utils/cantusUtils';

interface EditPositionModalProps {
  item: MassProgramItem | null;
  songs: Song[];
  onSave: (savedItem: MassProgramItem) => void;
  onClose: () => void;
}

export const EditPositionModal: React.FC<EditPositionModalProps> = ({
  item,
  songs,
  onSave,
  onClose,
}) => {
  const [position, setPosition] = useState<MassPosition>(item ? item.position : 'HL');
  const [positionLabel, setPositionLabel] = useState(item?.positionLabel || 'Hiệp lễ');
  const [title, setTitle] = useState(item?.title || '');
  const [composer, setComposer] = useState(item?.composer || '');
  const [key, setKey] = useState(item?.key || 'G');
  const [rhythm, setRhythm] = useState(item?.rhythm || 'Ballad');
  const [hasSolo, setHasSolo] = useState(item?.hasSolo || false);
  const [soloSinger, setSoloSinger] = useState(item?.soloSinger || '');
  const [accompanist, setAccompanist] = useState(item?.accompanist || '');
  const [notes, setNotes] = useState(item?.notes || '');

  const [autocompleteQuery, setAutocompleteQuery] = useState(item?.title || '');
  const [showDropdown, setShowDropdown] = useState(false);

  const queryNorm = (autocompleteQuery || '').toLowerCase();
  const filteredSongs = songs.filter(s =>
    (s.title || '').toLowerCase().includes(queryNorm) ||
    (s.composer || '').toLowerCase().includes(queryNorm)
  );

  const handleSelectSong = (s: Song) => {
    setTitle(s.title);
    setComposer(s.composer);
    setKey(s.defaultKey || 'G');
    setRhythm(s.defaultRhythm || 'Ballad');
    setAutocompleteQuery(s.title);
    setShowDropdown(false);
  };

  const handleSave = () => {
    const currentTitle = title || '';
    const savedItem: MassProgramItem = {
      id: item ? item.id : 'p-' + Date.now(),
      position,
      positionLabel: positionLabel || getMassPositionLabel(position),
      songId: songs.find(s => (s.title || '').toLowerCase().trim() === currentTitle.toLowerCase().trim())?.id || null,
      title: currentTitle,
      composer,
      key,
      rhythm,
      hasSolo,
      soloSinger: hasSolo ? soloSinger : '',
      accompanist,
      notes
    };

    onSave(savedItem);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-stone-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-700 pb-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Music className="w-5 h-5 text-amber-500" />
            <span>Chi Tiết Bài Hát Vị Trí {getMassPositionLabel(position)}</span>
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Position Selector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Vị trí bài hát trong Thánh lễ:</label>
              <select
                value={position}
                onChange={(e) => {
                  const pos = e.target.value as MassPosition;
                  setPosition(pos);
                  setPositionLabel(getMassPositionLabel(pos));
                }}
                className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
              >
                <option value="NL">NL - Nhập lễ</option>
                <option value="DC">ĐC - Đáp ca</option>
                <option value="ALL">ALL - Alleluia</option>
                <option value="DL">DL - Dâng lễ</option>
                <option value="HL">HL - Hiệp lễ</option>
                <option value="KL">KL - Kết lễ</option>
                <option value="OTHER">Bài hát khác</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Nhãn vị trí hiển thị:</label>
              <input
                type="text"
                value={positionLabel}
                onChange={(e) => setPositionLabel(e.target.value)}
                className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                placeholder="e.g. Hiệp lễ 1, Ca tạ lễ..."
              />
            </div>
          </div>

          {/* Autocomplete Song Title */}
          <div className="relative">
            <label className="block text-slate-500 font-semibold mb-1">Tên bài hát (Chọn từ thư viện hoặc gõ tên mới):</label>
            <div className="relative">
              <input
                type="text"
                value={autocompleteQuery}
                onChange={(e) => {
                  setAutocompleteQuery(e.target.value);
                  setTitle(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                placeholder="Gõ vài ký tự để tìm bài hát trong thư viện..."
              />
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Dropdown suggestions */}
            {showDropdown && (autocompleteQuery || '').trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50">
                {filteredSongs.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSong(s)}
                    className="w-full text-left p-2.5 hover:bg-stone-100 dark:hover:bg-slate-700 border-b border-stone-100 dark:border-slate-700/50 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{s.title}</span>
                      <span className="text-[11px] text-slate-400">Sáng tác: {s.composer} · Điệu: {s.defaultRhythm}</span>
                    </div>
                    <span className="text-xs font-bold text-amber-500">{s.defaultKey}</span>
                  </button>
                ))}

                {filteredSongs.length === 0 && (
                  <div className="p-3 text-center text-slate-400 italic">
                    Chưa có bài này trong thư viện. Thao tác này sẽ ghi tên bài hát mới.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Composer & Key & Rhythm */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Nhạc sĩ / Tác giả:</label>
              <input
                type="text"
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Tông hát:</label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                placeholder="C, G, D, Am..."
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Điệu nhạc:</label>
              <input
                type="text"
                value={rhythm}
                onChange={(e) => setRhythm(e.target.value)}
                className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                placeholder="Ballad, Valse..."
              />
            </div>
          </div>

          {/* Solo Checkbox & Solo Singer */}
          <div className="p-3 bg-stone-50 dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-700 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 dark:text-white">
              <input
                type="checkbox"
                checked={hasSolo}
                onChange={(e) => setHasSolo(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
              />
              <span>[x] Có phần hát Solo / Xướng đáp</span>
            </label>

            {hasSolo && (
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Tên ca viên hát Solo:</label>
                <input
                  type="text"
                  value={soloSinger}
                  onChange={(e) => setSoloSinger(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 p-2 rounded-lg border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  placeholder="e.g. Lê Thị C (Soprano)"
                />
              </div>
            )}
          </div>

          {/* Accompanist */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Người đàn / Phối khí cho bài này:</label>
            <input
              type="text"
              value={accompanist}
              onChange={(e) => setAccompanist(e.target.value)}
              className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
              placeholder="e.g. Nguyễn Văn A"
            />
          </div>

          {/* Mass Specific Notes */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Ghi chú riêng cho Thánh lễ này:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
              placeholder="e.g. Dạo đầu 4 ô nhịp, solo phiên khúc 1, điệp khúc hát chung."
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 bg-stone-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2.5 rounded-xl text-xs"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow"
          >
            Lưu Bài Hát
          </button>
        </div>
      </div>
    </div>
  );
};
