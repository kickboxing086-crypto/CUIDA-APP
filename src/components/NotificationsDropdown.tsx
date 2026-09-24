import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  Clock,
  ExternalLink,
  Heart,
  Pill,
  CheckSquare,
  FileText,
  MessageSquare,
  MapPin,
  X,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { FamilyActivityLog } from '../types';
import { AppTabType } from './HeaderNav';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  logs: FamilyActivityLog[];
  unreadIds: string[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigateTab?: (tab: AppTabType) => void;
  currentUserName: string;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  isOpen,
  onClose,
  logs,
  unreadIds,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigateTab,
  currentUserName,
}) => {
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = unreadIds.length;

  const filteredLogs = filter === 'unread'
    ? logs.filter((log) => unreadIds.includes(log.id))
    : logs;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Obrigações Diárias':
        return <CheckSquare className="w-4 h-4 text-amber-500" />;
      case 'Sinais Vitais':
        return <Heart className="w-4 h-4 text-rose-500" />;
      case 'Medicamentos':
        return <Pill className="w-4 h-4 text-blue-500" />;
      case 'Boletim do Idoso':
        return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'Controle de Ponto':
        return <Clock className="w-4 h-4 text-emerald-500" />;
      case 'Mural':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      default:
        return <MapPin className="w-4 h-4 text-blue-500" />;
    }
  };

  const getCategoryTab = (category: string, description: string): AppTabType => {
    if (description.toLowerCase().includes('residência') || description.toLowerCase().includes('geofence') || description.toLowerCase().includes('perímetro')) {
      return 'caregiver_dashboard';
    }
    switch (category) {
      case 'Obrigações Diárias':
        return 'missions';
      case 'Sinais Vitais':
        return 'health';
      case 'Medicamentos':
        return 'meds';
      case 'Boletim do Idoso':
        return 'incidents';
      case 'Controle de Ponto':
        return 'clock';
      case 'Mural':
        return 'family';
      default:
        return 'family_history';
    }
  };

  const handleItemClick = (log: FamilyActivityLog) => {
    if (unreadIds.includes(log.id)) {
      onMarkAsRead(log.id);
    }
    if (onNavigateTab) {
      const tab = getCategoryTab(log.category, log.description);
      onNavigateTab(tab);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end sm:p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        ref={dropdownRef}
        className="w-full sm:max-w-md bg-white sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[85vh] mt-0 sm:mt-14 mr-0 sm:mr-4 animate-in slide-in-from-top-4 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white relative flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-400">
                <Bell className="w-5 h-5 text-red-400" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-slate-900 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base text-white">Central de Atualizações</h3>
                {unreadCount > 0 ? (
                  <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    ({unreadCount}) novas
                  </span>
                ) : (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Tudo Lido
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Notificações de plantão, missões, residência e saúde
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action & Filter Bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Todas ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filter === 'unread'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span>Não Lidas</span>
              {unreadCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${filter === 'unread' ? 'bg-white text-red-600' : 'bg-red-100 text-red-700'}`}>
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-bold hover:underline cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Marcar todas como lidas</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3 space-y-1">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-600">
                {filter === 'unread'
                  ? 'Nenhuma notificação não lida no momento.'
                  : 'Nenhuma atividade registrada ainda.'}
              </p>
              <span className="text-[11px] text-slate-400 block">
                Você será avisado em vermelho assim que houver qualquer alteração no plantão.
              </span>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isUnread = unreadIds.includes(log.id);
              return (
                <div
                  key={log.id}
                  onClick={() => handleItemClick(log)}
                  className={`p-3 rounded-2xl transition-all cursor-pointer border ${
                    isUnread
                      ? 'bg-red-50/60 border-red-200 shadow-xs hover:bg-red-50'
                      : 'bg-white border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white border border-slate-200 shrink-0 shadow-2xs mt-0.5">
                      {getCategoryIcon(log.category)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {log.category}
                          </span>
                          {isUnread && (
                            <span className="bg-red-600 text-white font-extrabold text-[9px] px-1.5 py-0.2 rounded-full flex items-center gap-1 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              Nova Alteração
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                          {log.formatted_time || new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className={`text-xs ${isUnread ? 'font-bold text-slate-950' : 'font-medium text-slate-700'} leading-snug`}>
                        {log.description}
                      </p>

                      {log.details && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          {log.details}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100/80 text-[10px] text-slate-500">
                        <span className="font-medium text-slate-600 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-blue-600" />
                          {log.user_name}
                        </span>

                        <span className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                          <span>Ver detalhes</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
          💡 Clique em qualquer notificação para navegar direto para a seção alterada.
        </div>
      </div>
    </div>
  );
};
