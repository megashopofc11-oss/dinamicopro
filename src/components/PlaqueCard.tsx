import React, { useEffect, useState } from 'react';
import { QRCodeItem } from '../types';
import { generatePlaqueSVG, getPlaqueModel } from '../services/templateService';
import { generateQRCodeSVGDataUri } from '../services/qrGeneratorService';
import { generateSinglePlaquePdf, createPdfBlob, svgToPngBytes } from '../services/pdfService';
import {
  Eye,
  Edit3,
  Download,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface PlaqueCardProps {
  item: QRCodeItem;
  baseUrl: string;
  onEditLink: (item: QRCodeItem) => void;
  onViewPlaque?: (item: QRCodeItem) => void;
}

export const PlaqueCard: React.FC<PlaqueCardProps> = ({
  item,
  baseUrl,
  onEditLink,
  onViewPlaque,
}) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const permanentUrl = `${baseUrl.replace(/\/$/, '')}/q/${item.shortCode}`;
  const model = getPlaqueModel(item.modelId);

  useEffect(() => {
    let isMounted = true;
    async function renderPlaque() {
      try {
        const qrDataUri = await generateQRCodeSVGDataUri(permanentUrl);
        const svg = generatePlaqueSVG(item.modelId, item.plaqueId, qrDataUri, item.qrPosition);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        console.error('Error rendering plaque SVG in card:', err);
      }
    }
    renderPlaque();
    return () => {
      isMounted = false;
    };
  }, [item.modelId, item.plaqueId, permanentUrl, item.qrPosition]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(permanentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Baixar Plaquinha Individual (Alta Resolução 1200x1200px PNG)
  const handleDownloadPlaque = async () => {
    try {
      setDownloading(true);
      const qrDataUri = await generateQRCodeSVGDataUri(permanentUrl);
      const svg = generatePlaqueSVG(item.modelId, item.plaqueId, qrDataUri, item.qrPosition);
      const pngBytes = await svgToPngBytes(svg, 1200);

      const blob = new Blob([pngBytes as unknown as BlobPart], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.plaqueId}_10x10cm.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading individual plaque:', err);
    } finally {
      setDownloading(false);
    }
  };

  const isActive = item.status === 'active' && Boolean(item.targetUrl);

  return (
    <div className="bg-[#0D0D12] rounded-2xl border border-gray-800/80 hover:border-red-500/50 p-4 flex flex-col shadow-lg transition-all duration-200 group">
      {/* 1. Header: Número da Plaquinha & Status */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm text-red-400">
            {item.plaqueId}
          </span>
          <span className="text-[11px] text-gray-500 font-mono">
            {item.qrCodeId}
          </span>
        </div>

        {/* Status: Ativo ou Pendente */}
        {isActive ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>Ativo</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-400 border border-amber-500/30 text-[10px] font-semibold">
            <Clock className="w-3 h-3" />
            <span>Pendente</span>
          </span>
        )}
      </div>

      {/* 2. Preview da arte original com QR Code (Quadrado 1:1 Perfeito 10x10cm) */}
      <div
        onClick={() => (onViewPlaque ? onViewPlaque(item) : onEditLink(item))}
        title="Clique para visualizar em alta resolução"
        className="w-full aspect-square rounded-xl overflow-hidden bg-black border border-gray-800 hover:border-red-500/70 relative mb-3 cursor-pointer group/preview transition-all"
      >
        {svgContent ? (
          <div
            className="w-full h-full [&>svg]:w-full [&>svg]:h-full select-none transition-transform duration-300 group-hover/preview:scale-[1.02]"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
            <span>Carregando arte 10×10 cm...</span>
          </div>
        )}
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-mono text-gray-300 border border-gray-800">
          10 × 10 cm
        </div>
        <div className="absolute inset-0 bg-red-950/20 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="px-2.5 py-1 rounded-lg bg-black/80 text-[10px] text-white border border-red-500/50 flex items-center gap-1 shadow-lg">
            <Eye className="w-3 h-3 text-red-400" />
            <span>Visualizar</span>
          </span>
        </div>
      </div>

      {/* 3. Informações da Plaquinha */}
      <div className="space-y-1 text-xs mb-3 flex-1">
        {/* Nome do Cliente */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-gray-400">Cliente:</span>
          <span className="text-white font-medium truncate max-w-[150px]">
            {item.clientName || <span className="text-gray-500 italic">Não informado</span>}
          </span>
        </div>

        {/* Link de Destino */}
        <div className="text-[11px]">
          <span className="text-gray-400 block mb-0.5">Destino:</span>
          {item.targetUrl ? (
            <a
              href={item.targetUrl.startsWith('http') ? item.targetUrl : `https://${item.targetUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:underline font-mono truncate block text-[10px]"
              title={item.targetUrl}
            >
              {item.targetUrl}
            </a>
          ) : (
            <span className="text-amber-500/80 italic text-[10px]">
              Aguardando link de destino
            </span>
          )}
        </div>
      </div>

      {/* 4. Link Permanente & Botão de Copiar */}
      <div className="mb-3 p-2 rounded-xl bg-[#08080B] border border-gray-800/80 flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono text-gray-400 truncate flex-1">
          {permanentUrl}
        </span>
        <button
          type="button"
          onClick={handleCopyLink}
          title="Copiar link dinâmico permanente"
          className="p-1 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors cursor-pointer shrink-0"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* 5. Três Ações Principais Obrigatórias: VISUALIZAR, EDITAR e BAIXAR */}
      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-gray-800/60">
        {/* Botão VISUALIZAR */}
        <button
          type="button"
          onClick={() => (onViewPlaque ? onViewPlaque(item) : onEditLink(item))}
          title="Visualizar arte completa da plaquinha"
          className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl font-medium text-[11px] bg-gray-900 hover:bg-gray-800 text-gray-200 hover:text-white border border-gray-800 transition-colors cursor-pointer"
        >
          <Eye className="w-3 h-3 text-red-400" />
          <span>Ver</span>
        </button>

        {/* Botão EDITAR LINK */}
        <button
          type="button"
          onClick={() => onEditLink(item)}
          title="Editar link de destino e dados do cliente"
          className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl font-bold text-[11px] text-white transition-all cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.3)] hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
          style={{
            background: 'linear-gradient(135deg, #FF3344 0%, #DC2626 100%)',
          }}
        >
          <Edit3 className="w-3 h-3 stroke-[2.5]" />
          <span>Editar</span>
        </button>

        {/* Botão BAIXAR PLAQUINHA */}
        <button
          type="button"
          onClick={handleDownloadPlaque}
          disabled={downloading}
          title="Baixar plaquinha individual em alta resolução (10x10cm PNG)"
          className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl font-medium text-[11px] bg-gray-900 hover:bg-gray-800 text-gray-200 hover:text-white border border-gray-800 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Download className="w-3 h-3 text-red-400" />
          <span>{downloading ? '...' : 'Baixar'}</span>
        </button>
      </div>
    </div>
  );
};
