import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Share, PlusSquare, ShieldCheck } from "lucide-react";
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
 variant?: 'header' 'login' 'banner' 'floating';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
 const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
 const [showGuideModal, setShowGuideModal] = useState(false);
 const [installedSuccess, setInstalledSuccess] = useState(false);

 // If already running in standalone mode on mobile device, hide install button
 if (isInstalled) {
 return null;
 }

 const handleInstallClick = async () => {
 if (isInstallable) {
 const success = await install();
 if (success) {
 setInstalledSuccess(true);
 }
 } else {
 setShowGuideModal(true);
 }
 };

 return (
 <>
 {/* Variant: Header Button */}
 {variant === 'header' && (
 <button
 type="button"
 onClick={handleInstallClick}
 className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer shrink-0 animate-in fade-in"
 title="Instalar Aplicativo CUIDA na tela inicial do seu celular ou computador"
 >
 <Download className="w-4 h-4 text-emerald-100 animate-bounce" />
 <span className="hidden sm:inline">Instalar App CUIDA</span>
 <span className="sm:hidden">Instalar App</span>
 </button>
 )}

 {/* Variant: Login Panel Banner / Prominent Card */}
 {variant === 'login' && (
 <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900/90 via-teal-900/90 to-slate-900 border border-emerald-500/40 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
 <Smartphone className="w-6 h-6 text-emerald-400 animate-pulse" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
 Aplicativo PWA Celular
 </span>
 <span className="text-emerald-300 text-xs font-semibold">Instalação Direta</span>
 </div>
 <h4 className="text-sm font-black text-white mt-0.5">
 Instalar Aplicativo CUIDA no seu Celular
 </h4>
 <p className="text-xs text-slate-300">
 Acesse direto da tela inicial como um aplicativo nativo sem precisar de app store.
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={handleInstallClick}
 className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
 >
 <Download className="w-4 h-4" />
 <span>Instalar Aplicativo</span>
 </button>
 </div>
 )}

 {/* Variant: Dashboard Banner */}
 {variant === 'banner' && (
 <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg border border-emerald-400/30 flex flex-col sm:flex-row items-center justify-between gap-4">
 <div className="flex items-center gap-3.5">
 <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
 <Smartphone className="w-5 h-5 text-white" />
 </div>
 <div>
 <h4 className="font-extrabold text-sm text-white">
 Instale o App CUIDA na tela inicial do seu celular!
 </h4>
 <p className="text-xs text-emerald-100 mt-0.5">
 Facilite o registro de ponto, consulta de missões e recebimento de notificações.
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={handleInstallClick}
 className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
 >
 <Download className="w-4 h-4 text-emerald-700" />
 <span>Baixar e Instalar</span>
 </button>
 </div>
 )}

 {/* Installation Instructions Modal for iOS / Desktop / Manual Download */}
 {showGuideModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
 <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
 {/* Header */}
 <div className="p-5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white relative">
 <button
 type="button"
 onClick={() => setShowGuideModal(false)}
 className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
 >
 <X className="w-4 h-4" />
 </button>

 <div className="flex items-center gap-3">
 <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
 <Smartphone className="w-6 h-6 text-emerald-400" />
 </div>
 <div>
 <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">
 Instalar Aplicativo PWA
 </span>
 <h3 className="text-lg font-bold text-white mt-0.5">
 Instalar CUIDA no Celular
 </h3>
 </div>
 </div>
 </div>

 {/* Guide Content */}
 <div className="p-6 space-y-5 text-slate-800 text-xs">
 {isIOS ? (
 /* iOS iPhone/iPad Instructions */
 <div className="space-y-4">
 <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 font-medium flex items-center gap-2">
 <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
 <span>No iPhone ou iPad (Safari):</span>
 </div>

 <div className="space-y-3">
 <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
 <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
 1
 </div>
 <div>
 <span className="font-bold text-slate-900 block mb-0.5">
 Toque no botão "Compartilhar"
 </span>
 <p className="text-slate-600 text-[11px]">
 Na barra inferior do Safari, clique no ícone de compartilhamento (quadrado com seta para cima <Share className="w-3 h-3 inline text-blue-600" />).
 </p>
 </div>
 </div>

 <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
 <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
 2
 </div>
 <div>
 <span className="font-bold text-slate-900 block mb-0.5">
 Role as opções e selecione "Adicionar à Tela de Início"
 </span>
 <p className="text-slate-600 text-[11px]">
 Procure pela opção <PlusSquare className="w-3 h-3 inline text-blue-600" /> <strong>"Adicionar à Tela de Início"</strong>.
 </p>
 </div>
 </div>

 <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
 <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
 3
 </div>
 <div>
 <span className="font-bold text-slate-900 block mb-0.5">
 Confirme em "Adicionar"
 </span>
 <p className="text-slate-600 text-[11px]">
 O ícone do <strong>CUIDA</strong> aparecerá instantaneamente na tela principal do seu celular.
 </p>
 </div>
 </div>
 </div>
 </div>
 ) : (
 /* Android / Chrome / Edge Instructions */
 <div className="space-y-4">
 <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 font-medium flex items-center gap-2">
 <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
 <span>No Android, Chrome ou Navegador Web:</span>
 </div>

 <div className="space-y-3">
 <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
 <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
 1
 </div>
 <div>
 <span className="font-bold text-slate-900 block mb-0.5">
 Toque nos três pontinhos (⋮) do menu do navegador
 </span>
 <p className="text-slate-600 text-[11px]">
 No canto superior direito do seu navegador Chrome/Edge.
 </p>
 </div>
 </div>

 <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
 <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
 2
 </div>
 <div>
 <span className="font-bold text-slate-900 block mb-0.5">
 Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"
 </span>
 <p className="text-slate-600 text-[11px]">
 O arquivo do aplicativo será baixado e o ícone ficará fixado na tela do celular.
 </p>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Close Action */}
 <button
 type="button"
 onClick={() => setShowGuideModal(false)}
 className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
 >
 Entendi, fechar instruções
 </button>
 </div>
 </div>
 </div>
 )}
 </>
 );
};
