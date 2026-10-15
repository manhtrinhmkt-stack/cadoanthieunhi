import React, { useState } from 'react';
import { 
  Music, 
  Search, 
  Plus, 
  History, 
  Calendar, 
  Edit3, 
  Trash2, 
  X, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { Song, MassEvent, MassPosition } from '../types/cantus';
import { getMassPositionLabel, getMassPositionBadgeColor, matchVietnameseText, formatDateToDDMMYYYY } from '../utils/cantusUtils';

interface SongLibraryModuleProps {
  songs: Song[];
  masses: MassEvent[];
  onSaveSong: (s: Song) => void;
  onDeleteSong: (id: string) => void;
  onNavigateToMass: (massId: string) => void;
}

export const SongLibraryModule: React.FC<SongLibraryModuleProps> = ({
  songs,
  masses,
  onSaveSong,
  onDeleteSong,
  onNavigateToMass,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<'A_Z' | 'NEWEST' | 'RECENT_USED' | 'MOST_USED'>('A_Z');

  const [selectedSongDetail, setSelectedSongDetail] = useState<Song | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  const [deleteConfirmSong, setDeleteConfirmSong] = useState<Song | null>(null);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newComposer, setNewComposer] = useState('');
  const [newCategory, setNewCategory] = useState<MassPosition>('HL');
  const [newRhythm, setNewRhythm] = useState('Ballad');
  const [newNote, setNewNote] = useState('');

  const todayStr = new Date().toISOString().substring(0, 10);

  const getSongUsageStats = (songTitle: string) => {
    const historyList: { massId: string; massDate: string; massTitle: string; positionLabel: string }[] = [];

    masses.forEach(m => {
      m.program.forEach(p => {
        if (p.title && matchVietnameseText(p.title, songTitle)) {
          historyList.push({
            massId: m.id,
            massDate: m.date,
            massTitle: m.title || m.name || 'Thánh lễ',
            positionLabel: p.positionLabel || getMassPositionLabel(p.position)
          });
        }
      });
    });

    historyList.sort((a, b) => new Date(b.massDate).getTime() - new Date(a.massDate).getTime());

    const actualCount = historyList.filter(h => h.massDate <= todayStr).length;
    const recentDate = historyList.length > 0 ? formatDateToDDMMYYYY(historyList[0].massDate) : 'Chưa hát';

    return {
      historyList,
      actualCount,
      recentDate
    };
  };

  const filteredSongs = songs.filter(s => {
    const matchesSearch = matchVietnameseText(s.title, searchQuery) ||
                          matchVietnameseText(s.composer, searchQuery) ||
                          (s.storageCode && matchVietnameseText(s.storageCode, searchQuery));
    
    const matchesPosition = positionFilter === 'ALL' || 
                            s.defaultPosition === positionFilter || 
                            (s.categories && s.categories.includes(positionFilter as MassPosition));

    return matchesSearch && matchesPosition;
  }).sort((a, b) => {
    if (sortOption === 'A_Z') {
      return a.title.localeCompare(b.title, 'vi');
    }
    if (sortOption === 'NEWEST') {
      return (b.id || '').localeCompare(a.id || '');
    }
    const statsA = getSongUsageStats(a.title);
    const statsB = getSongUsageStats(b.title);
    if (sortOption === 'RECENT_USED') {
      return (statsB.recentDate || '').localeCompare(statsA.recentDate || '');
    }
    return statsB.actualCount - statsA.actualCount;
  });

  const handleSaveNewSong = () => {
    if (!newTitle) return;
    const song: Song = {
      id: editingSong ? editingSong.id : 's-' + Date.now(),
      title: newTitle.trim(),
      composer: newComposer.trim() || 'Chưa rõ',
      categories: [newCategory],
      defaultPosition: newCategory,
      rhythm: newRhythm,
      defaultRhythm: newRhythm,
      note: newNote,
      createdAt: new Date().toISOString()
    };

    onSaveSong(song);
    setShowAddModal(false);
    setEditingSong(null);
    setNewTitle('');
    setNewComposer('');
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Music className="w-5 h-5 text-slate-800" />
              <span>Kho Bài Hát Thánh Ca ({songs.length} tác phẩm)</span>
            </h2>
            <p className="text-xs text-stone-500 font-medium mt-0.5">Lưu trữ danh sách bài hát, vị trí hát, tác giả và lịch sử hát trong phụng vụ.</p>
          </div>

          <button
            onClick={() => {
              setEditingSong(null);
              setNewTitle('');
              setNewComposer('');
              setShowAddModal(true);
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-4.5 py-2.5 rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>+ Thêm bài hát mới</span>
          </button>
        </div>

        {/* Search & Position Filters Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1 text-xs sm:text-sm">
          {/* Search Box */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên bài hát, nhạc sĩ..."
              className="w-full bg-stone-50 pl-9 pr-3 py-2 rounded-md border border-stone-200 text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Position Category Filter */}
          <div className="relative">
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="w-full bg-stone-50 px-3 py-2 rounded-md border border-stone-200 text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Tất cả vị trí hát</option>
              <option value="NL">Nhập Lễ (NL)</option>
              <option value="DC">Đáp Ca (DC)</option>
              <option value="ALL">Alleluia (ALL)</option>
              <option value="DL">Dâng Lễ (DL)</option>
              <option value="HL">Hiệp Lễ (HL)</option>
              <option value="KL">Kết Lễ (KL)</option>
              <option value="TK">Tiếp Liên (TK)</option>
            </select>
          </div>

          {/* Sort Order */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="bg-stone-50 px-3 py-2 rounded-md border border-stone-200 text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
          >
            <option value="A_Z">Sắp xếp A – Z</option>
            <option value="NEWEST">Mới thêm gần đây</option>
            <option value="RECENT_USED">Lần hát gần nhất</option>
            <option value="MOST_USED">Số lần hát nhiều nhất</option>
          </select>
        </div>
      </div>

      {/* Song List Table View (Matching Sheet Music Table Format) */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700 border-collapse">
            <thead className="bg-stone-50/90 font-bold text-slate-900 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3.5 sm:px-5 sm:py-4">Vị Trí Mẫu</th>
                <th className="px-4 py-3.5 sm:px-5 sm:py-4">Tên Bài Hát & Nhạc Sĩ</th>
                <th className="px-4 py-3.5 sm:px-5 sm:py-4">Trang / Mã Sách</th>
                <th className="px-4 py-3.5 sm:px-5 sm:py-4 text-center">Đã Hát</th>
                <th className="px-4 py-3.5 sm:px-5 sm:py-4">Lần Dùng Gần Nhất</th>
                <th className="px-4 py-3.5 sm:px-5 sm:py-4">Ghi Chú</th>
                <th className="px-4 py-3.5 sm:px-5 sm:py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredSongs.map(s => {
                const { actualCount, recentDate } = getSongUsageStats(s.title);
                const pos = s.defaultPosition || s.categories?.[0] || 'HL';

                return (
                  <tr key={s.id} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="px-4 py-3.5 sm:px-5 sm:py-4 font-bold">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${getMassPositionBadgeColor(pos)}`}>
                        {getMassPositionLabel(pos)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 sm:px-5 sm:py-4">
                      <strong className="text-slate-900 block font-bold text-xs sm:text-sm">{s.title}</strong>
                      <span className="text-stone-500 font-medium text-xs">{s.composer}</span>
                    </td>

                    <td className="px-4 py-3.5 sm:px-5 sm:py-4 font-mono font-bold text-indigo-900 text-xs">
                      {(s.storageCode || s.pageNumber) ? (
                        <span className="bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                          Tr. {s.storageCode || s.pageNumber}
                        </span>
                      ) : (
                        <span className="text-stone-400 italic font-normal text-xs">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 sm:px-5 sm:py-4 text-center">
                      <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 text-xs">
                        {actualCount} lần
                      </span>
                    </td>

                    <td className="px-4 py-3.5 sm:px-5 sm:py-4 font-medium text-stone-600 text-xs">
                      {recentDate}
                    </td>

                    <td className="px-4 py-3.5 sm:px-5 sm:py-4 text-stone-500 italic text-xs max-w-[200px] truncate">
                      {s.note || '-'}
                    </td>

                    <td className="px-4 py-3.5 sm:px-5 sm:py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedSongDetail(s)}
                          className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-slate-900 font-bold text-xs rounded flex items-center gap-1 transition-colors"
                          title="Chi tiết & Lịch sử"
                        >
                          <History className="w-3.5 h-3.5 text-indigo-700" />
                          <span className="hidden sm:inline">Lịch sử</span>
                        </button>

                        <button
                          onClick={() => {
                            setEditingSong(s);
                            setNewTitle(s.title);
                            setNewComposer(s.composer);
                            setNewCategory(s.defaultPosition || 'HL');
                            setNewRhythm(s.rhythm || 'Ballad');
                            setNewNote(s.note || '');
                            setShowAddModal(true);
                          }}
                          className="p-1.5 text-stone-600 hover:text-slate-900 hover:bg-stone-100 rounded"
                          title="Sửa"
                        >
                          <Edit3 className="w-4 h-4 text-indigo-700" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmSong(s)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredSongs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400 italic">
                    Không tìm thấy bài hát nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedSongDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-5 space-y-4 border border-stone-200 shadow-2xl max-h-[90vh] overflow-y-auto text-xs sm:text-sm">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-semibold uppercase text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-300">
                  Thánh Ca Chi Tiết
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedSongDetail.title}</h3>
                <p className="text-stone-500 font-medium">Sáng tác: {selectedSongDetail.composer}</p>
              </div>

              <button onClick={() => setSelectedSongDetail(null)} className="p-1 text-stone-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>

            {(() => {
              const { historyList, actualCount, recentDate } = getSongUsageStats(selectedSongDetail.title);

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-indigo-50 p-2.5 rounded-md border border-indigo-200">
                      <span className="block text-base font-bold text-indigo-900">{actualCount} lần</span>
                      <span className="text-[10px] uppercase font-semibold text-stone-500">Tổng lần đã hát</span>
                    </div>
                    <div className="bg-stone-50 p-2.5 rounded-md border border-stone-200">
                      <span className="block text-sm font-bold text-slate-900">{recentDate}</span>
                      <span className="text-[10px] uppercase font-semibold text-stone-500">Lần dùng gần nhất</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-700" />
                      <span>Danh Sách Các Thánh Lễ Đã Hát Bài Này ({historyList.length} lượt)</span>
                    </h4>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {historyList.map((h, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setSelectedSongDetail(null);
                            onNavigateToMass(h.massId);
                          }}
                          className="bg-stone-50 hover:bg-indigo-50 p-2.5 rounded-md border border-stone-200 cursor-pointer transition-colors flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-indigo-950 block">{formatDateToDDMMYYYY(h.massDate)} - {h.massTitle}</span>
                            <span className="text-xs text-stone-500">Vị trí: <strong>{h.positionLabel}</strong></span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-stone-400" />
                        </div>
                      ))}

                      {historyList.length === 0 && (
                        <p className="text-center p-4 text-stone-400 italic">Chưa ghi nhận lịch sử sử dụng cho bài hát này.</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 space-y-3 border border-stone-200 shadow-2xl text-xs sm:text-sm">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <h3 className="font-bold text-slate-900 text-base">{editingSong ? 'Sửa Bài Hát' : 'Thêm Bài Hát Vào Kho'}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-stone-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-stone-800 block mb-1">Tên bài hát *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nhập tên bài hát..."
                  className="w-full bg-stone-50 p-2 rounded border border-stone-300 font-bold focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">Nhạc sĩ tác giả</label>
                <input
                  type="text"
                  value={newComposer}
                  onChange={(e) => setNewComposer(e.target.value)}
                  placeholder="Tên tác giả..."
                  className="w-full bg-stone-50 p-2 rounded border border-stone-300 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">Vị trí mặc định</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as MassPosition)}
                  className="w-full bg-stone-50 p-2 rounded border border-stone-300 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="NL">Nhập Lễ</option>
                  <option value="DC">Đáp Ca</option>
                  <option value="ALL">Alleluia</option>
                  <option value="DL">Dâng Lễ</option>
                  <option value="HL">Hiệp Lễ</option>
                  <option value="KL">Kết Lễ</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">Ghi chú</label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Ghi chú sử dụng..."
                  className="w-full bg-stone-50 p-2 rounded border border-stone-300 font-medium focus:outline-none focus:border-indigo-500"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded border border-stone-300 text-stone-700 font-semibold hover:bg-stone-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveNewSong}
                className="px-4 py-1.5 rounded bg-indigo-700 hover:bg-indigo-800 text-white font-bold shadow-xs"
              >
                Lưu Bài Hát
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmSong && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 space-y-3 border border-stone-200 shadow-2xl text-xs sm:text-sm">
            <h3 className="font-bold text-rose-700 text-base">Xác Nhận Xóa Bài Hát</h3>
            <p className="text-stone-700 font-medium">
              Bạn có chắc chắn muốn xóa bài hát <strong className="text-slate-900">"{deleteConfirmSong.title}"</strong> khỏi kho bài hát không?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmSong(null)}
                className="px-3 py-1.5 rounded border border-stone-300 text-stone-700 font-semibold hover:bg-stone-50"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onDeleteSong(deleteConfirmSong.id);
                  setDeleteConfirmSong(null);
                }}
                className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Xóa Bài Hát
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
