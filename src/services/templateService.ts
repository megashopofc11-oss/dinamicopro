import {
  PlaqueModel,
  PlaqueModelId,
  QRPositionOffset,
  ModelCalibrationConfig,
  ModelNormalizedPlacement,
  ModelCalibrationsMap,
} from '../types';
import { TEMPLATE_ASSETS } from './templateAssets';

export interface ModelLayoutConfig {
  qrClean: { x: number; y: number; w: number; h: number; rx?: number };
  qr: { x: number; y: number; size: number };
  numCover: { x: number; y: number; w: number; h: number; color: string };
  number: {
    x: number;
    y: number;
    fontSize: number;
    anchor: 'middle' | 'end' | 'start';
    color: string;
    prefix?: string;
  };
}

/**
 * Default normalized calibrations for all registered models.
 * Coordinated strictly in normalized 0.0 to 1.0 space relative to 100x100mm (1000x1000 canvas).
 */
export const DEFAULT_MODEL_CALIBRATIONS: Record<PlaqueModelId, ModelCalibrationConfig> = {
  google_alternativo: {
    modelId: 'google_alternativo',
    version: '1.0',
    qrPlacement: { x: 0.115, y: 0.600, size: 0.280 },
    safeMarginTopMm: 18.8,
    safeMarginBottomMm: 12.0,
  },
  google_azul: {
    modelId: 'google_azul',
    version: '1.0',
    qrPlacement: { x: 0.665, y: 0.585, size: 0.215 },
    safeMarginTopMm: 8.5,
    safeMarginBottomMm: 19.0,
  },
  google_preto: {
    modelId: 'google_preto',
    version: '1.0',
    qrPlacement: { x: 0.556, y: 0.465, size: 0.240 },
    safeMarginTopMm: 10.5,
    safeMarginBottomMm: 11.8,
  },
  google_azul_novo: {
    modelId: 'google_azul_novo',
    version: '1.0',
    qrPlacement: { x: 0.556, y: 0.465, size: 0.240 },
    safeMarginTopMm: 10.5,
    safeMarginBottomMm: 11.8,
  },
  instagram: {
    modelId: 'instagram',
    version: '1.0',
    qrPlacement: { x: 0.665, y: 0.580, size: 0.215 },
    safeMarginTopMm: 13.0,
    safeMarginBottomMm: 19.5,
  },
  instagram_rosa: {
    modelId: 'instagram_rosa',
    version: '1.0',
    qrPlacement: { x: 0.547, y: 0.526, size: 0.220 },
    safeMarginTopMm: 7.1,
    safeMarginBottomMm: 7.2,
  },
  whatsapp: {
    modelId: 'whatsapp',
    version: '1.0',
    qrPlacement: { x: 0.607, y: 0.503, size: 0.240 },
    safeMarginTopMm: 4.2,
    safeMarginBottomMm: 15.9,
  },
  whatsapp_verde: {
    modelId: 'whatsapp_verde',
    version: '1.0',
    qrPlacement: { x: 0.572, y: 0.559, size: 0.210 },
    safeMarginTopMm: 5.4,
    safeMarginBottomMm: 5.4,
  },
  pix_pb: {
    modelId: 'pix_pb',
    version: '1.0',
    qrPlacement: { x: 0.576, y: 0.575, size: 0.200 },
    safeMarginTopMm: 4.7,
    safeMarginBottomMm: 4.8,
  },
  wifi_pb: {
    modelId: 'wifi_pb',
    version: '1.0',
    qrPlacement: { x: 0.576, y: 0.575, size: 0.200 },
    safeMarginTopMm: 4.8,
    safeMarginBottomMm: 4.8,
  },
};

export function normalizePlacement(pos: { x: number; y: number; size: number }): ModelNormalizedPlacement {
  return {
    x: Number((pos.x / 1000).toFixed(4)),
    y: Number((pos.y / 1000).toFixed(4)),
    size: Number((pos.size / 1000).toFixed(4)),
  };
}

export function denormalizePlacement(norm: ModelNormalizedPlacement): { x: number; y: number; size: number } {
  return {
    x: Math.round(norm.x * 1000),
    y: Math.round(norm.y * 1000),
    size: Math.round(norm.size * 1000),
  };
}

export const PLAQUE_LAYOUTS: Record<PlaqueModelId, ModelLayoutConfig> = {
  // GOOGLE — MODELO 01 (Google Alternativo / Plaquinha 01)
  // QR Code no lado esquerdo, abaixo da frase 'APONTE A SUA CÂMERA' (que termina em y=412)
  google_alternativo: {
    qrClean: { x: 105, y: 590, w: 300, h: 300, rx: 14 },
    qr: { x: 115, y: 600, size: 280 },
    numCover: { x: 880, y: 940, w: 110, h: 40, color: '#FFFFFF' },
    number: { x: 975, y: 966, fontSize: 24, anchor: 'end', color: '#111827' },
  },

  // GOOGLE — MODELO 02 (Google Azul Oficial)
  // QR Code perfeitamente centralizado na ilustração da tela do smartphone (sem sobreposições)
  google_azul: {
    qrClean: { x: 655, y: 575, w: 235, h: 235, rx: 12 },
    qr: { x: 665, y: 585, size: 215 },
    numCover: { x: 410, y: 960, w: 180, h: 30, color: '#FFFFFF' },
    number: { x: 500, y: 980, fontSize: 18, anchor: 'middle', color: '#111827', prefix: '#' },
  },

  // GOOGLE AVALIAÇÃO PRETO (Novo Modelo)
  // Texto 'APONTE A SUA CÂMERA' inicia em y=823. Topo termina em y=360.
  // QR posicionado em y=465 com tamanho 240: termina em y=705, garantindo >115px de folga total sem sobrepor texto!
  google_preto: {
    qrClean: { x: 546, y: 455, w: 260, h: 260, rx: 14 },
    qr: { x: 556, y: 465, size: 240 },
    numCover: { x: 410, y: 945, w: 180, h: 30, color: '#FFFFFF' },
    number: { x: 500, y: 965, fontSize: 18, anchor: 'middle', color: '#111827', prefix: '#' },
  },

  // GOOGLE AVALIAÇÃO AZUL NOVO (Novo Modelo)
  // Texto 'APONTE A SUA CÂMERA' inicia em y=823.
  // QR posicionado em y=465 com tamanho 240: termina em y=705, margem de segurança >115px.
  google_azul_novo: {
    qrClean: { x: 546, y: 455, w: 260, h: 260, rx: 14 },
    qr: { x: 556, y: 465, size: 240 },
    numCover: { x: 410, y: 945, w: 180, h: 30, color: '#FFFFFF' },
    number: { x: 500, y: 965, fontSize: 18, anchor: 'middle', color: '#111827', prefix: '#' },
  },

  // INSTAGRAM CLÁSSICO (Degradê Original)
  // Centralizado perfeitamente na moldura do smartphone
  instagram: {
    qrClean: { x: 655, y: 570, w: 235, h: 235, rx: 12 },
    qr: { x: 665, y: 580, size: 215 },
    numCover: { x: 410, y: 948, w: 180, h: 30, color: '#FFFFFF' },
    number: { x: 500, y: 968, fontSize: 18, anchor: 'middle', color: '#111827', prefix: '#' },
  },

  // INSTAGRAM ROSA E ROXO (Novo Modelo)
  // Texto 'APONTE A SUA CÂMERA' inicia em y=818. Header termina em y=455.
  // QR posicionado em y=526 com tamanho 220: termina em y=746, margem de segurança >70px preservando todo o texto.
  instagram_rosa: {
    qrClean: { x: 537, y: 516, w: 240, h: 240, rx: 14 },
    qr: { x: 547, y: 526, size: 220 },
    numCover: { x: 410, y: 945, w: 180, h: 30, color: '#FFFFFF' },
    number: { x: 500, y: 965, fontSize: 18, anchor: 'middle', color: '#111827', prefix: '#' },
  },

  // WHATSAPP CLÁSSICO (Original)
  // QR Code perfeitamente alinhado na área reservada
  whatsapp: {
    qrClean: { x: 597, y: 493, w: 260, h: 260, rx: 14 },
    qr: { x: 607, y: 503, size: 240 },
    numCover: { x: 410, y: 902, w: 180, h: 30, color: '#FFFFFF' },
    number: { x: 500, y: 922, fontSize: 18, anchor: 'middle', color: '#111827', prefix: '#' },
  },

  // WHATSAPP VERDE (Novo Modelo)
  // Texto 'APONTE A SUA CÂMERA' inicia em y=823. Header termina em y=505.
  // QR posicionado em y=559 com tamanho 210: termina em y=769, mantendo 54px de folga total sem tocar no texto.
  whatsapp_verde: {
    qrClean: { x: 562, y: 549, w: 230, h: 230, rx: 14 },
    qr: { x: 572, y: 559, size: 210 },
    numCover: { x: 410, y: 945, w: 180, h: 30, color: '#FFFFFF' },
    number: { x: 500, y: 965, fontSize: 18, anchor: 'middle', color: '#111827', prefix: '#' },
  },

  // PIX PRETO E BRANCO (Novo Modelo)
  // Texto 'APONTE A SUA CÂMERA' inicia em y=823. Header termina em y=528.
  // QR posicionado em y=575 com tamanho 200: termina em y=775, margem de segurança de 48px.
  pix_pb: {
    qrClean: { x: 566, y: 565, w: 220, h: 220, rx: 14 },
    qr: { x: 576, y: 575, size: 200 },
    numCover: { x: 410, y: 945, w: 180, h: 30, color: '#FFFFFF' },
    number: { x: 500, y: 965, fontSize: 18, anchor: 'middle', color: '#111827', prefix: '#' },
  },

  // WI-FI PRETO E BRANCO (Novo Modelo)
  // Texto 'APONTE A SUA CÂMERA' inicia em y=823. Header termina em y=527.
  // QR posicionado em y=575 com tamanho 200: termina em y=775, margem de segurança de 48px.
  wifi_pb: {
    qrClean: { x: 566, y: 565, w: 220, h: 220, rx: 14 },
    qr: { x: 576, y: 575, size: 200 },
    numCover: { x: 410, y: 945, w: 180, h: 30, color: '#FFFFFF' },
    number: { x: 500, y: 965, fontSize: 18, anchor: 'middle', color: '#111827', prefix: '#' },
  },
};

export const PLAQUE_MODELS: PlaqueModel[] = [
  // Google
  {
    id: 'google_alternativo',
    name: 'Google — Modelo 01',
    shortName: 'Google 01',
    tagline: 'Sua Opinião no Google',
    category: 'google',
    primaryColor: '#005BEA',
    accentColor: '#EF4444',
    description: 'Modelo oficial Google 01 (10 × 10 cm) com listra arco-íris e QR Code à esquerda.',
    hostedUrl: 'https://i.postimg.cc/JhcwqJgR/Plaquinha-01.jpg',
    localUrl: '/templates/google-01.jpg',
    imageUrl: '/templates/google-01.jpg',
  },
  {
    id: 'google_azul',
    name: 'Google — Modelo 02',
    shortName: 'Google 02',
    tagline: 'Avalie-nos no Google',
    category: 'google',
    primaryColor: '#0084FF',
    accentColor: '#EF4444',
    description: 'Modelo oficial Google 02 (10 × 10 cm) com NFC e QR Code à direita.',
    hostedUrl: 'https://i.postimg.cc/JhWVZKT7/Google.jpg',
    localUrl: '/templates/google-02.jpg',
    imageUrl: '/templates/google-02.jpg',
  },
  {
    id: 'google_preto',
    name: 'Google Avaliação Preto',
    shortName: 'Google Preto',
    tagline: 'Avalie Nossa Empresa no Google',
    category: 'google',
    primaryColor: '#1F2937',
    accentColor: '#EF4444',
    description: 'Design premium Google em tons escuros e QR Code dinâmico.',
    hostedUrl: 'https://i.postimg.cc/rwd8V9JQ/Instagram-2.jpg',
    localUrl: '/templates/google-preto.jpg',
    imageUrl: '/templates/google-preto.jpg',
  },
  {
    id: 'google_azul_novo',
    name: 'Google Avaliação Azul',
    shortName: 'Google Azul Novo',
    tagline: 'Avalie no Google em Segundos',
    category: 'google',
    primaryColor: '#0284C7',
    accentColor: '#EF4444',
    description: 'Design moderno Google em azul vibrante com QR Code à direita.',
    hostedUrl: 'https://i.postimg.cc/Jzy1rQqT/Instagram-3.jpg',
    localUrl: '/templates/google-azul-novo.jpg',
    imageUrl: '/templates/google-azul-novo.jpg',
  },

  // Instagram
  {
    id: 'instagram',
    name: 'Instagram Clássico',
    shortName: 'Instagram',
    tagline: 'Siga-nos no Instagram!',
    category: 'instagram',
    primaryColor: '#C13584',
    accentColor: '#EF4444',
    description: 'Modelo oficial Instagram (10 × 10 cm) com degradê oficial.',
    hostedUrl: 'https://i.postimg.cc/5tqc3vGj/Copia-de-Instagram-editavel.jpg',
    localUrl: '/templates/instagram.jpg',
    imageUrl: '/templates/instagram.jpg',
  },
  {
    id: 'instagram_rosa',
    name: 'Instagram Rosa e Roxo',
    shortName: 'Instagram Rosa',
    tagline: 'Acompanhe Nossas Novidades',
    category: 'instagram',
    primaryColor: '#E1306C',
    accentColor: '#F77737',
    description: 'Visual vibrante em tons rosa e roxo para perfis do Instagram.',
    hostedUrl: 'https://i.postimg.cc/QdBX8qbQ/Instagram-1.jpg',
    localUrl: '/templates/instagram-rosa.jpg',
    imageUrl: '/templates/instagram-rosa.jpg',
  },

  // WhatsApp
  {
    id: 'whatsapp',
    name: 'WhatsApp Clássico',
    shortName: 'WhatsApp',
    tagline: 'Fale Conosco no WhatsApp!',
    category: 'whatsapp',
    primaryColor: '#075E54',
    accentColor: '#25D366',
    description: 'Modelo oficial WhatsApp (10 × 10 cm) com fundo verde.',
    hostedUrl: 'https://i.postimg.cc/DzdVgsD8/Whats-App.jpg',
    localUrl: '/templates/whatsapp.jpg',
    imageUrl: '/templates/whatsapp.jpg',
  },
  {
    id: 'whatsapp_verde',
    name: 'WhatsApp Verde',
    shortName: 'WhatsApp Verde',
    tagline: 'Atendimento Rápido no WhatsApp',
    category: 'whatsapp',
    primaryColor: '#16A34A',
    accentColor: '#22C55E',
    description: 'Arte clean WhatsApp verde com instruções claras de aproximação.',
    hostedUrl: 'https://i.postimg.cc/jSWsxhcV/Instagram.jpg',
    localUrl: '/templates/whatsapp-verde.jpg',
    imageUrl: '/templates/whatsapp-verde.jpg',
  },

  // Pix
  {
    id: 'pix_pb',
    name: 'Pix Preto e Branco',
    shortName: 'Pix P&B',
    tagline: 'Pague com Pix Instantâneo',
    category: 'pix',
    primaryColor: '#111827',
    accentColor: '#32BCAD',
    description: 'Placa Pix de alto contraste preto e branco para pagamentos rápidos.',
    hostedUrl: 'https://i.postimg.cc/0y68kCfX/Instagram-5.jpg',
    localUrl: '/templates/pix-pb.jpg',
    imageUrl: '/templates/pix-pb.jpg',
  },

  // Wi-Fi
  {
    id: 'wifi_pb',
    name: 'Wi-Fi Preto e Branco',
    shortName: 'Wi-Fi P&B',
    tagline: 'Conecte-se ao Nosso Wi-Fi',
    category: 'wifi',
    primaryColor: '#111827',
    accentColor: '#6366F1',
    description: 'Placa Wi-Fi elegante em preto e branco para conexão com a câmera.',
    hostedUrl: 'https://i.postimg.cc/zGLJzkjP/Instagram-4.jpg',
    localUrl: '/templates/wifi-pb.jpg',
    imageUrl: '/templates/wifi-pb.jpg',
  },
];

export function getPlaqueModel(id: PlaqueModelId): PlaqueModel {
  return PLAQUE_MODELS.find((m) => m.id === id) || PLAQUE_MODELS[0];
}

export function getModelLayout(
  modelId: PlaqueModelId,
  customCalibrations?: ModelCalibrationsMap
): ModelLayoutConfig {
  const baseLayout = PLAQUE_LAYOUTS[modelId] || PLAQUE_LAYOUTS.google_azul;
  const calib = customCalibrations?.[modelId];
  if (!calib?.qrPlacement) {
    return baseLayout;
  }

  const { x, y, size } = denormalizePlacement(calib.qrPlacement);
  return {
    ...baseLayout,
    qr: { x, y, size },
    qrClean: {
      x: x - 8,
      y: y - 8,
      w: size + 16,
      h: size + 16,
      rx: baseLayout.qrClean.rx,
    },
  };
}

/**
 * Generates an SVG string representation of the 100x100mm plaque strictly using
 * the 3-LAYER SYSTEM:
 *
 * CAMADA 1 — IMAGEM ORIGINAL (100% faithful to official artwork, 1:1 ratio)
 * CAMADA 2 — QR CODE DINÂMICO (100% square, calibrated placement, safe quiet zone)
 * CAMADA 3 — NUMERAÇÃO SEQUENCIAL (replacing only the original placeholder number)
 */
export function generatePlaqueSVG(
  modelId: PlaqueModelId,
  plaqueNumber: string,
  qrSvgDataUri: string,
  customQrPos?: QRPositionOffset,
  customCalibrations?: ModelCalibrationsMap
): string {
  const layout = getModelLayout(modelId, customCalibrations);
  const asset = TEMPLATE_ASSETS[modelId] || TEMPLATE_ASSETS.google_azul;

  // Format displayed number
  let displayedNumber = plaqueNumber;
  if (modelId === 'google_alternativo') {
    const match = plaqueNumber.match(/\d+$/);
    displayedNumber = match ? match[0] : plaqueNumber;
  } else if (layout.number.prefix && !plaqueNumber.startsWith('#')) {
    const match = plaqueNumber.match(/\d+$/);
    displayedNumber = match ? `#${match[0]}` : `#${plaqueNumber}`;
  }

  // Position calculation with optional per-plaque custom adjustment
  const qrX = customQrPos?.x !== undefined ? customQrPos.x : layout.qr.x;
  const qrY = customQrPos?.y !== undefined ? customQrPos.y : layout.qr.y;
  const qrSize = customQrPos?.size !== undefined ? customQrPos.size : layout.qr.size;

  // Strictly square quiet zone around the QR code
  const cleanSize = qrSize + 16;
  const cleanX = qrX - 8;
  const cleanY = qrY - 8;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
  <!-- CAMADA 1: ARTE ORIGINAL 100% PRESERVADA (100x100mm, proporção 1:1) -->
  <image href="${asset.base64DataUri}" width="1000" height="1000" preserveAspectRatio="none"/>

  <!-- CAMADA 2: QR CODE VERDADEIRO (Área limpa e código estritamente quadrado 1:1) -->
  <rect x="${cleanX}" y="${cleanY}" width="${cleanSize}" height="${cleanSize}" rx="${layout.qrClean.rx || 0}" fill="#FFFFFF"/>
  <image x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" href="${qrSvgDataUri}" preserveAspectRatio="xMidYMid meet"/>

  <!-- CAMADA 3: NUMERAÇÃO REAL (Cobre apenas a numeração ilustrativa original com a cor de fundo local) -->
  <rect x="${layout.numCover.x}" y="${layout.numCover.y}" width="${layout.numCover.w}" height="${layout.numCover.h}" fill="${layout.numCover.color}"/>
  <text x="${layout.number.x}" y="${layout.number.y}" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="${layout.number.fontSize}" font-weight="700" fill="${layout.number.color}" text-anchor="${layout.number.anchor}">${displayedNumber}</text>
</svg>`;
}

