import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  X,
  Users,
  Shield,
  Info
} from 'lucide-react';
import { ShiftSchedule, User } from '../types';
import { api } from '../services/api';

interface FamilyShiftScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  onScheduleUpdated?: () => void;
}

const DAYS_OF_WEEK = [
  { num: 1, label: 'Segunda-feira', short: 'Seg' },
  { num: 2, label: 'Terça-feira', short: 'Ter' },
  { num: 3, label: 'Quarta-feira', short: 'Qua' },
  { num: 4, label: 'Quinta-feira', short: 'Qui' },
  { num: 5, label: 'Sexta-feira', short: 'Sex' },
  { num: 6, label: 'Sábado', short: 'Sáb' },
  { num: 0, label: 'Domingo', short: 'Dom' },
];

export const FamilyShiftScheduleModal: React.FC<FamilyShiftScheduleModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onScheduleUpdated,
}) => {
  const [schedules, setSchedules] = useState<ShiftSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const [selectedDayNum, setSelectedDayNum] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('20:00');
  const [toleranceMinutes, setToleranceMinutes] = useState<number>(60);
  const [notes, setNotes] = useState<string>('');

  const isMasterAdmin = currentUser.role === 'admin_geral';
  const isFamilyAdmin = currentUser.role === 'admin_family' || currentUser.roles?.includes('admin_family');
  const canManage = isMasterAdmin || isFamilyAdmin;

  const familyUsers = users.filter((u) => {
    if (isMasterAdmin) return true;
    return u.family_id === currentUser.family_id || !u.family_id;
  });

  const loadSchedules = async () => {
    setIsLoading(true);
    try {
      const data = await api.getShiftSchedules(currentUser.family_id || undefined);
      setSchedules(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSchedules();
      setStatusMessage(null);
    }
  }, [isOpen, currentUser.family_id]);

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    setEditingScheduleId(null);
    setSelectedUserId(currentUser.id);
    setSelectedDayNum(1);
    setStartTime('08:00');
    setEndTime('20:00');
    setToleranceMinutes(60);
    setNotes('Plantão Diurno Regular');
    setStatusMessage(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (schedule: ShiftSchedule) => {
    setEditingScheduleId(schedule.id);
    setSelectedUserId(schedule.user_id);
    setSelectedDayNum(schedule.day_of_week_number);
    setStartTime(schedule.start_time || '08:00');
    setEndTime(schedule.end_time || '20:00');
    setToleranceMinutes(schedule.tolerance_minutes || 60);
    setNotes(schedule.notes || '');
    setStatusMessage(null);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsSubmitting(true);

    const targetUser = familyUsers.find((u) => u.id === selectedUserId) || currentUser;
    const dayObj = DAYS_OF_WEEK.find((d) => d.num === Number(selectedDayNum)) || DAYS_OF_WEEK[0];

    try {
      if (editingScheduleId) {
        await api.updateShiftSchedule(editingScheduleId, {
          user_id: targetUser.id,
          user_name: targetUser.name,
          user_role: targetUser.role,
          day_of_week_number: dayObj.num,
          day_label: dayObj.label,
          start_time: startTime,
          end_time: endTime,
          tolerance_minutes: toleranceMinutes,
          notes,
        });
        setStatusMessage({ type: 'success', text: `Escala de ${targetUser.name} atualizada com sucesso!` });
      } else {
        await api.createShiftSchedule({
          family_id: currentUser.family_id || 'fam-01',
          user_id: targetUser.id,
          user_name: targetUser.name,
          user_role: targetUser.role,
          day_of_week_number: dayObj.num,
          day_label: dayObj.label,
          start_time: startTime,
          end_time: endTime,
          tolerance_minutes: toleranceMinutes,
          notes,
          created_by_user_id: currentUser.id,
          created_by_name: currentUser.name,
        });
        setStatusMessage({ type: 'success', text: `Escala de ${targetUser.name} para ${dayObj.label} criada com sucesso!` });
      }

      setIsFormOpen(false);
      await loadSchedules();
      if (onScheduleUpdated) onScheduleUpdated();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Erro ao salvar escala.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (scheduleId: string, userName: string) => {
    if (!confirm(`Deseja remover o plantão escalado de ${userName}?`)) return;
    try {
      await api.deleteShiftSchedule(scheduleId);
      setStatusMessage({ type: 'success', text: `Plantão de ${userName} removido com sucesso.` });
      await loadSchedules();
      if (onScheduleUpdated) onScheduleUpdated();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Erro ao remover escala.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Escala de Plantão da Família</h3>
              <p className="text-xs text-blue-200">
                Definição oficial dos dias e horários de plantão para liberação do Check-in
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Regra de Negócio Explicativa */}
          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Como funciona a validação de Check-in:</strong>
              <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                O Administrador Familiar pode escalar qualquer membro (inclusive a si próprio). O Check-in do cuidador ou familiar 
                só será liberado <strong>no dia e no horário escalado</strong>, dentro do raio de distância da residência.
              </p>
            </div>
          </div>

          {/* Form Modal / Inline Form */}
          {isFormOpen && (
            <form onSubmit={handleSave} className="p-4 bg-slate-50 border border-blue-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  {editingScheduleId ? 'Editar Plantão da Escala' : 'Escalar Novo Plantão'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Membro da Família / Cuidador */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pessoa Escalada (Cuidador ou Familiar)
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {familyUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role === 'admin_family' || u.role === 'admin_geral' ? 'Administrador' : 'Cuidador / Familiar'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dia da Semana */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dia da Semana do Plantão
                  </label>
                  <select
                    value={selectedDayNum}
                    onChange={(e) => setSelectedDayNum(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.num} value={d.num}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Horário de Início */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Horário de Início (Ex: 08:00)
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Horário de Término */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Horário de Saída (Ex: 20:00)
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Tolerância de Antecedência */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tolerância de Check-in
                  </label>
                  <select
                    value={toleranceMinutes}
                    onChange={(e) => setToleranceMinutes(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={15}>15 minutos antes</option>
                    <option value={30}>30 minutos antes</option>
                    <option value={60}>60 minutos antes (Padrão)</option>
                    <option value={120}>2 horas antes</option>
                  </select>
                </div>

                {/* Observações / Descrição */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Descrição do Plantão (Opcional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Plantão diurno, Visita médica, etc."
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Salvando...' : editingScheduleId ? 'Salvar Alterações' : 'Confirmar Escala'}
                </button>
              </div>
            </form>
          )}

          {/* Action to Open Create Form */}
          {canManage && !isFormOpen && (
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">
                Plantões Agendados na Semana ({schedules.length})
              </span>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Escalar Membro / Plantão</span>
              </button>
            </div>
          )}

          {/* Schedule List by Days */}
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Carregando escalas da família...
            </div>
          ) : schedules.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-medium text-slate-600">
                Nenhum plantão escalado no momento.
              </p>
              {canManage && (
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Criar primeiro plantão da família
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day) => {
                const daySchedules = schedules.filter((s) => s.day_of_week_number === day.num);
                if (daySchedules.length === 0) return null;

                return (
                  <div key={day.num} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div className="px-3.5 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        {day.label}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {daySchedules.length} {daySchedules.length === 1 ? 'plantonista' : 'plantonistas'}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {daySchedules.map((sc) => {
                        const isSelf = sc.user_id === currentUser.id;
                        return (
                          <div
                            key={sc.id}
                            className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/70 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 font-extrabold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                                {sc.user_name?.slice(0, 2).toUpperCase() || 'PL'}
                              </div>

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="font-bold text-xs text-slate-900">{sc.user_name}</h5>
                                  {isSelf && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      Você
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-mono">
                                    {sc.start_time}h às {sc.end_time}h
                                  </span>
                                </div>

                                {sc.notes && (
                                  <p className="text-[11px] text-slate-500 mt-0.5">{sc.notes}</p>
                                )}
                              </div>
                            </div>

                            {/* Actions for Admin */}
                            {canManage && (
                              <div className="flex items-center gap-1.5 self-end sm:self-center">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(sc)}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Editar plantão"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(sc.id, sc.user_name)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Remover da escala"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Escala vinculada ao controle de ponto com verificação de raio GPS
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
