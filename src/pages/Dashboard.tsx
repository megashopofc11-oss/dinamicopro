import React, { useEffect, useState } from 'react';
import {
  QrCode,
  CheckCircle,
  Clock,
  Layers,
  Plus,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Batch, QRCodeItem } from '../types';
import { getBatches, getQRCodes } from '../services/firestoreService';
import { getPlaqueModel } from '../services/templateService';
import { ActivePage } from '../components/Navigation';

interface DashboardProps {
  onNavigate: (page: ActivePage, data?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedBatches, fetchedQRs] = await Promise.all([
        getBatches(),
        getQRCodes(),
      ]);
      setBatches(fetchedBatches);
      setQrCodes(fetchedQRs);
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Métricas
  const totalQRCodes = qrCodes.length;
  const activeQRs = qrCodes.filter((q) => q.status === 'active' && Boolean(q.targetUrl)).length;
  const pendingQRs = qrCodes.filter((q) => !q.targetUrl || q.status === 'pending').length;
  const totalBatches = batches.length;

  const recentBatches = batches.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner / Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Visão Geral
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Controle de plaquinhas e códigos dinâmicos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            title="Atualizar dados"
            className="p-3 rounded-2xl bg-[#0D0D12] hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-400' : ''}`} />
          </button>

          {/* Destaque: + GERAR NOVO LOTE */}
          <button
            onClick={() => onNavigate('generate')}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm text-white transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:shadow-[0_0_35px_rgba(239,68,68,0.6)]"
            style={{
              background: 'linear-gradient(135deg, #FF3344 0%, #DC2626 100%)',
            }}
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>GERAR NOVO LOTE</span>
          </button>
        </div>
      </div>

      {/* 4 Cards Principais Objetivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total de QR Codes */}
        <div className="bg-[#0D0D12] rounded-2xl border border-gray-800/80 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Total de QR Codes</span>
            <div className="w-9 h-9 rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white font-mono">
              {loading ? '...' : totalQRCodes}
            </span>
            <span className="text-xs text-gray-500 ml-2">unidades</span>
          </div>
        </div>

        {/* Card 2: QR Codes Ativos */}
        <div className="bg-[#0D0D12] rounded-2xl border border-gray-800/80 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">QR Codes Ativos</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">
              {loading ? '...' : activeQRs}
            </span>
            <span className="text-xs text-gray-500 ml-2">redirecionando</span>
          </div>
        </div>

        {/* Card 3: QR Codes Pendentes */}
        <div className="bg-[#0D0D12] rounded-2xl border border-gray-800/80 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">QR Codes Pendentes</span>
            <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-amber-400 font-mono">
              {loading ? '...' : pendingQRs}
            </span>
            <span className="text-xs text-gray-500 ml-2">aguardando link</span>
          </div>
        </div>

        {/* Card 4: Total de Lotes */}
        <div className="bg-[#0D0D12] rounded-2xl border border-gray-800/80 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Total de Lotes</span>
            <div className="w-9 h-9 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-300">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white font-mono">
              {loading ? '...' : totalBatches}
            </span>
            <span className="text-xs text-gray-500 ml-2">lotes gerados</span>
          </div>
        </div>
      </div>

      {/* Lotes Recentes */}
      <div className="bg-[#0D0D12] rounded-2xl border border-gray-800/80 overflow-hidden shadow-lg">
        <div className="p-5 border-b border-gray-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Lotes Recentes</h2>
            <p className="text-xs text-gray-500">Últimas tiragens geradas no sistema</p>
          </div>
          {batches.length > 0 && (
            <button
              onClick={() => onNavigate('batches')}
              className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-gray-500">Carregando lotes...</div>
        ) : batches.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm text-gray-400">Nenhum lote gerado até o momento.</p>
            <button
              onClick={() => onNavigate('generate')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/15 text-red-300 border border-red-500/40 text-xs font-semibold hover:bg-red-500/25 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Gerar seu primeiro lote agora</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#08080B] text-gray-400 font-mono uppercase text-[10px] border-b border-gray-800/80">
                <tr>
                  <th className="py-3 px-4">Lote</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Modelo</th>
                  <th className="py-3 px-4">Quantidade</th>
                  <th className="py-3 px-4">Faixa de Numeração</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {recentBatches.map((batch) => {
                  const model = getPlaqueModel(batch.modelId);
                  return (
                    <tr key={batch.id} className="hover:bg-gray-800/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-red-400">
                        {batch.batchCode}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400">
                        {new Date(batch.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3.5 px-4 text-gray-200">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-gray-800/80 border border-gray-700/60 text-[11px]">
                          {model.shortName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-white font-semibold">
                        {batch.quantity} un
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-400">
                        {batch.startCode} — {batch.endCode}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onNavigate('batches', { selectedBatchId: batch.id })}
                          className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-red-950/60 hover:text-red-300 hover:border-red-500/40 border border-gray-700 text-gray-300 transition-colors cursor-pointer font-medium"
                        >
                          Visualizar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
