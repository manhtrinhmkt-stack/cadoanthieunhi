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
import { 
  auth, 
  logoutUser, 
  loadAppDataFromFirestore, 
  saveAppDataToFirestore, 
  subscribeToAppData,
  emailToUsername 
} from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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

  // Check Session on App Launch (Persistent Firebase Auth Session)
  useEffect(() => {
    setIsCheckingAuth(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const username = emailToUsername(firebaseUser.email);
        setCurrentUser({
          username,
          displayName: username === 'admin' ? 'Ban Quản Trị' : (firebaseUser.displayName || username)
        });
      } else {
        setCurrentUser(null);
        isDataLoadedRef.current = false;
      }
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-Time Cloud Firestore Sync (Multi-Device Live Sync)
  useEffect(() => {
    if (!currentUser) return;

    // Listen to real-time changes across devices
    const unsubscribe = subscribeToAppData(
      (data) => {
        setMasses(data.masses);
        setSongs(data.songs);
        setSheets(data.sheets);
        localStorage.setItem('cantus_so_tay_masses', JSON.stringify(data.masses));
        localStorage.setItem('cantus_so_tay_songs', JSON.stringify(data.songs));
        localStorage.setItem('cantus_so_tay_sheets', JSON.stringify(data.sheets));
        isDataLoadedRef.current = true;
      },
      (err) => {
        console.warn('[Firestore] Sync warning:', err);
      }
    );

    // Initial check: if database has never been initialized, seed it once
    loadAppDataFromFirestore()
      .then(async (existingData) => {
        if (!existingData) {
          await saveAppDataToFirestore({ masses, songs, sheets });
        }
      })
      .catch((e) => console.warn('[Firestore] Initial check warning:', e));

    return () => unsubscribe();
  }, [currentUser]);

  // Immediate Commit Helper to State & Cloud Firestore (Zero delay, No cancel on reload)
  const commitAppData = async (newMasses: MassEvent[], newSongs: Song[], newSheets: SheetArchive[]) => {
    setMasses(newMasses);
    setSongs(newSongs);
    setSheets(newSheets);
    localStorage.setItem('cantus_so_tay_masses', JSON.stringify(newMasses));
    localStorage.setItem('cantus_so_tay_songs', JSON.stringify(newSongs));
    localStorage.setItem('cantus_so_tay_sheets', JSON.stringify(newSheets));

    if (currentUser) {
      try {
        await saveAppDataToFirestore({ masses: newMasses, songs: newSongs, sheets: newSheets });
      } catch (err) {
        console.error('[Data] Commit to Firestore failed:', err);
      }
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error('[Auth] Logout error:', e);
    } finally {
      setCurrentUser(null);
      isDataLoadedRef.current = false;
    }
  };

  // Active Navigation Tab: 'MASSES' | 'SONGS' | 'SHEETS' | 'SETTINGS'
  const [activeTab, setActiveTab] = useState<'MASSES' | 'SONGS' | 'SHEETS' | 'SETTINGS'>('MASSES');

  // Search & Print Modals
  const [pdfPrintMass, setPdfPrintMass] = useState<MassEvent | null>(null);

  // SAVE MASS PROGRAM
  const handleSaveMass = (updatedMass: MassEvent, newSongsToCreate?: Song[]) => {
    let updatedSongs = [...songs];
    if (newSongsToCreate && newSongsToCreate.length > 0) {
      const existingTitles = new Set(songs.map(s => s.title.toLowerCase().trim()));
      const uniqueNew = newSongsToCreate.filter(ns => !existingTitles.has(ns.title.toLowerCase().trim()));
      if (uniqueNew.length > 0) {
        updatedSongs = [...uniqueNew, ...songs];
      }
    }

    const idx = masses.findIndex(m => m.id === updatedMass.id);
    const updatedMasses = idx >= 0
      ? masses.map((m, i) => (i === idx ? updatedMass : m))
      : [updatedMass, ...masses];

    commitAppData(updatedMasses, updatedSongs, sheets);
  };

  // DELETE MASS (Immediately persisted to Firestore)
  const handleDeleteMass = (id: string) => {
    const updatedMasses = masses.filter(m => m.id !== id);
    commitAppData(updatedMasses, songs, sheets);
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
    commitAppData([duplicated, ...masses], songs, sheets);
  };

  // SAVE / DELETE SONG
  const handleSaveSong = (song: Song) => {
    const idx = songs.findIndex(s => s.id === song.id);
    const updatedSongs = idx >= 0
      ? songs.map((s, i) => (i === idx ? song : s))
      : [song, ...songs];
    commitAppData(masses, updatedSongs, sheets);
  };

  const handleDeleteSong = (id: string) => {
    const updatedSongs = songs.filter(s => s.id !== id);
    commitAppData(masses, updatedSongs, sheets);
  };

  // SAVE / DELETE SHEET
  const handleSaveSheet = (sheet: SheetArchive, newSongToCreate?: Song) => {
    let updatedSongs = [...songs];
    if (newSongToCreate) {
      const idx = songs.findIndex(s => s.id === newSongToCreate.id);
      updatedSongs = idx >= 0
        ? songs.map((s, i) => (i === idx ? newSongToCreate : s))
        : [newSongToCreate, ...songs];
    }
    const idx = sheets.findIndex(s => s.id === sheet.id);
    const updatedSheets = idx >= 0
      ? sheets.map((s, i) => (i === idx ? sheet : s))
      : [sheet, ...sheets];
    commitAppData(masses, updatedSongs, updatedSheets);
  };

  const handleDeleteSheet = (id: string) => {
    const updatedSheets = sheets.filter(s => s.id !== id);
    commitAppData(masses, songs, updatedSheets);
  };

  // RESTORE FULL DATA
  const handleRestoreData = (restored: { masses: MassEvent[]; songs: Song[]; sheets: SheetArchive[] }, mode: 'REPLACE' | 'MERGE') => {
    const newMasses = mode === 'REPLACE' ? (restored.masses || []) : [...(restored.masses || []), ...masses];
    const newSongs = mode === 'REPLACE' ? (restored.songs || []) : [...(restored.songs || []), ...songs];
    const newSheets = mode === 'REPLACE' ? (restored.sheets || []) : [...(restored.sheets || []), ...sheets];
    commitAppData(newMasses, newSongs, newSheets);
  };

  // 1. SHOW LOADING SCREEN WHILE VERIFYING SESSION
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4 antialiased">
        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-lg text-center space-y-4 max-w-sm w-full">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-900 text-amber-300 shadow-md ring-4 ring-amber-400/20 mx-auto">
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

  // 2. UNAUTHENTICATED USERS ARE SHOWN LOGIN SCREEN
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  // Statistics
  const confirmedMassesCount = masses.filter(m => m.status === 'APPROVED' || m.status === 'USED').length;

  return (
    <div className="min-h-screen md:h-screen flex flex-col bg-stone-100/80 text-slate-900 font-sans antialiased selection:bg-amber-300 selection:text-slate-900 pb-28 md:pb-2 md:overflow-hidden">
      
      {/* Compact Responsive Sacred Top Header Navigation */}
      <header className="shrink-0 bg-white border-b border-stone-200 shadow-2xs z-40 sticky top-0 md:static">
        {/* Top Gold Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />
        
        <div className="max-w-[1650px] mx-auto px-3 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            
            {/* Logo & Brand Title */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-indigo-800 to-indigo-950 text-amber-300 font-extrabold flex items-center justify-center text-base sm:text-lg shadow-2xs shrink-0 border border-indigo-700/50">
                <Cross className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="font-black text-lg sm:text-xl tracking-tight text-slate-900">
                    CANTUS
                  </h1>
                  <span className="text-[9px] sm:text-[10px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-200 px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                    Sổ Tay Thánh Ca
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-stone-500 font-medium hidden sm:block">
                  Chương trình Thánh lễ &amp; Tra cứu Lịch hát
                </p>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <div className="hidden md:flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs sm:text-sm font-semibold">
              <button
                onClick={() => setActiveTab('MASSES')}
                className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'MASSES' 
                    ? 'bg-indigo-700 text-white shadow-2xs' 
                    : 'text-stone-700 hover:text-slate-900 hover:bg-stone-200/70'
                }`}
              >
                <Calendar className="w-4 h-4 stroke-[2.2]" />
                <span>Chương Trình Thánh Lễ</span>
              </button>

              <button
                onClick={() => setActiveTab('SONGS')}
                className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'SONGS' 
                    ? 'bg-indigo-700 text-white shadow-2xs' 
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
                className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'SHEETS' 
                    ? 'bg-indigo-700 text-white shadow-2xs' 
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
                className={`flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'SETTINGS' 
                    ? 'bg-indigo-700 text-white shadow-2xs' 
                    : 'text-stone-700 hover:text-slate-900 hover:bg-stone-200/70'
                }`}
                title="Cài đặt & Sao lưu dữ liệu"
              >
                <Settings className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>

            {/* Logged User Badge & Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-stone-100 border border-stone-200 px-2 sm:px-2.5 py-1 rounded-xl text-xs font-bold text-stone-800">
                <User className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                <span className="max-w-[80px] sm:max-w-[140px] truncate">{currentUser.displayName || currentUser.username}</span>
                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-1 text-stone-400 hover:text-rose-600 transition-colors ml-0.5 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Compact Mobile-Friendly Quick Stats Bar */}
      <div className="shrink-0 bg-stone-50/90 border-b border-stone-200/80 py-1.5 px-3 sm:px-6 lg:px-8 text-[11px] sm:text-xs font-semibold text-stone-600 overflow-x-auto whitespace-nowrap">
        <div className="max-w-[1650px] mx-auto flex items-center justify-between gap-3 min-w-max sm:min-w-0">
          <div className="flex items-center gap-3">
            <span>Thánh lễ: <strong className="text-slate-900">{masses.length}</strong></span>
            <span className="text-stone-300">•</span>
            <span>Đã chốt: <strong className="text-emerald-700">{confirmedMassesCount}</strong></span>
            <span className="text-stone-300">•</span>
            <span>Bài hát: <strong className="text-slate-900">{songs.length}</strong></span>
            <span className="text-stone-300">•</span>
            <span>Bản in: <strong className="text-slate-900">{sheets.length}</strong></span>
          </div>

          <div className="text-stone-500 font-medium text-[10px] sm:text-[11px] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Phiên 30 ngày &amp; Đồng bộ Cloud</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <main className="flex-1 w-full max-w-[1680px] mx-auto px-2.5 sm:px-6 lg:px-8 py-2.5 sm:py-4 flex flex-col min-h-0 md:overflow-hidden">
        
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

      {/* Touch-Friendly Mobile Bottom Navigation Bar (Natural Thumb Zone) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 z-50 px-2 pt-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex items-center justify-around text-[10px] font-bold">
          
          <button
            onClick={() => setActiveTab('MASSES')}
            className={`min-h-[44px] flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'MASSES' ? 'text-amber-300 bg-slate-900/90 shadow-2xs font-extrabold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Calendar className="w-5 h-5 stroke-[2.2]" />
            <span>Thánh Lễ</span>
          </button>

          <button
            onClick={() => setActiveTab('SONGS')}
            className={`min-h-[44px] flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'SONGS' ? 'text-amber-300 bg-slate-900/90 shadow-2xs font-extrabold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Music className="w-5 h-5 stroke-[2.2]" />
            <span>Kho Bài Hát</span>
          </button>

          <button
            onClick={() => setActiveTab('SHEETS')}
            className={`min-h-[44px] flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'SHEETS' ? 'text-amber-300 bg-slate-900/90 shadow-2xs font-extrabold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <FolderArchive className="w-5 h-5 stroke-[2.2]" />
            <span>Bản Nhạc In</span>
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`min-h-[44px] flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'SETTINGS' ? 'text-amber-300 bg-slate-900/90 shadow-2xs font-extrabold' : 'text-stone-400 hover:text-stone-200'
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
