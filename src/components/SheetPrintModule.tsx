import React, { useState } from 'react';
import { 
  FolderArchive, 
  Printer, 
  Search, 
  Plus, 
  QrCode, 
  History, 
  UserCheck, 
  FileText, 
  AlertCircle,
  X,
  CheckCircle2,
  Clock
} from 'lucide-react';
import QRCode from 'qrcode';
import { SheetPrintArchive, PrintBatchLog, BorrowRecord, Song } from '../types/cantus';
import { getMassPositionLabel, generateStorageCode } from '../utils/cantusUtils';

interface SheetPrintModuleProps {
  archives: SheetPrintArchive[];
  borrows: BorrowRecord[];
  songs: Song[];
  onSaveArchive: (archive: SheetPrintArchive) => void;
  onAddPrintBatch: (archiveId: string, batch: PrintBatchLog) => void;
  onAddBorrowRecord: (record: BorrowRecord) => void;
  onReturnBorrowRecord: (recordId: string) => void;
}

export const SheetPrintModule: React.FC<SheetPrintModuleProps> = ({
  archives,
  borrows,
  songs,
  onSaveArchive,
  onAddPrintBatch,
  onAddBorrowRecord,
  onReturnBorrowRecord,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArchiveDetail, setSelectedArchiveDetail] = useState<SheetPrintArchive | null>(null);
  const [qrModalCode, setQrModalCode] = useState<{ title: string; code: string; url: string } | null>(null);

  // Modal states for new batch or borrow
  const [showNewArchiveModal, setShowNewArchiveModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);

  // Form states
  const [newArchiveSongId, setNewArchiveSongId] = useState('');
  const [newArchiveLocation, setNewArchiveLocation] = useState('Tủ A – Ngăn 01');
  const [newArchiveInitQty, setNewArchiveInitQty] = useState(30);

  const [borrowArchiveId, setBorrowArchiveId] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerRole, setBorrowerRole] = useState('Ca viên');
  const [borrowQty, setBorrowQty] = useState(1);

  // Generate QR code for label
  const handleShowQrCode = async (archive: SheetPrintArchive) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(
        `CANTUS-SHEET:${archive.storageCode}:${archive.songTitle}`
      );
      setQrModalCode({
        title: archive.songTitle,
        code: archive.storageCode,
        url: qrDataUrl
      });
    } catch (e) {
      console.error('Error generating QR', e);
    }
  };

  const handleCreateArchive = () => {
    const song = songs.find(s => s.id === newArchiveSongId);
    if (!song) return;

    const existingCodes = archives.map(a => a.storageCode);
    const newCode = generateStorageCode(song.defaultPosition || 'HL', existingCodes);

    const newArc: SheetPrintArchive = {
      id: 'arc-' + Date.now(),
      storageCode: newCode,
      songId: song.id,
      songTitle: song.title,
      composer: song.composer,
      category: song.defaultPosition,
      firstPrintDate: new Date().toISOString().substring(0, 10),
      printedQuantity: newArchiveInitQty,
      currentQuantity: newArchiveInitQty,
      location: newArchiveLocation,
      status: 'LƯU_TRỮ',
      pdfUrl: song.pdfUrl,
      history: [
        {
          id: 'h-' + Date.now(),
          date: new Date().toISOString().substring(0, 10),
          quantity: newArchiveInitQty,
          printedBy: 'Phụ trách kho bản in',
          reason: 'In khởi tạo kho mới'
        }
      ]
    };

    onSaveArchive(newArc);
    setShowNewArchiveModal(false);
  };

  const handleCreateBorrow = () => {
    if (!borrowArchiveId || !borrowerName) return;

    const record: BorrowRecord = {
      id: 'br-' + Date.now(),
      sheetArchiveId: borrowArchiveId,
      borrowerName,
      borrowerRole,
      quantity: borrowQty,
      borrowDate: new Date().toISOString().substring(0, 10),
      expectedReturnDate: new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10),
      status: 'ĐANG_MƯỢN'
    };

    onAddBorrowRecord(record);
    setShowBorrowModal(false);
  };

  const filteredArchives = archives.filter(a => 
    a.songTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.storageCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-stone-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-amber-500" />
            <span>04. Kho Bản Nhạc In & Quản Lý Mượn Trả</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý tài liệu giấy: mã lưu trữ (HL-0025), tủ lưu trữ, số lượng hiện còn, lịch sử in đợt & mượn trả ca viên.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBorrowModal(true)}
            className="flex items-center justify-center gap-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all"
          >
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span>Ghi Mượn Bản In</span>
          </button>

          <button
            onClick={() => setShowNewArchiveModal(true)}
            className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Mã Lưu Trữ Mới</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-stone-200 dark:border-slate-700 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm mã lưu trữ (e.g. HL-0025), tên bài hát, vị trí tủ lưu..."
            className="w-full bg-stone-50 dark:bg-slate-900 text-xs pl-9 pr-3 py-2 rounded-lg border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Archives Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-sm flex items-center justify-between">
          <span>Danh Sách Mã Lưu Trữ Trong Kho ({filteredArchives.length} đầu tài liệu)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-stone-100 dark:bg-slate-900 text-slate-900 dark:text-white font-bold border-b border-stone-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5">Mã Lưu Trữ</th>
                <th className="p-3.5">Tên Bài Hát & Tác Giả</th>
                <th className="p-3.5">Phân Loại</th>
                <th className="p-3.5">Vị Trí Lưu</th>
                <th className="p-3.5">Tổng Đã In</th>
                <th className="p-3.5">Hiện Còn</th>
                <th className="p-3.5">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-slate-700/60">
              {filteredArchives.map((a) => (
                <tr key={a.id} className="hover:bg-stone-50 dark:hover:bg-slate-700/40 transition-colors">
                  <td className="p-3.5">
                    <span className="font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                      {a.storageCode}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-900 dark:text-white block">{a.songTitle}</span>
                    <span className="text-slate-400 text-[11px]">{a.composer}</span>
                  </td>
                  <td className="p-3.5 font-semibold">{getMassPositionLabel(a.category || 'HL')}</td>
                  <td className="p-3.5 font-medium">{a.location}</td>
                  <td className="p-3.5 font-semibold">{a.printedQuantity} bản</td>
                  <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">{a.currentQuantity} bản</td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedArchiveDetail(a)}
                        className="flex items-center gap-1 bg-stone-100 hover:bg-stone-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-2.5 py-1 rounded-lg font-bold"
                      >
                        <History className="w-3.5 h-3.5 text-amber-500" />
                        <span>Lịch sử in</span>
                      </button>

                      <button
                        onClick={() => handleShowQrCode(a)}
                        className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg"
                        title="Tạo mã QR dán gáy bìa/ngăn tủ"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Borrows Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-200 dark:border-slate-700 shadow-sm p-5 space-y-3">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-500" />
          <span>Danh Sách Đang Mượn Tài Liệu Giấy ({borrows.length} lượt)</span>
        </h3>

        <div className="overflow-x-auto border border-stone-200 dark:border-slate-700 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-stone-100 dark:bg-slate-900 font-bold border-b border-stone-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Người Mượn</th>
                <th className="p-3">Vai Trò</th>
                <th className="p-3">Mã Bài In</th>
                <th className="p-3">Số Lượng</th>
                <th className="p-3">Ngày Mượn</th>
                <th className="p-3">Hạn Trả</th>
                <th className="p-3">Trạng Thái</th>
                <th className="p-3">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-slate-700/60">
              {borrows.map((b) => {
                const arc = archives.find(a => a.id === b.sheetArchiveId);
                const isReturned = b.status === 'ĐÃ_TRẢ';

                return (
                  <tr key={b.id} className="hover:bg-stone-50 dark:hover:bg-slate-700/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{b.borrowerName}</td>
                    <td className="p-3">{b.borrowerRole}</td>
                    <td className="p-3 font-semibold text-amber-600 dark:text-amber-400">{arc?.storageCode || 'HL-0000'} ({arc?.songTitle})</td>
                    <td className="p-3 font-bold">{b.quantity} bản</td>
                    <td className="p-3">{b.borrowDate}</td>
                    <td className="p-3">{b.expectedReturnDate}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        isReturned ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {!isReturned && (
                        <button
                          onClick={() => onReturnBorrowRecord(b.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition-colors"
                        >
                          Xác nhận Đã Trả
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Label Modal */}
      {qrModalCode && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl border border-stone-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Mã QR Nhãn Lưu Trữ Tủ Paper</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              In hoặc dán mã QR này lên gáy tập bài hát hoặc ngăn tủ <strong className="text-amber-500">{qrModalCode.code}</strong>.
            </p>

            <div className="p-4 bg-white rounded-xl shadow-inner inline-block border border-stone-200">
              <img src={qrModalCode.url} alt="QR Code" className="w-48 h-48 mx-auto" />
            </div>

            <p className="text-sm font-bold text-slate-900 dark:text-white">{qrModalCode.title}</p>
            <p className="text-xs font-mono text-amber-600 font-extrabold">{qrModalCode.code}</p>

            <button
              onClick={() => setQrModalCode(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-colors"
            >
              Đóng Modal
            </button>
          </div>
        </div>
      )}

      {/* New Archive Modal */}
      {showNewArchiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tạo Mã Lưu Trữ Kho Bản In Mới</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Chọn bài hát từ kho:</label>
                <select
                  value={newArchiveSongId}
                  onChange={(e) => setNewArchiveSongId(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="">-- Chọn bài hát --</option>
                  {songs.map(s => (
                    <option key={s.id} value={s.id}>{s.title} ({s.composer})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Vị trí lưu tủ tài liệu giấy:</label>
                <input
                  type="text"
                  value={newArchiveLocation}
                  onChange={(e) => setNewArchiveLocation(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  placeholder="e.g. Tủ A – Ngăn 02"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Số lượng bản in khởi tạo:</label>
                <input
                  type="number"
                  value={newArchiveInitQty}
                  onChange={(e) => setNewArchiveInitQty(Number(e.target.value))}
                  className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowNewArchiveModal(false)}
                className="flex-1 bg-stone-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2.5 rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateArchive}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow"
              >
                Tạo Mã Lưu Trữ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Borrow Modal */}
      {showBorrowModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ghi Nhận Ca Viên Mượn Bản In</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Chọn mã bản in:</label>
                <select
                  value={borrowArchiveId}
                  onChange={(e) => setBorrowArchiveId(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="">-- Chọn bài in --</option>
                  {archives.map(a => (
                    <option key={a.id} value={a.id}>{a.storageCode} - {a.songTitle} (Còn {a.currentQuantity} bản)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Tên người mượn:</label>
                <input
                  type="text"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  placeholder="e.g. Lê Thị C"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Vai trò người mượn:</label>
                <input
                  type="text"
                  value={borrowerRole}
                  onChange={(e) => setBorrowerRole(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  placeholder="e.g. Soloist Soprano / Organist"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Số bản mượn:</label>
                <input
                  type="number"
                  value={borrowQty}
                  onChange={(e) => setBorrowQty(Number(e.target.value))}
                  className="w-full bg-stone-50 dark:bg-slate-900 p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowBorrowModal(false)}
                className="flex-1 bg-stone-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2.5 rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateBorrow}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow"
              >
                Lưu Phiếu Mượn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
