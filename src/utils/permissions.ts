import { UserRole, RoleDefinition, PermissionLevel, PermissionLevelInfo } from '../types';

export const AVAILABLE_ROLES: Record<UserRole, RoleDefinition> = {
  caregiver: {
    id: 'caregiver',
    name: 'Cuidador',
    badge: 'Cuidador(a)',
    color: 'emerald',
    description: 'Bate ponto com selfie facial e GPS presencial na residência, executa missões diárias, afere sinais vitais e administra remédios.',
    permissions: {
      can_manage_logins: false,
      can_manage_families: false,
      can_manage_residence: false,
      can_edit_missions: false,
      can_log_vitals: true,
      can_edit_vitals: true,
      can_clock_in: true,
      can_sign_contractor: false,
      can_write_incidents: true,
      can_view_family_audit: true,
    },
  },
  admin_family: {
    id: 'admin_family',
    name: 'Administrador Familiar',
    badge: 'Admin Familiar',
    color: 'blue',
    description: 'Cadastra o endereço e a geolocalização da residência do idoso (perímetro anti-fraude de ponto), cria missões POP, aprova horas e assina o boletim.',
    permissions: {
      can_manage_logins: false,
      can_manage_families: false,
      can_manage_residence: true,
      can_edit_missions: true,
      can_log_vitals: true,
      can_edit_vitals: true,
      can_clock_in: false,
      can_sign_contractor: true,
      can_write_incidents: true,
      can_view_family_audit: true,
    },
  },
  family_member: {
    id: 'family_member',
    name: 'Familiar Acompanhante',
    badge: 'Familiar',
    color: 'indigo',
    description: 'Visualização em tempo real de sinais vitais, boletins de ocorrência, folha de presença e histórico de alterações (modo observador).',
    permissions: {
      can_manage_logins: false,
      can_manage_families: false,
      can_manage_residence: false,
      can_edit_missions: false,
      can_log_vitals: false,
      can_edit_vitals: false,
      can_clock_in: false,
      can_sign_contractor: false,
      can_write_incidents: false,
      can_view_family_audit: true,
    },
  },
  caregiver_substitute: {
    id: 'caregiver_substitute',
    name: 'Cuidador Folguista / Plantonista',
    badge: 'Folguista / Plantonista',
    color: 'amber',
    description: 'Registro de ponto facial no turno de cobertura (com validação de presença na residência), execução de tarefas e remédios tomados.',
    permissions: {
      can_manage_logins: false,
      can_manage_families: false,
      can_manage_residence: false,
      can_edit_missions: false,
      can_log_vitals: true,
      can_edit_vitals: false,
      can_clock_in: true,
      can_sign_contractor: false,
      can_write_incidents: true,
      can_view_family_audit: true,
    },
  },
  admin_geral: {
    id: 'admin_geral',
    name: 'Administrador Geral',
    badge: 'Master Global',
    color: 'purple',
    description: 'Acesso total à criação de famílias, cadastro de residências, geração de logins de clientes, visualização de senhas e auditoria mestre.',
    permissions: {
      can_manage_logins: true,
      can_manage_families: true,
      can_manage_residence: true,
      can_edit_missions: true,
      can_log_vitals: true,
      can_edit_vitals: true,
      can_clock_in: false,
      can_sign_contractor: true,
      can_write_incidents: true,
      can_view_family_audit: true,
    },
  },
};

export const PERMISSION_LEVELS: Record<PermissionLevel, PermissionLevelInfo> = {
  1: {
    level: 1,
    role: 'admin_geral',
    title: 'Administrador Geral',
    badge: 'Master Global',
    color: 'purple',
    description: AVAILABLE_ROLES.admin_geral.description,
    permissions: AVAILABLE_ROLES.admin_geral.permissions,
  },
  2: {
    level: 2,
    role: 'admin_family',
    title: 'Administrador Familiar',
    badge: 'Admin Familiar',
    color: 'blue',
    description: AVAILABLE_ROLES.admin_family.description,
    permissions: AVAILABLE_ROLES.admin_family.permissions,
  },
  3: {
    level: 3,
    role: 'caregiver',
    title: 'Cuidador',
    badge: 'Cuidador',
    color: 'emerald',
    description: AVAILABLE_ROLES.caregiver.description,
    permissions: AVAILABLE_ROLES.caregiver.permissions,
  },
  4: {
    level: 4,
    role: 'caregiver_substitute',
    title: 'Cuidador Folguista / Plantonista',
    badge: 'Folguista',
    color: 'amber',
    description: AVAILABLE_ROLES.caregiver_substitute.description,
    permissions: AVAILABLE_ROLES.caregiver_substitute.permissions,
  },
  5: {
    level: 5,
    role: 'family_member',
    title: 'Familiar Acompanhante',
    badge: 'Familiar Observador',
    color: 'indigo',
    description: AVAILABLE_ROLES.family_member.description,
    permissions: AVAILABLE_ROLES.family_member.permissions,
  },
};

export function getRoleDefinition(role: UserRole): RoleDefinition {
  return AVAILABLE_ROLES[role] || AVAILABLE_ROLES.caregiver;
}

export function getPermissionInfo(level?: PermissionLevel | number): PermissionLevelInfo {
  const lvl = (level || 3) as PermissionLevel;
  return PERMISSION_LEVELS[lvl] || PERMISSION_LEVELS[3];
}

/**
 * Combines permissions when a user has up to 2 roles.
 */
export function getCombinedPermissions(roles: UserRole[]) {
  const base = {
    can_manage_logins: false,
    can_manage_families: false,
    can_manage_residence: false,
    can_edit_missions: false,
    can_log_vitals: false,
    can_edit_vitals: false,
    can_clock_in: false,
    can_sign_contractor: false,
    can_write_incidents: false,
    can_view_family_audit: true,
  };

  roles.forEach((r) => {
    const def = AVAILABLE_ROLES[r];
    if (def) {
      if (def.permissions.can_manage_logins) base.can_manage_logins = true;
      if (def.permissions.can_manage_families) base.can_manage_families = true;
      if (def.permissions.can_manage_residence) base.can_manage_residence = true;
      if (def.permissions.can_edit_missions) base.can_edit_missions = true;
      if (def.permissions.can_log_vitals) base.can_log_vitals = true;
      if (def.permissions.can_edit_vitals) base.can_edit_vitals = true;
      if (def.permissions.can_clock_in) base.can_clock_in = true;
      if (def.permissions.can_sign_contractor) base.can_sign_contractor = true;
      if (def.permissions.can_write_incidents) base.can_write_incidents = true;
      if (def.permissions.can_view_family_audit) base.can_view_family_audit = true;
    }
  });

  return base;
}

/**
 * Helper to inspect character breakdown for real-time validation checklist
 */
export function inspectCredentials(username: string, password: string) {
  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim().toLowerCase().slice(0, 8);

  const hasLettersPass = /[a-z]/i.test(cleanPass);
  const hasNumbersPass = /[0-9]/.test(cleanPass);
  const hasSpecialPass = /[^a-z0-9]/i.test(cleanPass);

  const hasLettersUser = /[a-z]/i.test(cleanUser);
  const hasNumbersUser = /[0-9]/.test(cleanUser);

  return {
    cleanUser,
    cleanPass,
    userMinLength: cleanUser.length >= 3,
    passMinLength: cleanPass.length >= 3,
    passMaxLength: cleanPass.length <= 8 && cleanPass.length > 0,
    passLength: cleanPass.length,
    hasLettersPass,
    hasNumbersPass,
    hasSpecialPass,
    hasLettersUser,
    hasNumbersUser,
    isUserLowercase: username === username.toLowerCase(),
    isPassLowercase: password === password.toLowerCase(),
  };
}

export function validateUsername(username: string): { valid: boolean; error?: string } {
  const trimmed = username.trim().toLowerCase();
  if (trimmed.length < 3) {
    return { valid: false, error: 'O nome de usuário deve ter pelo menos 3 caracteres.' };
  }
  const regex = /^[a-z0-9._@!#$\-%]+$/;
  if (!regex.test(trimmed)) {
    return {
      valid: false,
      error: 'O nome de usuário aceita apenas letras minúsculas, números e caracteres (. _ - @ ! # $ %). Espaços não são permitidos.',
    };
  }
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  const trimmed = password.trim().toLowerCase();
  if (trimmed.length < 3) {
    return {
      valid: false,
      error: 'A senha deve conter no mínimo 3 caracteres.',
    };
  }
  if (trimmed.length > 8) {
    return {
      valid: false,
      error: 'A senha é limitada a NO MÁXIMO 8 caracteres.',
    };
  }
  return { valid: true };
}
