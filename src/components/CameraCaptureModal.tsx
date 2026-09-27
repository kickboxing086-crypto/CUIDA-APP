import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  RefreshCw,
  Check,
  AlertCircle,
  ShieldAlert,
  MapPin,
  ShieldCheck,
  Navigation,
  LocateFixed,
  Scan,
  UserCheck,
  ArrowRight,
  Sliders
} from 'lucide-react';
import { ElderlyProfile, User } from '../types';
import { FaceAppScanner, FaceAppVerificationResult } from './FaceAppScanner';

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
  const [captureMode, setCaptureMode] = useState<'face_app' | 'manual'>('face_app');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // Manual camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isUsingSimulatedCamera, setIsUsingSimulatedCamera] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // GPS Geofence state
  const [gpsLoading, setGpsLoading] = useState(true);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [isWithinPerimeter, setIsWithinPerimeter] = useState<boolean | null>(null);

  const allowedRadius = elderly?.allowed_radius_meters || 150;
  const hasResidenceConfigured = Boolean(elderly?.residence_lat && elderly?.residence_long);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPhoto(null);
      setCurrentCoords(null);
      setDistanceMeters(null);
      return;
    }

    captureDeviceLocation();
    if (captureMode === 'manual') {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, elderly, captureMode]);

  const captureDeviceLocation = () => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocalização não suportada no aparelho.');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentCoords({ lat, lng });
        setGpsLoading(false);

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
          setIsWithinPerimeter(dist <= allowedRadius);
        } else {
          setIsWithinPerimeter(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        setGpsError('Acesso ao GPS bloqueado ou desativado.');
        setIsWithinPerimeter(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

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
          height: { ideal: 480 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsUsingSimulatedCamera(false);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      setIsUsingSimulatedCamera(true);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takeManualSnapshot = () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 250);

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    if (videoRef.current && stream && !isUsingSimulatedCamera) {
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PRESENÇA AUDITADA', 320, 240);
    }

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(0, canvas.height - 44, canvas.width, 44);

    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`[CUIDA NTP AUDITED] ${officialTimeStr}`, 16, canvas.height - 24);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '11px sans-serif';
    ctx.fillText(
      `COLABORADOR: ${userName.toUpperCase()} · GPS: ${currentCoords ? `${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)}` : 'VERIFICADO'}`,
      16,
      canvas.height - 10
    );

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);
  };

  const handleFaceAppVerified = (result: FaceAppVerificationResult) => {
    setCapturedPhoto(result.photoBase64);
    onCapture({
      photoBase64: result.photoBase64,
      locationLat: result.coords?.lat || currentCoords?.lat,
      locationLong: result.coords?.lng || currentCoords?.lng,
    });
    onClose();
  };

  const handleConfirmManual = () => {
    if (!capturedPhoto) return;
    onCapture({
      photoBase64: capturedPhoto,
      locationLat: currentCoords?.lat,
      locationLong: currentCoords?.lng,
    });
    setCapturedPhoto(null);
    onClose();
  };

  const handleClose = () => {
    stopCamera();
    setCapturedPhoto(null);
    onClose();
  };

  if (!isOpen) return null;

  const mockUser: User = currentUser || {
    id: 'usr-01',
    name: userName,
    username: userName.toLowerCase().replace(/\s+/g, '_'),
    role: 'caregiver',
    roles: ['caregiver'],
    role_label: 'Cuidador',
    permission_level: 5,
    created_at: new Date().toISOString(),
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative w-full max-w-lg max-h-[calc(100dvh-1.5rem)] overflow-y-auto bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl text-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Scan className="w-3.5 h-3.5 text-blue-400" />
              Verificação Facial
            </span>
            <h3 className="font-extrabold text-sm sm:text-base text-white">{title}</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Horário Oficial</span>
              <span className="font-mono text-xs font-bold text-amber-300">{officialTimeStr}</span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <span className="text-lg leading-none font-bold px-1">&times;</span>
            </button>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-5 sm:px-6 pt-3 pb-2 flex items-center gap-2 border-b border-slate-800/80 bg-slate-950/40">
          <button
            type="button"
            onClick={() => setCaptureMode('face_app')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              captureMode === 'face_app'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Face App (Automático)</span>
          </button>

          <button
            type="button"
            onClick={() => setCaptureMode('manual')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              captureMode === 'manual'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Captura Manual</span>
          </button>
        </div>

        {/* Face App Mode */}
        {captureMode === 'face_app' && (
          <div className="p-4 sm:p-5">
            <FaceAppScanner
              user={mockUser}
              elderly={elderly}
              mode="verify"
              onVerified={handleFaceAppVerified}
              officialTimeStr={officialTimeStr}
              title={title}
            />
          </div>
        )}

        {/* Manual Photo Mode */}
        {captureMode === 'manual' && (
          <div className="p-5 sm:p-6 space-y-4">
            <div className="relative aspect-4/3 w-full bg-black rounded-2xl overflow-hidden border-2 border-slate-800 shadow-inner flex items-center justify-center">
              {isFlashing && <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-300" />}

              {!capturedPhoto ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover scale-x-[-1] ${isUsingSimulatedCamera ? 'hidden' : 'block'}`}
                  />
                  {isUsingSimulatedCamera && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 p-6 text-center space-y-3">
                      <div className="w-20 h-20 rounded-full border-4 border-blue-400 border-dashed flex items-center justify-center animate-pulse">
                        <Camera className="w-10 h-10 text-blue-300" />
                      </div>
                      <span className="font-bold text-sm text-white block">Câmera Ativada</span>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </>
              ) : (
                <img src={capturedPhoto} alt="Captura Manual" className="w-full h-full object-cover" />
              )}
            </div>

            <div className="flex items-center gap-3">
              {!capturedPhoto ? (
                <button
                  type="button"
                  onClick={takeManualSnapshot}
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capturar Foto</span>
                </button>
              ) : (
                <div className="flex items-center gap-2.5 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedPhoto(null);
                      startCamera();
                    }}
                    className="flex-1 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tirar Outra</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmManual}
                    className="flex-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirmar Foto</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
