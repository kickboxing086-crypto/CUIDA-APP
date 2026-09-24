import React, { useEffect, useState } from 'react';
import { Clock, ShieldCheck, Wifi } from 'lucide-react';
import { api, generateLocalOfficialTime } from '../services/api';
import { OfficialServerTime } from '../types';

export const OfficialClockBadge: React.FC = () => {
  const [serverTime, setServerTime] = useState<OfficialServerTime>(generateLocalOfficialTime());
  const [currentDisplayTime, setCurrentDisplayTime] = useState<string>('00:00:00');
  const [offsetMs, setOffsetMs] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'warning'>('syncing');

  // Synchronize with server time every 30 seconds to adjust drift
  useEffect(() => {
    let isMounted = true;

    async function syncClock() {
      try {
        setSyncStatus('syncing');
        const start = performance.now();
        const res = await api.getOfficialTime();
        const latency = (performance.now() - start) / 2;
        const serverEpoch = res.epoch_ms + latency;
        const drift = serverEpoch - Date.now();

        if (isMounted) {
          setOffsetMs(drift);
          setServerTime(res);
          setSyncStatus('synced');
        }
      } catch (err) {
        if (isMounted) setSyncStatus('warning');
      }
    }

    syncClock();
    const syncInterval = setInterval(syncClock, 30000);

    return () => {
      isMounted = false;
      clearInterval(syncInterval);
    };
  }, []);

  // Update dynamic ticking seconds locally corrected by the server offset
  useEffect(() => {
    const tick = () => {
      const adjustedDate = new Date(Date.now() + offsetMs);
      const hours = String(adjustedDate.getHours()).padStart(2, '0');
      const minutes = String(adjustedDate.getMinutes()).padStart(2, '0');
      const seconds = String(adjustedDate.getSeconds()).padStart(2, '0');
      setCurrentDisplayTime(`${hours}:${minutes}:${seconds}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [offsetMs]);

  return (
    <div className="bg-white border border-blue-200/80 rounded-xl p-3 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Dynamic Calendar Date */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="font-semibold text-blue-900">{serverTime.day_of_week}</span>
              <span aria-hidden="true">·</span>
              <span>{serverTime.day_of_month} de {serverTime.month_name} de {serverTime.year}</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 tracking-tight font-mono">
              {currentDisplayTime}
            </div>
          </div>
        </div>

        {/* Right: Security NTP stamp */}
        <div className="flex items-center gap-2 text-xs border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
          <div className="flex items-center gap-1.5 bg-blue-50/80 text-blue-800 px-2.5 py-1 rounded-md border border-blue-200/60 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>NTP Oficial Auditado (BRT)</span>
          </div>
          <div
            className={`w-2 h-2 rounded-full ${
              syncStatus === 'synced'
                ? 'bg-emerald-500 ring-2 ring-emerald-200 animate-pulse'
                : 'bg-amber-500'
            }`}
            title="Conexão com servidor oficial de hora ativo"
          />
        </div>
      </div>
    </div>
  );
};
