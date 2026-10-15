import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Music, 
  FolderArchive, 
  Settings, 
  Search, 
  Plus, 
  Printer, 
  Sparkles,
  BookOpen,
  Cross,
  Clock,
  Layers,
  ChevronDown,
  User,
  LogOut,
  ShieldCheck
} from 'lucide-react';

import { INITIAL_SONGS, INITIAL_MASSES, INITIAL_SHEETS } from './data/initialData';
import { Song, MassEvent, SheetArchive } from './types/cantus';

import { MassProgramList } from './components/MassProgramList';
import { SongLibraryModule } from './components/SongLibraryModule';
import { SheetMusicModule } from './components/SheetMusicModule';
import { SettingsModule } from './components/SettingsModule';
import { PdfPrintView } from './components/PdfPrintView';
import { LoginView } from './components/LoginView';

export default function App() {
  // Authentication & User Session State
  const [currentUser, setCurrentUser] = useState<{ username: string; displayName?: string } | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // App Data State (Synchronized with Backend / Firestore)
  const [masses, setMasses] = useState<MassEvent[]>(() => {
    const saved = localStorage.getItem('cantus_so_tay_masses');
    return saved ? JSON.parse(saved) : INITIAL_MASSES;
  });

  const [songs, setSongs] = useState<Song[]>(() => {
    const saved = localStorage.getItem('cantus_so_tay_songs');
    return saved ? JSON.parse(saved) : INITIAL_SONGS;
  });

  const [sheets, setSheets] = useState<SheetArchive[]>(() => {
    const saved = localStorage.getItem('cantus_so_tay_sheets');
    return saved ? JSON.parse(saved) : INITIAL_SHEETS;
  });

  // Track initial load to prevent overwriting cloud data on startup
  const isDataLoadedRef = useRef(false);

  // Check Session on App Launch (Persistent 30-day session)
  useEffect(() => {
    async function checkAuthSession() {
      setIsCheckingAuth(true);
      try {
        const token = localStorage.getItem('cantus_session_token');
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/auth/me', { headers });
        const data = await res.json();

        if (res.ok && data.authenticated && data.user) {
          setCurrentUser(data.user);
          if (data.token) {
            localStorage.setItem('cantus_session_token', data.token);
          }
          // Load data from backend / Firestore
          await loadAppData(data.token || token);
        } else {
          setCurrentUser(null);
          localStorage.removeItem('cantus_session_token');
        }
      } catch (e) {
        console.error('[Auth] Session check failed:', e);
        setCurrentUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    }

    checkAuthSession();
  }, []);

  // Fetch Cloud / Firestore Data upon Successful Login
  const loadAppData = async (authToken?: string) => {
    try {
      const token = authToken || localStorage.getItem('cantus_session_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/data/load', { headers });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          if (result.data.masses && result.data.masses.length > 0) {
            setMasses(result.data.masses);
          }
          if (result.data.songs && result.data.songs.length > 0) {
            setSongs(result.data.songs);
          }
          if (result.data.sheets && result.data.sheets.length > 0) {
            setSheets(result.data.sheets);
          }
        }
      }
    } catch (err) {
      console.error('[Data] Load backend app data error:', err);
    } finally {
      isDataLoadedRef.current = true;
    }
  };

  // Sync Local Data Changes to Backend / Firestore
  useEffect(() => {
    if (!currentUser || !isDataLoadedRef.current) return;

    localStorage.setItem('cantus_so_tay_masses', JSON.stringify(masses));
    localStorage.setItem('cantus_so_tay_songs', JSON.stringify(songs));
    localStorage.setItem('cantus_so_tay_sheets', JSON.stringify(sheets));

    const timeoutId = setTimeout(async () => {
      try {
        const token = localStorage.getItem('cantus_session_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        await fetch('/api/data/save', {
          method: 'POST',
          headers,
          body: JSON.stringify({ masses, songs, sheets })
        });
      } catch (e) {
        console.error('[Data] Cloud sync save failed:', e);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [masses, songs, sheets, currentUser]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('cantus_session_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      await fetch('/api/auth/logout', { method: 'POST', headers });
    } catch (e) {
      console.error('[Auth] Logout error:', e);
    } finally {
      localStorage.removeItem('cantus_session_token');
      setCurrentUser(null);
    }
  };

  // Active Navigation Tab: 'MASSES' | 'SONGS' | 'SHEETS' | 'SETTINGS'
  const [activeTab, setActiveTab] = useState<'MASSES' | 'SONGS' | 'SHEETS' | 'SETTINGS'>('MASSES');

  // Search & Print Modals
  const [pdfPrintMass, setPdfPrintMass] = useState<MassEvent | null>(null);

  // SAVE MASS PROGRAM (with Combined Song Creation Logic!)
  const handleSaveMass = (updatedMass: MassEvent, newSongsToCreate?: Song[]) => {
    if (newSongsToCreate && newSongsToCreate.length > 0) {
      setSongs(prev => {
        const existingTitles = new Set(prev.map(s => s.title.toLowerCase().trim()));
        const uniqueNew = newSongsToCreate.filter(ns => !existingTitles.has(ns.title.toLowerCase().trim()));
        return [...uniqueNew, ...prev];
      });
    }

    setMasses(prev => {
      const idx = prev.findIndex(m => m.id === updatedMass.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedMass;
        return copy;
      }
      return [updatedMass, ...prev];
    });
  };

  // DELETE MASS
  const handleDeleteMass = (id: string) => {
    setMasses(prev => prev.filter(m => m.id !== id));
  };

  // DUPLICATE MASS
  const handleDuplicateMass = (source: MassEvent, newDate: string) => {
    const duplicated: MassEvent = {
      ...JSON.parse(JSON.stringify(source)),
      id: 'm-' + Date.now(),
      date: newDate,
      title: source.title + ' (Bản sao)',
      status: 'DRAFT',
      createdAt: new Date().toISOString()
    };
    setMasses(prev => [duplicated, ...prev]);
  };

  // SAVE / DELETE SONG
  const handleSaveSong = (song: Song) => {
    setSongs(prev => {
      const idx = prev.findIndex(s => s.id === song.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = song;
        return copy;
      }
      return [song, ...prev];
    });
  };

  const handleDeleteSong = (id: string) => {
    setSongs(prev => prev.filter(s => s.id !== id));
  };

  // SAVE / DELETE SHEET
  const handleSaveSheet = (sheet: SheetArchive, newSongToCreate?: Song) => {
    if (newSongToCreate) {
      handleSaveSong(newSongToCreate);
    }
    setSheets(prev => {
      const idx = prev.findIndex(s => s.id === sheet.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = sheet;
        return copy;
      }
      return [sheet, ...prev];
    });
  };

  const handleDeleteSheet = (id: string) => {
    setSheets(prev => prev.filter(s => s.id !== id));
  };

  // RESTORE FULL DATA
  const handleRestoreData = (restored: { masses: MassEvent[]; songs: Song[]; sheets: SheetArchive[] }, mode: 'REPLACE' | 'MERGE') => {
    if (mode === 'REPLACE') {
      if (restored.masses) setMasses(restored.masses);
      if (restored.songs) setSongs(restored.songs);
      if (restored.sheets) setSheets(restored.sheets);
    } else {
      if (restored.masses) setMasses(prev => [...restored.masses, ...prev]);
      if (restored.songs) setSongs(prev => [...restored.songs, ...prev]);
      if (restored.sheets) setSheets(prev => [...restored.sheets, ...prev]);
    }
  };

  // 1. SHOW LOADING SCREEN WHILE VERIFYING 30-DAY SESSION
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4 antialiased">
        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-lg text-center space-y-4 max-w-sm w-full">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-900 text-amber-300 shadow-md ring-4 ring-amber-400/20">
            <Cross className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900 font-serif">CANTUS</h2>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
              Đang xác thực phiên đăng nhập...
            </p>
          </div>
          <div className="w-6 h-6 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // 2. UNAUTHENTICATED USERS ARE BLOCKED AND SHOWN ONLY LOGIN SCREEN
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          loadAppData();
        }}
      />
    );
  }

  // Statistics
  const confirmedMassesCount = masses.filter(m => m.status === 'APPROVED' || m.status === 'USED').length;

  return (
    <div className="min-h-screen md:h-screen flex flex-col bg-stone-100/70 text-slate-900 font-sans antialiased selection:bg-amber-300 selection:text-slate-900 pb-20 md:pb-2 md:overflow-hidden">
      
      {/* Compact Light Sacred Top Banner & Header Navigation */}
      <header className="shrink-0 bg-white border-b border-stone-200 shadow-xs z-40">
        {/* Top Gold Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />
        
        <div className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between gap-3">
            
            {/* Logo & Brand Title */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-800 to-indigo-950 text-amber-300 font-extrabold flex items-center justify-center text-lg shadow-xs shrink-0 border border-indigo-700/50">
                <Cross className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-xl tracking-tight text-slate-900 flex items-center gap-1.5">
                    <span>CANTUS</span>
                  </h1>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Sổ Tay Thánh Ca
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 font-medium hidden sm:block">
                  Chương trình Thánh lễ &amp; Tra cứu Lịch hát
                </p>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <div className="hidden md:flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs sm:text-sm font-semibold">
              <button
                onClick={() => setActiveTab('MASSES')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'MASSES' 
                    ? 'bg-indigo-700 text-white shadow-xs' 
                    : 'text-stone-700 hover:text-slate-900 hover:bg-stone-200/70'
                }`}
              >
                <Calendar className="w-4 h-4 stroke-[2.2]" />
                <span>Chương Trình Thánh Lễ</span>
              </button>

              <button
                onClick={() => setActiveTab('SONGS')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'SONGS' 
                    ? 'bg-indigo-700 text-white shadow-xs' 
                    : 'text-stone-700 hover:text-slate-900 hover:bg-stone-200/70'
                }`}
              >
                <Music className="w-4 h-4 stroke-[2.2]" />
                <span>Kho Bài Hát</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'SONGS' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                }`}>
                  {songs.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('SHEETS')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'SHEETS' 
                    ? 'bg-indigo-700 text-white shadow-xs' 
                    : 'text-stone-700 hover:text-slate-900 hover:bg-stone-200/70'
                }`}
              >
                <FolderArchive className="w-4 h-4 stroke-[2.2]" />
                <span>Kho Bản Nhạc In</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'SHEETS' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                }`}>
                  {sheets.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('SETTINGS')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'SETTINGS' 
                    ? 'bg-indigo-700 text-white shadow-xs' 
                    : 'text-stone-700 hover:text-slate-900 hover:bg-stone-200/70'
                }`}
                title="Cài đặt & Sao lưu dữ liệu"
              >
                <Settings className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>

            {/* Liturgical Season Tag & Logged User Badge */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-900 hidden lg:flex">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Mùa: <strong>Thường Niên</strong></span>
              </div>

              {/* Logged-in User Profile Pill */}
              <div className="flex items-center gap-2 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-xl text-xs font-bold text-stone-800">
                <User className="w-3.5 h-3.5 text-indigo-700" />
                <span className="max-w-[100px] sm:max-w-[140px] truncate">{currentUser.displayName || currentUser.username}</span>
                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-1 text-stone-400 hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Compact Quick Stats Bar */}
      <div className="shrink-0 bg-stone-50 border-b border-stone-200/80 py-1.5 px-4 sm:px-6 lg:px-8 text-xs font-semibold text-stone-600">
        <div className="max-w-[1650px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center flex-wrap gap-4">
            <span>Thánh lễ: <strong className="text-slate-900">{masses.length}</strong></span>
            <span className="text-stone-300">•</span>
            <span>Đã chốt: <strong className="text-emerald-700">{confirmedMassesCount}</strong></span>
            <span className="text-stone-300 hidden sm:inline">•</span>
            <span className="hidden sm:inline">Bài hát: <strong className="text-slate-900">{songs.length}</strong></span>
            <span className="text-stone-300 hidden sm:inline">•</span>
            <span className="hidden sm:inline">Bản in: <strong className="text-slate-900">{sheets.length}</strong></span>
          </div>

          <div className="text-stone-500 font-medium text-[11px] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Đã bảo vệ phiên đăng nhập (30 ngày) &amp; Đồng bộ Firestore</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <main className="flex-1 w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex flex-col min-h-0 md:overflow-hidden">
        
        {/* TAB 1: Chương trình Thánh lễ */}
        {activeTab === 'MASSES' && (
          <MassProgramList
            masses={masses}
            songs={songs}
            onSaveMass={handleSaveMass}
            onDeleteMass={handleDeleteMass}
            onDuplicateMass={handleDuplicateMass}
            onOpenPdfPrint={(m) => setPdfPrintMass(m)}
          />
        )}

        {/* TAB 2: Kho Bài Hát */}
        {activeTab === 'SONGS' && (
          <SongLibraryModule
            songs={songs}
            masses={masses}
            onSaveSong={handleSaveSong}
            onDeleteSong={handleDeleteSong}
            onNavigateToMass={(mId) => setActiveTab('MASSES')}
          />
        )}

        {/* TAB 3: Kho Bản Nhạc In */}
        {activeTab === 'SHEETS' && (
          <SheetMusicModule
            sheets={sheets}
            songs={songs}
            onSaveSheet={handleSaveSheet}
            onDeleteSheet={handleDeleteSheet}
          />
        )}

        {/* TAB 4: Cài Đặt & Sao Lưu */}
        {activeTab === 'SETTINGS' && (
          <SettingsModule
            userEmail={currentUser.username}
            masses={masses}
            songs={songs}
            sheets={sheets}
            onRestoreData={handleRestoreData}
            onLogout={handleLogout}
          />
        )}

      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 z-50 px-2 py-2 shadow-2xl">
        <div className="flex items-center justify-around text-[11px] font-bold">
          
          <button
            onClick={() => setActiveTab('MASSES')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg transition-all ${
              activeTab === 'MASSES' ? 'text-amber-400 bg-slate-900' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Calendar className="w-5 h-5 stroke-[2.2]" />
            <span>Thánh Lễ</span>
          </button>

          <button
            onClick={() => setActiveTab('SONGS')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg transition-all ${
              activeTab === 'SONGS' ? 'text-amber-400 bg-slate-900' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Music className="w-5 h-5 stroke-[2.2]" />
            <span>Kho Bài Hát</span>
          </button>

          <button
            onClick={() => setActiveTab('SHEETS')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg transition-all ${
              activeTab === 'SHEETS' ? 'text-amber-400 bg-slate-900' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <FolderArchive className="w-5 h-5 stroke-[2.2]" />
            <span>Bản Nhạc In</span>
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg transition-all ${
              activeTab === 'SETTINGS' ? 'text-amber-400 bg-slate-900' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Settings className="w-5 h-5 stroke-[2.2]" />
            <span>Cài Đặt</span>
          </button>

        </div>
      </nav>

      {/* Printable A4 PDF Sheet View Modal */}
      {pdfPrintMass && (
        <PdfPrintView
          mass={pdfPrintMass}
          onClose={() => setPdfPrintMass(null)}
        />
      )}

    </div>
  );
}
