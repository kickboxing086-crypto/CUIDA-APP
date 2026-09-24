import React, { useState, useEffect } from 'react';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Users,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Building2,
  Sparkles,
  Info,
} from 'lucide-react';
import { ElderCaneLogo } from './ElderCaneLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { api } from '../services/api';
import { User, FamilyWithLogins } from '../types';

interface LoginPanelProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPanel: React.FC<LoginPanelProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Families directory for accordion
  const [familiesDirectory, setFamiliesDirectory] = useState<FamilyWithLogins[]>([]);
  const [expandedFamilyId, setExpandedFamilyId] = useState<string | null>('fam-01');
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(true);

  // Load families directory on mount
  useEffect(() => {
    async function loadDirectory() {
      try {
        setIsLoadingDirectory(true);
        const data = await api.getFamiliesDirectory();
        setFamiliesDirectory(data.families);
        if (data.families.length > 0 && !expandedFamilyId) {
          setExpandedFamilyId(data.families[0].id);
        }
      } catch (err) {
        console.error('Erro ao carregar diretório de famílias:', err);
      } finally {
        setIsLoadingDirectory(false);
      }
    }
    loadDirectory();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Por favor, digite seu usuário e senha.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.login(username.trim(), password.trim());
      onLoginSuccess(res.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao autenticar. Verifique usuário e senha.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreFill = (selectedUsername: string, suggestedPass: string = '') => {
    setUsername(selectedUsername);
    if (suggestedPass) {
      setPassword(suggestedPass);
    }
    setErrorMessage(null);
  };

  const toggleFamily = (id: string) => {
    setExpandedFamilyId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-slate-100 selection:bg-blue-600 selection:text-white">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600/20 rounded-2xl border border-blue-500/30 shadow-inner">
            <ElderCaneLogo size="lg" variant="white-on-blue" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            CUIDA · Portal de Acesso Seguro
          </h1>
          <p className="text-sm text-blue-200/80 max-w-lg mx-auto">
            Plataforma oficial de controle de cuidadores e acompanhamento de idosos com auditoria de presença.
          </p>
        </div>

        {/* PWA Install Card on Login Panel */}
        <PWAInstallButton variant="login" />

        {/* Master Admin Card (Samuel_02) */}
        <div className="bg-linear-to-r from-blue-900/60 via-indigo-900/60 to-blue-900/60 border border-blue-400/40 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 font-bold shrink-0">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Conta do Administrador Geral
                </span>
                <span className="bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  Master
                </span>
              </div>
              <div className="text-sm font-semibold text-white mt-0.5">
                Usuário: <code className="text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded text-xs font-mono font-bold">Samuel_02</code>
                <span className="mx-2 text-slate-400">|</span>
                Senha: <code className="text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded text-xs font-mono font-bold">072131Sa@</code>
              </div>
              <p className="text-xs text-blue-200/70 mt-1">
                Responsável pelo gerenciamento geral e criação dos logins dos clientes e famílias.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSelectPreFill('Samuel_02', '072131Sa@')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Preencher Samuel_02</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Login Form */}
          <div className="lg:col-span-5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-400" />
                Entrar com Usuário e Senha
              </h2>
              <p className="text-xs text-slate-300">
                Digite suas credenciais registradas para acessar o painel.
              </p>
            </div>

            {errorMessage && (
              <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-200 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Usuário de Acesso
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: Samuel_02 ou clara.mendes"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>Acessar o Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-white/10 text-[11px] text-slate-400 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>
                Selecione uma família ao lado para visualizar os logins registrados ou preencher automaticamente.
              </span>
            </div>
          </div>

          {/* Right Column: Famílias e Logins Registrados (Accordion) */}
          <div className="lg:col-span-7 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  Logins Registrados por Família
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Clique no nome de uma família para expandir e ver os logins cadastrados.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-400/30">
                {familiesDirectory.length} Famílias
              </span>
            </div>

            {isLoadingDirectory ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span>Carregando famílias registradas...</span>
              </div>
            ) : familiesDirectory.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
                Nenhuma família cadastrada no momento. A conta de Administrador Geral poderá criar novas famílias e logins.
              </div>
            ) : (
              <div className="space-y-3">
                {familiesDirectory.map((fam) => {
                  const isExpanded = expandedFamilyId === fam.id;
                  return (
                    <div
                      key={fam.id}
                      className="border border-white/15 rounded-xl bg-slate-950/40 overflow-hidden transition-all duration-200"
                    >
                      {/* Family Header Clickable Accordion Bar */}
                      <button
                        type="button"
                        onClick={() => toggleFamily(fam.id)}
                        className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-900/60 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-bold shrink-0">
                            <Users className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              {fam.name}
                              <span className="text-[11px] font-normal text-slate-400">
                                ({fam.elderly_name})
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {fam.logins.length} {fam.logins.length === 1 ? 'login cadastrado' : 'logins cadastrados'}
                              {fam.residence_address && ` · ${fam.residence_address}`}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-blue-300 font-medium hidden sm:inline">
                            {isExpanded ? 'Ocultar logins' : 'Ver logins'}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-blue-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Logins list when family is clicked */}
                      {isExpanded && (
                        <div className="p-4 pt-1 border-t border-white/10 bg-slate-950/70 space-y-2.5">
                          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold px-1">
                            Logins Registrados nesta Família:
                          </div>

                          {fam.logins.length === 0 ? (
                            <div className="text-xs text-slate-400 italic py-2 px-1">
                              Nenhum login registrado ainda nesta família.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-2">
                              {fam.logins.map((login) => {
                                const isCaregiver = login.role === 'caregiver';
                                const isAdmin = login.role === 'admin_family';

                                return (
                                  <div
                                    key={login.id}
                                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={
                                          login.avatar_url ||
                                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
                                        }
                                        alt={login.name}
                                        className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                                      />
                                      <div>
                                        <div className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
                                          {login.name}
                                          {login.role_labels && login.role_labels.length > 0 ? (
                                            login.role_labels.map((lbl, i) => (
                                              <span
                                                key={i}
                                                className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                              >
                                                {lbl}
                                              </span>
                                            ))
                                          ) : (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                              {login.role_label}
                                            </span>
                                          )}
                                        </div>

                                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                          <span>
                                            Usuário: <code className="text-blue-300 font-mono font-semibold">@{login.username}</code>
                                          </span>
                                          {login.registration_code && (
                                            <>
                                              <span>·</span>
                                              <span className="text-[11px] text-slate-500">
                                                Cód: {login.registration_code}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action button: Preencher Login */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const defaultPass =
                                          login.password ||
                                          (login.username === 'clara.mendes'
                                            ? 'clara123'
                                            : login.username === 'fernando.silveira'
                                            ? 'fernando123'
                                            : login.username === 'patricia.silveira'
                                            ? 'patricia123'
                                            : login.username === 'marcos.cuidador'
                                            ? 'marcos123'
                                            : login.username === 'beatriz.santos'
                                            ? 'beatriz123'
                                            : '12345678');
                                        handleSelectPreFill(login.username, defaultPass);
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                                    >
                                      <span>Usar este Login</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Security and compliance note */}
        <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Autenticação individual criptografada · Conforme requisitos da Portaria MTE 671</span>
        </div>
      </div>
    </div>
  );
};
