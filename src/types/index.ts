export type FamilyMemberClassification =
  | 'irmao_irma'
  | 'filho_filha'
  | 'esposo_esposa'
  | 'neto_neta'
  | 'cuidador_profissional'
  | 'cuidador_folguista'
  | 'tio_sobrinho'
  | 'outro_familiar';

export interface InviteLink {
  id: string;
  code: string;
  token: string;
  family_id: string | null;
  family_name: string;
  roles: UserRole[];
  role_labels: string[];
  guest_name?: string;
  classification?: FamilyMemberClassification | string;
  classification_label?: string;
  created_by_user_id: string;
  created_by_user_name: string;
  created_at: string;
  max_uses: number;
  used_count: number;
  status: 'active' | 'used' | 'revoked';
  used_by_users?: { user_id: string; username: string; used_at: string }[];
}

export type UserRole =
  | 'admin_geral'
  | 'admin_family'
  | 'caregiver'
  | 'caregiver_substitute'
  | 'family_member';

export type PermissionLevel = 1 | 2 | 3 | 4 | 5;

export interface RoleDefinition {
  id: UserRole;
  name: string;
  badge: string;
  color: string;
  description: string;
  permissions: {
    can_manage_logins: boolean;
    can_manage_families: boolean;
    can_manage_residence: boolean;
    can_edit_missions: boolean;
    can_log_vitals: boolean;
    can_edit_vitals: boolean;
    can_clock_in: boolean;
    can_sign_contractor: boolean;
    can_write_incidents: boolean;
    can_view_family_audit: boolean;
  };
}

export interface PermissionLevelInfo {
  level: PermissionLevel;
  role: UserRole;
  title: string;
  badge: string;
  color: string;
  description: string;
  permissions: {
    can_manage_logins: boolean;
    can_manage_families: boolean;
    can_manage_residence: boolean;
    can_edit_missions: boolean;
    can_log_vitals: boolean;
    can_edit_vitals: boolean;
    can_clock_in: boolean;
    can_sign_contractor: boolean;
    can_write_incidents: boolean;
    can_view_family_audit: boolean;
  };
}

export interface Family {
  id: string;
  name: string; // Ex: 'Família Silveira'
  elderly_name: string; // Ex: 'Dona Maria de Lourdes Silveira'
  elderly_id?: string;
  residence_address?: string;
  residence_lat?: number;
  residence_long?: number;
  allowed_radius_meters?: number;
  residence_cep?: string;
  residence_updated_at?: string;
  residence_updated_by?: string;
  created_at: string;
  notes?: string;
}

export interface FamilyLoginItem {
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
  first_login_completed?: boolean;
  facial_registered?: boolean;
  facial_photo_url?: string;
  facial_registered_at?: string;
}

export interface FamilyWithLogins {
  id: string;
  name: string;
  elderly_name: string;
  residence_address?: string;
  residence_lat?: number;
  residence_long?: number;
  allowed_radius_meters?: number;
  residence_cep?: string;
  logins: FamilyLoginItem[];
}

export interface User {
  id: string;
  name: string;
  last_name?: string;
  username: string;
  password?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  roles?: UserRole[];
  role_label?: string;
  role_labels?: string[];
  permission_level: PermissionLevel;
  permission_level_title?: string;
  family_id?: string | null;
  family_name?: string | null;
  avatar_url?: string;
  registration_code?: string;
  classification?: string;
  classification_label?: string;
  first_login_completed?: boolean;
  facial_registered?: boolean;
  facial_photo_url?: string;
  facial_registered_at?: string;
  terms_accepted?: boolean;
  created_at?: string;
}

export interface FamilyActivityLog {
  id: string;
  family_id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  action_type: 'vitals_added' | 'vitals_edited' | 'mission_created' | 'mission_completed' | 'incident_reported' | 'incident_signed' | 'medication_administered' | 'presence_clock' | 'family_notice';
  category: 'Sinais Vitais' | 'Obrigações Diárias' | 'Boletim do Idoso' | 'Medicamentos' | 'Controle de Ponto' | 'Mural';
  description: string;
  details?: string;
  created_at: string;
  formatted_time?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  kinship: string;
}

export interface ElderlyProfile {
  id: string;
  full_name: string;
  birth_date: string;
  blood_type: string;
  allergies: string[];
  emergency_contacts: EmergencyContact[];
  residence_address?: string;
  residence_lat: number;
  residence_long: number;
  allowed_radius_meters: number;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  user_name?: string;
  elderly_id: string;
  entry_time: string;
  entry_photo_url: string;
  exit_time: string | null;
  exit_photo_url: string | null;
  total_hours: number | null;
  total_hours_formatted?: string;
  location_lat: number;
  location_long: number;
  distance_meters?: number;
  is_verified_geofence?: boolean;
  date_stamp: string; // YYYY-MM-DD
  day_of_week: string;
  entry_type?: 'biometric_facial' | 'manual_authorized' | 'specialist_visit';
  justification?: string;
  authorized_by_name?: string;
  notes?: string;
}

export type MissionCategory = 'medication' | 'vitals' | 'hygiene' | 'meals' | 'activity' | 'special';
export type MissionPriority = 'mandatory' | 'routine' | 'urgent';

export interface DailyMission {
  id: string;
  elderly_id: string;
  title: string;
  scheduled_time: string; // HH:mm
  category: MissionCategory;
  priority: MissionPriority;
  clear_instructions: string; // Instrução clara e concisa do administrador
  created_by_user_id: string;
  created_by_name: string;
  is_active: boolean;
  completed: boolean;
  completed_at?: string | null;
  completed_by_name?: string | null;
  execution_notes?: string | null;
}

export interface CaregiverDailyTask {
  id: string;
  title: string;
  time: string;
  category: 'hygiene' | 'meals' | 'medication' | 'vitals' | 'activity';
  completed: boolean;
  completed_at?: string;
  notes?: string;
}

export interface HealthLog {
  id: string;
  elderly_id: string;
  recorded_by_user_id: string;
  recorded_by_name?: string;
  systolic_bp: number | null; // Opcional a critério do cuidador ou medição do dia
  diastolic_bp: number | null; // Opcional
  heart_rate: number | null; // Opcional
  glucose: number | null;
  glucose_context?: string;
  temperature_c: number | null;
  weight_kg?: number | null;
  status_category?: string;
  is_bp_measured?: boolean;
  contractor_signed?: boolean; // Assinatura exigida pelo contratante
  caregiver_signed?: boolean;
  notes?: string;
  created_at: string;
}

export type GeneralWellbeing = 'otimo' | 'estavel' | 'atencao' | 'mal_estar';

export interface DailyIncidentReport {
  id: string;
  elderly_id: string;
  date_stamp: string; // YYYY-MM-DD
  day_of_week: string;
  recorded_by_user_id: string;
  recorded_by_name: string;
  recorded_by_role: 'caregiver' | 'admin_family' | 'family_member';
  general_state: GeneralWellbeing;
  had_discomfort: boolean;
  discomfort_types?: string[];
  symptoms_description: string;
  actions_taken: string;
  contractor_signed: boolean;
  contractor_signed_name?: string;
  caregiver_signed: boolean;
  caregiver_signed_name?: string;
  family_viewed_by?: string[];
  created_at: string;
}

export type MedicationStatus = 'pending' | 'taken' | 'skipped';

export interface MedicationLog {
  id: string;
  elderly_id: string;
  medication_name: string;
  dosage: string;
  scheduled_time: string; // HH:mm
  instructions?: string;
  administered_at: string | null;
  administered_by_user_id: string | null;
  administered_by_name?: string | null;
  status: MedicationStatus;
}

export interface FamilyNotice {
  id: string;
  elderly_id: string;
  created_by_user_id: string;
  created_by_name?: string;
  category?: 'shopping' | 'medical' | 'routine';
  title: string;
  description: string;
  is_resolved: boolean;
  created_at: string;
}

export interface OfficialServerTime {
  iso_timestamp: string;
  epoch_ms: number;
  timezone: string;
  ntp_synchronized: boolean;
  server_hostname: string;
  formatted_date: string;
  formatted_time: string;
  day_of_week: string;
  day_of_month: string;
  month_name: string;
  year: string;
  date_stamp: string;
}
