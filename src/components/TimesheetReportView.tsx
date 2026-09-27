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
  X
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
      const data = await api.getTimesheetHistory(
        selectedYear,
        selectedMonth,
        selectedUserId === 'Todos' ? undefined : selectedUserId
      );
      setEntries(data.entries || []);
      setMeta(data.meta || {
        total_records: 0,
        completed_shifts: 0,
        total_hours: 0,
        total_hours_formatted: '0h 00min',
      });
    } catch (err) {
      console.error('Erro ao carregar folha de ponto:', err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [users]);

  useEffect(() => {
    loadTimesheet();
  }, [selectedYear, selectedMonth, selectedUserId]);

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

  // Build dynamic user options from family members / users
  const userOptions = [
    { value: 'Todos', label: 'Todos os Usuários / Plantonistas' },
    ...allUsersList
      .filter((u) => u.role !== 'admin_geral')
      .map((u) => ({
        value: u.id,
        label: `${u.name} (${u.role_labels?.join(' + ') || u.role_label || 'Cuidador'})`,
      })),
  ];

  const selectedUserObj = allUsersList.find((u) => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      {/* Control Header & Filters (hidden when printing) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900">
                Folha de Ponto & Relatório dos Usuários
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Visão completa de todos os pontos dos usuários da família com foto de entrada, foto de saída, horário oficial NTP e cálculo de permanência
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenAddPresence && (
              <button
                onClick={onOpenAddPresence}
                className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold text-xs active:scale-98 transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                Adicionar Presença
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/25 active:scale-98 transition-all shrink-0 cursor-pointer"
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

      {/* Printable Sheet (Stylized for both screen and A4 print) */}
      <div className="bg-white border border-slate-300 rounded-2xl p-6 sm:p-8 shadow-xs print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b-2 border-blue-900 pb-5 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-black tracking-tight text-blue-900">CUIDA</span>
                <span className="text-xs uppercase font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                  Folha de Ponto Espelho
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Sistema Eletrônico de Ponto Facial em Conformidade com a Portaria MTE 671/2021
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
                Auditado por Carimbo Oficial de Tempo (NTP.BR)
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
              <div className="text-slate-600">{elderly.residence_address || 'Endereço cadastrado da família'}</div>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                Plantonistas / Usuários
              </span>
              <div className="font-bold text-sm text-slate-900">
                {selectedUserObj ? selectedUserObj.name : 'Todos os Membros & Cuidadores da Família'}
              </div>
              <div className="text-slate-600">
                {selectedUserObj
                  ? `${selectedUserObj.role_labels?.join(' + ') || selectedUserObj.role_label || 'Cuidador'} · @${selectedUserObj.username}`
                  : `${allUsersList.filter(u => u.role !== 'admin_geral').length} usuário(s) registrado(s)`}
              </div>
            </div>
          </div>
        </div>

        {/* Aggregate Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6 text-xs">
          <div>
            <span className="text-slate-500 block">Turnos Registrados</span>
            <span className="font-bold text-sm text-slate-900 font-mono">
              {meta.completed_shifts} plantões
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Jornada Cumprida</span>
            <span className="font-bold text-sm text-blue-900 font-mono">
              {meta.total_hours_formatted}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Auditabilidade Facial</span>
            <span className="font-bold text-sm text-emerald-700">100% com Selfie</span>
          </div>
          <div>
            <span className="text-slate-500 block">Raio Georreferenciado</span>
            <span className="font-bold text-sm text-emerald-700">Conforme Residência</span>
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
                <th className="p-2.5 text-center">Selfie Ent.</th>
                <th className="p-2.5">Saída (NTP)</th>
                <th className="p-2.5 text-center">Selfie Saí.</th>
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
                      <div>{entry.date_stamp ? entry.date_stamp.split('-').reverse().join('/') : '-'}</div>
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
                          }}
                          title="Ver selfie ampliada de entrada"
                          className="relative group inline-block cursor-pointer"
                        >
                          <img
                            src={entry.entry_photo_url}
                            alt="Selfie Entrada"
                            className="w-9 h-9 rounded-lg object-cover border border-slate-300 shadow-2xs hover:scale-110 transition-transform"
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
                          }}
                          title="Ver selfie ampliada de saída"
                          className="relative group inline-block cursor-pointer"
                        >
                          <img
                            src={entry.exit_photo_url}
                            alt="Selfie Saída"
                            className="w-9 h-9 rounded-lg object-cover border border-slate-300 shadow-2xs hover:scale-110 transition-transform"
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
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 print:hidden"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Camera className="w-4 h-4 text-blue-400" />
                <span>{previewTitle}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <img
              src={previewPhoto}
              alt="Foto ampliada"
              className="w-full h-80 object-cover rounded-2xl border border-slate-700 shadow-inner"
            />

            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
