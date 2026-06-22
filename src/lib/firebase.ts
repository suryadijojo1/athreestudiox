import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { Product, Invoice, StockMovement, AuditLog, PaymentTransaction, CashierSession, SalesAgent, ShopSettings } from '../types';

// Load direct config from firebase-applet-config.json credentials
const firebaseConfig = {
  apiKey: "AIzaSyCFuQGgAfdmUmZNEqq6bVTSzgbRIymcL8M",
  authDomain: "excellent-bit-csjh2.firebaseapp.com",
  projectId: "excellent-bit-csjh2",
  storageBucket: "excellent-bit-csjh2.firebasestorage.app",
  messagingSenderId: "988360825147",
  appId: "1:988360825147:web:42a597812576c793bd3f1e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-945047af-229e-4c44-9dd5-a88cc1aef953");

// ERROR HANDLING ENGINE REQUIRED BY FIRESTORE SYSTEM SKILL
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
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Generic helpers to load a collection
export async function loadCollectionFromFirestore<T>(collectionName: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const items: T[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ ...docSnap.data() } as T);
    });
    return items;
  } catch (error) {
    console.error(`Gagal muat data ${collectionName} dari Firebase:`, error);
    handleFirestoreError(error, OperationType.GET, collectionName);
  }
}

// Helper to recursively strip undefined values to prevent Firestore crashes from undefined fields
export function cleanUndefined<T>(obj: T): any {
  if (obj === undefined) {
    return null;
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item));
  }
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanUndefined(value);
    }
  }
  return cleaned;
}

// Generic helper to save a document
export async function saveDocumentToFirestore<T extends { id: string }>(collectionName: string, item: T): Promise<void> {
  try {
    const docRef = doc(db, collectionName, item.id);
    await setDoc(docRef, cleanUndefined(item));
  } catch (error) {
    console.error(`Gagal simpan data ${collectionName}/${item.id} ke Firebase:`, error);
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${item.id}`);
  }
}

// Generic helper to delete a document
export async function deleteDocumentFromFirestore(collectionName: string, id: string): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Gagal hapus data ${collectionName}/${id} dari Firebase:`, error);
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
  }
}

// Generic helper to upload entire lists using Firestore Batches (up to 500 documents per batch)
export async function saveCollectionInBatches<T extends { id: string }>(collectionName: string, items: T[]): Promise<void> {
  try {
    let batch = writeBatch(db);
    let count = 0;

    for (const item of items) {
      const docRef = doc(db, collectionName, item.id);
      batch.set(docRef, cleanUndefined(item));
      count++;
      
      if (count === 400) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }
    
    if (count > 0) {
      await batch.commit();
    }
  } catch (error) {
    console.error(`Gagal melakukan batch-save untuk ${collectionName}:`, error);
    handleFirestoreError(error, OperationType.WRITE, collectionName);
  }
}

// Helpers specifically for Active Session
export async function saveActiveSessionToFirestore(session: CashierSession | null): Promise<void> {
  try {
    const docRef = doc(db, 'metadata', 'active_session');
    await setDoc(docRef, cleanUndefined({ activeSession: session }));
  } catch (error) {
    console.error('Gagal simpan activeSession ke Firebase:', error);
    handleFirestoreError(error, OperationType.WRITE, 'metadata/active_session');
  }
}

export async function loadActiveSessionFromFirestore(): Promise<CashierSession | null> {
  try {
    const docRef = doc(db, 'metadata', 'active_session');
    const docSnap = await getDocs(collection(db, 'metadata'));
    let activeSession: CashierSession | null = null;
    docSnap.forEach((ds) => {
      if (ds.id === 'active_session') {
        const data = ds.data();
        activeSession = data.activeSession || null;
      }
    });
    return activeSession;
  } catch (error) {
    console.error('Gagal memuat activeSession dari Firebase:', error);
    handleFirestoreError(error, OperationType.GET, 'metadata/active_session');
  }
}

export interface SystemCredentials {
  id: string; // "credentials"
  kasirPassword?: string;
  ownerPassword?: string;
  produksiPassword?: string;
}

export async function saveCredentialsToFirestore(creds: SystemCredentials): Promise<void> {
  try {
    const docRef = doc(db, 'metadata', 'credentials');
    await setDoc(docRef, cleanUndefined(creds));
  } catch (error) {
    console.error('Gagal simpan credentials ke Firebase:', error);
    handleFirestoreError(error, OperationType.WRITE, 'metadata/credentials');
  }
}

export async function loadCredentialsFromFirestore(): Promise<SystemCredentials | null> {
  try {
    const docSnap = await getDocs(collection(db, 'metadata'));
    let credentials: SystemCredentials | null = null;
    docSnap.forEach((ds) => {
      if (ds.id === 'credentials') {
        const data = ds.data();
        credentials = {
          id: ds.id,
          kasirPassword: data.kasirPassword,
          ownerPassword: data.ownerPassword,
          produksiPassword: data.produksiPassword,
        };
      }
    });
    return credentials;
  } catch (error) {
    console.error('Gagal memuat credentials dari Firebase:', error);
    handleFirestoreError(error, OperationType.GET, 'metadata/credentials');
  }
}

export async function saveSalesAgentsToFirestore(agents: SalesAgent[]): Promise<void> {
  try {
    const docRef = doc(db, 'metadata', 'sales_agents');
    await setDoc(docRef, cleanUndefined({ id: 'sales_agents', agents }));
  } catch (error) {
    console.error('Gagal simpan sales_agents ke Firebase:', error);
    handleFirestoreError(error, OperationType.WRITE, 'metadata/sales_agents');
  }
}

export async function loadSalesAgentsFromFirestore(): Promise<SalesAgent[] | null> {
  try {
    const docSnap = await getDocs(collection(db, 'metadata'));
    let agents: SalesAgent[] | null = null;
    docSnap.forEach((ds) => {
      if (ds.id === 'sales_agents') {
        const data = ds.data();
        agents = data.agents || null;
      }
    });
    return agents;
  } catch (error) {
    console.warn('Gagal memuat sales_agents dari Firebase:', error);
    // Return null so we can fallback to defaults gracefully
    return null;
  }
}

export async function saveShopSettingsToFirestore(settings: ShopSettings): Promise<void> {
  try {
    const docRef = doc(db, 'metadata', 'shop_settings');
    await setDoc(docRef, cleanUndefined({ id: 'shop_settings', ...settings }));
  } catch (error) {
    console.error('Gagal simpan shop_settings ke Firebase:', error);
    handleFirestoreError(error, OperationType.WRITE, 'metadata/shop_settings');
  }
}

export async function loadShopSettingsFromFirestore(): Promise<ShopSettings | null> {
  try {
    const docSnap = await getDocs(collection(db, 'metadata'));
    let settings: ShopSettings | null = null;
    docSnap.forEach((ds) => {
      if (ds.id === 'shop_settings') {
        const data = ds.data();
        settings = {
          logoType: data.logoType || 'preset',
          presetKey: data.presetKey || 'shield',
          customUrl: data.customUrl || null,
          shopName: data.shopName || 'ATHREE STUDIO JAYAPURA',
          shopSlogan: data.shopSlogan || 'Studio Printing, Custom Apparel, Sablon Jersey Premium & Digital Printing Terpercaya.',
        };
      }
    });
    return settings;
  } catch (error) {
    console.warn('Gagal memuat shop_settings dari Firebase:', error);
    return null;
  }
}

