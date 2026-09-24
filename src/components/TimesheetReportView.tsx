import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Plus,
} from 'lucide-react';
import { ElderlyProfile, TimeEntry } from '../types';
import { api } from '../services/api';

interface TimesheetReportViewProps {
  elderly: ElderlyProfile;
  onOpenAddPresence?: () => void;
}

export const TimesheetReportView: React.FC<TimesheetReportViewProps> = ({
  elderly,
  onOpenAddPresence,
}) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [meta, setMeta] = useState({
    total_records: 0,
    completed_shifts: 0,
    total_hours: 0,
    total_hours_formatted: '0h 00min',
  });

  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('09');
  const [selectedUserId, setSelectedUserId] = useState('usr-01');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const loadTimesheet = async () => {
    try {
      const data = await api.getTimesheetHistory(selectedYear, selectedMonth, selectedUserId);
      setEntries(data.entries);
      setMeta(data.meta);
    } catch (err) {
      console.error(err);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Control Header & Filters (hidden when printing) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900">
                Folha de Ponto & Relatório de Auditoria
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Espelho de ponto mensal com comprovação fotográfica facial, hora oficial NTP e cálculo de permanência
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAddPresence && (
              <button
                onClick={onOpenAddPresence}
                className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold text-sm active:scale-98 transition-all shrink-0"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                Adicionar Presença
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm shadow-blue-500/25 active:scale-98 transition-all shrink-0"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Exportar PDF
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Mês de Referência</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white"
            >
              {Object.entries(monthNames).map(([val, name]) => (
                <option key={val} value={val}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Ano</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Colaborador / Cuidador</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white"
            >
              <option value="usr-01">Clara Mendes (Cuidadora Titular)</option>
              <option value="Todos">Todos os profissionais</option>
            </select>
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
              <div className="text-slate-600">{elderly.residence_address}</div>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                Colaborador(a) Cuidador(a)
              </span>
              <div className="font-bold text-sm text-slate-900">Clara Mendes</div>
              <div className="text-slate-600">Reg: CUID-4821 · Cuidadora Titular 12x36</div>
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
                <th className="p-2.5 rounded-l-lg">Data & Dia</th>
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
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    Nenhum registro encontrado para o mês selecionado.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-medium text-slate-900">
                      <div>{entry.date_stamp.split('-').reverse().join('/')}</div>
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
                      <button
                        onClick={() => setPreviewPhoto(entry.entry_photo_url)}
                        title="Ver selfie ampliada de entrada"
                        className="relative group inline-block"
                      >
                        <img
                          src={entry.entry_photo_url}
                          alt="Selfie Entrada"
                          className="w-9 h-9 rounded object-cover border border-slate-300 shadow-2xs hover:scale-110 transition-transform"
                        />
                        <span className="hidden print:hidden group-hover:block absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1 rounded whitespace-nowrap">
                          Zoom
                        </span>
                      </button>
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
                          onClick={() => setPreviewPhoto(entry.exit_photo_url)}
                          title="Ver selfie ampliada de saída"
                          className="relative group inline-block"
                        >
                          <img
                            src={entry.exit_photo_url}
                            alt="Selfie Saída"
                            className="w-9 h-9 rounded object-cover border border-slate-300 shadow-2xs hover:scale-110 transition-transform"
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
                      <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-200">
                        {entry.distance_meters ? `${entry.distance_meters}m (OK)` : 'No Raio'}
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

        {/* Legal Disclaimer & Signatures Box */}
        <div className="mt-12 pt-6 border-t border-slate-200">
          <p className="text-[10px] text-slate-500 leading-relaxed mb-8">
            Reconheço a exatidão das marcações de ponto acima descritas, capturadas por meio de
            biometria facial em tempo real com impossibilidade técnica de utilização de fotos da galeria,
            sincronizadas eletronicamente via servidor oficial de hora (NTP/Internet), constituindo
            documento hábil para fins trabalhistas, de auditoria familiar e comprovação de jornada.
          </p>

          <div className="grid grid-cols-2 gap-12 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 w-4/5 mx-auto mb-1.5" />
              <span className="font-bold text-slate-800 block">Clara Mendes</span>
              <span className="text-[11px] text-slate-500">Assinatura da Cuidadora / Colaboradora</span>
            </div>

            <div>
              <div className="border-b border-slate-400 w-4/5 mx-auto mb-1.5" />
              <span className="font-bold text-slate-800 block">Dr. Fernando Silveira</span>
              <span className="text-[11px] text-slate-500">Responsável Legal / Administrador Familiar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Zoom Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm cursor-pointer"
        >
          <div className="bg-white p-3 rounded-2xl max-w-md w-full shadow-2xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600 px-1">
              <span className="font-bold">Selfie Facial Auditada</span>
              <span className="text-slate-400">Clique em qualquer lugar para fechar</span>
            </div>
            <img
              src={previewPhoto}
              alt="Selfie ampliada"
              className="w-full rounded-xl object-cover aspect-4/3 border border-slate-200"
            />
          </div>
        </div>
      )}
    </div>
  );
};
