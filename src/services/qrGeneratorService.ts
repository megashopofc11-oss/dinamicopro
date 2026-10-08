import QRCode from 'qrcode';

export interface QRCodeGenerateOptions {
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  width?: number;
}

/**
 * Generates an SVG Data URI for embedding into plaque SVG templates.
 * Enforces strictly square 1:1 ratio, 4-module safety quiet zone, and high error correction.
 */
export async function generateQRCodeSVGDataUri(
  text: string,
  options: QRCodeGenerateOptions = {}
): Promise<string> {
  const qrWidth = options.width ?? 1000;
  const svgString = await QRCode.toString(text, {
    type: 'svg',
    margin: options.margin ?? 4, // 4 modules ISO/IEC quiet zone
    errorCorrectionLevel: options.errorCorrectionLevel ?? 'H',
    width: qrWidth,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

/**
 * Generates high-res PNG Data URL for raster uses, ZIP exports, and canvas rendering.
 * Strictly square (1200x1200 default) with 4-module quiet zone and crisp edges.
 */
export async function generateQRCodePNGDataUrl(
  text: string,
  options: QRCodeGenerateOptions = {}
): Promise<string> {
  return await QRCode.toDataURL(text, {
    margin: options.margin ?? 4,
    errorCorrectionLevel: options.errorCorrectionLevel ?? 'H',
    width: options.width ?? 1200,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

/**
 * Generates clean standalone SVG string for downloading .svg file.
 */
export async function generateQRCodeStandaloneSVG(
  text: string,
  options: QRCodeGenerateOptions = {}
): Promise<string> {
  const qrWidth = options.width ?? 1000;
  return await QRCode.toString(text, {
    type: 'svg',
    margin: options.margin ?? 4,
    errorCorrectionLevel: options.errorCorrectionLevel ?? 'H',
    width: qrWidth,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}
