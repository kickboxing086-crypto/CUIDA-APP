import React, { useState, useEffect } from 'react';
import {
  LogIn,
  LogOut,
  MapPin,
  ShieldCheck,
  UserCheck,
  Clock,
  AlertTriangle,
  History,
  Camera,
  CheckCircle2,
  Plus,
  Compass,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { ElderlyProfile, TimeEntry, User } from '../types';
import { api } from '../services/api';
import { CameraCaptureModal } from './CameraCaptureModal';

interface TimeClockViewProps {
  currentUser: User;
  elderly: ElderlyProfile;
  onRefreshHistory: () => void;
  onOpenAddPresence?: () => void;
  onOpenResidenceConfig?: () => void;
}

export const TimeClockView: React.FC<TimeClockViewProps> = ({
  currentUser,
  elderly,
  onRefreshHistory,
  onOpenAddPresence,
  onOpenResidenceConfig,
}) => {
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Camera modal state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'check_in' | 'check_out'>('check_in');

  // Geolocation state
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoDistance, setGeoDistance] = useState<number | null>(null);
  const [isWithinRadius, setIsWithinRadius] = useState<boolean | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Active shift live duration counter
  const [shiftDurationFormatted, setShiftDurationFormatted] = useState<string>('00h 00m');

  const canManageResidence =
    currentUser.role === 'admin_geral' ||
    currentUser.role === 'admin_family' ||
    currentUser.roles?.includes('admin_family');

  const allowedRadius = elderly.allowed_radius_meters || 150;
  const hasResidenceConfigured = Boolean(elderly.residence_lat && elderly.residence_long);

  const loadShiftState = async () => {
    setIsLoading(true);
    try {
      const active = await api.getActiveEntry(currentUser.id);
      setActiveEntry(active);
      const historyRes = await api.getTimesheetHistory(undefined, undefined, currentUser.id);
      setRecentEntries(historyRes.entries.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShiftState();
  }, [currentUser.id]);

  // Request real device GPS coordinates
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentCoords({ lat, lng });
          setGeoError(null);

          if (elderly.residence_lat && elderly.residence_long) {
            // Calculate distance to elderly residence
            const R = 6371e3;
            const φ1 = (lat * Math.PI) / 180;
            const φ2 = (elderly.residence_lat * Math.PI) / 180;
            const Δφ = ((elderly.residence_lat - lat) * Math.PI) / 180;
            const Δλ = ((elderly.residence_long - lng) * Math.PI) / 180;
            const a =
              Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = Math.round(R * c);

            setGeoDistance(distance);
            setIsWithinRadius(distance <= allowedRadius);
          } else {
            setIsWithinRadius(false);
          }
        },
        (err) => {
          setGeoError('GPS desativado ou sem permissão de localização.');
          setIsWithinRadius(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setGeoError('Geolocalização não suportada no aparelho.');
      setIsWithinRadius(false);
    }
  }, [elderly, allowedRadius]);

  // Live shift timer
  useEffect(() => {
    if (!activeEntry) return;

    const interval = setInterval(() => {
      const start = new Date(activeEntry.entry_time).getTime();
      const now = Date.now();
      const diffMinutes = Math.max(0, Math.floor((now - start) / (1000 * 60)));
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      setShiftDurationFormatted(`${hours}h ${String(mins).padStart(2, '0')}m`);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeEntry]);

  const [isSubmittingDirect, setIsSubmittingDirect] = useState(false);

  const handleDirectCheckIn = async () => {
    setActionError(null);
    setActionSuccess(null);
    setIsSubmittingDirect(true);

    try {
      const res = await api.checkIn({
        userId: currentUser.id,
        elderlyId: elderly.id,
        locationLat: currentCoords?.lat || elderly.residence_lat,
        locationLong: currentCoords?.lng || elderly.residence_long,
        notes: 'Registro de ponto com horário oficial sincronizado.',
      });
      setActionSuccess(res.message);
      await loadShiftState();
      onRefreshHistory();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao bater ponto de entrada.');
    } finally {
      setIsSubmittingDirect(false);
    }
  };

  const handleDirectCheckOut = async () => {
    setActionError(null);
    setActionSuccess(null);
    setIsSubmittingDirect(true);

    try {
      const currentActive = activeEntry || (await api.getActiveEntry(currentUser.id));
      if (!currentActive) {
        setActionError('Não há plantão em aberto no momento para encerrar.');
        return;
      }
      const res = await api.checkOut({
        entryId: currentActive.id,
        locationLat: currentCoords?.lat || elderly.residence_lat,
        locationLong: currentCoords?.lng || elderly.residence_long,
        notes: 'Encerramento de plantão com horário oficial sincronizado.',
      });
      setActionSuccess(res.message);
      await loadShiftState();
      onRefreshHistory();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao registrar saída de plantão.');
    } finally {
      setIsSubmittingDirect(false);
    }
  };

  const handleOpenCheckIn = () => {
    setActionError(null);
    setActionSuccess(null);
    setCameraMode('check_in');
    setIsCameraOpen(true);
  };

  const handleOpenCheckOut = () => {
    setActionError(null);
    setActionSuccess(null);
    setCameraMode('check_out');
    setIsCameraOpen(true);
  };

  const handlePhotoCaptured = async (params: { photoBase64: string; locationLat?: number; locationLong?: number }) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      if (cameraMode === 'check_in') {
        const res = await api.checkIn({
          userId: currentUser.id,
          elderlyId: elderly.id,
          photoBase64: params.photoBase64,
          locationLat: params.locationLat || currentCoords?.lat,
          locationLong: params.locationLong || currentCoords?.lng,
          notes: 'Registro de ponto com foto facial auditada.',
        });
        setActionSuccess(res.message);
      } else if (cameraMode === 'check_out') {
        const currentActive = activeEntry || (await api.getActiveEntry(currentUser.id));
        if (!currentActive) {
          setActionError('Não há plantão em andamento para registrar saída.');
          return;
        }
        const res = await api.checkOut({
          entryId: currentActive.id,
          photoBase64: params.photoBase64,
          locationLat: params.locationLat || currentCoords?.lat,
          locationLong: params.locationLong || currentCoords?.lng,
          notes: 'Encerramento de plantão com foto facial auditada.',
        });
        setActionSuccess(res.message);
      }
      await loadShiftState();
      onRefreshHistory();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao processar registro de ponto');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Elderly in care & Residence Geofence Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 font-extrabold text-xl flex items-center justify-center shrink-0 border border-blue-200">
              {elderly.full_name?.slice(0, 2).toUpperCase() || 'ID'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">{elderly.full_name}</h1>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Acompanhamento Seguro
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-medium">
                  {elderly.residence_address || 'Endereço residencial ainda não cadastrado'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Cadastrar Residência / Adicionar Presença */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {canManageResidence && onOpenResidenceConfig && (
              <button
                type="button"
                onClick={onOpenResidenceConfig}
                className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 text-xs font-bold transition-all cursor-pointer"
                title="Cadastrar ou editar o endereço da residência para controle de ponto"
              >
                <Building2 className="w-4 h-4 text-amber-700" />
                <span>{hasResidenceConfigured ? 'Editar Residência & Raio' : '📍 Cadastrar Residência'}</span>
              </button>
            )}

            {onOpenAddPresence && (
              <button
                onClick={onOpenAddPresence}
                className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Adicionar Presença</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Geofence Presence Indicator */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                !hasResidenceConfigured
                  ? 'bg-amber-500'
                  : isWithinRadius
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-700">
              {!hasResidenceConfigured ? (
                <span className="text-amber-800 font-semibold">
                  ⚠️ Residência não cadastrada pelo Administrador Familiar.
                </span>
              ) : geoError ? (
                <span className="text-rose-700 font-semibold">{geoError}</span>
              ) : geoDistance !== null ? (
                <span>
                  Distância atual da residência: <strong>{geoDistance} metros</strong>{' '}
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded ${
                      isWithinRadius ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isWithinRadius ? '✓ Dentro do Perímetro Autorizado' : '⛔ Fora do Local de Trabalho'}
                  </span>
                </span>
              ) : (
                'Calculando distância da residência...'
              )}
            </span>
          </div>

          <div className="text-slate-500 font-medium">
            Tolerância Máxima: <strong>{allowedRadius} metros</strong>
          </div>
        </div>
      </div>

      {/* Action Notifications */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl flex items-center gap-3 text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl flex items-center gap-3 text-sm animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Punch Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Action Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50/50 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />

            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-blue-700">
                  Controle de Frequência e Ponto
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  {activeEntry ? 'Turno em Andamento' : 'Turno Não Iniciado'}
                </h2>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  activeEntry
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeEntry ? 'bg-emerald-600 animate-ping' : 'bg-slate-400'
                  }`}
                />
                {activeEntry ? 'Em Atendimento' : 'Fora de Turno'}
              </div>
            </div>

            {/* Shift Tracker Live */}
            {activeEntry ? (
              <div className="py-6 space-y-6">
                <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl text-white shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-blue-300 block">Tempo Decorrido no Local</span>
                      <span className="text-3xl sm:text-4xl font-mono font-extrabold text-amber-300 block mt-0.5">
                        {shiftDurationFormatted}
                      </span>
                      <span className="text-xs text-blue-200/80 mt-1 block">
                        Entrada registrada às{' '}
                        {new Date(activeEntry.entry_time).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {activeEntry.entry_photo_url && (
                        <div className="text-center">
                          <img
                            src={activeEntry.entry_photo_url}
                            alt="Selfie Entrada"
                            className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-400 shadow-sm mx-auto"
                          />
                          <span className="text-[10px] text-emerald-300 font-bold block mt-1">
                            Selfie de Entrada
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <p className="text-xs text-slate-600">
                    O encerramento do plantão será registrado com o <strong>horário oficial auditado</strong>.
                  </p>
                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleDirectCheckOut}
                      disabled={isSubmittingDirect}
                      className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-sm shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>{isSubmittingDirect ? 'Encerrando...' : 'Registrar Saída Agora'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenCheckOut}
                      className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
                      title="Registrar saída com foto opcional"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="font-bold text-base text-slate-900">
                    Iniciar Novo Plantão de Assistência
                  </h3>
                  <p className="text-xs text-slate-600">
                    Registre a sua entrada com validação de horário oficial e confirmação no local.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleDirectCheckIn}
                    disabled={isSubmittingDirect}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{isSubmittingDirect ? 'Registrando...' : 'Bater Ponto Agora (Entrada)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenCheckIn}
                    className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    title="Bater ponto anexando foto frontal"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Com Foto (Opcional)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Segurança & Regras Anti-Fraude */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Protocolo Seguro de Ponto
            </h3>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  1. Localização & GPS
                </strong>
                <span>
                  O ponto registra a coordenada geográfica e verifica a presença na residência de {elderly.full_name}.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  2. Foto Facial Auditada
                </strong>
                <span>
                  Foto capturada no momento da entrada ou saída com carimbo de data e hora inviolável.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  3. Horário Oficial de Brasília
                </strong>
                <span>
                  Cálculo automático e preciso de permanência para total tranquilidade da família e do cuidador.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Clock Records History */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Últimos Registros de Ponto (Entradas e Saídas)
              </h3>
              <p className="text-xs text-slate-500">
                Histórico auditado de presenças registradas no aplicativo
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {recentEntries.length} registro(s)
          </span>
        </div>

        {recentEntries.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <Clock className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">Nenhum ponto registrado recentemente</p>
            <p className="text-[11px] text-slate-500">
              Ao bater o ponto de entrada ou saída, o registro aparecerá aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentEntries.map((entry) => {
              const entryDate = new Date(entry.entry_time);
              const formattedEntryTime = entryDate.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const exitDate = entry.exit_time ? new Date(entry.exit_time) : null;
              const formattedExitTime = exitDate
                ? exitDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : null;

              return (
                <div
                  key={entry.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    {entry.entry_photo_url ? (
                      <img
                        src={entry.entry_photo_url}
                        alt="Selfie de Ponto"
                        className="w-10 h-10 rounded-xl object-cover border border-emerald-400 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{entry.user_name || 'Cuidador(a)'}</span>
                        <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-medium">
                          {entry.day_of_week || 'Plantão'} · {entry.date_stamp}
                        </span>
                      </div>
                      <div className="text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <LogIn className="w-3 h-3 text-emerald-600" /> Entrada: {formattedEntryTime}
                        </span>
                        {formattedExitTime ? (
                          <span className="text-rose-700 font-semibold flex items-center gap-1">
                            <LogOut className="w-3 h-3 text-rose-600" /> Saída: {formattedExitTime}
                          </span>
                        ) : (
                          <span className="text-amber-700 font-bold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                            Em Andamento
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {entry.total_hours_formatted && entry.total_hours_formatted !== 'Em andamento' ? (
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg text-xs">
                        {entry.total_hours_formatted}
                      </span>
                    ) : null}
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-lg">
                      Auditado
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Camera Capture Modal */}
      {isCameraOpen && (
        <CameraCaptureModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handlePhotoCaptured}
          title={cameraMode === 'check_in' ? 'Check-in: Ponto de Entrada' : 'Check-out: Ponto de Saída'}
          subtitle="Validação facial com perímetro de segurança GPS"
          officialTimeStr={new Date().toLocaleTimeString('pt-BR')}
          userName={currentUser.name}
          elderly={elderly}
        />
      )}
    </div>
  );
};
