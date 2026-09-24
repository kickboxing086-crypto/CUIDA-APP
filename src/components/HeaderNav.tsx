import React from 'react';
import {
  Clock,
  Heart,
  Pill,
  MessageSquare,
  FileText,
  Database,
  LayoutDashboard,
  Plus,
  CheckSquare,
  Users,
  LogOut,
  ShieldCheck,
  History,
  MapPin,
  Bell,
} from 'lucide-react';
import { ElderCaneLogo } from './ElderCaneLogo';
import { User as UserType } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

export type AppTabType =
  | 'caregiver_dashboard'
  | 'admin_users'
  | 'family_history'
  | 'missions'
  | 'incidents'
  | 'clock'
  | 'health'
  | 'meds'
  | 'family'
  | 'timesheet'
  | 'tech';

interface HeaderNavProps {
  activeTab: AppTabType;
  setActiveTab: (tab: AppTabType) => void;
  currentUser: UserType;
  users: UserType[];
  onSelectUser: (user: UserType) => void;
  onOpenAddPresence: () => void;
  onOpenResidenceConfig?: () => void;
  onOpenNotifications?: () => void;
  unreadCount?: number;
  categoryUnreadCounts?: Record<string, number>;
  onLogout?: () => void;
}

interface NavTabItem {
  id: AppTabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  categoryKey?: string;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  users,
  onSelectUser,
  onOpenAddPresence,
  onOpenResidenceConfig,
  onOpenNotifications,
  unreadCount = 0,
  categoryUnreadCounts = {},
  onLogout,
}) => {
  const isMasterAdmin = currentUser.role === 'admin_geral';
  const isFamilyAdmin = currentUser.role === 'admin_family' || currentUser.roles?.includes('admin_family');
  const canManageResidence = isMasterAdmin || isFamilyAdmin;

  const tabs: NavTabItem[] = [
    { id: 'caregiver_dashboard', label: 'Painel do Cuidador', icon: LayoutDashboard, badge: 'Plantão' },
    // Show Gestão de Logins for admin
    ...(isMasterAdmin || isFamilyAdmin
      ? ([
          {
            id: 'admin_users',
            label: 'Gestão de Famílias & Logins',
            icon: Users,
            badge: isMasterAdmin ? 'Admin Geral' : 'Famílias',
          },
        ] as NavTabItem[])
      : []),
    {
      id: 'missions',
      label: isMasterAdmin || isFamilyAdmin ? 'Obrigações Diárias' : 'Missões do Turno',
      icon: CheckSquare,
      badge: isMasterAdmin ? 'Admin Geral' : isFamilyAdmin ? 'Contratante' : 'Protocolo POP',
      categoryKey: 'Obrigações Diárias',
    },
    {
      id: 'incidents',
      label: 'Boletim do Idoso',
      icon: FileText,
      badge: 'Família',
      categoryKey: 'Boletim do Idoso',
    },
    {
      id: 'family_history',
      label: 'Histórico da Família',
      icon: History,
      badge: 'Auditoria',
    },
    { id: 'clock', label: 'Bater Ponto', icon: Clock, categoryKey: 'Controle de Ponto' },
    { id: 'health', label: 'Sinais Vitais', icon: Heart, categoryKey: 'Sinais Vitais' },
    { id: 'meds', label: 'Medicamentos', icon: Pill, categoryKey: 'Medicamentos' },
    { id: 'family', label: 'Mural & Escala', icon: MessageSquare, categoryKey: 'Mural' },
    { id: 'timesheet', label: 'Folha de Presença', icon: FileText },
    { id: 'tech', label: 'Especificação & SQL', icon: Database, badge: 'Arquiteto' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          {/* Logo with Elder and Cane */}
          <div className="cursor-pointer shrink-0" onClick={() => setActiveTab('caregiver_dashboard')}>
            <ElderCaneLogo size="md" variant="white-on-blue" />
          </div>

          {/* Right Actions: PWA Install Button, Notifications Bell, Cadastrar Residência, Adicionar Presença, User Persona */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* PWA Install Button */}
            <PWAInstallButton variant="header" />

            {/* Notification Bell Icon with Red Counter Badge */}
            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className={`relative px-2.5 sm:px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                  unreadCount > 0
                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title={unreadCount > 0 ? `(${unreadCount}) alterações no plantão para revisar` : 'Notificações'}
              >
                <div className="relative flex items-center justify-center">
                  <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-red-600' : 'text-slate-500'}`} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white animate-ping" />
                  )}
                </div>

                {unreadCount > 0 ? (
                  <span className="bg-red-600 text-white font-extrabold text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    ({unreadCount})
                    <span className="hidden lg:inline text-[10px] font-bold">novas</span>
                  </span>
                ) : (
                  <span className="hidden sm:inline text-[11px] text-slate-500 font-medium">0</span>
                )}
              </button>
            )}

            {canManageResidence && onOpenResidenceConfig && (
              <button
                type="button"
                onClick={onOpenResidenceConfig}
                className="inline-flex items-center gap-1.5 py-2 px-3 sm:px-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-xs active:scale-98 transition-all cursor-pointer shrink-0"
                title="Cadastrar / Editar Residência do Idoso & Perímetro de Ponto"
              >
                <MapPin className="w-4 h-4 text-amber-700" />
                <span className="hidden xl:inline">Residência do Idoso</span>
                <span className="xl:hidden">Residência</span>
              </button>
            )}

            <button
              onClick={onOpenAddPresence}
              className="inline-flex items-center gap-1.5 py-2 px-3 sm:px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs active:scale-98 transition-all cursor-pointer shrink-0"
              title="Adicionar Presença de Cuidador ou Visita"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Adicionar Presença</span>
              <span className="sm:hidden">Presença</span>
            </button>

            {/* Current user badge */}
            <div className="hidden md:flex flex-col text-right">
              <div className="flex items-center justify-end gap-1.5">
                {isMasterAdmin && (
                  <span className="p-0.5 rounded bg-emerald-100 text-emerald-700" title="Administrador Master">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                )}
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.name}
                </span>
              </div>
              <span className="text-[11px] text-blue-700 font-medium flex items-center justify-end gap-1">
                <span className="text-slate-400 font-mono">@{currentUser.username}</span>
                <span>·</span>
                <span>
                  {currentUser.role === 'admin_geral'
                    ? 'Admin Geral Master'
                    : currentUser.role === 'admin_family'
                    ? 'Familiar (Contratante)'
                    : currentUser.role === 'caregiver'
                    ? 'Cuidadora Titular'
                    : 'Familiar'}
                </span>
              </span>
            </div>

            {/* User switcher */}
            <div className="relative group">
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const selected = users.find((u) => u.id === e.target.value);
                  if (selected) onSelectUser(selected);
                }}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-blue-600 cursor-pointer hover:bg-slate-100 transition-colors max-w-[130px] sm:max-w-[190px] truncate"
                title="Alternar perfil ativo"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === 'admin_geral' ? 'Admin Geral' : u.role === 'caregiver' ? 'Cuidadora' : 'Família'})
                  </option>
                ))}
              </select>
            </div>

            {/* Logout button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1 py-1.5 px-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 text-xs font-bold transition-colors cursor-pointer"
                title="Encerrar sessão e voltar ao painel de login"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Menu with Red Badge Alerts */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const tabUnread = tab.categoryKey ? (categoryUnreadCounts[tab.categoryKey] || 0) : 0;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-blue-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>

                {/* Red notification badge if category has unread items */}
                {tabUnread > 0 ? (
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full flex items-center gap-1 animate-pulse ${
                      isActive ? 'bg-red-500 text-white' : 'bg-red-600 text-white'
                    }`}
                    title={`${tabUnread} novas alterações nesta aba`}
                  >
                    ({tabUnread})
                  </span>
                ) : tab.badge ? (
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-extrabold ${
                      isActive ? 'bg-blue-800 text-blue-100' : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};


