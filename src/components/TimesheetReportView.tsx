import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Calendar,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Plus,
  Users,
  MapPin,
  Camera,
  X,
  LayoutGrid,
  Table as TableIcon,
  ZoomIn,
  AlertCircle,
  Building2,
  Sparkles
} from 'lucide-react';
import { ElderlyProfile, TimeEntry, User } from '../types';
import { api } from '../services/api';
import { AnimatedSelect } from './AnimatedChoiceSelect';

interface TimesheetReportViewProps {
  elderly: ElderlyProfile;
  users?: User[];
  currentUser?: User;
  onOpenAddPresence?: () => void;
}

export const TimesheetReportView: React.FC<TimesheetReportViewProps> = ({
  elderly,
  users = [],
  currentUser,
  onOpenAddPresence,
}) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [allUsersList, setAllUsersList] = useState<User[]>(users);
  const [displayMode, setDisplayMode] = useState<'cards' | 'table'>('cards');
  const [meta, setMeta] = useState({
    total_records: 0,
    completed_shifts: 0,
    total_hours: 0,
    total_hours_formatted: '0h 00min',
  });

  const now = new Date();
  const currentYearStr = String(now.getFullYear());
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');

  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedUserId, setSelectedUserId] = useState('Todos');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('Selfie de Ponto');
  const [previewSubtitle, setPreviewSubtitle] = useState<string>('');

  const loadUsers = async () => {
    if (users && users.length > 0) {
      setAllUsersList(users);
      return;
    }
    try {
      const fetched = await api.fetchUsers();
      if (fetched && fetched.length > 0) {
        setAllUsersList(fetched);
      }
    } catch (err) {
      console.warn('Erro ao carregar usuários:', err);
    }
  };

  const loadTimesheet = async () => {
    try {
      const effectiveFamilyId =
        currentUser?.family_id ||
        allUsersList.find((u) => u.id === currentUser?.id)?.family_id ||
        allUsersList.find((u) => u.family_id)?.family_id ||
        undefined;

      const data = await api.getTimesheetHistory(
        selectedYear,
        selectedMonth,
        selectedUserId === 'Todos' ? undefined : selectedUserId,
        effectiveFamilyId
      );

      setEntries(data.entries || []);
      setMeta(
        data.meta || {
          total_records: 0,
          completed_shifts: 0,
          total_hours: 0,
          total_hours_formatted: '0h 00min',
        }
      );
    } catch (err) {
      console.error('Erro ao carregar folha de ponto:', err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [users]);

  useEffect(() => {
    loadTimesheet();
  }, [selectedYear, selectedMonth, selectedUserId, currentUser?.family_id, allUsersList]);

  const handlePrint = () => {
    window.print();
  };

  const monthNames: Record<string, string> = {
    '01': 'Janeiro',
    '02': 'Fevereiro',
    '03': 'Março',
    '04': 'Abril',
    '05': 'Maio',
    '06': 'Junho',
    '07': 'Julho',
    '08': 'Agosto',
    '09': 'Setembro',
    '10': 'Outubro',
    '11': 'Novembro',
    '12': 'Dezembro',
  };

  const effectiveFamilyId =
    currentUser?.family_id ||
    allUsersList.find((u) => u.id === currentUser?.id)?.family_id ||
    allUsersList.find((u) => u.family_id)?.family_id;

  // Build dynamic user options from family members / users
  const familyUsersList = allUsersList.filter(
    (u) =>
      u.role !== 'admin_geral' &&
      (!effectiveFamilyId || currentUser?.role === 'admin_geral' || u.family_id === effectiveFamilyId || !u.family_id)
  );

  const userOptions = [
    { value: 'Todos', label: 'Todos os Usuários / Plantonistas da Família' },
    ...familyUsersList.map((u) => ({
      value: u.id,
      label: `${u.name} (${u.role_labels?.join(' + ') || u.role_label || 'Cuidador'})`,
    })),
  ];

  const selectedUserObj = allUsersList.find((u) => u.id === selectedUserId);

  const isFamilyAdmin =
    currentUser?.role === 'admin_family' || currentUser?.roles?.includes('admin_family');

  return (
    <div className="space-y-6">
      {/* Family Admin Special Notice Banner */}
      {isFamilyAdmin && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-blue-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                Painel do Administrador Familiar
              </span>
              <span className="text-xs text-blue-200">· Vínculo Familiar Ativo</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Fotos dos Pontos de Todos os Clientes da Família
            </h2>
            <p className="text-xs text-blue-200/80 max-w-2xl">
              Como Administrador da Família, você tem acesso irrestrito às fotos de entrada (Check-in) e saída (Check-out) de todos os colaboradores e cuidadores vinculados à residência.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 text-center">
              <span className="text-[10px] text-blue-200 block uppercase font-bold">Total Registrado</span>
              <span className="text-base font-extrabold text-amber-300 font-mono">
                {meta.total_records} pontos
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Control Header & Filters (hidden when printing) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h1 className="text-xl font-bold text-slate-900">
                Folha de Ponto & Relatório dos Usuários
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Visão completa de todos os pontos dos usuários da família com foto de entrada, foto de saída, horário oficial NTP e cálculo de permanência.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setDisplayMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  displayMode === 'cards'
                    ? 'bg-white text-blue-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Visualização em galeria com destaque para as fotos dos pontos"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Fotos dos Pontos ({entries.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDisplayMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  displayMode === 'table'
                    ? 'bg-white text-blue-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Visualização em tabela espelho formal (Portaria 671)"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Tabela Espelho</span>
              </button>
            </div>

            {onOpenAddPresence && (
              <button
                onClick={onOpenAddPresence}
                className="inline-flex items-center gap-2 py-2 px-3.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold text-xs active:scale-98 transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                Adicionar Presença
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/25 active:scale-98 transition-all shrink-0 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir / PDF
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div>
            <AnimatedSelect
              label="Mês de Referência"
              value={selectedMonth}
              onChange={(val) => setSelectedMonth(val)}
              options={Object.entries(monthNames).map(([val, name]) => ({
                value: val,
                label: name,
              }))}
            />
          </div>

          <div>
            <AnimatedSelect
              label="Ano"
              value={selectedYear}
              onChange={(val) => setSelectedYear(val)}
              options={[
                { value: '2026', label: '2026' },
                { value: '2025', label: '2025' },
              ]}
            />
          </div>

          <div>
            <AnimatedSelect
              label="Colaborador / Usuário"
              value={selectedUserId}
              onChange={(val) => setSelectedUserId(val)}
              options={userOptions}
            />
          </div>
        </div>
      </div>

      {/* Aggregate Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border border-slate-200 rounded-2xl p-4 text-xs shadow-xs">
        <div>
          <span className="text-slate-500 block">Turnos Registrados</span>
          <span className="font-bold text-base text-slate-900 font-mono">
            {meta.completed_shifts} plantões
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Jornada Cumprida</span>
          <span className="font-bold text-base text-blue-900 font-mono">
            {meta.total_hours_formatted}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Fotos Auditadas</span>
          <span className="font-bold text-base text-emerald-700 flex items-center gap-1">
            <Camera className="w-4 h-4" /> 100% com Selfie
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Vínculo Familiar</span>
          <span className="font-bold text-base text-indigo-700">
            {effectiveFamilyId ? 'Família Vinculada (OK)' : 'Geral'}
          </span>
        </div>
      </div>

      {/* Mode 1: Cards View with Full Photos (Auditoria Visual com Fotos) */}
      {displayMode === 'cards' && (
        <div className="space-y-4 print:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-600" />
              <span>Fotos dos Pontos dos Clientes & Cuidadores ({entries.length})</span>
            </h2>
            <span className="text-xs text-slate-500">
              Clique em qualquer foto para ampliar e auditar
            </span>
          </div>

          {entries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">Nenhum ponto registrado para o filtro selecionado.</p>
              <p className="text-xs text-slate-400">
                Assim que um colaborador bater o ponto com selfie, a foto aparecerá aqui em tempo real.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {entries.map((entry) => {
                const entryDate = new Date(entry.entry_time);
                const entryTimeStr = entryDate.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const exitTimeStr = entry.exit_time
                  ? new Date(entry.exit_time).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : null;

                const formattedDate = entry.date_stamp
                  ? entry.date_stamp.split('-').reverse().join('/')
                  : entryDate.toLocaleDateString('pt-BR');

                return (
                  <div
                    key={entry.id}
                    className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl shadow-xs overflow-hidden flex flex-col transition-all hover:shadow-md"
                  >
                    {/* Card Header */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 font-extrabold text-sm flex items-center justify-center shrink-0 border border-blue-200">
                          {entry.user_name ? entry.user_name.slice(0, 2).toUpperCase() : 'US'}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {entry.user_name || 'Colaborador da Família'}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span className="font-medium">{formattedDate}</span>
                            <span>·</span>
                            <span className="text-slate-600 font-semibold">{entry.day_of_week}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                            entry.exit_time
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse'
                          }`}
                        >
                          {entry.exit_time ? 'Concluído' : 'Em Andamento'}
                        </span>
                      </div>
                    </div>

                    {/* Photos Container: Side-by-side or stacked */}
                    <div className="p-4 grid grid-cols-2 gap-3.5 bg-slate-50/30 flex-1">
                      {/* Photo 1: Check-in Entrada */}
                      <div className="space-y-1.5 flex flex-col">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Entrada
                          </span>
                          <span className="font-mono font-bold text-slate-800">{entryTimeStr}</span>
                        </div>

                        <div className="relative group rounded-xl overflow-hidden border-2 border-emerald-500/40 bg-slate-900 aspect-square flex-1 shadow-2xs">
                          {entry.entry_photo_url ? (
                            <img
                              src={entry.entry_photo_url}
                              alt={`Selfie Entrada - ${entry.user_name}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 cursor-pointer"
                              onClick={() => {
                                setPreviewPhoto(entry.entry_photo_url);
                                setPreviewTitle(`Selfie de Entrada · ${entry.user_name}`);
                                setPreviewSubtitle(`Horário oficial: ${entryTimeStr} (${formattedDate})`);
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center text-[10px]">
                              <Camera className="w-6 h-6 mb-1 text-slate-500" />
                              <span>Sem foto registrada</span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (entry.entry_photo_url) {
                                setPreviewPhoto(entry.entry_photo_url);
                                setPreviewTitle(`Selfie de Entrada · ${entry.user_name}`);
                                setPreviewSubtitle(`Horário oficial: ${entryTimeStr} (${formattedDate})`);
                              }
                            }}
                            className="absolute bottom-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-xs transition-opacity cursor-pointer"
                            title="Ampliar foto de entrada"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[10px] text-center text-emerald-700 font-semibold block">
                          Selfie de Entrada
                        </span>
                      </div>

                      {/* Photo 2: Check-out Saída */}
                      <div className="space-y-1.5 flex flex-col">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-blue-800 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            Saída
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {exitTimeStr || '--:--'}
                          </span>
                        </div>

                        <div className="relative group rounded-xl overflow-hidden border-2 border-blue-500/40 bg-slate-900 aspect-square flex-1 shadow-2xs">
                          {entry.exit_photo_url ? (
                            <img
                              src={entry.exit_photo_url}
                              alt={`Selfie Saída - ${entry.user_name}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 cursor-pointer"
                              onClick={() => {
                                setPreviewPhoto(entry.exit_photo_url);
                                setPreviewTitle(`Selfie de Saída · ${entry.user_name}`);
                                setPreviewSubtitle(`Horário oficial: ${exitTimeStr} (${formattedDate})`);
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center text-[10px]">
                              <Clock className="w-6 h-6 mb-1 text-amber-400 animate-spin" />
                              <span className="text-amber-300 font-bold">Plantão em Aberto</span>
                              <span className="text-[9px] text-slate-400 mt-0.5">Aguardando saída com foto</span>
                            </div>
                          )}

                          {entry.exit_photo_url && (
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewPhoto(entry.exit_photo_url);
                                setPreviewTitle(`Selfie de Saída · ${entry.user_name}`);
                                setPreviewSubtitle(`Horário oficial: ${exitTimeStr} (${formattedDate})`);
                              }}
                              className="absolute bottom-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-xs transition-opacity cursor-pointer"
                              title="Ampliar foto de saída"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <span className="text-[10px] text-center text-blue-700 font-semibold block">
                          {entry.exit_photo_url ? 'Selfie de Saída' : 'Aguardando saída'}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer: Permanência, Geolocalização & Vínculo */}
                    <div className="p-3.5 border-t border-slate-100 bg-white text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Permanência Total:</span>
                        <span className="font-mono font-bold text-blue-900">
                          {entry.total_hours_formatted || 'Em andamento'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Perímetro Auditado:</span>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {entry.distance_meters !== undefined ? `${entry.distance_meters}m (No Raio)` : 'No Raio (Auditado)'}
                        </span>
                      </div>

                      {entry.notes && (
                        <div className="text-[11px] text-slate-500 truncate pt-1 border-t border-slate-100">
                          {entry.notes}
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

      {/* Mode 2: Detailed Printable Sheet (Tabela Espelho Oficial MTE 671) */}
      <div
        className={`bg-white border border-slate-300 rounded-2xl p-6 sm:p-8 shadow-xs print:border-none print:shadow-none print:p-0 ${
          displayMode === 'cards' ? 'hidden print:block' : 'block'
        }`}
      >
        {/* Document Header */}
        <div className="border-b-2 border-blue-900 pb-5 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-black tracking-tight text-blue-900">CUIDA</span>
                <span className="text-xs uppercase font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                  Folha de Ponto Espelho & Auditoria Facial
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Sistema Eletrônico de Ponto Facial e Certificação de Presença em Conformidade com a Portaria MTE 671/2021
              </p>
            </div>

            <div className="text-right text-xs text-slate-600 space-y-0.5">
              <div>
                Competência:{' '}
                <strong className="text-slate-900">
                  {monthNames[selectedMonth]} de {selectedYear}
                </strong>
              </div>
              <div>
                Emissão:{' '}
                <span className="font-mono">
                  {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
                </span>
              </div>
              <div className="text-[11px] text-blue-700 font-semibold">
                Auditado por Carimbo Oficial de Tempo (NTP.BR) & Fotos
              </div>
            </div>
          </div>

          {/* Parties Info Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200 text-xs">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                Beneficiário dos Cuidados
              </span>
              <div className="font-bold text-sm text-slate-900">{elderly.full_name}</div>
              <div className="text-slate-600">
                {elderly.residence_address || 'Endereço cadastrado da família'}
              </div>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                Plantonistas / Usuários Vinculados
              </span>
              <div className="font-bold text-sm text-slate-900">
                {selectedUserObj ? selectedUserObj.name : 'Todos os Membros & Cuidadores da Família'}
              </div>
              <div className="text-slate-600">
                {selectedUserObj
                  ? `${selectedUserObj.role_labels?.join(' + ') || selectedUserObj.role_label || 'Cuidador'} · @${selectedUserObj.username}`
                  : `${familyUsersList.length} usuário(s) registrado(s) na família`}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Timesheet Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-blue-900 text-white font-bold">
                <th className="p-2.5 rounded-l-lg">Usuário / Membro</th>
                <th className="p-2.5">Data & Dia</th>
                <th className="p-2.5">Entrada (NTP)</th>
                <th className="p-2.5 text-center">Foto Entrada</th>
                <th className="p-2.5">Saída (NTP)</th>
                <th className="p-2.5 text-center">Foto Saída</th>
                <th className="p-2.5">Permanência</th>
                <th className="p-2.5">Geolocalização</th>
                <th className="p-2.5 rounded-r-lg">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-500">
                    Nenhum registro de ponto encontrado para o filtro selecionado.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    {/* User Name */}
                    <td className="p-2.5 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{entry.user_name || 'Usuário'}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="p-2.5 font-medium text-slate-800 whitespace-nowrap">
                      <div>
                        {entry.date_stamp ? entry.date_stamp.split('-').reverse().join('/') : '-'}
                      </div>
                      <div className="text-[10px] text-slate-500">{entry.day_of_week}</div>
                    </td>

                    {/* Entry Time */}
                    <td className="p-2.5 font-mono font-semibold text-slate-800">
                      {new Date(entry.entry_time).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Entry Photo Thumbnail */}
                    <td className="p-2.5 text-center">
                      {entry.entry_photo_url ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewPhoto(entry.entry_photo_url || null);
                            setPreviewTitle(`Selfie de Entrada · ${entry.user_name}`);
                            setPreviewSubtitle(
                              `Horário oficial: ${new Date(entry.entry_time).toLocaleTimeString('pt-BR')}`
                            );
                          }}
                          title="Ver selfie ampliada de entrada"
                          className="relative group inline-block cursor-pointer"
                        >
                          <img
                            src={entry.entry_photo_url}
                            alt="Selfie Entrada"
                            className="w-11 h-11 rounded-xl object-cover border-2 border-emerald-400 shadow-2xs hover:scale-115 transition-transform"
                          />
                        </button>
                      ) : (
                        <span className="text-slate-400 font-mono">--</span>
                      )}
                    </td>

                    {/* Exit Time */}
                    <td className="p-2.5 font-mono font-semibold text-slate-800">
                      {entry.exit_time
                        ? new Date(entry.exit_time).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '--:--'}
                    </td>

                    {/* Exit Photo Thumbnail */}
                    <td className="p-2.5 text-center">
                      {entry.exit_photo_url ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewPhoto(entry.exit_photo_url || null);
                            setPreviewTitle(`Selfie de Saída · ${entry.user_name}`);
                            setPreviewSubtitle(
                              `Horário oficial: ${new Date(entry.exit_time!).toLocaleTimeString('pt-BR')}`
                            );
                          }}
                          title="Ver selfie ampliada de saída"
                          className="relative group inline-block cursor-pointer"
                        >
                          <img
                            src={entry.exit_photo_url}
                            alt="Selfie Saída"
                            className="w-11 h-11 rounded-xl object-cover border-2 border-blue-400 shadow-2xs hover:scale-115 transition-transform"
                          />
                        </button>
                      ) : (
                        <span className="text-slate-400 font-mono">--</span>
                      )}
                    </td>

                    {/* Permanence */}
                    <td className="p-2.5 font-mono font-bold text-blue-900">
                      {entry.total_hours_formatted || 'Em aberto'}
                    </td>

                    {/* Geofence */}
                    <td className="p-2.5">
                      <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-200 whitespace-nowrap">
                        {entry.distance_meters !== undefined ? `${entry.distance_meters}m (OK)` : 'No Raio'}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="p-2.5 text-[11px] text-slate-600 max-w-xs truncate">
                      {entry.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 print:hidden"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Camera className="w-4 h-4 text-blue-400" />
                  <span>{previewTitle}</span>
                </div>
                {previewSubtitle && (
                  <p className="text-xs text-slate-400 font-mono">{previewSubtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-inner bg-black">
              <img
                src={previewPhoto}
                alt="Foto ampliada"
                className="w-full h-80 object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 bg-black/75 backdrop-blur-xs rounded-xl border border-white/10 text-[11px] text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Foto Auditada &amp; Autêntica
                </span>
                <span className="font-mono text-slate-400">NTP.BR Sincronizado</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md"
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
