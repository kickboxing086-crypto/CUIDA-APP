import { FamilyMemberClassification, UserRole } from '../types';

export interface ClassificationDefinition {
  id: FamilyMemberClassification;
  label: string;
  category: 'familiar' | 'cuidador';
  defaultRoles: UserRole[];
  description: string;
  emoji: string;
}

export const CLASSIFICATIONS: ClassificationDefinition[] = [
  {
    id: 'irmao_irma',
    label: 'Irmão / Irmã',
    category: 'familiar',
    defaultRoles: ['family_member'],
    description: 'Irmão ou irmã do administrador familiar (filho do idoso assistido). Acompanha rotina e saúde.',
    emoji: '👨‍👩‍👧‍👦',
  },
  {
    id: 'filho_filha',
    label: 'Filho / Filha',
    category: 'familiar',
    defaultRoles: ['family_member'],
    description: 'Filho ou filha do idoso assistido.',
    emoji: '👦👧',
  },
  {
    id: 'esposo_esposa',
    label: 'Cônjuge / Esposo(a)',
    category: 'familiar',
    defaultRoles: ['family_member'],
    description: 'Esposo(a) ou companheiro(a) do idoso ou do contratante.',
    emoji: '💍',
  },
  {
    id: 'neto_neta',
    label: 'Neto / Neta',
    category: 'familiar',
    defaultRoles: ['family_member'],
    description: 'Neto ou neta do idoso assistido.',
    emoji: '🧒',
  },
  {
    id: 'cuidador_profissional',
    label: 'Cuidador(a) Profissional',
    category: 'cuidador',
    defaultRoles: ['caregiver'],
    description: 'Profissional responsável por bater ponto, registrar sinais vitais, medicamentos e missões diárias.',
    emoji: '🩺',
  },
  {
    id: 'cuidador_folguista',
    label: 'Cuidador(a) Folguista / Substituto',
    category: 'cuidador',
    defaultRoles: ['caregiver_substitute'],
    description: 'Cuidador(a) para cobertura de folgas ou plantões específicos.',
    emoji: '⏱️',
  },
  {
    id: 'tio_sobrinho',
    label: 'Tio(a) / Sobrinho(a)',
    category: 'familiar',
    defaultRoles: ['family_member'],
    description: 'Parente de segundo grau com acesso de acompanhamento.',
    emoji: '🤝',
  },
  {
    id: 'outro_familiar',
    label: 'Outro Membro Familiar / Parente',
    category: 'familiar',
    defaultRoles: ['family_member'],
    description: 'Demais familiares autorizados a visualizar as atividades do idoso.',
    emoji: '👥',
  },
];

export function getClassificationById(id: string): ClassificationDefinition | undefined {
  return CLASSIFICATIONS.find((c) => c.id === id);
}

export function getClassificationLabel(id?: string): string {
  if (!id) return 'Membro Familiar';
  const found = getClassificationById(id);
  return found ? found.label : id;
}
