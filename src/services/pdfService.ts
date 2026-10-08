import { PDFDocument } from 'pdf-lib';
import { QRCodeItem } from '../types';
import { generatePlaqueSVG } from './templateService';
import { generateQRCodeSVGDataUri } from './qrGeneratorService';

// Conversion constants
// 1 mm = 72 / 25.4 points
const MM_TO_POINTS = 72 / 25.4; // ~2.83464567

export const A4_WIDTH_PT = 210 * MM_TO_POINTS; // 595.276 pt
export const A4_HEIGHT_PT = 297 * MM_TO_POINTS; // 841.890 pt

export const PLAQUE_SIZE_PT = 100 * MM_TO_POINTS; // 283.465 pt (100mm)
export const HORIZONTAL_MARGIN_PT = (A4_WIDTH_PT - 2 * PLAQUE_SIZE_PT) / 2; // exactly 14.173 pt (5.0 mm)
export const VERTICAL_MARGIN_PT = (A4_HEIGHT_PT - 2 * PLAQUE_SIZE_PT) / 2; // exactly 137.480 pt (48.5 mm)

/**
 * Converts SVG string to high-res PNG byte array using offscreen canvas.
 * 1200x1200px gives crystal clear >300 DPI print fidelity for 100mm x 100mm.
 */
export async function svgToPngBytes(svgString: string, resolution = 1200): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = resolution;
        canvas.height = resolution;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Canvas 2D context not available'));
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, resolution, resolution);
        URL.revokeObjectURL(url);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to convert canvas to blob'));
            return;
          }
          blob.arrayBuffer().then((buf) => {
            resolve(new Uint8Array(buf));
          });
        }, 'image/png');
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error('Error rendering SVG in Image element: ' + String(e)));
    };

    img.src = url;
  });
}

/**
 * Generates an A4 PDF Document with 2x2 grid of 100x100mm plaques per page.
 */
export async function generateBatchA4Pdf(
  items: QRCodeItem[],
  baseUrl: string,
  onProgress?: (current: number, total: number) => void
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const total = items.length;

  // Process items in chunks of 4 (one A4 page per 4 items)
  const pageSize = 4;
  const pageCount = Math.ceil(total / pageSize);

  for (let pageIdx = 0; pageIdx < pageCount; pageIdx++) {
    const page = pdfDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);
    const pageItems = items.slice(pageIdx * pageSize, (pageIdx + 1) * pageSize);

    for (let slot = 0; slot < pageItems.length; slot++) {
      const item = pageItems[slot];
      const scanUrl = `${baseUrl.replace(/\/$/, '')}/q/${item.shortCode}`;
      
      // Generate QR Code SVG Data URI
      const qrDataUri = await generateQRCodeSVGDataUri(scanUrl);
      
      // Generate Plaque SVG with custom positioning if configured
      const plaqueSvg = generatePlaqueSVG(item.modelId, item.plaqueId, qrDataUri, item.qrPosition);
      
      // Convert to high-res PNG bytes
      const pngBytes = await svgToPngBytes(plaqueSvg, 1200);
      const embeddedImage = await pdfDoc.embedPng(pngBytes);

      // Determine 2x2 grid cell coordinates
      // slot 0: top-left (col 0, row 0)
      // slot 1: top-right (col 1, row 0)
      // slot 2: bottom-left (col 0, row 1)
      // slot 3: bottom-right (col 1, row 1)
      const col = slot % 2;
      const row = Math.floor(slot / 2); // 0 is top row, 1 is bottom row

      const x = HORIZONTAL_MARGIN_PT + col * PLAQUE_SIZE_PT;
      // In PDF coordinate space, (0,0) is bottom-left
      // Top row y is VERTICAL_MARGIN_PT + PLAQUE_SIZE_PT
      // Bottom row y is VERTICAL_MARGIN_PT
      const y = row === 0 ? VERTICAL_MARGIN_PT + PLAQUE_SIZE_PT : VERTICAL_MARGIN_PT;

      page.drawImage(embeddedImage, {
        x,
        y,
        width: PLAQUE_SIZE_PT,
        height: PLAQUE_SIZE_PT,
      });

      if (onProgress) {
        onProgress(pageIdx * pageSize + slot + 1, total);
      }
    }
  }

  return await pdfDoc.save();
}

/**
 * Generates an individual 100x100mm PDF for a single plaque.
 */
export async function generateSinglePlaquePdf(
  item: QRCodeItem,
  baseUrl: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PLAQUE_SIZE_PT, PLAQUE_SIZE_PT]);

  const scanUrl = `${baseUrl.replace(/\/$/, '')}/q/${item.shortCode}`;
  const qrDataUri = await generateQRCodeSVGDataUri(scanUrl);
  const plaqueSvg = generatePlaqueSVG(item.modelId, item.plaqueId, qrDataUri, item.qrPosition);
  const pngBytes = await svgToPngBytes(plaqueSvg, 1200);
  const embeddedImage = await pdfDoc.embedPng(pngBytes);

  page.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width: PLAQUE_SIZE_PT,
    height: PLAQUE_SIZE_PT,
  });

  return await pdfDoc.save();
}

/**
 * Safely creates a Blob from Uint8Array bytes avoiding TypeScript BlobPart mismatch.
 */
export function createPdfBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
}

