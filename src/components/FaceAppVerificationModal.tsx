import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Scan,
  ShieldCheck,
  X,
  CheckCircle2,
  Clock,
  MapPin,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { User, ElderlyProfile } from '../types';
import { FaceAppScanner, FaceAppVerificationResult } from './FaceAppScanner';

interface FaceAppVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  elderly?: ElderlyProfile | null;
  mode?: 'check_in' | 'check_out' | 'register' | 'test';
  onConfirm?: (result: FaceAppVerificationResult) => void;
  officialTimeStr?: string;
}

export const FaceAppVerificationModal: React.FC<FaceAppVerificationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  elderly,
  mode = 'check_in',
  onConfirm,
  officialTimeStr = new Date().toLocaleTimeString('pt-BR'),
}) => {
  const [verificationResult, setVerificationResult] = useState<FaceAppVerificationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const getModeDetails = () => {
    switch (mode) {
      case 'check_in':
        return {
          title: 'Face App · Check-in de Entrada',
          subtitle: 'Validação facial e prova de vida para abertura de plantão',
          badge: 'Entrada Auditada',
          actionText: 'Confirmar Entrada no Turno',
        };
      case 'check_out':
        return {
          title: 'Face App · Check-out de Saída',
          subtitle: 'Validação facial para encerramento de plantão',
          badge: 'Saída Auditada',
          actionText: 'Confirmar Encerramento de Turno',
        };
      case 'register':
        return {
          title: 'Face App · Cadastro Facial',
          subtitle: 'Cadastre sua biometria facial de alta precisão',
          badge: 'Novo Cadastro',
          actionText: 'Salvar Biometria Facial',
        };
      case 'test':
      default:
        return {
          title: 'Face App · Verificador Facial',
          subtitle: 'Teste de reconhecimento facial e prova de vida em tempo real',
          badge: 'Diagnóstico',
          actionText: 'Concluir Teste de Verificação',
        };
    }
  };

  const details = getModeDetails();

  const handleVerified = (result: FaceAppVerificationResult) => {
    setVerificationResult(result);
  };

  const handleConfirmAction = async () => {
    if (!verificationResult) return;
    setIsSubmitting(true);
    try {
      if (onConfirm) {
        await onConfirm(verificationResult);
      }
      onClose();
    } catch (err) {
      console.error('Erro ao confirmar verificação Face App:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 sm:p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Scan className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider text-blue-300 font-mono">
                  Face App Biometria
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {details.badge}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                {details.title}
              </h2>
              <p className="text-xs text-blue-200/80 mt-0.5">
                {details.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Scanner Component Body */}
        <div className="p-4 sm:p-6 space-y-4">
          <FaceAppScanner
            user={currentUser}
            elderly={elderly}
            mode={mode === 'register' ? 'register' : 'verify'}
            onVerified={handleVerified}
            officialTimeStr={officialTimeStr}
            title={details.title}
          />

          {/* Audit & Compliance Disclaimer */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-[11px] text-slate-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200 block mb-0.5">
                Auditoria Criptográfica e Conformidade
              </span>
              <p className="leading-relaxed">
                A foto capturada pelo Face App é processada e carimbada com o horário oficial do servidor (NTP) e as coordenadas de geolocalização da residência para fins de comprovação presencial.
              </p>
            </div>
          </div>

          {/* Confirmation Action Button */}
          {verificationResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-2"
            >
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isSubmitting}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {isSubmitting ? 'Processando...' : details.actionText}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
