import React, { useState } from 'react';
import { QRCodeItem } from '../types';
import { updateQRCodeDestination } from '../services/firestoreService';
import { X, ExternalLink, Check, Save, Link2, CheckCircle2, AlertCircle } from 'lucide-react';

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
  const [targetUrl, setTargetUrl] = useState(item.targetUrl || '');
  const [clientName, setClientName] = useState(item.clientName || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const permanentUrl = `${baseUrl.replace(/\/$/, '')}/q/${item.shortCode}`;

  const validateUrl = (url: string): string => {
    let clean = url.trim();
    if (!clean) return '';
    if (!clean.match(/^https?:\/\//i)) {
      clean = 'https://' + clean;
    }
    try {
      new URL(clean);
      return clean;
    } catch {
      throw new Error('Informe um endereço web (URL) válido.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let cleanUrl = '';
    try {
      cleanUrl = validateUrl(targetUrl);
    } catch (err: any) {
      setError(err?.message || 'Link inválido. Informe uma URL HTTPS válida.');
      return;
    }

    const newStatus = cleanUrl ? 'active' : 'pending';

    try {
      setSaving(true);
      await updateQRCodeDestination({
        id: item.id,
        batchId: item.batchId,
        clientName: clientName.trim(),
        targetUrl: cleanUrl,
        status: newStatus,
      });

      const updated: QRCodeItem = {
        ...item,
        clientName: clientName.trim(),
        targetUrl: cleanUrl,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };

      setSuccess(true);
      setTimeout(() => {
        onSaved(updated);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Error saving link in Firebase:', err);
      setError(err?.message || 'Falha ao salvar no Firebase. Verifique a conexão.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0D0D12] w-full max-w-lg rounded-3xl border border-red-500/40 shadow-[0_0_50px_rgba(239,68,68,0.25)] p-6 sm:p-8 relative">
        {/* Botão X para fechar */}
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          title="Fechar"
          className="absolute top-5 right-5 p-2 rounded-xl bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-red-400 font-bold text-sm bg-red-950/80 px-2.5 py-0.5 rounded-lg border border-red-500/30">
              {item.plaqueId}
            </span>
            <span className="font-mono text-gray-400 text-xs">
              {item.qrCodeId}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white">
            Editar Link de Destino
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Configure o endereço de avaliação, Instagram ou WhatsApp para onde este QR Code deve redirecionar.
          </p>
        </div>

        {/* URL Permanente Gravada na Placa */}
        <div className="mb-5 bg-[#08080B] p-3 rounded-2xl border border-gray-800">
          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
            URL Permanente (Gravada fisicamente na placa)
          </span>
          <p className="text-xs font-mono text-red-400 truncate mt-0.5">
            {permanentUrl}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            ✓ A placa física já impressa NUNCA precisa ser alterada. O redirecionamento é dinâmico.
          </p>
        </div>

        {/* Mensagem de sucesso */}
        {success && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-semibold">Link atualizado com sucesso!</span>
          </div>
        )}

        {/* Mensagem de erro */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Campo para inserir o link */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-200">
                Link de Destino (Google, Instagram, WhatsApp...) *
              </label>
              {targetUrl && (
                <a
                  href={targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-red-400 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Testar link</span>
                </a>
              )}
            </div>

            <div className="relative">
              <Link2 className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="Ex: https://g.page/r/... ou https://instagram.com/pizzaria"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08080B] border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs outline-none font-mono"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Aceita links de avaliação do Google Maps, perfil do Instagram, WhatsApp direto e endereços HTTPS.
            </p>
          </div>

          {/* Nome do Cliente / Estabelecimento */}
          <div>
            <label className="block text-xs font-bold text-gray-200 mb-1.5">
              Nome do Cliente / Estabelecimento (Opcional)
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex: Pizzaria Forno Nobre, Salão de Beleza Elite..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#08080B] border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs outline-none"
            />
          </div>

          {/* Botões CANCELAR e SALVAR */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 transition-colors cursor-pointer"
            >
              CANCELAR
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
              <span>{saving ? 'SALVANDO...' : 'SALVAR'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
