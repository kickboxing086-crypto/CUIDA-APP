import React, { useState } from 'react';
import { Lock, User as UserIcon, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { ElderCaneLogo } from './ElderCaneLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { api } from '../services/api';
import { User } from '../types';

interface LoginPanelProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPanel: React.FC<LoginPanelProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Por favor, informe o seu usuário e senha.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.login(username.trim(), password.trim());
      onLoginSuccess(res.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Credenciais inválidas. Verifique seu usuário e senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-100 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Logo e Apresentação do Aplicativo */}
        <div className="text-center space-y-4 animate-in fade-in duration-300">
          <div className="inline-flex items-center justify-center p-3.5 bg-blue-600/15 rounded-2xl border border-blue-500/20 shadow-lg">
            <ElderCaneLogo size="lg" variant="white-on-blue" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              CUIDA
            </h1>
            <p className="text-sm font-medium text-slate-300 mt-1">
              Plataforma de Gestão de Cuidados e Ponto Seguro
            </p>
          </div>
        </div>

        {/* Instalar PWA Banner */}
        <div className="animate-in fade-in duration-400">
          <PWAInstallButton variant="header" />
        </div>

        {/* Card de Login Limpo */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-7 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Acesse sua conta
            </h2>
            <p className="text-xs text-slate-400">
              Digite seu usuário e senha para entrar na plataforma.
            </p>
          </div>

          {errorMessage && (
            <div className="bg-red-950/60 border border-red-500/30 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-red-200 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu usuário cadastrado"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha de acesso"
                  className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer transition-colors"
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no CUIDA</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Rodapé institucional limpo */}
        <p className="text-center text-[11px] text-slate-500">
          CUIDA &copy; {new Date().getFullYear()} &middot; Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};
