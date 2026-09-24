import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  UserPlus,
  Plus,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  Eye,
  EyeOff,
  LogOut,
  Layers,
  Activity,
  Check,
  X,
  Copy,
  KeyRound,
  Sparkles,
  Lock,
  MapPin,
} from 'lucide-react';
import { api } from '../services/api';
import { User as UserType, Family, UserRole, FamilyActivityLog } from '../types';
import { AVAILABLE_ROLES, validateUsername, validatePassword, getRoleDefinition } from '../utils/permissions';
import { fetchAddressByCep, formatCep } from '../utils/cep';
import { ElderCaneLogo } from './ElderCaneLogo';
import { ElderlyResidenceConfigModal } from './ElderlyResidenceConfigModal';

interface FamilyLoginsAdminViewProps {
  currentUser: UserType;
  onRefreshDirectory?: () => void;
  onLogout?: () => void;
}

export const FamilyLoginsAdminView: React.FC<FamilyLoginsAdminViewProps> = ({
  currentUser,
  onRefreshDirectory,
  onLogout,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'logins' | 'roles' | 'audit'>('logins');
  const [families, setFamilies] = useState<Family[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [globalAuditLogs, setGlobalAuditLogs] = useState<FamilyActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Password visibility map (userId -> boolean)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  // Modals
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isCreateFamilyModalOpen, setIsCreateFamilyModalOpen] = useState(false);
  const [isResidenceModalOpen, setIsResidenceModalOpen] = useState(false);
  const [targetResidenceFamily, setTargetResidenceFamily] = useState<Family | null>(null);

  // Form State: Create User
  const [targetFamilyId, setTargetFamilyId] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  // User can select UP TO TWO roles
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(['caregiver']);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserCode, setNewUserCode] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Form State: Create Family
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newElderlyName, setNewElderlyName] = useState('');
  const [newFamilyCep, setNewFamilyCep] = useState('');
  const [newFamilyAddress, setNewFamilyAddress] = useState('');
  const [newFamilyNotes, setNewFamilyNotes] = useState('');
  const [isLoadingFamilyCep, setIsLoadingFamilyCep] = useState(false);
  const [isSubmittingFamily, setIsSubmittingFamily] = useState(false);

  const handleFamilyCepChange = async (val: string) => {
    const formatted = formatCep(val);
    setNewFamilyCep(formatted);
    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      setIsLoadingFamilyCep(true);
      try {
        const res = await fetchAddressByCep(clean);
        if (res && res.fullAddress) {
          setNewFamilyAddress(res.fullAddress);
        }
      } catch (err) {
        console.warn('Erro ao buscar CEP da família:', err);
      } finally {
        setIsLoadingFamilyCep(false);
      }
    }
  };

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch users with passwords enabled for the admin account
      const [famData, usersData, auditData] = await Promise.all([
        api.getFamilies(),
        api.fetchUsers(true),
        api.getFamilyActivityLogs('all'),
      ]);
      setFamilies(famData);
      setAllUsers(usersData);
      setGlobalAuditLogs(auditData);
      if (famData.length > 0 && !targetFamilyId) {
        setTargetFamilyId(famData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleCopyPassword = (userId: string, pass?: string) => {
    if (!pass) return;
    navigator.clipboard.writeText(pass);
    setCopiedUserId(userId);
    setTimeout(() => setCopiedUserId(null), 2000);
  };

  const handleToggleRoleSelection = (roleId: UserRole) => {
    if (selectedRoles.includes(roleId)) {
      if (selectedRoles.length === 1) {
        // Must keep at least one role
        return;
      }
      setSelectedRoles(selectedRoles.filter((r) => r !== roleId));
    } else {
      if (selectedRoles.length >= 2) {
        // Replace the second role or alert
        setSelectedRoles([selectedRoles[0], roleId]);
      } else {
        setSelectedRoles([...selectedRoles, roleId]);
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Security Validations
    const usernameValidation = validateUsername(newUserUsername);
    if (!usernameValidation.valid) {
      setFeedback({ type: 'error', message: usernameValidation.error! });
      return;
    }

    const passwordValidation = validatePassword(newUserPassword);
    if (!passwordValidation.valid) {
      setFeedback({ type: 'error', message: passwordValidation.error! });
      return;
    }

    if (!newUserName.trim()) {
      setFeedback({ type: 'error', message: 'Preencha o nome completo do cliente.' });
      return;
    }

    if (selectedRoles.length === 0) {
      setFeedback({ type: 'error', message: 'Selecione pelo menos uma função para o usuário (até 2 opções permitidas).' });
      return;
    }

    const cleanUser = newUserUsername.trim().toLowerCase().replace(/\s+/g, '_');
    const cleanPass = newUserPassword.trim().toLowerCase().slice(0, 8);

    try {
      setIsSubmittingUser(true);
      await api.createUser({
        name: newUserName.trim(),
        username: cleanUser,
        password: cleanPass,
        roles: selectedRoles,
        role: selectedRoles[0],
        family_id: targetFamilyId || null,
        email: newUserEmail.trim() || undefined,
        registration_code: newUserCode.trim() || undefined,
        requesting_user_id: currentUser.id,
      });

      const roleNames = selectedRoles.map((r) => AVAILABLE_ROLES[r]?.name || r).join(' + ');

      setFeedback({
        type: 'success',
        message: `Login "${cleanUser}" criado com sucesso (em minúsculo, senha de ${cleanPass.length} chars) [${roleNames}]!`,
      });

      // Reset form
      setNewUserName('');
      setNewUserUsername('');
      setNewUserPassword('');
      setNewUserEmail('');
      setNewUserCode('');
      setSelectedRoles(['caregiver']);
      setIsCreateUserModalOpen(false);

      await loadData();
      if (onRefreshDirectory) onRefreshDirectory();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao cadastrar login.' });
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!newFamilyName.trim() || !newElderlyName.trim()) {
      setFeedback({ type: 'error', message: 'Preencha o nome da família e o nome do idoso(a).' });
      return;
    }

    try {
      setIsSubmittingFamily(true);
      const fam = await api.createFamily({
        name: newFamilyName.trim(),
        elderly_name: newElderlyName.trim(),
        residence_address: newFamilyAddress.trim() || undefined,
        notes: newFamilyNotes.trim() || undefined,
        requesting_user_id: currentUser.id,
      });

      setFeedback({
        type: 'success',
        message: `Família "${fam.name}" cadastrada com sucesso! Agora você pode criar os logins para ela.`,
      });

      setNewFamilyName('');
      setNewElderlyName('');
      setNewFamilyAddress('');
      setNewFamilyNotes('');
      setIsCreateFamilyModalOpen(false);
      setTargetFamilyId(fam.id);

      await loadData();
      if (onRefreshDirectory) onRefreshDirectory();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao cadastrar família.' });
    } finally {
      setIsSubmittingFamily(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o login de ${userName}?`)) {
      return;
    }

    try {
      await api.deleteUser(userId, currentUser.id);
      setFeedback({ type: 'success', message: `Login de ${userName} foi excluído com sucesso.` });
      await loadData();
      if (onRefreshDirectory) onRefreshDirectory();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao excluir login.' });
    }
  };

  const handleToggleUserRole = async (user: UserType, roleToToggle: UserRole) => {
    const currentRoles = (user.roles && user.roles.length > 0) ? [...user.roles] : [user.role || 'caregiver'];
    let updatedRoles: UserRole[];

    if (currentRoles.includes(roleToToggle)) {
      if (currentRoles.length === 1) {
        alert('O usuário precisa ter pelo menos 1 função ativa.');
        return;
      }
      updatedRoles = currentRoles.filter((r) => r !== roleToToggle);
    } else {
      if (currentRoles.length >= 2) {
        updatedRoles = [currentRoles[0], roleToToggle];
      } else {
        updatedRoles = [...currentRoles, roleToToggle];
      }
    }

    try {
      await api.updateUserRoles(user.id, updatedRoles, currentUser.id);
      const roleLabels = updatedRoles.map((r) => AVAILABLE_ROLES[r]?.name || r).join(' + ');
      setFeedback({
        type: 'success',
        message: `Funções de ${user.name} atualizadas para: [${roleLabels}].`,
      });
      await loadData();
      if (onRefreshDirectory) onRefreshDirectory();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao atualizar funções do usuário.' });
    }
  };

  // Filtered families by search
  const filteredFamilies = families.filter((fam) => {
    const q = searchQuery.toLowerCase();
    const matchesFamily = fam.name.toLowerCase().includes(q) || fam.elderly_name.toLowerCase().includes(q);
    const usersInFamily = allUsers.filter((u) => u.family_id === fam.id);
    const matchesUser = usersInFamily.some(
      (u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
    );
    return matchesFamily || matchesUser;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white pb-12">
      {/* Top Admin Master Header */}
      <header className="bg-slate-950/80 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ElderCaneLogo size="md" variant="white-on-blue" />
            <div className="hidden sm:block">
              <div className="text-xs font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <span>Painel de Administração Geral</span>
                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] px-1.5 py-0.2 rounded font-mono">
                  Master
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Gestão exclusiva de logins, famílias, funções e senhas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-white block">
                {currentUser.name}
              </span>
              <span className="text-[11px] text-purple-400 font-mono">
                @{currentUser.username} (Administrador Geral)
              </span>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Desconectar do Modo Administrador Geral e voltar ao login"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair do Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2 border-t border-slate-800/80 py-2">
          <button
            onClick={() => setActiveAdminTab('logins')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeAdminTab === 'logins'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Logins, Famílias & Senhas</span>
            <span className="bg-slate-900/60 text-slate-300 px-1.5 py-0.2 rounded text-[10px]">
              {allUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveAdminTab('roles')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeAdminTab === 'roles'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Classificação de Funções & Permissões</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('audit')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeAdminTab === 'audit'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Auditoria Geral (Firebase)</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        {/* Feedback alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 shadow-md ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/40'
                : 'bg-red-950/80 text-red-200 border border-red-500/40'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab 1: Logins, Famílias e Senhas */}
        {activeAdminTab === 'logins' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por família, idoso, login ou função..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-medium text-white placeholder-slate-500 focus:outline-blue-500"
                />
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
                {/* Global Password Toggle for Administrator */}
                <button
                  onClick={() => setShowAllPasswords(!showAllPasswords)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    showAllPasswords
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Exibir ou ocultar senhas de todos os usuários no painel"
                >
                  {showAllPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showAllPasswords ? 'Ocultar Senhas' : 'Exibir Todas Senhas'}</span>
                </button>

                <button
                  onClick={() => setIsCreateFamilyModalOpen(true)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>+ Nova Família</span>
                </button>

                <button
                  onClick={() => {
                    if (families.length > 0 && !targetFamilyId) {
                      setTargetFamilyId(families[0].id);
                    }
                    setIsCreateUserModalOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Criar Login de Cliente</span>
                </button>
              </div>
            </div>

            {/* Families and Logins List */}
            {loading ? (
              <div className="bg-slate-950/40 rounded-2xl p-12 border border-slate-800 text-center text-slate-400 text-xs">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span>Carregando dados sincronizados do Firebase e servidor...</span>
              </div>
            ) : filteredFamilies.length === 0 ? (
              <div className="bg-slate-950/40 rounded-2xl p-12 border border-slate-800 text-center text-slate-400 text-sm space-y-3">
                <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="font-semibold text-slate-300">Nenhuma família encontrada para o filtro atual.</p>
                <button
                  onClick={() => setIsCreateFamilyModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cadastrar Primeira Família
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredFamilies.map((family) => {
                  const familyUsers = allUsers.filter((u) => u.family_id === family.id);

                  return (
                    <div
                      key={family.id}
                      className="bg-slate-950/60 rounded-2xl border border-slate-800 shadow-xl overflow-hidden"
                    >
                      {/* Family Header */}
                      <div className="bg-slate-900/90 border-b border-slate-800 p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                              {family.name}
                              <span className="text-xs font-normal text-slate-400">
                                (Idoso: <strong className="text-blue-300">{family.elderly_name}</strong>)
                              </span>
                            </h3>
                            <p className="text-xs text-slate-400">
                              {family.residence_address || 'Endereço cadastrado'}
                              {family.notes && ` · ${family.notes}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setTargetResidenceFamily(family);
                              setIsResidenceModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            title="Cadastrar ou editar o endereço e as coordenadas GPS da residência desta família"
                          >
                            <MapPin className="w-3.5 h-3.5 text-amber-400" />
                            <span>Residência & Geofence</span>
                          </button>

                          <button
                            onClick={() => {
                              setTargetFamilyId(family.id);
                              setIsCreateUserModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Novo Login nesta Família</span>
                          </button>
                        </div>
                      </div>

                      {/* Logins inside this Family */}
                      <div className="p-4 sm:p-6">
                        {familyUsers.length === 0 ? (
                          <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                            Nenhum login cadastrado para esta família ainda. Clique no botão acima para adicionar.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {familyUsers.map((user) => {
                              const userRoles: UserRole[] =
                                user.roles && user.roles.length > 0 ? user.roles : [user.role || 'caregiver'];
                              const isPasswordVisible = showAllPasswords || visiblePasswords[user.id];

                              return (
                                <div
                                  key={user.id}
                                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
                                >
                                  <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-center gap-2.5">
                                        <img
                                          src={
                                            user.avatar_url ||
                                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
                                          }
                                          alt={user.name}
                                          className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                                        />
                                        <div>
                                          <h4 className="text-xs font-bold text-white leading-tight">
                                            {user.name}
                                          </h4>
                                          {/* Multi-role badges */}
                                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                            {userRoles.map((r) => {
                                              const def = AVAILABLE_ROLES[r];
                                              return (
                                                <span
                                                  key={r}
                                                  className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                                >
                                                  {def?.name || r}
                                                </span>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>

                                      {user.id !== 'usr-admin-samuel' && (
                                        <button
                                          onClick={() => handleDeleteUser(user.id, user.name)}
                                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                          title="Remover este login"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>

                                    {/* Credentials Box (Username + Password Visible for Admin) */}
                                    <div className="space-y-2 text-xs text-slate-300 bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Usuário:</span>
                                        <code className="text-emerald-400 font-mono font-bold">
                                          @{user.username}
                                        </code>
                                      </div>

                                      {/* Password Field Visible with Eye & Copy Button */}
                                      <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                                        <span className="text-slate-500 flex items-center gap-1">
                                          <KeyRound className="w-3 h-3 text-amber-400" />
                                          <span>Senha:</span>
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-mono text-xs font-bold text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                            {isPasswordVisible ? (user.password || '••••••••') : '••••••••'}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility(user.id)}
                                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                                            title={isPasswordVisible ? 'Ocultar senha' : 'Ver senha'}
                                          >
                                            {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleCopyPassword(user.id, user.password)}
                                            className="p-1 text-slate-400 hover:text-emerald-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                                            title="Copiar senha"
                                          >
                                            {copiedUserId === user.id ? (
                                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            ) : (
                                              <Copy className="w-3.5 h-3.5" />
                                            )}
                                          </button>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[11px]">
                                        <span className="text-slate-500">Matrícula:</span>
                                        <span className="font-mono text-slate-400">
                                          {user.registration_code || '---'}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Multi-role Options Selector (Allows selecting up to 2 options) */}
                                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                                      <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                                        <span>Funções do Usuário (Até 2):</span>
                                        <span className="text-slate-500">{userRoles.length}/2 ativas</span>
                                      </label>
                                      
                                      <div className="grid grid-cols-2 gap-1.5">
                                        {(['caregiver', 'admin_family', 'family_member', 'caregiver_substitute'] as UserRole[]).map((rId) => {
                                          const isSelected = userRoles.includes(rId);
                                          const def = AVAILABLE_ROLES[rId];
                                          return (
                                            <button
                                              key={rId}
                                              type="button"
                                              onClick={() => handleToggleUserRole(user, rId)}
                                              className={`px-2 py-1.5 rounded-lg text-[11px] font-bold text-left flex items-center justify-between transition-all cursor-pointer border ${
                                                isSelected
                                                  ? 'bg-blue-600/30 text-blue-200 border-blue-500/60 shadow-xs'
                                                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                                              }`}
                                            >
                                              <span className="truncate">{def.name}</span>
                                              {isSelected && <Check className="w-3 h-3 text-blue-400 shrink-0 ml-1" />}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Classificação Organizada por Nomes & Permissões */}
        {activeAdminTab === 'roles' && (
          <div className="space-y-6">
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-xs font-semibold text-purple-300">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Classificação Organizada por Nomes de Função</span>
              </div>
              <h3 className="text-xl font-extrabold text-white">
                Funções do Sistema CUIDA (Suporte a até 2 opções por usuário)
              </h3>
              <p className="text-xs text-slate-400 max-w-3xl">
                Agora qualquer usuário pode receber até 2 funções simultâneas (ex: <strong>Cuidador + Administrador Familiar</strong>), permitindo gerenciar o plano com máxima flexibilidade.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Object.values(AVAILABLE_ROLES).map((roleDef) => (
                <div
                  key={roleDef.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {roleDef.name}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {roleDef.id}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-base text-white">
                      {roleDef.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {roleDef.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
                    <div className="text-[11px] uppercase font-bold text-slate-500">
                      Permissões e Acessos:
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-slate-300">
                        {roleDef.permissions.can_edit_missions ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        )}
                        <span className={roleDef.permissions.can_edit_missions ? 'font-semibold text-emerald-300' : 'text-slate-500'}>
                          Criar / Editar Missões Diárias (POP)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-300">
                        {roleDef.permissions.can_clock_in ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        )}
                        <span className={roleDef.permissions.can_clock_in ? 'font-semibold text-amber-300' : 'text-slate-500'}>
                          Bater Ponto Facial com Câmera ao Vivo
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-300">
                        {roleDef.permissions.can_edit_vitals ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        )}
                        <span className={roleDef.permissions.can_edit_vitals ? 'font-semibold text-rose-300' : 'text-slate-500'}>
                          Registrar / Editar Aferição de Pressão (PA)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-300">
                        {roleDef.permissions.can_sign_contractor ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        )}
                        <span className={roleDef.permissions.can_sign_contractor ? 'font-semibold text-blue-300' : 'text-slate-500'}>
                          Assinar Visto Oficial no Boletim
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-300">
                        {roleDef.permissions.can_manage_logins ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        )}
                        <span className={roleDef.permissions.can_manage_logins ? 'font-semibold text-purple-300' : 'text-slate-500'}>
                          Criar Logins e Ver Senhas
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Auditoria Geral */}
        {activeAdminTab === 'audit' && (
          <div className="space-y-6">
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-white">
                  Auditoria de Atividades em Tempo Real (Firebase)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Trilha global de alterações em todas as famílias para controle total do Administrador Geral.
                </p>
              </div>
              <button
                onClick={loadData}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Recarregar Auditoria
              </button>
            </div>

            {globalAuditLogs.length === 0 ? (
              <div className="bg-slate-950/40 rounded-2xl p-12 border border-slate-800 text-center text-slate-500 text-xs">
                Nenhum evento registrado na auditoria até o momento.
              </div>
            ) : (
              <div className="space-y-3">
                {globalAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">
                          {log.user_name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {log.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{log.description}</p>
                      {log.details && (
                        <p className="text-[11px] text-slate-500 font-mono mt-1">{log.details}</p>
                      )}
                    </div>

                    <div className="text-right text-[11px] text-slate-500 shrink-0">
                      {new Date(log.created_at).toLocaleTimeString('pt-BR')} ·{' '}
                      {new Date(log.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal: Criar Login de Cliente com Suporte a até 2 Opções e Validação de Segurança */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-white my-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-base">
                <UserPlus className="w-5 h-5" />
                <span>Criar Novo Login de Cliente</span>
              </div>
              <button
                onClick={() => setIsCreateUserModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Família do Cliente *
                </label>
                <select
                  required
                  value={targetFamilyId}
                  onChange={(e) => setTargetFamilyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-white focus:outline-blue-500 cursor-pointer"
                >
                  {families.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.elderly_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ex: João Vitor Souza"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-white focus:outline-blue-500"
                />
              </div>

              {/* Security: Username & Password with Real-Time Validation Checkout */}
              <div className="space-y-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Checkout de Validação das Credenciais</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Padrão: Minúsculo &amp; Máx. 8 chars
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Usuário (Login em minúsculo) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newUserUsername}
                      onChange={(e) => setNewUserUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                      placeholder="ex: joao_cuidador"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-blue-500 lowercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Senha de Acesso (Máx. 8 caracteres) *
                    </label>
                    <div className="relative">
                      <input
                        type={showFormPassword ? 'text' : 'password'}
                        required
                        maxLength={8}
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value.toLowerCase().slice(0, 8))}
                        placeholder="máx 8 minúsculos"
                        className="w-full px-3 py-2 pr-9 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-blue-500 lowercase"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormPassword(!showFormPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showFormPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Checkout Checklist Badges */}
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                  <div className={`p-1.5 rounded-lg border flex items-center gap-1 font-semibold ${
                    newUserUsername.length >= 3 && newUserPassword.length >= 3
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    <span>{newUserUsername.length >= 3 && newUserPassword.length >= 3 ? '✓' : '○'}</span>
                    <span>Tudo Minúsculo</span>
                  </div>

                  <div className={`p-1.5 rounded-lg border flex items-center gap-1 font-semibold ${
                    newUserPassword.length > 0 && newUserPassword.length <= 8
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    <span>{newUserPassword.length > 0 && newUserPassword.length <= 8 ? '✓' : '○'}</span>
                    <span>Senha: {newUserPassword.length}/8 chars</span>
                  </div>

                  <div className={`p-1.5 rounded-lg border flex items-center gap-1 font-semibold ${
                    /[a-z]/i.test(newUserPassword)
                      ? 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    <span>{/[a-z]/i.test(newUserPassword) ? '✓' : '○'}</span>
                    <span>Letras (a-z)</span>
                  </div>

                  <div className={`p-1.5 rounded-lg border flex items-center gap-1 font-semibold ${
                    /[0-9]/.test(newUserPassword)
                      ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    <span>{/[0-9]/.test(newUserPassword) ? '✓' : '○'}</span>
                    <span>Números (0-9)</span>
                  </div>
                </div>
              </div>

              {/* Multi-role Selector (Choose up to 2 options) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Funções do Usuário (Selecione até 2 opções) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(['caregiver', 'admin_family', 'family_member', 'caregiver_substitute'] as UserRole[]).map((rId) => {
                    const isSelected = selectedRoles.includes(rId);
                    const def = AVAILABLE_ROLES[rId];
                    return (
                      <div
                        key={rId}
                        onClick={() => handleToggleRoleSelection(rId)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-white shadow-xs'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border shrink-0 ${
                            isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200">
                            {def.name}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            {def.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-blue-300">
                  Selecionado: <strong>{selectedRoles.map((r) => AVAILABLE_ROLES[r]?.name).join(' + ')}</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Código de Matrícula (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newUserCode}
                    onChange={(e) => setNewUserCode(e.target.value)}
                    placeholder="Ex: CUID-1090"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-mail do Cliente (Opcional)
                  </label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer shadow-lg"
                >
                  {isSubmittingUser ? 'Criando...' : 'Salvar no Firebase & Gerar Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Criar Nova Família */}
      {isCreateFamilyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-base">
                <Building2 className="w-5 h-5" />
                <span>Cadastrar Nova Família</span>
              </div>
              <button
                onClick={() => setIsCreateFamilyModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFamily} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome da Família *
                </label>
                <input
                  type="text"
                  required
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  placeholder="Ex: Família Albuquerque"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-white focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Idoso(a) Assistido *
                </label>
                <input
                  type="text"
                  required
                  value={newElderlyName}
                  onChange={(e) => setNewElderlyName(e.target.value)}
                  placeholder="Ex: Dona Helena Albuquerque (88 anos)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-white focus:outline-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CEP (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newFamilyCep}
                    onChange={(e) => handleFamilyCepChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-blue-500"
                  />
                  <span className="text-[10px] text-blue-400 block mt-0.5">
                    {isLoadingFamilyCep ? 'Buscando rua...' : 'Preenche a rua'}
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Endereço / Nome da Rua
                  </label>
                  <input
                    type="text"
                    value={newFamilyAddress}
                    onChange={(e) => setNewFamilyAddress(e.target.value)}
                    placeholder="Ex: Alameda Santos, 1200 - Jardins, SP"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observações / Rotina do Idoso
                </label>
                <textarea
                  rows={2}
                  value={newFamilyNotes}
                  onChange={(e) => setNewFamilyNotes(e.target.value)}
                  placeholder="Ex: Hipertensão, dieta hipossódica e fisioterapia às 14h."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateFamilyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFamily}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer shadow-lg"
                >
                  {isSubmittingFamily ? 'Cadastrando...' : 'Cadastrar Família no Firebase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Configurar Residência da Família */}
      {isResidenceModalOpen && targetResidenceFamily && (
        <ElderlyResidenceConfigModal
          isOpen={isResidenceModalOpen}
          onClose={() => {
            setIsResidenceModalOpen(false);
            setTargetResidenceFamily(null);
          }}
          currentUser={currentUser}
          familyId={targetResidenceFamily.id}
          familyName={targetResidenceFamily.name}
          currentElderly={{
            id: targetResidenceFamily.elderly_id || 'eld-01',
            full_name: targetResidenceFamily.elderly_name,
            birth_date: '',
            blood_type: 'Não informado',
            allergies: [],
            residence_address: targetResidenceFamily.residence_address || '',
            residence_lat: targetResidenceFamily.residence_lat || -23.5505,
            residence_long: targetResidenceFamily.residence_long || -46.6333,
            allowed_radius_meters: targetResidenceFamily.allowed_radius_meters || 150,
            emergency_contacts: [],
            created_at: new Date().toISOString(),
          }}
          onSaved={() => {
            loadData();
            if (onRefreshDirectory) onRefreshDirectory();
          }}
        />
      )}
    </div>
  );
};
