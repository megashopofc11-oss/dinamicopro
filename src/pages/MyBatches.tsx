import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  FileDown,
  Archive,
  QrCode,
  Search,
  RefreshCw,
  Plus,
  Eye,
  CheckCircle2,
  Calendar,
  X,
} from 'lucide-react';
import { Batch, QRCodeItem } from '../types';
import { getBatches, getBatchQRCodes, getSystemSettings } from '../services/firestoreService';
import { getPlaqueModel } from '../services/templateService';
import { generateBatchA4Pdf, createPdfBlob } from '../services/pdfService';
import { generateBatchZip } from '../services/zipService';
import { PlaqueCard } from '../components/PlaqueCard';
import { EditLinkModal } from '../components/EditLinkModal';
import { PlaqueViewModal } from '../components/PlaqueViewModal';
import { ActivePage } from '../components/Navigation';

interface MyBatchesProps {
  onNavigate: (page: ActivePage, data?: any) => void;
  initialBatchId?: string;
}

export const MyBatches: React.FC<MyBatchesProps> = ({
  onNavigate,
  initialBatchId,
}) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [baseUrl, setBaseUrl] = useState<string>(window.location.origin);

  // Modal de visualização de lote
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [batchItems, setBatchItems] = useState<QRCodeItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Download state
  const [downloadingBatchId, setDownloadingBatchId] = useState<string | null>(null);
  const [downloadType, setDownloadType] = useState<'pdf' | 'zip' | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);

  // Edit Link Modal & View Plaque Modal
  const [editingItem, setEditingItem] = useState<QRCodeItem | null>(null);
  const [viewingItem, setViewingItem] = useState<QRCodeItem | null>(null);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const data = await getBatches();
      setBatches(data);

      if (initialBatchId) {
        const found = data.find((b) => b.id === initialBatchId);
        if (found) {
          handleOpenBatch(found);
        }
      }
    } catch (err) {
      console.error('Error loading batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSystemSettings().then((s) => {
      if (s.redirectBaseUrl) setBaseUrl(s.redirectBaseUrl);
    });
    loadBatches();
  }, [initialBatchId]);

  const handleOpenBatch = async (batch: Batch) => {
    setSelectedBatch(batch);
    try {
      setLoadingItems(true);
      const items = await getBatchQRCodes(batch.id, batch);
      setBatchItems(items);
    } catch (err) {
      console.error('Error loading batch items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleDownloadPdf = async (batch: Batch) => {
    try {
      setDownloadingBatchId(batch.id);
      setDownloadType('pdf');
      setDownloadProgress({ current: 0, total: batch.quantity });

      let items = batchItems;
      if (!selectedBatch || selectedBatch.id !== batch.id || items.length === 0) {
        items = await getBatchQRCodes(batch.id, batch);
      }

      const pdfBytes = await generateBatchA4Pdf(items, baseUrl, (current, total) => {
        setDownloadProgress({ current, total });
      });

      const blob = createPdfBlob(pdfBytes);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${batch.batchCode}_${batch.modelId.toUpperCase()}_A4.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
    } finally {
      setDownloadingBatchId(null);
      setDownloadType(null);
      setDownloadProgress(null);
    }
  };

  const handleDownloadZip = async (batch: Batch) => {
    try {
      setDownloadingBatchId(batch.id);
      setDownloadType('zip');
      setDownloadProgress({ current: 0, total: batch.quantity });

      let items = batchItems;
      if (!selectedBatch || selectedBatch.id !== batch.id || items.length === 0) {
        items = await getBatchQRCodes(batch.id, batch);
      }

      const zipBlob = await generateBatchZip(items, batch.batchCode, baseUrl, (current, total) => {
        setDownloadProgress({ current, total });
      });

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${batch.batchCode}_Plaquinhas.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading ZIP:', err);
    } finally {
      setDownloadingBatchId(null);
      setDownloadType(null);
      setDownloadProgress(null);
    }
  };

  const filteredBatches = batches.filter((b) => {
    const term = searchTerm.toLowerCase();
    const model = getPlaqueModel(b.modelId);
    return (
      b.batchCode.toLowerCase().includes(term) ||
      b.startCode.toLowerCase().includes(term) ||
      b.endCode.toLowerCase().includes(term) ||
      model.name.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Meus Lotes
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Histórico completo de tiragens geradas com numeração e arquivos de impressão
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadBatches}
            disabled={loading}
            title="Atualizar lista"
            className="p-3 rounded-2xl bg-[#0D0D12] hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-400' : ''}`} />
          </button>

          <button
            onClick={() => onNavigate('generate')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs text-white transition-all cursor-pointer shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            style={{
              background: 'linear-gradient(135deg, #FF3344 0%, #DC2626 100%)',
            }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>NOVO LOTE</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#0D0D12] rounded-2xl border border-gray-800/80 p-3 flex items-center gap-3 shadow-lg">
        <Search className="w-4 h-4 text-gray-500 ml-2" />
        <input
          type="text"
          placeholder="Buscar por lote, modelo ou numeração..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none text-xs text-white placeholder-gray-500 focus:outline-none w-full"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-gray-500 hover:text-white mr-2"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Tabela de Lotes */}
      <div className="bg-[#0D0D12] rounded-2xl border border-gray-800/80 overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-500">
            Carregando seus lotes...
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm text-gray-400">Nenhum lote encontrado.</p>
            <button
              onClick={() => onNavigate('generate')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/15 text-red-300 border border-red-500/40 text-xs font-semibold hover:bg-red-500/25 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Gerar novo lote</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#08080B] text-gray-400 font-mono uppercase text-[10px] border-b border-gray-800/80">
                <tr>
                  <th className="py-3 px-4">Número do lote</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Modelo da plaquinha</th>
                  <th className="py-3 px-4">Quantidade</th>
                  <th className="py-3 px-4">Faixa de numeração</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {filteredBatches.map((batch) => {
                  const model = getPlaqueModel(batch.modelId);
                  const isDownloadingThis = downloadingBatchId === batch.id;

                  return (
                    <tr key={batch.id} className="hover:bg-gray-800/20 transition-colors">
                      {/* Número do lote */}
                      <td className="py-3.5 px-4 font-mono font-bold text-red-400">
                        {batch.batchCode}
                      </td>

                      {/* Data */}
                      <td className="py-3.5 px-4 text-gray-400">
                        {new Date(batch.createdAt).toLocaleDateString('pt-BR')}
                      </td>

                      {/* Modelo da plaquinha */}
                      <td className="py-3.5 px-4 text-gray-200">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-gray-800/80 border border-gray-700/60 text-[11px]">
                          {model.shortName}
                        </span>
                      </td>

                      {/* Quantidade */}
                      <td className="py-3.5 px-4 font-mono text-white font-semibold">
                        {batch.quantity} un
                      </td>

                      {/* Faixa de numeração */}
                      <td className="py-3.5 px-4 font-mono text-gray-300">
                        {batch.startCode} — {batch.endCode}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-medium">
                          Concluído
                        </span>
                      </td>

                      {/* Ações: Visualizar lote | Baixar PDF A4 | Baixar ZIP | Ver QR Codes deste lote */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Visualizar lote */}
                          <button
                            onClick={() => handleOpenBatch(batch)}
                            title="Visualizar lote"
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-red-950/60 hover:text-red-300 hover:border-red-500/40 border border-gray-700 text-gray-300 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Baixar PDF A4 */}
                          <button
                            onClick={() => handleDownloadPdf(batch)}
                            disabled={isDownloadingThis}
                            title="Baixar PDF A4 para impressão"
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-red-950/60 hover:text-red-300 hover:border-red-500/40 border border-gray-700 text-gray-300 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <FileDown className={`w-3.5 h-3.5 ${isDownloadingThis && downloadType === 'pdf' ? 'animate-spin' : ''}`} />
                          </button>

                          {/* Baixar ZIP */}
                          <button
                            onClick={() => handleDownloadZip(batch)}
                            disabled={isDownloadingThis}
                            title="Baixar ZIP com todas as artes"
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Archive className={`w-3.5 h-3.5 ${isDownloadingThis && downloadType === 'zip' ? 'animate-spin' : ''}`} />
                          </button>

                          {/* Ver QR Codes deste lote */}
                          <button
                            onClick={() => onNavigate('qrcodes', { filterBatch: batch.batchCode })}
                            title="Ver QR Codes deste lote"
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-red-950/60 hover:text-red-300 border border-gray-700 text-gray-300 transition-colors cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
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

      {/* Modal / Visualizador de Lote Completo */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D0D12] rounded-3xl border border-red-500/30 w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-red-400 font-bold text-sm">
                    {selectedBatch.batchCode}
                  </span>
                  <span className="text-gray-400 text-xs">
                    • {getPlaqueModel(selectedBatch.modelId).name}
                  </span>
                  <span className="text-gray-500 text-xs font-mono">
                    ({selectedBatch.startCode} até {selectedBatch.endCode})
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Visualização de todas as {selectedBatch.quantity} plaquinhas (10 × 10 cm)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(selectedBatch)}
                  disabled={downloadingBatchId === selectedBatch.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-[0_0_15px_rgba(239,68,68,0.35)] cursor-pointer disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #FF3344 0%, #DC2626 100%)',
                  }}
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Baixar PDF A4</span>
                </button>

                <button
                  onClick={() => handleDownloadZip(selectedBatch)}
                  disabled={downloadingBatchId === selectedBatch.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 cursor-pointer disabled:opacity-50"
                >
                  <Archive className="w-3.5 h-3.5 text-red-400" />
                  <span>Baixar ZIP</span>
                </button>

                <button
                  onClick={() => setSelectedBatch(null)}
                  className="p-1.5 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Plaque previews grid */}
            <div className="p-6 overflow-y-auto flex-1">
              {loadingItems ? (
                <div className="py-20 text-center text-xs text-gray-500">
                  Carregando plaquinhas do lote...
                </div>
              ) : batchItems.length === 0 ? (
                <div className="py-20 text-center text-xs text-gray-500">
                  Nenhuma plaquinha encontrada neste lote.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {batchItems.map((item) => (
                    <PlaqueCard
                      key={item.id}
                      item={item}
                      baseUrl={baseUrl}
                      onEditLink={(itemToEdit) => setEditingItem(itemToEdit)}
                      onViewPlaque={(itemToView) => setViewingItem(itemToView)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal VISUALIZAR PLAQUINHA EM ALTA RESOLUÇÃO */}
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

      {/* Modal EDITAR LINK */}
      {editingItem && (
        <EditLinkModal
          item={editingItem}
          baseUrl={baseUrl}
          onClose={() => setEditingItem(null)}
          onSaved={(updated) => {
            setBatchItems((prev) =>
              prev.map((i) => (i.id === updated.id ? updated : i))
            );
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};
