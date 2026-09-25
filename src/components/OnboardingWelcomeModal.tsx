import React, { useState, useRef } from 'react';
import {
  Sparkles,
  User,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MapPin,
  Building2,
  UploadCloud,
  Check,
} from 'lucide-react';
import { User as UserType, ElderlyProfile } from '../types';
import { ElderCaneLogo } from './ElderCaneLogo';
import { fetchAddressByCep, formatCep } from '../utils/cep';

interface OnboardingWelcomeModalProps {
  user: UserType;
  elderly?: ElderlyProfile | null;
  onComplete: (
    updatedData: Partial<UserType>,
    residenceData?: {
      address: string;
      lat?: number;
      long?: number;
      radius?: number;
    }
  ) => Promise<void>;
}

export const OnboardingWelcomeModal: React.FC<OnboardingWelcomeModalProps> = ({
  user,
  elderly,
  onComplete,
}) => {
  const isFamilyAdmin =
    user.role === 'admin_family' ||
    (Array.isArray(user.roles) && user.roles.includes('admin_family'));

  const cleanName = (user.name || '').trim();
  const isGeneric =
    !cleanName ||
    cleanName.toLowerCase().includes('pendente') ||
    cleanName.toLowerCase().includes('administrador') ||
    cleanName.toLowerCase().includes('novo cliente') ||
    cleanName.toLowerCase().includes('convidado');

  const [firstName, setFirstName] = useState(isGeneric ? '' : cleanName.split(' ')[0] || '');
  const [lastName, setLastName] = useState(
    isGeneric ? '' : user.last_name || cleanName.split(' ').slice(1).join(' ') || ''
  );
  const [phone, setPhone] = useState(
    user.phone && user.phone !== '(11) 98000-0000' ? user.phone : ''
  );

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  ];

  const [photoUrl, setPhotoUrl] = useState(user.avatar_url || sampleAvatars[0]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Residence address state (exclusive for family admin)
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [cityState, setCityState] = useState('');
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCepChange = async (val: string) => {
    const formatted = formatCep(val);
    setCep(formatted);
    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      setIsSearchingCep(true);
      try {
        const res = await fetchAddressByCep(clean);
        if (res) {
          if (res.street) setStreet(res.street);
          if (res.neighborhood) setNeighborhood(res.neighborhood);
          if (res.city && res.state) setCityState(`${res.city} - ${res.state}`);
        }
      } catch (err) {
        console.warn('Erro ao consultar CEP:', err);
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg('A imagem selecionada é muito grande. Escolha uma foto de até 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setPhotoUrl(base64);
      }
    };
    reader.readAsDataURL(file);
  };

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

    // Validação de endereço se for Administrador Familiar
    let computedAddress = '';
    if (isFamilyAdmin) {
      const parts = [
        street.trim(),
        number.trim() ? `nº ${number.trim()}` : '',
        neighborhood.trim(),
        cityState.trim(),
        cep.trim() ? `CEP ${cep.trim()}` : '',
      ].filter(Boolean);
      computedAddress = parts.join(', ');

      if (!computedAddress) {
        setErrorMsg('Como Administrador Familiar, informe o endereço da residência para permitir a gestão dos cuidadores.');
        return;
      }
    }

    if (!termsAccepted) {
      setErrorMsg('Você precisa aceitar os Termos de Responsabilidade e Segurança.');
      return;
    }

    try {
      setIsSubmitting(true);
      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      await onComplete(
        {
          name: fullName,
          last_name: lastName.trim(),
          phone: phone.trim(),
          avatar_url: photoUrl,
          first_login_completed: true,
          terms_accepted: true,
        },
        isFamilyAdmin && computedAddress
          ? {
              address: computedAddress,
              radius: 150,
            }
          : undefined
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar informações de perfil.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 space-y-5 relative overflow-hidden my-4">
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-blue-600 via-indigo-600 to-emerald-500" />

        {/* Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Primeiro Acesso · Configuração de Perfil</span>
          </div>

          <div className="flex justify-center my-1.5">
            <ElderCaneLogo size="md" variant="white-on-blue" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Olá, {user.username}! Seja bem-vindo(a) ao CUIDA
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Preencha seus dados para começar a usar o aplicativo com sua família.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seção 1: Foto de Perfil Amigável (Sem Câmera Facial) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={photoUrl}
                alt="Foto de perfil"
                className="w-16 h-16 rounded-full object-cover border-3 border-blue-600 shadow-md bg-white"
              />
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="text-xs font-bold text-slate-800">
                Foto do Perfil
              </div>
              <p className="text-[11px] text-slate-500">
                Escolha um avatar ou selecione uma foto da galeria do seu aparelho.
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap pt-0.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Escolher Foto</span>
                </button>

                <span className="text-[11px] text-slate-400">ou toque para escolher:</span>
                <div className="flex items-center gap-1.5">
                  {sampleAvatars.slice(0, 5).map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPhotoUrl(av)}
                      className={`relative rounded-full transition-transform cursor-pointer ${
                        photoUrl === av ? 'ring-2 ring-blue-600 scale-105' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={av}
                        alt={`Avatar ${idx}`}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      {photoUrl === av && (
                        <div className="absolute inset-0 bg-blue-600/30 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Dados Pessoais Obrigatórios */}
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
                  placeholder="Ex: Silveira"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Telefone / WhatsApp */}
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
          </div>

          {/* Seção 3: Se for Administrador Familiar, cadastra o endereço da residência para funcionar */}
          {isFamilyAdmin ? (
            <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-900 flex items-center gap-1.5 uppercase tracking-wide">
                  <MapPin className="w-4 h-4 text-blue-600" /> Endereço da Residência do Idoso(a) *
                </span>
                <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">
                  Administrador Familiar
                </span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Digite o <strong>CEP</strong> para carregar a rua automaticamente. Os cuidadores utilizarão esse local para a validação da rotina e do ponto.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    CEP
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={9}
                      value={cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:outline-blue-600"
                    />
                    {isSearchingCep && (
                      <div className="absolute right-2.5 top-2.5">
                        <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Rua / Avenida *
                  </label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Ex: Rua das Flores"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    required
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="Ex: 120"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-blue-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Bairro / Cidade
                  </label>
                  <input
                    type="text"
                    value={cityState ? `${neighborhood ? neighborhood + ', ' : ''}${cityState}` : neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Bairro e Cidade"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-blue-600"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Se for Cuidador ou Familiar */
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Família: {user.family_name || 'Família CUIDA'}</span>
              </span>
              <p className="text-[11px] text-slate-500">
                Assistido(a): <strong>{elderly?.full_name || 'Idoso(a) Assistido(a)'}</strong>
              </p>
              {elderly?.residence_address && elderly.residence_address !== 'Residência do Idoso' ? (
                <p className="text-[11px] text-emerald-700 font-medium pt-0.5">
                  📍 Residência: {elderly.residence_address}
                </p>
              ) : (
                <p className="text-[11px] text-amber-700 font-medium pt-0.5">
                  ℹ️ O Administrador Familiar cadastrará o endereço oficial da residência.
                </p>
              )}
            </div>
          )}

          {/* Termos de Uso e Responsabilidade */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <span className="font-medium text-[11px] leading-relaxed">
                Declaro que as informações fornecidas são verdadeiras e me comprometo com o sigilo, a ética e o cuidado humanizado ao idoso.
              </span>
            </label>
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvando Informações...</span>
              </>
            ) : (
              <>
                <span>Concluir e Começar a Usar</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-400 flex flex-col items-center justify-center gap-1 pt-1">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Dados sincronizados com segurança no CUIDA</span>
          </div>
          <span className="text-[10px] text-slate-400">
            desenvolvido por <strong className="text-slate-600 font-bold">SF TECNOLOGIA</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
