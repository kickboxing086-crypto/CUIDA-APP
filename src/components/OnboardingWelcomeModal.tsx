import React, { useState } from 'react';
import {
  Sparkles,
  Camera,
  User,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Heart,
  ArrowRight,
} from 'lucide-react';
import { User as UserType } from '../types';
import { ElderCaneLogo } from './ElderCaneLogo';
import { CameraCaptureModal } from './CameraCaptureModal';

interface OnboardingWelcomeModalProps {
  user: UserType;
  onComplete: (updatedData: Partial<UserType>) => Promise<void>;
}

export const OnboardingWelcomeModal: React.FC<OnboardingWelcomeModalProps> = ({
  user,
  onComplete,
}) => {
  const [firstName, setFirstName] = useState(user.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user.last_name || user.name?.split(' ').slice(1).join(' ') || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [photoUrl, setPhotoUrl] = useState(
    user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
  );
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!firstName.trim()) {
      setErrorMsg('Por favor, informe seu Primeiro Nome.');
      return;
    }
    if (!lastName.trim()) {
      setErrorMsg('Por favor, informe seu Sobrenome.');
      return;
    }
    if (!phone.trim() || phone.length < 9) {
      setErrorMsg('Por favor, informe um telefone/WhatsApp válido com DDD.');
      return;
    }
    if (!termsAccepted) {
      setErrorMsg('Você precisa aceitar os Termos de Responsabilidade e Segurança.');
      return;
    }

    try {
      setIsSubmitting(true);
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await onComplete({
        name: fullName,
        last_name: lastName.trim(),
        phone: phone.trim(),
        avatar_url: photoUrl,
        first_login_completed: true,
        terms_accepted: true,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar informações de perfil.');
      setIsSubmitting(false);
    }
  };

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 relative overflow-hidden my-6">
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-blue-500 via-indigo-500 to-emerald-500" />

        {/* Welcome Celebration Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-bounce">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Primeiro Acesso · Seja muito bem-vindo(a)!</span>
          </div>

          <div className="flex justify-center my-2">
            <ElderCaneLogo size="md" variant="white-on-blue" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Olá, {user.username}! Complete seu Perfil
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Para garantir a segurança e identificação da sua família no CUIDA, é obrigatório preencher seus dados antes de iniciar.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-center gap-2.5 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={photoUrl}
                alt="Foto de perfil"
                className="w-20 h-20 rounded-full object-cover border-3 border-blue-600 shadow-md"
              />
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full shadow-md cursor-pointer transition-transform active:scale-95"
                title="Tirar selfie ao vivo com a câmera"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="text-xs font-bold text-slate-800">
                Foto de Perfil Obrigatória
              </div>
              <p className="text-[11px] text-slate-500">
                Tire uma selfie ao vivo para validação de identidade ou escolha um avatar.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap pt-1">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Tirar Selfie Agora</span>
                </button>
                <span className="text-[11px] text-slate-400">ou selecione:</span>
                {sampleAvatars.slice(0, 4).map((av, idx) => (
                  <img
                    key={idx}
                    src={av}
                    onClick={() => setPhotoUrl(av)}
                    alt={`Avatar ${idx}`}
                    className={`w-7 h-7 rounded-full object-cover cursor-pointer border-2 transition-all ${
                      photoUrl === av ? 'border-blue-600 scale-110' : 'border-slate-300 opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primeiro Nome *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ex: Maria"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sobrenome *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ex: Aparecida Silveira"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Phone / WhatsApp */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              WhatsApp / Telefone para Notificações *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: (11) 98765-4321"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-blue-600"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Usado pela família para contato imediato e avisos de medicação.
            </span>
          </div>

          {/* Terms & Conditions Acceptance */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <span className="font-medium">
                Declaro que as informações e fotos fornecidas são verdadeiras e me comprometo com o sigilo médico e as normas de assistência ao idoso conforme a <strong>Portaria MTE 671</strong>.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Validando e Salvando...</span>
              </>
            ) : (
              <>
                <span>Confirmar e Entrar no Aplicativo</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 pt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Dados criptografados e sincronizados com Firebase Firestore</span>
        </div>
      </div>

      {/* Live Selfie Camera Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={({ photoBase64 }) => {
          setPhotoUrl(photoBase64);
          setIsCameraOpen(false);
        }}
        title="Selfie de Identificação Facial"
        subtitle="Posicione seu rosto dentro da moldura para registrar sua foto oficial"
        officialTimeStr={new Date().toLocaleTimeString('pt-BR')}
        userName={firstName || user.username}
      />
    </div>
  );
};
