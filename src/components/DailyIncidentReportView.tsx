import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Plus,
  Heart,
  ShieldCheck,
  Eye,
  Check,
  Activity,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { DailyIncidentReport, ElderlyProfile, GeneralWellbeing, User as UserType } from '../types';
import { api } from '../services/api';

interface DailyIncidentReportViewProps {
  currentUser: UserType;
  elderly: ElderlyProfile;
}

export const DailyIncidentReportView: React.FC<DailyIncidentReportViewProps> = ({
  currentUser,
  elderly,
}) => {
  const [incidents, setIncidents] = useState<DailyIncidentReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [generalState, setGeneralState] = useState<GeneralWellbeing>('estavel');
  const [hadDiscomfort, setHadDiscomfort] = useState<boolean>(false);
  const [selectedDiscomforts, setSelectedDiscomforts] = useState<string[]>([]);
  const [symptomsDescription, setSymptomsDescription] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');
  const [contractorSigned, setContractorSigned] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Filter state
  const [filterDiscomfortOnly, setFilterDiscomfortOnly] = useState(false);

  const commonDiscomforts = [
    'Tontura / Vertigem ao levantar',
    'Pico ou alteração de pressão',
    'Náusea / Enjoo',
    'Dor de cabeça / Cefaleia',
    'Fraqueza / Cansaço excessivo',
    'Sonolência fora do habitual',
    'Desequilíbrio / Quase queda',
    'Recusa alimentar ou de líquidos',
    'Dor corporal ou articular',
    'Agitação / Confusão momentânea',
  ];

  const loadIncidents = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDailyIncidents();
      setIncidents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const toggleDiscomfort = (item: string) => {
    setSelectedDiscomforts((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMsg(null);

    try {
      await api.createDailyIncident({
        general_state: generalState,
        had_discomfort: hadDiscomfort,
        discomfort_types: hadDiscomfort ? selectedDiscomforts : [],
        symptoms_description: symptomsDescription || (hadDiscomfort ? 'Idoso apresentou mal-estar relatado.' : 'Dia transcorreu sem alterações ou queixas.'),
        actions_taken: actionsTaken || 'Rotina mantida, cuidados e hidratação regular.',
        recorded_by_user_id: currentUser.id,
        contractor_signed: contractorSigned,
        caregiver_signed: true,
      });

      setIsModalOpen(false);
      // Reset form
      setGeneralState('estavel');
      setHadDiscomfort(false);
      setSelectedDiscomforts([]);
      setSymptomsDescription('');
      setActionsTaken('');
      setFeedbackMsg('Boletim diário registrado com sucesso!');
      await loadIncidents();
    } catch (err: any) {
      setFeedbackMsg(err.message || 'Erro ao registrar boletim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIncident = async (id: string) => {
    try {
      await api.signDailyIncident(id, currentUser.id);
      await loadIncidents();
    } catch (err) {
      console.error(err);
    }
  };

  const getStateBadge = (state: GeneralWellbeing) => {
    switch (state) {
      case 'otimo':
        return { label: 'Disposição Ótima', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'estavel':
        return { label: 'Estável e Calmo', color: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'atencao':
        return { label: 'Requer Atenção', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'mal_estar':
        return { label: 'Apresentou Mal-Estar', color: 'bg-rose-50 text-rose-800 border-rose-200' };
    }
  };

  const filteredList = incidents.filter((i) => {
    if (filterDiscomfortOnly) return i.had_discomfort;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Family Well-being Hub */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-blue-900">
                Relatório Diário de Alterações & Bem-Estar
              </span>
              <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                Acompanhamento Familiar
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Linha do tempo diária para filhos, pais e familiares acompanharem exatamente o que aconteceu
              com <strong>{elderly.full_name}</strong>: disposição, queixas, mal-estar e condutas adotadas.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/25 active:scale-98 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            + Registrar Boletim do Dia
          </button>
        </div>

        {feedbackMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}
      </div>

      {/* Filter and Quick Indicators Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterDiscomfortOnly(false)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !filterDiscomfortOnly
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Todos os Dias ({incidents.length})
          </button>
          <button
            onClick={() => setFilterDiscomfortOnly(true)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterDiscomfortOnly
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Apenas Dias com Mal-Estar / Alteração
          </button>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Assinatura do cuidador e contratante exigida diariamente</span>
        </div>
      </div>

      {/* Timeline of Days */}
      <div className="space-y-4">
        {filteredList.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-sm">
            Nenhum registro encontrado para este filtro.
          </div>
        ) : (
          filteredList.map((item) => {
            const badge = getStateBadge(item.general_state);

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs transition-all ${
                  item.had_discomfort
                    ? 'border-amber-200 bg-amber-50/10'
                    : 'border-slate-200'
                }`}
              >
                {/* Header: Date, State, and Caregiver on Duty */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-800 border border-blue-100 flex items-center justify-center font-bold text-xs">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {item.day_of_week}, {item.date_stamp.split('-').reverse().join('/')}
                        </span>
                        <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Acompanhado por: <strong>{item.recorded_by_name}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Mal-estar Alert Chip */}
                  <div className="self-start sm:self-center">
                    {item.had_discomfort ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Houve Alteração / Mal-estar
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Dia Tranquilo / Sem Queixas
                      </span>
                    )}
                  </div>
                </div>

                {/* Content: Symptoms and Actions */}
                <div className="py-3 space-y-3">
                  {/* Discomfort tags if any */}
                  {item.discomfort_types && item.discomfort_types.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.discomfort_types.map((type, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md border border-rose-200"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* What Happened (Description) */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs">
                    <span className="font-bold text-slate-700 block mb-1">
                      Relato do Dia (O que o idoso passou ou relatou):
                    </span>
                    <p className="text-slate-600 leading-relaxed font-normal">
                      {item.symptoms_description}
                    </p>
                  </div>

                  {/* Actions Taken */}
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-xs">
                    <span className="font-bold text-blue-900 block mb-1">
                      Condutas e Cuidados Adotados:
                    </span>
                    <p className="text-slate-700 leading-relaxed font-normal">
                      {item.actions_taken}
                    </p>
                  </div>
                </div>

                {/* Footer: Signatures of Contractor and Caregiver */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 text-slate-500">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Cuidador(a) Assinou: {item.caregiver_signed_name || item.recorded_by_name}</span>
                    </div>

                    {item.contractor_signed ? (
                      <div className="flex items-center gap-1.5 text-blue-800 font-semibold">
                        <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Ciência do Contratante / Família: {item.contractor_signed_name || 'Dr. Fernando Silveira'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-amber-700 font-semibold">Pendente de visto familiar</span>
                        {currentUser.role === 'admin_family' && (
                          <button
                            onClick={() => handleSignIncident(item.id)}
                            className="py-1 px-2.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-xs"
                          >
                            Dar Visto / Assinar como Contratante
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Family views stamp */}
                  {item.family_viewed_by && item.family_viewed_by.length > 0 && (
                    <div className="text-[11px] text-slate-400 font-mono">
                      Visualizado por: {item.family_viewed_by.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: New Incident / Daily Report Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-blue-900 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Boletim Diário de Bem-Estar & Ocorrências</h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Informe à família como foi o dia de Dona Maria de Lourdes
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-blue-200 hover:text-white text-xs font-bold"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="p-5 space-y-4 overflow-y-auto">
              {/* General State Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Estado Geral do Idoso Hoje
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'otimo', label: 'Disposição Ótima', sub: 'Sem queixas, bem-humorado' },
                    { id: 'estavel', label: 'Estável e Calmo', sub: 'Rotina padrão cumprida' },
                    { id: 'atencao', label: 'Requer Atenção', sub: 'Leve indisposição ou cansaço' },
                    { id: 'mal_estar', label: 'Houve Mal-Estar', sub: 'Sintomas relatados ou pico de PA' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setGeneralState(opt.id as GeneralWellbeing)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        generalState === opt.id
                          ? 'bg-blue-50 border-blue-600 text-blue-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs block font-bold">{opt.label}</span>
                      <span className="text-[10px] text-slate-500 font-normal">{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Did the elderly feel sick / discomfort toggle */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Houve queixa de mal-estar, alteração ou sintoma?
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Tontura, enjoo, pico de pressão, dor ou fraqueza
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300">
                    <button
                      type="button"
                      onClick={() => setHadDiscomfort(false)}
                      className={`px-3 py-1 rounded text-xs font-bold ${
                        !hadDiscomfort
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      onClick={() => setHadDiscomfort(true)}
                      className={`px-3 py-1 rounded text-xs font-bold ${
                        hadDiscomfort
                          ? 'bg-rose-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Sim
                    </button>
                  </div>
                </div>

                {/* Common discomfort checklist if Yes */}
                {hadDiscomfort && (
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      Selecione as alterações observadas:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {commonDiscomforts.map((disc, idx) => {
                        const isSelected = selectedDiscomforts.includes(disc);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleDiscomfort(disc)}
                            className={`p-2 rounded-lg border text-left text-[11px] flex items-center justify-between ${
                              isSelected
                                ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <span>{disc}</span>
                            {isSelected && <Check className="w-3 h-3 text-rose-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Symptoms description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Relato do Dia & Sintomas Observados
                </label>
                <textarea
                  rows={3}
                  required
                  value={symptomsDescription}
                  onChange={(e) => setSymptomsDescription(e.target.value)}
                  placeholder="Ex: Dona Maria acordou bem, mas por volta das 14h referiu leve tontura ao levantar do sofá. Não houve queda..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-blue-600"
                />
              </div>

              {/* Actions taken */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Condutas Adotadas (O que foi feito)
                </label>
                <textarea
                  rows={2}
                  required
                  value={actionsTaken}
                  onChange={(e) => setActionsTaken(e.target.value)}
                  placeholder="Ex: Colocada em repouso com pernas elevadas, oferecido 200ml de água, aferida a pressão e comunicado ao Dr. Fernando..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-blue-600"
                />
              </div>

              {/* Legal confirmation and contractor order disclaimer */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Termo de Assinatura Diária por Ordem do Contratante</span>
                </div>
                <p className="text-[11px] leading-relaxed text-blue-800">
                  Ao salvar, confirma-se o cumprimento das orientações diárias prescritas pelo contratante,
                  ficando o boletim arquivado para acesso imediato de pais, mães e filhos.
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
                  {isSubmitting ? 'Salvando...' : 'Gravar Boletim Diário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
