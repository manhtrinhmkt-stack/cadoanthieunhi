import React from 'react';
import { 
  Calendar, 
  FileText, 
  Music, 
  FolderArchive, 
  Users, 
  BarChart3, 
  Settings, 
  PlayCircle, 
  Sparkles, 
  Plus, 
  Search,
  BookOpen
} from 'lucide-react';

interface HeaderNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenRehearsalMode: () => void;
  onOpenNewMassModal: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenRehearsalMode,
  onOpenNewMassModal,
  searchQuery,
  setSearchQuery,
}) => {
  const navItems = [
    { id: 'calendar', label: '01. Lịch Thánh lễ', icon: Calendar },
    { id: 'program', label: '02. Chương trình Thánh ca', icon: FileText },
    { id: 'library', label: '03. Thư viện bài hát', icon: Music },
    { id: 'inventory', label: '04. Kho bản nhạc in', icon: FolderArchive },
    { id: 'personnel', label: '05. Nhân sự & Tập hát', icon: Users },
    { id: 'stats', label: '06. Tra cứu & Thống kê', icon: BarChart3 },
    { id: 'settings', label: '07. Cài đặt & Sao lưu', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-lg">
      {/* Top Branding & Main Action Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo and Subtitle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <button 
            onClick={() => setActiveTab('program')}
            className="flex items-center gap-3 text-left focus:outline-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-extrabold flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-amber-400">Cantus</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-medium border border-amber-500/30">
                  Năm Phụng Vụ 2026 - Năm B
                </span>
              </div>
              <p className="text-xs text-slate-400">Quản lý Thánh ca & Ca đoàn Công giáo</p>
            </div>
          </button>

          {/* Quick Rehearsal Mode Button on Mobile */}
          <button
            onClick={onOpenRehearsalMode}
            className="md:hidden flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium shadow transition-all"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Đang hát</span>
          </button>
        </div>

        {/* Global Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm bài hát, tác giả, Thánh lễ, mã in (HL-0025)..."
            className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        {/* Right CTA Actions */}
        <div className="hidden md:flex items-center gap-2.5">
          <button
            onClick={onOpenRehearsalMode}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs px-3.5 py-2 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
            title="Mở giao diện tối giản chữ lớn cho người đàn & điều khiển khi tập hát hoặc hát lễ"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Chế độ Tập / Đang hát</span>
          </button>

          <button
            onClick={onOpenNewMassModal}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs px-3.5 py-2 rounded-xl font-bold shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Thánh lễ mới</span>
          </button>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="bg-slate-950/80 border-t border-slate-800 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 sm:space-x-2 py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
