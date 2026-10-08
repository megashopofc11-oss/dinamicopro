import React, { useState } from 'react';
import { QRCodeItem, QRStatus } from '../types';
import { updateQRCodeDestination } from '../services/firestoreService';
import { getPlaqueModel } from '../services/templateService';
import { X, ExternalLink, Copy, Check, Save, ShieldCheck, AlertCircle } from 'lucide-react';

interface EditQRCodeModalProps {
  item: QRCodeItem;
  baseUrl: string;
  onClose: () => void;
  onSaved: (updatedItem: QRCodeItem) => void;
}

export const EditQRCodeModal: React.FC<EditQRCodeModalProps> = ({
  item,
  baseUrl,
  onClose,
  onSaved,
}) => {
  const [clientName, setClientName] = useState(item.clientName || '');
  const [targetUrl, setTargetUrl] = useState(item.targetUrl || '');
  const [status, setStatus] = useState<QRStatus>(item.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const model = getPlaqueModel(item.modelId);
  const dynamicUrl = `${baseUrl.replace(/\/$/, '')}/q/${item.shortCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(dynamicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let cleanUrl = targetUrl.trim();
    if (cleanUrl && !cleanUrl.match(/^https?:\/\//i)) {
      cleanUrl = 'https://' + cleanUrl;
      setTargetUrl(cleanUrl);
    }

    // Auto-switch to active if destination url is filled and status was pending
    let newStatus = status;
    if (cleanUrl && status === 'pending') {
      newStatus = 'active';
    } else if (!cleanUrl && status === 'active') {
      newStatus = 'pending';
    }

    try {
      setSaving(true);
      await updateQRCodeDestination({
        id: item.id,
        batchId: item.batchId,
        clientName: clientName.trim(),
        targetUrl: cleanUrl,
        status: newStatus,
      });

      onSaved({
        ...item,
        clientName: clientName.trim(),
        targetUrl: cleanUrl,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      console.error('Error updating QR Code:', err);
      setError(err?.message || 'Falha ao salvar no Firebase. Verifique sua conexão.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0D0D12] w-full max-w-lg rounded-3xl border border-red-500/40 shadow-[0_0_50px_rgba(239,68,68,0.25)] p-6 sm:p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Editar QR Code Dinâmico
            </h3>
            <p className="text-xs text-gray-400 font-mono">
              {item.plaqueId} • {item.batchId} • {model.shortName}
            </p>
          </div>
        </div>

        {/* Dynamic Permanent URL display */}
        <div className="mb-6 bg-[#08080B] p-3.5 rounded-2xl border border-gray-800 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
              URL Permanente Impressa na Placa (NFC)
            </span>
            <p className="text-xs font-mono text-red-400 truncate mt-0.5">
              {dynamicUrl}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 text-xs font-medium cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Client Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Nome do Cliente / Estabelecimento (Opcional)
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex: Restaurante Bella Napoli, Dra. Maria Silva..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#08080B] border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-sm outline-none transition-colors"
            />
          </div>

          {/* Destination URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-300">
                Link de Destino Final
              </label>
              {targetUrl && (
                <a
                  href={targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-red-400 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Testar link
                </a>
              )}
            </div>

            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="Ex: https://g.page/r/... ou https://instagram.com/perfil"
              className="w-full px-4 py-2.5 rounded-xl bg-[#08080B] border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-sm outline-none transition-colors font-mono"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Você pode alterar esse link a qualquer momento sem trocar a placa física!
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Status do Redirecionamento
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  status === 'pending'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                    : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:border-gray-700'
                }`}
              >
                Pendente
              </button>

              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  status === 'active'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:border-gray-700'
                }`}
              >
                Ativo
              </button>

              <button
                type="button"
                onClick={() => setStatus('disabled')}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  status === 'disabled'
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                    : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:border-gray-700'
                }`}
              >
                Desativado
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all cursor-pointer disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #FF3344 0%, #DC2626 100%)',
              }}
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Gravando no Firebase...' : 'Salvar no Firebase'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
