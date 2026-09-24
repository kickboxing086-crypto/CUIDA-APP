import React, { useState, useEffect } from 'react';
import {
  History,
  Heart,
  Pill,
  CheckSquare,
  FileText,
  Clock,
  MessageSquare,
  Filter,
  User,
  ShieldCheck,
  RefreshCw,
  Search,
} from 'lucide-react';
import { FamilyActivityLog, User as UserType } from '../types';
import { api } from '../services/api';

interface FamilyActivityHistoryViewProps {
  currentUser: UserType;
  familyId?: string;
  familyName?: string;
}

export const FamilyActivityHistoryView: React.FC<FamilyActivityHistoryViewProps> = ({
  currentUser,
  familyId,
  familyName,
}) => {
  const [logs, setLogs] = useState<FamilyActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getFamilyActivityLogs(familyId || currentUser.family_id || 'fam-01');
      setLogs(data);
    } catch (err) {
      console.error('Erro ao carregar histórico da família:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [familyId, currentUser.family_id]);

  const categories = [
    { id: 'all', label: 'Todas as Ações' },
    { id: 'Sinais Vitais', label: 'Sinais Vitais', icon: Heart },
    { id: 'Obrigações Diárias', label: 'Obrigações Diárias', icon: CheckSquare },
    { id: 'Boletim do Idoso', label: 'Boletim do Idoso', icon: FileText },
    { id: 'Medicamentos', label: 'Medicamentos', icon: Pill },
    { id: 'Controle de Ponto', label: 'Controle de Ponto', icon: Clock },
  ];

  const filteredLogs = logs.filter((log) => {
    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      log.description.toLowerCase().includes(q) ||
      log.user_name.toLowerCase().includes(q) ||
      (log.details && log.details.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Sinais Vitais':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Obrigações Diárias':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Boletim do Idoso':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Medicamentos':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Controle de Ponto':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-blue-700/40">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs font-semibold text-blue-200">
            <History className="w-4 h-4 text-blue-400" />
            <span>Transparência Compartilhada da Família</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Histórico de Alterações & Atividades da Família
          </h2>
          <p className="text-xs sm:text-sm text-blue-200/80">
            Acompanhe em tempo real tudo o que cuidadores e familiares registraram ou editaram (aferições de pressão, missões cumpridas, horários de remédios e boletins).
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Histórico</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cuidador, ação ou nota..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-blue-600"
          />
        </div>
      </div>

      {/* Activity Feed Timeline */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-400 text-xs">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span>Carregando alterações da família...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-500 text-sm space-y-2">
          <History className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-semibold">Nenhuma atividade registrada nesta categoria até o momento.</p>
          <p className="text-xs text-slate-400">
            Conforme as aferições e missões forem salvas, elas aparecerão aqui automaticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            return (
              <div
                key={log.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-blue-400 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 font-bold">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">
                        {log.user_name}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {log.user_role === 'caregiver'
                          ? 'Cuidadora'
                          : log.user_role === 'admin_family'
                          ? 'Familiar (Admin)'
                          : 'Familiar'}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getCategoryColor(
                          log.category
                        )}`}
                      >
                        {log.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium">
                      {log.description}
                    </p>

                    {log.details && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono text-[11px]">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 self-end sm:self-center">
                  <div className="text-xs font-semibold text-slate-700">
                    {new Date(log.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(log.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
