import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  browserLocalPersistence,
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
// AUTHENTICATION HELPERS (CLIENT-SIDE FIREBASE WEB SDK)
// -------------------------------------------------------------

export async function loginWithUsername(username: string, password: string):Promise<{ username: string; displayName: string }> {
  const cleanUsername = username.trim().toLowerCase();
  const technicalEmail = usernameToEmail(cleanUsername);

  const credential = await signInWithEmailAndPassword(auth, technicalEmail, password);
  const user = credential.user;

  return {
    username: cleanUsername,
    displayName: cleanUsername === 'admin' ? 'Ban Quản Trị' : (user.displayName || cleanUsername)
  };
}

export async function logoutUser(): Promise<void> {
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
    await setDoc(docRef, {
      masses: payload.masses ?? [],
      songs: payload.songs ?? [],
      sheets: payload.sheets ?? [],
      updatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Firestore] Failed to save app data:', error);
    throw error;
  }
}

