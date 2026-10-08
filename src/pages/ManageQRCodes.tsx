import React, { useEffect, useState } from 'react';
import {
  QrCode,
  Search,
  Filter,
  ExternalLink,
  Edit3,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Ban,
  RefreshCw,
} from 'lucide-react';
import { QRCodeItem, QRStatus } from '../types';
import { getQRCodes, getSystemSettings } from '../services/firestoreService';
import { EditLinkModal } from '../components/EditLinkModal';
import { PlaqueViewModal } from '../components/PlaqueViewModal';
import { Eye } from 'lucide-react';

interface ManageQRCodesProps {
  initialBatchFilter?: string;
}

export const ManageQRCodes: React.FC<ManageQRCodesProps> = ({
  initialBatchFilter,
}) => {
  const [items, setItems] = useState<QRCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | QRStatus>('all');
  const [batchFilter, setBatchFilter] = useState<string>(initialBatchFilter || 'all');
  const [baseUrl, setBaseUrl] = useState<string>(window.location.origin);

  // Edit Link Modal & View Plaque Modal
  const [editingItem, setEditingItem] = useState<QRCodeItem | null>(null);
  const [viewingItem, setViewingItem] = useState<QRCodeItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadQRCodes = async () => {
    try {
      setLoading(true);
      const data = await getQRCodes();
      setItems(data);
    } catch (err) {
      console.error('Error loading QR Codes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSystemSettings().then((s) => {
      if (s.redirectBaseUrl) setBaseUrl(s.redirectBaseUrl);
    });
    loadQRCodes();
  }, []);

  const handleCopyLink = (item: QRCodeItem) => {
    const link = `${baseUrl.replace(/\/$/, '')}/q/${item.shortCode}`;
    navigator.clipboard.writeText(link);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTestLink = (item: QRCodeItem) => {
    const link = `${baseUrl.replace(/\/$/, '')}/q/${item.shortCode}`;
    window.open(link, '_blank');
  };

  // Extrair lotes únicos para filtro
  const uniqueBatches = Array.from(new Set(items.map((i) => i.batchId)));

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      searchTerm === '' ||
      item.qrCodeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.plaqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.clientName && item.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.targetUrl && item.targetUrl.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesBatch = batchFilter === 'all' || item.batchId === batchFilter;

    return matchesSearch && matchesStatus && matchesBatch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Gerenciamento de QR Codes
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Edite o link de destino de cada plaquinha individual a qualquer momento
          </p>
        </div>

        <button
          onClick={loadQRCodes}
          disabled={loading}
          title="Atualizar lista"
          className="self-start sm:self-auto p-3 rounded-2xl bg-[#0D0D12] hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-400' : ''}`} />
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-[#0D0D12] rounded-2xl border border-gray-800/80 p-3 sm:p-4 shadow-lg flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código, plaquinha, cliente ou destino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#08080B] border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#08080B] border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-red-500/50 cursor-pointer w-full md:w-auto"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="pending">Pendentes</option>
            <option value="disabled">Desativados</option>
          </select>

          {/* Batch Filter */}
          {uniqueBatches.length > 0 && (
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="bg-[#08080B] border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-red-500/50 cursor-pointer w-full md:w-auto"
            >
              <option value="all">Todos os lotes</option>
              {uniqueBatches.map((b) => (
                <option key={b} value={b}>
                  Lote {b}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tabela de QR Codes */}
      <div className="bg-[#0D0D12] rounded-2xl border border-gray-800/80 overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-500">
            Carregando QR Codes...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm text-gray-400">Nenhum QR Code encontrado.</p>
            <p className="text-xs text-gray-500">
              Gere um lote para visualizar os QR Codes dinâmicos nesta tabela.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#08080B] text-gray-400 font-mono uppercase text-[10px] border-b border-gray-800/80">
                <tr>
                  <th className="py-3 px-4">Código do QR Code</th>
                  <th className="py-3 px-4">Número da plaquinha</th>
                  <th className="py-3 px-4">Lote de origem</th>
                  <th className="py-3 px-4">Cliente / Destino</th>
                  <th className="py-3 px-4">Link de redirecionamento</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {filteredItems.map((item) => {
                  const isCopied = copiedId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-gray-800/20 transition-colors">
                      {/* Código do QR Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-red-400">
                        {item.qrCodeId}
                      </td>

                      {/* Número da plaquinha */}
                      <td className="py-3.5 px-4 font-mono text-gray-300">
                        {item.plaqueId}
                      </td>

                      {/* Lote de origem */}
                      <td className="py-3.5 px-4 font-mono text-gray-400">
                        {item.batchId}
                      </td>

                      {/* Cliente / Destino */}
                      <td className="py-3.5 px-4 text-white font-medium">
                        {item.clientName || (
                          <span className="text-gray-500 italic">Não definido</span>
                        )}
                      </td>

                      {/* Link de redirecionamento */}
                      <td className="py-3.5 px-4 max-w-xs truncate font-mono text-gray-400 text-[11px]">
                        {item.targetUrl ? (
                          <span title={item.targetUrl} className="text-red-400 hover:underline cursor-pointer" onClick={() => handleTestLink(item)}>
                            {item.targetUrl}
                          </span>
                        ) : (
                          <span className="text-amber-500/80 italic">Aguardando ativação</span>
                        )}
                      </td>

                      {/* Status (Ativo / Pendente) */}
                      <td className="py-3.5 px-4">
                        {item.status === 'active' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Ativo</span>
                          </span>
                        )}
                        {item.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-400 border border-amber-500/30 text-[10px] font-medium">
                            <Clock className="w-3 h-3" />
                            <span>Pendente</span>
                          </span>
                        )}
                        {item.status === 'disabled' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-400 border border-rose-500/30 text-[10px] font-medium">
                            <Ban className="w-3 h-3" />
                            <span>Desativado</span>
                          </span>
                        )}
                      </td>

                      {/* Ações: Editar link | Copiar link direto | Testar link */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Visualizar Plaquinha */}
                          <button
                            onClick={() => setViewingItem(item)}
                            title="Visualizar arte da plaquinha"
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-red-950/60 hover:text-red-300 hover:border-red-500/40 border border-gray-700 text-gray-300 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Editar link */}
                          <button
                            onClick={() => setEditingItem(item)}
                            title="Editar link e cliente"
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-red-950/60 hover:text-red-300 hover:border-red-500/40 border border-gray-700 text-gray-300 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Copiar link direto */}
                          <button
                            onClick={() => handleCopyLink(item)}
                            title="Copiar link direto permanente"
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 transition-colors cursor-pointer"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Testar link */}
                          <button
                            onClick={() => handleTestLink(item)}
                            title="Testar link no navegador"
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-red-950/60 hover:text-red-300 hover:border-red-500/40 border border-gray-700 text-gray-300 transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewingItem && (
        <PlaqueViewModal
          item={viewingItem}
          baseUrl={baseUrl}
          onClose={() => setViewingItem(null)}
          onEditLink={(itemToEdit) => {
            setViewingItem(null);
            setEditingItem(itemToEdit);
          }}
        />
      )}

      {/* Edit Modal */}
      {editingItem && (
        <EditLinkModal
          item={editingItem}
          baseUrl={baseUrl}
          onClose={() => setEditingItem(null)}
          onSaved={(updated) => {
            setItems((prev) =>
              prev.map((i) => (i.id === updated.id ? updated : i))
            );
            setEditingItem(null);
            setViewingItem(updated);
          }}
        />
      )}
    </div>
  );
};
