import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Clock,
  Heart,
  Pill,
  Camera,
  CheckCircle2,
  Check,
  AlertTriangle,
  Calendar,
  Plus,
  ShieldCheck,
  MapPin,
  ClipboardList,
  Sparkles,
  PhoneCall,
  Bell,
  Info,
  CheckSquare,
  FileText,
} from 'lucide-react';
import { ElderlyProfile, TimeEntry, User, DailyMission, FamilyNotice, FamilyActivityLog } from '../types';
import { api } from '../services/api';

interface CaregiverDashboardViewProps {
  currentUser: User;
  elderly: ElderlyProfile;
  onNavigateTab: (tab: any) => void;
  onOpenAddPresence: () => void;
  onOpenLiveCamera: (mode: 'check_in' | 'check_out') => void;
  onOpenResidenceConfig?: () => void;
  onOpenNotifications?: () => void;
  unreadCount?: number;
  unreadLogs?: FamilyActivityLog[];
  onOpenInvites?: () => void;
}

export const CaregiverDashboardView: React.FC<CaregiverDashboardViewProps> = ({
  currentUser,
  elderly,
  onNavigateTab,
  onOpenAddPresence,
  onOpenLiveCamera,
  onOpenResidenceConfig,
  onOpenNotifications,
  unreadCount = 0,
  unreadLogs = [],
  onOpenInvites,
}) => {
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [notices, setNotices] = useState<FamilyNotice[]>([]);
  const [shiftTimeFormatted, setShiftTimeFormatted] = useState<string>('00h 00m');

  const canManageResidence =
    currentUser.role === 'admin_family' ||
    Boolean(currentUser.roles?.includes('admin_family'));

  const hasResidenceConfigured = Boolean(
    elderly?.residence_address &&
    elderly.residence_address !== 'Residência do Idoso' &&
    elderly.residence_address !== 'Endereço da Residência' &&
    elderly.residence_lat &&
    elderly.residence_long
  );

  const [isRegisteringPoint, setIsRegisteringPoint] = useState(false);
  const [pointMessage, setPointMessage] = useState<string | null>(null);

  const handleDirectCheckIn = async () => {
    try {
      setIsRegisteringPoint(true);
      setPointMessage(null);
      let lat = elderly.residence_lat;
      let lng = elderly.residence_long;

      if (navigator.geolocation) {
        try {
          const pos: any = await new Promise((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 })
          );
          if (pos && pos.coords) {
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
          }
        } catch {
          // keep fallback
        }
      }

      await api.checkIn({
        userId: currentUser.id,
        elderlyId: elderly.id,
        locationLat: lat,
        locationLong: lng,
        notes: 'Ponto de entrada registrado com sucesso.',
      });
      await loadData();
      setPointMessage('Entrada registrada com sucesso!');
      setTimeout(() => setPointMessage(null), 4000);
    } catch (err: any) {
      alert(`⚠️ Erro ao registrar ponto: ${err.message || 'Falha ao bater ponto.'}`);
    } finally {
      setIsRegisteringPoint(false);
    }
  };

  const handleDirectCheckOut = async () => {
    if (!activeEntry) return;
    try {
      setIsRegisteringPoint(true);
      setPointMessage(null);
      let lat = elderly.residence_lat;
      let lng = elderly.residence_long;

      if (navigator.geolocation) {
        try {
          const pos: any = await new Promise((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 })
          );
          if (pos && pos.coords) {
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
          }
        } catch {
          // keep fallback
        }
      }

      await api.checkOut({
        entryId: activeEntry.id,
        locationLat: lat,
        locationLong: lng,
        notes: 'Encerramento de plantão registrado com sucesso.',
      });
      await loadData();
      setPointMessage('Saída registrada com sucesso!');
      setTimeout(() => setPointMessage(null), 4000);
    } catch (err: any) {
      alert(`⚠️ Erro ao registrar saída: ${err.message || 'Falha ao bater saída.'}`);
    } finally {
      setIsRegisteringPoint(false);
    }
  };

  const loadData = async () => {
    try {
      const active = await api.getActiveEntry(currentUser.id);
      setActiveEntry(active);
      const allNotices = await api.getNotices();
      setNotices(allNotices.slice(0, 3));
      const dailyMissions = await api.getDailyMissions();
      setMissions(dailyMissions);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.id]);

  // Live timer for active shift
  useEffect(() => {
    if (!activeEntry) return;
    const interval = setInterval(() => {
      const start = new Date(activeEntry.entry_time).getTime();
      const now = Date.now();
      const diffMinutes = Math.max(0, Math.floor((now - start) / (1000 * 60)));
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      setShiftTimeFormatted(`${hours}h ${String(mins).padStart(2, '0')}m`);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeEntry]);

  const toggleMission = async (missionId: string) => {
    try {
      await api.toggleDailyMission(missionId, currentUser.id, 'Cumprido conforme orientação do Admin');
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const completedCount = missions.filter((m) => m.completed).length;
  const totalCount = missions.length;
  const taskProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Red Alert Banner: Notificações de Alterações no Plantão */}
      {unreadCount > 0 && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-3xl p-5 shadow-xl shadow-red-600/20 border border-red-400/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-3 duration-300">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center shrink-0 shadow-inner">
              <Bell className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-white text-red-700 font-black text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  ({unreadCount}) Alterações no Plantão
                </span>
                <span className="text-xs text-red-100 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  Fique atento ao que foi atualizado
                </span>
              </div>
              <p className="text-sm font-bold text-white mt-1 leading-snug">
                {unreadLogs && unreadLogs.length > 0
                  ? unreadLogs[0].description
                  : 'Houve atualizações recentes no protocolo de missões, residência ou sinais vitais.'}
              </p>
              {unreadLogs && unreadLogs.length > 1 && (
                <span className="text-[11px] text-red-100 font-medium block mt-0.5">
                  + outras {unreadLogs.length - 1} alterações registradas pela família / administração.
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenNotifications}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-red-700 hover:bg-red-50 active:bg-red-100 font-extrabold text-xs shrink-0 shadow-lg shadow-black/10 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Bell className="w-4 h-4 text-red-600" />
            <span>Ver Notificações ({unreadCount})</span>
          </button>
        </div>
      )}

      {/* 1. Header do Painel do Cuidador */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Caregiver Profile Info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
                alt={currentUser.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/30 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-blue-900" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider font-extrabold bg-blue-700/80 text-blue-200 px-2 py-0.5 rounded border border-blue-600/60">
                  Painel Operacional do Cuidador
                </span>
                <span className="text-[11px] text-blue-200 font-mono">Reg: {currentUser.registration_code || 'CUID-4821'}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                Olá, {currentUser.name}
              </h1>
              <p className="text-xs text-blue-200 mt-0.5 flex items-center gap-2">
                <span>Cuidando com carinho de:</span>
                <strong className="text-white underline underline-offset-2">{elderly.full_name}</strong>
              </p>
            </div>
          </div>

          {/* Quick Presence Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenAddPresence}
              className="inline-flex items-center gap-2 py-2.5 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs shadow-xs active:scale-98 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Plantão Manual</span>
            </button>

            {activeEntry ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDirectCheckOut}
                  disabled={isRegisteringPoint}
                  className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-white" />
                  <span>{isRegisteringPoint ? 'Encerrando...' : 'Registrar Saída Agora'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenLiveCamera('check_out')}
                  className="p-2.5 rounded-xl bg-rose-700/80 hover:bg-rose-700 text-white border border-rose-500/50 transition-colors cursor-pointer"
                  title="Registrar saída com foto opcional"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDirectCheckIn}
                  disabled={isRegisteringPoint}
                  className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isRegisteringPoint ? 'Registrando...' : 'Bater Ponto Agora (Entrada)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenLiveCamera('check_in')}
                  className="p-2.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white border border-blue-400/50 transition-colors cursor-pointer"
                  title="Bater ponto com foto opcional"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Shift Tracker Banner */}
        <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-blue-300 block">Status do Plantão</span>
            <span className="font-bold text-sm text-white flex items-center gap-1.5 mt-0.5">
              <span className={`w-2.5 h-2.5 rounded-full ${activeEntry ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'}`} />
              {activeEntry ? 'Turno Ativo no Local' : 'Aguardando Entrada'}
            </span>
          </div>

          <div>
            <span className="text-blue-300 block">Horário de Entrada</span>
            <span className="font-bold text-sm text-white font-mono mt-0.5 block">
              {activeEntry
                ? new Date(activeEntry.entry_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : '--:--'}
            </span>
          </div>

          <div>
            <span className="text-blue-300 block">Tempo Decorrido</span>
            <span className="font-bold text-sm text-amber-300 font-mono mt-0.5 block">
              {activeEntry ? shiftTimeFormatted : '0h 00m'}
            </span>
          </div>

          <div>
            <span className="text-blue-300 block">Alergias do Idoso</span>
            <span className="font-bold text-xs text-rose-200 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/40 inline-block mt-0.5">
              {elderly.allergies.join(', ')}
            </span>
          </div>
        </div>
      </div>

      {/* Family Admin Exclusive: Gerador de Links de Convite para Irmãos, Irmãs e Cuidadores */}
      {canManageResidence && onOpenInvites && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/40 rounded-3xl p-5 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl text-emerald-400 shrink-0">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  Administrador Familiar
                </span>
                <span className="text-xs text-emerald-300 font-bold">
                  Gestão de Convites da Família
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">
                Convidar Irmãos, Irmãs & Cuidadores
              </h3>
              <p className="text-xs text-emerald-100/90 leading-relaxed max-w-xl">
                Como Administrador Familiar, você é o responsável por enviar os links de convite para que seus irmãos, parentes ou cuidadores entrem e criem seus logins com a classificação familiar adequada.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenInvites}
            className="w-full md:w-auto px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-xs shrink-0 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Convidar Membro / Cuidador</span>
          </button>
        </div>
      )}

      {/* Residence & Geofence Status Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">
                Local de Ponto Oficial da Residência:
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  hasResidenceConfigured
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {hasResidenceConfigured ? `Perímetro Ativo (Raio ${elderly.allowed_radius_meters || 150}m)` : '⚠️ Cadastro Pendente'}
              </span>
            </div>
            <p className="text-slate-600 mt-0.5">
              {elderly.residence_address || 'Endereço da residência ainda não cadastrado pelo Administrador Familiar.'}
            </p>
          </div>
        </div>

        {canManageResidence && onOpenResidenceConfig && (
          <button
            type="button"
            onClick={onOpenResidenceConfig}
            className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>{hasResidenceConfigured ? 'Alterar Residência / Raio' : '📍 Cadastrar Residência do Idoso'}</span>
          </button>
        )}
      </div>

      {/* 2. Grid de Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Checklist da Rotina Diária & Atalhos Rápidos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarefas e Plano de Missões Diárias */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                  <h2 className="font-bold text-base text-slate-900">
                    Plano de Missões Diárias & Obrigações do Turno
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-blue-800 font-medium mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Definido pelo Administrador Geral (Dr. Fernando Silveira)</span>
                </div>
              </div>

              {/* Progress pill & link to manage/view full */}
              <div className="flex items-center gap-3 self-end sm:self-center">
                <button
                  onClick={() => onNavigateTab('missions')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Ver Detalhes POP
                </button>
                <div className="text-right">
                  <span className="text-xs font-bold text-blue-900 font-mono">
                    {completedCount}/{totalCount} ({taskProgress}%)
                  </span>
                  <div className="w-20 h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${taskProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Missions List */}
            <div className="space-y-3 pt-4">
              {missions.map((mission) => (
                <div
                  key={mission.id}
                  onClick={() => toggleMission(mission.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                    mission.completed
                      ? 'bg-emerald-50/40 border-emerald-200 text-slate-700'
                      : mission.priority === 'mandatory'
                      ? 'bg-blue-50/30 border-blue-200 hover:border-blue-300'
                      : 'bg-white border-slate-200 hover:border-blue-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      type="button"
                      className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                        mission.completed
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'border-2 border-slate-300 text-transparent hover:border-blue-600'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-blue-900 bg-blue-100 px-1.5 py-0.2 rounded border border-blue-200">
                          {mission.scheduled_time}h
                        </span>

                        {mission.priority === 'mandatory' && (
                          <span className="text-[10px] uppercase font-bold text-rose-800 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            Obrigatória
                          </span>
                        )}

                        <span className={`text-sm font-semibold ${mission.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {mission.title}
                        </span>
                      </div>

                      {/* Clear and concise instruction from admin */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 text-xs text-slate-700 font-medium">
                        <span className="text-[10px] uppercase font-bold text-blue-800 block mb-0.5">
                          Instrução Clara:
                        </span>
                        {mission.clear_instructions}
                      </div>

                      {mission.completed && (
                        <span className="text-[11px] text-emerald-700 font-semibold block pt-0.5">
                          ✓ Cumprido às {mission.completed_at || '08:05'} por {mission.completed_by_name || currentUser.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botões de Acesso Rápido Operacional */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => onNavigateTab('incidents')}
              className="p-3.5 bg-white border border-slate-200 hover:border-blue-300 rounded-2xl shadow-xs text-left group transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-slate-900">Boletim do Idoso</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Relatar mal-estar ou rotina</p>
            </button>

            <button
              onClick={() => onNavigateTab('health')}
              className="p-3.5 bg-white border border-slate-200 hover:border-blue-300 rounded-2xl shadow-xs text-left group transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Heart className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-slate-900">Sinais Vitais</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">PA opcional & glicemia</p>
            </button>

            <button
              onClick={() => onNavigateTab('meds')}
              className="p-3.5 bg-white border border-slate-200 hover:border-blue-300 rounded-2xl shadow-xs text-left group transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Pill className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-slate-900">Medicamentos</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Checklist de remédios</p>
            </button>

            <button
              onClick={() => onNavigateTab('timesheet')}
              className="p-3.5 bg-white border border-slate-200 hover:border-blue-300 rounded-2xl shadow-xs text-left group transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-slate-900">Espelho Ponto</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Horas e comprovações</p>
            </button>
          </div>
        </div>

        {/* Right Col: Avisos da Família & Contatos de Emergência */}
        <div className="space-y-6">
          {/* Card da Família para o Cuidador */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Mural & Avisos da Família</h3>
              </div>
              <button
                onClick={() => onNavigateTab('family')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-3">
              {notices.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border text-xs ${
                    n.category === 'shopping'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : 'bg-blue-50/70 border-blue-200 text-blue-900'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{n.title}</span>
                    <span className="text-[10px] font-semibold opacity-75">
                      {n.category === 'shopping' ? 'Compras' : 'Instrução'}
                    </span>
                  </div>
                  <p className="text-[11px] mt-1 text-slate-600 line-clamp-2">{n.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Plantão Seguro & Protocolos */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Diretrizes de Segurança do Turno
            </h3>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>Registrar ponto com biometria facial frontal no início e término.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>Em caso de emergência médica, acionar imediatamente o Dr. Fernando ou SAMU 192.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>Medicamento só deve ser assinado após o idoso ingerir de fato.</span>
              </li>
            </ul>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">SAMU Emergência:</span>
              <a href="tel:192" className="font-bold text-rose-600 flex items-center gap-1">
                <PhoneCall className="w-3.5 h-3.5" /> 192
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
