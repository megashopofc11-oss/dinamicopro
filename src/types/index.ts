export type PlaqueModelId = 'google_azul' | 'google_alternativo' | 'instagram' | 'whatsapp';

export interface PlaqueModel {
  id: PlaqueModelId;
  name: string;
  shortName: string;
  tagline: string;
  category: 'google' | 'instagram' | 'whatsapp';
  primaryColor: string;
  accentColor: string;
  description: string;
  hostedUrl?: string;
  localUrl?: string;
  imageUrl?: string;
}

export interface Batch {
  id: string; // e.g. "LOTE-001"
  batchNumber: number;
  batchCode: string;
  modelId: PlaqueModelId;
  quantity: number;
  startNumber: number;
  endNumber: number;
  startCode: string; // "QR-000001"
  endCode: string; // "QR-000100"
  userId: string;
  userEmail?: string;
  createdAt: string;
  activeCount?: number;
}

export type QRStatus = 'pending' | 'active' | 'disabled';

export interface QRCodeItem {
  id: string; // "000001"
  codeNumber: number; // 1
  qrCodeId: string; // "QR-000001"
  plaqueId: string; // "PLACA-000001"
  shortCode: string; // "000001"
  batchId: string; // "LOTE-001"
  modelId: PlaqueModelId;
  userId: string;
  clientName?: string;
  targetUrl?: string;
  status: QRStatus;
  scanCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CounterState {
  currentBatchNumber: number;
  currentQrNumber: number;
  updatedAt: string;
}

export interface SystemSettings {
  redirectBaseUrl: string;
  companyName: string;
  updatedAt?: string;
}

export interface BatchGenerationProgress {
  step: 'initializing' | 'reserving' | 'generating_codes' | 'saving_firestore' | 'completed' | 'error';
  current: number;
  total: number;
  message: string;
  error?: string;
}
