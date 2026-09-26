import React, { useState, useEffect } from 'react';
import { CheckSquare, ShieldCheck, Plus, Edit3, Trash2, Clock, Pill, Heart, AlertCircle, CheckCircle2, Lock, User, Info, Calendar, } from "lucide-react";
import { DailyMission, ElderlyProfile, User as UserType, MissionCategory, MissionPriority } from '../types';
import { api } from '../services/api';

interface DailyMissionsAdminViewProps {
 currentUser: UserType;
 elderly: ElderlyProfile;
}

export const DailyMissionsAdminView: React.FC<DailyMissionsAdminViewProps> = ({
 currentUser,
 elderly,
}) => {
 const [missions, setMissions] = useState<DailyMission[]>([]);
 const [isLoading, setIsLoading] = useState(false);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingMission, setEditingMission] = useState<DailyMission null>(null);

 // Form states
 const [title, setTitle] = useState('');
 const [scheduledTime, setScheduledTime] = useState('08:00');
 const [category, setCategory] = useState<MissionCategory>('medication');
 const [priority, setPriority] = useState<MissionPriority>('mandatory');
 const [clearInstructions, setClearInstructions] = useState('');
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' 'error'; text: string } null>(null);

 // Execution notes prompt modal
 const [executingMission, setExecutingMission] = useState<DailyMission null>(null);
 const [executionNote, setExecutionNote] = useState('');

 const isAdmin = currentUser.role === 'admin_geral' currentUser.role === 'admin_family';

 const loadMissions = async () => {
 setIsLoading(true);
 try {
 const data = await api.getDailyMissions();
 setMissions(data);
 } catch (err) {
 console.error(err);
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 loadMissions();
 }, []);

 const handleOpenCreateModal = () => {
 setEditingMission(null);
 setTitle('');
 setScheduledTime('08:00');
 setCategory('medication');
 setPriority('mandatory');
 setClearInstructions('');
 setIsModalOpen(true);
 };

 const handleOpenEditModal = (m: DailyMission) => {
 setEditingMission(m);
 setTitle(m.title);
 setScheduledTime(m.scheduled_time);
 setCategory(m.category);
 setPriority(m.priority);
 setClearInstructions(m.clear_instructions);
 setIsModalOpen(true);
 };

 const handleSaveMission = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!isAdmin) {
 setFeedbackMsg({
 type: 'error',
 text: 'Apenas o Administrador Geral da família pode criar ou alterar missões diárias.',
 });
 return;
 }

 setIsSubmitting(true);
 setFeedbackMsg(null);

 try {
 if (editingMission) {
 await api.updateDailyMission(editingMission.id, {
 title,
 scheduled_time: scheduledTime,
 category,
 priority,
 clear_instructions: clearInstructions,
 user_id: currentUser.id,
 });
 setFeedbackMsg({ type: 'success', text: 'Missão atualizada com sucesso!' });
 } else {
 await api.createDailyMission({
 title,
 scheduled_time: scheduledTime,
 category,
 priority,
 clear_instructions: clearInstructions,
 user_id: currentUser.id,
 });
 setFeedbackMsg({ type: 'success', text: 'Nova missão diária cadastrada no protocolo do cuidador!' });
 }
 setIsModalOpen(false);
 await loadMissions();
 } catch (err: any) {
 setFeedbackMsg({ type: 'error', text: err.message 'Erro ao salvar missão.' });
 } finally {
 setIsSubmitting(false);
 }
 };

 const handleDeleteMission = async (id: string) => {
 if (!isAdmin) return;
 if (!confirm('Deseja realmente remover esta missão do protocolo diário?')) return;
 try {
 await api.deleteDailyMission(id, currentUser.id);
 await loadMissions();
 setFeedbackMsg({ type: 'success', text: 'Missão removida com sucesso.' });
 } catch (err: any) {
 setFeedbackMsg({ type: 'error', text: err.message 'Erro ao excluir.' });
 }
 };

 const handleToggleClick = (m: DailyMission) => {
 if (m.completed) {
 // Reopen
 api.toggleDailyMission(m.id, currentUser.id).then(() => loadMissions());
 } else {
 // Open execution note prompt
 setExecutingMission(m);
 setExecutionNote('');
 }
 };

 const handleConfirmCompletion = async () => {
 if (!executingMission) return;
 try {
 await api.toggleDailyMission(executingMission.id, currentUser.id, executionNote);
 setExecutingMission(null);
 await loadMissions();
 } catch (err) {
 console.error(err);
 }
 };

 const completedCount = missions.filter((m) => m.completed).length;
 const totalCount = missions.length;
 const mandatoryCount = missions.filter((m) => m.priority === 'mandatory').length;
 const mandatoryPending = missions.filter((m) => m.priority === 'mandatory' && !m.completed).length;
 const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

 return (
 <div className="space-y-6">
 {/* Top Banner: Protocol Identity */}
 <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2">
 <span className="text-xl font-extrabold text-blue-900">
 Plano de Missões Diárias & Obrigações do Turno
 </span>
 <span className="text-[10px] uppercase tracking-wider font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
 Protocolo POP
 </span>
 </div>
 <p className="text-xs text-slate-500 mt-1 max-w-2xl">
 Definição clara, concisa e auditável das obrigações diárias de cuidados para{' '}
 <strong>{elderly.full_name}</strong>. Apenas o Administrador Geral pode editar o protocolo.
 </p>
 </div>

 {/* Action Button: Exclusive to Admin */}
 {isAdmin ? (
 <button
 onClick={handleOpenCreateModal}
 className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/25 active:scale-98 transition-all shrink-0"
 >
 <Plus className="w-4 h-4" />
 + Nova Missão Diária (Admin)
 </button>
 ) : (
 <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-600">
 <Lock className="w-3.5 h-3.5 text-slate-500" />
 <span>Modo Execução (Apenas Leitura & Cumprimento)</span>
 </div>
 )}
 </div>

 {/* Feedback Alert */}
 {feedbackMsg && (
 <div
 className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
 feedbackMsg.type === 'success'
 ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
 : 'bg-rose-50 text-rose-900 border border-rose-200'
 }`}
 >
 {feedbackMsg.type === 'success' ? (
 <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
 ) : (
 <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
 )}
 <span>{feedbackMsg.text}</span>
 </div>
 )}
 </div>

 {/* Metrics Bar */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
 <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
 <span className="text-slate-500 block">Total de Missões</span>
 <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">
 {totalCount} missões
 </span>
 </div>

 <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
 <span className="text-slate-500 block">Missões Concluídas</span>
 <span className="text-xl font-bold text-emerald-700 font-mono mt-0.5 block">
 {completedCount} de {totalCount} ({progressPercent}%)
 </span>
 </div>

 <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
 <span className="text-slate-500 block">Obrigações Inegociáveis</span>
 <span className="text-xl font-bold text-rose-700 font-mono mt-0.5 block">
 {mandatoryPending > 0 ? `${mandatoryPending} pendente(s)` : 'Todas cumpridas!'}
 </span>
 </div>

 <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
 <span className="text-slate-500 block">Autoridade Médica</span>
 <span className="text-xs font-bold text-blue-900 mt-0.5 flex items-center gap-1">
 <ShieldCheck className="w-4 h-4 text-blue-600" />
 Dr. Fernando Silveira
 </span>
 </div>
 </div>

 {/* List of Missions */}
 <div className="space-y-3">
 {missions.map((mission) => {
 const isMandatory = mission.priority === 'mandatory';
 const isUrgent = mission.priority === 'urgent';

 return (
 <div
 key={mission.id}
 className={`bg-white border rounded-2xl p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 ${
 mission.completed
 ? 'border-emerald-200 bg-emerald-50/20'
 : isMandatory
 ? 'border-blue-300 ring-1 ring-blue-100'
 : 'border-slate-200 hover:border-blue-200'
 }`}
 >
 {/* Left Details */}
 <div className="flex items-start gap-3.5 flex-1">
 {/* Checkbox */}
 <button
 type="button"
 onClick={() => handleToggleClick(mission)}
 title={mission.completed ? 'Marcar como não concluída' : 'Cumprir esta missão'}
 className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${
 mission.completed
 ? 'bg-emerald-600 text-white shadow-xs'
 : 'border-2 border-slate-300 text-transparent hover:border-blue-600'
 }`}
 >
 <CheckCircle2 className="w-4 h-4" />
 </button>

 <div className="space-y-2 flex-1">
 {/* Badge Bar */}
 <div className="flex flex-wrap items-center gap-2">
 <span className="font-mono text-xs font-bold bg-blue-900 text-white px-2 py-0.5 rounded">
 {mission.scheduled_time}h
 </span>

 <span
 className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border ${
 isMandatory
 ? 'bg-rose-50 text-rose-800 border-rose-200'
 : isUrgent
 ? 'bg-amber-50 text-amber-800 border-amber-200'
 : 'bg-slate-100 text-slate-700 border-slate-200'
 }`}
 >
 {isMandatory ? 'Obrigação Inegociável' : isUrgent ? 'Atenção Médica' : 'Rotina'}
 </span>

 <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
 {mission.category === 'medication' && 'Remédio'}
 {mission.category === 'vitals' && 'Sinais Vitais'}
 {mission.category === 'meals' && 'Alimentação'}
 {mission.category === 'hygiene' && 'Higiene & Banho'}
 {mission.category === 'activity' && 'Exercício / Fisioterapia'}
 {mission.category === 'special' && 'Cuidado Especial'}
 </span>
 </div>

 {/* Title */}
 <h3
 className={`font-bold text-base ${
 mission.completed ? 'line-through text-slate-500' : 'text-slate-900'
 }`}
 >
 {mission.title}
 </h3>

 {/* Clear and Concise Instruction Box (The core feature) */}
 <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
 <div className="flex items-center gap-1.5 text-blue-900 font-bold mb-1">
 <Info className="w-3.5 h-3.5 text-blue-600" />
 <span>Instrução Clara do Administrador:</span>
 </div>
 <p className="text-slate-700 leading-relaxed font-medium">
 "{mission.clear_instructions}"
 </p>
 </div>

 {/* Audit Trail Stamp if Completed */}
 {mission.completed && (
 <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-2 pt-1 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200">
 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
 <span>
 Missão cumprida às <strong>{mission.completed_at}</strong> por{' '}
 <strong>{mission.completed_by_name 'Cuidadora'}</strong>.
 {mission.execution_notes && (
 <span className="italic ml-1">Obs: "{mission.execution_notes}"</span>
 )}
 </span>
 </div>
 )}
 </div>
 </div>

 {/* Admin Actions (Edit/Delete) */}
 {isAdmin && (
 <div className="flex items-center gap-1.5 self-end md:self-start shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
 <button
 onClick={() => handleOpenEditModal(mission)}
 className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-semibold flex items-center gap-1"
 title="Editar instruções da missão"
 >
 <Edit3 className="w-4 h-4" />
 <span className="hidden sm:inline">Editar</span>
 </button>
 <button
 onClick={() => handleDeleteMission(mission.id)}
 className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1"
 title="Excluir missão"
 >
 <Trash2 className="w-4 h-4" />
 <span className="hidden sm:inline">Excluir</span>
 </button>
 </div>
 )}
 </div>
 );
 })}
 </div>

 {/* Modal: Create or Edit Mission (Admin Only) */}
 {isModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
 <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
 <div className="bg-blue-900 text-white p-4 flex items-center justify-between">
 <div>
 <div className="flex items-center gap-2">
 <ShieldCheck className="w-5 h-5 text-blue-300" />
 <h3 className="font-bold text-base">
 {editingMission ? 'Editar Missão Diária' : 'Nova Missão / Obrigação Diária'}
 </h3>
 </div>
 <p className="text-xs text-blue-200 mt-0.5">
 Exclusivo do Administrador Geral: prescreva regras claras para o cuidador
 </p>
 </div>
 <button
 onClick={() => setIsModalOpen(false)}
 className="text-blue-200 hover:text-white text-xs font-bold"
 >
 Fechar
 </button>
 </div>

 <form onSubmit={handleSaveMission} className="p-5 space-y-4 overflow-y-auto">
 {/* Title */}
 <div>
 <label className="block text-xs font-bold text-slate-700 mb-1">
 Título da Missão (Ex: Nome do remédio ou procedimento)
 </label>
 <input
 type="text"
 required
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="Ex: Ministrar Losartana Potássica 50mg"
 className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-semibold focus:outline-blue-600"
 />
 </div>

 {/* Time & Category */}
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Horário Programado
 </label>
 <input
 type="time"
 required
 value={scheduledTime}
 onChange={(e) => setScheduledTime(e.target.value)}
 className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-blue-600"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Categoria do Cuidado
 </label>
 <select
 value={category}
 onChange={(e: any) => setCategory(e.target.value)}
 className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-blue-600"
 >
 <option value="medication">Medicamento / Remédio</option>
 <option value="vitals">Sinais Vitais (Pressão, Glicemia)</option>
 <option value="meals">Alimentação & Dieta</option>
 <option value="hygiene">Higiene Pessoal & Banho</option>
 <option value="activity">Fisioterapia / Exercício</option>
 <option value="special">Cuidado Especial</option>
 </select>
 </div>
 </div>

 {/* Priority */}
 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Nível de Exigência / Prioridade
 </label>
 <select
 value={priority}
 onChange={(e: any) => setPriority(e.target.value)}
 className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-blue-600"
 >
 <option value="mandatory">Obrigação Inegociável (Alerta vermelho se não cumprida)</option>
 <option value="urgent">Atenção Especial / Específica</option>
 <option value="routine">Rotina Padrão Diária</option>
 </select>
 </div>

 {/* Clear and concise instructions (Crucial feature) */}
 <div>
 <label className="block text-xs font-bold text-blue-900 mb-1">
 Instrução Clara e Concisa para o Cuidador
 </label>
 <textarea
 rows={3}
 required
 value={clearInstructions}
 onChange={(e) => setClearInstructions(e.target.value)}
 placeholder="Ex: Dar 1 comprimido com água mineral em jejum. Não triturar. Se a pressão passar de 140/90, notificar imediatamente no mural."
 className="w-full border-2 border-blue-200 rounded-lg p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none bg-blue-50/20"
 />
 <p className="text-[11px] text-slate-500 mt-1">
 Seja específico: descreva a dosagem, a forma de administrar e o que o cuidador deve observar.
 </p>
 </div>

 {/* Actions */}
 <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
 <button
 type="button"
 onClick={() => setIsModalOpen(false)}
 className="py-2.5 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
 >
 Cancelar
 </button>
 <button
 type="submit"
 disabled={isSubmitting}
 className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25"
 >
 {isSubmitting ? 'Salvando...' : editingMission ? 'Atualizar Missão' : 'Criar Missão'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* Modal: Execution Note Prompt (When Caregiver Marks as Completed) */}
 {executingMission && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
 <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
 <div>
 <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
 <CheckCircle2 className="w-5 h-5" />
 <span>Confirmar Cumprimento da Missão</span>
 </div>
 <h4 className="font-bold text-base text-slate-900 mt-1">
 {executingMission.title} ({executingMission.scheduled_time}h)
 </h4>
 <p className="text-xs text-slate-500 mt-0.5 italic">
 "{executingMission.clear_instructions}"
 </p>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Observação de Execução (Opcional)
 </label>
 <textarea
 rows={2}
 value={executionNote}
 onChange={(e) => setExecutionNote(e.target.value)}
 placeholder="Ex: Ingeriu sem queixas; tolerou bem o banho; PA aferida 120/80 mmHg..."
 className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-blue-600"
 />
 </div>

 <div className="flex items-center justify-end gap-2 pt-2">
 <button
 onClick={() => setExecutingMission(null)}
 className="py-2 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
 >
 Cancelar
 </button>
 <button
 onClick={handleConfirmCompletion}
 className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
 >
 Confirmar Missão Cumprida
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};
