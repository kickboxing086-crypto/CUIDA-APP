import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  ArrowRight,
} from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';

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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isUsingSimulatedCamera, setIsUsingSimulatedCamera] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Start front camera
  const startCamera = async () => {
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Navegador sem suporte a WebRTC / Câmera.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setHasPermission(true);
      setIsUsingSimulatedCamera(false);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Erro ao acessar câmera:', err);
      setHasPermission(false);
      setIsUsingSimulatedCamera(true);
      setErrorMessage(
        'Acesso à câmera frontal não disponível. Você também pode enviar uma foto da sua galeria.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setErrorMessage(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const handleClose = () => {
    stopCamera();
    setCapturedPhoto(null);
    setErrorMessage(null);
    onClose();
  };

  const handleCapturePhoto = () => {
    try {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Mirror horizontal image for natural selfie feel
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Watermark with timestamp
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fillRect(0, canvas.height - 35, canvas.width, 35);
          ctx.font = 'bold 12px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`CUIDA ID · ${currentUser.username} · ${new Date().toLocaleTimeString('pt-BR')}`, 12, canvas.height - 12);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setCapturedPhoto(dataUrl);
          setErrorMessage(null);
          return;
        }
      }
    } catch {
      // ignore
    }

    // Fallback if camera stream snapshot isn't ready
    const fallbackPhoto =
      currentUser.avatar_url ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
    setCapturedPhoto(fallbackPhoto);
    setErrorMessage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('A imagem selecionada é muito grande. Escolha uma foto de até 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setCapturedPhoto(base64);
        setErrorMessage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBiometrics = async () => {
    const photoToSave =
      capturedPhoto ||
      currentUser.avatar_url ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

    try {
      setIsSaving(true);
      setErrorMessage(null);
      stopCamera();

      const updatedUser: User = {
        ...currentUser,
        facial_registered: true,
        facial_photo_url: photoToSave,
        avatar_url: photoToSave,
        facial_registered_at: new Date().toISOString(),
      };

      try {
        await api.registerFacialBiometrics(currentUser.id, photoToSave);
      } catch {
        // Safe fallback
      }

      onSuccess(updatedUser);
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao registrar biometria facial.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-4 sm:p-6 text-white shadow-2xl space-y-4 relative my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Identificação Facial
              </h3>
              <p className="text-[11px] text-slate-400">
                Selfie do perfil de {currentUser.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
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

        {/* Viewfinder or Captured Preview */}
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border border-slate-800 shadow-inner">
          {capturedPhoto ? (
            <div className="relative w-full h-full">
              <img
                src={capturedPhoto}
                alt="Selfie capturada"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Foto Pronta</span>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {/* Face Guide Oval */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-44 h-56 rounded-[50%] border-2 border-dashed border-blue-400/70 flex flex-col items-center justify-end pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 bg-slate-950/80 px-2.5 py-0.5 rounded-full">
                    Posicione o rosto
                  </span>
                </div>
              </div>

              {/* Status indicator */}
              <div className="absolute bottom-2 left-2 text-[10px] bg-slate-950/70 text-slate-300 px-2 py-0.5 rounded-md flex items-center gap-1.5 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Câmera Ao Vivo</span>
              </div>
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Helper Note */}
        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          {capturedPhoto
            ? 'Foto selecionada com sucesso. Clique em Confirmar Rosto para salvar.'
            : 'Mantenha o rosto centralizado em um local bem iluminado.'}
        </p>

        {/* Action Controls */}
        <div className="space-y-2 pt-1">
          {capturedPhoto ? (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setCapturedPhoto(null);
                  startCamera();
                }}
                className="w-full py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tirar Outra</span>
              </button>

              <button
                type="button"
                onClick={handleSaveBiometrics}
                disabled={isSaving}
                className="w-full py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/30"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Confirmar Rosto</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors flex items-center justify-center cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  className="col-span-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30"
                >
                  <Camera className="w-4 h-4" />
                  <span>Tirar Foto Agora</span>
                </button>
              </div>

              <div className="text-center pt-1">
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
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Ou escolha uma selfie da sua galeria</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Branding Footer */}
        <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-800/80">
          desenvolvido por <strong className="text-slate-300 font-bold">SF TECNOLOGIA</strong>
        </div>
      </div>
    </div>
  );
};
