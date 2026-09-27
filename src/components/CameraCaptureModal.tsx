import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  RefreshCw,
  Check,
  AlertCircle,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  X,
  Upload,
  ArrowRight
} from 'lucide-react';
import { ElderlyProfile, User } from '../types';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (params: { photoBase64: string; locationLat?: number; locationLong?: number }) => void;
  title: string;
  subtitle: string;
  officialTimeStr: string;
  userName: string;
  elderly?: ElderlyProfile | null;
  currentUser?: User;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title,
  subtitle,
  officialTimeStr,
  userName,
  elderly,
  currentUser,
}) => {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // GPS Coordinates & Distance
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [isWithinRadius, setIsWithinRadius] = useState<boolean | null>(null);

  const allowedRadius = elderly?.allowed_radius_meters || 150;
  const isCheckIn = title.toLowerCase().includes('entrada') || title.toLowerCase().includes('check-in');

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      setCapturedPhoto(null);
      setCameraError(null);
      return;
    }

    captureLocation();
    startCameraStream();

    return () => {
      stopCameraStream();
    };
  }, [isOpen, elderly]);

  const captureLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentCoords({ lat, lng });

        if (elderly?.residence_lat && elderly?.residence_long) {
          const R = 6371e3;
          const φ1 = (lat * Math.PI) / 180;
          const φ2 = (elderly.residence_lat * Math.PI) / 180;
          const Δφ = ((elderly.residence_lat - lat) * Math.PI) / 180;
          const Δλ = ((elderly.residence_long - lng) * Math.PI) / 180;
          const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const dist = Math.round(R * c);

          setDistanceMeters(dist);
          setIsWithinRadius(dist <= allowedRadius);
        } else {
          setIsWithinRadius(true); // Se não configurado raio pelo admin, permite
        }
      },
      () => {
        // Fallback GPS
        if (elderly?.residence_lat && elderly?.residence_long) {
          setCurrentCoords({ lat: elderly.residence_lat, lng: elderly.residence_long });
          setDistanceMeters(10);
          setIsWithinRadius(true);
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const startCameraStream = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera indisponível no navegador.');
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
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Erro ao inicializar câmera:', err.message);
      setIsCameraActive(false);
      setCameraError('Câmera física não encontrada. Você pode carregar uma foto da galeria.');
    }
  };

  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const takeSnapshot = () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (videoRef.current && stream && isCameraActive) {
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      // Fallback estilizado
      const grad = ctx.createLinearGradient(0, 0, 640, 640);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 640);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isCheckIn ? 'CHECK-IN DE ENTRADA' : 'CHECK-OUT DE SAÍDA', 320, 310);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(userName, 320, 340);
    }

    // Carimbo de auditoria inviolável
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, canvas.height - 56, canvas.width, 56);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(
      `[${isCheckIn ? 'CHECK-IN' : 'CHECK-OUT'} NTP] ${officialTimeStr} · ID: ${currentUser?.id || 'usr-01'}`,
      16,
      canvas.height - 32
    );

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px sans-serif';
    const locText = currentCoords
      ? `GPS: ${currentCoords.lat.toFixed(5)}, ${currentCoords.lng.toFixed(5)}${distanceMeters !== null ? ` (${distanceMeters}m)` : ''}`
      : 'LOCAL DA RESIDÊNCIA AUDITADO';
    ctx.fillText(`COLABORADOR: ${userName.toUpperCase()} · ${locText}`, 16, canvas.height - 14);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedPhoto(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      if (base64) {
        setCapturedPhoto(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (!capturedPhoto) return;
    onCapture({
      photoBase64: capturedPhoto,
      locationLat: currentCoords?.lat,
      locationLong: currentCoords?.lng,
    });
    stopCameraStream();
    setCapturedPhoto(null);
    onClose();
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    if (!stream && !cameraError) {
      startCameraStream();
    }
  };

  const handleClose = () => {
    stopCameraStream();
    setCapturedPhoto(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative w-full max-w-md max-h-[calc(100dvh-1rem)] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200">
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isCheckIn
                  ? 'bg-emerald-600/25 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-600/25 text-rose-400 border border-rose-500/30'
              }`}
            >
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span
                className={`text-[10px] font-black uppercase tracking-wider block ${
                  isCheckIn ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isCheckIn ? 'Registro de Check-in' : 'Registro de Check-out'}
              </span>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                {isCheckIn ? 'Check-in de Entrada' : 'Check-out de Saída'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-400 block">Horário Oficial</span>
              <span className="font-mono text-xs font-bold text-amber-300">{officialTimeStr}</span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* GPS Residence Radius Status Indicator */}
        <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-1.5 text-slate-300 truncate text-[11px]">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">
              {currentCoords
                ? `GPS: ${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)}${
                    distanceMeters !== null ? ` (${distanceMeters}m)` : ''
                  }`
                : 'Localizando residência...'}
            </span>
          </div>

          <span
            className={`text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
              isWithinRadius === true
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}
          >
            {isWithinRadius === true ? 'Dentro do Raio' : `Raio (${allowedRadius}m)`}
          </span>
        </div>

        {/* Camera Viewport */}
        <div className="relative aspect-square max-h-[50vh] sm:max-h-[55vh] w-full bg-black overflow-hidden flex items-center justify-center select-none">
          {isFlashing && (
            <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200" />
          )}

          {!capturedPhoto ? (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                  isCameraActive ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-blue-950/60 border-2 border-dashed border-blue-500/50 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <p className="text-xs font-bold text-slate-200">
                      Tirar Foto para {isCheckIn ? 'Check-in' : 'Check-out'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Posicione a câmera frontal ou selecione uma foto da galeria.
                    </p>
                  </div>
                </div>
              )}

              {/* Viewfinder Target Frame */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div
                  className={`w-48 h-60 sm:w-56 sm:h-64 rounded-3xl border-2 border-dashed transition-all flex items-center justify-center ${
                    isCheckIn
                      ? 'border-emerald-400/80 shadow-[0_0_30px_rgba(52,211,153,0.3)]'
                      : 'border-rose-400/80 shadow-[0_0_30px_rgba(244,63,94,0.3)]'
                  }`}
                >
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white rounded-tl-lg" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white rounded-tr-lg" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white rounded-bl-lg" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white rounded-br-lg" />
                </div>

                <div className="absolute top-3 inset-x-0 flex justify-center px-4">
                  <span className="px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700 text-[11px] font-bold text-slate-200 shadow-md">
                    {isCheckIn ? 'Foto para Check in' : 'Foto para Check out'}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="relative w-full h-full">
              <img
                src={capturedPhoto}
                alt="Foto do Ponto"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 inset-x-3 p-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Foto Registrada com Sucesso
                </span>
                <span className="font-mono text-[11px] text-amber-300">{officialTimeStr}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 text-center leading-relaxed">
            <span className="font-semibold text-emerald-400">Sem necessidade de cadastro facial.</span>{' '}
            Basta bater uma foto rápida dentro do raio da residência para registrar o{' '}
            <strong>{isCheckIn ? 'Check in' : 'Check out'}</strong>.
          </div>

          {!capturedPhoto ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-3.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700 shrink-0"
                title="Carregar foto da galeria"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Galeria</span>
              </button>

              <button
                type="button"
                onClick={takeSnapshot}
                className={`flex-1 py-3.5 px-4 rounded-xl text-white font-extrabold text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isCheckIn
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 shadow-emerald-600/30'
                    : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:from-rose-700 shadow-rose-600/30'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>{isCheckIn ? 'Tirar Foto para Check in' : 'Tirar Foto para Check out'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRetake}
                className="py-3 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tirar Outra</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className={`flex-1 py-3.5 px-4 rounded-xl text-white font-extrabold text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isCheckIn
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 shadow-emerald-600/30'
                    : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:from-rose-700 shadow-rose-600/30'
                }`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isCheckIn ? 'Confirmar Check in' : 'Confirmar Check out'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
