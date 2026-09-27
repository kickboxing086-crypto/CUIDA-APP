import {
  ElderlyProfile,
  FamilyNotice,
  HealthLog,
  MedicationLog,
  OfficialServerTime,
  TimeEntry,
  User,
  Family,
  InviteLink,
  FamilyActivityLog,
  UserRole,
  PermissionLevel,
  DailyMission,
  DailyIncidentReport,
  ShiftSchedule,
} from '../types';

export function loadInitialElderly(): ElderlyProfile {
  const def: ElderlyProfile = {
    id: 'eld-01',
    full_name: 'Dona Maria Silveira',
    birth_date: '1945-05-12',
    blood_type: 'O+',
    allergies: ['Dipirona'],
    residence_address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    residence_lat: -23.5505,
    residence_long: -46.6333,
    allowed_radius_meters: 150,
    emergency_contacts: [],
    created_at: new Date().toISOString(),
  };
  try {
    const saved = localStorage.getItem('cuida_persisted_elderly');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.id) return { ...def, ...parsed };
    }
  } catch {}
  return def;
}

let INITIAL_ELDERLY: ElderlyProfile = loadInitialElderly();

export function persistElderlyCache(eld: ElderlyProfile) {
  INITIAL_ELDERLY = { ...eld };
  try {
    localStorage.setItem('cuida_persisted_elderly', JSON.stringify(INITIAL_ELDERLY));
  } catch {}
}

function loadInitialFamilies(): Family[] {
  try {
    const saved = localStorage.getItem('cuida_persisted_families');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

let INITIAL_FAMILIES: Family[] = loadInitialFamilies();

function persistFamiliesCache(fams: Family[]) {
  INITIAL_FAMILIES = [...fams];
  try {
    localStorage.setItem('cuida_persisted_families', JSON.stringify(INITIAL_FAMILIES));
  } catch {}
}

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
        const hasSamuel = parsed.some((u: User) => u.username?.toLowerCase() === 'samuel_02');
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

async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return { ok: res.ok, status: res.status, data, error: !res.ok ? data?.message || data?.error : undefined };
    }
    return { ok: false, status: res.status, error: `Formato de resposta inválido (${res.status})` };
  } catch (err: any) {
    return { ok: false, status: 0, error: err?.message || 'Erro de rede' };
  }
}

const SAMPLE_SELFIE_CARE = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80';

function loadLocalTimeEntries(): TimeEntry[] {
  try {
    const saved = localStorage.getItem('cuida_local_time_entries');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

let localTimeEntries: TimeEntry[] = loadLocalTimeEntries();

function saveLocalTimeEntries() {
  try {
    localStorage.setItem('cuida_local_time_entries', JSON.stringify(localTimeEntries));
  } catch {}
}

function loadLocalInvites(): InviteLink[] {
  try {
    const saved = localStorage.getItem('cuida_local_invites');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

let localInvites: InviteLink[] = loadLocalInvites();

function saveLocalInvites() {
  try {
    localStorage.setItem('cuida_local_invites', JSON.stringify(localInvites));
  } catch {}
}

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
    } catch {}
    return generateLocalOfficialTime();
  },

  // Elderly profile
  async getElderlyProfile(): Promise<ElderlyProfile> {
    const res = await safeFetchJson<ElderlyProfile>('/api/elderly');
    if (res.ok && res.data && res.data.id && res.data.residence_address) {
      persistElderlyCache(res.data);
      return res.data;
    }
    return loadInitialElderly();
  },

  // Users
  getUsers(): User[] {
    return INITIAL_USERS;
  },

  // Active shift
  async getActiveEntry(userId: string = 'usr-01'): Promise<TimeEntry | null> {
    const res = await safeFetchJson<{ activeEntry: TimeEntry | null }>(`/api/time-entries/active?userId=${userId}`);
    if (res.ok && res.data) {
      return res.data.activeEntry;
    }
    const found = localTimeEntries.find((e) => e.user_id === userId && !e.exit_time);
    return found || null;
  },

  // Clock In
  async checkIn(params: {
    userId: string;
    elderlyId?: string;
    photoBase64?: string;
    locationLat?: number;
    locationLong?: number;
    notes?: string;
  }): Promise<{ success: boolean; message: string; entry: TimeEntry }> {
    const res = await safeFetchJson<{ success: boolean; message: string; entry: TimeEntry }>('/api/time-entries/check-in', {
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

    if (res.ok && res.data && res.data.entry) {
      localTimeEntries.unshift(res.data.entry);
      saveLocalTimeEntries();
      return res.data;
    }

    if (!res.ok && res.error) {
      throw new Error(res.error);
    }

    const time = generateLocalOfficialTime();
    const user = INITIAL_USERS.find((u) => u.id === params.userId);
    const entryPhoto = params.photoBase64 || user?.avatar_url || SAMPLE_SELFIE_CARE;

    const newEntry: TimeEntry = {
      id: `pnt-${Date.now()}`,
      user_id: params.userId,
      user_name: user?.name || 'Cuidador',
      elderly_id: params.elderlyId || INITIAL_ELDERLY.id || 'eld-01',
      entry_time: time.iso_timestamp,
      entry_photo_url: entryPhoto,
      exit_time: null,
      exit_photo_url: null,
      total_hours: 0,
      total_hours_formatted: 'Em andamento',
      location_lat: params.locationLat || INITIAL_ELDERLY.residence_lat,
      location_long: params.locationLong || INITIAL_ELDERLY.residence_long,
      distance_meters: 12,
      is_verified_geofence: true,
      date_stamp: time.date_stamp,
      day_of_week: time.day_of_week,
      notes: params.notes || `Ponto de entrada registrado (${time.formatted_time}).`,
    };

    localTimeEntries.unshift(newEntry);
    saveLocalTimeEntries();

    return {
      success: true,
      message: `Entrada registrada com sucesso! Horário oficial (${time.formatted_time}).`,
      entry: newEntry,
    };
  },

  // Clock Out
  async checkOut(params: {
    entryId: string;
    userId: string;
    photoBase64?: string;
    locationLat?: number;
    locationLong?: number;
    notes?: string;
  }): Promise<{ success: boolean; message: string; entry: TimeEntry }> {
    const res = await safeFetchJson<{ success: boolean; message: string; entry: TimeEntry }>('/api/time-entries/check-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entry_id: params.entryId,
        user_id: params.userId,
        photo_base64: params.photoBase64,
        location_lat: params.locationLat,
        location_long: params.locationLong,
        notes: params.notes,
      }),
    });

    if (res.ok && res.data && res.data.entry) {
      const idx = localTimeEntries.findIndex((e) => e.id === params.entryId);
      if (idx !== -1) localTimeEntries[idx] = res.data.entry;
      saveLocalTimeEntries();
      return res.data;
    }

    if (!res.ok && res.error) {
      throw new Error(res.error);
    }

    const time = generateLocalOfficialTime();
    const entry = localTimeEntries.find((e) => e.id === params.entryId) || localTimeEntries.find((e) => e.user_id === params.userId && !e.exit_time);

    if (!entry) {
      throw new Error('Não há registro de entrada ativo para encerrar.');
    }

    const user = INITIAL_USERS.find((u) => u.id === params.userId);
    const exitPhoto = params.photoBase64 || user?.avatar_url || SAMPLE_SELFIE_CARE;

    const start = new Date(entry.entry_time).getTime();
    const end = new Date(time.iso_timestamp).getTime();
    const diffMs = Math.max(0, end - start);
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const formattedHours = `${h}h ${m.toString().padStart(2, '0')}min`;

    entry.exit_time = time.iso_timestamp;
    entry.exit_photo_url = exitPhoto;
    entry.total_hours = totalHours;
    entry.total_hours_formatted = formattedHours;
    if (params.notes) entry.notes = params.notes;

    saveLocalTimeEntries();

    return {
      success: true,
      message: `Saída registrada com sucesso! Total trabalhado: ${formattedHours}`,
      entry,
    };
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
    const q = new URLSearchParams();
    if (year && year !== 'Todos') q.append('year', year);
    if (month && month !== 'Todos') q.append('month', month);
    if (userId && userId !== 'Todos') q.append('user_id', userId);

    const res = await safeFetchJson<{
      entries: TimeEntry[];
      meta: {
        total_records: number;
        completed_shifts: number;
        total_hours: number;
        total_hours_formatted: string;
      };
    }>(`/api/time-entries/history?${q.toString()}`);

    if (res.ok && res.data && Array.isArray(res.data.entries)) {
      return res.data;
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
    elderly_id?: string;
    recorded_by_user_id: string;
    systolic_bp?: number | null;
    diastolic_bp?: number | null;
    heart_rate?: number | null;
    glucose?: number | null;
    glucose_context?: string;
    temperature_c?: number | null;
    weight_kg?: number | null;
    contractor_signed?: boolean;
    caregiver_signed?: boolean;
    notes?: string;
  }): Promise<HealthLog> {
    const time = generateLocalOfficialTime();
    const user = INITIAL_USERS.find((u) => u.id === params.recorded_by_user_id);

    const hasBp = Boolean(params.systolic_bp && params.diastolic_bp);
    let statusCategory = 'Normal / Dentro do Esperado';
    if (hasBp && (params.systolic_bp! >= 140 || params.diastolic_bp! >= 90)) {
      statusCategory = 'Atenção / PA Elevada';
    } else if (params.glucose && (params.glucose >= 180 || params.glucose <= 70)) {
      statusCategory = 'Atenção / Glicemia Alterada';
    }

    const newLog: HealthLog = {
      id: `hl-${Date.now()}`,
      elderly_id: params.elderly_id || INITIAL_ELDERLY.id || 'eld-01',
      recorded_by_user_id: params.recorded_by_user_id,
      recorded_by_name: user?.name || 'Profissional Responsável',
      systolic_bp: params.systolic_bp ?? null,
      diastolic_bp: params.diastolic_bp ?? null,
      heart_rate: params.heart_rate ?? null,
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
    const log = localHealthLogs.find((l) => l.id === id);
    if (!log) throw new Error('Aferição não localizada.');

    if (params.systolic_bp !== undefined) log.systolic_bp = params.systolic_bp;
    if (params.diastolic_bp !== undefined) log.diastolic_bp = params.diastolic_bp;
    if (params.heart_rate !== undefined) log.heart_rate = params.heart_rate;
    if (params.glucose !== undefined) log.glucose = params.glucose;
    if (params.glucose_context !== undefined) log.glucose_context = params.glucose_context;
    if (params.temperature_c !== undefined) log.temperature_c = params.temperature_c;
    if (params.weight_kg !== undefined) log.weight_kg = params.weight_kg;
    if (params.notes !== undefined) log.notes = params.notes;

    log.is_bp_measured = Boolean(log.systolic_bp && log.diastolic_bp);
    return log;
  },

  async getDailyIncidents(): Promise<DailyIncidentReport[]> {
    try {
      const res = await fetch('/api/incidents');
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  async createDailyIncident(params: Partial<DailyIncidentReport>): Promise<DailyIncidentReport> {
    const res = await safeFetchJson<DailyIncidentReport>('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok && res.data) return res.data;
    throw new Error(res.error || 'Erro ao registrar boletim.');
  },

  async signDailyIncident(id: string, userId: string): Promise<DailyIncidentReport> {
    const res = await safeFetchJson<DailyIncidentReport>(`/api/incidents/${id}/sign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (res.ok && res.data) return res.data;
    throw new Error(res.error || 'Erro ao assinar boletim.');
  },

  async getMedications(): Promise<MedicationLog[]> {
    try {
      const res = await fetch('/api/medications');
      if (res.ok) return await res.json();
    } catch {}
    return localMedications;
  },

  async administerMedication(id: string, userId: string = 'usr-01'): Promise<MedicationLog> {
    const res = await safeFetchJson<MedicationLog>(`/api/medications/${id}/administer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (res.ok && res.data) return res.data;

    const med = localMedications.find((m) => m.id === id);
    if (med) {
      med.status = 'taken';
      med.administered_at = new Date().toISOString();
      med.administered_by_user_id = userId;
    }
    return med || {
      id,
      elderly_id: 'eld-01',
      medication_name: 'Medicamento',
      dosage: '1 comprimido',
      scheduled_time: '12:00',
      status: 'taken',
      administered_at: new Date().toISOString(),
      administered_by_user_id: userId,
    };
  },

  async skipMedication(id: string, reason: string): Promise<MedicationLog> {
    const res = await safeFetchJson<MedicationLog>(`/api/medications/${id}/skip`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (res.ok && res.data) return res.data;

    const med = localMedications.find((m) => m.id === id);
    if (med) {
      med.status = 'skipped';
      med.instructions = `Pulado: ${reason}`;
    }
    return med || {
      id,
      elderly_id: 'eld-01',
      medication_name: 'Medicamento',
      dosage: '1 comprimido',
      scheduled_time: '12:00',
      status: 'skipped',
      administered_at: null,
      administered_by_user_id: null,
      instructions: `Pulado: ${reason}`,
    };
  },

  async getNotices(): Promise<FamilyNotice[]> {
    try {
      const res = await fetch('/api/notices');
      if (res.ok) return await res.json();
    } catch {}
    return localNotices;
  },

  async createNotice(params: {
    elderly_id?: string;
    created_by_user_id: string;
    title: string;
    description: string;
    category?: 'shopping' | 'medical' | 'routine';
  }): Promise<FamilyNotice> {
    const res = await safeFetchJson<FamilyNotice>('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok && res.data) {
      localNotices.unshift(res.data);
      return res.data;
    }

    const user = INITIAL_USERS.find((u) => u.id === params.created_by_user_id);
    const notice: FamilyNotice = {
      id: `not-${Date.now()}`,
      elderly_id: params.elderly_id || 'eld-01',
      created_by_user_id: params.created_by_user_id,
      created_by_name: user?.name || 'Administrador',
      title: params.title,
      description: params.description,
      category: params.category || 'routine',
      is_resolved: false,
      created_at: new Date().toISOString(),
    };
    localNotices.unshift(notice);
    return notice;
  },

  async toggleNotice(id: string): Promise<FamilyNotice> {
    const notice = localNotices.find((n) => n.id === id);
    if (notice) notice.is_resolved = !notice.is_resolved;
    return notice || {
      id,
      elderly_id: 'eld-01',
      created_by_user_id: 'usr-01',
      title: 'Aviso',
      description: '',
      is_resolved: true,
      created_at: new Date().toISOString(),
    };
  },

  async addManualTimeEntry(params: {
    userId: string;
    dateStamp: string;
    entryTime: string;
    exitTime?: string;
    justification: string;
    notes?: string;
    photoUrl?: string;
    entryType: 'biometric_facial' | 'manual_authorized' | 'specialist_visit';
    elderlyId?: string;
  }): Promise<TimeEntry> {
    const res = await safeFetchJson<{ entry: TimeEntry }>('/api/time-entries/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok && res.data && res.data.entry) {
      localTimeEntries.unshift(res.data.entry);
      saveLocalTimeEntries();
      return res.data.entry;
    }

    const user = INITIAL_USERS.find((u) => u.id === params.userId);
    const entryIso = `${params.dateStamp}T${params.entryTime}:00Z`;
    const exitIso = params.exitTime ? `${params.dateStamp}T${params.exitTime}:00Z` : null;

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
      elderly_id: params.elderlyId || INITIAL_ELDERLY.id || 'eld-01',
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
      authorized_by_name: user?.name || 'Administrador Familiar',
      notes: params.notes || `Lançamento manual autorizado: ${params.justification}`,
    };

    localTimeEntries.unshift(newEntry);
    saveLocalTimeEntries();
    return newEntry;
  },

  async getDailyMissions(): Promise<DailyMission[]> {
    try {
      const res = await fetch('/api/daily-missions');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          try {
            localStorage.setItem('cuida_daily_missions_cache', JSON.stringify(data));
          } catch {}
          return data;
        }
      }
    } catch {}
    try {
      const cached = localStorage.getItem('cuida_daily_missions_cache');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  },

  async createDailyMission(params: Partial<DailyMission>): Promise<DailyMission> {
    const fallbackCreated: DailyMission = {
      id: `mis-${Date.now()}`,
      elderly_id: params.elderly_id || 'eld-01',
      title: params.title || 'Obrigação de Cuidado',
      scheduled_time: params.scheduled_time || '08:00',
      category: params.category || 'medication',
      priority: params.priority || 'mandatory',
      clear_instructions: params.clear_instructions || '',
      created_by_user_id: params.created_by_user_id || 'usr-admin-samuel',
      created_by_name: 'Administrador (Protocolo Oficial)',
      is_active: true,
      completed: false,
    };
    let created: DailyMission = fallbackCreated;
    const res = await safeFetchJson<any>('/api/daily-missions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        user_id: params.created_by_user_id || 'usr-admin-samuel',
      }),
    });
    if (res.ok && res.data) {
      created = res.data.mission || res.data;
    } else {
      created = {
        id: `mis-${Date.now()}`,
        elderly_id: params.elderly_id || 'eld-01',
        title: params.title || 'Obrigação de Cuidado',
        scheduled_time: params.scheduled_time || '08:00',
        category: params.category || 'medication',
        priority: params.priority || 'mandatory',
        clear_instructions: params.clear_instructions || '',
        created_by_user_id: params.created_by_user_id || 'usr-admin-samuel',
        created_by_name: 'Administrador (Protocolo Oficial)',
        is_active: true,
        completed: false,
      };
    }

    try {
      const cached = localStorage.getItem('cuida_daily_missions_cache');
      const list: DailyMission[] = cached ? JSON.parse(cached) : [];
      list.push(created);
      localStorage.setItem('cuida_daily_missions_cache', JSON.stringify(list));
    } catch {}

    return created;
  },

  async updateDailyMission(id: string, params: Partial<DailyMission>): Promise<DailyMission> {
    const fallbackUpdated: DailyMission = {
      id,
      elderly_id: params.elderly_id || 'eld-01',
      title: params.title || 'Obrigação de Cuidado',
      scheduled_time: params.scheduled_time || '08:00',
      category: params.category || 'medication',
      priority: params.priority || 'mandatory',
      clear_instructions: params.clear_instructions || '',
      created_by_user_id: params.created_by_user_id || 'usr-admin-samuel',
      created_by_name: 'Administrador (Protocolo Oficial)',
      is_active: true,
      completed: false,
    };
    let updated: DailyMission = fallbackUpdated;
    const res = await safeFetchJson<any>(`/api/daily-missions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        user_id: params.created_by_user_id || 'usr-admin-samuel',
      }),
    });
    if (res.ok && res.data) {
      updated = res.data.mission || res.data;
    } else {
      updated = fallbackUpdated;
    }

    try {
      const cached = localStorage.getItem('cuida_daily_missions_cache');
      if (cached) {
        const list: DailyMission[] = JSON.parse(cached);
        const idx = list.findIndex((m) => m.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updated };
          localStorage.setItem('cuida_daily_missions_cache', JSON.stringify(list));
        }
      }
    } catch {}

    return updated;
  },

  async deleteDailyMission(id: string, userId: string): Promise<void> {
    try {
      await fetch(`/api/daily-missions/${id}?user_id=${encodeURIComponent(userId)}&userId=${encodeURIComponent(userId)}`, { method: 'DELETE' });
    } catch {}
    try {
      const cached = localStorage.getItem('cuida_daily_missions_cache');
      if (cached) {
        const list: DailyMission[] = JSON.parse(cached);
        const filtered = list.filter((m) => m.id !== id);
        localStorage.setItem('cuida_daily_missions_cache', JSON.stringify(filtered));
      }
    } catch {}
  },

  async toggleDailyMission(id: string, userId: string, executionNotes?: string): Promise<DailyMission> {
    const res = await safeFetchJson<any>(`/api/daily-missions/${id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, userId, execution_notes: executionNotes, executionNotes }),
    });

    let result: DailyMission;
    if (res.ok && res.data) {
      result = res.data.mission || res.data;
    } else {
      result = {
        id,
        elderly_id: 'eld-01',
        title: 'Obrigação de Cuidado',
        scheduled_time: '08:00',
        category: 'medication',
        priority: 'mandatory',
        clear_instructions: '',
        created_by_user_id: userId,
        created_by_name: 'Cuidador',
        is_active: true,
        completed: true,
        completed_at: new Date().toISOString(),
        execution_notes: executionNotes,
      };
    }

    try {
      const cached = localStorage.getItem('cuida_daily_missions_cache');
      if (cached) {
        const list: DailyMission[] = JSON.parse(cached);
        const idx = list.findIndex((m) => m.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...result };
          localStorage.setItem('cuida_daily_missions_cache', JSON.stringify(list));
        }
      }
    } catch {}

    return result;
  },

  async login(username: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim().toLowerCase().slice(0, 8);

    const res = await safeFetchJson<{ success: boolean; user?: User; message?: string }>('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanUser, password: cleanPass }),
    });

    if (res.ok && res.data && res.data.user) {
      const u = res.data.user;
      const idx = INITIAL_USERS.findIndex((x) => x.id === u.id || x.username?.toLowerCase() === u.username?.toLowerCase());
      if (idx !== -1) INITIAL_USERS[idx] = u;
      else INITIAL_USERS.push(u);
      persistUsersToCache(INITIAL_USERS);
      return res.data;
    }

    const localFound = INITIAL_USERS.find(
      (u) => u.username?.toLowerCase() === cleanUser && u.password?.toLowerCase().slice(0, 8) === cleanPass
    );

    if (localFound) {
      return { success: true, user: localFound, message: 'Autenticado via credenciais locais!' };
    }

    return {
      success: false,
      message: 'Nome de usuário ou senha incorretos.',
    };
  },

  async getFamiliesDirectory(): Promise<{
    families: Array<{
      id: string;
      name: string;
      elderly_name: string;
      residence_address?: string;
      logins: Array<{
        id: string;
        name: string;
        username: string;
        password?: string;
        role: UserRole;
        roles?: UserRole[];
        role_label: string;
        role_labels?: string[];
        permission_level?: PermissionLevel;
        registration_code?: string;
        avatar_url?: string;
      }>;
    }>;
    master_admin: { username: string; name: string; role: string; role_label: string };
  }> {
    try {
      const res = await fetch('/api/families/directory');
      if (res.ok) return await res.json();
    } catch {}

    const directory = INITIAL_FAMILIES.map((fam) => {
      const logins = INITIAL_USERS.filter((u) => u.family_id === fam.id).map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        password: u.password,
        role: u.role,
        roles: u.roles,
        role_label: u.role_label || u.role,
        role_labels: u.role_labels || [u.role],
        permission_level: u.permission_level,
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
        role_label: 'Administrador Geral',
      },
    };
  },

  async getFamilies(): Promise<Family[]> {
    try {
      const res = await fetch('/api/families');
      if (res.ok) return await res.json();
    } catch {}
    return INITIAL_FAMILIES;
  },

  async createFamily(params: {
    name: string;
    elderly_name: string;
    residence_address?: string;
    notes?: string;
    requesting_user_id: string;
  }): Promise<Family> {
    const res = await safeFetchJson<{ family: Family }>('/api/families', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok && res.data?.family) {
      INITIAL_FAMILIES.push(res.data.family);
      persistFamiliesCache(INITIAL_FAMILIES);
      return res.data.family;
    }

    const newFamily: Family = {
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
    persistFamiliesCache(INITIAL_FAMILIES);
    return newFamily;
  },

  async deleteFamily(id: string, requesting_user_id: string): Promise<void> {
    const res = await safeFetchJson(`/api/families/${id}?requesting_user_id=${requesting_user_id}`, {
      method: 'DELETE',
    });
    const idx = INITIAL_FAMILIES.findIndex((f) => f.id === id);
    if (idx !== -1) {
      INITIAL_FAMILIES.splice(idx, 1);
      persistFamiliesCache(INITIAL_FAMILIES);
    }
    // Also update users linked to this family in local cache
    INITIAL_USERS.forEach((u) => {
      if (u.family_id === id) {
        u.family_id = null;
        u.family_name = 'Sem família vinculada';
      }
    });
    persistUsersToCache(INITIAL_USERS);

    if (!res.ok && res.error) {
      throw new Error(res.error || 'Falha ao remover família.');
    }
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
  ): Promise<{ success: boolean; family: Family; elderly: ElderlyProfile; message: string }> {
    const res = await safeFetchJson<{
      success: boolean;
      family: Family;
      elderly: ElderlyProfile;
      message: string;
    }>(`/api/families/${familyId}/residence`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (res.ok && res.data && res.data.elderly) {
      persistElderlyCache(res.data.elderly);
      const famIdx = INITIAL_FAMILIES.findIndex((f) => f.id === familyId);
      if (famIdx >= 0 && res.data.family) {
        INITIAL_FAMILIES[famIdx] = res.data.family;
        persistFamiliesCache(INITIAL_FAMILIES);
      }
      return res.data;
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
    if (params.residence_cep) fam.residence_cep = params.residence_cep;
    persistFamiliesCache(INITIAL_FAMILIES);

    INITIAL_ELDERLY = {
      ...INITIAL_ELDERLY,
      residence_address: params.residence_address,
      residence_lat: params.residence_lat,
      residence_long: params.residence_long,
      allowed_radius_meters: params.allowed_radius_meters,
    };
    persistElderlyCache(INITIAL_ELDERLY);

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
  }): Promise<{ success: boolean; elderly: ElderlyProfile; message: string }> {
    const res = await safeFetchJson<{
      success: boolean;
      elderly: ElderlyProfile;
      message: string;
    }>('/api/elderly/residence', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (res.ok && res.data && res.data.elderly) {
      persistElderlyCache(res.data.elderly);
      return res.data;
    }

    INITIAL_ELDERLY = {
      ...INITIAL_ELDERLY,
      residence_address: params.residence_address,
      residence_lat: params.residence_lat,
      residence_long: params.residence_long,
      allowed_radius_meters: params.allowed_radius_meters,
    };
    persistElderlyCache(INITIAL_ELDERLY);

    return {
      success: true,
      elderly: INITIAL_ELDERLY,
      message: 'Residência cadastrada com sucesso!',
    };
  },

  async fetchUsers(includePasswords: boolean = false): Promise<User[]> {
    const res = await safeFetchJson<User[]>(`/api/users${includePasswords ? '?include_passwords=true' : ''}`);
    if (res.ok && Array.isArray(res.data)) {
      persistUsersToCache(res.data);
      return res.data;
    }
    return INITIAL_USERS;
  },

  async createUser(params: {
    name: string;
    last_name?: string;
    username: string;
    password?: string;
    email?: string;
    phone?: string;
    role?: UserRole;
    roles?: UserRole[];
    permission_level?: PermissionLevel;
    family_id?: string | null;
    registration_code?: string;
    classification?: string;
    classification_label?: string;
    requesting_user_id: string;
  }): Promise<User> {
    const res = await safeFetchJson<{ user: User }>('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (res.ok && res.data && res.data.user) {
      INITIAL_USERS.unshift(res.data.user);
      persistUsersToCache(INITIAL_USERS);
      return res.data.user;
    }

    const cleanUser = params.username.toLowerCase().trim();
    const cleanPass = (params.password || '123456').toLowerCase().trim().slice(0, 8);
    const primaryRole = params.role || params.roles?.[0] || 'caregiver';

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: params.name,
      last_name: params.last_name || '',
      username: cleanUser,
      password: cleanPass,
      email: params.email || '',
      phone: params.phone || '',
      role: primaryRole,
      roles: params.roles || [primaryRole],
      permission_level: params.permission_level || 3,
      family_id: params.family_id || null,
      family_name: 'Nossa Família',
      avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      registration_code: params.registration_code || `REG-${Math.floor(1000 + Math.random() * 9000)}`,
      classification: params.classification || 'familiar',
      classification_label: params.classification_label || 'Familiar',
      first_login_completed: true,
      terms_accepted: true,
      created_at: new Date().toISOString(),
    };

    INITIAL_USERS.unshift(newUser);
    persistUsersToCache(INITIAL_USERS);
    return newUser;
  },

  async updateUserProfile(userId: string, data: Partial<User>): Promise<User> {
    const res = await safeFetchJson<{ user: User }>(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok && res.data && res.data.user) {
      const idx = INITIAL_USERS.findIndex((u) => u.id === userId);
      if (idx !== -1) INITIAL_USERS[idx] = res.data.user;
      persistUsersToCache(INITIAL_USERS);
      return res.data.user;
    }

    const idx = INITIAL_USERS.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      INITIAL_USERS[idx] = { ...INITIAL_USERS[idx], ...data };
      persistUsersToCache(INITIAL_USERS);
      return INITIAL_USERS[idx];
    }
    throw new Error('Usuário não encontrado.');
  },

  async updateUserRoles(
    userId: string,
    roles: UserRole[],
    requestingUserId: string
  ): Promise<User> {
    const res = await safeFetchJson<{ user: User }>(`/api/users/${userId}/roles`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles, requesting_user_id: requestingUserId }),
    });

    if (res.ok && res.data && res.data.user) {
      const idx = INITIAL_USERS.findIndex((u) => u.id === userId);
      if (idx !== -1) INITIAL_USERS[idx] = res.data.user;
      persistUsersToCache(INITIAL_USERS);
      return res.data.user;
    }

    const idx = INITIAL_USERS.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      INITIAL_USERS[idx] = {
        ...INITIAL_USERS[idx],
        roles,
        role: roles[0] || 'caregiver',
      };
      persistUsersToCache(INITIAL_USERS);
      return INITIAL_USERS[idx];
    }
    throw new Error('Usuário não encontrado.');
  },

  async deleteUser(id: string, requesting_user_id: string): Promise<void> {
    const res = await safeFetchJson(`/api/users/${id}?requesting_user_id=${requesting_user_id}`, {
      method: 'DELETE',
    });
    const idx = INITIAL_USERS.findIndex((u) => u.id === id);
    if (idx !== -1) {
      INITIAL_USERS.splice(idx, 1);
      persistUsersToCache(INITIAL_USERS);
    }
    if (!res.ok && res.error) {
      throw new Error(res.error || 'Falha ao remover login');
    }
  },

  async completeOnboarding(userId: string, data: Partial<User>): Promise<User> {
    const res = await safeFetchJson<{ user: User }>(`/api/users/${userId}/onboarding`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok && res.data && res.data.user) {
      const idx = INITIAL_USERS.findIndex((u) => u.id === userId);
      if (idx !== -1) INITIAL_USERS[idx] = res.data.user;
      persistUsersToCache(INITIAL_USERS);
      return res.data.user;
    }

    const idx = INITIAL_USERS.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      INITIAL_USERS[idx] = {
        ...INITIAL_USERS[idx],
        ...data,
        first_login_completed: true,
        terms_accepted: true,
      };
      persistUsersToCache(INITIAL_USERS);
      return INITIAL_USERS[idx];
    }
    throw new Error('Usuário não localizado para conclusão do perfil.');
  },

  async registerFacialBiometrics(userId: string, photoBase64: string): Promise<User> {
    const res = await safeFetchJson<{ user: User }>(`/api/users/${userId}/facial-biometrics`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facial_photo_url: photoBase64 }),
    });

    if (res.ok && res.data && res.data.user) {
      const idx = INITIAL_USERS.findIndex((u) => u.id === userId);
      if (idx !== -1) INITIAL_USERS[idx] = res.data.user;
      persistUsersToCache(INITIAL_USERS);
      return res.data.user;
    }

    const idx = INITIAL_USERS.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      INITIAL_USERS[idx] = {
        ...INITIAL_USERS[idx],
        facial_registered: true,
        facial_photo_url: photoBase64,
        facial_registered_at: new Date().toISOString(),
      };
      persistUsersToCache(INITIAL_USERS);
      return INITIAL_USERS[idx];
    }
    throw new Error('Usuário não localizado para cadastro facial.');
  },

  async updateUserLevel(userId: string, level: PermissionLevel, requestingUserId: string): Promise<User> {
    const res = await safeFetchJson<{ user: User }>(`/api/users/${userId}/level`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permission_level: level, requesting_user_id: requestingUserId }),
    });

    if (res.ok && res.data && res.data.user) {
      const idx = INITIAL_USERS.findIndex((u) => u.id === userId);
      if (idx !== -1) INITIAL_USERS[idx] = res.data.user;
      persistUsersToCache(INITIAL_USERS);
      return res.data.user;
    }
    throw new Error(res.error || 'Falha ao atualizar nível do usuário');
  },

  async getFamilyActivityLogs(familyId: string = 'fam-01'): Promise<FamilyActivityLog[]> {
    try {
      const res = await fetch(`/api/family-activity-logs?family_id=${familyId}`);
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  async logFamilyActivity(log: {
    family_id: string;
    user_id: string;
    user_name: string;
    user_role: UserRole;
    action_type: FamilyActivityLog['action_type'];
    category: FamilyActivityLog['category'];
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

  // --- Gestão de Convites ---
  async getInvites(familyId?: string | null): Promise<InviteLink[]> {
    const url = familyId ? `/api/invites?family_id=${encodeURIComponent(familyId)}` : '/api/invites';
    const res = await safeFetchJson<{ invites: InviteLink[] }>(url);
    if (res.ok && res.data && Array.isArray(res.data.invites)) {
      return res.data.invites;
    }
    if (familyId) {
      return localInvites.filter((inv) => !inv.family_id || inv.family_id === familyId);
    }
    return localInvites;
  },

  async createInvite(params: {
    family_id?: string | null;
    roles: UserRole[];
    guest_name?: string;
    classification?: string;
    classification_label?: string;
    requesting_user_id: string;
    max_uses?: number;
  }): Promise<InviteLink> {
    const res = await safeFetchJson<{ invite: InviteLink }>('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (res.ok && res.data?.invite) {
      localInvites.unshift(res.data.invite);
      saveLocalInvites();
      return res.data.invite;
    }

    const code = `CONV-${Math.floor(100000 + Math.random() * 900000)}`;
    const reqUser = INITIAL_USERS.find((u) => u.id === params.requesting_user_id);
    const newInvite: InviteLink = {
      id: `inv-${Date.now()}`,
      code,
      token: `tok-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      family_id: params.family_id || reqUser?.family_id || null,
      family_name: reqUser?.family_name || 'Nossa Família',
      roles: params.roles,
      role_labels: params.roles.map((r) => {
        if (r === 'admin_family') return 'Administrador Familiar';
        if (r === 'caregiver') return 'Cuidador(a) Titular';
        if (r === 'caregiver_substitute') return 'Cuidador(a) Folguista';
        return 'Familiar Acompanhante';
      }),
      guest_name: params.guest_name || 'Convidado(a)',
      classification: params.classification || params.roles[0] || 'family_member',
      classification_label: params.classification_label || 'Acesso Familiar',
      created_by_user_id: params.requesting_user_id,
      created_by_user_name: reqUser?.name || 'Administrador',
      created_at: new Date().toISOString(),
      max_uses: params.max_uses || 1,
      used_count: 0,
      status: 'active',
      used_by_users: [],
    };

    localInvites.unshift(newInvite);
    saveLocalInvites();
    return newInvite;
  },

  async createFamilyWithAdmin(params: {
    name: string;
    elderly_name: string;
    residence_address?: string;
    admin_name: string;
    admin_username: string;
    admin_password: string;
    admin_email?: string;
    requesting_user_id: string;
  }): Promise<{ family: Family; adminUser: User }> {
    const family = await this.createFamily({
      name: params.name,
      elderly_name: params.elderly_name,
      residence_address: params.residence_address,
      requesting_user_id: params.requesting_user_id,
    });

    const adminUser = await this.createUser({
      name: params.admin_name,
      username: params.admin_username,
      password: params.admin_password,
      role: 'admin_family',
      roles: ['admin_family'],
      permission_level: 2,
      family_id: family.id,
      email: params.admin_email,
      requesting_user_id: params.requesting_user_id,
    });

    return { family, adminUser };
  },

  async validateInvite(codeOrToken: string): Promise<{ valid: boolean; invite?: Partial<InviteLink>; message?: string }> {
    const res = await safeFetchJson<{ valid: boolean; invite?: Partial<InviteLink>; message?: string }>(
      `/api/invites/validate/${encodeURIComponent(codeOrToken)}`
    );
    if (res.ok && res.data) {
      return res.data;
    }

    const clean = codeOrToken.trim().toUpperCase();
    const found = localInvites.find(
      (inv) => (inv.code?.toUpperCase() === clean || inv.token === codeOrToken) && inv.status === 'active'
    );

    if (found) {
      return {
        valid: true,
        invite: found,
        message: `Convite válido para ${found.guest_name || 'novo usuário'}!`,
      };
    }

    return { valid: false, message: 'Código de convite não encontrado ou já utilizado.' };
  },

  async registerWithInvite(params: {
    invite_code: string;
    name: string;
    username: string;
    password: string;
    email?: string;
  }): Promise<{ success: boolean; user: User; message: string }> {
    const res = await safeFetchJson<{ success: boolean; user: User; message: string }>('/api/invites/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok && res.data?.user) {
      const u = res.data.user;
      const existingIdx = INITIAL_USERS.findIndex((x) => x.id === u.id || x.username?.toLowerCase() === u.username?.toLowerCase());
      if (existingIdx !== -1) INITIAL_USERS[existingIdx] = u;
      else INITIAL_USERS.push(u);
      persistUsersToCache(INITIAL_USERS);
      return res.data;
    }

    const invite = localInvites.find((inv) => inv.code.toUpperCase() === params.invite_code.trim().toUpperCase());
    const role: UserRole = invite?.roles?.[0] || 'family_member';
    const roles = invite?.roles || [role];
    const permLevel: PermissionLevel = role === 'admin_family' ? 2 : role === 'caregiver' ? 3 : role === 'caregiver_substitute' ? 4 : 5;

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: params.name,
      username: params.username.toLowerCase().trim(),
      password: params.password.toLowerCase().trim().slice(0, 8),
      email: params.email,
      role,
      roles,
      permission_level: permLevel,
      family_id: invite?.family_id || null,
      family_name: invite?.family_name || 'Nossa Família',
      first_login_completed: false,
      terms_accepted: false,
      created_at: new Date().toISOString(),
    };

    INITIAL_USERS.push(newUser);
    persistUsersToCache(INITIAL_USERS);

    if (invite) {
      invite.used_count += 1;
      if (invite.used_count >= invite.max_uses) invite.status = 'used';
      saveLocalInvites();
    }

    return {
      success: true,
      user: newUser,
      message: 'Conta criada com sucesso! Faça seu primeiro acesso.',
    };
  },

  async revokeInvite(inviteId: string): Promise<void> {
    const idx = localInvites.findIndex((i) => i.id === inviteId);
    if (idx !== -1) {
      localInvites[idx].status = 'revoked';
      saveLocalInvites();
    }
    try {
      await fetch(`/api/invites/${inviteId}`, { method: 'DELETE' });
    } catch {}
  },

  // Shift Schedules / Escala de Plantão da Família
  async getShiftSchedules(familyId?: string, userId?: string): Promise<ShiftSchedule[]> {
    const params = new URLSearchParams();
    if (familyId) params.append('family_id', familyId);
    if (userId) params.append('user_id', userId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await safeFetchJson<ShiftSchedule[]>(`/api/shift-schedules${query}`);
    if (res.ok && Array.isArray(res.data)) {
      try {
        localStorage.setItem('cuida_shift_schedules_cache', JSON.stringify(res.data));
      } catch {}
      return res.data;
    }
    try {
      const cached = localStorage.getItem('cuida_shift_schedules_cache');
      if (cached) {
        let list: ShiftSchedule[] = JSON.parse(cached);
        if (familyId) list = list.filter((s) => s.family_id === familyId);
        if (userId) list = list.filter((s) => s.user_id === userId);
        return list;
      }
    } catch {}
    return [];
  },

  async createShiftSchedule(params: Partial<ShiftSchedule>): Promise<ShiftSchedule> {
    const res = await safeFetchJson<{ success: boolean; message: string; schedule: ShiftSchedule }>('/api/shift-schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok && res.data && res.data.schedule) {
      return res.data.schedule;
    }
    if (!res.ok && res.error) {
      throw new Error(res.error);
    }
    throw new Error('Erro ao salvar escala de plantão.');
  },

  async updateShiftSchedule(id: string, params: Partial<ShiftSchedule>): Promise<ShiftSchedule> {
    const res = await safeFetchJson<{ success: boolean; message: string; schedule: ShiftSchedule }>(`/api/shift-schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok && res.data && res.data.schedule) {
      return res.data.schedule;
    }
    if (!res.ok && res.error) {
      throw new Error(res.error);
    }
    throw new Error('Erro ao atualizar escala de plantão.');
  },

  async deleteShiftSchedule(id: string): Promise<void> {
    const res = await safeFetchJson<{ success: boolean; message: string }>(`/api/shift-schedules/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok && res.error) {
      throw new Error(res.error);
    }
  },
};
