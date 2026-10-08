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
  ArrowLeft,
  Clock,
  Layers,
  ChevronRight,
  ExternalLink,
  Download,
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

  // Selected batch for full dedicated view
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
      // Ensure sorted from newest to oldest
      const sorted = [...data].sort((a, b) => (b.batchNumber || 0) - (a.batchNumber || 0));
      setBatches(sorted);

      if (initialBatchId) {
        const found = sorted.find((b) => b.id === initialBatchId || b.batchCode === initialBatchId);
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

  // =========================================================================
  // VIEW MODE B: VISUALIZAÇÃO DEDICADA DO LOTE (Grade Responsiva de Plaquinhas)
  // =========================================================================
  if (selectedBatch) {
    const model = getPlaqueModel(selectedBatch.modelId);
    const isDownloadingThis = downloadingBatchId === selectedBatch.id;

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Top Bar with Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedBatch(null)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 transition-colors cursor-pointer text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar aos lotes</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight uppercase">
                  {selectedBatch.batchCode} — {model.name}
                </h1>
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white border"
                  style={{
                    backgroundColor: `${model.primaryColor}30`,
                    borderColor: `${model.primaryColor}80`,
                  }}
                >
                  {model.category}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">
                {selectedBatch.startCode} até {selectedBatch.endCode} • {selectedBatch.quantity} plaquinhas (10 × 10 cm)
              </p>
            </div>
          </div>

          {/* Export buttons for this batch */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadPdf(selectedBatch)}
              disabled={isDownloadingThis}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-[0_0_15px_rgba(239,68,68,0.35)] cursor-pointer disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #FF3344 0%, #DC2626 100%)',
              }}
            >
              <FileDown className={`w-3.5 h-3.5 ${isDownloadingThis && downloadType === 'pdf' ? 'animate-spin' : ''}`} />
              <span>Baixar PDF A4</span>
            </button>

            <button
              onClick={() => handleDownloadZip(selectedBatch)}
              disabled={isDownloadingThis}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white border border-gray-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Archive className={`w-3.5 h-3.5 text-red-400 ${isDownloadingThis && downloadType === 'zip' ? 'animate-spin' : ''}`} />
              <span>Baixar ZIP</span>
            </button>
          </div>
        </div>

        {/* Download progress banner */}
        {downloadProgress && (
          <div className="p-3.5 rounded-2xl bg-[#0D0D12] border border-red-500/30 flex items-center justify-between text-xs animate-fade-in">
            <span className="text-gray-300">
              Gerando {downloadType === 'pdf' ? 'PDF A4' : 'ZIP'} ({downloadProgress.current} de {downloadProgress.total})...
            </span>
            <div className="w-32 h-1.5 bg-gray-900 rounded-full overflow-hidden ml-4">
              <div
                className="h-full bg-red-500 transition-all duration-200"
                style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Plaques Gallery */}
        {loadingItems ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-gray-400">Carregando plaquinhas de {selectedBatch.batchCode}...</p>
          </div>
        ) : batchItems.length === 0 ? (
          <div className="py-20 text-center bg-[#0D0D12] rounded-3xl border border-gray-800/80 p-8">
            <p className="text-sm text-gray-400 mb-2">Nenhuma plaquinha encontrada neste lote.</p>
            <p className="text-xs text-gray-500">As plaquinhas são carregadas automaticamente pelo identificador do lote.</p>
          </div>
        ) : (
          <div>
            {/* Grid: 1 column on mobile, responsive grid on desktop */}
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

        {/* Modal EDITAR LINK & POSICIONAMENTO */}
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
              setViewingItem(updated);
            }}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE A: LISTA DE LOTES EM CARTÕES MODERNOS E LIMPOS
  // =========================================================================
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header with Back to Dashboard Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 transition-colors cursor-pointer text-xs font-semibold"
            title="Voltar ao Início"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Meus Lotes
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {batches.length} {batches.length === 1 ? 'lote registrado' : 'lotes registrados'} • Ordenados do mais recente ao mais antigo
            </p>
          </div>
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
          placeholder="Buscar por número do lote, modelo ou numeração..."
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

      {/* Grid of Batch Cards */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-gray-400">Carregando lotes de produção...</p>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="p-12 text-center bg-[#0D0D12] rounded-3xl border border-gray-800/80 space-y-3">
          <FolderKanban className="w-10 h-10 text-gray-600 mx-auto" />
          <p className="text-sm text-gray-300 font-semibold">Nenhum lote encontrado.</p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Comece gerando um lote de 10, 30, 50 ou 100 plaquinhas com numeração atômica sequencial.
          </p>
          <button
            onClick={() => onNavigate('generate')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/15 text-red-300 border border-red-500/40 text-xs font-semibold hover:bg-red-500/25 transition-colors cursor-pointer mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Gerar meu primeiro lote</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBatches.map((batch) => {
            const model = getPlaqueModel(batch.modelId);
            const isDownloadingThis = downloadingBatchId === batch.id;
            const dateStr = batch.createdAt
              ? new Date(batch.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              : 'Recente';

            return (
              <div
                key={batch.id}
                className="bg-[#0D0D12] rounded-3xl border border-gray-800/80 hover:border-red-500/50 p-5 flex flex-col justify-between shadow-lg transition-all duration-200 group"
              >
                <div>
                  {/* Card Header: Batch Code & Category Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-white tracking-tight group-hover:text-red-400 transition-colors">
                        {batch.batchCode}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-white border"
                        style={{
                          backgroundColor: `${model.primaryColor}25`,
                          borderColor: `${model.primaryColor}70`,
                        }}
                      >
                        {model.category}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{batch.activeCount || 0}/{batch.quantity} Ativas</span>
                    </span>
                  </div>

                  {/* Model Name & Tagline */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-200">
                      {model.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 truncate">
                      {model.tagline}
                    </p>
                  </div>

                  {/* Batch Details Box */}
                  <div className="bg-[#08080B] rounded-2xl p-3 border border-gray-800/80 space-y-2 mb-4 text-xs font-mono">
                    <div className="flex items-center justify-between text-gray-400">
                      <span className="flex items-center gap-1.5 font-sans">
                        <Layers className="w-3.5 h-3.5 text-red-400" />
                        <span>Quantidade:</span>
                      </span>
                      <span className="text-white font-bold font-sans">
                        {batch.quantity} unidades
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-gray-400">
                      <span className="flex items-center gap-1.5 font-sans">
                        <QrCode className="w-3.5 h-3.5 text-gray-500" />
                        <span>Faixa:</span>
                      </span>
                      <span className="text-red-400 font-semibold truncate max-w-[150px]">
                        {batch.startCode} → {batch.endCode}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-gray-400">
                      <span className="flex items-center gap-1.5 font-sans">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <span>Criado em:</span>
                      </span>
                      <span className="text-gray-300 font-sans">
                        {dateStr}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons: Visualizar & Baixar */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-800/60">
                  {/* Botão Visualizar */}
                  <button
                    onClick={() => handleOpenBatch(batch)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs text-white transition-all cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.3)] hover:shadow-[0_0_18px_rgba(239,68,68,0.5)]"
                    style={{
                      background: 'linear-gradient(135deg, #FF3344 0%, #DC2626 100%)',
                    }}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visualizar</span>
                  </button>

                  {/* Botão Baixar PDF A4 */}
                  <button
                    onClick={() => handleDownloadPdf(batch)}
                    disabled={isDownloadingThis}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-semibold text-xs bg-gray-900 hover:bg-gray-800 text-white border border-gray-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Download className={`w-3.5 h-3.5 text-red-400 ${isDownloadingThis ? 'animate-spin' : ''}`} />
                    <span>Baixar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
