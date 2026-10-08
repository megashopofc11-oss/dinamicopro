import QRCode from 'qrcode';

export interface QRCodeGenerateOptions {
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  width?: number;
}

/**
 * Generates an SVG Data URI for embedding into plaque SVG templates.
 */
export async function generateQRCodeSVGDataUri(
  text: string,
  options: QRCodeGenerateOptions = {}
): Promise<string> {
  const svgString = await QRCode.toString(text, {
    type: 'svg',
    margin: options.margin ?? 1,
    errorCorrectionLevel: options.errorCorrectionLevel ?? 'H',
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

/**
 * Generates high-res PNG Data URL for raster uses and ZIP exports.
 */
export async function generateQRCodePNGDataUrl(
  text: string,
  options: QRCodeGenerateOptions = {}
): Promise<string> {
  return await QRCode.toDataURL(text, {
    margin: options.margin ?? 2,
    errorCorrectionLevel: options.errorCorrectionLevel ?? 'H',
    width: options.width ?? 800,
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
  return await QRCode.toString(text, {
    type: 'svg',
    margin: options.margin ?? 2,
    errorCorrectionLevel: options.errorCorrectionLevel ?? 'H',
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}
