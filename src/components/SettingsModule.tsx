import React, { useRef, useState } from 'react';
import { 
  Settings, 
  Download, 
  Upload, 
  UserCheck, 
  LogOut, 
  Database, 
  Check, 
  AlertTriangle, 
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { MassEvent, Song, SheetArchive } from '../types/cantus';
import { changeCurrentUserPassword } from '../services/firebase';

interface SettingsModuleProps {
  userEmail?: string;
  masses: MassEvent[];
  songs: Song[];
  sheets: SheetArchive[];
  onRestoreData: (restoredData: { masses: MassEvent[]; songs: Song[]; sheets: SheetArchive[] }, mode: 'REPLACE' | 'MERGE') => void;
  onLogout?: () => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  userEmail = 'ng.manhtrinh@gmail.com',
  masses,
  songs,
  sheets,
  onRestoreData,
  onLogout,
}) => {
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const [previewBackupData, setPreviewBackupData] = useState<{ masses: MassEvent[]; songs: Song[]; sheets: SheetArchive[] } | null>(null);
  const [restoreMode, setRestoreMode] = useState<'MERGE' | 'REPLACE'>('MERGE');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

  // Export entire dataset to JSON
  const handleExportJson = () => {
    const backupObj = {
      app: 'CANTUS - SỔ TAY THÁNH CA',
      version: '2.0',
      exportDate: new Date().toISOString(),
      counts: {
        masses: masses.length,
        songs: songs.length,
        sheets: sheets.length
      },
      data: { masses, songs, sheets }
    };

    const str = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cantus_so_tay_thanh_ca_backup_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage({ type: 'success', text: 'Đã xuất file sao lưu JSON thành công!' });
  };

  // Upload JSON backup file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (json.data && json.data.masses && json.data.songs) {
          setPreviewBackupData(json.data);
          setStatusMessage(null);
        } else {
          setStatusMessage({ type: 'error', text: 'File JSON không đúng cấu trúc sao lưu của Cantus!' });
        }
      } catch (err) {
        setStatusMessage({ type: 'error', text: 'Lỗi định dạng file JSON! Vui lòng chọn đúng tệp sao lưu .json.' });
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!previewBackupData) return;
    if (restoreMode === 'REPLACE') {
      setShowReplaceConfirm(true);
      return;
    }

    executeRestore();
  };

  const executeRestore = () => {
    if (!previewBackupData) return;
    onRestoreData(previewBackupData, restoreMode);
    setPreviewBackupData(null);
    setShowReplaceConfirm(false);
    setStatusMessage({ type: 'success', text: 'Khôi phục dữ liệu thành công!' });
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto space-y-4 max-w-4xl w-full mx-auto pb-24 pr-1">
      {/* Status Notification Banner */}
      {statusMessage && (
        <div className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-150 ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <span>{statusMessage.text}</span>
          <button 
            onClick={() => setStatusMessage(null)}
            className="p-1 hover:bg-black/5 rounded cursor-pointer"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-600" />
          <span>Cài Đặt Cá Nhân & Sao Lưu Dữ Liệu</span>
        </h2>
        <p className="text-xs text-stone-500 font-medium">Quản lý tài khoản, xuất file sao lưu JSON bền vững và khôi phục khi chuyển thiết bị.</p>
      </div>

      {/* Account Info & Change Password Card */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-indigo-700" />
          <span>Tài Khoản Quản Trị Hệ Thống</span>
        </h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs gap-3">
          <div>
            <span className="text-stone-500 font-medium block">Tên tài khoản đang đăng nhập:</span>
            <strong className="text-indigo-950 text-base font-extrabold block">{userEmail}</strong>
          </div>

          <button
            onClick={() => {
              if (onLogout) onLogout();
            }}
            className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Đăng xuất hệ thống</span>
          </button>
        </div>

        {/* Change Password Form */}
        <div className="pt-2 border-t border-stone-100">
          <ChangePasswordCard />
        </div>
      </div>

      {/* Backup & Restore JSON */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <Database className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Sao Lưu & Khôi Phục Dữ Liệu Bền Vững</h3>
            <p className="text-xs text-stone-500">Xuất toàn bộ chương trình, kho bài hát và kho bản in ra tệp JSON hoặc nạp lại.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1 text-xs">
          <button
            onClick={handleExportJson}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Xuất file sao lưu (.json)</span>
          </button>

          <button
            onClick={() => jsonFileInputRef.current?.click()}
            className="flex-1 bg-stone-100 hover:bg-stone-200 text-slate-900 font-bold py-3 rounded-2xl border border-stone-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4 text-emerald-700" />
            <span>Khôi phục từ file (.json)</span>
          </button>
          <input
            type="file"
            ref={jsonFileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>

        {/* Restore Preview Modal / Panel */}
        {previewBackupData && (
          <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-300 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <ShieldCheck className="w-5 h-5 text-amber-700" />
              <span>Xem trước nội dung tệp sao lưu:</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-bold">
              <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                <span className="block text-base text-slate-900">{previewBackupData.masses?.length || 0}</span>
                <span className="text-[10px] text-stone-500 uppercase">Chương trình</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                <span className="block text-base text-slate-900">{previewBackupData.songs?.length || 0}</span>
                <span className="text-[10px] text-stone-500 uppercase">Bài hát</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                <span className="block text-base text-slate-900">{previewBackupData.sheets?.length || 0}</span>
                <span className="text-[10px] text-stone-500 uppercase">Bản nhạc in</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-900">Chọn phương thức khôi phục:</span>
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="radio"
                    name="restoreMode"
                    value="MERGE"
                    checked={restoreMode === 'MERGE'}
                    onChange={() => setRestoreMode('MERGE')}
                    className="text-amber-600"
                  />
                  <span>Gộp dữ liệu (Bảo vệ dữ liệu hiện có)</span>
                </label>

                <label className="flex items-center gap-1.5 font-bold cursor-pointer text-rose-900">
                  <input
                    type="radio"
                    name="restoreMode"
                    value="REPLACE"
                    checked={restoreMode === 'REPLACE'}
                    onChange={() => setRestoreMode('REPLACE')}
                    className="text-rose-600"
                  />
                  <span>Thay thế hoàn toàn</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setPreviewBackupData(null)} className="flex-1 bg-white font-bold py-2 rounded-xl border border-amber-200 cursor-pointer">Hủy</button>
              <button onClick={handleConfirmRestore} className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2 rounded-xl shadow-xs cursor-pointer">Xác nhận khôi phục</button>
            </div>
          </div>
        )}
      </div>

      {/* REPLACE CONFIRMATION MODAL */}
      {showReplaceConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3.5 border border-stone-200 shadow-2xl text-xs sm:text-sm animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Cảnh Báo Thay Thế Dữ Liệu</span>
            </div>
            <p className="text-stone-700 font-medium">
              Chế độ <strong>THAY THẾ</strong> sẽ xóa đè hoàn toàn toàn bộ dữ liệu Thánh lễ, bài hát và kho bản in hiện tại bằng nội dung từ tệp sao lưu.
            </p>
            <p className="text-rose-700 font-bold text-xs">
              Thao tác này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowReplaceConfirm(false)}
                className="px-3.5 py-2 rounded-xl border border-stone-300 text-stone-700 font-semibold hover:bg-stone-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={executeRestore}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs cursor-pointer"
              >
                Đồng Ý Thay Thế
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ChangePasswordCard: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMsg({ type: 'error', text: 'Vui lòng nhập đầy đủ các trường mật khẩu.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'Mật khẩu mới và mật khẩu xác nhận không khớp nhau.' });
      return;
    }

    if (newPassword.length < 6) {
      setMsg({ type: 'error', text: 'Mật khẩu mới phải từ 6 ký tự trở lên.' });
      return;
    }

    setIsSubmitting(true);
    setMsg(null);

    try {
      await changeCurrentUserPassword(currentPassword, newPassword);

      setMsg({ type: 'success', text: 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('[ChangePassword] Error:', err);
      const code = err?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setMsg({ type: 'error', text: 'Mật khẩu hiện tại không chính xác.' });
      } else {
        setMsg({ type: 'error', text: err.message || 'Lỗi khi đổi mật khẩu.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-indigo-600" />
        <span>Đổi Mật Khẩu Quản Trị</span>
      </h4>

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-medium border ${
          msg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-stone-600 mb-1">Mật khẩu hiện tại</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none bg-stone-50/50"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-stone-600 mb-1">Mật khẩu mới</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Mới (>= 6 ký tự)"
            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none bg-stone-50/50"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-stone-600 mb-1">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none bg-stone-50/50"
          />
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
        </button>
      </div>
    </form>
  );
};
