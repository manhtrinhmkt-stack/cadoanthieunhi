import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  onSnapshot,
  Firestore
} from 'firebase/firestore';
import defaultConfig from '../../firebase-applet-config.json';

// Support both compiled firebase-applet-config.json and VITE_ environment variables on Vercel
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultConfig.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain,
  firestoreDatabaseId: import.meta.env.VITE_FIRESTORE_DATABASE_ID || defaultConfig.firestoreDatabaseId || '(default)',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Ensure local persistence is active for long-lived sessions
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('[Firebase Auth] Persistence set warning:', err);
});

// Initialize Cloud Firestore with specified database ID
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test connection on boot according to skill guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'app_data', 'cantus_store'));
    return true;
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn('[Firestore] Client is offline. Please check network/Firebase configuration.');
    }
    return false;
  }
}

// -------------------------------------------------------------
// USERNAME TO TECHNICAL EMAIL MAPPING
// -------------------------------------------------------------
// Deterministic internal domain mapping for Firebase Authentication
// Ensures user only sees and enters "username" in UI while Firebase Auth securely validates passwords
export const INTERNAL_AUTH_DOMAIN = '@cantus.local';

export function usernameToEmail(username: string): string {
  const clean = username.trim().toLowerCase();
  if (clean.includes('@')) {
    return clean;
  }
  return `${clean}${INTERNAL_AUTH_DOMAIN}`;
}

export function emailToUsername(email: string | null | undefined): string {
  if (!email) return 'admin';
  if (email.endsWith(INTERNAL_AUTH_DOMAIN)) {
    return email.slice(0, -INTERNAL_AUTH_DOMAIN.length);
  }
  return email.split('@')[0];
}

// -------------------------------------------------------------
// AUTHENTICATION HELPERS & PERSISTENT REMEMBER-ME STORAGE
// -------------------------------------------------------------

export const SESSION_STORAGE_KEY = 'cantus_auth_session';
export const REMEMBERED_CRED_KEY = 'cantus_auth_remembered_cred';

function encodeCred(data: { u: string; p: string }): string {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  } catch {
    return btoa(JSON.stringify(data));
  }
}

function decodeCred(str: string): { u: string; p: string } | null {
  try {
    const json = decodeURIComponent(escape(atob(str)));
    return JSON.parse(json);
  } catch {
    try {
      return JSON.parse(atob(str));
    } catch {
      return null;
    }
  }
}

export function getSavedSession(): { username: string; displayName: string; rememberMe: boolean } | null {
  try {
    const local = localStorage.getItem(SESSION_STORAGE_KEY);
    if (local) return JSON.parse(local);
    const session = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (session) return JSON.parse(session);
  } catch (e) {
    console.warn('[Firebase Auth] Error reading saved session:', e);
  }
  return null;
}

export async function loginWithUsername(
  username: string, 
  password: string, 
  rememberMe: boolean = true
): Promise<{ username: string; displayName: string }> {
  const cleanUsername = username.trim().toLowerCase();
  const technicalEmail = usernameToEmail(cleanUsername);

  // Set persistent session according to user's "Ghi nhớ đăng nhập" choice
  try {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
  } catch (persErr) {
    console.warn('[Firebase Auth] Persistence configuration error:', persErr);
  }

  const credential = await signInWithEmailAndPassword(auth, technicalEmail, password);
  const user = credential.user;

  const resultUser = {
    username: cleanUsername,
    displayName: cleanUsername === 'admin' ? 'Ban Quản Trị' : (user.displayName || cleanUsername)
  };

  const sessionData = {
    username: cleanUsername,
    displayName: resultUser.displayName,
    rememberMe,
    savedAt: Date.now()
  };

  if (rememberMe) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    localStorage.setItem(REMEMBERED_CRED_KEY, encodeCred({ u: cleanUsername, p: password }));
    localStorage.setItem('cantus_saved_username', cleanUsername);
    localStorage.setItem('cantus_remember_me', 'true');
  } else {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(REMEMBERED_CRED_KEY);
    localStorage.setItem('cantus_remember_me', 'false');
  }

  return resultUser;
}

export async function tryAutoLogin(): Promise<{ username: string; displayName: string } | null> {
  // 1. If Firebase Auth already has active currentUser (e.g. from IndexedDB)
  if (auth.currentUser && auth.currentUser.email) {
    const cleanUsername = emailToUsername(auth.currentUser.email);
    return {
      username: cleanUsername,
      displayName: cleanUsername === 'admin' ? 'Ban Quản Trị' : (auth.currentUser.displayName || cleanUsername)
    };
  }

  // 2. Check if remembered credentials exist in localStorage (user checked "Ghi nhớ đăng nhập")
  const savedCredStr = localStorage.getItem(REMEMBERED_CRED_KEY);
  if (savedCredStr) {
    const cred = decodeCred(savedCredStr);
    if (cred && cred.u && cred.p) {
      try {
        console.log('[Firebase Auth] Khôi phục phiên đăng nhập từ ghi nhớ...');
        return await loginWithUsername(cred.u, cred.p, true);
      } catch (err: any) {
        console.warn('[Firebase Auth] Tự động đăng nhập từ bộ nhớ thất bại:', err);
        const code = err?.code || '';
        // If password was changed or user no longer valid, clear stale credentials
        if (code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
          localStorage.removeItem(REMEMBERED_CRED_KEY);
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    }
  }

  // 3. Fallback to saved session representation if exists
  const saved = getSavedSession();
  if (saved && saved.rememberMe) {
    return {
      username: saved.username,
      displayName: saved.displayName
    };
  }

  return null;
}

export async function logoutUser(): Promise<void> {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(REMEMBERED_CRED_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.warn('[Auth] Error clearing storage on logout:', e);
  }
  await signOut(auth);
}

export async function changeCurrentUserPassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('Bạn chưa đăng nhập hoặc phiên làm việc đã kết thúc.');
  }

  // Re-authenticate user before changing password
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);

  // If credentials were remembered, update with new password so auto-login continues working
  const savedCredStr = localStorage.getItem(REMEMBERED_CRED_KEY);
  if (savedCredStr) {
    const cred = decodeCred(savedCredStr);
    if (cred) {
      localStorage.setItem(REMEMBERED_CRED_KEY, encodeCred({ u: cred.u, p: newPassword }));
    }
  }
}

// -------------------------------------------------------------
// FIRESTORE APP DATA PERSISTENCE
// -------------------------------------------------------------

const APP_DATA_DOC = 'cantus_store';

export async function loadAppDataFromFirestore(): Promise<{ masses?: any[]; songs?: any[]; sheets?: any[] } | null> {
  try {
    const docRef = doc(db, 'app_data', APP_DATA_DOC);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      return {
        masses: data.masses || [],
        songs: data.songs || [],
        sheets: data.sheets || []
      };
    }
  } catch (error: any) {
    console.error('[Firestore] Failed to load app data:', error);
    throw error;
  }
  return null;
}

// Direct authoritative server fetch bypassing any local client cache
export async function forceReloadAppDataFromFirestore(): Promise<{ masses?: any[]; songs?: any[]; sheets?: any[] } | null> {
  try {
    const docRef = doc(db, 'app_data', APP_DATA_DOC);
    const snap = await getDocFromServer(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        masses: Array.isArray(data?.masses) ? data.masses : [],
        songs: Array.isArray(data?.songs) ? data.songs : [],
        sheets: Array.isArray(data?.sheets) ? data.sheets : []
      };
    }
  } catch (error: any) {
    console.warn('[Firestore] forceReload from server warning, falling back to cached getDoc:', error);
    return loadAppDataFromFirestore();
  }
  return null;
}

export function subscribeToAppData(
  onData: (data: { masses: any[]; songs: any[]; sheets: any[] } | null) => void,
  onError?: (err: any) => void
): () => void {
  const docRef = doc(db, 'app_data', APP_DATA_DOC);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onData({
          masses: Array.isArray(data?.masses) ? data.masses : [],
          songs: Array.isArray(data?.songs) ? data.songs : [],
          sheets: Array.isArray(data?.sheets) ? data.sheets : []
        });
      } else {
        onData(null);
      }
    },
    (error) => {
      console.error('[Firestore onSnapshot Error]:', error);
      if (onError) onError(error);
    }
  );
}

export async function saveAppDataToFirestore(payload: { masses?: any[]; songs?: any[]; sheets?: any[] }): Promise<void> {
  try {
    const docRef = doc(db, 'app_data', APP_DATA_DOC);
    // Firestore setDoc throws an error if any field in the document or arrays is undefined.
    // Serializing through JSON strips all undefined values safely and ensures clean Firestore schema.
    const sanitized = JSON.parse(
      JSON.stringify({
        masses: payload.masses ?? [],
        songs: payload.songs ?? [],
        sheets: payload.sheets ?? [],
        updatedAt: new Date().toISOString()
      })
    );
    await setDoc(docRef, sanitized);
  } catch (error: any) {
    console.error('[Firestore] Failed to save app data:', error);
    throw error;
  }
}

