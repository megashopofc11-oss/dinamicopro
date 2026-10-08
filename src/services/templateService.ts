import { PlaqueModel, PlaqueModelId } from '../types';
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

export const PLAQUE_LAYOUTS: Record<PlaqueModelId, ModelLayoutConfig> = {
  // GOOGLE — MODELO 01 (Google Alternativo / Plaquinha 01)
  // URL: https://i.postimg.cc/JhcwqJgR/Plaquinha-01.jpg
  // QR slot on the left, number "01" at bottom-right corner
  google_alternativo: {
    qrClean: { x: 105, y: 590, w: 300, h: 300, rx: 14 },
    qr: { x: 115, y: 600, size: 280 },
    numCover: { x: 880, y: 940, w: 110, h: 40, color: '#FFFFFF' },
    number: { x: 975, y: 966, fontSize: 24, anchor: 'end', color: '#111827' },
  },

  // GOOGLE — MODELO 02 (Google Azul)
  // URL: https://i.postimg.cc/JhWVZKT7/Google.jpg
  // QR slot on the right, number "#000" at bottom center
  google_azul: {
    qrClean: { x: 630, y: 645, w: 280, h: 280, rx: 14 },
    qr: { x: 640, y: 655, size: 260 },
    numCover: { x: 410, y: 960, w: 180, h: 30, color: '#FFFFFF' },
    number: { x: 500, y: 980, fontSize: 18, anchor: 'middle', color: '#111827', prefix: '#' },
  },

  // INSTAGRAM
  // URL: https://i.postimg.cc/5tqc3vGj/Copia-de-Instagram-editavel.jpg
  // QR slot on the right, number "#000" at bottom center
  instagram: {
    qrClean: { x: 630, y: 645, w: 280, h: 280, rx: 14 },
    qr: { x: 640, y: 655, size: 260 },
    numCover: { x: 410, y: 948, w: 180, h: 30, color: '#FFFFFF' },
    number: { x: 500, y: 968, fontSize: 18, anchor: 'middle', color: '#111827', prefix: '#' },
  },

  // WHATSAPP
  // URL: https://i.postimg.cc/DzdVgsD8/Whats-App.jpg
  // QR slot on the right, number at bottom center
  whatsapp: {
    qrClean: { x: 635, y: 615, w: 290, h: 290, rx: 14 },
    qr: { x: 645, y: 625, size: 270 },
    numCover: { x: 410, y: 902, w: 180, h: 30, color: '#FFFFFF' },
    number: { x: 500, y: 922, fontSize: 18, anchor: 'middle', color: '#111827', prefix: '#' },
  },
};

export const PLAQUE_MODELS: PlaqueModel[] = [
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
    id: 'instagram',
    name: 'Instagram',
    shortName: 'Instagram',
    tagline: 'Siga-nos no Instagram!',
    category: 'instagram',
    primaryColor: '#C13584',
    accentColor: '#EF4444',
    description: 'Modelo oficial Instagram (10 × 10 cm) com degradê oficial e QR Code à direita.',
    hostedUrl: 'https://i.postimg.cc/5tqc3vGj/Copia-de-Instagram-editavel.jpg',
    localUrl: '/templates/instagram.jpg',
    imageUrl: '/templates/instagram.jpg',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    shortName: 'WhatsApp',
    tagline: 'Fale Conosco no WhatsApp!',
    category: 'whatsapp',
    primaryColor: '#075E54',
    accentColor: '#25D366',
    description: 'Modelo oficial WhatsApp (10 × 10 cm) com fundo verde e QR Code à direita.',
    hostedUrl: 'https://i.postimg.cc/DzdVgsD8/Whats-App.jpg',
    localUrl: '/templates/whatsapp.jpg',
    imageUrl: '/templates/whatsapp.jpg',
  },
];

export function getPlaqueModel(id: PlaqueModelId): PlaqueModel {
  return PLAQUE_MODELS.find((m) => m.id === id) || PLAQUE_MODELS[0];
}

/**
 * Generates an SVG string representation of the 100x100mm plaque strictly using
 * the 3-LAYER SYSTEM requested:
 *
 * CAMADA 1 — IMAGEM ORIGINAL (100% faithful to official artwork, 1:1 ratio)
 * CAMADA 2 — QR CODE DINÂMICO (positioned in designated area, clean contrast)
 * CAMADA 3 — NUMERAÇÃO SEQUENCIAL (replacing only the original placeholder number)
 */
export function generatePlaqueSVG(
  modelId: PlaqueModelId,
  plaqueNumber: string,
  qrSvgDataUri: string
): string {
  const layout = PLAQUE_LAYOUTS[modelId] || PLAQUE_LAYOUTS.google_azul;
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

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
  <!-- CAMADA 1: ARTE ORIGINAL 100% PRESERVADA (100x100mm, proporção 1:1) -->
  <image href="${asset.base64DataUri}" width="1000" height="1000" preserveAspectRatio="none"/>

  <!-- CAMADA 2: QR CODE VERDADEIRO (Área limpa e código centralizado) -->
  <rect x="${layout.qrClean.x}" y="${layout.qrClean.y}" width="${layout.qrClean.w}" height="${layout.qrClean.h}" rx="${layout.qrClean.rx || 0}" fill="#FFFFFF"/>
  <image x="${layout.qr.x}" y="${layout.qr.y}" width="${layout.qr.size}" height="${layout.qr.size}" href="${qrSvgDataUri}" preserveAspectRatio="xMidYMid meet"/>

  <!-- CAMADA 3: NUMERAÇÃO REAL (Cobre apenas a numeração ilustrativa original com a cor de fundo local) -->
  <rect x="${layout.numCover.x}" y="${layout.numCover.y}" width="${layout.numCover.w}" height="${layout.numCover.h}" fill="${layout.numCover.color}"/>
  <text x="${layout.number.x}" y="${layout.number.y}" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="${layout.number.fontSize}" font-weight="700" fill="${layout.number.color}" text-anchor="${layout.number.anchor}">${displayedNumber}</text>
</svg>`;
}
