import React, { useState, useEffect } from 'react';
import { QRCodeItem, QRStatus, QRPositionOffset } from '../types';
import { updateQRCodeDestination } from '../services/firestoreService';
import { generatePlaqueSVG, getPlaqueModel, PLAQUE_LAYOUTS } from '../services/templateService';
import { generateQRCodeSVGDataUri } from '../services/qrGeneratorService';
import { generateSinglePlaquePdf, createPdfBlob, svgToPngBytes } from '../services/pdfService';
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
  Radio,
} from 'lucide-react';

interface EditLinkModalProps {
  item: QRCodeItem;
  baseUrl: string;
  onClose: () => void;
  onSaved: (updatedItem: QRCodeItem) => void;
}

export const EditLinkModal: React.FC<EditLinkModalProps> = ({
  item,
  baseUrl,
  onClose,
  onSaved,
}) => {
  const model = getPlaqueModel(item.modelId);
  const defaultLayout = PLAQUE_LAYOUTS[item.modelId] || PLAQUE_LAYOUTS.google_azul;

  const [targetUrl, setTargetUrl] = useState(item.targetUrl || '');
  const [clientName, setClientName] = useState(item.clientName || '');
  const [status, setStatus] = useState<QRStatus>(item.status);
  const [notes, setNotes] = useState(item.notes || '');

  // QR Position Offset state (per-plaque custom adjustment)
  const [posX, setPosX] = useState<number>(item.qrPosition?.x ?? defaultLayout.qr.x);
  const [posY, setPosY] = useState<number>(item.qrPosition?.y ?? defaultLayout.qr.y);
  const [posSize, setPosSize] = useState<number>(item.qrPosition?.size ?? defaultLayout.qr.size);
  const [showAdjustments, setShowAdjustments] = useState(false);

  // Live preview state
  const [previewSvg, setPreviewSvg] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const permanentUrl = `${baseUrl.replace(/\/$/, '')}/q/${item.shortCode}`;

  // Live render of the plaque SVG as user tweaks inputs
  useEffect(() => {
    let isCurrent = true;
    async function updatePreview() {
      try {
        const qrDataUri = await generateQRCodeSVGDataUri(permanentUrl);
        const customPos: QRPositionOffset = {
          x: posX,
          y: posY,
          size: posSize,
        };
        const svg = generatePlaqueSVG(item.modelId, item.plaqueId, qrDataUri, customPos);
        if (isCurrent) setPreviewSvg(svg);
      } catch (err) {
        console.error('Preview render error in editor:', err);
      }
    }
    updatePreview();
    return () => {
      isCurrent = false;
    };
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

    // Auto-status logic
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
      }, 600);
    } catch (err: any) {
      console.error('Error saving plaque in Firebase:', err);
      setError(err?.message || 'Falha ao salvar no Firebase. Verifique a conexão.');
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
      a.download = `${item.plaqueId}_${model.shortName}_10x10cm.png`;
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
      const pdfBytes = await generateSinglePlaquePdf(itemWithCurrentPos, baseUrl);
      const blob = createPdfBlob(pdfBytes);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.plaqueId}_${model.shortName}_10x10cm.pdf`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#0D0D12] w-full max-w-4xl rounded-3xl border border-red-500/40 shadow-[0_0_60px_rgba(239,68,68,0.25)] flex flex-col max-h-[94vh] overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-gray-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              title="Voltar"
              className="p-2 rounded-xl bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-red-400 font-bold text-sm bg-red-950/80 px-2 py-0.5 rounded-lg border border-red-500/30">
                  {item.plaqueId}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  • {item.batchId}
                </span>
                <span className="text-xs text-white font-medium">
                  • {model.name}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                Editor Individual de Plaquinha
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            title="Fechar"
            className="p-2 rounded-xl bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Live Visual Preview & Position Controls */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden bg-black border-2 border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.2)] relative">
              {previewSvg ? (
                <div
                  className="w-full h-full [&>svg]:w-full [&>svg]:h-full select-none"
                  dangerouslySetInnerHTML={{ __html: previewSvg }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
                  <span>Atualizando arte...</span>
                </div>
              )}
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/85 text-[10px] font-mono text-gray-300 border border-gray-800">
                100 × 100 mm
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
                  <span>Ajuste de Posição do QR Code</span>
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
                      min={50}
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
                      max={400}
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
                <span>{downloadingPng ? '...' : 'Baixar PNG'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white border border-gray-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                <FileDown className="w-3.5 h-3.5 text-red-400" />
                <span>{downloadingPdf ? '...' : 'Baixar PDF'}</span>
              </button>
            </div>
          </div>

          {/* Right: Form Fields & Details */}
          <div className="space-y-4">
            {/* Status & Alerts */}
            {success && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="font-semibold">Plaquinha atualizada com sucesso!</span>
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
                  <span>Testar QR Code</span>
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
                  Anotações de Venda / Observações (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Vendida com plaquinha acrílica 10x10cm, cliente pagou no Pix..."
                  className="w-full px-4 py-2 rounded-xl bg-[#08080B] border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs outline-none resize-none"
                />
              </div>

              {/* Action Buttons: Voltar & Salvar */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Voltar
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
