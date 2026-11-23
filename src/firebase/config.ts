import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Get active database ID (supports switching to Android database ID if set)
export const getActiveDatabaseId = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('custom_firestore_database_id');
    if (saved && saved.trim()) return saved.trim();
  }
  return firebaseConfig.firestoreDatabaseId;
};

// Initialize Firestore with Database ID (Critical: AI Studio specific database)
export const db = getFirestore(app, getActiveDatabaseId());

// Initialize Firebase Auth
export const auth = getAuth(app);

// Error logging helper conforming to Firebase skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot as required by skill guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log('Firebase connection verified');
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, check connection.');
      return false;
    }
    if (error?.code === 'permission-denied') {
      try {
        await getDocFromServer(doc(db, 'pengaturan', 'sekolah'));
        console.log('Firebase connection verified via pengaturan/sekolah');
        return true;
      } catch {
        return true;
      }
    }
    // Normal when doc does not exist, connection is valid
    return true;
  }
}

// Initial test trigger
testConnection().catch(() => {});
