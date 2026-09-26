import React, { useState, useEffect } from 'react';
import { Lock, User as UserIcon, Eye, EyeOff, ArrowRight, AlertCircle, Link2, ShieldCheck, CheckCircle2, KeyRound, X } from "lucide-react";
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
 const [errorMessage, setErrorMessage] = useState<string null>(null);

 // Convites por Link Exclusivo State
 const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
 const [inviteCodeInput, setInviteCodeInput] = useState('');
 const [inviteData, setInviteData] = useState<any null>(null);
 const [isValidatingInvite, setIsValidatingInvite] = useState(false);
 const [inviteError, setInviteError] = useState<string null>(null);

 // Invite Form Registration
 const [regFullName, setRegFullName] = useState('');
 const [regUsername, setRegUsername] = useState('');
 const [regPassword, setRegPassword] = useState('');
 const [showRegPassword, setShowRegPassword] = useState(false);
 const [isRegistering, setIsRegistering] = useState(false);
 const [regFeedback, setRegFeedback] = useState<{ type: 'error' 'success'; message: string } null>(null);

 // Detect query param ?invite=... or ?convite=... on page load
 useEffect(() => {
 try {
 const searchParams = new URLSearchParams(window.location.search);
 const code = searchParams.get('invite') searchParams.get('convite') searchParams.get('code');
 if (code) {
 setInviteCodeInput(code.trim());
 setIsInviteModalOpen(true);
 handleValidateInviteCode(code.trim());
 }
 } catch {}
 }, []);

 const handleValidateInviteCode = async (codeToValidate: string) => {
 if (!codeToValidate.trim()) {
 setInviteError('Por favor, informe o código ou link de convite.');
 return;
 }

 try {
 setIsValidatingInvite(true);
 setInviteError(null);
 const res = await api.validateInvite(codeToValidate.trim());
 if (res.valid && res.invite) {
 setInviteData(res.invite);
 if (res.invite.guest_name && res.invite.guest_name !== 'Convidado(a)') {
 setRegFullName(res.invite.guest_name);
 }
 } else {
 setInviteData(null);
 setInviteError(res.message 'Código de convite inválido, expirado ou revogado.');
 }
 } catch (err: any) {
 setInviteData(null);
 setInviteError(err.message 'Erro ao validar código do convite.');
 } finally {
 setIsValidatingInvite(false);
 }
 };

 const handleLogin = async (e: React.FormEvent) => {
 e.preventDefault();
 setErrorMessage(null);

 if (!username.trim() !password.trim()) {
 setErrorMessage('Por favor, informe o seu usuário e senha.');
 return;
 }

 try {
 setIsLoading(true);
 const res = await api.login(username.trim(), password.trim());
 onLoginSuccess(res.user);
 } catch (err: any) {
 setErrorMessage(err.message 'Credenciais inválidas. Verifique seu usuário e senha.');
 } finally {
 setIsLoading(false);
 }
 };

 const handleRegisterViaInvite = async (e: React.FormEvent) => {
 e.preventDefault();
 setRegFeedback(null);

 if (!inviteData !inviteData.code) {
 setRegFeedback({ type: 'error', message: 'Nenhum convite válido selecionado.' });
 return;
 }

 const cleanUser = regUsername.trim().toLowerCase().replace(/\s+/g, '_');
 const cleanPass = regPassword.trim().toLowerCase().slice(0, 8);

 if (cleanUser.length < 3) {
 setRegFeedback({ type: 'error', message: 'O nome de usuário deve ter pelo menos 3 caracteres em minúsculo.' });
 return;
 }

 if (cleanPass.length < 3) {
 setRegFeedback({ type: 'error', message: 'A senha deve conter pelo menos 3 caracteres em minúsculo.' });
 return;
 }

 try {
 setIsRegistering(true);
 const res = await api.registerWithInvite({
 invite_code: inviteData.code,
 name: regFullName.trim() inviteData.guest_name 'Novo Usuário',
 username: cleanUser,
 password: cleanPass,
 });

 setRegFeedback({
 type: 'success',
 message: `Conta criada com sucesso! Acessando sistema como @${res.user.username}...`,
 });

 setTimeout(() => {
 setIsInviteModalOpen(false);
 onLoginSuccess(res.user);
 }, 1200);
 } catch (err: any) {
 setRegFeedback({ type: 'error', message: err.message 'Falha ao criar conta com o convite.' });
 } finally {
 setIsRegistering(false);
 }
 };

 // Real-time password inspection for checkout badge
 const cleanUserPreview = regUsername.trim().toLowerCase().replace(/\s+/g, '_');
 const cleanPassPreview = regPassword.trim().toLowerCase().slice(0, 8);

 return (
 <div className="min-h-screen bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col items-center justify-center py-6 sm:py-12 px-3 sm:px-6 lg:px-8 text-slate-100 selection:bg-blue-600 selection:text-white">
 <div className="w-full max-w-md space-y-4 sm:space-y-6">
 {/* Logo e Apresentação do Aplicativo */}
 <div className="text-center space-y-3 sm:space-y-4 animate-in fade-in duration-300">
 <div className="inline-flex items-center justify-center p-3 sm:p-3.5 bg-blue-600/15 rounded-2xl border border-blue-500/20 shadow-lg">
 <ElderCaneLogo size="lg" variant="white-on-blue" />
 </div>
 <div>
 <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
 CUIDA
 </h1>
 <p className="text-xs sm:text-sm font-medium text-slate-300 mt-0.5 sm:mt-1">
 Plataforma de Gestão de Cuidados e Ponto Seguro
 </p>
 </div>
 </div>

 {/* Instalar PWA Banner */}
 <div className="animate-in fade-in duration-400">
 <PWAInstallButton variant="header" />
 </div>

 {/* Card de Login */}
 <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6 animate-in zoom-in-95 duration-300">
 <div className="space-y-1">
 <h2 className="text-xl font-bold text-white tracking-tight">
 Acesse sua conta
 </h2>
 <p className="text-xs text-slate-400">
 Digite seu usuário e senha cadastrados para entrar na plataforma.
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
 <div className="flex items-center justify-between mb-2">
 <label className="block text-xs font-semibold text-slate-300">
 Usuário
 </label>
 <span className="text-[10px] text-slate-500 font-medium">
 letras minúsculas
 </span>
 </div>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
 <UserIcon className="w-4 h-4" />
 </div>
 <input
 type="text"
 required
 autoComplete="username"
 value={username}
 onChange={(e) => setUsername(e.target.value.toLowerCase())}
 placeholder="seu usuário cadastrado"
 className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium lowercase"
 />
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-2">
 <label className="block text-xs font-semibold text-slate-300">
 Senha
 </label>
 <span className="text-[10px] text-slate-500 font-medium">
 máx. 8 caracteres ({password.length}/8)
 </span>
 </div>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
 <Lock className="w-4 h-4" />
 </div>
 <input
 type={showPassword ? 'text' : 'password'}
 required
 maxLength={8}
 autoComplete="current-password"
 value={password}
 onChange={(e) => setPassword(e.target.value.toLowerCase().slice(0, 8))}
 placeholder="sua senha (máx 8)"
 className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium lowercase"
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

 {/* Restrição de Cadastro e Botão para Inserir Convite */}
 <div className="pt-4 border-t border-slate-800/80 text-center space-y-3">
 <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl text-left space-y-1.5">
 <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
 <ShieldCheck className="w-4 h-4 shrink-0" />
 <span>Cadastro Restrito por Convite</span>
 </div>
 <p className="text-[11px] text-slate-400 leading-relaxed">
 Novas contas só podem ser criadas mediante um <strong>Link de Convite Exclusivo</strong> gerado e enviado pelo <strong>Administrador da sua Família</strong>.
 </p>
 </div>

 <button
 type="button"
 onClick={() => setIsInviteModalOpen(true)}
 className="w-full py-2.5 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-blue-300 hover:text-blue-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
 >
 <Link2 className="w-4 h-4 text-blue-400" />
 <span>Recebeu um convite? Criar Conta com Convite</span>
 </button>
 </div>
 </div>

 {/* Modal: Validação e Criação de Conta via Convite Exclusivo */}
 {isInviteModalOpen && (
 <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
 <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 my-8 text-left relative">
 <button
 onClick={() => setIsInviteModalOpen(false)}
 className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-800 cursor-pointer"
 >
 <X className="w-4 h-4" />
 </button>

 <div className="flex items-center gap-3">
 <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-500/30 text-blue-400">
 <KeyRound className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-lg font-bold text-white">Criar Conta via Convite</h3>
 <p className="text-xs text-slate-400">Acesso exclusivo mediante validação de código</p>
 </div>
 </div>

 {/* Etapa 1: Inserir e Validar Código do Convite */}
 {!inviteData ? (
 <div className="space-y-4 pt-2">
 <div>
 <label className="block text-xs font-semibold text-slate-300 mb-1.5">
 Código do Convite ou Link Recebido
 </label>
 <div className="flex gap-2">
 <input
 type="text"
 value={inviteCodeInput}
 onChange={(e) => setInviteCodeInput(e.target.value)}
 placeholder="Ex: INV-829471"
 className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 uppercase"
 />
 <button
 type="button"
 disabled={isValidatingInvite !inviteCodeInput.trim()}
 onClick={() => handleValidateInviteCode(inviteCodeInput)}
 className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer shrink-0 transition-all"
 >
 {isValidatingInvite ? 'Validando...' : 'Validar'}
 </button>
 </div>
 </div>

 {inviteError && (
 <div className="p-3 bg-red-950/60 border border-red-500/30 rounded-xl text-xs text-red-200 flex items-center gap-2">
 <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
 <span>{inviteError}</span>
 </div>
 )}

 <p className="text-[11px] text-slate-500 leading-relaxed">
 Se você recebeu o link diretamente por WhatsApp, abra o link no seu navegador para preenchimento automático do código.
 </p>
 </div>
 ) : (
 /* Etapa 2: Formulário de Registro com Dados do Convite Validados */
 <form onSubmit={handleRegisterViaInvite} className="space-y-4 pt-1">
 <div className="p-3.5 bg-blue-950/40 border border-blue-500/30 rounded-2xl space-y-1.5 text-xs">
 <div className="flex items-center justify-between text-blue-300 font-bold">
 <span className="flex items-center gap-1.5">
 <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Convite Validade com Sucesso!
 </span>
 <span className="text-[10px] bg-blue-900/80 px-2 py-0.5 rounded-md font-mono border border-blue-700">
 {inviteData.code}
 </span>
 </div>
 <div className="text-slate-300 text-[11px] space-y-0.5">
 <p><strong>Família:</strong> {inviteData.family_name}</p>
 {inviteData.classification_label && (
 <p><strong>Classificação Familiar:</strong> <span className="text-emerald-300 font-bold">{inviteData.classification_label}</span></p>
 )}
 <p><strong>Função Liberada:</strong> {inviteData.role_labels?.join(' + ') 'Membro Familiar'}</p>
 </div>
 </div>

 {regFeedback && (
 <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
 regFeedback.type === 'success'
 ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200'
 : 'bg-red-950/60 border-red-500/30 text-red-200'
 }`}>
 {regFeedback.type === 'success' ? (
 <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
 ) : (
 <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
 )}
 <span>{regFeedback.message}</span>
 </div>
 )}

 <div>
 <label className="block text-xs font-semibold text-slate-300 mb-1">
 Seu Nome Completo *
 </label>
 <input
 type="text"
 required
 value={regFullName}
 onChange={(e) => setRegFullName(e.target.value)}
 placeholder="Ex: Maria Aparecida da Silva"
 className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
 />
 </div>

 <div>
 <div className="flex items-center justify-between mb-1">
 <label className="block text-xs font-semibold text-slate-300">
 Escolha seu Usuário (Login) *
 </label>
 <span className="text-[10px] text-slate-500 font-mono">minúsculo</span>
 </div>
 <input
 type="text"
 required
 value={regUsername}
 onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
 placeholder="ex: maria_cuidadora"
 className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 lowercase"
 />
 </div>

 <div>
 <div className="flex items-center justify-between mb-1">
 <label className="block text-xs font-semibold text-slate-300">
 Crie sua Senha (Máx. 8 caracteres) *
 </label>
 <span className="text-[10px] text-slate-500 font-mono">
 {regPassword.length}/8 minúsculo
 </span>
 </div>
 <div className="relative">
 <input
 type={showRegPassword ? 'text' : 'password'}
 required
 maxLength={8}
 value={regPassword}
 onChange={(e) => setRegPassword(e.target.value.toLowerCase().slice(0, 8))}
 placeholder="sua senha (máx 8)"
 className="w-full px-3.5 py-2.5 pr-10 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 lowercase"
 />
 <button
 type="button"
 onClick={() => setShowRegPassword(!showRegPassword)}
 className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
 >
 {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
 </button>
 </div>
 </div>

 {/* Checkout Badges */}
 <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-2 gap-2 text-[10px]">
 <div className={`p-1 rounded flex items-center gap-1 font-semibold ${
 cleanUserPreview.length >= 3 && cleanPassPreview.length >= 3
 ? 'text-emerald-400'
 : 'text-slate-500'
 }`}>
 <span>{cleanUserPreview.length >= 3 && cleanPassPreview.length >= 3 ? '' : '○'}</span>
 <span>Minúsculo</span>
 </div>

 <div className={`p-1 rounded flex items-center gap-1 font-semibold ${
 cleanPassPreview.length > 0 && cleanPassPreview.length <= 8
 ? 'text-emerald-400'
 : 'text-slate-500'
 }`}>
 <span>{cleanPassPreview.length > 0 && cleanPassPreview.length <= 8 ? '' : '○'}</span>
 <span>{cleanPassPreview.length}/8 Chars</span>
 </div>
 </div>

 <div className="flex items-center gap-2 pt-2">
 <button
 type="button"
 onClick={() => {
 setInviteData(null);
 setInviteCodeInput('');
 }}
 className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
 >
 Trocar Convite
 </button>
 <button
 type="submit"
 disabled={isRegistering !regFullName.trim() regUsername.length < 3 regPassword.length < 3}
 className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
 >
 {isRegistering ? 'Criando Conta...' : 'Concluir Cadastro e Entrar'}
 </button>
 </div>
 </form>
 )}
 </div>
 </div>
 )}

 {/* Rodapé institucional */}
 <div className="text-center text-[11px] text-slate-500 space-y-1">
 <p>© {new Date().getFullYear()} CUIDA · Controle Unificado e Diário de Assistência</p>
 <p className="text-xs text-slate-400 font-medium tracking-wide">
 desenvolvido por <strong className="text-slate-200 font-bold">SF TECNOLOGIA</strong>
 </p>
 </div>
 </div>
 </div>
 );
};
