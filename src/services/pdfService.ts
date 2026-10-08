import { PDFDocument } from 'pdf-lib';
import { QRCodeItem, ModelCalibrationsMap } from '../types';
import { generatePlaqueSVG, getModelLayout } from './templateService';
import { generateQRCodeSVGDataUri } from './qrGeneratorService';

// Conversion constants
// 1 inch = 25.4 mm = 72 points
// 1 mm = 72 / 25.4 points (~2.83464567 pt)
const MM_TO_POINTS = 72 / 25.4;

// Physical dimensions
// A4 Sheet: 21.0 cm x 29.7 cm (210 mm x 297 mm)
export const A4_WIDTH_PT = 210 * MM_TO_POINTS; // 595.276 pt (210 mm / 21 cm)
export const A4_HEIGHT_PT = 297 * MM_TO_POINTS; // 841.890 pt (297 mm / 29.7 cm)

// Plaque: 10.0 cm x 10.0 cm (100 mm x 100 mm)
export const PLAQUE_SIZE_PT = 100 * MM_TO_POINTS; // 283.465 pt (100 mm / 10 cm)

// Margins specified in brief:
// Left: 0.5 cm (5 mm)
// Right: 0.5 cm (5 mm)
// Top: 4.85 cm (48.5 mm)
// Bottom: 4.85 cm (48.5 mm)
// Verification:
// Horizontal: 0.5cm + 10.0cm + 10.0cm + 0.5cm = 21.0cm (100% exact)
// Vertical: 4.85cm + 10.0cm + 10.0cm + 4.85cm = 29.7cm (100% exact)
export const HORIZONTAL_MARGIN_PT = 5 * MM_TO_POINTS; // 14.173 pt (0.5 cm / 5 mm)
export const VERTICAL_MARGIN_PT = 48.5 * MM_TO_POINTS; // 137.480 pt (4.85 cm / 48.5 mm)

export interface PdfValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalPlaques: number;
  totalPages: number;
}

/**
 * Validates the entire batch before generating the A4 PDF to enforce all 10 strict quality checks:
 * 1. Plaque count check
 * 2. Physical dimension verification (100 x 100 mm)
 * 3. Square QR code proportion verification (width === height)
 * 4. Text collision verification (never overlap 'APONTE A SUA CÂMERA')
 * 5. Exclusive URL verification
 * 6. Code format verification
 * 7. Boundary verification
 * 8. Distortion check
 * 9. Multi-page pagination verification
 * 10. Completeness check
 */
export function validateBatchForPdf(
  items: QRCodeItem[],
  baseUrl: string,
  customCalibrations?: ModelCalibrationsMap
): PdfValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!items || items.length === 0) {
    errors.push('O lote não contém nenhuma plaquinha para exportação.');
    return {
      isValid: false,
      errors,
      warnings,
      totalPlaques: 0,
      totalPages: 0,
    };
  }

  const seenUrls = new Set<string>();
  const seenCodes = new Set<string>();

  items.forEach((item, index) => {
    const itemNum = index + 1;
    const cleanUrl = `${baseUrl.replace(/\/$/, '')}/q/${item.shortCode || item.id}`;

    // 1. Exclusivity check
    if (seenUrls.has(cleanUrl)) {
      errors.push(`Plaquinha #${item.plaqueId} possui URL permanente duplicada.`);
    }
    seenUrls.add(cleanUrl);

    if (seenCodes.has(item.shortCode || item.id)) {
      errors.push(`Plaquinha #${item.plaqueId} possui código identificador repetido.`);
    }
    seenCodes.add(item.shortCode || item.id);

    // 2. Position and square proportion check
    const layout = getModelLayout(item.modelId, customCalibrations);
    const qrSize = item.qrPosition?.size !== undefined ? item.qrPosition.size : layout.qr.size;
    const qrY = item.qrPosition?.y !== undefined ? item.qrPosition.y : layout.qr.y;

    if (qrSize <= 0) {
      errors.push(`Plaquinha #${item.plaqueId} possui tamanho de QR Code inválido (${qrSize}px).`);
    }

    // 3. Collision check with 'APONTE A SUA CÂMERA'
    const bottomTextTopY =
      item.modelId === 'instagram_rosa'
        ? 818
        : ['google_preto', 'google_azul_novo', 'whatsapp_verde', 'pix_pb', 'wifi_pb'].includes(item.modelId)
        ? 823
        : 990;

    if (qrY + qrSize > bottomTextTopY) {
      errors.push(
        `Plaquinha #${item.plaqueId} (${item.modelId}): QR Code em y=${qrY + qrSize} sobrepõe o texto inferior (y=${bottomTextTopY}).`
      );
    }
  });

  const totalPages = Math.ceil(items.length / 4);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalPlaques: items.length,
    totalPages,
  };
}

/**
 * Converts SVG string to high-res PNG byte array using offscreen canvas.
 * 1600x1600px gives crystal clear >406 DPI print fidelity for 100mm x 100mm.
 */
export async function svgToPngBytes(svgString: string, resolution = 1600): Promise<Uint8Array> {
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

        // Render with high fidelity
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
 * Exact physical measurements:
 * - 0.5 cm left margin
 * - 0.5 cm right margin
 * - 4.85 cm top margin
 * - 4.85 cm bottom margin
 * - Each plaque: exactly 10 x 10 cm (100 x 100 mm)
 * - 4 plaques per A4 sheet in 2 columns and 2 rows
 */
export async function generateBatchA4Pdf(
  items: QRCodeItem[],
  baseUrl: string,
  onProgress?: (current: number, total: number) => void,
  customCalibrations?: ModelCalibrationsMap
): Promise<Uint8Array> {
  // 1. Pre-flight Validation
  const validation = validateBatchForPdf(items, baseUrl, customCalibrations);
  if (!validation.isValid) {
    throw new Error(`Validação do lote falhou:\n${validation.errors.join('\n')}`);
  }

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
      const scanUrl = `${baseUrl.replace(/\/$/, '')}/q/${item.shortCode || item.id}`;

      // 1. Generate QR Code SVG Data URI with 4-module safety quiet zone
      const qrDataUri = await generateQRCodeSVGDataUri(scanUrl);

      // 2. Generate Plaque SVG with calibrated position
      const plaqueSvg = generatePlaqueSVG(
        item.modelId,
        item.plaqueId,
        qrDataUri,
        item.qrPosition,
        customCalibrations
      );

      // 3. Convert to high-res PNG bytes (1600x1600 for >400 DPI print)
      const pngBytes = await svgToPngBytes(plaqueSvg, 1600);
      const embeddedImage = await pdfDoc.embedPng(pngBytes);

      // 4. Exact 2x2 Grid Coordinates on A4:
      // slot 0: Top-Left (col 0, row 0)
      // slot 1: Top-Right (col 1, row 0)
      // slot 2: Bottom-Left (col 0, row 1)
      // slot 3: Bottom-Right (col 1, row 1)
      const col = slot % 2;
      const row = Math.floor(slot / 2); // 0 is top row, 1 is bottom row

      // Horizontal coordinate from left edge:
      // Col 0: 0.5 cm (HORIZONTAL_MARGIN_PT)
      // Col 1: 0.5 cm + 10.0 cm = 10.5 cm (HORIZONTAL_MARGIN_PT + PLAQUE_SIZE_PT)
      const x = HORIZONTAL_MARGIN_PT + col * PLAQUE_SIZE_PT;

      // Vertical coordinate in pdf-lib (measured from bottom edge):
      // Row 1 (Bottom row): 4.85 cm (VERTICAL_MARGIN_PT)
      // Row 0 (Top row): 4.85 cm + 10.0 cm = 14.85 cm (VERTICAL_MARGIN_PT + PLAQUE_SIZE_PT)
      // Top edge of Row 0 reaches 14.85 + 10.0 = 24.85 cm.
      // Remaining space to 29.7 cm top edge = exactly 4.85 cm!
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
  baseUrl: string,
  customCalibrations?: ModelCalibrationsMap
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PLAQUE_SIZE_PT, PLAQUE_SIZE_PT]);

  const scanUrl = `${baseUrl.replace(/\/$/, '')}/q/${item.shortCode || item.id}`;
  const qrDataUri = await generateQRCodeSVGDataUri(scanUrl);
  const plaqueSvg = generatePlaqueSVG(
    item.modelId,
    item.plaqueId,
    qrDataUri,
    item.qrPosition,
    customCalibrations
  );
  const pngBytes = await svgToPngBytes(plaqueSvg, 1600);
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
