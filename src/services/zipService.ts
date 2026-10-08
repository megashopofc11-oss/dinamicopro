import JSZip from 'jszip';
import { QRCodeItem } from '../types';
import { generatePlaqueSVG } from './templateService';
import { generateQRCodeSVGDataUri, generateQRCodePNGDataUrl } from './qrGeneratorService';
import { svgToPngBytes } from './pdfService';

/**
 * Creates a ZIP file containing each plaque as a high-resolution PNG image (1200x1200px)
 * along with its individual QR Code PNG.
 */
export async function generateBatchZip(
  items: QRCodeItem[],
  batchCode: string,
  baseUrl: string,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const plaquesFolder = zip.folder(`Plaquinhas_${batchCode}`);
  const qrcodesFolder = zip.folder(`QRCodes_${batchCode}`);

  const total = items.length;

  for (let i = 0; i < total; i++) {
    const item = items[i];
    const scanUrl = `${baseUrl.replace(/\/$/, '')}/q/${item.shortCode}`;

    // 1. Generate QR Code SVG Data Uri & Plaque SVG
    const qrDataUri = await generateQRCodeSVGDataUri(scanUrl);
    const plaqueSvg = generatePlaqueSVG(item.modelId, item.plaqueId, qrDataUri);

    // 2. High-res Plaque PNG (1200x1200px for 100x100mm 300+ DPI print)
    const plaquePngBytes = await svgToPngBytes(plaqueSvg, 1200);
    plaquesFolder?.file(`${item.plaqueId}_100x100mm.png`, plaquePngBytes);

    // 3. Standalone QR PNG
    const qrPngDataUrl = await generateQRCodePNGDataUrl(scanUrl, { width: 1000 });
    const qrBase64 = qrPngDataUrl.split(',')[1];
    qrcodesFolder?.file(`${item.qrCodeId}.png`, qrBase64, { base64: true });

    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  // Include a summary text file
  zip.file(
    'informacoes_do_lote.txt',
    `LOTE: ${batchCode}\nQUANTIDADE: ${total} plaquinhas\nNUMERAÇÃO: ${items[0]?.plaqueId} até ${items[total - 1]?.plaqueId}\nGERADO EM: ${new Date().toLocaleString('pt-BR')}\nSISTEMA: Dinâmico Pro\n`
  );

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Creates a ZIP containing exclusively the individual standalone QR Code PNG images.
 */
export async function generateQRCodesZip(
  items: QRCodeItem[],
  batchCode: string,
  baseUrl: string,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const qrcodesFolder = zip.folder(`QRCodes_${batchCode}`);
  const total = items.length;

  for (let i = 0; i < total; i++) {
    const item = items[i];
    const scanUrl = `${baseUrl.replace(/\/$/, '')}/q/${item.shortCode}`;

    const qrPngDataUrl = await generateQRCodePNGDataUrl(scanUrl, { width: 1000 });
    const qrBase64 = qrPngDataUrl.split(',')[1];
    qrcodesFolder?.file(`${item.qrCodeId}_${item.plaqueId}.png`, qrBase64, { base64: true });

    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}

export const generateQROnlyZip = generateQRCodesZip;

