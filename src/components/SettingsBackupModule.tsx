import React, { useRef } from 'react';
import { 
  Settings, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  ShieldCheck, 
  Database, 
  History, 
  Trash2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Song, MassEvent, SheetPrintArchive, AuditLog } from '../types/cantus';
import { exportToExcel, importFromExcel } from '../utils/cantusUtils';

interface SettingsBackupModuleProps {
  songs: Song[];
  masses: MassEvent[];
  archives: SheetPrintArchive[];
  auditLogs: AuditLog[];
  onRestoreData: (data: { songs: Song[]; masses: MassEvent[]; archives: SheetPrintArchive[] }) => void;
  onImportSongsFromExcel: (importedSongs: Partial<Song>[]) => void;
}

export const SettingsBackupModule: React.FC<SettingsBackupModuleProps> = ({
  songs,
  masses,
  archives,
  auditLogs,
  onRestoreData,
  onImportSongsFromExcel,
}) => {
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  // Backup entire database to JSON file
  const handleExportJsonBackup = () => {
    const backupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      app: 'Cantus - Choir Management',
      data: { songs, masses, archives }
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cantus_backup_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Restore database from JSON file
  const handleImportJsonBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.data && parsed.data.songs && parsed.data.masses) {
          onRestoreData(parsed.data);
        }
      } catch (err) {
        console.error('Lỗi đọc file JSON sao lưu', err);
      }
    };
    reader.readAsText(file);
  };

  // Export songs list to Excel
  const handleExportSongsExcel = () => {
    const exportData = songs.map(s => ({
      'Tên bài hát': s.title,
      'Sáng tác': s.composer,
      'Vị trí mặc định': s.defaultPosition,
      'Tông gốc': s.defaultKey,
      'Điệu nhạc': s.defaultRhythm,
      'Mã kho in': s.storageCode || '',
      'Ghi chú cố định': s.fixedNotes || ''
    }));

    exportToExcel(exportData, 'danh_sach_thanh_ca_cantus');
  };

  // Import songs list from Excel
  const handleImportSongsExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await importFromExcel(file);
      const mappedSongs: Partial<Song>[] = rows.map((r: any) => ({
        title: r['Tên bài hát'] || r['title'] || r['TenBaiHat'],
        composer: r['Sáng tác'] || r['composer'] || r['SangTac'] || 'Chưa rõ',
        defaultPosition: (r['Vị trí mặc định'] || 'HL') as any,
        defaultKey: r['Tông gốc'] || 'G',
        defaultRhythm: r['Điệu nhạc'] || 'Ballad',
        fixedNotes: r['Ghi chú cố định'] || ''
      }));

      onImportSongsFromExcel(mappedSongs);
    } catch (err) {
      console.error('Lỗi khi đọc file Excel', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-stone-200 dark:border-slate-700 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-500" />
          <span>07. Cài Đặt Hệ Thống, Nhập / Xuất Excel & Sao Lưu Dữ Liệu</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Đảm bảo an toàn dữ liệu ca đoàn sau nhiều năm sử dụng, hỗ trợ nhập nhanh từ Excel cũ & xuất file backup.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backup & Restore JSON */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-stone-200 dark:border-slate-700 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Sao Lưu & Khôi Phục Toàn Bộ Hệ Thống</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Xuất file JSON lưu trên máy tính hoặc khôi phục dữ liệu đã sao lưu.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={handleExportJsonBackup}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow transition-all"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Tải File Backup (.json)</span>
            </button>

            <button
              onClick={() => jsonFileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all"
            >
              <Upload className="w-4 h-4 text-emerald-500" />
              <span>Khôi Phục Từ File Backup</span>
            </button>
            <input
              type="file"
              ref={jsonFileInputRef}
              onChange={handleImportJsonBackup}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* Excel Import & Export */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-stone-200 dark:border-slate-700 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Nhập / Xuất Bài Hát Bằng Excel</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Đưa thư viện bài hát từ file Excel cũ vào hệ thống hoặc xuất danh sách.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={handleExportSongsExcel}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Thư Viện (.xlsx)</span>
            </button>

            <button
              onClick={() => excelFileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all"
            >
              <Upload className="w-4 h-4 text-sky-500" />
              <span>Nhập File Excel Cũ</span>
            </button>
            <input
              type="file"
              ref={excelFileInputRef}
              onChange={handleImportSongsExcel}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Audit Log History */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-stone-200 dark:border-slate-700 space-y-3 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <History className="w-4 h-4 text-amber-500" />
          <span>Nhật Ký Thao Tác Hệ Thống (Audit Trail)</span>
        </h3>

        <div className="overflow-x-auto border border-stone-200 dark:border-slate-700 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-stone-100 dark:bg-slate-900 font-bold border-b border-stone-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Thời gian</th>
                <th className="p-3">Người thực hiện</th>
                <th className="p-3">Hành động</th>
                <th className="p-3">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-slate-700/60">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-stone-50 dark:hover:bg-slate-700/40">
                  <td className="p-3 font-mono text-amber-600 dark:text-amber-400 whitespace-nowrap">{log.timestamp}</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{log.user}</td>
                  <td className="p-3 font-semibold">{log.action}</td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
