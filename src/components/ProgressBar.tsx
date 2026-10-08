import React from 'react';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ProgressBarProps {
  currentStepMessage: string;
  percent: number;
  totalUnits: number;
  isCompleted?: boolean;
  error?: string | null;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStepMessage,
  percent,
  totalUnits,
  isCompleted,
  error,
}) => {
  return (
    <div className="w-full bg-[#0D0D12] p-6 rounded-3xl border border-red-500/30 shadow-[0_0_35px_rgba(239,68,68,0.2)] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {error ? (
            <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          ) : isCompleted ? (
            <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-red-950/60 border border-red-500/40 text-red-400 animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}

          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              {error ? 'Erro na Geração' : isCompleted ? 'Lote Gerado com Sucesso!' : 'Processando Produção em Massa'}
            </h4>
            <p className="text-xs text-gray-400">{currentStepMessage}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-2xl font-black font-mono text-red-400">
            {Math.round(percent)}%
          </span>
          <p className="text-[11px] text-gray-500 font-mono">
            Meta: {totalUnits} plaquinhas
          </p>
        </div>
      </div>

      {/* Progress track */}
      <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden p-0.5 border border-gray-800">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            error
              ? 'bg-rose-500'
              : isCompleted
              ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]'
              : 'bg-gradient-to-r from-red-600 via-red-500 to-red-400 shadow-[0_0_15px_rgba(239,68,68,0.7)]'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>

      {/* Status micro bullets */}
      <div className="flex items-center justify-between text-[11px] text-gray-500 mt-3 pt-2 border-t border-gray-800/80 font-mono">
        <span>1. Reserva Atômica</span>
        <span>2. QR Codes Vetoriais</span>
        <span>3. Cloud Firestore</span>
        <span>4. Pronto para Impressão</span>
      </div>
    </div>
  );
};
