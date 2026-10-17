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
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cloud,
  RefreshCw
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
  saveAppDataToFirestore, 
  subscribeToAppData,
  forceReloadAppDataFromFirestore,
  emailToUsername,
  tryAutoLogin
} from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  // Authentication & User Session State
  const [currentUser, setCurrentUser] = useState<{ username: string; displayName?: string } | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SAVED' | 'ERROR'>('IDLE');

  // App Data State (Synchronized with Cloud Firestore)
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

  // Track latest authoritative data in a mutable ref to completely prevent stale closure bugs
  const dataRef = useRef({ masses, songs, sheets });
  useEffect(() => {
    dataRef.current = { masses, songs, sheets };
  }, [masses, songs, sheets]);

  // Check Session on App Launch (Persistent Firebase Auth Session with Auto-Restore)
  useEffect(() => {
    let isMounted = true;
    setIsCheckingAuth(true);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      if (firebaseUser) {
        const username = emailToUsername(firebaseUser.email);
        setCurrentUser({
          username,
          displayName: username === 'admin' ? 'Ban Quản Trị' : (firebaseUser.displayName || username)
        });
        setIsCheckingAuth(false);
      } else {
        // If Firebase Auth returns null (initial load before restore or iframe partitioned storage),
        // check if user enabled "Ghi nhớ đăng nhập" and attempt automatic background restoration!
        try {
          const autoUser = await tryAutoLogin();
          if (!isMounted) return;
          if (autoUser) {
            setCurrentUser(autoUser);
          } else {
            setCurrentUser(null);
            setIsCloudSynced(false);
          }
        } catch (autoErr) {
          console.warn('[Auth] Auto-restore session error:', autoErr);
          if (isMounted) {
            setCurrentUser(null);
            setIsCloudSynced(false);
          }
        } finally {
          if (isMounted) {
            setIsCheckingAuth(false);
          }
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Real-Time Cloud Firestore Sync (Authoritative Multi-Device Live Sync)
  useEffect(() => {
    if (!currentUser) {
      setIsCloudSynced(false);
      return;
    }

    let isSubscribed = true;

    // Safety fallback: if offline or connection is delayed, unblock UI with local cache
    const syncTimeout = setTimeout(() => {
      if (isSubscribed) {
        setIsCloudSynced(true);
      }
    }, 3500);

    const unsubscribe = subscribeToAppData(
      async (cloudData) => {
        if (!isSubscribed) return;
        clearTimeout(syncTimeout);

        if (cloudData) {
          // Cloud has existing authoritative data
          dataRef.current = {
            masses: cloudData.masses,
            songs: cloudData.songs,
            sheets: cloudData.sheets
          };
          setMasses(cloudData.masses);
          setSongs(cloudData.songs);
          setSheets(cloudData.sheets);
          localStorage.setItem('cantus_so_tay_masses', JSON.stringify(cloudData.masses));
          localStorage.setItem('cantus_so_tay_songs', JSON.stringify(cloudData.songs));
          localStorage.setItem('cantus_so_tay_sheets', JSON.stringify(cloudData.sheets));
          setIsCloudSynced(true);
          setSyncStatus('SAVED');
        } else {
          // Document does not exist in Firestore yet: seed default initial data once
          try {
            await saveAppDataToFirestore({
              masses: INITIAL_MASSES,
              songs: INITIAL_SONGS,
              sheets: INITIAL_SHEETS
            });
            dataRef.current = {
              masses: INITIAL_MASSES,
              songs: INITIAL_SONGS,
              sheets: INITIAL_SHEETS
            };
            setMasses(INITIAL_MASSES);
            setSongs(INITIAL_SONGS);
            setSheets(INITIAL_SHEETS);
            localStorage.setItem('cantus_so_tay_masses', JSON.stringify(INITIAL_MASSES));
            localStorage.setItem('cantus_so_tay_songs', JSON.stringify(INITIAL_SONGS));
            localStorage.setItem('cantus_so_tay_sheets', JSON.stringify(INITIAL_SHEETS));
          } catch (seedErr) {
            console.warn('[Firestore] Seed warning:', seedErr);
          } finally {
            setIsCloudSynced(true);
            setSyncStatus('SAVED');
          }
        }
      },
      (err) => {
        console.warn('[Firestore] Sync warning:', err);
        clearTimeout(syncTimeout);
        setIsCloudSynced(true);
        setSyncStatus('ERROR');
      }
    );

    return () => {
      isSubscribed = false;
      clearTimeout(syncTimeout);
      unsubscribe();
    };
  }, [currentUser]);

  // Immediate Commit Helper to State & Cloud Firestore (Zero delay, Authoritative persistence)
  const commitAppData = async (newMasses: MassEvent[], newSongs: Song[], newSheets: SheetArchive[]) => {
    dataRef.current = { masses: newMasses, songs: newSongs, sheets: newSheets };
    setMasses(newMasses);
    setSongs(newSongs);
    setSheets(newSheets);
    localStorage.setItem('cantus_so_tay_masses', JSON.stringify(newMasses));
    localStorage.setItem('cantus_so_tay_songs', JSON.stringify(newSongs));
    localStorage.setItem('cantus_so_tay_sheets', JSON.stringify(newSheets));

    if (currentUser) {
      try {
        setSyncStatus('SYNCING');
        await saveAppDataToFirestore({ masses: newMasses, songs: newSongs, sheets: newSheets });
        setSyncStatus('SAVED');
      } catch (err) {
        console.error('[Data] Commit to Firestore failed:', err);
        setSyncStatus('ERROR');
        throw err;
      }
    }
  };

  // Direct manual authoritative reload from Cloud Firestore
  const handleForceReloadCloud = async () => {
    try {
      setSyncStatus('SYNCING');
      const data = await forceReloadAppDataFromFirestore();
      if (data) {
        dataRef.current = {
          masses: data.masses || [],
          songs: data.songs || [],
          sheets: data.sheets || []
        };
        setMasses(data.masses || []);
        setSongs(data.songs || []);
        setSheets(data.sheets || []);
        localStorage.setItem('cantus_so_tay_masses', JSON.stringify(data.masses || []));
        localStorage.setItem('cantus_so_tay_songs', JSON.stringify(data.songs || []));
        localStorage.setItem('cantus_so_tay_sheets', JSON.stringify(data.sheets || []));
      }
      setSyncStatus('SAVED');
    } catch (e) {
      console.error('[Sync] Force reload error:', e);
      setSyncStatus('ERROR');
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
      setIsCloudSynced(false);
      localStorage.removeItem('cantus_so_tay_masses');
      localStorage.removeItem('cantus_so_tay_songs');
      localStorage.removeItem('cantus_so_tay_sheets');
      setMasses(INITIAL_MASSES);
      setSongs(INITIAL_SONGS);
      setSheets(INITIAL_SHEETS);
    }
  };

  // Active Navigation Tab: 'MASSES' | 'SONGS' | 'SHEETS' | 'SETTINGS'
  const [activeTab, setActiveTab] = useState<'MASSES' | 'SONGS' | 'SHEETS' | 'SETTINGS'>('MASSES');

  // Search & Print Modals
  const [pdfPrintMass, setPdfPrintMass] = useState<MassEvent | null>(null);

  // SAVE MASS PROGRAM
  const handleSaveMass = async (updatedMass: MassEvent, newSongsToCreate?: Song[]) => {
    const current = dataRef.current;
    let updatedSongs = [...current.songs];
    if (newSongsToCreate && newSongsToCreate.length > 0) {
      const existingTitles = new Set(current.songs.map(s => s.title.toLowerCase().trim()));
      const uniqueNew = newSongsToCreate.filter(ns => !existingTitles.has(ns.title.toLowerCase().trim()));
      if (uniqueNew.length > 0) {
        updatedSongs = [...uniqueNew, ...current.songs];
      }
    }

    const idx = current.masses.findIndex(m => m.id === updatedMass.id);
    const updatedMasses = idx >= 0
      ? current.masses.map((m, i) => (i === idx ? updatedMass : m))
      : [updatedMass, ...current.masses];

    await commitAppData(updatedMasses, updatedSongs, current.sheets);
  };

  // DELETE MASS (Immediately persisted to Firestore)
  const handleDeleteMass = async (id: string) => {
    const current = dataRef.current;
    const updatedMasses = current.masses.filter(m => m.id !== id);
    await commitAppData(updatedMasses, current.songs, current.sheets);
  };

  // DUPLICATE MASS
  const handleDuplicateMass = async (source: MassEvent, newDate: string) => {
    const current = dataRef.current;
    const duplicated: MassEvent = {
      ...JSON.parse(JSON.stringify(source)),
      id: 'm-' + Date.now(),
      date: newDate,
      title: source.title + ' (Bản sao)',
      status: 'DRAFT',
      createdAt: new Date().toISOString()
    };
    await commitAppData([duplicated, ...current.masses], current.songs, current.sheets);
  };

  // SAVE / DELETE SONG
  const handleSaveSong = async (song: Song) => {
    const current = dataRef.current;
    const idx = current.songs.findIndex(s => s.id === song.id);
    const updatedSongs = idx >= 0
      ? current.songs.map((s, i) => (i === idx ? song : s))
      : [song, ...current.songs];
    await commitAppData(current.masses, updatedSongs, current.sheets);
  };

  const handleDeleteSong = async (id: string) => {
    const current = dataRef.current;
    const updatedSongs = current.songs.filter(s => s.id !== id);
    await commitAppData(current.masses, updatedSongs, current.sheets);
  };

  // SAVE / DELETE SHEET
  const handleSaveSheet = async (sheet: SheetArchive, newSongToCreate?: Song) => {
    const current = dataRef.current;
    let updatedSongs = [...current.songs];
    if (newSongToCreate) {
      const idx = current.songs.findIndex(s => s.id === newSongToCreate.id);
      updatedSongs = idx >= 0
        ? current.songs.map((s, i) => (i === idx ? newSongToCreate : s))
        : [newSongToCreate, ...current.songs];
    }
    const idx = current.sheets.findIndex(s => s.id === sheet.id);
    const updatedSheets = idx >= 0
      ? current.sheets.map((s, i) => (i === idx ? sheet : s))
      : [sheet, ...current.sheets];
    await commitAppData(current.masses, updatedSongs, updatedSheets);
  };

  const handleDeleteSheet = async (id: string) => {
    const current = dataRef.current;
    const updatedSheets = current.sheets.filter(s => s.id !== id);
    await commitAppData(current.masses, current.songs, updatedSheets);
  };

  // RESTORE FULL DATA
  const handleRestoreData = async (restored: { masses: MassEvent[]; songs: Song[]; sheets: SheetArchive[] }, mode: 'REPLACE' | 'MERGE') => {
    const current = dataRef.current;
    const newMasses = mode === 'REPLACE' ? (restored.masses || []) : [...(restored.masses || []), ...current.masses];
    const newSongs = mode === 'REPLACE' ? (restored.songs || []) : [...(restored.songs || []), ...current.songs];
    const newSheets = mode === 'REPLACE' ? (restored.sheets || []) : [...(restored.sheets || []), ...current.sheets];
    await commitAppData(newMasses, newSongs, newSheets);
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
              Đang xác thực &amp; khôi phục phiên làm việc...
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

  // 3. WAIT FOR INITIAL CLOUD SYNC SO DEVICES NEVER OPERATE ON STALE LOCAL DATA
  if (!isCloudSynced) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4 antialiased">
        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-lg text-center space-y-4 max-w-sm w-full">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-900 text-amber-300 shadow-md ring-4 ring-amber-400/20 mx-auto">
            <Cross className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900 font-serif">CANTUS</h2>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
              Đang tải dữ liệu từ Cloud Firestore...
            </p>
          </div>
          <div className="w-6 h-6 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Statistics
  const confirmedMassesCount = masses.filter(m => m.status === 'APPROVED' || m.status === 'USED').length;

  return (
    <div className="h-screen flex flex-col bg-stone-100/80 text-slate-900 font-sans antialiased selection:bg-amber-300 selection:text-slate-900 overflow-hidden">
      
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

            {/* Logged User Badge & Real-time Cloud Sync Status */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Cloud Sync Status Indicator & Manual Force Reload */}
              <div className="flex items-center gap-1.5">
                {syncStatus === 'SYNCING' && (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-xl">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                    <span className="hidden sm:inline">Đang lưu Cloud...</span>
                  </span>
                )}
                {syncStatus === 'SAVED' && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Đã lưu Cloud</span>
                  </span>
                )}
                {syncStatus === 'ERROR' && (
                  <span className="flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded-xl" title="Không thể lưu vào Firestore">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span className="hidden sm:inline">Lỗi đồng bộ</span>
                  </span>
                )}
                
                <button
                  onClick={handleForceReloadCloud}
                  title="Làm mới dữ liệu từ Cloud Firestore"
                  className="p-1.5 text-stone-500 hover:text-indigo-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'SYNCING' ? 'animate-spin text-indigo-600' : ''}`} />
                </button>
              </div>

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

          <div className="text-stone-500 font-medium text-[11px] sm:text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Đồng bộ dữ liệu Cloud Firestore</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Area - No vertical page scroll */}
      <main className="flex-1 w-full max-w-[1680px] mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-3 flex flex-col min-h-0 overflow-hidden pb-14 md:pb-1">
        
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
