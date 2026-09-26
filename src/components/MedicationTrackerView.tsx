import React, { useState, useEffect } from 'react';
import { Pill, CheckCircle2, Clock, XCircle, AlertCircle, Check } from "lucide-react";
import { MedicationLog, User } from '../types';
import { api } from '../services/api';

interface MedicationTrackerProps {
 currentUser: User;
}

export const MedicationTrackerView: React.FC<MedicationTrackerProps> = ({ currentUser }) => {
 const [medications, setMedications] = useState<MedicationLog[]>([]);
 const [isLoading, setIsLoading] = useState(false);
 const [selectedMedToSkip, setSelectedMedToSkip] = useState<MedicationLog null>(null);
 const [skipReason, setSkipReason] = useState<string>('');

 const loadMeds = async () => {
 setIsLoading(true);
 try {
 const data = await api.getMedications();
 setMedications(data);
 } catch (err) {
 console.error(err);
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 loadMeds();
 }, []);

 const handleAdminister = async (med: MedicationLog) => {
 try {
 await api.administerMedication(med.id, currentUser.id);
 await loadMeds();
 } catch (err) {
 console.error(err);
 }
 };

 const handleConfirmSkip = async () => {
 if (!selectedMedToSkip) return;
 try {
 await api.skipMedication(selectedMedToSkip.id, skipReason 'Recusa do paciente');
 setSelectedMedToSkip(null);
 setSkipReason('');
 await loadMeds();
 } catch (err) {
 console.error(err);
 }
 };

 const takenCount = medications.filter((m) => m.status === 'taken').length;
 const totalCount = medications.length;
 const progressPercent = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

 return (
 <div className="space-y-6">
 {/* Top Banner & Progress */}
 <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2">
 <Pill className="w-5 h-5 text-blue-600" />
 <h2 className="text-xl font-bold text-slate-900">Controle e Checklist de Medicamentos</h2>
 </div>
 <p className="text-xs text-slate-500 mt-1">
 Registro seguro de horários, dosagens e assinatura do responsável pela ministração
 </p>
 </div>

 {/* Progress Indicator */}
 <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
 <div>
 <span className="text-xs font-semibold text-blue-900 block">Adesão Diária</span>
 <span className="text-sm font-bold text-blue-800 font-mono">
 {takenCount} de {totalCount} ministrados ({progressPercent}%)
 </span>
 </div>
 <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 flex items-center justify-center font-bold text-xs text-blue-900">
 {progressPercent}%
 </div>
 </div>
 </div>
 </div>

 {/* Medication Checklist List */}
 <div className="space-y-3">
 {medications.map((med) => {
 const isTaken = med.status === 'taken';
 const isSkipped = med.status === 'skipped';
 const isPending = med.status === 'pending';

 return (
 <div
 key={med.id}
 className={`bg-white border rounded-2xl p-4 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
 isTaken
 ? 'border-emerald-200 bg-emerald-50/20'
 : isSkipped
 ? 'border-rose-200 bg-rose-50/20'
 : 'border-slate-200 hover:border-blue-200'
 }`}
 >
 <div className="flex items-start gap-3.5">
 <div
 className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
 isTaken
 ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
 : isSkipped
 ? 'bg-rose-100 text-rose-700 border-rose-200'
 : 'bg-blue-100 text-blue-700 border-blue-200'
 }`}
 >
 <Pill className="w-5 h-5" />
 </div>

 <div className="space-y-1">
 <div className="flex flex-wrap items-center gap-2">
 <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
 {med.scheduled_time}h
 </span>
 <h3 className="font-bold text-base text-slate-900">{med.medication_name}</h3>
 <span className="text-xs font-medium text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
 {med.dosage}
 </span>
 </div>

 {med.instructions && (
 <p className="text-xs text-slate-600 font-medium">
 Instrução: <span className="text-slate-500 font-normal">{med.instructions}</span>
 </p>
 )}

 {/* Audit Trail Stamp */}
 {isTaken && (
 <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5 pt-0.5">
 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
 <span>
 Ministrado às{' '}
 {med.administered_at
 ? new Date(med.administered_at).toLocaleTimeString('pt-BR', {
 hour: '2-digit',
 minute: '2-digit',
 })
 : med.scheduled_time}{' '}
 por {med.administered_by_name 'Cuidadora'}
 </span>
 </div>
 )}

 {isSkipped && (
 <div className="text-[11px] text-rose-700 font-semibold flex items-center gap-1.5 pt-0.5">
 <XCircle className="w-3.5 h-3.5 text-rose-600" />
 <span>Medicamento Não Ministrado / Suspenso</span>
 </div>
 )}
 </div>
 </div>

 {/* Action Buttons */}
 <div className="flex items-center gap-2 self-end md:self-center">
 {isPending && (
 <>
 <button
 onClick={() => setSelectedMedToSkip(med)}
 className="py-2 px-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"
 >
 Pular / Recusa
 </button>
 <button
 onClick={() => handleAdminister(med)}
 className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs active:scale-98 transition-all"
 >
 <Check className="w-4 h-4" />
 Confirmar Ministração
 </button>
 </>
 )}

 {isTaken && (
 <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1">
 <CheckCircle2 className="w-4 h-4 text-emerald-600" />
 Concluído
 </span>
 )}

 {isSkipped && (
 <span className="text-xs font-bold text-rose-700 bg-rose-100/80 px-3 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1">
 <AlertCircle className="w-4 h-4 text-rose-600" />
 Suspenso
 </span>
 )}
 </div>
 </div>
 );
 })}
 </div>

 {/* Modal: Justify skipped medication */}
 {selectedMedToSkip && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
 <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
 <div>
 <h3 className="font-bold text-base text-slate-900">
 Justificar Suspensão de Medicamento
 </h3>
 <p className="text-xs text-slate-500 mt-0.5">
 {selectedMedToSkip.medication_name} ({selectedMedToSkip.dosage})
 </p>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1">
 Motivo da não ministração:
 </label>
 <textarea
 rows={3}
 value={skipReason}
 onChange={(e) => setSkipReason(e.target.value)}
 placeholder="Ex: Idoso sentiu náuseas, recusou tomar o comprimido ou orientação médica de suspensão..."
 className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-blue-600"
 />
 </div>

 <div className="flex items-center justify-end gap-2 pt-2">
 <button
 onClick={() => setSelectedMedToSkip(null)}
 className="py-2 px-3 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
 >
 Cancelar
 </button>
 <button
 onClick={handleConfirmSkip}
 className="py-2 px-4 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
 >
 Gravar Justificativa
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};
