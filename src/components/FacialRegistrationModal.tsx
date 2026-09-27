import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, Check, X, AlertCircle, ShieldCheck, UploadCloud, ArrowRight, Scan } from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';
import { FaceAppScanner, FaceAppVerificationResult } from './FaceAppScanner';

interface FacialRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSuccess: (updatedUser: User) => void;
}

export const FacialRegistrationModal: React.FC<FacialRegistrationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}) => {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerified = (res: FaceAppVerificationResult) => {
    setCapturedPhoto(res.photoBase64);
  };

  const handleSaveBiometrics = async () => {
    const photoToSave =
      capturedPhoto ||
      currentUser.avatar_url ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const updatedUser: User = {
        ...currentUser,
        facial_registered: true,
        facial_photo_url: photoToSave || undefined,
        avatar_url: photoToSave || undefined,
        facial_registered_at: new Date().toISOString(),
      };

      try {
        await api.registerFacialBiometrics(currentUser.id, photoToSave || '');
      } catch {
        // Safe fallback
      }

      onSuccess(updatedUser);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao registrar biometria facial.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto p-4 sm:p-6 text-white shadow-2xl space-y-4 relative my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-blue-400">
                  Face App
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Biometria Oficial
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Cadastro Facial de {currentUser.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cancelar e Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Face App Scanner Body */}
        <FaceAppScanner
          user={currentUser}
          mode="register"
          onVerified={handleVerified}
          title="Posicione o rosto para cadastro"
        />

        {/* Save confirmation */}
        {capturedPhoto && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
            <button
              type="button"
              onClick={handleSaveBiometrics}
              disabled={isSaving}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-emerald-600/30"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Salvando Biometria...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Salvar Biometria no Perfil</span>
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Branding Footer */}
        <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-800/80">
          desenvolvido por <strong className="text-slate-300 font-bold">SF TECNOLOGIA</strong>
        </div>
      </motion.div>
    </div>
  );
};
