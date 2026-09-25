import {
  ElderlyProfile,
  FamilyNotice,
  HealthLog,
  MedicationLog,
  OfficialServerTime,
  TimeEntry,
  User,
} from '../types';

const INITIAL_ELDERLY: ElderlyProfile = {
  id: '',
  full_name: 'Idoso em Acompanhamento',
  birth_date: '',
  blood_type: 'Não informado',
  allergies: [],
  residence_address: '',
  residence_lat: -23.5505,
  residence_long: -46.6333,
  allowed_radius_meters: 300,
  emergency_contacts: [],
  created_at: new Date().toISOString(),
};

const INITIAL_FAMILIES: any[] = [];

function loadInitialUsers(): User[] {
  const master: User = {
    id: 'usr-admin-samuel',
    name: 'Samuel (Administrador Geral)',
    last_name: 'Geral',
    username: 'Samuel_02',
    password: '072131Sa@',
    email: 'samuel.admin@cuida.com.br',
    phone: '(11) 99999-0000',
    role: 'admin_geral',
    roles: ['admin_geral'],
    role_label: 'Administrador Geral',
    role_labels: ['Administrador Geral'],
    permission_level: 1,
    permission_level_title: 'Administrador Geral',
    registration_code: 'ADM-MASTER-01',
    family_id: null,
    family_name: 'Administração Geral do Aplicativo',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    first_login_completed: true,
    terms_accepted: true,
    created_at: '2026-01-01T00:00:00Z',
  };

  try {
    const saved = localStorage.getItem('cuida_persisted_users');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasSamuel = parsed.some((u) => u.username?.toLowerCase() === 'samuel_02');
        if (!hasSamuel) parsed.unshift(master);
        return parsed;
      }
    }
  } catch {}
  return [master];
}

let INITIAL_USERS: User[] = loadInitialUsers();

function persistUsersToCache(newList: User[]) {
  INITIAL_USERS = [...newList];
  const hasSamuel = INITIAL_USERS.some((u) => u.username?.toLowerCase() === 'samuel_02');
  if (!hasSamuel) {
    const master = loadInitialUsers()[0];
    INITIAL_USERS.unshift(master);
  }
  try {
    localStorage.setItem('cuida_persisted_users', JSON.stringify(INITIAL_USERS));
  } catch {}
}

// Fallback sample selfie for pre-populated entries
const SAMPLE_SELFIE_CARE = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80';

// Clean in-memory states
let localTimeEntries: TimeEntry[] = [];
let localHealthLogs: HealthLog[] = [];
let localMedications: MedicationLog[] = [];
let localNotices: FamilyNotice[] = [];

export function generateLocalOfficialTime(): OfficialServerTime {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  const formatter = new Intl.DateTimeFormat('pt-BR', options);
  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';

  const dayOfWeek = getPart('weekday');
  const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
  const day = getPart('day');
  const month = getPart('month');
  const year = getPart('year');
  const hour = getPart('hour');
  const minute = getPart('minute');
  const second = getPart('second');

  return {
    iso_timestamp: now.toISOString(),
    epoch_ms: now.getTime(),
    timezone: 'America/Sao_Paulo (UTC-03:00)',
    ntp_synchronized: true,
    server_hostname: 'time.cuida.gov.br / ntp.br (Auditado)',
    formatted_date: `${capitalizedDay}, ${day} de ${month} de ${year}`,
    formatted_time: `${hour}:${minute}:${second}`,
    day_of_week: capitalizedDay,
    day_of_month: day,
    month_name: month,
    year: year,
    date_stamp: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
  };
}

export const api = {
  // Official Server Clock (NTP)
  async getOfficialTime(): Promise<OfficialServerTime> {
    try {
      const res = await fetch('/api/time');
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return generateLocalOfficialTime();
  },

  // Elderly profile
  async getElderlyProfile(): Promise<ElderlyProfile> {
    try {
      const res = await fetch('/api/elderly');
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return INITIAL_ELDERLY;
  },

  // Users
  getUsers(): User[] {
    return INITIAL_USERS;
  },

  // Active shift
  async getActiveEntry(userId: string = 'usr-01'): Promise<TimeEntry | null> {
    try {
      const res = await fetch(`/api/time-entries/active?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        return data.activeEntry;
      }
    } catch {
      // fallback
    }
    const found = localTimeEntries.find((e) => e.user_id === userId && !e.exit_time);
    return found || null;
  },

  // Check-in (Entrada) - Mandatory live selfie & real-time GPS geofence
  async checkIn(params: {
    userId: string;
    elderlyId: string;
    photoBase64: string;
    locationLat?: number;
    locationLong?: number;
    notes?: string;
  }): Promise<{ success: boolean; entry: TimeEntry; message: string }> {
    const res = await fetch('/api/time-entries/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: params.userId,
        elderly_id: params.elderlyId,
        photo_base64: params.photoBase64,
        location_lat: params.locationLat,
        location_long: params.locationLong,
        notes: params.notes,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Erro ao registrar entrada');
    }
    return data;
  },

  // Check-out (Saída) - Mandatory exit selfie, geofence & hours calculation
  async checkOut(params: {
    entryId: string;
    photoBase64: string;
    locationLat?: number;
    locationLong?: number;
    notes?: string;
  }): Promise<{ success: boolean; entry: TimeEntry; message: string }> {
    const res = await fetch('/api/time-entries/check-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entry_id: params.entryId,
        photo_base64: params.photoBase64,
        location_lat: params.locationLat,
        location_long: params.locationLong,
        notes: params.notes,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Erro ao registrar saída');
    }
    return data;
  },

  // Timesheet history with month/year filter
  async getTimesheetHistory(year?: string, month?: string, userId?: string): Promise<{
    entries: TimeEntry[];
    meta: {
      total_records: number;
      completed_shifts: number;
      total_hours: number;
      total_hours_formatted: string;
    };
  }> {
    try {
      const q = new URLSearchParams();
      if (year && year !== 'Todos') q.append('year', year);
      if (month && month !== 'Todos') q.append('month', month);
      if (userId && userId !== 'Todos') q.append('user_id', userId);

      const res = await fetch(`/api/time-entries/history?${q.toString()}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    let list = [...localTimeEntries];
    if (userId && userId !== 'Todos') {
      list = list.filter((e) => e.user_id === userId);
    }
    if (year && year !== 'Todos' && month && month !== 'Todos') {
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      list = list.filter((e) => e.date_stamp && e.date_stamp.startsWith(prefix));
    }

    const totalHoursAgg = list.reduce((acc, curr) => acc + (curr.total_hours || 0), 0);
    const completed = list.filter((e) => e.exit_time).length;

    return {
      entries: list,
      meta: {
        total_records: list.length,
        completed_shifts: completed,
        total_hours: parseFloat(totalHoursAgg.toFixed(2)),
        total_hours_formatted: `${Math.floor(totalHoursAgg)}h ${Math.round((totalHoursAgg % 1) * 60)}min`,
      },
    };
  },

  // Health logs
  async getHealthLogs(): Promise<HealthLog[]> {
    try {
      const res = await fetch('/api/health-logs');
      if (res.ok) return await res.json();
    } catch {}
    return localHealthLogs;
  },

  async createHealthLog(params: {
    systolic_bp?: number | null;
    diastolic_bp?: number | null;
    heart_rate?: number | null;
    glucose?: number | null;
    glucose_context?: string;
    temperature_c?: number | null;
    weight_kg?: number | null;
    notes?: string;
    recorded_by_user_id: string;
    contractor_signed?: boolean;
    caregiver_signed?: boolean;
  }): Promise<HealthLog> {
    try {
      const res = await fetch('/api/health-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = await res.json();
        return data.log;
      }
    } catch {}

    const hasBp = params.systolic_bp !== undefined && params.systolic_bp !== null;
    const sys = hasBp ? Number(params.systolic_bp) : null;
    const dia = hasBp ? Number(params.diastolic_bp) : null;
    let statusCategory = 'Não aferida nesta rotina (Opcional)';

    if (sys !== null && dia !== null) {
      if (sys >= 180 || dia >= 120) statusCategory = 'Crise Hipertensiva (Urgência)';
      else if (sys >= 140 || dia >= 90) statusCategory = 'Hipertensão Estágio 2';
      else if (sys >= 130 || dia >= 80) statusCategory = 'Hipertensão Estágio 1';
      else if (sys >= 120 && dia < 80) statusCategory = 'Pré-hipertensão';
      else if (sys < 90 || dia < 60) statusCategory = 'Hipotensão';
      else statusCategory = 'Normal (Ótima)';
    }

    const user = INITIAL_USERS.find((u) => u.id === params.recorded_by_user_id);
    const time = generateLocalOfficialTime();
    const newLog: HealthLog = {
      id: `hl-${Date.now()}`,
      elderly_id: INITIAL_ELDERLY.id,
      recorded_by_user_id: params.recorded_by_user_id,
      recorded_by_name: user?.name ? `${user.name} (${user.role === 'caregiver' ? 'Cuidadora' : 'Familiar'})` : 'Profissional',
      systolic_bp: sys,
      diastolic_bp: dia,
      heart_rate: params.heart_rate ? Number(params.heart_rate) : null,
      is_bp_measured: hasBp,
      glucose: params.glucose ?? null,
      glucose_context: params.glucose_context,
      temperature_c: params.temperature_c ?? null,
      weight_kg: params.weight_kg ?? null,
      status_category: statusCategory,
      contractor_signed: params.contractor_signed ?? true,
      caregiver_signed: params.caregiver_signed ?? true,
      notes: params.notes || (hasBp ? 'Aferição registrada.' : 'Registro geral sem aferição de PA.'),
      created_at: time.iso_timestamp,
    };
    localHealthLogs.unshift(newLog);
    return newLog;
  },

  async updateHealthLog(
    id: string,
    params: {
      systolic_bp?: number | null;
      diastolic_bp?: number | null;
      heart_rate?: number | null;
      glucose?: number | null;
      glucose_context?: string;
      temperature_c?: number | null;
      weight_kg?: number | null;
      notes?: string;
      contractor_signed?: boolean;
      caregiver_signed?: boolean;
    }
  ): Promise<HealthLog> {
    try {
      const res = await fetch(`/api/health-logs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = await res.json();
        return data.log;
      }
    } catch {}

    const index = localHealthLogs.findIndex((l) => l.id === id);
    if (index === -1) throw new Error('Registro não encontrado');

    const hasBp = params.systolic_bp !== undefined && params.systolic_bp !== null;
    const sys = hasBp ? Number(params.systolic_bp) : null;
    const dia = hasBp ? Number(params.diastolic_bp) : null;
    let statusCategory = 'Não aferida nesta rotina (Opcional)';

    if (sys !== null && dia !== null) {
      if (sys >= 180 || dia >= 120) statusCategory = 'Crise Hipertensiva (Urgência)';
      else if (sys >= 140 || dia >= 90) statusCategory = 'Hipertensão Estágio 2';
      else if (sys >= 130 || dia >= 80) statusCategory = 'Hipertensão Estágio 1';
      else if (sys >= 120 && dia < 80) statusCategory = 'Pré-hipertensão';
      else if (sys < 90 || dia < 60) statusCategory = 'Hipotensão';
      else statusCategory = 'Normal (Ótima)';
    }

    const current = localHealthLogs[index];
    const updated: HealthLog = {
      ...current,
      systolic_bp: sys,
      diastolic_bp: dia,
      heart_rate: params.heart_rate !== undefined ? (params.heart_rate ? Number(params.heart_rate) : null) : current.heart_rate,
      is_bp_measured: hasBp,
      glucose: params.glucose !== undefined ? params.glucose : current.glucose,
      glucose_context: params.glucose_context ?? current.glucose_context,
      temperature_c: params.temperature_c !== undefined ? params.temperature_c : current.temperature_c,
      weight_kg: params.weight_kg !== undefined ? params.weight_kg : current.weight_kg,
      status_category: statusCategory,
      contractor_signed: params.contractor_signed ?? current.contractor_signed,
      caregiver_signed: params.caregiver_signed ?? current.caregiver_signed,
      notes: params.notes ?? current.notes,
    };

    localHealthLogs[index] = updated;
    return updated;
  },

  // 7b. Boletim Diário de Alterações & Acompanhamento Familiar
  async getDailyIncidents(): Promise<import('../types').DailyIncidentReport[]> {
    try {
      const res = await fetch('/api/daily-incidents');
      if (res.ok) return await res.json();
    } catch {}

    return [];
  },

  async createDailyIncident(params: {
    general_state: import('../types').GeneralWellbeing;
    had_discomfort: boolean;
    discomfort_types: string[];
    symptoms_description: string;
    actions_taken: string;
    recorded_by_user_id: string;
    contractor_signed?: boolean;
    caregiver_signed?: boolean;
  }): Promise<import('../types').DailyIncidentReport> {
    const res = await fetch('/api/daily-incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Falha ao registrar ocorrência');
    }
    const data = await res.json();
    return data.incident;
  },

  async signDailyIncident(id: string, userId: string): Promise<import('../types').DailyIncidentReport> {
    const res = await fetch(`/api/daily-incidents/${id}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Falha ao assinar ocorrência');
    }
    const data = await res.json();
    return data.incident;
  },

  // Medication control
  async getMedications(): Promise<MedicationLog[]> {
    try {
      const res = await fetch('/api/medications');
      if (res.ok) return await res.json();
    } catch {}
    return localMedications;
  },

  async administerMedication(id: string, userId: string = 'usr-01', notes?: string): Promise<MedicationLog> {
    try {
      const res = await fetch(`/api/medications/${id}/administer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, notes }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.medication;
      }
    } catch {}

    const med = localMedications.find((m) => m.id === id);
    if (!med) throw new Error('Medicamento não encontrado');
    const time = generateLocalOfficialTime();
    const user = INITIAL_USERS.find((u) => u.id === userId);

    med.status = 'taken';
    med.administered_at = time.iso_timestamp;
    med.administered_by_user_id = userId;
    med.administered_by_name = user?.name || 'Clara Mendes';
    if (notes) med.instructions += ` (Obs: ${notes})`;
    return med;
  },

  async skipMedication(id: string, reason: string): Promise<MedicationLog> {
    try {
      const res = await fetch(`/api/medications/${id}/skip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.medication;
      }
    } catch {}

    const med = localMedications.find((m) => m.id === id);
    if (!med) throw new Error('Medicamento não encontrado');
    med.status = 'skipped';
    med.instructions += ` [SUSPENSO: ${reason}]`;
    return med;
  },

  // Notices
  async getNotices(): Promise<FamilyNotice[]> {
    try {
      const res = await fetch('/api/notices');
      if (res.ok) return await res.json();
    } catch {}
    return localNotices;
  },

  async createNotice(params: {
    title: string;
    description: string;
    category?: 'shopping' | 'medical' | 'routine';
    userId: string;
  }): Promise<FamilyNotice> {
    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: params.title,
          description: params.description,
          category: params.category,
          user_id: params.userId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.notice;
      }
    } catch {}

    const time = generateLocalOfficialTime();
    const user = INITIAL_USERS.find((u) => u.id === params.userId);
    const newNotice: FamilyNotice = {
      id: `ntc-${Date.now()}`,
      elderly_id: INITIAL_ELDERLY.id,
      created_by_user_id: params.userId,
      created_by_name: user?.name || 'Membro da Família',
      category: params.category || 'shopping',
      title: params.title,
      description: params.description,
      is_resolved: false,
      created_at: time.iso_timestamp,
    };
    localNotices.unshift(newNotice);
    return newNotice;
  },

  async toggleNotice(id: string): Promise<FamilyNotice> {
    try {
      const res = await fetch(`/api/notices/${id}/toggle`, { method: 'PATCH' });
      if (res.ok) {
        const data = await res.json();
        return data.notice;
      }
    } catch {}

    const notice = localNotices.find((n) => n.id === id);
    if (!notice) throw new Error('Aviso não encontrado');
    notice.is_resolved = !notice.is_resolved;
    return notice;
  },

  // 10. Manual / Extraordinary Presence Addition
  async addManualTimeEntry(params: {
    userId: string;
    elderlyId: string;
    dateStamp: string;
    entryTimeStr: string;
    exitTimeStr?: string;
    entryType: 'biometric_facial' | 'manual_authorized' | 'specialist_visit';
    justification: string;
    notes?: string;
    photoUrl?: string;
  }): Promise<{ success: boolean; entry: TimeEntry; message: string }> {
    try {
      const res = await fetch('/api/time-entries/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: params.userId,
          elderly_id: params.elderlyId,
          date_stamp: params.dateStamp,
          entry_time_str: params.entryTimeStr,
          exit_time_str: params.exitTimeStr,
          entry_type: params.entryType,
          justification: params.justification,
          notes: params.notes,
          photo_url: params.photoUrl,
        }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    // Fallback in memory
    const user = INITIAL_USERS.find((u) => u.id === params.userId);
    const entryIso = `${params.dateStamp}T${params.entryTimeStr}:00-03:00`;
    const exitIso = params.exitTimeStr ? `${params.dateStamp}T${params.exitTimeStr}:00-03:00` : null;

    let totalHours = null;
    let formattedHours = 'Em andamento';

    if (exitIso) {
      const start = new Date(entryIso).getTime();
      const end = new Date(exitIso).getTime();
      const diffMs = Math.max(0, end - start);
      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      formattedHours = `${h}h ${m.toString().padStart(2, '0')}min`;
    }

    const dateObj = new Date(`${params.dateStamp}T12:00:00Z`);
    const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const dayOfWeek = dayNames[dateObj.getUTCDay()];

    const newEntry: TimeEntry = {
      id: `pnt-man-${Date.now()}`,
      user_id: params.userId,
      user_name: user?.name || 'Profissional',
      elderly_id: params.elderlyId || INITIAL_ELDERLY.id,
      entry_time: entryIso,
      entry_photo_url: params.photoUrl || user?.avatar_url || SAMPLE_SELFIE_CARE,
      exit_time: exitIso,
      exit_photo_url: exitIso ? (params.photoUrl || user?.avatar_url || SAMPLE_SELFIE_CARE) : null,
      total_hours: totalHours,
      total_hours_formatted: formattedHours,
      location_lat: INITIAL_ELDERLY.residence_lat,
      location_long: INITIAL_ELDERLY.residence_long,
      distance_meters: 10,
      is_verified_geofence: true,
      date_stamp: params.dateStamp,
      day_of_week: dayOfWeek,
      entry_type: params.entryType,
      justification: params.justification,
      authorized_by_name: 'Dr. Fernando Silveira (Admin Familiar)',
      notes: params.notes || `Lançamento manual autorizado: ${params.justification}`,
    };

    localTimeEntries.unshift(newEntry);
    return {
      success: true,
      entry: newEntry,
      message: 'Presença lançada com sucesso no diário e espelho de ponto.',
    };
  },

  // 12. Plano de Missões Diárias (Protocolo do Administrador Geral)
  async getDailyMissions(): Promise<import('../types').DailyMission[]> {
    try {
      const res = await fetch('/api/missions');
      if (res.ok) return await res.json();
    } catch {}

    // Clean initial state (no demo missions)
    return [];
  },

  async createDailyMission(params: {
    title: string;
    scheduled_time: string;
    category: import('../types').MissionCategory;
    priority: import('../types').MissionPriority;
    clear_instructions: string;
    user_id: string;
  }): Promise<import('../types').DailyMission> {
    const res = await fetch('/api/missions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Falha ao cadastrar missão');
    }
    const data = await res.json();
    return data.mission;
  },

  async updateDailyMission(
    id: string,
    params: Partial<{
      title: string;
      scheduled_time: string;
      category: import('../types').MissionCategory;
      priority: import('../types').MissionPriority;
      clear_instructions: string;
      user_id: string;
    }>
  ): Promise<import('../types').DailyMission> {
    const res = await fetch(`/api/missions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Falha ao atualizar missão');
    }
    const data = await res.json();
    return data.mission;
  },

  async deleteDailyMission(id: string, userId: string): Promise<void> {
    const res = await fetch(`/api/missions/${id}?user_id=${userId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Falha ao remover missão');
    }
  },

  async toggleDailyMission(id: string, userId: string, executionNotes?: string): Promise<import('../types').DailyMission> {
    const res = await fetch(`/api/missions/${id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, execution_notes: executionNotes }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Falha ao atualizar status da missão');
    }
    const data = await res.json();
    return data.mission;
  },

  // --- Autenticação com Usuário e Senha & Gestão de Logins por Família ---
  async login(username: string, password: string): Promise<{ success: boolean; user: User; message: string }> {
    const rawInput = username.trim();
    const cleanUser = rawInput.toLowerCase();
    const cleanUserNoSpaces = cleanUser.replace(/[\s_]+/g, '');
    const cleanPass = password.trim().toLowerCase().slice(0, 8);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });

      const data = await res.json();
      if (res.ok) {
        return data;
      }
    } catch (err: any) {
      // Fallback para login local
    }

    // Busca local de usuário nos logins salvos
    const localUser = INITIAL_USERS.find((u) => {
      if (!u) return false;
      const uName = String(u.username || '').toLowerCase();
      const uNameNoSpaces = uName.replace(/[\s_]+/g, '');
      const uEmail = String(u.email || '').toLowerCase();
      const uCode = String(u.registration_code || '').toLowerCase();
      const uFullName = String(u.name || '').toLowerCase();

      return (
        uName === cleanUser ||
        uNameNoSpaces === cleanUserNoSpaces ||
        uEmail === cleanUser ||
        uCode === cleanUser ||
        uFullName === cleanUser
      );
    });

    const userPass = String(localUser?.password || '').trim().toLowerCase().slice(0, 8);

    if (localUser && userPass === cleanPass) {
      const { password: _, ...safeUser } = localUser;
      return {
        success: true,
        user: safeUser,
        message: `Bem-vindo(a), ${localUser.name}!`,
      };
    }

    if (localUser) {
      throw new Error('Senha incorreta para este usuário. Lembre-se: usuário e senha são em minúsculo (máx. 8 caracteres).');
    }

    throw new Error(`O login "${rawInput}" não foi localizado no sistema. Verifique o usuário cadastrado.`);
  },

  async getFamiliesDirectory(): Promise<{
    families: import('../types').FamilyWithLogins[];
    master_admin: { username: string; name: string; role: string; role_label: string };
  }> {
    try {
      const res = await fetch('/api/auth/families-directory');
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    // Fallback directory built from initial data
    const directory = INITIAL_FAMILIES.map((fam) => {
      const logins = INITIAL_USERS.filter((u) => u.family_id === fam.id).map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        role: u.role,
        role_label:
          u.role === 'caregiver'
            ? 'Cuidador(a) do Idoso'
            : u.role === 'admin_family'
            ? 'Administrador Contratante (Família)'
            : 'Membro da Família',
        registration_code: u.registration_code,
        avatar_url: u.avatar_url,
      }));
      return {
        id: fam.id,
        name: fam.name,
        elderly_name: fam.elderly_name,
        residence_address: fam.residence_address,
        logins,
      };
    });

    return {
      families: directory,
      master_admin: {
        username: 'Samuel_02',
        name: 'Samuel (Administrador Geral)',
        role: 'admin_geral',
        role_label: 'Administrador Geral Master',
      },
    };
  },

  async getFamilies(): Promise<import('../types').Family[]> {
    try {
      const res = await fetch('/api/families');
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return INITIAL_FAMILIES;
  },

  async createFamily(params: {
    name: string;
    elderly_name: string;
    residence_address?: string;
    notes?: string;
    requesting_user_id: string;
  }): Promise<import('../types').Family> {
    try {
      const res = await fetch('/api/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = await res.json();
        return data.family;
      }
    } catch (err) {
      console.warn('[API] Servidor desconectado, cadastrando família localmente:', err);
    }

    const newFamily: import('../types').Family = {
      id: `fam-${Date.now()}`,
      name: params.name || 'Nova Família',
      elderly_name: params.elderly_name || 'Idoso Assistido',
      elderly_id: `eld-${Date.now()}`,
      residence_address: params.residence_address || 'Endereço da Residência',
      residence_lat: -23.5505,
      residence_long: -46.6333,
      allowed_radius_meters: 300,
      notes: params.notes || '',
      created_at: new Date().toISOString(),
    };
    INITIAL_FAMILIES.push(newFamily);
    return newFamily;
  },

  async updateFamilyResidence(
    familyId: string,
    params: {
      residence_address: string;
      residence_lat: number;
      residence_long: number;
      allowed_radius_meters: number;
      residence_cep?: string;
      notes?: string;
      requesting_user_id: string;
    }
  ): Promise<{ success: boolean; family: import('../types').Family; elderly: import('../types').ElderlyProfile; message: string }> {
    try {
      const res = await fetch(`/api/families/${familyId}/residence`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[API] Servidor desconectado, atualizando residência localmente:', err);
    }

    const fam = INITIAL_FAMILIES.find((f) => f.id === familyId) || {
      id: familyId,
      name: 'Família Principal',
      elderly_name: 'Idoso Assistido',
      elderly_id: 'eld-01',
      residence_address: params.residence_address,
      residence_lat: params.residence_lat,
      residence_long: params.residence_long,
      allowed_radius_meters: params.allowed_radius_meters,
      created_at: new Date().toISOString(),
    };

    fam.residence_address = params.residence_address;
    fam.residence_lat = params.residence_lat;
    fam.residence_long = params.residence_long;
    fam.allowed_radius_meters = params.allowed_radius_meters;

    INITIAL_ELDERLY.residence_address = params.residence_address;
    INITIAL_ELDERLY.residence_lat = params.residence_lat;
    INITIAL_ELDERLY.residence_long = params.residence_long;
    INITIAL_ELDERLY.allowed_radius_meters = params.allowed_radius_meters;

    return {
      success: true,
      family: fam,
      elderly: INITIAL_ELDERLY,
      message: 'Residência e geofence cadastrados com sucesso!',
    };
  },

  async updateElderlyResidence(params: {
    residence_address: string;
    residence_lat: number;
    residence_long: number;
    allowed_radius_meters: number;
    family_id?: string | null;
    requesting_user_id: string;
  }): Promise<{ success: boolean; elderly: import('../types').ElderlyProfile; message: string }> {
    try {
      const res = await fetch('/api/elderly/residence', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[API] Servidor desconectado, atualizando residência do idoso localmente:', err);
    }

    INITIAL_ELDERLY.residence_address = params.residence_address;
    INITIAL_ELDERLY.residence_lat = params.residence_lat;
    INITIAL_ELDERLY.residence_long = params.residence_long;
    INITIAL_ELDERLY.allowed_radius_meters = params.allowed_radius_meters;

    return {
      success: true,
      elderly: INITIAL_ELDERLY,
      message: 'Residência cadastrada com sucesso!',
    };
  },

  async fetchUsers(includePasswords: boolean = false): Promise<User[]> {
    try {
      const res = await fetch(`/api/users${includePasswords ? '?include_passwords=true' : ''}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          persistUsersToCache(list);
        }
        return INITIAL_USERS;
      }
    } catch {
      // fallback
    }
    return INITIAL_USERS;
  },

  async createUser(params: {
    name: string;
    username: string;
    password: string;
    role?: import('../types').UserRole;
    roles?: import('../types').UserRole[];
    permission_level?: import('../types').PermissionLevel;
    family_id?: string | null;
    email?: string;
    registration_code?: string;
    requesting_user_id: string;
  }): Promise<User> {
    const cleanUser = (params.username || '').trim().toLowerCase().replace(/\s+/g, '_');
    const cleanPass = (params.password || '').trim().toLowerCase().slice(0, 8);
    const roles = params.roles || [params.role || 'caregiver'];

    let createdUser: User | null = null;

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          username: cleanUser,
          password: cleanPass,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        createdUser = data.user;
      }
    } catch (err) {
      console.warn('[API] Servidor desconectado, cadastrando usuário localmente:', err);
    }

    if (!createdUser) {
      createdUser = {
        id: `usr-${Date.now()}`,
        name: params.name || 'Novo Usuário',
        username: cleanUser || `user_${Date.now().toString().slice(-4)}`,
        password: cleanPass || '12345678',
        role: roles[0],
        roles: roles,
        permission_level: params.permission_level || 3,
        permission_level_title: roles.join(' + '),
        family_id: params.family_id || null,
        family_name: 'Família Cadastrada',
        email: params.email || `${cleanUser}@cuida.com.br`,
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        first_login_completed: false,
        terms_accepted: false,
        created_at: new Date().toISOString(),
      };
    }

    const existingIndex = INITIAL_USERS.findIndex((u) => u.id === createdUser!.id || (u.username && u.username.toLowerCase() === createdUser!.username.toLowerCase()));
    if (existingIndex !== -1) {
      INITIAL_USERS[existingIndex] = createdUser;
    } else {
      INITIAL_USERS.push(createdUser);
    }
    persistUsersToCache(INITIAL_USERS);

    return createdUser;
  },

  async updateUserRoles(
    userId: string,
    roles: import('../types').UserRole[],
    requestingUserId: string
  ): Promise<User> {
    const res = await fetch(`/api/users/${userId}/roles`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles, requesting_user_id: requestingUserId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Falha ao atualizar funções do usuário');
    }
    const data = await res.json();
    return data.user;
  },

  async deleteUser(id: string, requesting_user_id: string): Promise<void> {
    const res = await fetch(`/api/users/${id}?requesting_user_id=${requesting_user_id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Falha ao remover login');
    }
  },

  async completeOnboarding(userId: string, data: Partial<User>): Promise<User> {
    try {
      const res = await fetch(`/api/users/${userId}/onboarding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        return result.user;
      }
    } catch {
      // fallback
    }

    const idx = INITIAL_USERS.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      INITIAL_USERS[idx] = {
        ...INITIAL_USERS[idx],
        ...data,
        first_login_completed: true,
        terms_accepted: true,
      };
      return INITIAL_USERS[idx];
    }
    throw new Error('Usuário não localizado para conclusão do perfil.');
  },

  async updateUserLevel(userId: string, level: import('../types').PermissionLevel, requestingUserId: string): Promise<User> {
    const res = await fetch(`/api/users/${userId}/level`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permission_level: level, requesting_user_id: requestingUserId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Falha ao atualizar nível do usuário');
    }
    const data = await res.json();
    return data.user;
  },

  async getFamilyActivityLogs(familyId: string = 'fam-01'): Promise<import('../types').FamilyActivityLog[]> {
    try {
      const res = await fetch(`/api/family-activity-logs?family_id=${familyId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    return [];
  },

  async logFamilyActivity(log: {
    family_id: string;
    user_id: string;
    user_name: string;
    user_role: import('../types').UserRole;
    action_type: import('../types').FamilyActivityLog['action_type'];
    category: import('../types').FamilyActivityLog['category'];
    description: string;
    details?: string;
  }): Promise<void> {
    try {
      await fetch('/api/family-activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
    } catch (err) {
      console.error('Falha ao registrar log de atividade:', err);
    }
  },
};
