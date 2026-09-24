import React, { useState } from 'react';
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
} from 'lucide-react';
import { api } from '../services/api';
import { ElderlyProfile, User } from '../types';

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
  const [dateStamp, setDateStamp] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [entryTimeStr, setEntryTimeStr] = useState('07:00');
  const [exitTimeStr, setExitTimeStr] = useState('19:00');
  const [entryType, setEntryType] = useState<
    'biometric_facial' | 'manual_authorized' | 'specialist_visit'
  >('manual_authorized');
  const [justification, setJustification] = useState(
    'Plantão cumprido com autorização da família'
  );
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
        entryTimeStr,
        exitTimeStr: exitTimeStr || undefined,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-blue-900 text-white p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-300" />
              <h3 className="font-bold text-lg text-white">Adicionar Presença / Ponto</h3>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              Lance um plantão, visita de especialista ou registre o ponto facial ao vivo
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white text-xs font-bold px-2 py-1 rounded"
          >
            Fechar
          </button>
        </div>

        {/* Tab Selection */}
        <div className="bg-slate-100 p-2 flex gap-1 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'manual'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lançar Plantão / Presença Avulsa
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLiveCamera();
            }}
            className="flex-1 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-xs hover:bg-blue-700 flex items-center justify-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5 text-blue-200" />
            Bater Ponto Facial Agora
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitManual} className="p-5 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Professional Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Colaborador / Profissional de Saúde
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-blue-600"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.role === 'caregiver' ? 'Cuidadora Titular' : 'Família / Especialista'}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Shift Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data do Plantão / Presença
              </label>
              <input
                type="date"
                required
                value={dateStamp}
                onChange={(e) => setDateStamp(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono focus:outline-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo de Presença
              </label>
              <select
                value={entryType}
                onChange={(e: any) => setEntryType(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-blue-600"
              >
                <option value="manual_authorized">Plantão Regular 12h</option>
                <option value="specialist_visit">Visita Terapêutica / Especialista</option>
                <option value="biometric_facial">Plantão Emergencial / Cobertura</option>
              </select>
            </div>
          </div>

          {/* Entry & Exit Times */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Horário de Entrada
              </label>
              <input
                type="time"
                required
                value={entryTimeStr}
                onChange={(e) => setEntryTimeStr(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 bg-white focus:outline-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Horário de Saída
              </label>
              <input
                type="time"
                value={exitTimeStr}
                onChange={(e) => setExitTimeStr(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 bg-white focus:outline-blue-600"
              />
            </div>
          </div>

          {/* Justification for Legal Audit */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Justificativa do Lançamento (Auditoria Legal)
            </label>
            <select
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-blue-600 mb-1.5"
            >
              <option value="Plantão cumprido com autorização da família">
                Plantão regular cumprido integralmente no domicílio
              </option>
              <option value="Cobertura de folga emergencial">
                Cobertura emergencial de folga de outro colaborador
              </option>
              <option value="Visita técnica / Fisioterapia domiciliar">
                Atendimento domiciliar de fisioterapia / enfermagem
              </option>
              <option value="Ajuste de biometria / Falha de conectividade">
                Ajuste por oscilação momentânea de internet
              </option>
              <option value="Outra justificativa médica / familiar">
                Outra justificativa acordada
              </option>
            </select>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações / Passagem de Plantão
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Idoso passou o dia bem, caminhada no pátio realizada, almoçou sem restrições..."
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-blue-600"
            />
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2 text-xs text-blue-900">
            <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-relaxed">
              <strong>Carimbo de Auditoria:</strong> Esta presença será vinculada ao perfil de{' '}
              <strong>{elderly.full_name}</strong> com assinatura eletrônica do administrador familiar,
              sendo imediatamente integrada à Folha de Ponto espelho.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm shadow-blue-500/30 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Gravando...' : 'Salvar Presença'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
