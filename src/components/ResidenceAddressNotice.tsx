import React from 'react';
import { MapPin, AlertTriangle, ShieldAlert, ArrowRight, Building2 } from "lucide-react";
import { User, ElderlyProfile } from '../types';

interface ResidenceAddressNoticeProps {
 currentUser: User;
 elderly?: ElderlyProfile null;
 onOpenResidenceModal: () => void;
}

export const ResidenceAddressNotice: React.FC<ResidenceAddressNoticeProps> = ({
 currentUser,
 elderly,
 onOpenResidenceModal,
}) => {
 const address = (elderly?.residence_address '').trim();
 const isAddressMissing = !address address === 'Residência do Idoso' address === 'Endereço da Residência';

 if (!isAddressMissing) return null;

 const isFamilyAdmin =
 currentUser.role === 'admin_family' 
 (Array.isArray(currentUser.roles) && currentUser.roles.includes('admin_family'));

 if (isFamilyAdmin) {
 return (
 <div className="bg-gradient-to-r from-amber-500/15 via-red-500/15 to-amber-500/15 border-2 border-amber-500/50 rounded-3xl p-4 sm:p-5 shadow-lg shadow-amber-500/10 mb-6 animate-pulse">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div className="flex items-start sm:items-center gap-3.5">
 <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow-md shrink-0">
 <MapPin className="w-6 h-6 animate-bounce" />
 </div>
 <div className="space-y-1">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="bg-amber-600 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded tracking-wider">
 Ação Obrigatória do Administrador
 </span>
 <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
 Endereço da Residência Não Cadastrado
 </span>
 </div>
 <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">
 Cadastre o endereço da residência para liberar o ponto e a rotina
 </h3>
 <p className="text-xs text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed">
 Antes de iniciar qualquer atividade com cuidadores ou irmãos, você precisa cadastrar o endereço e o perímetro de segurança da residência onde o idoso(a) assistido reside.
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={onOpenResidenceModal}
 className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-black text-xs shrink-0 shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
 >
 <MapPin className="w-4 h-4" />
 <span>Adicionar Endereço da Residência Agora</span>
 <ArrowRight className="w-4 h-4" />
 </button>
 </div>
 </div>
 );
 }

 // Visualização para Outros Membros da Família e Cuidadores
 return (
 <div className="bg-slate-100 dark:bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 shadow-xs mb-6">
 <div className="flex items-start sm:items-center gap-3">
 <div className="p-2.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
 <AlertTriangle className="w-5 h-5" />
 </div>
 <div className="text-xs space-y-0.5">
 <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
 <span>Endereço da Residência Pendente</span>
 <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-semibold">
 Aguardando Administrador Familiar
 </span>
 </p>
 <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
 O Administrador da sua Família ainda não cadastrou o endereço oficial da residência. Algumas funções (como validação de presença de cuidadores no local) estão aguardando essa configuração.
 </p>
 </div>
 </div>
 </div>
 );
};
