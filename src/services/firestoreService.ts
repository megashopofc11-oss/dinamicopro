import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  runTransaction,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase/config';
import { Batch, QRCodeItem, PlaqueModelId, CounterState, SystemSettings, QRStatus } from '../types';

export const STORAGE_BATCHES_KEY = 'dinamico_pro_batches_v2';
export const STORAGE_ITEMS_PREFIX = 'dinamico_pro_items_v2_';

export function saveBatchToLocalStorage(batch: Batch, items: QRCodeItem[]) {
  try {
    const raw = localStorage.getItem(STORAGE_BATCHES_KEY);
    const existing: Batch[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((b) => b.id !== batch.id && b.batchCode !== batch.batchCode);
    filtered.unshift(batch);
    localStorage.setItem(STORAGE_BATCHES_KEY, JSON.stringify(filtered));

    const itemsJson = JSON.stringify(items);
    localStorage.setItem(STORAGE_ITEMS_PREFIX + batch.id, itemsJson);
    if (batch.batchCode && batch.batchCode !== batch.id) {
      localStorage.setItem(STORAGE_ITEMS_PREFIX + batch.batchCode, itemsJson);
    }
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }
}

export function loadBatchFromLocalStorage(batchId: string): QRCodeItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_ITEMS_PREFIX + batchId);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return [];
}

/**
 * Format helper for zero-padded code strings:
 * formatNumber(1, 6) -> "000001"
 */
export function formatCodeNumber(num: number, digits = 6): string {
  return String(num).padStart(digits, '0');
}

/**
 * Atomically reserves a sequential batch number and a sequential range of QR numbers.
 */
export async function reserveBatchNumbers(quantity: number): Promise<{
  batchNumber: number;
  batchCode: string;
  startNumber: number;
  endNumber: number;
}> {
  const counterRef = doc(db, 'counters', 'global');

  try {
    const result = await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      let currentBatch = 0;
      let currentQr = 0;

      if (counterSnap.exists()) {
        const data = counterSnap.data() as Partial<CounterState>;
        currentBatch = Number(data.currentBatchNumber) || 0;
        currentQr = Number(data.currentQrNumber) || 0;
      }

      const nextBatch = currentBatch + 1;
      const startQr = currentQr + 1;
      const endQr = currentQr + quantity;

      transaction.set(
        counterRef,
        {
          currentBatchNumber: nextBatch,
          currentQrNumber: endQr,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return {
        batchNumber: nextBatch,
        batchCode: `LOTE-${String(nextBatch).padStart(3, '0')}`,
        startNumber: startQr,
        endNumber: endQr,
      };
    });

    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'counters/global');
    throw error;
  }
}

/**
 * Creates the batch and all individual QR code documents in Firestore.
 */
export async function createBatchWithQRCodes(params: {
  userId: string;
  userEmail?: string;
  modelId: PlaqueModelId;
  quantity: number;
  onProgress?: (step: string, percent: number) => void;
}): Promise<{ batch: Batch; items: QRCodeItem[] }> {
  const { userId, userEmail, modelId, quantity, onProgress } = params;

  onProgress?.('Reservando numeração atômica...', 15);
  const reservation = await reserveBatchNumbers(quantity);

  onProgress?.('Gerando códigos dinâmicos únicos...', 40);
  const items: QRCodeItem[] = [];
  const now = new Date().toISOString();

  for (let num = reservation.startNumber; num <= reservation.endNumber; num++) {
    const shortCode = formatCodeNumber(num, 6);
    const item: QRCodeItem = {
      id: shortCode,
      codeNumber: num,
      qrCodeId: `QR-${shortCode}`,
      plaqueId: `PLACA-${shortCode}`,
      shortCode,
      batchId: reservation.batchCode,
      modelId,
      userId,
      clientName: '',
      targetUrl: '',
      status: 'pending',
      scanCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    items.push(item);
  }

  const batchData: Batch = {
    id: reservation.batchCode,
    batchNumber: reservation.batchNumber,
    batchCode: reservation.batchCode,
    modelId,
    quantity,
    startNumber: reservation.startNumber,
    endNumber: reservation.endNumber,
    startCode: `QR-${formatCodeNumber(reservation.startNumber, 6)}`,
    endCode: `QR-${formatCodeNumber(reservation.endNumber, 6)}`,
    userId,
    userEmail: userEmail || '',
    createdAt: now,
    activeCount: 0,
  };

  onProgress?.('Gravando registros no Cloud Firestore...', 70);

  try {
    const firestoreBatch = writeBatch(db);

    // 1. Add Batch doc
    const batchDocRef = doc(db, 'batches', reservation.batchCode);
    firestoreBatch.set(batchDocRef, batchData);

    // 2. Add each QR Code doc
    for (const item of items) {
      const qrDocRef = doc(db, 'qrCodes', item.id);
      firestoreBatch.set(qrDocRef, item);
    }

    await firestoreBatch.commit();
    saveBatchToLocalStorage(batchData, items);
    onProgress?.('Lote concluído com sucesso!', 100);

    return { batch: batchData, items };
  } catch (error) {
    // Even if Firestore write threw, save locally so data is never lost
    saveBatchToLocalStorage(batchData, items);
    handleFirestoreError(error, OperationType.WRITE, 'batches/' + reservation.batchCode);
    return { batch: batchData, items };
  }
}

/**
 * Fetches all batches for the current user.
 */
export async function getUserBatches(userId: string): Promise<Batch[]> {
  const map = new Map<string, Batch>();

  // 1. Try Firestore
  try {
    const q = query(collection(db, 'batches'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    snapshot.forEach((docSnap) => {
      const b = docSnap.data() as Batch;
      map.set(b.batchCode || b.id, b);
    });
  } catch (error) {
    console.warn('Firestore getUserBatches warning:', error);
  }

  // 2. Also merge with local storage
  try {
    const raw = localStorage.getItem(STORAGE_BATCHES_KEY);
    if (raw) {
      const localBatches: Batch[] = JSON.parse(raw);
      for (const b of localBatches) {
        if (!map.has(b.batchCode || b.id)) {
          map.set(b.batchCode || b.id, b);
        }
      }
    }
  } catch {
    // ignore
  }

  return Array.from(map.values()).sort((a, b) => (b.batchNumber || 0) - (a.batchNumber || 0));
}

/**
 * Fetches all QR Codes for a specific batch with multi-layer guarantee.
 */
export async function getBatchQRCodes(batchId: string, batchObj?: Batch): Promise<QRCodeItem[]> {
  const itemsMap = new Map<string, QRCodeItem>();

  // 1. Query Firestore by batchId
  try {
    const q = query(collection(db, 'qrCodes'), where('batchId', '==', batchId));
    const snapshot = await getDocs(q);
    snapshot.forEach((docSnap) => {
      const item = docSnap.data() as QRCodeItem;
      itemsMap.set(item.id, item);
    });
  } catch (error) {
    console.warn('Firestore getBatchQRCodes query by batchId warning:', error);
  }

  // 2. If empty and batchObj has batchCode different from batchId, query by batchCode
  if (itemsMap.size === 0 && batchObj?.batchCode && batchObj.batchCode !== batchId) {
    try {
      const q2 = query(collection(db, 'qrCodes'), where('batchId', '==', batchObj.batchCode));
      const snapshot2 = await getDocs(q2);
      snapshot2.forEach((docSnap) => {
        const item = docSnap.data() as QRCodeItem;
        itemsMap.set(item.id, item);
      });
    } catch {
      // ignore
    }
  }

  // 3. If empty, check localStorage
  if (itemsMap.size === 0) {
    const local = loadBatchFromLocalStorage(batchId);
    if (local && local.length > 0) {
      local.forEach((item) => itemsMap.set(item.id, item));
    } else if (batchObj?.batchCode) {
      const localByCode = loadBatchFromLocalStorage(batchObj.batchCode);
      if (localByCode && localByCode.length > 0) {
        localByCode.forEach((item) => itemsMap.set(item.id, item));
      }
    }
  }

  // 4. Deterministic restoration if still empty but range is known
  if (itemsMap.size === 0 && batchObj && batchObj.startNumber && batchObj.endNumber) {
    const userId = batchObj.userId || auth.currentUser?.uid || '';
    const now = batchObj.createdAt || new Date().toISOString();
    const reconstructed: QRCodeItem[] = [];

    for (let num = batchObj.startNumber; num <= batchObj.endNumber; num++) {
      const shortCode = formatCodeNumber(num, 6);
      const item: QRCodeItem = {
        id: shortCode,
        codeNumber: num,
        qrCodeId: `QR-${shortCode}`,
        plaqueId: `PLACA-${shortCode}`,
        shortCode,
        batchId: batchObj.batchCode || batchId,
        modelId: batchObj.modelId,
        userId,
        clientName: '',
        targetUrl: '',
        status: 'pending',
        scanCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      itemsMap.set(item.id, item);
      reconstructed.push(item);
    }

    saveBatchToLocalStorage(batchObj, reconstructed);

    // Sync back to Firestore in background
    try {
      const fBatch = writeBatch(db);
      for (const item of reconstructed) {
        fBatch.set(doc(db, 'qrCodes', item.id), item, { merge: true });
      }
      fBatch.commit().catch(() => {});
    } catch {
      // ignore
    }
  }

  const result = Array.from(itemsMap.values()).sort((a, b) => a.codeNumber - b.codeNumber);

  // If items loaded from Firestore, refresh local cache
  if (result.length > 0 && batchObj) {
    saveBatchToLocalStorage(batchObj, result);
  }

  return result;
}

/**
 * Fetches all QR Codes for the current user.
 */
export async function getUserQRCodes(userId: string): Promise<QRCodeItem[]> {
  try {
    const q = query(collection(db, 'qrCodes'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const items: QRCodeItem[] = [];

    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as QRCodeItem);
    });

    return items.sort((a, b) => b.codeNumber - a.codeNumber);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'qrCodes');
    return [];
  }
}

/**
 * Public lookup for physical scan redirection /q/:code.
 */
export async function getQRCodeByShortCode(shortCode: string): Promise<QRCodeItem | null> {
  const digitsOnly = shortCode.replace(/\D/g, '');
  const cleanCode = digitsOnly ? digitsOnly.padStart(6, '0') : shortCode;

  try {
    // 1. Direct doc by 6-digit padded code (e.g. "000001")
    let docRef = doc(db, 'qrCodes', cleanCode);
    let docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as QRCodeItem;
    }

    // 2. Direct doc by raw ID (e.g. "1" or "QR-000001")
    if (shortCode !== cleanCode) {
      docRef = doc(db, 'qrCodes', shortCode);
      docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as QRCodeItem;
      }
    }

    // 3. Query by shortCode
    let q = query(collection(db, 'qrCodes'), where('shortCode', '==', cleanCode));
    let querySnap = await getDocs(q);
    if (!querySnap.empty) {
      return querySnap.docs[0].data() as QRCodeItem;
    }

    // 4. Query by qrCodeId (e.g. "QR-000001")
    q = query(collection(db, 'qrCodes'), where('qrCodeId', '==', `QR-${cleanCode}`));
    querySnap = await getDocs(q);
    if (!querySnap.empty) {
      return querySnap.docs[0].data() as QRCodeItem;
    }

    // 5. Query by plaqueId (e.g. "PLACA-000001")
    q = query(collection(db, 'qrCodes'), where('plaqueId', '==', `PLACA-${cleanCode}`));
    querySnap = await getDocs(q);
    if (!querySnap.empty) {
      return querySnap.docs[0].data() as QRCodeItem;
    }

    return null;
  } catch (error) {
    console.error('Error fetching QR Code for redirect:', error);
    return null;
  }
}

/**
 * Increments scan counter when a user scans the plaque.
 */
export async function recordQRCodeScan(shortCode: string): Promise<void> {
  try {
    const cleanCode = shortCode.replace(/^(QR-|PLACA-)/i, '').padStart(6, '0');
    const docRef = doc(db, 'qrCodes', cleanCode);
    await updateDoc(docRef, {
      scanCount: increment(1),
    });
  } catch (err) {
    // Non-blocking log
    console.warn('Scan count increment error:', err);
  }
}

/**
 * Updates destination target URL, client name, and status for a QR code.
 */
export async function updateQRCodeDestination(params: {
  id: string; // shortCode or doc ID
  batchId: string;
  clientName?: string;
  targetUrl: string;
  status: QRStatus;
}): Promise<void> {
  const { id, batchId, clientName, targetUrl, status } = params;
  const docRef = doc(db, 'qrCodes', id);

  try {
    await updateDoc(docRef, {
      clientName: clientName || '',
      targetUrl: targetUrl.trim(),
      status,
      updatedAt: new Date().toISOString(),
    });

    // Recalculate activeCount in batch if needed
    try {
      const q = query(
        collection(db, 'qrCodes'),
        where('batchId', '==', batchId),
        where('status', '==', 'active')
      );
      const snap = await getDocs(q);
      const activeCount = snap.size;
      await updateDoc(doc(db, 'batches', batchId), {
        activeCount,
      });
    } catch {
      // ignore non-critical batch count update error
    }
    // Also update in localStorage cache
    try {
      const cached = loadBatchFromLocalStorage(batchId);
      if (cached && cached.length > 0) {
        const updatedCache = cached.map((item) =>
          item.id === id
            ? {
                ...item,
                clientName: clientName || '',
                targetUrl: targetUrl.trim(),
                status,
                updatedAt: new Date().toISOString(),
              }
            : item
        );
        localStorage.setItem(STORAGE_ITEMS_PREFIX + batchId, JSON.stringify(updatedCache));
      }
    } catch {
      // ignore
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `qrCodes/${id}`);
    throw error;
  }
}

/**
 * Fetches global system settings (such as base redirect domain).
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'general'));
    if (snap.exists()) {
      return snap.data() as SystemSettings;
    }
  } catch (error) {
    console.warn('Could not load settings from Firestore, using default:', error);
  }

  // Default to current location origin or configured default
  return {
    redirectBaseUrl: typeof window !== 'undefined' ? window.location.origin : 'https://seudominio.com',
    companyName: 'Dinâmico Pro',
  };
}

/**
 * Updates system settings in Firestore.
 */
export async function updateSystemSettings(settings: SystemSettings): Promise<void> {
  try {
    await setDoc(
      doc(db, 'settings', 'general'),
      {
        ...settings,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/general');
    throw error;
  }
}

export async function getBatches(): Promise<Batch[]> {
  const userId = auth.currentUser?.uid;
  if (userId) {
    return getUserBatches(userId);
  }
  return getUserBatches('');
}

export async function getQRCodes(): Promise<QRCodeItem[]> {
  const userId = auth.currentUser?.uid;
  if (userId) {
    return getUserQRCodes(userId);
  }
  try {
    const q = query(collection(db, 'qrCodes'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as QRCodeItem);
  } catch {
    return [];
  }
}

export async function incrementScanCount(id: string): Promise<void> {
  return recordQRCodeScan(id);
}
