import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeItem, QRStatus, QRPositionOffset } from '../types';
import { updateQRCodeDestination } from '../services/firestoreService';
import {
  generatePlaqueSVG,
  getPlaqueModel,
  getModelLayout,
} from '../services/templateService';
import { generateQRCodeSVGDataUri } from '../services/qrGeneratorService';
import { generateSinglePlaquePdf, createPdfBlob, svgToPngBytes } from '../services/pdfService';
import { ErrorBoundary } from './ErrorBoundary';
import {
  X,
  ExternalLink,
  Save,
  Link2,
  CheckCircle2,
  AlertCircle,
  Download,
  Sliders,
  RotateCcw,
  ArrowLeft,
  FileDown,
  Check,
  Copy,
  RefreshCw,
} from 'lucide-react';

interface EditLinkModalProps {
  item: QRCodeItem | null;
  baseUrl: string;
  onClose: () => void;
  onSaved: (updatedItem: QRCodeItem) => void;
}

const EditLinkModalContent: React.FC<{
  item: QRCodeItem;
  baseUrl: string;
  onClose: () => void;
  onSaved: (updatedItem: QRCodeItem) => void;
}> = ({ item, baseUrl, onClose, onSaved }) => {
  const model = getPlaqueModel(item.modelId);
  const defaultLayout = getModelLayout(item.modelId);

  const [targetUrl, setTargetUrl] = useState<string>(item.targetUrl || '');
  const [clientName, setClientName] = useState<string>(item.clientName || '');
  const [status, setStatus] = useState<QRStatus>(item.status || 'pending');
  const [notes, setNotes] = useState<string>(item.notes || '');

  // QR Position Offset state (per-plaque custom adjustment)
  const [posX, setPosX] = useState<number>(item.qrPosition?.x ?? defaultLayout.qr.x);
  const [posY, setPosY] = useState<number>(item.qrPosition?.y ?? defaultLayout.qr.y);
  const [posSize, setPosSize] = useState<number>(item.qrPosition?.size ?? defaultLayout.qr.size);
  const [showAdjustments, setShowAdjustments] = useState(false);

  // Live preview state
  const [previewSvg, setPreviewSvg] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const cleanBaseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const permanentUrl = `${cleanBaseUrl.replace(/\/$/, '')}/q/${item.shortCode || item.id || ''}`;

  // Prevent background scrolling while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Live render of the plaque SVG as user tweaks inputs
  const updatePreview = async () => {
    try {
      setPreviewLoading(true);
      setPreviewError(null);
      const qrDataUri = await generateQRCodeSVGDataUri(permanentUrl);
      const customPos: QRPositionOffset = {
        x: posX,
        y: posY,
        size: posSize,
      };
      const svg = generatePlaqueSVG(item.modelId, item.plaqueId, qrDataUri, customPos);
      setPreviewSvg(svg);
    } catch (err: any) {
      console.error('Preview render error in editor:', err);
      setPreviewError(err?.message || 'Falha ao renderizar prévia da plaquinha.');
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    updatePreview();
  }, [item.modelId, item.plaqueId, permanentUrl, posX, posY, posSize]);

  const handleResetPosition = () => {
    setPosX(defaultLayout.qr.x);
    setPosY(defaultLayout.qr.y);
    setPosSize(defaultLayout.qr.size);
  };

  const validateUrl = (url: string): string => {
    let clean = url.trim();
    if (!clean) return '';
    if (!clean.match(/^https?:\/\//i)) {
      clean = 'https://' + clean;
    }
    try {
      const parsed = new URL(clean);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('O link deve utilizar protocolo HTTP ou HTTPS seguro.');
      }
      return clean;
    } catch {
      throw new Error('Informe um endereço web (URL) válido.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let cleanUrl = '';
    if (targetUrl.trim()) {
      try {
        cleanUrl = validateUrl(targetUrl);
      } catch (err: any) {
        setError(err?.message || 'Link inválido. Informe uma URL HTTPS válida.');
        return;
      }
    }

    // Auto-status logic: if URL entered, activate; if cleared, mark pending
    let finalStatus: QRStatus = status;
    if (cleanUrl && status === 'pending') {
      finalStatus = 'active';
    } else if (!cleanUrl && status === 'active') {
      finalStatus = 'pending';
    }

    const customPosition: QRPositionOffset = {
      x: posX,
      y: posY,
      size: posSize,
    };

    try {
      setSaving(true);
      await updateQRCodeDestination({
        id: item.id,
        batchId: item.batchId,
        clientName: clientName.trim(),
        targetUrl: cleanUrl,
        status: finalStatus,
        qrPosition: customPosition,
        notes: notes.trim(),
      });

      const updated: QRCodeItem = {
        ...item,
        clientName: clientName.trim(),
        targetUrl: cleanUrl,
        status: finalStatus,
        qrPosition: customPosition,
        notes: notes.trim(),
        updatedAt: new Date().toISOString(),
      };

      setSuccess(true);
      setTimeout(() => {
        onSaved(updated);
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Error saving plaque in Firebase:', err);
      setError(err?.message || 'Falha ao salvar no Firebase. Verifique a conexão com a internet.');
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(permanentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestRedirect = () => {
    window.open(permanentUrl, '_blank');
  };

  const handleDownloadPng = async () => {
    try {
      setDownloadingPng(true);
      const qrDataUri = await generateQRCodeSVGDataUri(permanentUrl);
      const customPos: QRPositionOffset = { x: posX, y: posY, size: posSize };
      const svg = generatePlaqueSVG(item.modelId, item.plaqueId, qrDataUri, customPos);
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
      const itemWithCurrentPos: QRCodeItem = {
        ...item,
        qrPosition: { x: posX, y: posY, size: posSize },
      };
      const pdfBytes = await generateSinglePlaquePdf(itemWithCurrentPos, cleanBaseUrl);
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

  return (
    <div
      className="fixed inset-0 z-[999999] bg-black/90 backdrop-blur-md overflow-y-auto p-3 sm:p-6 flex min-h-screen items-center justify-center animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="bg-[#0D0D12] w-full max-w-4xl rounded-3xl border border-red-500/40 shadow-[0_0_60px_rgba(239,68,68,0.25)] flex flex-col my-auto overflow-hidden relative">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-gray-800 flex items-center justify-between shrink-0 bg-[#0A0A0F]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              title="Voltar"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-800 transition-colors cursor-pointer text-xs font-semibold disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4 text-red-400" />
              <span>Voltar</span>
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-red-400 font-bold text-sm bg-red-950/80 px-2 py-0.5 rounded-lg border border-red-500/30">
                  {item.plaqueId}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  • {item.qrCodeId}
                </span>
                <span className="text-xs text-white font-medium">
                  • {model.name}
                </span>
              </div>
              <h3 className="text-sm font-bold text-gray-200 mt-0.5">
                Editor Individual da Plaquinha
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            title="Fechar"
            className="p-2 rounded-xl bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Live Visual Preview & Position Controls */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden bg-black border-2 border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.2)] relative flex items-center justify-center">
              {previewLoading ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-xs text-gray-400 gap-2 p-4 text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
                  <span>Atualizando arte 10 × 10 cm...</span>
                </div>
              ) : previewError ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-xs text-rose-300 gap-2 p-4 text-center bg-rose-950/20">
                  <AlertCircle className="w-6 h-6 text-rose-400" />
                  <span>{previewError}</span>
                  <button
                    type="button"
                    onClick={updatePreview}
                    className="mt-1 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs cursor-pointer shadow"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tentar novamente</span>
                  </button>
                </div>
              ) : previewSvg ? (
                <div
                  className="w-full h-full [&>svg]:w-full [&>svg]:h-full select-none"
                  dangerouslySetInnerHTML={{ __html: previewSvg }}
                />
              ) : null}
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/85 text-[10px] font-mono text-gray-300 border border-gray-800 pointer-events-none">
                10 × 10 cm (1:1)
              </div>
            </div>

            {/* Toggle QR Position Sliders */}
            <div className="w-full max-w-[320px] bg-[#08080B] p-3 rounded-2xl border border-gray-800 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowAdjustments(!showAdjustments)}
                  className="flex items-center gap-1.5 text-gray-300 hover:text-white font-semibold cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-red-400" />
                  <span>{showAdjustments ? 'Ocultar Ajuste Fino' : 'Ajustar Posição do QR Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetPosition}
                  title="Restaurar posição padrão da arte"
                  className="p-1 rounded-lg bg-gray-900 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {showAdjustments && (
                <div className="space-y-2.5 pt-2 border-t border-gray-800/80 animate-fade-in">
                  <div>
                    <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                      <span>Posição Horizontal (X):</span>
                      <span className="font-mono text-white">{posX}</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={750}
                      value={posX}
                      onChange={(e) => setPosX(Number(e.target.value))}
                      className="w-full accent-red-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                      <span>Posição Vertical (Y):</span>
                      <span className="font-mono text-white">{posY}</span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={750}
                      value={posY}
                      onChange={(e) => setPosY(Number(e.target.value))}
                      className="w-full accent-red-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                      <span>Tamanho do QR Code:</span>
                      <span className="font-mono text-white">{posSize}px</span>
                    </div>
                    <input
                      type="range"
                      min={160}
                      max={350}
                      value={posSize}
                      onChange={(e) => setPosSize(Number(e.target.value))}
                      className="w-full accent-red-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Export Buttons */}
            <div className="w-full max-w-[320px] grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={downloadingPng}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white border border-gray-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-red-400" />
                <span>{downloadingPng ? 'Baixando...' : 'Baixar PNG'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white border border-gray-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                <FileDown className="w-3.5 h-3.5 text-red-400" />
                <span>{downloadingPdf ? 'Baixando...' : 'Baixar PDF'}</span>
              </button>
            </div>
          </div>

          {/* Right: Form Fields & Details */}
          <div className="space-y-4">
            {/* Status & Alerts */}
            {success && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="font-semibold">Plaquinha gravada e confirmada no Firebase!</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Permanent NFC / QR URL Box */}
            <div className="bg-[#08080B] p-3 rounded-2xl border border-gray-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  URL Permanente da Placa (Física / NFC)
                </span>
                <button
                  type="button"
                  onClick={handleTestRedirect}
                  className="text-[10px] text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Testar Link</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black border border-gray-800">
                <span className="text-xs font-mono text-red-400 truncate flex-1">
                  {permanentUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  title="Copiar link permanente"
                  className="p-1 rounded-lg bg-gray-900 text-gray-300 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-500">
                ✓ A impressão física da placa nunca é perdida ao alterar o link abaixo.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Target Link */}
              <div>
                <label className="block text-xs font-bold text-gray-200 mb-1.5">
                  Link Final de Destino (Google, Instagram, WhatsApp, Pix...)
                </label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://g.page/r/... ou https://instagram.com/loja"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08080B] border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs outline-none font-mono"
                  />
                </div>
              </div>

              {/* Client Name */}
              <div>
                <label className="block text-xs font-bold text-gray-200 mb-1.5">
                  Nome do Cliente / Estabelecimento (Opcional)
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Restaurante Bom Sabor, Dr. Silva..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#08080B] border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs outline-none"
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-200 mb-1.5">
                  Status da Plaquinha
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('active')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      status === 'active'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                        : 'bg-[#08080B] text-gray-400 border-gray-800 hover:text-white'
                    }`}
                  >
                    Ativa
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('pending')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      status === 'pending'
                        ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                        : 'bg-[#08080B] text-gray-400 border-gray-800 hover:text-white'
                    }`}
                  >
                    Pendente
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('disabled')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      status === 'disabled'
                        ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                        : 'bg-[#08080B] text-gray-400 border-gray-800 hover:text-white'
                    }`}
                  >
                    Desativada
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-200 mb-1.5">
                  Anotações / Observações (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Entregue para cliente em acrílico 10x10cm..."
                  className="w-full px-4 py-2 rounded-xl bg-[#08080B] border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs outline-none resize-none"
                />
              </div>

              {/* Action Buttons: Voltar & Salvar */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Voltar aos lotes
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #FF3344 0%, #DC2626 100%)',
                  }}
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export const EditLinkModal: React.FC<EditLinkModalProps> = ({
  item,
  baseUrl,
  onClose,
  onSaved,
}) => {
  if (!item) {
    return null;
  }

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <ErrorBoundary
      fallbackTitle="Erro ao carregar editor da plaquinha"
      onReset={onClose}
    >
      <EditLinkModalContent
        item={item}
        baseUrl={baseUrl}
        onClose={onClose}
        onSaved={onSaved}
      />
    </ErrorBoundary>,
    document.body
  );
};
