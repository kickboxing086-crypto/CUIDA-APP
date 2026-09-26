import React, { useState, useRef } from 'react';
import {
  User as UserIcon,
  Camera,
  UploadCloud,
  Check,
  X,
  ShieldCheck,
  Sparkles,
  Phone,
  Mail,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';
import { getRolePowerProfile } from '../utils/classifications';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserUpdated: (updatedUser: User) => void;
  onLogout?: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
  onLogout,
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Camera capture states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  if (!isOpen) return null;

  const roleProfile = getRolePowerProfile(currentUser.role);

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch {
      setIsCameraActive(false);
      setMessage({
        type: 'error',
        text: 'Não foi possível acessar a câmera frontal. Tente escolher uma foto da galeria.',
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatarUrl(dataUrl);
        stopCamera();
        setMessage({ type: 'success', text: 'Foto capturada! Clique em Salvar Alterações.' });
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Foto muito pesada. Escolha uma imagem de até 5MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setAvatarUrl(base64);
        setMessage({ type: 'success', text: 'Foto selecionada! Clique em Salvar Alterações.' });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'O nome não pode ficar em branco.' });
      return;
    }

    try {
      setIsSaving(true);
      setMessage(null);
      stopCamera();

      const updated = await api.updateUserProfile(currentUser.id, {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        avatar_url: avatarUrl || undefined,
      });

      // Update session storage
      try {
        localStorage.setItem('cuida_session_user', JSON.stringify(updated));
      } catch {}

      onUserUpdated(updated);
      setMessage({ type: 'success', text: 'Perfil e foto atualizados com sucesso!' });
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Falha ao salvar alterações.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto p-4 sm:p-6 text-white shadow-2xl space-y-4 my-auto animate-in fade-in zoom-in-95 duration-200 text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Meu Perfil & Foto</h3>
              <p className="text-[11px] text-slate-400">
                @{currentUser.username} · {roleProfile.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Message */}
        {message && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/80 border-red-500/40 text-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Photo Management Section */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <label className="block text-xs font-bold text-slate-200">Foto do Perfil</label>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Current Avatar or Video Viewfinder */}
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-800 shrink-0 flex items-center justify-center shadow-lg">
              {isCameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-10 h-10 text-slate-500" />
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {/* Photo Action Buttons */}
            <div className="space-y-2 flex-1 w-full text-center sm:text-left">
              {isCameraActive ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Check className="w-4 h-4" />
                    <span>Tirar Foto Agora</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="py-2 px-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Câmera / Selfie</span>
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Galeria</span>
                  </button>
                </div>
              )}

              {/* Preset Avatars */}
              <div className="pt-1">
                <span className="text-[10px] text-slate-400 block mb-1">Ou escolha um avatar:</span>
                <div className="flex items-center gap-1.5">
                  {PRESET_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`w-7 h-7 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                        avatarUrl === url
                          ? 'border-emerald-400 ring-2 ring-emerald-400/50 scale-105'
                          : 'border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Details Form */}
        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Nome Completo *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Telefone / WhatsApp</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Role & Powers Display */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{roleProfile.title}</span>
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${roleProfile.colorTheme.badgeBg} ${roleProfile.colorTheme.badgeText}`}>
                {roleProfile.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">{roleProfile.summary}</p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between gap-3">
            {onLogout ? (
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair da Conta</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
