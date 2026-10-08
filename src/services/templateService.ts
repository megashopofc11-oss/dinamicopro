import { PlaqueModel, PlaqueModelId, QRPositionOffset } from '../types';
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
  // QR Code no lado esquerdo, abaixo da frase 'APONTE A SUA CÂMERA'
  google_alternativo: {
    qrClean: { x: 105, y: 590, w: 300, h: 300, rx: 14 },
    qr: { x: 115, y: 600, size: 280 },
    numCover: { x: 880, y: 940, w: 110, h: 40, color: '#FFFFFF' },
    number: { x: 975, y: 966, fontSize: 24, anchor: 'end', color: '#111827' },
  },

  // GOOGLE — MODELO 02 (Google Azul Oficial)
  // QR Code no lado direito, abaixo da instrução superior
  google_azul: {
    qrClean: { x: 630, y: 645, w: 280, h: 280, rx: 14 },
    qr: { x: 640, y: 655, size: 260 },
    numCover: { x: 410, y: 960, w: 180, h: 30, color: '#FFFFFF' },
    number: { x: 500, y: 980, fontSize: 18, anchor: 'middle', color: '#111827', prefix: '#' },
  },

  // GOOGLE AVALIAÇÃO PRETO (Novo Modelo)
  // Texto 'APONTE A SUA CÂMERA' inicia em y=822. QR posicionado em y=520 com margem de segurança de >50px.
  google_preto: {
    qrClean: { x: 598, y: 510, w: 270, h: 270, rx: 14 },
    qr: { x: 608, y: 520, size: 250 },
    numCover: { x: 410, y: 945, w: 180, h: 30, color: '#FFFFFF' },
    number: { x: 500, y: 965, fontSize: 18, anchor: 'middle', color: '#111827', prefix: '#' },
  },

  // GOOGLE AVALIAÇÃO AZUL NOVO (Novo Modelo)
  // Texto 'APONTE A SUA CÂMERA' inicia em y=822. QR perfeitamente centrado e livre de sobreposições.
  google_azul_novo: {
    qrClean: { x: 598, y: 510, w: 270, h: 270, rx: 14 },
    qr: { x: 608, y: 520, size: 250 },
    numCover: { x: 410, y: 945, w: 180, h: 30, color: '#FFFFFF' },
    number: { x: 500, y: 965, fontSize: 18, anchor: 'middle', color: '#111827', prefix: '#' },
  },

  // INSTAGRAM CLÁSSICO (Degradê Original)
  instagram: {
    qrClean: { x: 630, y: 645, w: 280, h: 280, rx: 14 },
    qr: { x: 640, y: 655, size: 260 },
    numCover: { x: 410, y: 948, w: 180, h: 30, color: '#FFFFFF' },
    number: { x: 500, y: 968, fontSize: 18, anchor: 'middle', color: '#111827', prefix: '#' },
  },

  // INSTAGRAM ROSA E ROXO (Novo Modelo)
  // Texto 'APONTE A SUA CÂMERA' em y=818. QR perfeitamente centralizado em x=583 com folga de segurança.
  instagram_rosa: {
    qrClean: { x: 573, y: 510, w: 270, h: 270, rx: 14 },
    qr: { x: 583, y: 520, size: 250 },
    numCover: { x: 410, y: 945, w: 180, h: 30, color: '#FFFFFF' },
    number: { x: 500, y: 965, fontSize: 18, anchor: 'middle', color: '#111827', prefix: '#' },
  },

  // WHATSAPP CLÁSSICO (Original)
  whatsapp: {
    qrClean: { x: 635, y: 615, w: 290, h: 290, rx: 14 },
    qr: { x: 645, y: 625, size: 270 },
    numCover: { x: 410, y: 902, w: 180, h: 30, color: '#FFFFFF' },
    number: { x: 500, y: 922, fontSize: 18, anchor: 'middle', color: '#111827', prefix: '#' },
  },

  // WHATSAPP VERDE (Novo Modelo)
  // Texto 'APONTE A SUA CÂMERA' em y=824. QR em y=520, sem sobreposição do texto.
  whatsapp_verde: {
    qrClean: { x: 598, y: 510, w: 270, h: 270, rx: 14 },
    qr: { x: 608, y: 520, size: 250 },
    numCover: { x: 410, y: 945, w: 180, h: 30, color: '#FFFFFF' },
    number: { x: 500, y: 965, fontSize: 18, anchor: 'middle', color: '#111827', prefix: '#' },
  },

  // PIX PRETO E BRANCO (Novo Modelo)
  // Texto 'APONTE A SUA CÂMERA' em y=822. QR em y=520, sem sobreposição do texto.
  pix_pb: {
    qrClean: { x: 598, y: 510, w: 270, h: 270, rx: 14 },
    qr: { x: 608, y: 520, size: 250 },
    numCover: { x: 410, y: 945, w: 180, h: 30, color: '#FFFFFF' },
    number: { x: 500, y: 965, fontSize: 18, anchor: 'middle', color: '#111827', prefix: '#' },
  },

  // WI-FI PRETO E BRANCO (Novo Modelo)
  // Texto 'APONTE A SUA CÂMERA' em y=822. QR em y=520, sem sobreposição do texto.
  wifi_pb: {
    qrClean: { x: 598, y: 510, w: 270, h: 270, rx: 14 },
    qr: { x: 608, y: 520, size: 250 },
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

/**
 * Generates an SVG string representation of the 100x100mm plaque strictly using
 * the 3-LAYER SYSTEM requested:
 *
 * CAMADA 1 — IMAGEM ORIGINAL (100% faithful to official artwork, 1:1 ratio)
 * CAMADA 2 — QR CODE DINÂMICO (positioned in designated area, clean contrast, customizable offset)
 * CAMADA 3 — NUMERAÇÃO SEQUENCIAL (replacing only the original placeholder number)
 */
export function generatePlaqueSVG(
  modelId: PlaqueModelId,
  plaqueNumber: string,
  qrSvgDataUri: string,
  customQrPos?: QRPositionOffset
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

  // Position calculation with optional per-plaque custom adjustment
  const qrX = customQrPos?.x !== undefined ? customQrPos.x : layout.qr.x;
  const qrY = customQrPos?.y !== undefined ? customQrPos.y : layout.qr.y;
  const qrSize = customQrPos?.size !== undefined ? customQrPos.size : layout.qr.size;

  const cleanX = customQrPos?.x !== undefined ? customQrPos.x - 10 : layout.qrClean.x;
  const cleanY = customQrPos?.y !== undefined ? customQrPos.y - 10 : layout.qrClean.y;
  const cleanW = customQrPos?.size !== undefined ? customQrPos.size + 20 : layout.qrClean.w;
  const cleanH = customQrPos?.size !== undefined ? customQrPos.size + 20 : layout.qrClean.h;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
  <!-- CAMADA 1: ARTE ORIGINAL 100% PRESERVADA (100x100mm, proporção 1:1) -->
  <image href="${asset.base64DataUri}" width="1000" height="1000" preserveAspectRatio="none"/>

  <!-- CAMADA 2: QR CODE VERDADEIRO (Área limpa e código centralizado) -->
  <rect x="${cleanX}" y="${cleanY}" width="${cleanW}" height="${cleanH}" rx="${layout.qrClean.rx || 0}" fill="#FFFFFF"/>
  <image x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" href="${qrSvgDataUri}" preserveAspectRatio="xMidYMid meet"/>

  <!-- CAMADA 3: NUMERAÇÃO REAL (Cobre apenas a numeração ilustrativa original com a cor de fundo local) -->
  <rect x="${layout.numCover.x}" y="${layout.numCover.y}" width="${layout.numCover.w}" height="${layout.numCover.h}" fill="${layout.numCover.color}"/>
  <text x="${layout.number.x}" y="${layout.number.y}" font-family="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" font-size="${layout.number.fontSize}" font-weight="700" fill="${layout.number.color}" text-anchor="${layout.number.anchor}">${displayedNumber}</text>
</svg>`;
}

