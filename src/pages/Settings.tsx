import React, { useEffect, useState } from 'react';
import { getSystemSettings, updateSystemSettings } from '../services/firestoreService';
import { firebaseConfig } from '../firebase/config';
import { Save, Check, Globe, Building2, Server, FileCode, CheckCircle2, Cloud } from 'lucide-react';

export const Settings: React.FC = () => {
  const [redirectBaseUrl, setRedirectBaseUrl] = useState('');
  const [companyName, setCompanyName] = useState('Dinâmico Pro');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getSystemSettings().then((s) => {
      if (s.redirectBaseUrl) setRedirectBaseUrl(s.redirectBaseUrl);
      if (s.companyName) setCompanyName(s.companyName);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateSystemSettings({
        redirectBaseUrl: redirectBaseUrl.trim(),
        companyName: companyName.trim(),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Configurações do Sistema
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Parâmetros de redirecionamento, domínio próprio e integração em nuvem
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-[#0D0D12] rounded-3xl border border-gray-800/80 p-6 sm:p-8 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Globe className="w-5 h-5 text-red-400" />
          Domínio de Redirecionamento dos QR Codes
        </h2>
        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
          Este é o endereço base gravado nos QR Codes para leitura nas placas físicas (ex: <code>https://seusite.com.br/q/:code</code>).
          Ao configurar seu domínio próprio da Vercel ou produção, informe a URL completa abaixo.
        </p>

        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Configurações atualizadas com sucesso no Firestore!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
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
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] cursor-pointer disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #FF3344 0%, #DC2626 100%)',
              }}
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Gravando no Firebase...' : 'Salvar Configurações'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Vercel & Deployment Instructions */}
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
            <li>No formulário acima nesta página, insira <code>https://seusite.com.br</code> e clique em <strong>Salvar Configurações</strong>.</li>
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
