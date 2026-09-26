import React, { useState, useEffect } from 'react';
import {
  Link2,
  Copy,
  Check,
  MessageCircle,
  X,
  Plus,
  Users,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Trash2,
  Shield,
  Stethoscope,
  Clock,
  HeartHandshake,
} from 'lucide-react';
import { User, InviteLink, UserRole } from '../types';
import { api } from '../services/api';
import { ROLE_POWER_PROFILES, RolePowerProfile } from '../utils/classifications';

interface FamilyAdminInvitesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  elderlyName?: string;
}

export const FamilyAdminInvitesModal: React.FC<FamilyAdminInvitesModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  elderlyName = 'Idoso Assistido',
}) => {
  const [invites, setInvites] = useState<InviteLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [guestName, setGuestName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('caregiver');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const familyId = currentUser.family_id || null;
  const familyName = currentUser.family_name || 'Nossa Família';

  const loadInvites = async () => {
    try {
      setLoading(true);
      const list = await api.getInvites(familyId);
      setInvites(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadInvites();
      setFeedback(null);
    }
  }, [isOpen, familyId]);

  if (!isOpen) return null;

  const currentProfile = ROLE_POWER_PROFILES.find((p) => p.id === selectedRole) || ROLE_POWER_PROFILES[1];

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setFeedback({ type: 'error', message: 'Por favor, informe o nome do convidado(a).' });
      return;
    }

    try {
      setIsSubmitting(true);
      const newInv = await api.createInvite({
        family_id: familyId,
        roles: [selectedRole],
        guest_name: guestName.trim(),
        classification: selectedRole,
        classification_label: currentProfile.title,
        requesting_user_id: currentUser.id,
      });

      setFeedback({
        type: 'success',
        message: `Convite ${newInv.code} gerado com sucesso para ${newInv.guest_name}!`,
      });

      setGuestName('');
      setIsCreatingNew(false);
      await loadInvites();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Falha ao gerar link de convite.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = (code: string) => {
    const hostDomain = window.location.origin.includes('cuida-app.vercel.app')
      ? window.location.origin
      : 'https://cuida-app.vercel.app';
    const fullUrl = `${hostDomain}${window.location.pathname}?invite=${code}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleRevoke = async (id: string, code: string) => {
    if (!window.confirm(`Deseja revogar o link de convite ${code}?`)) return;
    try {
      await api.revokeInvite(id);
      setFeedback({ type: 'success', message: `Convite ${code} foi revogado com sucesso.` });
      await loadInvites();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao revogar convite.' });
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin_family':
        return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'caregiver':
        return <Stethoscope className="w-4 h-4 text-blue-400" />;
      case 'caregiver_substitute':
        return <Clock className="w-4 h-4 text-amber-400" />;
      default:
        return <HeartHandshake className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto p-4 sm:p-7 shadow-2xl space-y-5 my-auto text-white text-left animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <Link2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                <span>Convidar Membros & Cuidadores</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  {familyName}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Escolha a função e os poderes de acesso de quem você deseja convidar para o aplicativo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/70 border-red-500/40 text-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Toggle Form to Create New Invite */}
        {!isCreatingNew ? (
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Gerar novo link de acesso para a família</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Selecione os poderes que a pessoa terá no aplicativo e envie o link direto por WhatsApp.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 flex items-center gap-2 cursor-pointer shrink-0 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Gerar Novo Convite</span>
            </button>
          </div>
        ) : (
          /* Form: Create Invite with Roles and Powers */
          <form onSubmit={handleCreateInvite} className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-400" /> Novo Link de Convite
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            {/* Nome do Convidado */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome da pessoa que receberá o convite *
              </label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Ex: Clara Mendes, Marcos Silva, Dra. Juliana"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Seleção de Função e Poderes no Aplicativo */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Selecione a Função e o Nível de Acesso no Aplicativo *:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ROLE_POWER_PROFILES.map((profile) => {
                  const isSelected = selectedRole === profile.id;
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => setSelectedRole(profile.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? `${profile.colorTheme.bg} ${profile.colorTheme.border} ring-2 ring-emerald-500/50`
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(profile.id)}
                          <span className="text-xs font-bold text-white">{profile.title}</span>
                        </div>
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${profile.colorTheme.badgeBg} ${profile.colorTheme.badgeText}`}>
                            {profile.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2">
                        {profile.summary}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card Detalhado dos Poderes da Função Selecionada */}
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-white">
                  Poderes e Permissões que esta pessoa terá no app:
                </span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {currentProfile.powers.map((power, idx) => (
                  <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                    <span>{power}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !guestName.trim()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? 'Gerando Link...' : 'Gerar e Exibir Link de Convite'}
              </button>
            </div>
          </form>
        )}

        {/* Histórico de Convites da Família */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Convites Enviados pela sua Família ({invites.length})</span>
            </h4>
          </div>

          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500 animate-pulse">
              Carregando convites da família...
            </div>
          ) : invites.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800/80 space-y-2">
              <Link2 className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-400">Nenhum convite gerado ainda</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Clique no botão <strong>"Gerar Novo Convite"</strong> acima para criar links de acesso para os cuidadores ou familiares.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {invites.map((inv) => {
                const hostDomain = window.location.origin.includes('cuida-app.vercel.app')
                  ? window.location.origin
                  : 'https://cuida-app.vercel.app';
                const fullInviteUrl = `${hostDomain}${window.location.pathname}?invite=${inv.code}`;
                const roleProfile = ROLE_POWER_PROFILES.find((p) => p.id === inv.roles?.[0]) || ROLE_POWER_PROFILES[1];
                const roleLabel = roleProfile.title;
                const whatsappMsg = `Olá ${inv.guest_name || ''}! Como Administrador da Família ${familyName}, gerei seu link de acesso exclusivo como ${roleLabel} no aplicativo CUIDA.\n\nPara criar seu login e senha, acesse o link:\n${fullInviteUrl}`;
                const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMsg)}`;

                return (
                  <div
                    key={inv.id}
                    className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                      inv.status === 'active'
                        ? 'bg-slate-950 border-slate-800 hover:border-emerald-500/40'
                        : inv.status === 'used'
                        ? 'bg-slate-950/70 border-slate-800/70'
                        : 'bg-red-950/20 border-red-900/30 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800">
                          {inv.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            inv.status === 'active'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                              : inv.status === 'used'
                              ? 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                              : 'bg-red-950/80 text-red-300 border-red-500/40'
                          }`}
                        >
                          {inv.status === 'active'
                            ? '🟢 Ativo (Aguardando login)'
                            : inv.status === 'used'
                            ? '🔵 Conta Criada'
                            : '⚪ Revogado'}
                        </span>
                      </div>

                      {inv.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(inv.id, inv.code)}
                          className="text-[11px] text-red-400 hover:text-red-300 cursor-pointer flex items-center gap-1"
                          title="Cancelar convite"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Revogar</span>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div>
                        <p className="font-bold text-white text-sm">{inv.guest_name}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          {getRoleIcon(inv.roles?.[0] || 'caregiver')}
                          <span className="text-emerald-300 font-semibold">{roleLabel}</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-400">{roleProfile.badge}</span>
                        </p>
                      </div>
                    </div>

                    {inv.status === 'active' && (
                      <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(inv.code)}
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          {copiedCode === inv.code ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">Link Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-blue-400" />
                              <span>Copiar Link</span>
                            </>
                          )}
                        </button>

                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Enviar WhatsApp</span>
                        </a>
                      </div>
                    )}

                    {inv.status === 'used' && inv.used_by_users && inv.used_by_users.length > 0 && (
                      <div className="text-[11px] text-emerald-300 bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/20 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          Login ativado com sucesso pelo usuário <strong>@{inv.used_by_users[0].username}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="space-x-2">
            <span>CUIDA · Gestão Exclusiva da Família</span>
            <span className="opacity-40">|</span>
            <span className="text-[10px] text-slate-400">
              desenvolvido por <strong className="text-slate-300 font-bold">SF TECNOLOGIA</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
