import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Trash2,
  ShieldAlert,
  Check,
  X,
  Lock,
  ArrowRight,
  ArrowLeft,
  Building2,
  User,
  CheckSquare,
  Square
} from 'lucide-react';

export interface TwoStepDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  itemType: 'login' | 'family';
  itemId: string;
  itemName: string;
  itemSubtitle?: string;
  itemDetails?: {
    label: string;
    value: string;
  }[];
  warningPoints?: string[];
}

export const TwoStepDeleteModal: React.FC<TwoStepDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemType,
  itemId,
  itemName,
  itemSubtitle,
  itemDetails = [],
  warningPoints = [],
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [isTermsAcknowledged, setIsTermsAcknowledged] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const REQUIRED_KEYWORD = 'EXCLUIR';

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setTypedConfirmation('');
      setIsTermsAcknowledged(false);
      setIsDeleting(false);
      setErrorMessage(null);
    }
  }, [isOpen, itemId]);

  if (!isOpen) return null;

  const isKeywordValid = typedConfirmation.trim().toUpperCase() === REQUIRED_KEYWORD;
  const canFinalizeDelete = isKeywordValid && isTermsAcknowledged && !isDeleting;

  const handleNextStep = () => {
    setStep(2);
    setErrorMessage(null);
  };

  const handlePreviousStep = () => {
    setStep(1);
    setErrorMessage(null);
  };

  const handleFinalDelete = async () => {
    if (!canFinalizeDelete) return;
    setErrorMessage(null);
    setIsDeleting(true);

    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar exclusão.');
      setIsDeleting(false);
    }
  };

  const defaultWarnings =
    itemType === 'login'
      ? [
          'O usuário perderá o acesso ao aplicativo imediatamente em todos os dispositivos.',
          'As credenciais de login e senha serão removidas do sistema.',
          'Os registros de ponto e histórico já auditados permanecerão salvos no relatório para fins de conformidade legal.',
          'Quaisquer escalas semanais de plantão atribuídas a este usuário serão canceladas.',
        ]
      : [
          'O registro da família e o cadastro do idoso(a) assistido serão removidos.',
          'Todos os logins associados a esta família serão desvinculados.',
          'As escalas de plantão da família e convites pendentes serão cancelados.',
          'O endereço e raio geofence configurados para esta família serão desativados.',
        ];

  const effectiveWarnings = warningPoints.length > 0 ? warningPoints : defaultWarnings;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-rose-500/30 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-white my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header com Indicador de Etapas */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-red-950 p-5 border-b border-rose-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/30 text-rose-300 border border-rose-500/40">
                  Etapa {step} de 2
                </span>
                <span className="text-xs font-semibold text-rose-200/80">
                  {step === 1 ? 'Análise de Risco' : 'Autorização Final'}
                </span>
              </div>
              <h3 className="font-black text-base sm:text-lg text-white mt-0.5">
                Excluir {itemType === 'login' ? 'Login de Acesso' : 'Família'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Alerta de Erro caso ocorra */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-500 rounded-2xl text-xs text-rose-200 flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Cartão de Identificação do Item Selecionado */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center font-bold shrink-0">
                {itemType === 'login' ? <User className="w-5 h-5 text-blue-400" /> : <Building2 className="w-5 h-5 text-indigo-400" />}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  {itemType === 'login' ? 'Usuário Selecionado' : 'Família Selecionada'}
                </span>
                <h4 className="font-bold text-sm text-white truncate">{itemName}</h4>
                {itemSubtitle && (
                  <p className="text-xs text-slate-400 truncate">{itemSubtitle}</p>
                )}
              </div>
            </div>

            {itemDetails.length > 0 && (
              <div className="pt-2 border-t border-slate-900 grid grid-cols-2 gap-2 text-[11px]">
                {itemDetails.map((detail, idx) => (
                  <div key={idx} className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                    <span className="text-slate-500 block text-[10px]">{detail.label}</span>
                    <span className="font-semibold text-slate-200 truncate block">{detail.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conteúdo da ETAPA 1: Lista de Riscos & Impacto */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
                <h5 className="font-bold text-xs text-rose-300 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  Atenção: Ação com Impacto Imediato e Irreversível
                </h5>
                <ul className="space-y-2 text-xs text-slate-300">
                  {effectiveWarnings.map((warn, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{warn}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  Para evitar qualquer acidente, a exclusão exigirá confirmação por digitação na próxima etapa.
                </span>
              </div>
            </div>
          )}

          {/* Conteúdo da ETAPA 2: Digitação Obrigatória & Termo de Ciência */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-200">
                  1. Digite a palavra <span className="font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/40">{REQUIRED_KEYWORD}</span> em maiúsculas:
                </label>
                <input
                  type="text"
                  autoFocus
                  value={typedConfirmation}
                  onChange={(e) => setTypedConfirmation(e.target.value.toUpperCase())}
                  placeholder={`Digite ${REQUIRED_KEYWORD}`}
                  disabled={isDeleting}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl font-mono font-black text-sm text-center tracking-widest text-rose-300 placeholder-slate-600 focus:outline-hidden shadow-inner"
                />
                {typedConfirmation && !isKeywordValid && (
                  <p className="text-[11px] text-rose-400">
                    O texto digitado não corresponde a &quot;{REQUIRED_KEYWORD}&quot;.
                  </p>
                )}
                {isKeywordValid && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 justify-center font-bold">
                    <Check className="w-3.5 h-3.5" />
                    Palavra de segurança verificada
                  </p>
                )}
              </div>

              {/* Checkbox de Ciência */}
              <div
                onClick={() => !isDeleting && setIsTermsAcknowledged(!isTermsAcknowledged)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                  isTermsAcknowledged
                    ? 'bg-rose-500/10 border-rose-500/50 text-slate-200'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 ${
                    isTermsAcknowledged
                      ? 'bg-rose-600 text-white'
                      : 'border-2 border-slate-600 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs leading-relaxed font-medium">
                  2. Confirmo que sou Administrador autorizado, revisei o item selecionado e estou ciente de que 
                  os dados serão excluídos definitivamente sem possibilidade de recuperação.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Navegação entre Etapas */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-black shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Avançar para Etapa 2 de Segurança</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handlePreviousStep}
                disabled={isDeleting}
                className="px-3.5 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <button
                type="button"
                onClick={handleFinalDelete}
                disabled={!canFinalizeDelete}
                className={`px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                  canFinalizeDelete
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:from-red-700 text-white shadow-xl shadow-rose-600/40 cursor-pointer ring-2 ring-rose-400/50'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Excluindo Definitivamente...' : 'Confirmar Exclusão Definitiva'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
