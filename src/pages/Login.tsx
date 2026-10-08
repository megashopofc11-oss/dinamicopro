import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { Logo } from '../components/Logo';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    if (!password) {
      setError('Por favor, informe sua senha.');
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (isRegistering && password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      if (isRegistering) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('E-mail ou senha incorretos.');
      } else if (code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado. Tente entrar.');
      } else if (code === 'auth/weak-password') {
        setError('A senha informada deve ter pelo menos 6 caracteres.');
      } else {
        setError(err?.message || 'Falha na autenticação.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background subtle radial effect */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Brand Header with 3D Logo */}
      <div className="flex flex-col items-center mb-8 relative z-10 text-center">
        <Logo size="lg" showSubtitle={false} />
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-sm bg-[#0D0D12]/95 backdrop-blur-xl rounded-3xl border border-red-500/30 p-6 sm:p-7 shadow-[0_0_40px_rgba(239,68,68,0.2)] relative z-10">
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08080B] border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08080B] border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-sm outline-none"
              />
            </div>
          </div>

          {isRegistering && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08080B] border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-sm outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl font-bold text-sm text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-3"
            style={{
              background: 'linear-gradient(135deg, #FF3344 0%, #DC2626 100%)',
            }}
          >
            <span>
              {loading
                ? 'Processando...'
                : isRegistering
                ? 'CRIAR CONTA'
                : 'ENTRAR'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Alternância Criar Conta / Entrar */}
        <div className="mt-5 pt-4 border-t border-gray-800 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
            }}
            className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            {isRegistering ? (
              <span>Já tem uma conta? <strong className="text-red-400 underline">ENTRAR</strong></span>
            ) : (
              <span>Não possui conta? <strong className="text-red-400 underline">CRIAR CONTA</strong></span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

