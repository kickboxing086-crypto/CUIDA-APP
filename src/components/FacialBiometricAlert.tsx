import React, { useState } from 'react';
import { Scan, ShieldCheck, ArrowRight, X } from 'lucide-react';
import { User } from '../types';

interface FacialBiometricAlertProps {
  currentUser: User;
  onOpenFacialModal: () => void;
}

export const FacialBiometricAlert: React.FC<FacialBiometricAlertProps> = ({
  currentUser,
  onOpenFacialModal,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  // If already registered or temporarily dismissed, don't show
  if (currentUser.facial_registered || isDismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 border border-blue-400/40 rounded-2xl p-3.5 sm:p-4 shadow-sm relative overflow-hidden transition-all mb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 sm:p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5 sm:mt-0">
            <Scan className="w-5 h-5 text-white" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">
                Face App Pendente
              </span>
              <span className="text-xs font-bold text-slate-900">
                Verificação Facial Desativada
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 max-w-xl leading-relaxed">
              Ative o <strong>Face App</strong> para registrar sua biometria e habilitar o reconhecimento facial automático e a prova de vida nas batidas de ponto.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
          <button
            type="button"
            onClick={onOpenFacialModal}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Ativar Face App Agora</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Lembrar mais tarde"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
