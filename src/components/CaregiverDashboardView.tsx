import React, { useState, useEffect } from 'react';
import {
  Clock,
  Heart,
  Pill,
  CheckCircle2,
  Plus,
  ClipboardList,
  Bell,
  FileText,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { ElderlyProfile, TimeEntry, User, DailyMission, FamilyNotice } from '../types';
import { api } from '../services/api';

interface CaregiverDashboardViewProps {
  currentUser: User;
  elderly: ElderlyProfile;
  onNavigateTab: (tab: any) => void;
  onOpenAddPresence: () => void;
  onOpenResidenceConfig?: () => void;
  onOpenInvites?: () => void;
  onOpenNotifications?: () => void;
  unreadCount?: number;
  unreadLogs?: any[];
}

export const CaregiverDashboardView: React.FC<CaregiverDashboardViewProps> = ({
  currentUser,
  elderly,
  onNavigateTab,
  onOpenAddPresence,
}) => {
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [notices, setNotices] = useState<FamilyNotice[]>([]);
  const [shiftTimeFormatted, setShiftTimeFormatted] = useState<string>('00h 00m');

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
      await api.toggleDailyMission(missionId, currentUser.id, 'Cumprido conforme orientação');
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const completedCount = missions.filter((m) => m.completed).length;
  const totalCount = missions.length;
  const taskProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* 1. Header Limpo, Leve e Prático */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center shrink-0 border border-blue-200">
            {currentUser.avatar_url ? (
              <img src={currentUser.avatar_url} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg">{currentUser.name?.charAt(0) || 'U'}</span>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Olá, {currentUser.name?.split(' ')[0]}
              </h1>
              {activeEntry ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Turno em Andamento ({shiftTimeFormatted})
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Fora de Turno
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>Assistindo: <strong className="text-slate-800 font-semibold">{elderly.full_name}</strong></span>
              {elderly.allergies && elderly.allergies.length > 0 && (
                <span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded font-medium">
                  Alergia: {elderly.allergies[0]}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Atalhos Rápidos da Topbar */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => onNavigateTab('clock')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeEntry
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 shadow-xs'
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm shadow-blue-500/20'
            }`}
            title="Acessar aba exclusiva de Check-in e Check-out"
          >
            <Clock className="w-4 h-4" />
            <span>{activeEntry ? 'Ir para Aba de Check-out' : 'Aba de Ponto / Check-in'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddPresence}
            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            title="Lançar turno avulso ou plantão manual"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Presença Manual</span>
          </button>
        </div>
      </div>

      {/* 2. Grid de Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Checklist de Missões do Dia */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tarefas e Plano de Missões Diárias */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                  <h2 className="font-bold text-base text-slate-900">
                    Missões & Rotina Diária
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Checklist de tarefas obrigatórias para o bem-estar do idoso
                </p>
              </div>

              {/* Progress Bar & Counter */}
              <div className="flex items-center gap-3 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => onNavigateTab('missions')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Ver Todas
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
            <div className="space-y-2.5 pt-4">
              {missions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  Nenhuma missão cadastrada para o turno de hoje.
                </p>
              ) : (
                missions.map((mission) => (
                  <div
                    key={mission.id}
                    onClick={() => toggleMission(mission.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      mission.completed
                        ? 'bg-emerald-50/30 border-emerald-200 text-slate-700'
                        : mission.priority === 'mandatory'
                        ? 'bg-blue-50/30 border-blue-200 hover:border-blue-300'
                        : 'bg-white border-slate-200 hover:border-blue-200 text-slate-900'
                    }`}
                  >
                    <button
                      type="button"
                      className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 ${
                        mission.completed
                          ? 'bg-emerald-600 text-white'
                          : 'border-2 border-slate-300 text-transparent hover:border-blue-600'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-blue-900 bg-blue-100 px-1.5 py-0.2 rounded">
                          {mission.scheduled_time}h
                        </span>
                        {mission.priority === 'mandatory' && (
                          <span className="text-[9px] uppercase font-bold text-rose-800 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            Obrigatória
                          </span>
                        )}
                        <span
                          className={`text-xs sm:text-sm font-semibold truncate ${
                            mission.completed ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {mission.title}
                        </span>
                      </div>

                      {mission.clear_instructions && (
                        <p className="text-[11px] text-slate-600 font-medium line-clamp-2">
                          {mission.clear_instructions}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Atalhos Rápidos Práticos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('incidents')}
              className="p-3 bg-white border border-slate-200 hover:border-blue-300 rounded-xl shadow-xs text-left transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-1.5">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-slate-900">Boletim Diário</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Relato de rotina</p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('health')}
              className="p-3 bg-white border border-slate-200 hover:border-blue-300 rounded-xl shadow-xs text-left transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-1.5">
                <Heart className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-slate-900">Sinais Vitais</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">PA, glicemia e sinais</p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('meds')}
              className="p-3 bg-white border border-slate-200 hover:border-blue-300 rounded-xl shadow-xs text-left transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-1.5">
                <Pill className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-slate-900">Medicamentos</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Checklist de remédios</p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('timesheet')}
              className="p-3 bg-white border border-slate-200 hover:border-blue-300 rounded-xl shadow-xs text-left transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-1.5">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-slate-900">Espelho Ponto</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Relatório mensal</p>
            </button>
          </div>
        </div>

        {/* Right Col: Avisos e Mural da Família */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Avisos da Família</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('family')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Ver Mural
              </button>
            </div>

            <div className="space-y-2.5">
              {notices.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">Nenhum aviso no momento.</p>
              ) : (
                notices.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl border text-xs ${
                      n.category === 'shopping'
                        ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                        : 'bg-blue-50/60 border-blue-200 text-blue-900'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span className="truncate">{n.title}</span>
                      <span className="text-[10px] font-semibold opacity-75 shrink-0 ml-2">
                        {n.category === 'shopping' ? 'Compras' : 'Instrução'}
                      </span>
                    </div>
                    <p className="text-[11px] mt-1 text-slate-600 line-clamp-2 leading-relaxed">
                      {n.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card Rápido de Acesso à Aba de Ponto */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-4 text-white shadow-sm space-y-2.5">
            <div className="flex items-center gap-2 text-blue-300">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Aba Reservada</span>
            </div>
            <h4 className="font-bold text-sm text-white">Controle de Check-in e Check-out</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              O registro fotográfico e o horário oficial do plantão estão organizados na aba exclusiva de Ponto.
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab('clock')}
              className="w-full py-2 px-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Abrir Aba de Ponto</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
