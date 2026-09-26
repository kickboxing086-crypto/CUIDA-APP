import React, { useState, useEffect } from 'react';
import { Heart, Activity, Thermometer, Scale, Plus, AlertCircle, CheckCircle2, Calendar, User as UserIcon, ShieldCheck, FileCheck, Edit3, RotateCcw, } from "lucide-react";
import { HealthLog, User } from '../types';
import { api } from '../services/api';

interface HealthLogsViewProps {
 currentUser: User;
}

export const HealthLogsView: React.FC<HealthLogsViewProps> = ({ currentUser }) => {
 const [logs, setLogs] = useState<HealthLog[]>([]);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingLog, setEditingLog] = useState<HealthLog null>(null);
 const [isSubmitting, setIsSubmitting] = useState(false);

 // Form states: ALL START BLANK/EMPTY as requested by user!
 const [systolic, setSystolic] = useState<string>('');
 const [diastolic, setDiastolic] = useState<string>('');
 const [heartRate, setHeartRate] = useState<string>('');
 const [glucose, setGlucose] = useState<string>('');
 const [glucoseContext, setGlucoseContext] = useState<string>('Jejum matinal');
 const [temperature, setTemperature] = useState<string>('');
 const [weight, setWeight] = useState<string>('');
 const [notes, setNotes] = useState<string>('');
 const [contractorSigned, setContractorSigned] = useState<boolean>(true);

 const loadLogs = async () => {
 try {
 const data = await api.getHealthLogs();
 setLogs(data);
 } catch (err) {
 console.error(err);
 }
 };

 useEffect(() => {
 loadLogs();
 }, []);

 const calculateBPStatus = (sysNum?: number null, diaNum?: number null) => {
 if (!sysNum !diaNum) {
 return {
 label: 'Pressão Não Aferida (Opcional)',
 color: 'text-slate-600 bg-slate-100 border-slate-200',
 alert: false,
 };
 }

 const sys = Number(sysNum);
 const dia = Number(diaNum);

 if (sys >= 180 dia >= 120) {
 return {
 label: 'Crise Hipertensiva (Alerta Médico)',
 color: 'text-rose-700 bg-rose-50 border-rose-200',
 alert: true,
 };
 }
 if (sys >= 140 dia >= 90) {
 return {
 label: 'Hipertensão Estágio 2',
 color: 'text-amber-800 bg-amber-50 border-amber-200',
 alert: true,
 };
 }
 if (sys >= 130 dia >= 80) {
 return {
 label: 'Hipertensão Estágio 1',
 color: 'text-yellow-800 bg-yellow-50 border-yellow-200',
 alert: false,
 };
 }
 if (sys >= 120 && dia < 80) {
 return {
 label: 'Pré-hipertensão (Atenção)',
 color: 'text-blue-800 bg-blue-50 border-blue-200',
 alert: false,
 };
 }
 if (sys < 90 dia < 60) {
 return {
 label: 'Hipotensão (Pressão Baixa)',
 color: 'text-indigo-800 bg-indigo-50 border-indigo-200',
 alert: true,
 };
 }
 return {
 label: 'Pressão Normal / Ótima',
 color: 'text-emerald-800 bg-emerald-50 border-emerald-200',
 alert: false,
 };
 };

 const handleOpenModal = () => {
 setEditingLog(null);
 // Leave all fields blank by default!
 setSystolic('');
 setDiastolic('');
 setHeartRate('');
 setGlucose('');
 setTemperature('');
 setWeight('');
 setNotes('');
 setContractorSigned(true);
 setIsModalOpen(true);
 };

 const handleOpenEditModal = (log: HealthLog) => {
 setEditingLog(log);
 // Allow keeping values or clearing to blank
 setSystolic(log.systolic_bp ? String(log.systolic_bp) : '');
 setDiastolic(log.diastolic_bp ? String(log.diastolic_bp) : '');
 setHeartRate(log.heart_rate ? String(log.heart_rate) : '');
 setGlucose(log.glucose ? String(log.glucose) : '');
 setGlucoseContext(log.glucose_context 'Jejum matinal');
 setTemperature(log.temperature_c ? String(log.temperature_c) : '');
 setWeight(log.weight_kg ? String(log.weight_kg) : '');
 setNotes(log.notes '');
 setContractorSigned(log.contractor_signed ?? true);
 setIsModalOpen(true);
 };

 const handleSetTypicalValues = () => {
 setSystolic('120');
 setDiastolic('80');
 setHeartRate('72');
 };

 const handleClearBP = () => {
 setSystolic('');
 setDiastolic('');
 setHeartRate('');
 };

 const handleClearAllVitals = () => {
 setSystolic('');
 setDiastolic('');
 setHeartRate('');
 setGlucose('');
 setTemperature('');
 setWeight('');
 };

 const handleSaveLog = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsSubmitting(true);
 try {
 if (editingLog) {
 await api.updateHealthLog(editingLog.id, {
 systolic_bp: systolic ? parseFloat(systolic) : null,
 diastolic_bp: diastolic ? parseFloat(diastolic) : null,
 heart_rate: heartRate ? parseFloat(heartRate) : null,
 glucose: glucose ? parseFloat(glucose) : null,
 glucose_context: glucoseContext,
 temperature_c: temperature ? parseFloat(temperature) : null,
 weight_kg: weight ? parseFloat(weight) : null,
 notes: notes (systolic ? 'Aferição editada.' : 'Registro atualizado (sem aferição de PA).'),
 contractor_signed: contractorSigned,
 caregiver_signed: true,
 });
 } else {
 await api.createHealthLog({
 systolic_bp: systolic ? parseFloat(systolic) : null,
 diastolic_bp: diastolic ? parseFloat(diastolic) : null,
 heart_rate: heartRate ? parseFloat(heartRate) : null,
 glucose: glucose ? parseFloat(glucose) : null,
 glucose_context: glucoseContext,
 temperature_c: temperature ? parseFloat(temperature) : null,
 weight_kg: weight ? parseFloat(weight) : null,
 notes: notes (systolic ? 'Aferição registrada.' : 'Registro de rotina sem aferição de PA.'),
 recorded_by_user_id: currentUser.id,
 contractor_signed: contractorSigned,
 caregiver_signed: true,
 });
 }
 await loadLogs();
 setIsModalOpen(false);
 } catch (err) {
 console.error(err);
 } finally {
 setIsSubmitting(false);
 }
 };

 const latestLog = logs[0];
 const liveBPStatus = calculateBPStatus(
 systolic ? Number(systolic) : null,
 diastolic ? Number(diastolic) : null
 );

 return (
 <div className="space-y-6">
 {/* Top Bar with Action Button */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h2 className="text-xl font-bold text-slate-900">Diário de Sinais Vitais & Saúde</h2>
 <p className="text-xs text-slate-500 mt-0.5">
 Aferição de pressão arterial, glicose e temperatura — campos opcionais conforme necessidade,
 com assinatura diária obrigatória por ordem do contratante.
 </p>
 </div>
 <button
 onClick={handleOpenModal}
 className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm shadow-blue-500/20 active:scale-98 transition-all"
 >
 <Plus className="w-4 h-4" />
 Registrar Sinais Vitais
 </button>
 </div>

 {/* Overview Cards */}
 {latestLog && (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {/* Card 1: Blood Pressure */}
 <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
 <div className="flex items-center justify-between text-slate-500 mb-2">
 <span className="text-xs font-semibold">Pressão Arterial</span>
 <Heart className="w-4 h-4 text-rose-500" />
 </div>
 <div className="flex items-baseline gap-1.5">
 {latestLog.systolic_bp && latestLog.diastolic_bp ? (
 <>
 <span className="text-2xl font-extrabold text-slate-900 font-mono">
 {latestLog.systolic_bp}/{latestLog.diastolic_bp}
 </span>
 <span className="text-xs text-slate-500">mmHg</span>
 </>
 ) : (
 <span className="text-base font-bold text-slate-400 font-mono">
 Não aferida
 </span>
 )}
 </div>
 <div className="mt-2">
 <span
 className={`text-[11px] font-semibold px-2 py-0.5 rounded border inline-block ${
 calculateBPStatus(latestLog.systolic_bp, latestLog.diastolic_bp).color
 }`}
 >
 {latestLog.status_category 'Opcional'}
 </span>
 </div>
 </div>

 {/* Card 2: Heart Rate */}
 <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
 <div className="flex items-center justify-between text-slate-500 mb-2">
 <span className="text-xs font-semibold">Frequência Cardíaca</span>
 <Activity className="w-4 h-4 text-blue-600" />
 </div>
 <div className="flex items-baseline gap-1.5">
 <span className="text-2xl font-extrabold text-slate-900 font-mono">
 {latestLog.heart_rate '--'}
 </span>
 <span className="text-xs text-slate-500">bpm</span>
 </div>
 <div className="mt-2 text-xs text-slate-500">
 {latestLog.heart_rate ? 'Pulso em repouso' : 'Aferição opcional'}
 </div>
 </div>

 {/* Card 3: Glucose */}
 <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
 <div className="flex items-center justify-between text-slate-500 mb-2">
 <span className="text-xs font-semibold">Glicemia Capilar</span>
 <span className="text-xs text-emerald-600 font-bold">mg/dL</span>
 </div>
 <div className="flex items-baseline gap-1.5">
 <span className="text-2xl font-extrabold text-slate-900 font-mono">
 {latestLog.glucose '--'}
 </span>
 <span className="text-xs text-slate-500">mg/dL</span>
 </div>
 <div className="mt-2 text-xs text-slate-500 truncate">
 {latestLog.glucose_context 'Não medida'}
 </div>
 </div>

 {/* Card 4: Temperature & Weight */}
 <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
 <div className="flex items-center justify-between text-slate-500 mb-2">
 <span className="text-xs font-semibold">Temp. & Peso</span>
 <Thermometer className="w-4 h-4 text-amber-500" />
 </div>
 <div className="flex items-baseline gap-2">
 <span className="text-xl font-extrabold text-slate-900 font-mono">
 {latestLog.temperature_c ? `${latestLog.temperature_c}°C` : '--'}
 </span>
 <span className="text-xs text-slate-400">·</span>
 <span className="text-xl font-extrabold text-slate-900 font-mono">
 {latestLog.weight_kg ? `${latestLog.weight_kg}kg` : '--'}
 </span>
 </div>
 <div className="mt-2 text-xs text-slate-500">
 Parâmetros gerais do idoso
 </div>
 </div>
 </div>
 )}

 {/* History Log List */}
 <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-base font-bold text-slate-900">
 Histórico Cronológico de Aferições
 </h3>
 <span className="text-xs text-slate-500">
 Validação com assinatura diária
 </span>
 </div>

 {logs.length === 0 ? (
 <div className="text-center py-10 text-slate-500 text-sm">
 Nenhuma medição registrada até o momento.
 </div>
 ) : (
 <div className="space-y-3">
 {logs.map((log) => {
 const status = calculateBPStatus(log.systolic_bp, log.diastolic_bp);
 const hasBp = Boolean(log.systolic_bp && log.diastolic_bp);

 return (
 <div
 key={log.id}
 className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-200 transition-colors bg-white"
 >
 <div className="space-y-1">
 <div className="flex flex-wrap items-center gap-2">
 {hasBp ? (
 <>
 <span className="text-lg font-bold text-slate-900 font-mono">
 {log.systolic_bp}/{log.diastolic_bp} mmHg
 </span>
 <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${status.color}`}>
 {status.label}
 </span>
 {log.heart_rate && (
 <span className="text-xs text-slate-500">
 · {log.heart_rate} bpm
 </span>
 )}
 </>
 ) : (
 <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
 Pressão Arterial: Não Aferida (Opção do Cuidador)
 </span>
 )}
 </div>

 <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-0.5">
 {log.glucose && (
 <span>Glicemia: <strong className="text-slate-700">{log.glucose} mg/dL</strong> ({log.glucose_context})</span>
 )}
 {log.temperature_c && (
 <span>· Temp: <strong className="text-slate-700">{log.temperature_c}°C</strong></span>
 )}
 {log.weight_kg && (
 <span>· Peso: <strong className="text-slate-700">{log.weight_kg} kg</strong></span>
 )}
 </div>

 {log.notes && (
 <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2 mt-1 border border-slate-100">
 {log.notes}
 </p>
 )}

 {/* Signature stamp */}
 <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium pt-1">
 <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
 <span>Assinado no diário conforme ordem do contratante</span>
 </div>
 </div>

 <div className="text-right border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 flex md:flex-col justify-between items-center md:items-end gap-2">
 <div className="flex items-center gap-1 text-xs text-slate-500">
 <Calendar className="w-3.5 h-3.5 text-blue-600" />
 <span>
 {new Date(log.created_at).toLocaleDateString('pt-BR')} às{' '}
 {new Date(log.created_at).toLocaleTimeString('pt-BR', {
 hour: '2-digit',
 minute: '2-digit',
 })}
 </span>
 </div>
 <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
 <UserIcon className="w-3 h-3 text-slate-400" />
 <span>{log.recorded_by_name 'Profissional'}</span>
 </div>

 {/* Edit button */}
 <button
 onClick={() => handleOpenEditModal(log)}
 className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-900 font-semibold text-xs transition-colors"
 title="Editar registro e opções de pressão arterial"
 >
 <Edit3 className="w-3.5 h-3.5 text-blue-600" />
 <span>Editar Aferição</span>
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>

 {/* Modal: New / Edit Health Log Form */}
 {isModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
 <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
 <div className="bg-blue-900 text-white p-4 flex items-center justify-between">
 <div>
 <div className="flex items-center gap-2">
 {editingLog ? (
 <Edit3 className="w-5 h-5 text-blue-300" />
 ) : (
 <Heart className="w-5 h-5 text-rose-300" />
 )}
 <h3 className="font-bold text-lg">
 {editingLog ? 'Editar Registro de Sinais Vitais' : 'Novo Registro de Sinais Vitais'}
 </h3>
 </div>
 <p className="text-xs text-blue-200 mt-0.5">
 {editingLog
 ? 'Campos de pressão arterial podem ser alterados ou deixados em branco por opção do cuidador.'
 : 'Preenchimento opcional a critério do cuidador ou medição do dia'}
 </p>
 </div>
 <button
 onClick={() => setIsModalOpen(false)}
 className="text-blue-200 hover:text-white text-sm font-semibold px-2 py-1"
 >
 Fechar
 </button>
 </div>

 <form onSubmit={handleSaveLog} className="p-5 space-y-4 overflow-y-auto">
 {/* Informative Banner regarding optional BP & mandatory daily signature */}
 <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
 <div className="flex items-center gap-1.5 font-bold">
 <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
 <span>Atenção Cuidador: Opção de Pressão Arterial & Assinatura</span>
 </div>
 <p className="text-[11px] leading-relaxed text-amber-800">
 A aferição e adição da pressão arterial é de <strong>modo opcional</strong> — você pode
 preencher valores ou <strong>deixar as opções em branco</strong> caso não tenha aferido.
 Porém, <strong>mediante a ordem do contratante</strong>, o relatório deve ser assinado todos os dias.
 </p>
 </div>

 {/* Blood Pressure Input (With clear blank option!) */}
 <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
 <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
 <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
 Pressão Arterial & Frequência (Opcional)
 </label>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={handleSetTypicalValues}
 className="text-[11px] font-bold text-blue-600 hover:underline"
 >
 Preencher 120/80
 </button>
 <span className="text-slate-300">·</span>
 <button
 type="button"
 onClick={handleClearBP}
 className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1"
 >
 <RotateCcw className="w-3 h-3" />
 Deixar em Branco
 </button>
 </div>
 </div>

 <div className="grid grid-cols-3 gap-3">
 <div>
 <div className="flex items-center justify-between">
 <span className="text-[11px] text-slate-500 font-medium">Sistólica (Máx)</span>
 {systolic && (
 <button
 type="button"
 onClick={() => setSystolic('')}
 className="text-[10px] text-slate-400 hover:text-rose-600"
 >
 Limpar
 </button>
 )}
 </div>
 <input
 type="number"
 min="60"
 max="260"
 value={systolic}
 onChange={(e) => setSystolic(e.target.value)}
 className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-blue-600 bg-white"
 placeholder="Em branco (opcional)"
 />
 </div>
 <div>
 <div className="flex items-center justify-between">
 <span className="text-[11px] text-slate-500 font-medium">Diastólica (Mín)</span>
 {diastolic && (
 <button
 type="button"
 onClick={() => setDiastolic('')}
 className="text-[10px] text-slate-400 hover:text-rose-600"
 >
 Limpar
 </button>
 )}
 </div>
 <input
 type="number"
 min="40"
 max="160"
 value={diastolic}
 onChange={(e) => setDiastolic(e.target.value)}
 className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-blue-600 bg-white"
 placeholder="Em branco (opcional)"
 />
 </div>
 <div>
 <div className="flex items-center justify-between">
 <span className="text-[11px] text-slate-500 font-medium">Pulso (bpm)</span>
 {heartRate && (
 <button
 type="button"
 onClick={() => setHeartRate('')}
 className="text-[10px] text-slate-400 hover:text-rose-600"
 >
 Limpar
 </button>
 )}
 </div>
 <input
 type="number"
 min="40"
 max="220"
 value={heartRate}
 onChange={(e) => setHeartRate(e.target.value)}
 className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-blue-600 bg-white"
 placeholder="Em branco (opcional)"
 />
 </div>
 </div>

 {/* Status indicator */}
 <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-200">
 <span className="text-slate-500">Situação:</span>
 <span className={`font-semibold px-2 py-0.5 rounded border ${liveBPStatus.color}`}>
 {liveBPStatus.label}
 </span>
 </div>
 </div>

 {/* Glucose Section */}
 <div className="grid grid-cols-2 gap-3">
 <div>
 <div className="flex items-center justify-between mb-1">
 <label className="block text-xs font-semibold text-slate-700">
 Glicemia (mg/dL) - Opcional
 </label>
 {glucose && (
 <button
 type="button"
 onClick={() => setGlucose('')}
 className="text-[10px] text-slate-400 hover:text-rose-600"
 >
 Limpar
 </button>
 )}
 </div>
 <input
 type="number"
 min="30"
 max="600"
 value={glucose}
 onChange={(e) => setGlucose(e.target.value)}
 className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:outline-blue-600"
 placeholder="Em branco"
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Contexto da Glicemia
 </label>
 <select
 value={glucoseContext}
 onChange={(e) => setGlucoseContext(e.target.value)}
 className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-blue-600 bg-white"
 >
 <option value="Jejum matinal">Jejum matinal</option>
 <option value="2h pós-almoço">2h pós-almoço</option>
 <option value="2h pós-jantar">2h pós-jantar</option>
 <option value="Pré-refeição">Pré-refeição</option>
 <option value="Aleatória">Aleatória</option>
 </select>
 </div>
 </div>

 {/* Temperature & Weight */}
 <div className="grid grid-cols-2 gap-3">
 <div>
 <div className="flex items-center justify-between mb-1">
 <label className="block text-xs font-semibold text-slate-700">
 Temperatura (°C) - Opcional
 </label>
 {temperature && (
 <button
 type="button"
 onClick={() => setTemperature('')}
 className="text-[10px] text-slate-400 hover:text-rose-600"
 >
 Limpar
 </button>
 )}
 </div>
 <input
 type="number"
 step="0.1"
 min="34"
 max="43"
 value={temperature}
 onChange={(e) => setTemperature(e.target.value)}
 className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:outline-blue-600"
 placeholder="Em branco"
 />
 </div>
 <div>
 <div className="flex items-center justify-between mb-1">
 <label className="block text-xs font-semibold text-slate-700">
 Peso Corporal (kg) - Opcional
 </label>
 {weight && (
 <button
 type="button"
 onClick={() => setWeight('')}
 className="text-[10px] text-slate-400 hover:text-rose-600"
 >
 Limpar
 </button>
 )}
 </div>
 <input
 type="number"
 step="0.1"
 min="20"
 max="200"
 value={weight}
 onChange={(e) => setWeight(e.target.value)}
 className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:outline-blue-600"
 placeholder="Em branco"
 />
 </div>
 </div>

 {/* Quick action to clear all vitals */}
 <div className="flex justify-end">
 <button
 type="button"
 onClick={handleClearAllVitals}
 className="text-xs text-slate-500 hover:text-rose-700 flex items-center gap-1 font-semibold"
 >
 <RotateCcw className="w-3.5 h-3.5" />
 Deixar todos os sinais vitais em branco
 </button>
 </div>

 {/* Observations */}
 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Observações, Queixas ou Mal-Estar do Idoso
 </label>
 <textarea
 rows={2}
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-blue-600"
 placeholder="Ex: Idoso sentiu leve tontura ao levantar; ou sem queixas no turno..."
 />
 </div>

 {/* Contractor Order & Mandatory Daily Signature Box */}
 <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1.5">
 <div className="flex items-center gap-1.5 font-bold">
 <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
 <span>Assinatura Diária Obrigatória por Ordem do Contratante</span>
 </div>
 <p className="text-[11px] text-blue-800 leading-relaxed">
 A aferição de pressão é de caráter opcional no momento, porém, <strong>mediante a ordem do
 contratante</strong>, o cuidador deve validar e assinar o registro diário de assistência em todos os turnos.
 </p>
 <label className="flex items-center gap-2 pt-1 font-semibold cursor-pointer">
 <input
 type="checkbox"
 checked={contractorSigned}
 onChange={(e) => setContractorSigned(e.target.checked)}
 className="w-4 h-4 text-blue-600 rounded"
 />
 <span>Confirmo a assinatura deste relatório para ciência do contratante</span>
 </label>
 </div>

 {/* Actions */}
 <div className="pt-2 flex items-center justify-end gap-2">
 <button
 type="button"
 onClick={() => setIsModalOpen(false)}
 className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
 >
 Cancelar
 </button>
 <button
 type="submit"
 disabled={isSubmitting}
 className="py-2.5 px-5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-sm shadow-blue-500/30"
 >
 {isSubmitting ? 'Salvando...' : editingLog ? 'Salvar Alterações e Assinar' : 'Gravar e Assinar'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
};
