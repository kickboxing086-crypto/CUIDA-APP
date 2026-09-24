import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { FamilyActivityLog } from '../types';

export function useNotifications(userId?: string, familyId: string = 'fam-01') {
  const [logs, setLogs] = useState<FamilyActivityLog[]>([]);
  const [readIds, setReadIds] = useState<string[]>(() => {
    if (!userId) return [];
    try {
      const saved = localStorage.getItem(`cuida_read_logs_${userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync read IDs with localStorage when user changes
  useEffect(() => {
    if (!userId) return;
    try {
      const saved = localStorage.getItem(`cuida_read_logs_${userId}`);
      setReadIds(saved ? JSON.parse(saved) : []);
    } catch {
      setReadIds([]);
    }
  }, [userId]);

  const fetchLogs = useCallback(async () => {
    try {
      const data = await api.getFamilyActivityLogs(familyId);
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (err) {
      console.warn('[useNotifications] Falha ao carregar logs de atividade:', err);
    }
  }, [familyId]);

  // Initial load and periodic polling for real-time alerts
  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 8000); // 8-second live sync
    return () => clearInterval(interval);
  }, [fetchLogs]);

  // Unread logs are those whose IDs are not in readIds
  const unreadLogs = logs.filter((log) => !readIds.includes(log.id));
  const unreadIds = unreadLogs.map((log) => log.id);
  const unreadCount = unreadLogs.length;

  // Unread count per category
  const categoryUnreadCounts: Record<string, number> = {
    'Obrigações Diárias': unreadLogs.filter((l) => l.category === 'Obrigações Diárias').length,
    'Sinais Vitais': unreadLogs.filter((l) => l.category === 'Sinais Vitais').length,
    'Medicamentos': unreadLogs.filter((l) => l.category === 'Medicamentos').length,
    'Boletim do Idoso': unreadLogs.filter((l) => l.category === 'Boletim do Idoso').length,
    'Controle de Ponto': unreadLogs.filter((l) => l.category === 'Controle de Ponto').length,
    'Mural': unreadLogs.filter((l) => l.category === 'Mural').length,
  };

  const markAsRead = useCallback(
    (logId: string) => {
      setReadIds((prev) => {
        if (prev.includes(logId)) return prev;
        const next = [...prev, logId];
        if (userId) {
          try {
            localStorage.setItem(`cuida_read_logs_${userId}`, JSON.stringify(next));
          } catch {}
        }
        return next;
      });
    },
    [userId]
  );

  const markAllAsRead = useCallback(() => {
    const allIds = logs.map((l) => l.id);
    setReadIds(allIds);
    if (userId) {
      try {
        localStorage.setItem(`cuida_read_logs_${userId}`, JSON.stringify(allIds));
      } catch {}
    }
  }, [logs, userId]);

  return {
    logs,
    unreadLogs,
    unreadIds,
    unreadCount,
    categoryUnreadCounts,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchLogs,
    isLoading,
  };
}
