import React, { useState } from 'react';
import { Clock, Heart, Pill, MessageSquare, FileText, Database, LayoutDashboard, Plus, CheckSquare, Users, LogOut, ShieldCheck, History, MapPin, Bell, Link2, Camera, Menu, X, User as UserIcon, ChevronRight, Settings, Shield, Stethoscope, MoreVertical, } from "lucide-react";
import { ElderCaneLogo } from './ElderCaneLogo';
import { User as UserType } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { UserProfileModal } from './UserProfileModal';

export type AppTabType =
 'caregiver_dashboard'
 'admin_users'
 'family_history'
 'missions'
 'incidents'
 'clock'
 'health'
 'meds'
 'family'
 'timesheet'
 'tech';

interface HeaderNavProps {
 activeTab: AppTabType;
 setActiveTab: (tab: AppTabType) => void;
 currentUser: UserType;
 users: UserType[];
 onSelectUser: (user: UserType) => void;
 onOpenAddPresence: () => void;
 onOpenResidenceConfig?: () => void;
 onOpenFamilyInvites?: () => void;
 onOpenNotifications?: () => void;
 onOpenFacialModal?: () => void;
 onUserUpdated?: (updatedUser: UserType) => void;
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
 categoryGroup: 'principal' 'saude' 'familia' 'gestao';
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
 activeTab,
 setActiveTab,
 currentUser,
 users,
 onSelectUser,
 onOpenAddPresence,
 onOpenResidenceConfig,
 onOpenFamilyInvites,
 onOpenNotifications,
 onOpenFacialModal,
 onUserUpdated,
 unreadCount = 0,
 categoryUnreadCounts = {},
 onLogout,
}) => {
 const [isMenuOpen, setIsMenuOpen] = useState(false);
 const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

 const isMasterAdmin = currentUser.role === 'admin_geral';
 const isFamilyAdmin = currentUser.role === 'admin_family' currentUser.roles?.includes('admin_family');
 const canManageResidence = Boolean(isFamilyAdmin);

 const allTabs: NavTabItem[] = [
 {
 id: 'caregiver_dashboard',
 label: 'Painel do Cuidador',
 icon: LayoutDashboard,
 badge: 'Principal',
 categoryGroup: 'principal',
 },
 {
 id: 'clock',
 label: 'Bater Ponto (Entrada & Saída)',
 icon: Clock,
 badge: 'Auditado',
 categoryKey: 'Controle de Ponto',
 categoryGroup: 'principal',
 },
 {
 id: 'missions',
 label: isMasterAdmin isFamilyAdmin ? 'Obrigações Diárias' : 'Missões do Turno',
 icon: CheckSquare,
 badge: isMasterAdmin ? 'Admin' : isFamilyAdmin ? 'Família' : 'POP',
 categoryKey: 'Obrigações Diárias',
 categoryGroup: 'principal',
 },
 {
 id: 'incidents',
 label: 'Boletim do Idoso',
 icon: FileText,
 badge: 'Diário',
 categoryKey: 'Boletim do Idoso',
 categoryGroup: 'principal',
 },
 {
 id: 'health',
 label: 'Sinais Vitais',
 icon: Heart,
 badge: 'Clínico',
 categoryKey: 'Sinais Vitais',
 categoryGroup: 'saude',
 },
 {
 id: 'meds',
 label: 'Medicamentos & Prescrições',
 icon: Pill,
 badge: 'Horários',
 categoryKey: 'Medicamentos',
 categoryGroup: 'saude',
 },
 {
 id: 'family',
 label: 'Mural & Escala da Família',
 icon: MessageSquare,
 categoryKey: 'Mural',
 categoryGroup: 'familia',
 },
 {
 id: 'family_history',
 label: 'Histórico & Auditoria da Família',
 icon: History,
 badge: 'Linha do Tempo',
 categoryGroup: 'familia',
 },
 {
 id: 'timesheet',
 label: 'Folha de Presenças & Ponto',
 icon: FileText,
 categoryGroup: 'familia',
 },
 ...(isMasterAdmin isFamilyAdmin
 ? ([
 {
 id: 'admin_users',
 label: 'Gestão de Famílias & Logins',
 icon: Users,
 badge: isMasterAdmin ? 'Master' : 'Família',
 categoryGroup: 'gestao',
 },
 ] as NavTabItem[])
 : []),
 {
 id: 'tech',
 label: 'Especificação do Sistema & SQL',
 icon: Database,
 badge: 'Arquiteto',
 categoryGroup: 'gestao',
 },
 ];

 // Quick primary tabs for fast switching on top bar
 const quickTabs = allTabs.filter((t) =>
 ['caregiver_dashboard', 'clock', 'missions', 'health'].includes(t.id)
 );

 const handleSelectTab = (tabId: AppTabType) => {
 setActiveTab(tabId);
 setIsMenuOpen(false);
 };

 const getRoleBadge = () => {
 if (currentUser.role === 'admin_geral') return 'Admin Master';
 if (currentUser.role === 'admin_family') return 'Administrador Familiar';
 if (currentUser.role === 'caregiver') return 'Cuidador(a) Titular';
 if (currentUser.role === 'caregiver_substitute') return 'Cuidador(a) Folguista';
 return 'Familiar Acompanhante';
 };

 return (
 <>
 <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
 <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
 <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
 {/* Logo */}
 <div
 className="cursor-pointer shrink-0"
 onClick={() => setActiveTab('caregiver_dashboard')}
 >
 <ElderCaneLogo size="md" variant="white-on-blue" />
 </div>

 {/* Quick Navigation Pills for Desktop */}
 <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/80">
 {quickTabs.map((tab) => {
 const Icon = tab.icon;
 const isActive = activeTab === tab.id;
 const tabUnread = tab.categoryKey
 ? categoryUnreadCounts[tab.categoryKey] 0
 : 0;

 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
 isActive
 ? 'bg-blue-600 text-white shadow-xs'
 : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
 }`}
 >
 <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
 <span>{tab.label.split(' ')[0]}</span>
 {tabUnread > 0 && (
 <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
 )}
 </button>
 );
 })}
 </nav>

 {/* Right Action Icons: PWA Install, Notification Bell, User Avatar & 3-Bars Menu */}
 <div className="flex items-center gap-2 sm:gap-2.5">
 {/* PWA Install Button */}
 <PWAInstallButton variant="header" />

 {/* Notification Bell */}
 {onOpenNotifications && (
 <button
 type="button"
 onClick={onOpenNotifications}
 className={`relative p-2 sm:px-3 sm:py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
 unreadCount > 0
 ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 shadow-xs'
 : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
 }`}
 title={unreadCount > 0 ? `(${unreadCount}) alterações no plantão` : 'Notificações'}
 >
 <div className="relative flex items-center justify-center">
 <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-red-600' : 'text-slate-500'}`} />
 {unreadCount > 0 && (
 <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white animate-ping" />
 )}
 </div>
 {unreadCount > 0 && (
 <span className="bg-red-600 text-white font-extrabold text-[10px] px-1.5 py-0.2 rounded-full">
 {unreadCount}
 </span>
 )}
 </button>
 )}

 {/* User Profile Avatar Button (Click to edit photo / profile) */}
 <button
 type="button"
 onClick={() => setIsProfileModalOpen(true)}
 className="flex items-center gap-2 p-1 sm:pr-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer text-left"
 title="Meu Perfil (Trocar Foto / Ver Poderes)"
 >
 <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center shrink-0 border border-blue-200">
 {currentUser.avatar_url ? (
 <img
 src={currentUser.avatar_url}
 alt={currentUser.name}
 className="w-full h-full object-cover"
 />
 ) : (
 <span>{currentUser.name?.slice(0, 1).toUpperCase() 'U'}</span>
 )}
 <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
 </div>
 <div className="hidden sm:flex flex-col">
 <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[100px]">
 {currentUser.name?.split(' ')[0]}
 </span>
 <span className="text-[10px] text-blue-600 font-semibold leading-tight">
 Foto / Perfil
 </span>
 </div>
 </button>

 {/* 3 BARRAS / 3 PONTINHOS - HAMBURGER MENU BUTTON */}
 <button
 type="button"
 onClick={() => setIsMenuOpen(!isMenuOpen)}
 className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
 isMenuOpen
 ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20'
 : 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800'
 }`}
 title="Abrir Menu de Opções e Navegação"
 aria-label="Abrir Menu de Opções"
 >
 <Menu className="w-5 h-5" />
 <span className="hidden md:inline text-xs font-bold">Menu</span>
 </button>
 </div>
 </div>
 </div>
 </header>

 {/* DRAWER / MODAL DE NAVEGAÇÃO COMPLETA (3 BARRAS) */}
 {isMenuOpen && (
 <div
 className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
 onClick={(e) => {
 if (e.target === e.currentTarget) setIsMenuOpen(false);
 }}
 >
 <div className="w-full max-w-sm sm:max-w-md bg-slate-900 border-l border-slate-800 text-white h-full flex flex-col justify-between shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
 {/* Drawer Header */}
 <div className="p-4 sm:p-5 border-b border-slate-800 space-y-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <ElderCaneLogo size="sm" variant="white-on-blue" />
 <span className="text-sm font-extrabold text-white">Menu de Opções</span>
 </div>
 <button
 type="button"
 onClick={() => setIsMenuOpen(false)}
 className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* User Profile Summary Card */}
 <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 border border-blue-500/50">
 {currentUser.avatar_url ? (
 <img
 src={currentUser.avatar_url}
 alt={currentUser.name}
 className="w-full h-full object-cover"
 />
 ) : (
 <span className="text-base">{currentUser.name?.slice(0, 1).toUpperCase()}</span>
 )}
 </div>
 <div>
 <h4 className="text-sm font-extrabold text-white leading-tight">
 {currentUser.name}
 </h4>
 <p className="text-[11px] text-emerald-400 font-semibold">
 {getRoleBadge()}
 </p>
 <p className="text-[10px] text-slate-500">@{currentUser.username}</p>
 </div>
 </div>

 <button
 type="button"
 onClick={() => {
 setIsMenuOpen(false);
 setIsProfileModalOpen(true);
 }}
 className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-xl flex items-center gap-1 cursor-pointer transition-all shrink-0"
 >
 <Camera className="w-3.5 h-3.5" />
 <span>Trocar Foto</span>
 </button>
 </div>

 {/* Quick Action Shortcuts */}
 <div className="grid grid-cols-2 gap-2 pt-1">
 <button
 type="button"
 onClick={() => {
 setIsMenuOpen(false);
 onOpenAddPresence();
 }}
 className="p-2.5 bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/50 rounded-xl text-left text-blue-200 transition-all cursor-pointer flex items-center gap-2"
 >
 <Plus className="w-4 h-4 text-blue-400 shrink-0" />
 <span className="text-xs font-bold leading-tight">Adicionar Presença</span>
 </button>

 {isFamilyAdmin && onOpenFamilyInvites && (
 <button
 type="button"
 onClick={() => {
 setIsMenuOpen(false);
 onOpenFamilyInvites();
 }}
 className="p-2.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/50 rounded-xl text-left text-emerald-200 transition-all cursor-pointer flex items-center gap-2"
 >
 <Link2 className="w-4 h-4 text-emerald-400 shrink-0" />
 <span className="text-xs font-bold leading-tight">Convidar Família</span>
 </button>
 )}

 {canManageResidence && onOpenResidenceConfig && (
 <button
 type="button"
 onClick={() => {
 setIsMenuOpen(false);
 onOpenResidenceConfig();
 }}
 className="col-span-2 p-2.5 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/50 rounded-xl text-left text-amber-200 transition-all cursor-pointer flex items-center gap-2"
 >
 <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
 <span className="text-xs font-bold leading-tight">Cadastrar / Editar Residência do Idoso</span>
 </button>
 )}
 </div>
 </div>

 {/* Main Navigation Tabs List */}
 <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-left">
 {/* Grupo 1: Principal & Plantão */}
 <div className="space-y-1.5">
 <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block px-2">
 Atendimento & Rotina
 </span>
 {allTabs
 .filter((t) => t.categoryGroup === 'principal')
 .map((tab) => {
 const Icon = tab.icon;
 const isActive = activeTab === tab.id;
 const tabUnread = tab.categoryKey
 ? categoryUnreadCounts[tab.categoryKey] 0
 : 0;

 return (
 <button
 key={tab.id}
 type="button"
 onClick={() => handleSelectTab(tab.id)}
 className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
 isActive
 ? 'bg-blue-600 border-blue-500 text-white shadow-md'
 : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
 }`}
 >
 <div className="flex items-center gap-3">
 <div
 className={`p-2 rounded-xl ${
 isActive
 ? 'bg-blue-700 text-white'
 : 'bg-slate-900 text-blue-400 border border-slate-800'
 }`}
 >
 <Icon className="w-4 h-4" />
 </div>
 <div>
 <span className="text-xs font-bold block leading-tight">{tab.label}</span>
 {tab.badge && (
 <span
 className={`text-[10px] font-medium ${
 isActive ? 'text-blue-200' : 'text-slate-500'
 }`}
 >
 {tab.badge}
 </span>
 )}
 </div>
 </div>

 {tabUnread > 0 ? (
 <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
 {tabUnread}
 </span>
 ) : (
 <ChevronRight
 className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-600'}`}
 />
 )}
 </button>
 );
 })}
 </div>

 {/* Grupo 2: Saúde & Cuidados */}
 <div className="space-y-1.5 pt-2">
 <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block px-2">
 Saúde & Prescrições
 </span>
 {allTabs
 .filter((t) => t.categoryGroup === 'saude')
 .map((tab) => {
 const Icon = tab.icon;
 const isActive = activeTab === tab.id;
 const tabUnread = tab.categoryKey
 ? categoryUnreadCounts[tab.categoryKey] 0
 : 0;

 return (
 <button
 key={tab.id}
 type="button"
 onClick={() => handleSelectTab(tab.id)}
 className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
 isActive
 ? 'bg-blue-600 border-blue-500 text-white shadow-md'
 : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
 }`}
 >
 <div className="flex items-center gap-3">
 <div
 className={`p-2 rounded-xl ${
 isActive
 ? 'bg-blue-700 text-white'
 : 'bg-slate-900 text-rose-400 border border-slate-800'
 }`}
 >
 <Icon className="w-4 h-4" />
 </div>
 <div>
 <span className="text-xs font-bold block leading-tight">{tab.label}</span>
 {tab.badge && (
 <span
 className={`text-[10px] font-medium ${
 isActive ? 'text-blue-200' : 'text-slate-500'
 }`}
 >
 {tab.badge}
 </span>
 )}
 </div>
 </div>

 {tabUnread > 0 ? (
 <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
 {tabUnread}
 </span>
 ) : (
 <ChevronRight
 className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-600'}`}
 />
 )}
 </button>
 );
 })}
 </div>

 {/* Grupo 3: Família & Relatórios */}
 <div className="space-y-1.5 pt-2">
 <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block px-2">
 Comunicação & Auditoria
 </span>
 {allTabs
 .filter((t) => t.categoryGroup === 'familia')
 .map((tab) => {
 const Icon = tab.icon;
 const isActive = activeTab === tab.id;

 return (
 <button
 key={tab.id}
 type="button"
 onClick={() => handleSelectTab(tab.id)}
 className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
 isActive
 ? 'bg-blue-600 border-blue-500 text-white shadow-md'
 : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
 }`}
 >
 <div className="flex items-center gap-3">
 <div
 className={`p-2 rounded-xl ${
 isActive
 ? 'bg-blue-700 text-white'
 : 'bg-slate-900 text-emerald-400 border border-slate-800'
 }`}
 >
 <Icon className="w-4 h-4" />
 </div>
 <div>
 <span className="text-xs font-bold block leading-tight">{tab.label}</span>
 {tab.badge && (
 <span
 className={`text-[10px] font-medium ${
 isActive ? 'text-blue-200' : 'text-slate-500'
 }`}
 >
 {tab.badge}
 </span>
 )}
 </div>
 </div>
 <ChevronRight
 className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-600'}`}
 />
 </button>
 );
 })}
 </div>

 {/* Grupo 4: Gestão & Sistema */}
 <div className="space-y-1.5 pt-2">
 <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block px-2">
 Administração & Técnico
 </span>
 {allTabs
 .filter((t) => t.categoryGroup === 'gestao')
 .map((tab) => {
 const Icon = tab.icon;
 const isActive = activeTab === tab.id;

 return (
 <button
 key={tab.id}
 type="button"
 onClick={() => handleSelectTab(tab.id)}
 className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
 isActive
 ? 'bg-blue-600 border-blue-500 text-white shadow-md'
 : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
 }`}
 >
 <div className="flex items-center gap-3">
 <div
 className={`p-2 rounded-xl ${
 isActive
 ? 'bg-blue-700 text-white'
 : 'bg-slate-900 text-indigo-400 border border-slate-800'
 }`}
 >
 <Icon className="w-4 h-4" />
 </div>
 <div>
 <span className="text-xs font-bold block leading-tight">{tab.label}</span>
 {tab.badge && (
 <span
 className={`text-[10px] font-medium ${
 isActive ? 'text-blue-200' : 'text-slate-500'
 }`}
 >
 {tab.badge}
 </span>
 )}
 </div>
 </div>
 <ChevronRight
 className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-600'}`}
 />
 </button>
 );
 })}
 </div>

 {/* Alternador rápido de perfil */}
 {users.length > 1 && (
 <div className="pt-3 border-t border-slate-800 space-y-1.5">
 <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block px-1">
 Alternar Usuário Ativo
 </label>
 <select
 value={currentUser.id}
 onChange={(e) => {
 const selected = users.find((u) => u.id === e.target.value);
 if (selected) {
 onSelectUser(selected);
 setIsMenuOpen(false);
 }
 }}
 className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-500"
 >
 {users.map((u) => (
 <option key={u.id} value={u.id}>
 {u.name} ({u.role === 'admin_geral' ? 'Admin Geral' : u.role === 'caregiver' ? 'Cuidadora' : 'Família'})
 </option>
 ))}
 </select>
 </div>
 )}
 </div>

 {/* Drawer Footer with Logout & Branding */}
 <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 space-y-3">
 {onLogout && (
 <button
 type="button"
 onClick={() => {
 setIsMenuOpen(false);
 onLogout();
 }}
 className="w-full py-2.5 px-4 bg-red-950/50 hover:bg-red-900 border border-red-800/50 rounded-xl text-red-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
 >
 <LogOut className="w-4 h-4" />
 <span>Sair da Conta</span>
 </button>
 )}

 <div className="text-center text-[10px] text-slate-500 pt-1">
 CUIDA · desenvolvido por{' '}
 <strong className="text-slate-300 font-bold">SF TECNOLOGIA</strong>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* MODAL DE PERFIL DO USUÁRIO & TROCA DE FOTO */}
 {isProfileModalOpen && (
 <UserProfileModal
 isOpen={isProfileModalOpen}
 onClose={() => setIsProfileModalOpen(false)}
 currentUser={currentUser}
 onUserUpdated={(updated) => {
 if (onUserUpdated) onUserUpdated(updated);
 }}
 onLogout={onLogout}
 />
 )}
 </>
 );
};
