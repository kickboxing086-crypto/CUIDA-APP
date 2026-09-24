import React, { useState } from 'react';
import { Database, Code2, Shield, Copy, Check, Terminal, FileCode2 } from 'lucide-react';

export const TechSpecView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ddl' | 'apis' | 'rls'>('ddl');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const sqlDDL = `-- ============================================================================
-- PROJETO CUIDA - ESQUEMA DE BANCO DE DADOS POSTGRESQL / SUPABASE
-- CONTROLE UNIFICADO DE IDOSOS E DIÁRIO DE ASSISTÊNCIA
-- ============================================================================

-- Habilitar extensões necessárias para UUID e Criptografia
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. ENUMS E DOMÍNIOS
-- ----------------------------------------------------------------------------
CREATE TYPE user_role_enum AS ENUM ('admin_family', 'caregiver', 'family_member');
CREATE TYPE medication_status_enum AS ENUM ('pending', 'taken', 'skipped');
CREATE TYPE notice_category_enum AS ENUM ('shopping', 'medical', 'routine');

-- ----------------------------------------------------------------------------
-- 2. TABELA: users (Perfis de Usuários e Permissões)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'caregiver',
    avatar_url TEXT,
    registration_code VARCHAR(50),
    phone VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. TABELA: elderly_profiles (Idosos Assistidos e Ficha Médica)
-- ----------------------------------------------------------------------------
CREATE TABLE elderly_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_admin_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    blood_type VARCHAR(5) NOT NULL, -- Ex: 'A+', 'O-', 'AB+'
    allergies TEXT[] DEFAULT ARRAY[]::TEXT[],
    emergency_contacts_json JSONB NOT NULL DEFAULT '[]'::JSONB,
    residence_address TEXT NOT NULL,
    residence_lat NUMERIC(10, 7) NOT NULL,
    residence_long NUMERIC(10, 7) NOT NULL,
    allowed_radius_meters INT NOT NULL DEFAULT 300,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. TABELA: elderly_caregivers (Vínculo de Prestação de Cuidados / Turnos)
-- ----------------------------------------------------------------------------
CREATE TABLE elderly_caregivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elderly_id UUID NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,
    caregiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shift_description VARCHAR(100) DEFAULT 'Plantão 12x36',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(elderly_id, caregiver_id)
);

-- ----------------------------------------------------------------------------
-- 5. TABELA: time_entries (Ponto Eletrônico Seguro com Selfie e NTP)
-- ----------------------------------------------------------------------------
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    elderly_id UUID NOT NULL REFERENCES elderly_profiles(id) ON DELETE RESTRICT,
    
    -- Marcação de Entrada
    entry_time TIMESTAMPTZ NOT NULL, -- Sincronizado estritamente via Servidor NTP
    entry_photo_url TEXT NOT NULL,   -- Foto frontal ao vivo (sem galeria)
    
    -- Marcação de Saída
    exit_time TIMESTAMPTZ,           -- Sincronizado estritamente via Servidor NTP
    exit_photo_url TEXT,            -- Foto frontal de encerramento
    
    -- Permanência e Georreferenciamento
    total_hours NUMERIC(5, 2),      -- Horas decimais calculadas automaticamente
    location_lat NUMERIC(10, 7) NOT NULL,
    location_long NUMERIC(10, 7) NOT NULL,
    distance_meters INT,
    is_verified_geofence BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Metadados de Calendário Oficial
    date_stamp DATE NOT NULL,        -- Formato YYYY-MM-DD para índices rápidos
    day_of_week VARCHAR(30) NOT NULL, -- Ex: 'Segunda-feira', 'Terça-feira'
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. TABELA: health_logs (Diário de Sinais Vitais e Indicadores Clínicos)
-- ----------------------------------------------------------------------------
CREATE TABLE health_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elderly_id UUID NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,
    recorded_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Parâmetros Cardiovasculares
    systolic_bp INT NOT NULL CHECK (systolic_bp BETWEEN 50 AND 300),
    diastolic_bp INT NOT NULL CHECK (diastolic_bp BETWEEN 30 AND 200),
    heart_rate INT NOT NULL CHECK (heart_rate BETWEEN 30 AND 250),
    status_category VARCHAR(50), -- 'Normal', 'Pré-hipertensão', 'Crise Hipertensiva'
    
    -- Indicadores Complementares
    glucose NUMERIC(5, 1),       -- mg/dL
    glucose_context VARCHAR(50), -- 'Jejum matinal', '2h pós-almoço'
    temperature_c NUMERIC(4, 1), -- °C
    weight_kg NUMERIC(5, 2),     -- kg
    
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. TABELA: medication_logs (Prescrição e Checklist de Ministração)
-- ----------------------------------------------------------------------------
CREATE TABLE medication_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elderly_id UUID NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    scheduled_time TIME NOT NULL, -- Ex: '08:00:00'
    instructions TEXT,
    
    -- Confirmação de Ministração
    administered_at TIMESTAMPTZ,
    administered_by_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    status medication_status_enum NOT NULL DEFAULT 'pending',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. TABELA: family_notices (Mural de Recados e Insumos em Falta)
-- ----------------------------------------------------------------------------
CREATE TABLE family_notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elderly_id UUID NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    category notice_category_enum NOT NULL DEFAULT 'shopping',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. TABELA: daily_care_missions (Plano de Missões Diárias & POP do Administrador)
-- ----------------------------------------------------------------------------
CREATE TABLE daily_care_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elderly_id UUID NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    scheduled_time TIME NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'medication',
    priority VARCHAR(50) NOT NULL DEFAULT 'mandatory', -- 'mandatory', 'routine', 'urgent'
    clear_instructions TEXT NOT NULL, -- Instrução clara e concisa do administrador geral
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at VARCHAR(10),
    completed_by_name VARCHAR(255),
    execution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- ÍNDICES DE ALTA PERFORMANCE (QUERY OPTIMIZATION)
-- ----------------------------------------------------------------------------
CREATE INDEX idx_time_entries_user_date ON time_entries (user_id, date_stamp);
CREATE INDEX idx_time_entries_elderly_date ON time_entries (elderly_id, date_stamp);
CREATE INDEX idx_health_logs_elderly_date ON health_logs (elderly_id, created_at DESC);
CREATE INDEX idx_medication_logs_elderly_status ON medication_logs (elderly_id, status);
CREATE INDEX idx_daily_care_missions_elderly ON daily_care_missions (elderly_id, scheduled_time);
CREATE INDEX idx_family_notices_elderly_resolved ON family_notices (elderly_id, is_resolved);

-- ----------------------------------------------------------------------------
-- TRIGGER: Cálculo Automático de Total de Horas no Check-out
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_calculate_shift_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.exit_time IS NOT NULL AND NEW.entry_time IS NOT NULL THEN
        NEW.total_hours := ROUND(
            EXTRACT(EPOCH FROM (NEW.exit_time - NEW.entry_time)) / 3600.0, 
            2
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_shift_hours
BEFORE INSERT OR UPDATE ON time_entries
FOR EACH ROW
EXECUTE FUNCTION fn_calculate_shift_hours();`;

  const rlsPolicies = `-- ============================================================================
-- REGRAS DE SEGURANÇA E POLÍTICAS RLS (ROW LEVEL SECURITY) - SUPABASE
-- ISOLAMENTO ESTRITO DE DADOS ENTRE FAMÍLIAS E PERMISSÕES RBAC
-- ============================================================================

-- Ativar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE elderly_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE elderly_caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_notices ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- FUNÇÃO AUXILIAR: Verifica se o usuário autenticado pertence à família do idoso
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_family_member(p_elderly_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM elderly_profiles ep
    WHERE ep.id = p_elderly_id
    AND (
      ep.family_admin_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role IN ('admin_family', 'family_member')
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- FUNÇÃO AUXILIAR: Verifica se o usuário é cuidador ativo atribuído ao idoso
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_assigned_caregiver(p_elderly_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM elderly_caregivers ec
    WHERE ec.elderly_id = p_elderly_id
    AND ec.caregiver_id = auth.uid()
    AND ec.is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 1. POLÍTICAS: elderly_profiles
-- Família tem controle total; Cuidadores ativos possuem permissão de leitura
-- ----------------------------------------------------------------------------
CREATE POLICY "Família pode ver seus próprios idosos"
ON elderly_profiles FOR SELECT
USING (is_family_member(id) OR is_assigned_caregiver(id));

CREATE POLICY "Apenas admin familiar pode criar e editar perfis de idosos"
ON elderly_profiles FOR ALL
USING (family_admin_id = auth.uid())
WITH CHECK (family_admin_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 2. POLÍTICAS: time_entries (Ponto Eletrônico Seguro)
-- Cuidadores só inserem para si mesmos; Família pode auditar e exportar
-- ----------------------------------------------------------------------------
CREATE POLICY "Cuidadores inserem seu próprio ponto de entrada e saída"
ON time_entries FOR INSERT
WITH CHECK (
    auth.uid() = user_id 
    AND is_assigned_caregiver(elderly_id)
);

CREATE POLICY "Cuidadores podem atualizar seu próprio ponto para check-out"
ON time_entries FOR UPDATE
USING (auth.uid() = user_id AND exit_time IS NULL)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Família e cuidador podem visualizar histórico de pontos"
ON time_entries FOR SELECT
USING (
    auth.uid() = user_id 
    OR is_family_member(elderly_id)
);

-- Bloqueio estrito de DELETE no ponto eletrônico (Inviolabilidade de auditoria)
CREATE POLICY "Bloqueio total de exclusão de ponto para auditoria legal"
ON time_entries FOR DELETE
USING (FALSE);

-- ----------------------------------------------------------------------------
-- 3. POLÍTICAS: health_logs (Sinais Vitais e Saúde)
-- Cuidadores e familiares autorizados podem registrar e ler medições
-- ----------------------------------------------------------------------------
CREATE POLICY "Membros da família e cuidadores podem ver sinais vitais"
ON health_logs FOR SELECT
USING (is_family_member(elderly_id) OR is_assigned_caregiver(elderly_id));

CREATE POLICY "Cuidadores e família podem registrar novas aferições"
ON health_logs FOR INSERT
WITH CHECK (
    auth.uid() = recorded_by_user_id
    AND (is_family_member(elderly_id) OR is_assigned_caregiver(elderly_id))
);

-- ----------------------------------------------------------------------------
-- 4. POLÍTICAS: medication_logs & family_notices
-- ----------------------------------------------------------------------------
CREATE POLICY "Acesso a medicamentos compartilhado no ecossistema do idoso"
ON medication_logs FOR ALL
USING (is_family_member(elderly_id) OR is_assigned_caregiver(elderly_id));

CREATE POLICY "Mural familiar acessível por familiares e cuidadores vinculados"
ON family_notices FOR ALL
USING (is_family_member(elderly_id) OR is_assigned_caregiver(elderly_id));

-- ----------------------------------------------------------------------------
-- 5. POLÍTICAS: daily_care_missions (Somente Administrador Geral Altera)
-- ----------------------------------------------------------------------------
CREATE POLICY "Apenas admin_family cria, edita ou remove missões diárias"
ON daily_care_missions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin_family'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin_family'
  )
);

CREATE POLICY "Cuidadores autorizados visualizam missões e registram cumprimento"
ON daily_care_missions FOR SELECT
USING (is_family_member(elderly_id) OR is_assigned_caregiver(elderly_id));`;

  const apiSpecs = `// ============================================================================
// ARQUITETURA DE ROTAS E SERVER ACTIONS / APIS - CUIDA
// TypeScript Interfaces & Endpoints de Alta Precisão
// ============================================================================

/**
 * 1. CHECK-IN DE ENTRADA (Com upload obrigatório de selfie facial)
 * POST /api/time-entries/check-in
 * Headers: Authorization: Bearer <TOKEN>, Content-Type: application/json
 */
export interface CheckInRequest {
  elderly_id: string;             // UUID do idoso
  user_id: string;                // UUID do cuidador autenticado
  photo_base64: string;           // Selfie ao vivo (data:image/jpeg;base64,...)
  location_lat: number;           // Coordenada GPS de validação
  location_long: number;          // Coordenada GPS de validação
  notes?: string;                 // Observações iniciais do turno
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  entry: {
    id: string;
    entry_time: string;           // Timestamp ISO com carimbo oficial NTP
    server_ntp_audited: boolean;  // Prova criptográfica de sincronização
    is_verified_geofence: boolean;// Distância <= allowed_radius_meters
    date_stamp: string;           // YYYY-MM-DD
    day_of_week: string;          // Ex: "Quinta-feira"
  };
}

/**
 * 2. CHECK-OUT DE SAÍDA (Com upload de selfie de encerramento)
 * POST /api/time-entries/check-out
 */
export interface CheckOutRequest {
  entry_id: string;               // ID do registro de ponto aberto
  photo_base64: string;           // Segunda selfie frontal
  notes?: string;                 // Relato de encerramento / passagem de plantão
}

export interface CheckOutResponse {
  success: boolean;
  message: string;
  entry: {
    id: string;
    exit_time: string;            // Timestamp oficial NTP
    total_hours: number;          // 12.03 horas
    total_hours_formatted: string;// "12h 02min"
  };
}

/**
 * 3. REGISTRO DE PRESSÃO ARTERIAL E SINAIS VITAIS
 * POST /api/health-logs
 */
export interface HealthLogCreateRequest {
  elderly_id: string;
  systolic_bp: number;            // Ex: 120 (mmHg)
  diastolic_bp: number;           // Ex: 80 (mmHg)
  heart_rate: number;             // Ex: 72 (bpm)
  glucose?: number;               // Ex: 98 (mg/dL)
  glucose_context?: string;       // "Jejum matinal", "2h pós-almoço"
  temperature_c?: number;         // Ex: 36.5 (°C)
  weight_kg?: number;             // Ex: 62.5 (kg)
  notes?: string;
}

export interface HealthLogResponse {
  success: boolean;
  log: {
    id: string;
    status_category: 'Normal' | 'Pré-hipertensão' | 'Hipertensão Estágio 1' | 'Hipertensão Estágio 2' | 'Crise Hipertensiva';
    created_at: string;
  };
}

/**
 * 4. HISTÓRICO DE FREQUÊNCIA E PONTO POR MÊS E ANO
 * GET /api/time-entries/history?year=2026&month=09&user_id=usr-01
 */
export interface TimesheetHistoryResponse {
  entries: Array<{
    id: string;
    date_stamp: string;
    day_of_week: string;
    entry_time: string;
    entry_photo_url: string;
    exit_time: string | null;
    exit_photo_url: string | null;
    total_hours: number | null;
    total_hours_formatted: string;
    is_verified_geofence: boolean;
  }>;
  meta: {
    filter_year: string;
    filter_month: string;
    total_records: number;
    completed_shifts: number;
    total_hours: number;
    total_hours_formatted: string;
  };
}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900">
                Especificação Técnica de Engenharia & Banco de Dados
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Esquema DDL SQL completo (PostgreSQL/Supabase), Políticas RLS multi-família e Arquitetura de APIs
            </p>
          </div>

          {/* Copy Active Button */}
          <button
            onClick={() => {
              if (activeTab === 'ddl') copyToClipboard(sqlDDL, 'ddl');
              if (activeTab === 'rls') copyToClipboard(rlsPolicies, 'rls');
              if (activeTab === 'apis') copyToClipboard(apiSpecs, 'apis');
            }}
            className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs active:scale-98 transition-all shrink-0"
          >
            {copiedKey ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            {copiedKey ? 'Copiado para o Clipboard!' : 'Copiar Código da Aba Atual'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('ddl')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ddl'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          1. Script DDL SQL Completo (PostgreSQL)
        </button>

        <button
          onClick={() => setActiveTab('rls')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'rls'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          2. Políticas RLS (Row Level Security)
        </button>

        <button
          onClick={() => setActiveTab('apis')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'apis'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Code2 className="w-4 h-4" />
          3. Arquitetura de APIs & Server Actions
        </button>
      </div>

      {/* Code Viewer */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Terminal Header */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="text-slate-300 ml-2 font-semibold">
              {activeTab === 'ddl' && 'cuida_schema_postgresql.sql'}
              {activeTab === 'rls' && 'cuida_row_level_security.sql'}
              {activeTab === 'apis' && 'cuida_api_architecture.ts'}
            </span>
          </div>

          <span className="text-[11px] text-blue-400">Pronto para Produção</span>
        </div>

        {/* Code Content */}
        <div className="p-4 sm:p-6 overflow-x-auto max-h-[600px] overflow-y-auto font-mono text-xs text-slate-200 leading-relaxed">
          <pre className="whitespace-pre">
            {activeTab === 'ddl' && sqlDDL}
            {activeTab === 'rls' && rlsPolicies}
            {activeTab === 'apis' && apiSpecs}
          </pre>
        </div>
      </div>
    </div>
  );
};
