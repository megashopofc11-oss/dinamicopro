import React, { useEffect, useState } from 'react';
import {
  getSystemSettings,
  updateSystemSettings,
  getModelCalibrations,
  saveModelCalibration,
  resetModelCalibration,
} from '../services/firestoreService';
import { firebaseConfig } from '../firebase/config';
import {
  PLAQUE_MODELS,
  DEFAULT_MODEL_CALIBRATIONS,
  generatePlaqueSVG,
  getPlaqueModel,
  normalizePlacement,
  denormalizePlacement,
} from '../services/templateService';
import { generateQRCodeSVGDataUri } from '../services/qrGeneratorService';
import {
  PlaqueModelId,
  ModelCalibrationConfig,
  ModelCalibrationsMap,
} from '../types';
import {
  Save,
  Check,
  Globe,
  Server,
  FileCode,
  CheckCircle2,
  Cloud,
  Sliders,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Layers,
} from 'lucide-react';

export const Settings: React.FC = () => {
  // General settings state
  const [redirectBaseUrl, setRedirectBaseUrl] = useState('');
  const [companyName, setCompanyName] = useState('Dinâmico Pro');
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [successGeneral, setSuccessGeneral] = useState(false);

  // Model calibrations state
  const [calibrations, setCalibrations] = useState<ModelCalibrationsMap>({});
  const [selectedModelId, setSelectedModelId] = useState<PlaqueModelId>('google_preto');
  const [normX, setNormX] = useState<number>(0.556);
  const [normY, setNormY] = useState<number>(0.465);
  const [normSize, setNormSize] = useState<number>(0.240);
  const [savingCalib, setSavingCalib] = useState(false);
  const [successCalib, setSuccessCalib] = useState(false);
  const [previewSvg, setPreviewSvg] = useState<string>('');
  const [sampleQrUri, setSampleQrUri] = useState<string>('');

  useEffect(() => {
    getSystemSettings().then((s) => {
      if (s.redirectBaseUrl) setRedirectBaseUrl(s.redirectBaseUrl);
      if (s.companyName) setCompanyName(s.companyName);
    });

    getModelCalibrations().then((calibs) => {
      setCalibrations(calibs);
    });

    generateQRCodeSVGDataUri('https://dinamicopro.com/sample').then((uri) => {
      setSampleQrUri(uri);
    });
  }, []);

  // Update slider positions when selected model changes or calibrations load
  useEffect(() => {
    const currentCalib = calibrations[selectedModelId] || DEFAULT_MODEL_CALIBRATIONS[selectedModelId];
    if (currentCalib?.qrPlacement) {
      setNormX(currentCalib.qrPlacement.x);
      setNormY(currentCalib.qrPlacement.y);
      setNormSize(currentCalib.qrPlacement.size);
    }
  }, [selectedModelId, calibrations]);

  // Live preview update
  useEffect(() => {
    if (!sampleQrUri) return;

    const pixelCoords = denormalizePlacement({
      x: normX,
      y: normY,
      size: normSize,
    });

    const activeCalibs: ModelCalibrationsMap = {
      ...calibrations,
      [selectedModelId]: {
        modelId: selectedModelId,
        version: 'custom',
        qrPlacement: { x: normX, y: normY, size: normSize },
      },
    };

    const svg = generatePlaqueSVG(
      selectedModelId,
      '000001',
      sampleQrUri,
      pixelCoords,
      activeCalibs
    );
    setPreviewSvg(svg);
  }, [selectedModelId, normX, normY, normSize, sampleQrUri, calibrations]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingGeneral(true);
      await updateSystemSettings({
        redirectBaseUrl: redirectBaseUrl.trim(),
        companyName: companyName.trim(),
      });
      setSuccessGeneral(true);
      setTimeout(() => setSuccessGeneral(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSaveCalibration = async () => {
    try {
      setSavingCalib(true);
      const newConfig: ModelCalibrationConfig = {
        modelId: selectedModelId,
        version: 'custom-' + new Date().toISOString().slice(0, 10),
        qrPlacement: {
          x: normX,
          y: normY,
          size: normSize,
        },
        updatedAt: new Date().toISOString(),
      };

      await saveModelCalibration(selectedModelId, newConfig);
      setCalibrations((prev) => ({ ...prev, [selectedModelId]: newConfig }));
      setSuccessCalib(true);
      setTimeout(() => setSuccessCalib(false), 3000);
    } catch (err) {
      console.error('Error saving calibration in Firebase:', err);
    } finally {
      setSavingCalib(false);
    }
  };

  const handleResetCalibration = async () => {
    try {
      setSavingCalib(true);
      await resetModelCalibration(selectedModelId);
      const def = DEFAULT_MODEL_CALIBRATIONS[selectedModelId];
      if (def?.qrPlacement) {
        setNormX(def.qrPlacement.x);
        setNormY(def.qrPlacement.y);
        setNormSize(def.qrPlacement.size);
      }
      setCalibrations((prev) => {
        const next = { ...prev };
        delete next[selectedModelId];
        return next;
      });
      setSuccessCalib(true);
      setTimeout(() => setSuccessCalib(false), 3000);
    } catch (err) {
      console.error('Error resetting calibration:', err);
    } finally {
      setSavingCalib(false);
    }
  };

  // Check collision distance with 'APONTE A SUA CÂMERA'
  const pixelBottom = Math.round((normY + normSize) * 1000);
  const bottomTextTopY =
    selectedModelId === 'instagram_rosa'
      ? 818
      : ['google_preto', 'google_azul_novo', 'whatsapp_verde', 'pix_pb', 'wifi_pb'].includes(selectedModelId)
      ? 823
      : 990;
  const bottomMarginPx = bottomTextTopY - pixelBottom;
  const isSafeMargin = bottomMarginPx >= 40;

  const currentModel = getPlaqueModel(selectedModelId);
  const isCustomCalibrated = Boolean(calibrations[selectedModelId]);

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Configurações do Sistema
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Parâmetros de redirecionamento, domínio próprio e calibração milimétrica dos modelos
        </p>
      </div>

      {/* SECTION 1: CALIBRAÇÃO INDIVIDUAL DE MODELOS (EXIGÊNCIA PRINCIPAL) */}
      <div className="bg-[#0D0D12] rounded-3xl border border-red-500/40 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-red-400" />
              <span>Calibração Oficial de Modelos (Posicionamento dos QR Codes)</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Ajuste milimétrico individual com coordenadas normalizadas (0.00 a 1.00) salvas no Firebase.
              Evita qualquer sobreposição com textos ou elementos gráficos.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isCustomCalibrated ? (
              <span className="px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs font-semibold">
                Calibração Personalizada
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                Padrão Oficial Calibrado
              </span>
            )}
          </div>
        </div>

        {/* Model Selector Pills */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-2">
            Selecione o Modelo para Calibrar:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {PLAQUE_MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedModelId(m.id)}
                className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-all border cursor-pointer ${
                  selectedModelId === m.id
                    ? 'bg-red-950/70 border-red-500 text-white shadow-lg'
                    : 'bg-[#08080B] border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                }`}
              >
                <div className="truncate font-bold">{m.shortName}</div>
                <div className="text-[10px] text-gray-500 truncate">{m.tagline}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Live Calibration Panel: Preview on Left, Sliders on Right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-[#08080B] p-5 sm:p-6 rounded-2xl border border-gray-800/80">
          {/* Left: 10x10 cm Visual Preview */}
          <div className="flex flex-col items-center space-y-3">
            <div className="w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden bg-black border-2 border-red-500/40 shadow-xl relative flex items-center justify-center">
              {previewSvg ? (
                <div
                  className="w-full h-full [&>svg]:w-full [&>svg]:h-full select-none"
                  dangerouslySetInnerHTML={{ __html: previewSvg }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
              )}
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/85 text-[10px] font-mono text-gray-300 border border-gray-800 pointer-events-none">
                10 × 10 cm (1:1)
              </div>
            </div>

            {/* Safety margin indicator */}
            <div
              className={`w-full max-w-[320px] p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                isSafeMargin
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
              }`}
            >
              {isSafeMargin ? (
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <div className="text-[11px] leading-tight">
                {isSafeMargin ? (
                  <span>
                    ✓ <strong>Seguro:</strong> {bottomMarginPx}px de distância do texto "APONTE A SUA CÂMERA".
                  </span>
                ) : (
                  <span>
                    ⚠ <strong>Atenção:</strong> QR Code muito próximo ou tocando o texto inferior.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Normalized Sliders */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-xs text-gray-300 mb-1.5">
                <span className="font-semibold">Posição Horizontal (X):</span>
                <span className="font-mono text-red-400 font-bold">
                  {normX.toFixed(3)} • {(normX * 100).toFixed(1)} mm
                </span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.85}
                step={0.005}
                value={normX}
                onChange={(e) => setNormX(Number(e.target.value))}
                className="w-full accent-red-500 cursor-pointer"
              />
              <p className="text-[10px] text-gray-500 mt-0.5">
                Alinha o QR Code horizontalmente com a área reservada e texto de orientação.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-gray-300 mb-1.5">
                <span className="font-semibold">Posição Vertical (Y):</span>
                <span className="font-mono text-red-400 font-bold">
                  {normY.toFixed(3)} • {(normY * 100).toFixed(1)} mm
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.8}
                step={0.005}
                value={normY}
                onChange={(e) => setNormY(Number(e.target.value))}
                className="w-full accent-red-500 cursor-pointer"
              />
              <p className="text-[10px] text-gray-500 mt-0.5">
                Garante que o QR Code permaneça acima da frase "APONTE A SUA CÂMERA".
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-gray-300 mb-1.5">
                <span className="font-semibold">Tamanho do QR Code (Largura = Altura):</span>
                <span className="font-mono text-red-400 font-bold">
                  {normSize.toFixed(3)} • {(normSize * 100).toFixed(1)} mm
                </span>
              </div>
              <input
                type="range"
                min={0.15}
                max={0.35}
                step={0.005}
                value={normSize}
                onChange={(e) => setNormSize(Number(e.target.value))}
                className="w-full accent-red-500 cursor-pointer"
              />
              <p className="text-[10px] text-gray-500 mt-0.5">
                Sempre perfeitamente quadrado com zona de silêncio de 4 módulos.
              </p>
            </div>

            {successCalib && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Calibração de {currentModel.shortName} salva com sucesso no Firebase!</span>
              </div>
            )}

            {/* Buttons: Salvar Calibração & Restaurar Padrão */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveCalibration}
                disabled={savingCalib}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] cursor-pointer disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #FF3344 0%, #DC2626 100%)',
                }}
              >
                <Save className="w-4 h-4" />
                <span>{savingCalib ? 'Salvando...' : 'Salvar no Firebase'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetCalibration}
                disabled={savingCalib}
                title="Restaurar padrão oficial do modelo"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrão</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: DOMÍNIO E CONFIGURAÇÕES GERAIS */}
      <div className="bg-[#0D0D12] rounded-3xl border border-gray-800/80 p-6 sm:p-8 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Globe className="w-5 h-5 text-red-400" />
          Domínio de Redirecionamento dos QR Codes
        </h2>
        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
          Este é o endereço base gravado nos QR Codes para leitura nas placas físicas (ex: <code>https://seusite.com.br/q/:code</code>).
          Ao configurar seu domínio próprio da Vercel ou produção, informe a URL completa abaixo.
        </p>

        {successGeneral && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Configurações atualizadas com sucesso no Firestore!</span>
          </div>
        )}

        <form onSubmit={handleSaveGeneral} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              URL Base do Domínio Público
            </label>
            <input
              type="url"
              value={redirectBaseUrl}
              onChange={(e) => setRedirectBaseUrl(e.target.value)}
              placeholder={`Ex: ${window.location.origin}`}
              className="w-full px-4 py-2.5 rounded-xl bg-[#08080B] border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-sm outline-none font-mono"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Padrão atual do ambiente: <code>{window.location.origin}</code>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Nome da Empresa / Fábrica
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex: DINÂMICO PRO"
              className="w-full px-4 py-2.5 rounded-xl bg-[#08080B] border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-sm outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingGeneral}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] cursor-pointer disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #FF3344 0%, #DC2626 100%)',
              }}
            >
              <Save className="w-4 h-4" />
              <span>{savingGeneral ? 'Gravando no Firebase...' : 'Salvar Configurações Gerais'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 3: VERCEL & PRODUÇÃO */}
      <div className="bg-[#0D0D12] rounded-3xl border border-gray-800/80 p-6 sm:p-8 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-red-400" />
          Hospedagem na Vercel &amp; Produção
        </h2>
        <p className="text-xs text-gray-400 leading-relaxed">
          Este aplicativo está 100% preparado para publicação na <strong>Vercel</strong> sem erros de 404
          nas rotas internas ou na leitura dos QR Codes <code>/q/:code</code>.
        </p>

        <div className="bg-[#08080B] p-4 rounded-2xl border border-gray-800 space-y-3 text-xs">
          <h4 className="font-bold text-red-300 flex items-center gap-1.5">
            <FileCode className="w-4 h-4 text-red-400" />
            Passo a Passo para Conectar seu Domínio Definitivo:
          </h4>
          <ol className="list-decimal list-inside space-y-1.5 text-gray-300">
            <li>Faça o deploy do repositório no seu painel da Vercel.</li>
            <li>Adicione seu domínio personalizado nas configurações de domínio da Vercel (ex: <code>seusite.com.br</code>).</li>
            <li>No formulário acima nesta página, insira <code>https://seusite.com.br</code> e clique em <strong>Salvar Configurações Gerais</strong>.</li>
            <li>Todos os novos lotes gerados já sairão com o QR Code apontando diretamente para seu domínio próprio!</li>
          </ol>
        </div>

        {/* Firebase Config Summary */}
        <div className="bg-[#08080B] p-4 rounded-2xl border border-gray-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-300 flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-red-400" />
              Credenciais do Firebase Conectadas:
            </span>
            <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
              <Check className="w-3 h-3" /> Online
            </span>
          </div>
          <div className="font-mono text-[11px] text-gray-400 pt-1 space-y-1">
            <div>Project ID: <strong className="text-white">{firebaseConfig.projectId}</strong></div>
            <div>Auth Domain: <strong className="text-white">{firebaseConfig.authDomain}</strong></div>
            <div>Database ID: <strong className="text-red-300 truncate block">{firebaseConfig.firestoreDatabaseId}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};
