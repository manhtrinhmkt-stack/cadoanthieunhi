import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface UserAccount {
  username: string;
  passwordHash: string;
  displayName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserSession {
  token: string;
  username: string;
  expiresAt: string; // ISO string
  createdAt: string;
  lastActiveAt: string;
}

// Safe data store directory for local or Vercel (/tmp)
const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? '/tmp' : path.resolve('./data');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  // Ignored in read-only environments
}

const STORE_FILE = path.join(DATA_DIR, 'store.json');

interface LocalStore {
  users: Record<string, UserAccount>;
  sessions: Record<string, UserSession>;
  appData?: {
    masses?: any[];
    songs?: any[];
    sheets?: any[];
    updatedAt?: string;
  };
}

// Bootstrap in-memory store with default admin user immediately
const defaultAdminHash = bcrypt.hashSync('admin123', 10);
let inMemoryStore: LocalStore = {
  users: {
    admin: {
      username: 'admin',
      passwordHash: defaultAdminHash,
      displayName: 'Ban Quản Trị',
      createdAt: new Date().toISOString()
    }
  },
  sessions: {}
};

function loadLocalStore(): LocalStore {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      inMemoryStore = {
        users: { ...inMemoryStore.users, ...parsed.users },
        sessions: { ...inMemoryStore.sessions, ...parsed.sessions },
        appData: parsed.appData || inMemoryStore.appData
      };
      return inMemoryStore;
    }
  } catch (e) {
    console.error('[Store] Error reading store.json:', e);
  }
  return inMemoryStore;
}

function saveLocalStore(store: LocalStore) {
  inMemoryStore = store;
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    // Non-fatal if filesystem is read-only
  }
}

// Firebase Admin Firestore Initialization
let firestoreDb: Firestore | null = null;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount)
      });
    }
    firestoreDb = getFirestore();
    console.log('[Firebase Admin] Initialized via service account env var.');
  } else if (fs.existsSync('./firebase-applet-config.json')) {
    const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
    let app;
    if (!getApps().length) {
      app = initializeApp({
        projectId: config.projectId || config.project_id
      });
    } else {
      app = getApps()[0];
    }
    if (config.firestoreDatabaseId) {
      firestoreDb = getFirestore(app, config.firestoreDatabaseId);
    } else {
      firestoreDb = getFirestore(app);
    }
    console.log('[Firebase Admin] Initialized via firebase-applet-config.json with project:', config.projectId || config.project_id);
  }
} catch (err) {
  console.log('[Firebase Admin] Initialization deferred (using local persistent store):', err);
}

function handleFirestoreError(context: string, err: any) {
  const msg = err?.message || String(err);
  console.warn(`[Firestore Warning - ${context}]:`, msg);
  // Fallback seamlessly to local store on ANY Firestore credential/permission/network error
  if (firestoreDb) {
    console.log(`[Firestore] Switching to local store due to error in ${context}: ${msg}`);
    firestoreDb = null;
  }
}

// -------------------------------------------------------------
// USER MANAGEMENT
// -------------------------------------------------------------

export async function bootstrapDefaultAdmin() {
  const store = loadLocalStore();
  let defaultUserExists = false;

  if (firestoreDb) {
    try {
      const snap = await firestoreDb.collection('users').doc('admin').get();
      if (snap.exists) {
        defaultUserExists = true;
      }
    } catch (e) {
      handleFirestoreError('bootstrapDefaultAdmin get', e);
    }
  }

  if (store.users['admin']) {
    defaultUserExists = true;
  }

  if (!defaultUserExists) {
    console.log('[Auth] Creating default admin user (admin / admin123)...');
    const hash = bcrypt.hashSync('admin123', 10);
    const adminUser: UserAccount = {
      username: 'admin',
      passwordHash: hash,
      displayName: 'Ban Quản Trị',
      createdAt: new Date().toISOString()
    };

    store.users['admin'] = adminUser;
    saveLocalStore(store);

    if (firestoreDb) {
      try {
        await firestoreDb.collection('users').doc('admin').set(adminUser);
      } catch (e) {
        handleFirestoreError('bootstrapDefaultAdmin set', e);
      }
    }
  }
}

export async function getUserByUsername(username: string): Promise<UserAccount | null> {
  const cleanUsername = username.trim().toLowerCase();

  if (firestoreDb) {
    try {
      const snap = await firestoreDb.collection('users').doc(cleanUsername).get();
      if (snap.exists) {
        return snap.data() as UserAccount;
      }
    } catch (e) {
      handleFirestoreError('getUserByUsername', e);
    }
  }

  const store = loadLocalStore();
  return store.users[cleanUsername] || null;
}

export async function changeUserPassword(username: string, newPasswordPlain: string): Promise<boolean> {
  const cleanUsername = username.trim().toLowerCase();
  const newHash = bcrypt.hashSync(newPasswordPlain, 10);
  const updatedAt = new Date().toISOString();

  const store = loadLocalStore();
  if (store.users[cleanUsername]) {
    store.users[cleanUsername].passwordHash = newHash;
    store.users[cleanUsername].updatedAt = updatedAt;
    saveLocalStore(store);
  }

  if (firestoreDb) {
    try {
      await firestoreDb.collection('users').doc(cleanUsername).update({
        passwordHash: newHash,
        updatedAt
      });
    } catch (e) {
      handleFirestoreError('changeUserPassword', e);
    }
  }

  return true;
}

// -------------------------------------------------------------
// SESSION MANAGEMENT (30 DAYS PERSISTENCE)
// -------------------------------------------------------------

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createSession(username: string): Promise<UserSession> {
  const token = generateSessionToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  const session: UserSession = {
    token,
    username: username.trim().toLowerCase(),
    expiresAt,
    createdAt: now.toISOString(),
    lastActiveAt: now.toISOString()
  };

  const store = loadLocalStore();
  store.sessions[token] = session;
  saveLocalStore(store);

  if (firestoreDb) {
    try {
      await firestoreDb.collection('sessions').doc(token).set(session);
    } catch (e) {
      handleFirestoreError('createSession', e);
    }
  }

  return session;
}

export async function getAndValidateSession(token: string): Promise<UserSession | null> {
  if (!token) return null;

  let session: UserSession | null = null;

  if (firestoreDb) {
    try {
      const snap = await firestoreDb.collection('sessions').doc(token).get();
      if (snap.exists) {
        session = snap.data() as UserSession;
      }
    } catch (e) {
      handleFirestoreError('getAndValidateSession', e);
    }
  }

  if (!session) {
    const store = loadLocalStore();
    session = store.sessions[token] || null;
  }

  if (!session) return null;

  // Check expiration
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    // Session expired
    await destroySession(token);
    return null;
  }

  // Extend session if user is active and session is older than 1 day
  const now = new Date();
  const lastActive = new Date(session.lastActiveAt).getTime();
  if (now.getTime() - lastActive > 24 * 60 * 60 * 1000) {
    session.lastActiveAt = now.toISOString();
    session.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const store = loadLocalStore();
    if (store.sessions[token]) {
      store.sessions[token] = session;
      saveLocalStore(store);
    }

    if (firestoreDb) {
      try {
        await firestoreDb.collection('sessions').doc(token).set(session, { merge: true });
      } catch (e) {
        handleFirestoreError('refreshSession', e);
      }
    }
  }

  return session;
}

export async function destroySession(token: string) {
  if (!token) return;

  const store = loadLocalStore();
  if (store.sessions[token]) {
    delete store.sessions[token];
    saveLocalStore(store);
  }

  if (firestoreDb) {
    try {
      await firestoreDb.collection('sessions').doc(token).delete();
    } catch (e) {
      handleFirestoreError('destroySession', e);
    }
  }
}

// -------------------------------------------------------------
// APP DATA PERSISTENCE & FIRESTORE PROXIED ACCESS
// -------------------------------------------------------------

export async function getAppData(): Promise<{ masses: any[]; songs: any[]; sheets: any[] } | null> {
  if (firestoreDb) {
    try {
      const snap = await firestoreDb.collection('app_data').doc('cantus_store').get();
      if (snap.exists) {
        const data = snap.data();
        if (data && (data.masses || data.songs || data.sheets)) {
          return {
            masses: data.masses || [],
            songs: data.songs || [],
            sheets: data.sheets || []
          };
        }
      }
    } catch (e) {
      handleFirestoreError('getAppData', e);
    }
  }

  const store = loadLocalStore();
  if (store.appData) {
    return {
      masses: store.appData.masses || [],
      songs: store.appData.songs || [],
      sheets: store.appData.sheets || []
    };
  }

  return null;
}

export async function saveAppData(payload: { masses?: any[]; songs?: any[]; sheets?: any[] }) {
  const store = loadLocalStore();
  const currentData = store.appData || { masses: [], songs: [], sheets: [] };

  const updatedData = {
    masses: payload.masses ?? currentData.masses,
    songs: payload.songs ?? currentData.songs,
    sheets: payload.sheets ?? currentData.sheets,
    updatedAt: new Date().toISOString()
  };

  store.appData = updatedData;
  saveLocalStore(store);

  if (firestoreDb) {
    try {
      await firestoreDb.collection('app_data').doc('cantus_store').set(updatedData, { merge: true });
    } catch (e) {
      handleFirestoreError('saveAppData', e);
    }
  }
}
