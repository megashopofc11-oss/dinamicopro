import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeItem } from '../types';
import { generatePlaqueSVG, getPlaqueModel } from '../services/templateService';
import { generateQRCodeSVGDataUri } from '../services/qrGeneratorService';
import { generateSinglePlaquePdf, createPdfBlob, svgToPngBytes } from '../services/pdfService';
import { ErrorBoundary } from './ErrorBoundary';
import {
  X,
  Download,
  Copy,
  Check,
  Edit3,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  FileDown,
} from 'lucide-react';

interface PlaqueViewModalProps {
  item: QRCodeItem | null;
  baseUrl: string;
  onClose: () => void;
  onEditLink: (item: QRCodeItem) => void;
}

const PlaqueViewModalContent: React.FC<{
  item: QRCodeItem;
  baseUrl: string;
  onClose: () => void;
  onEditLink: (item: QRCodeItem) => void;
}> = ({ item, baseUrl, onClose, onEditLink }) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const cleanBaseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const permanentUrl = `${cleanBaseUrl.replace(/\/$/, '')}/q/${item.shortCode || item.id || ''}`;
  const model = getPlaqueModel(item.modelId);

  const renderPlaque = async () => {
    try {
      setLoading(true);
      setRenderError(null);
      const qrDataUri = await generateQRCodeSVGDataUri(permanentUrl);
      const svg = generatePlaqueSVG(item.modelId, item.plaqueId, qrDataUri, item.qrPosition);
      setSvgContent(svg);
    } catch (err: any) {
      console.error('Error generating preview in modal:', err);
      setRenderError(err?.message || 'Falha ao processar a arte da plaquinha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    renderPlaque();
  }, [item.modelId, item.plaqueId, permanentUrl, item.qrPosition]);

  // Lock body scroll while modal is mounted
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(permanentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPng = async () => {
    try {
      setDownloadingPng(true);
      const qrDataUri = await generateQRCodeSVGDataUri(permanentUrl);
      const svg = generatePlaqueSVG(item.modelId, item.plaqueId, qrDataUri, item.qrPosition);
      const pngBytes = await svgToPngBytes(svg, 1600);

      const blob = new Blob([pngBytes as unknown as BlobPart], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.plaqueId}_${model.shortName.replace(/\s+/g, '_')}_10x10cm.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PNG:', err);
    } finally {
      setDownloadingPng(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const pdfBytes = await generateSinglePlaquePdf(item, cleanBaseUrl);
      const blob = createPdfBlob(pdfBytes);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.plaqueId}_${model.shortName.replace(/\s+/g, '_')}_10x10cm.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const isActive = item.status === 'active' && Boolean(item.targetUrl);

  return (
    <div
      className="fixed inset-0 z-[999999] bg-black/90 backdrop-blur-md overflow-y-auto p-3 sm:p-6 flex min-h-screen items-center justify-center animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0D0D12] w-full max-w-4xl rounded-3xl border border-red-500/40 shadow-[0_0_60px_rgba(239,68,68,0.25)] flex flex-col my-auto overflow-hidden relative">
        {/* Header with Back Button and Close Button */}
        <div className="p-4 sm:p-5 border-b border-gray-800 flex items-center justify-between shrink-0 bg-[#0A0A0F]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              title="Voltar à listagem"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-800 transition-colors cursor-pointer text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4 text-red-400" />
              <span>Voltar</span>
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white font-mono">
                  {item.plaqueId}
                </h3>
                <span className="text-xs text-gray-400 font-mono">
                  • {item.qrCodeId}
                </span>
                <span className="text-xs text-red-400 font-medium">
                  • {model.name}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Lote: {item.batchId} • Dimensão 10 × 10 cm • Proporção 1:1 Oficial
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Fechar"
            className="p-2 rounded-xl bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left: 1:1 Square Artwork Preview with Zoom Controls */}
          <div className="flex flex-col items-center space-y-3">
            <div className="w-full max-w-[360px] aspect-square rounded-2xl overflow-hidden bg-black border-2 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.2)] relative flex items-center justify-center">
              {loading ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-xs text-gray-400 gap-2 p-4 text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
                  <span>Renderizando arte oficial 10 × 10 cm...</span>
                </div>
              ) : renderError ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-xs text-rose-300 gap-2 p-6 text-center bg-rose-950/20">
                  <AlertTriangle className="w-8 h-8 text-rose-400" />
                  <span className="font-semibold">{renderError}</span>
                  <button
                    type="button"
                    onClick={renderPlaque}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs cursor-pointer shadow-lg"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tentar novamente</span>
                  </button>
                </div>
              ) : svgContent ? (
                <div
                  className="w-full h-full [&>svg]:w-full [&>svg]:h-full select-none transition-transform duration-200"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'center center',
                  }}
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              ) : null}

              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/85 text-[10px] font-mono text-gray-200 border border-gray-800 pointer-events-none">
                10 × 10 cm (1:1)
              </div>
            </div>

            {/* Zoom toolbar */}
            <div className="flex items-center gap-2 bg-[#08080B] px-3 py-1.5 rounded-xl border border-gray-800 text-xs">
              <span className="text-gray-500 text-[10px] uppercase font-bold mr-1">Zoom:</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.8, Number((z - 0.2).toFixed(1))))}
                title="Diminuir zoom"
                className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-gray-300 text-xs w-10 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.0, Number((z + 0.2).toFixed(1))))}
                title="Ampliar sem deformar"
                className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                title="Redefinir tamanho 100%"
                className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white cursor-pointer ml-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-gray-500 font-mono text-center">
              Visualização fiel e proporcional para impressão e corte
            </p>
          </div>

          {/* Right: Plaque Details & Actions */}
          <div className="space-y-4">
            {/* Status Card */}
            <div className="bg-[#08080B] p-4 rounded-2xl border border-gray-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Status do QR Code:</span>
                {isActive ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ativo e Vinculado</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950 text-amber-400 border border-amber-500/40 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Aguardando Configuração</span>
                  </span>
                )}
              </div>

              {/* Client Info */}
              <div className="text-xs">
                <span className="text-gray-400 block mb-0.5">Cliente:</span>
                <span className="text-white font-medium text-sm">
                  {item.clientName || <span className="text-gray-500 italic">Não informado</span>}
                </span>
              </div>

              {/* Target URL */}
              <div className="text-xs">
                <span className="text-gray-400 block mb-0.5">Link de Destino:</span>
                {item.targetUrl ? (
                  <a
                    href={item.targetUrl.startsWith('http') ? item.targetUrl : `https://${item.targetUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-400 hover:underline font-mono break-all text-xs"
                  >
                    {item.targetUrl}
                  </a>
                ) : (
                  <span className="text-amber-500/80 italic text-xs">
                    Nenhum link configurado ainda.
                  </span>
                )}
              </div>

              {/* Permanent URL Box */}
              <div className="pt-2 border-t border-gray-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                    URL Permanente da Placa
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    NFC & QR Code
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black border border-gray-800">
                  <span className="text-xs font-mono text-red-400 truncate flex-1">
                    {permanentUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    title="Copiar link permanente"
                    className="p-1 rounded-lg bg-gray-900 text-gray-300 hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {/* Botão EDITAR */}
              <button
                type="button"
                onClick={() => onEditLink(item)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs text-white transition-all cursor-pointer shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)]"
                style={{
                  background: 'linear-gradient(135deg, #FF3344 0%, #DC2626 100%)',
                }}
              >
                <Edit3 className="w-4 h-4 stroke-[2.5]" />
                <span>EDITAR DADOS E POSIÇÃO</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {/* Download PNG */}
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={downloadingPng}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white border border-gray-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-red-400" />
                  <span>{downloadingPng ? 'Baixando...' : 'Baixar PNG (10x10)'}</span>
                </button>

                {/* Download PDF */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white border border-gray-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <FileDown className="w-4 h-4 text-red-400" />
                  <span>{downloadingPdf ? 'Baixando...' : 'Baixar PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PlaqueViewModal: React.FC<PlaqueViewModalProps> = ({
  item,
  baseUrl,
  onClose,
  onEditLink,
}) => {
  if (!item) {
    return null;
  }

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <ErrorBoundary
      fallbackTitle="Erro ao carregar visualização da plaquinha"
      onReset={onClose}
    >
      <PlaqueViewModalContent
        item={item}
        baseUrl={baseUrl}
        onClose={onClose}
        onEditLink={onEditLink}
      />
    </ErrorBoundary>,
    document.body
  );
};
