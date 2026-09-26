import { UserRole } from '../types';

export interface RolePowerProfile {
  id: UserRole;
  title: string;
  badge: string;
  level: number;
  colorTheme: {
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    accent: string;
  };
  summary: string;
  powers: string[];
}

export const ROLE_POWER_PROFILES: RolePowerProfile[] = [
  {
    id: 'admin_family',
    title: 'Administrador Familiar',
    badge: 'Gestão Total & Contratante',
    level: 2,
    colorTheme: {
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-500/50',
      badgeBg: 'bg-emerald-500/20',
      badgeText: 'text-emerald-300',
      accent: 'text-emerald-400',
    },
    summary: 'Controle integral da conta familiar, gestão de convites, endereço residencial e auditoria.',
    powers: [
      'Cadastrar e alterar o endereço residencial do idoso e raio de GPS',
      'Gerar e revogar links de convites para novos cuidadores e familiares',
      'Criar, editar e supervisionar obrigações e missões diárias',
      'Assinar boletim diário de ocorrências e validar ponto manual',
      'Visualizar auditoria completa de horários, sinais vitais e relatórios',
    ],
  },
  {
    id: 'caregiver',
    title: 'Cuidador(a) Titular',
    badge: 'Operacional Principal',
    level: 3,
    colorTheme: {
      bg: 'bg-blue-950/40',
      border: 'border-blue-500/50',
      badgeBg: 'bg-blue-500/20',
      badgeText: 'text-blue-300',
      accent: 'text-blue-400',
    },
    summary: 'Profissional responsável pelo atendimento diário, registro de ponto e cuidados de saúde.',
    powers: [
      'Bater ponto facial de Entrada e Saída com GPS auditado',
      'Registrar aferição de sinais vitais (PA, glicemia, saturação, temperatura)',
      'Confirmar e marcar medicamentos administrados nos horários',
      'Cumprir e dar baixa nas missões e rotinas diárias do idoso',
      'Relatar boletins de ocorrências e alterações clínicas do dia',
    ],
  },
  {
    id: 'caregiver_substitute',
    title: 'Cuidador(a) Folguista / Plantonista',
    badge: 'Cobertura de Plantão',
    level: 4,
    colorTheme: {
      bg: 'bg-amber-950/40',
      border: 'border-amber-500/50',
      badgeBg: 'bg-amber-500/20',
      badgeText: 'text-amber-300',
      accent: 'text-amber-400',
    },
    summary: 'Cuidador(a) para cobertura de folgas ou plantões específicos com acesso operacional.',
    powers: [
      'Bater ponto facial nos dias de plantão ou substituição',
      'Registrar sinais vitais e ministrar medicações programadas',
      'Acessar instruções clínicas e contatos de emergência do idoso',
      'Dar baixa nas tarefas da rotina durante o turno de trabalho',
    ],
  },
  {
    id: 'family_member',
    title: 'Familiar Acompanhante',
    badge: 'Monitoramento & Mural',
    level: 5,
    colorTheme: {
      bg: 'bg-indigo-950/40',
      border: 'border-indigo-500/50',
      badgeBg: 'bg-indigo-500/20',
      badgeText: 'text-indigo-300',
      accent: 'text-indigo-400',
    },
    summary: 'Familiar autorizado a acompanhar em tempo real todas as atividades e saúde do idoso.',
    powers: [
      'Acompanhar horários de entrada e saída dos cuidadores em tempo real',
      'Visualizar gráficos de pressão arterial, glicemia e evolução de saúde',
      'Ver confirmações de medicamentos administrados na rotina',
      'Interagir e publicar avisos e recados no mural da família',
    ],
  },
];

export function getRolePowerProfile(role: UserRole): RolePowerProfile {
  const found = ROLE_POWER_PROFILES.find((p) => p.id === role);
  return found || ROLE_POWER_PROFILES[3];
}

// Backward compatibility helper
export const CLASSIFICATIONS = ROLE_POWER_PROFILES.map((p) => ({
  id: p.id,
  label: p.title,
  category: p.id === 'caregiver' || p.id === 'caregiver_substitute' ? 'cuidador' : 'familiar',
  defaultRoles: [p.id],
  description: p.summary,
  emoji: p.id === 'admin_family' ? '🛡️' : p.id === 'caregiver' ? '🩺' : p.id === 'caregiver_substitute' ? '⏱️' : '👨‍👩‍👧‍👦',
}));

export function getClassificationById(id: string) {
  return CLASSIFICATIONS.find((c) => c.id === id);
}

export function getClassificationLabel(id?: string): string {
  if (!id) return 'Familiar Acompanhante';
  const profile = ROLE_POWER_PROFILES.find((p) => p.id === id);
  if (profile) return profile.title;
  return id;
}
