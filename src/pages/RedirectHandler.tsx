import React, { useEffect, useState } from 'react';
import { getQRCodeByShortCode, incrementScanCount } from '../services/firestoreService';
import { QRCodeItem } from '../types';
import { getPlaqueModel } from '../services/templateService';
import { Loader2, Radio, AlertTriangle, ExternalLink, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

interface RedirectHandlerProps {
  code: string;
}

export const RedirectHandler: React.FC<RedirectHandlerProps> = ({ code }) => {
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<QRCodeItem | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function checkRedirect() {
      try {
        setLoading(true);
        const qrItem = await getQRCodeByShortCode(code);

        if (isCancelled) return;

        if (!qrItem) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setItem(qrItem);
        setLoading(false);

        // If active and has target URL, perform real dynamic redirect
        if (qrItem.status === 'active' && qrItem.targetUrl) {
          setRedirecting(true);

          // Increment scan count async in background (non-blocking)
          incrementScanCount(qrItem.id).catch((e) =>
            console.error('Error logging scan count:', e)
          );

          // Prepare destination
          let dest = qrItem.targetUrl.trim();
          if (!dest.match(/^https?:\/\//i)) {
            dest = 'https://' + dest;
          }

          // Smooth redirect with 800ms visual confirmation
          setTimeout(() => {
            window.location.href = dest;
          }, 800);
        }
      } catch (err) {
        console.error('Error during redirection check:', err);
        if (!isCancelled) {
          setNotFound(true);
          setLoading(false);
        }
      }
    }

    checkRedirect();

    return () => {
      isCancelled = true;
    };
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-950/80 border border-red-500/40 p-4 shadow-[0_0_30px_rgba(239,68,68,0.3)] mb-4 animate-pulse">
          <Radio className="w-full h-full text-red-400" />
        </div>
        <div className="flex items-center gap-2 text-red-400 font-mono text-sm mb-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Consultando NFC &amp; QR Dinâmico...</span>
        </div>
        <p className="text-xs text-gray-500 font-mono">Código: {code}</p>
      </div>
    );
  }

  if (redirecting && item) {
    return (
      <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-950/80 border border-emerald-500/40 p-4 shadow-[0_0_30px_rgba(16,185,129,0.3)] mb-4 animate-bounce">
          <CheckCircle2 className="w-full h-full text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">
          {item.clientName || 'Estabelecimento Conectado'}
        </h2>
        <p className="text-xs text-red-400 font-mono mb-4">
          Redirecionando para o destino oficial...
        </p>
        <div className="w-48 h-1.5 bg-gray-900 rounded-full overflow-hidden mx-auto">
          <div className="w-full h-full bg-gradient-to-r from-red-500 to-emerald-400 animate-pulse" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-[#0D0D12] p-8 rounded-3xl border border-rose-500/30 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-white mb-2">
            Código Não Encontrado
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed mb-4">
            O identificador <code>{code}</code> não consta na base de dados de plaquinhas ativas.
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-red-400 text-xs font-semibold border border-gray-700 transition-colors"
          >
            Acessar Painel Principal
          </a>
        </div>
      </div>
    );
  }

  const model = item ? getPlaqueModel(item.modelId) : null;

  // Status: Disabled
  if (item?.status === 'disabled') {
    return (
      <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-[#0D0D12] p-8 rounded-3xl border border-rose-500/30 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/40">
            {item.plaqueId}
          </span>
          <h2 className="text-xl font-extrabold text-white mt-3 mb-2">
            Plaquinha Temporariamente Desativada
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            O redirecionamento deste QR Code está suspenso pelo administrador do sistema.
          </p>
        </div>
      </div>
    );
  }

  // Status: Pending Activation
  return (
    <div className="min-h-screen bg-[#050507] text-gray-200 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full bg-[#0D0D12]/95 backdrop-blur-xl p-8 rounded-3xl border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center relative z-10">
        {/* Top NFC Contactless Wave icon */}
        <div className="w-16 h-16 rounded-3xl bg-red-950/80 border border-red-500/40 flex items-center justify-center mx-auto mb-5 shadow-[0_0_25px_rgba(239,68,68,0.3)]">
          <Radio className="w-8 h-8 text-red-400 animate-pulse" />
        </div>

        {/* Badges */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-red-950/80 text-red-300 border border-red-500/30">
            {item?.plaqueId}
          </span>
          <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Aguardando Ativação
          </span>
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight mb-2">
          Plaquinha NFC Inteligente
        </h1>

        <p className="text-xs text-gray-400 leading-relaxed mb-6">
          Esta plaquinha física já foi fabricada e programada com sucesso! O estabelecimento
          ou cliente ainda não configurou o link de destino definitivo no painel administrativo.
        </p>

        {/* Specs Box */}
        <div className="bg-[#08080B] rounded-2xl p-4 border border-gray-800 text-left space-y-2 mb-6 font-mono text-xs">
          <div className="flex justify-between text-gray-400">
            <span>Identificador:</span>
            <strong className="text-red-400">{item?.qrCodeId}</strong>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Modelo Físico:</span>
            <span className="text-white">{model?.name}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Lote de Origem:</span>
            <span className="text-gray-300">{item?.batchId}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Tecnologia:</span>
            <span className="text-emerald-400">NFC Contactless + QR Dinâmico</span>
          </div>
        </div>

        <p className="text-[11px] text-gray-500">
          Assim que o administrador cadastrar o destino no painel, este QR Code redirecionará automaticamente
          sem necessidade de trocar a arte impressa.
        </p>

        <div className="mt-6 pt-4 border-t border-gray-800/80">
          <a
            href="/"
            className="text-xs font-semibold text-red-400 hover:text-red-300 hover:underline flex items-center justify-center gap-1"
          >
            <span>Sou o administrador / Ativar agora</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
