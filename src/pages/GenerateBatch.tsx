import React, { useState, useEffect } from 'react';
import {
  Layers,
  FileDown,
  Archive,
  QrCode,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { PlaqueModelId, Batch, QRCodeItem } from '../types';
import { PLAQUE_MODELS, getPlaqueModel, generatePlaqueSVG } from '../services/templateService';
import { generateQRCodeSVGDataUri } from '../services/qrGeneratorService';
import {
  generateBatchA4Pdf,
  createPdfBlob,
} from '../services/pdfService';
import { generateBatchZip, generateQROnlyZip } from '../services/zipService';
import { createBatchWithQRCodes, getSystemSettings } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';
import { ProgressBar } from '../components/ProgressBar';
import { PlaqueCard } from '../components/PlaqueCard';
import { EditLinkModal } from '../components/EditLinkModal';
import { PlaqueViewModal } from '../components/PlaqueViewModal';
import { ActivePage } from '../components/Navigation';

const QUANTITIES = [10, 30, 50, 100];

interface GenerateBatchProps {
  onNavigate: (page: ActivePage, data?: any) => void;
}

export const GenerateBatch: React.FC<GenerateBatchProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [selectedModel, setSelectedModel] = useState<PlaqueModelId>('google_alternativo');
  const [quantity, setQuantity] = useState<number>(30);
  const [baseUrl, setBaseUrl] = useState<string>(window.location.origin);

  // Generation state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [completedBatch, setCompletedBatch] = useState<Batch | null>(null);
  const [generatedItems, setGeneratedItems] = useState<QRCodeItem[]>([]);
  const [downloadingType, setDownloadingType] = useState<'pdf' | 'zip' | 'qrs' | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);
  const [editingItem, setEditingItem] = useState<QRCodeItem | null>(null);
  const [viewingItem, setViewingItem] = useState<QRCodeItem | null>(null);

  // Model thumbnail SVG cache
  const [modelSvgs, setModelSvgs] = useState<Record<string, string>>({});

  useEffect(() => {
    getSystemSettings().then((s) => {
      if (s.redirectBaseUrl) setBaseUrl(s.redirectBaseUrl);
    });

    async function loadPreviews() {
      const svgs: Record<string, string> = {};
      const sampleQr = await generateQRCodeSVGDataUri('https://dinamicopro.com/sample');
      for (const m of PLAQUE_MODELS) {
        svgs[m.id] = generatePlaqueSVG(m.id, '000001', sampleQr);
      }
      setModelSvgs(svgs);
    }
    loadPreviews();
  }, []);

  const handleGenerateBatch = async () => {
    if (!currentUser || isProcessing) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgressPercent(10);
      setProgressMessage('Conectando ao Firebase e reservando numeração...');

      const result = await createBatchWithQRCodes({
        userId: currentUser.uid,
        userEmail: currentUser.email || '',
        modelId: selectedModel,
        quantity,
      });

      setProgressPercent(80);
      setProgressMessage('Gravando registros sequenciais no Firestore...');

      setCompletedBatch(result.batch);
      setGeneratedItems(result.items);

      setProgressPercent(100);
      setProgressMessage('Lote gerado com sucesso!');
    } catch (err: any) {
      console.error('Batch generation failed:', err);
      setErrorMessage(err?.message || 'Falha ao processar no Firebase. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!completedBatch || generatedItems.length === 0) return;
    try {
      setDownloadingType('pdf');
      setDownloadProgress({ current: 0, total: generatedItems.length });

      const pdfBytes = await generateBatchA4Pdf(generatedItems, baseUrl, (current, total) => {
        setDownloadProgress({ current, total });
      });

      const blob = createPdfBlob(pdfBytes);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${completedBatch.batchCode}_${completedBatch.modelId.toUpperCase()}_A4.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setDownloadingType(null);
      setDownloadProgress(null);
    }
  };

  const handleDownloadZip = async () => {
    if (!completedBatch || generatedItems.length === 0) return;
    try {
      setDownloadingType('zip');
      setDownloadProgress({ current: 0, total: generatedItems.length });

      const zipBlob = await generateBatchZip(
        generatedItems,
        completedBatch.batchCode,
        baseUrl,
        (current, total) => {
          setDownloadProgress({ current, total });
        }
      );

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${completedBatch.batchCode}_Plaquinhas.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating ZIP:', err);
    } finally {
      setDownloadingType(null);
      setDownloadProgress(null);
    }
  };

  const handleDownloadQRsOnlyZip = async () => {
    if (!completedBatch || generatedItems.length === 0) return;
    try {
      setDownloadingType('qrs');
      setDownloadProgress({ current: 0, total: generatedItems.length });

      const zipBlob = await generateQROnlyZip(
        generatedItems,
        completedBatch.batchCode,
        baseUrl,
        (current, total) => {
          setDownloadProgress({ current, total });
        }
      );

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${completedBatch.batchCode}_QRCodes_Individuais.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating QR ZIP:', err);
    } finally {
      setDownloadingType(null);
      setDownloadProgress(null);
    }
  };

  const currentModelData = getPlaqueModel(selectedModel);

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Gerar Plaquinhas
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Escolha o modelo oficial e a quantidade para gerar plaquinhas 10 × 10 cm com numeração sequencial
        </p>
      </div>

      {/* BEFORE GENERATION: Form */}
      {!completedBatch && (
        <div className="space-y-6">
          {/* 1. Escolha seu modelo */}
          <div className="bg-[#0D0D12] rounded-2xl border border-gray-800/80 p-5 sm:p-6 shadow-lg">
            <h2 className="text-sm font-bold text-white mb-4">
              Escolha seu modelo oficial (10 × 10 cm)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PLAQUE_MODELS.map((model) => {
                const isSelected = selectedModel === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => !isProcessing && setSelectedModel(model.id)}
                    className={`flex flex-col p-3 rounded-2xl border transition-all duration-200 cursor-pointer relative ${
                      isSelected
                        ? 'bg-[#180A0E] border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.35)]'
                        : 'bg-[#08080B] border-gray-800 hover:border-gray-700 hover:bg-[#121217]'
                    } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {/* Model Name & Radio */}
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-semibold text-white truncate">
                        {model.shortName}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-red-500 bg-red-500'
                            : 'border-gray-600 bg-transparent'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </div>
                    </div>

                    {/* 1:1 Large Thumbnail */}
                    <div className="w-full aspect-square rounded-xl overflow-hidden bg-black border border-gray-800 relative">
                      {modelSvgs[model.id] ? (
                        <div
                          className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                          dangerouslySetInnerHTML={{ __html: modelSvgs[model.id] }}
                        />
                      ) : (
                        <img
                          src={model.localUrl || model.hostedUrl}
                          alt={model.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-mono text-gray-300">
                        10×10 cm
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Quantidade */}
          <div className="bg-[#0D0D12] rounded-2xl border border-gray-800/80 p-5 sm:p-6 shadow-lg">
            <h2 className="text-sm font-bold text-white mb-4">
              Quantidade de Plaquinhas
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {QUANTITIES.map((qty) => {
                const isSelected = quantity === qty;
                return (
                  <button
                    key={qty}
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setQuantity(qty)}
                    className={`py-4 px-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#25090E] to-[#120508] border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                        : 'bg-[#08080B] border-gray-800 hover:border-gray-700 text-gray-300 hover:bg-[#121217]'
                    }`}
                  >
                    <span className="text-2xl font-bold font-mono">
                      {qty}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-red-400">
                      unidades
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Progress Bar */}
          {isProcessing && (
            <ProgressBar
              currentStepMessage={progressMessage}
              percent={progressPercent}
              totalUnits={quantity}
              error={errorMessage}
            />
          )}

          {errorMessage && !isProcessing && (
            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Botão GERAR PLAQUINHAS */}
          {!isProcessing && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerateBatch}
                className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:shadow-[0_0_35px_rgba(239,68,68,0.6)] flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #FF3344 0%, #DC2626 100%)',
                }}
              >
                <Layers className="w-5 h-5" />
                <span>GERAR PLAQUINHAS ({quantity} UNIDADES)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* AFTER GENERATION: Automatic Batch View */}
      {completedBatch && (
        <div className="space-y-6 animate-fade-in">
          {/* Header with Batch Info and Action Buttons */}
          <div className="bg-[#0D0D12] rounded-2xl border border-gray-800/80 p-5 sm:p-6 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono">
                    LOTE CONCLUÍDO
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    {completedBatch.startCode} até {completedBatch.endCode}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  {completedBatch.batchCode} • {currentModelData.shortName} • {completedBatch.quantity} unidades
                </h2>
              </div>

              {/* 3 Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* 1. Baixar PDF A4 para impressão */}
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingType !== null}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.35)] disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #FF3344 0%, #DC2626 100%)',
                  }}
                >
                  <FileDown className="w-4 h-4" />
                  <span>
                    {downloadingType === 'pdf'
                      ? `Gerando PDF (${downloadProgress?.current || 0}/${downloadProgress?.total || 0})...`
                      : 'Baixar PDF A4 para impressão'}
                  </span>
                </button>

                {/* 2. Baixar ZIP com todas as plaquinhas */}
                <button
                  onClick={handleDownloadZip}
                  disabled={downloadingType !== null}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-gray-900 hover:bg-gray-800 text-white border border-gray-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Archive className="w-4 h-4 text-red-400" />
                  <span>
                    {downloadingType === 'zip'
                      ? `Compactando ZIP (${downloadProgress?.current || 0}/${downloadProgress?.total || 0})...`
                      : 'Baixar ZIP com todas as plaquinhas'}
                  </span>
                </button>

                {/* 3. Baixar QR Codes individuais */}
                <button
                  onClick={handleDownloadQRsOnlyZip}
                  disabled={downloadingType !== null}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-gray-900 hover:bg-gray-800 text-white border border-gray-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <QrCode className="w-4 h-4 text-red-400" />
                  <span>
                    {downloadingType === 'qrs'
                      ? `Baixando QR Codes (${downloadProgress?.current || 0}/${downloadProgress?.total || 0})...`
                      : 'Baixar QR Codes individuais'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Grid with ALL generated plaques */}
          <div className="bg-[#0D0D12] rounded-2xl border border-gray-800/80 p-5 sm:p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">
                Todas as {generatedItems.length} Plaquinhas do Lote
              </h3>
              <span className="text-xs text-gray-500 font-mono">
                Tamanho 10 × 10 cm • QR Code Dinâmico Aplicado
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {generatedItems.map((item) => (
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

          {/* Navigation link to start another or manage */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setCompletedBatch(null);
                setGeneratedItems([]);
              }}
              className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              ← Gerar outro lote
            </button>

            <button
              onClick={() => onNavigate('qrcodes', { filterBatch: completedBatch.batchCode })}
              className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Gerenciar links deste lote</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

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
                setGeneratedItems((prev) =>
                  prev.map((i) => (i.id === updated.id ? updated : i))
                );
                setEditingItem(null);
                setViewingItem(updated);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
