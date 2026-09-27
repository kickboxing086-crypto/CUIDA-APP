import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Clock,
  UserCheck,
  FileCheck,
  AlertCircle,
  Camera,
  Check,
  MapPin,
  ShieldAlert,
  X,
  Stethoscope,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../services/api';
import { ElderlyProfile, User } from '../types';
import { AnimatedSelect, AnimatedChoiceCards, AnimatedSegmentedControl } from './AnimatedChoiceSelect';

interface AddPresenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenLiveCamera: () => void;
  elderly: ElderlyProfile;
  users: User[];
  currentUserId: string;
}

export const AddPresenceModal: React.FC<AddPresenceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenLiveCamera,
  elderly,
  users,
  currentUserId,
}) => {
  const [mode, setMode] = useState<'manual' | 'live'>('manual');
  const [selectedUserId, setSelectedUserId] = useState(currentUserId || users[0]?.id || 'usr-01');
  const [dateStamp, setDateStamp] = useState(new Date().toISOString().split('T')[0]);
  const [entryTimeStr, setEntryTimeStr] = useState('07:00');
  const [exitTimeStr, setExitTimeStr] = useState('19:00');
  const [entryType, setEntryType] = useState<'biometric_facial' | 'manual_authorized' | 'specialist_visit'>('manual_authorized');
  const [justification, setJustification] = useState('Plantão regular cumprido integralmente no domicílio');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await api.addManualTimeEntry({
        userId: selectedUserId,
        elderlyId: elderly.id,
        dateStamp,
        entryTime: entryTimeStr,
        exitTime: exitTimeStr || undefined,
        entryType,
        justification,
        notes,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao registrar presença manual.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const userOptions = users.map((u) => ({
    value: u.id,
    label: u.name,
    sublabel: u.role === 'caregiver' ? 'Cuidador(a) Titular' : u.role === 'admin_family' ? 'Administrador Familiar' : 'Especialista / Apoio',
    badge: u.role === 'caregiver' ? 'Titular' : undefined,
  }));

  const presenceTypeCards = [
    {
      value: 'manual_authorized' as const,
      label: 'Plantão Regular 12h',
      description: 'Turno padrão diurno ou noturno autorizado pela família.',
      icon: Briefcase,
    },
    {
      value: 'specialist_visit' as const,
      label: 'Visita de Especialista',
      description: 'Atendimento pontual de fisioterapia, enfermagem ou fonoaudiologia.',
      icon: Stethoscope,
    },
    {
      value: 'biometric_facial' as const,
      label: 'Plantão Emergencial',
      description: 'Cobertura rápida de folga ou necessidade imprevista.',
      icon: AlertTriangle,
    },
  ];

  const justificationOptions = [
    { value: 'Plantão regular cumprido integralmente no domicílio', label: 'Plantão regular cumprido integralmente no domicílio' },
    { value: 'Cobertura de folga emergencial acordada', label: 'Cobertura de folga emergencial acordada' },
    { value: 'Atendimento domiciliar de fisioterapia / enfermagem', label: 'Atendimento domiciliar de fisioterapia / enfermagem' },
    { value: 'Ajuste operacional de horário autorizado', label: 'Ajuste operacional de horário autorizado' },
    { value: 'Outra justificativa médica / familiar', label: 'Outra justificativa médica / familiar' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-xs overflow-y-auto overscroll-contain animate-in fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-y-auto max-h-[calc(100dvh-1.5rem)] my-auto flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-300" />
              <h3 className="font-bold text-lg text-white">Adicionar Presença / Ponto</h3>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              Lance um plantão, atendimento de especialista ou registre o ponto
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="p-3 bg-slate-100 border-b border-slate-200">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'manual'
                  ? 'bg-white text-blue-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lançar Presença Avulsa
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLiveCamera();
              }}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-xs hover:bg-blue-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-blue-200" />
              Bater Ponto com Foto
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitManual} className="p-5 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Professional Selection - Animated Select */}
          <div>
            <AnimatedSelect
              label="Colaborador / Profissional de Saúde *"
              value={selectedUserId}
              onChange={(val) => setSelectedUserId(val)}
              options={userOptions}
            />
          </div>

          {/* Presence Type Cards - Animated UI/UX Choice Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tipo de Presença *
            </label>
            <AnimatedChoiceCards
              value={entryType}
              onChange={(val) => setEntryType(val)}
              options={presenceTypeCards}
              columns={3}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Data do Plantão / Presença *
            </label>
            <input
              type="date"
              required
              value={dateStamp}
              onChange={(e) => setDateStamp(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden bg-white"
            />
          </div>

          {/* Entry & Exit Times */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Horário de Entrada *
              </label>
              <input
                type="time"
                required
                value={entryTimeStr}
                onChange={(e) => setEntryTimeStr(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Horário de Saída
              </label>
              <input
                type="time"
                value={exitTimeStr}
                onChange={(e) => setExitTimeStr(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
              />
            </div>
          </div>

          {/* Justification - Animated Select */}
          <div>
            <AnimatedSelect
              label="Justificativa do Lançamento (Auditoria) *"
              value={justification}
              onChange={(val) => setJustification(val)}
              options={justificationOptions}
            />
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações / Passagem de Plantão (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Idoso passou o dia bem, rotina de alimentação cumprida..."
              className="w-full border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
            />
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-start gap-2 text-xs text-blue-900">
            <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-relaxed">
              <strong>Carimbo de Auditoria:</strong> Esta presença será vinculada ao perfil de{' '}
              <strong>{elderly.full_name}</strong> com assinatura eletrônica e integrada à Folha de Ponto espelho.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </motion.button>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileTap={{ scale: 0.98 }}
              className="py-2.5 px-5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm shadow-blue-500/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Gravando...' : 'Salvar Presença'}</span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
