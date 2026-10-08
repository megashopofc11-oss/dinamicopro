import React, { useEffect, useState } from 'react';
import { QRCodeItem, PlaqueModelId } from '../types';
import { generatePlaqueSVG, getPlaqueModel } from '../services/templateService';
import { generateQRCodeSVGDataUri, generateQRCodePNGDataUrl } from '../services/qrGeneratorService';
import { generateSinglePlaquePdf, createPdfBlob } from '../services/pdfService';
import { Download, QrCode, Copy, Check, Edit3 } from 'lucide-react';

interface PlaquePreviewProps {
  item: QRCodeItem;
  baseUrl: string;
  size?: number; // visual preview size in px (default 320)
  showActions?: boolean;
  onEdit?: () => void;
}

export const PlaquePreview: React.FC<PlaquePreviewProps> = ({
  item,
  baseUrl,
  size = 320,
  showActions = true,
  onEdit,
}) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const scanUrl = `${baseUrl.replace(/\/$/, '')}/q/${item.shortCode}`;
  const model = getPlaqueModel(item.modelId);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const qrDataUri = await generateQRCodeSVGDataUri(scanUrl);
        const svg = generatePlaqueSVG(item.modelId, item.plaqueId, qrDataUri);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        console.error('Error generating plaque preview SVG:', err);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [item.modelId, item.plaqueId, scanUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(scanUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSinglePdf = async () => {
    try {
      setDownloading(true);
      const pdfBytes = await generateSinglePlaquePdf(item, baseUrl);
      const blob = createPdfBlob(pdfBytes);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.plaqueId}_100x100mm.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading single PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadQrPng = async () => {
    try {
      const pngUrl = await generateQRCodePNGDataUrl(scanUrl, { width: 1000 });
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `${item.qrCodeId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading QR PNG:', err);
    }
  };

  const statusColors = {
    pending: 'bg-amber-950/80 text-amber-300 border-amber-600/40',
    active: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40',
    disabled: 'bg-rose-950/80 text-rose-300 border-rose-600/40',
  };

  const statusLabels = {
    pending: 'Pendente',
    active: 'Ativo',
    disabled: 'Desativado',
  };

  return (
    <div className="flex flex-col items-center bg-[#0D0D12] p-4 rounded-3xl border border-gray-800 shadow-xl relative group hover:border-red-500/50 transition-all duration-300">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-red-400 bg-red-950/60 px-2.5 py-1 rounded-lg border border-red-500/30">
            {item.plaqueId}
          </span>
          <span className="text-gray-400 font-medium truncate max-w-[120px]">
            {model.shortName}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onEdit && (
            <button
              onClick={onEdit}
              title="Editar destino"
              className="p-1 rounded-md bg-gray-800 hover:bg-red-950 text-gray-400 hover:text-red-300 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          )}
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              statusColors[item.status]
            }`}
          >
            {statusLabels[item.status]}
          </span>
        </div>
      </div>

      {/* 100x100mm Proportional Plaque Art Display */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl bg-black border border-gray-700/60 transition-transform duration-300 group-hover:scale-[1.02]"
        style={{ width: `${size}px`, height: `${size}px`, aspectRatio: '1 / 1' }}
      >
        {svgContent ? (
          <div
            className="w-full h-full [&>svg]:w-full [&>svg]:h-full select-none"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 text-xs gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
            <span>Renderizando arte 100x100mm...</span>
          </div>
        )}

        {/* 100x100mm watermark overlay */}
        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[9px] font-mono text-gray-300 border border-gray-700 pointer-events-none">
          100 × 100 mm
        </div>
      </div>

      {/* Target Destination URL / Client label */}
      <div className="w-full mt-3 px-1 text-xs">
        <div className="flex items-center justify-between text-gray-400">
          <span className="truncate text-gray-300 font-medium">
            {item.clientName || 'Cliente não atribuído'}
          </span>
          <span className="text-[11px] text-gray-500 font-mono">
            {item.scanCount || 0} scans
          </span>
        </div>
        <p className="text-[11px] text-red-400/90 truncate mt-0.5 font-mono">
          {item.targetUrl || 'Aguardando link de ativação'}
        </p>
      </div>

      {/* Quick Actions */}
      {showActions && (
        <div className="w-full grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-800">
          <button
            onClick={handleCopyLink}
            title="Copiar URL dinâmica"
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700/80 text-xs font-medium transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="truncate">{copied ? 'Copiado' : 'Link'}</span>
          </button>

          <button
            onClick={handleDownloadQrPng}
            title="Baixar QR Code PNG"
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700/80 text-xs font-medium transition-colors cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-red-400" />
            <span className="truncate">QR PNG</span>
          </button>

          <button
            onClick={handleDownloadSinglePdf}
            disabled={downloading}
            title="Baixar Placa Individual em PDF"
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-red-950/70 hover:bg-red-900/80 text-red-300 border border-red-500/40 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="truncate">{downloading ? '...' : 'PDF'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
