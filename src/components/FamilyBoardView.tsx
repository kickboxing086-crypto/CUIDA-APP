import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  ShoppingCart,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Clock,
  UserCheck,
  Stethoscope,
  Users,
  Edit2
} from 'lucide-react';
import { FamilyNotice, User, ShiftSchedule } from '../types';
import { api } from '../services/api';
import { AnimatedSegmentedControl, AnimatedSelect } from './AnimatedChoiceSelect';
import { FamilyShiftScheduleModal } from './FamilyShiftScheduleModal';

interface FamilyBoardViewProps {
  currentUser: User;
  users?: User[];
}

export const FamilyBoardView: React.FC<FamilyBoardViewProps> = ({ currentUser, users = [] }) => {
  const [notices, setNotices] = useState<FamilyNotice[]>([]);
  const [schedules, setSchedules] = useState<ShiftSchedule[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'shopping' | 'schedule'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // New notice form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'shopping' | 'medical' | 'routine'>('shopping');

  const canManageSchedule =
    currentUser.role === 'admin_geral' || currentUser.role === 'admin_family' || currentUser.roles?.includes('admin_family');

  const loadData = async () => {
    try {
      const [noticesData, schedulesData] = await Promise.all([
        api.getNotices(),
        api.getShiftSchedules(currentUser.family_id || undefined),
      ]);
      setNotices(noticesData);
      setSchedules(schedulesData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.family_id]);

  const handleToggleNotice = async (id: string) => {
    try {
      await api.toggleNotice(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    try {
      await api.createNotice({
        title,
        description,
        category,
        created_by_user_id: currentUser.id,
      });
      setTitle('');
      setDescription('');
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const unresolvedShoppingCount = notices.filter(
    (n) => n.category === 'shopping' && !n.is_resolved
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Mural Familiar & Escala de Cuidados</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Comunicação transparente entre cuidadores e família: escala oficial de plantões, insumos e recados
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canManageSchedule && (
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="inline-flex items-center gap-2 py-2.5 px-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-xs transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Gerenciar Escala da Família</span>
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs active:scale-98 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Publicar no Mural</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Itens em Falta (Compras)</span>
            <ShoppingCart className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {unresolvedShoppingCount} pendentes
          </div>
          <p className="text-xs text-slate-500 mt-1">Fraldas, luvas e insumos</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Plantões Escalados</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{schedules.length} na semana</div>
          <p className="text-xs text-slate-500 mt-1">Escala vinculada ao Check-in oficial</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Mural de Avisos</span>
            <MessageSquare className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{notices.length} recados</div>
          <p className="text-xs text-slate-500 mt-1">Comunicação direta com a família</p>
        </div>
      </div>

      {/* Tabs / Filter Bar - Animated Segmented Control */}
      <div>
        <AnimatedSegmentedControl
          value={activeTab}
          onChange={(val) => setActiveTab(val as 'all' | 'shopping' | 'schedule')}
          layoutId="familyBoardTabs"
          options={[
            { value: 'all', label: `Todos os Recados (${notices.length})` },
            { value: 'shopping', label: `Insumos & Compras (${unresolvedShoppingCount})` },
            { value: 'schedule', label: `Escala Oficial de Plantões (${schedules.length})` },
          ]}
        />
      </div>

      {/* Content Area */}
      {activeTab === 'schedule' ? (
        /* Schedule View */
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Escala Semanal de Plantão da Família
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                O Check-in só é liberado para o membro no dia e horário escalado pelo Administrador Geral
              </p>
            </div>

            {canManageSchedule && (
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(true)}
                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar / Editar Plantões</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {schedules.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Nenhum plantão cadastrado na escala.
              </div>
            ) : (
              schedules.map((sc) => (
                <div
                  key={sc.id}
                  className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900">{sc.user_name}</h4>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                          {sc.day_label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Horário de Plantão: <strong>{sc.start_time}h às {sc.end_time}h</strong> {sc.notes && ` · ${sc.notes}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Check-in Vinculado
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Notices / Shopping View */
        <div className="space-y-3">
          {notices
            .filter((n) => (activeTab === 'shopping' ? n.category === 'shopping' : true))
            .map((notice) => (
              <div
                key={notice.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  notice.is_resolved
                    ? 'border-slate-200 bg-slate-50/50 opacity-75'
                    : 'border-blue-200 bg-white'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                        notice.category === 'shopping'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : notice.category === 'medical'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      {notice.category === 'shopping'
                        ? 'Lista de Compras'
                        : notice.category === 'medical'
                        ? 'Médico / Saúde'
                        : 'Rotina'}
                    </span>
                    <h3 className={`font-bold text-base ${notice.is_resolved ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {notice.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    {notice.description}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                    <span>
                      Publicado por <strong>{notice.created_by_name}</strong>
                    </span>
                    <span>·</span>
                    <span>{new Date(notice.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <div className="self-end md:self-center">
                  <button
                    onClick={() => handleToggleNotice(notice.id)}
                    className={`inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      notice.is_resolved
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {notice.is_resolved ? 'Reabrir Recado' : 'Marcar como Comprado / Resolvido'}
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* New Notice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-blue-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Adicionar Recado ou Item em Falta</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-blue-200 hover:text-white text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="p-5 space-y-4">
              <div>
                <AnimatedSelect
                  label="Categoria *"
                  value={category}
                  onChange={(val) => setCategory(val as 'shopping' | 'medical' | 'routine')}
                  options={[
                    { value: 'shopping', label: 'Insumos & Compras (Remédios, fraldas em falta)' },
                    { value: 'medical', label: 'Saúde & Especialistas (Médicos, fisioterapia)' },
                    { value: 'routine', label: 'Rotina Geral da Casa' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título do Aviso
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Fraldas Geriátricas G quase acabando"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição detalhada
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Restam apenas 5 unidades. Trazer no sábado pela manhã..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-3 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm cursor-pointer"
                >
                  Publicar no Mural
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Family Shift Schedule Modal */}
      <FamilyShiftScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        currentUser={currentUser}
        users={users}
        onScheduleUpdated={loadData}
      />
    </div>
  );
};
