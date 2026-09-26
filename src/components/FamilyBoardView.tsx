import React, { useState, useEffect } from 'react';
import { MessageSquare, ShoppingCart, Calendar, CheckCircle2, AlertCircle, Plus, Clock, UserCheck, Stethoscope, } from "lucide-react";
import { FamilyNotice, User } from '../types';
import { api } from '../services/api';

interface FamilyBoardViewProps {
 currentUser: User;
}

export const FamilyBoardView: React.FC<FamilyBoardViewProps> = ({ currentUser }) => {
 const [notices, setNotices] = useState<FamilyNotice[]>([]);
 const [activeTab, setActiveTab] = useState<'all' 'shopping' 'schedule'>('all');
 const [isModalOpen, setIsModalOpen] = useState(false);

 // New notice form
 const [title, setTitle] = useState('');
 const [description, setDescription] = useState('');
 const [category, setCategory] = useState<'shopping' 'medical' 'routine'>('shopping');

 // Static mock schedule for shifts & specialist visits
 const [schedules] = useState([
 {
 id: 'sc-1',
 title: 'Plantão Cuidadora Diurno (12h)',
 responsible: 'Clara Mendes',
 role: 'Cuidadora Titular',
 date: 'Hoje (Quinta-feira)',
 time: '07:00 às 19:00',
 status: 'Em andamento',
 type: 'shift',
 },
 {
 id: 'sc-2',
 title: 'Sessão de Fisioterapia Motora & Respiratória',
 responsible: 'Dr. André Fonseca',
 role: 'Fisioterapeuta Gerontológico',
 date: 'Hoje',
 time: '15:30 às 16:30',
 status: 'Confirmado',
 type: 'medical',
 },
 {
 id: 'sc-3',
 title: 'Visita Familiar de Final de Semana',
 responsible: 'Dra. Patrícia Silveira (Filha)',
 role: 'Família',
 date: 'Sábado, 26 de Setembro',
 time: '14:00 às 18:00',
 status: 'Programado',
 type: 'family',
 },
 {
 id: 'sc-4',
 title: 'Consulta de Retorno com Cardiologista',
 responsible: 'Dra. Beatriz Campos (Clínica Santa Maria)',
 role: 'Médica Especialista',
 date: 'Terça, 29 de Setembro',
 time: '10:00',
 status: 'Agendado',
 type: 'medical',
 },
 ]);

 const loadNotices = async () => {
 try {
 const data = await api.getNotices();
 setNotices(data);
 } catch (err) {
 console.error(err);
 }
 };

 useEffect(() => {
 loadNotices();
 }, []);

 const handleToggleNotice = async (id: string) => {
 try {
 await api.toggleNotice(id);
 await loadNotices();
 } catch (err) {
 console.error(err);
 }
 };

 const handleCreateNotice = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!title !description) return;
 try {
 await api.createNotice({
 title,
 description,
 category,
 userId: currentUser.id,
 });
 setTitle('');
 setDescription('');
 setIsModalOpen(false);
 await loadNotices();
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
 Comunicação transparente entre cuidadores e família: insumos em falta, visitas e recados
 </p>
 </div>

 <button
 onClick={() => setIsModalOpen(true)}
 className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm shadow-blue-500/20 active:scale-98 transition-all"
 >
 <Plus className="w-4 h-4" />
 Publicar no Mural
 </button>
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
 <span className="text-xs font-semibold">Visitas & Consultas na Semana</span>
 <Calendar className="w-4 h-4 text-emerald-600" />
 </div>
 <div className="text-2xl font-extrabold text-slate-900 font-mono">3 agendadas</div>
 <p className="text-xs text-slate-500 mt-1">Fisioterapia, família e geriatra</p>
 </div>

 <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
 <div className="flex items-center justify-between text-slate-500 mb-2">
 <span className="text-xs font-semibold">Cuidadora de Plantão</span>
 <UserCheck className="w-4 h-4 text-blue-700" />
 </div>
 <div className="text-base font-bold text-slate-900 truncate">Clara Mendes</div>
 <p className="text-xs text-emerald-600 font-medium mt-1">Turno ativo presencial</p>
 </div>
 </div>

 {/* Tabs / Filter Bar */}
 <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
 <button
 onClick={() => setActiveTab('all')}
 className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
 activeTab === 'all'
 ? 'bg-white text-blue-900 shadow-xs'
 : 'text-slate-600 hover:text-slate-900'
 }`}
 >
 Todos os Recados ({notices.length})
 </button>
 <button
 onClick={() => setActiveTab('shopping')}
 className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
 activeTab === 'shopping'
 ? 'bg-white text-blue-900 shadow-xs'
 : 'text-slate-600 hover:text-slate-900'
 }`}
 >
 Insumos & Compras ({unresolvedShoppingCount})
 </button>
 <button
 onClick={() => setActiveTab('schedule')}
 className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
 activeTab === 'schedule'
 ? 'bg-white text-blue-900 shadow-xs'
 : 'text-slate-600 hover:text-slate-900'
 }`}
 >
 Escala de Visitas & Plantões
 </button>
 </div>

 {/* Content Area */}
 {activeTab === 'schedule' ? (
 /* Schedule View */
 <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
 <h3 className="text-base font-bold text-slate-900">
 Escala Semanal e Agendamento de Cuidados
 </h3>
 <div className="space-y-3">
 {schedules.map((sc) => (
 <div
 key={sc.id}
 className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-blue-200 transition-colors"
 >
 <div className="flex items-start gap-3">
 <div
 className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
 sc.type === 'medical'
 ? 'bg-blue-50 text-blue-700 border-blue-200'
 : 'bg-emerald-50 text-emerald-700 border-emerald-200'
 }`}
 >
 {sc.type === 'medical' ? (
 <Stethoscope className="w-5 h-5" />
 ) : (
 <Clock className="w-5 h-5" />
 )}
 </div>
 <div>
 <h4 className="font-bold text-sm text-slate-900">{sc.title}</h4>
 <p className="text-xs text-slate-500">
 Responsável: <strong>{sc.responsible}</strong> · {sc.role}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-3 self-end md:self-center">
 <div className="text-right">
 <div className="text-xs font-semibold text-slate-800">{sc.date}</div>
 <div className="text-[11px] text-slate-500 font-mono">{sc.time}</div>
 </div>
 <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
 {sc.status}
 </span>
 </div>
 </div>
 ))}
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
 <span>Publicado por <strong>{notice.created_by_name}</strong></span>
 <span>·</span>
 <span>{new Date(notice.created_at).toLocaleDateString('pt-BR')}</span>
 </div>
 </div>

 <div className="self-end md:self-center">
 <button
 onClick={() => handleToggleNotice(notice.id)}
 className={`inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition-all ${
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
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
 <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
 <div className="bg-blue-900 text-white p-4 flex items-center justify-between">
 <h3 className="font-bold text-base">Adicionar Recado ou Item em Falta</h3>
 <button
 onClick={() => setIsModalOpen(false)}
 className="text-blue-200 hover:text-white text-xs font-bold"
 >
 Fechar
 </button>
 </div>

 <form onSubmit={handleCreateNotice} className="p-5 space-y-4">
 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Categoria
 </label>
 <select
 value={category}
 onChange={(e: any) => setCategory(e.target.value)}
 className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white"
 >
 <option value="shopping">Insumos & Compras (Remédios, fraldas em falta)</option>
 <option value="medical">Saúde & Especialistas (Médicos, fisioterapia)</option>
 <option value="routine">Rotina Geral da Casa</option>
 </select>
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
 className="py-2 px-3 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="py-2 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm"
 >
 Publicar no Mural
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
};
