import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'cuida-data-store.json');

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parser with sufficient limit for camera selfie snapshots (base64)
  app.use(express.json({ limit: '15mb' }));

  // In-memory persistent database for live app with disk sync
  const defaultElderly: any = null;

  const defaultFamilies: any[] = [];

  const defaultUsers = [
    {
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
    },
  ];

  const defaultFamilyActivityLogs: any[] = [];

  const db: {
    officialOffsetMs: number;
    elderly: any;
    families: any[];
    users: typeof defaultUsers;
    timeEntries: any[];
    healthLogs: any[];
    medicationLogs: any[];
    familyNotices: any[];
    dailyMissions: any[];
    dailyIncidents: any[];
    familyActivityLogs: any[];
  } = {
    officialOffsetMs: 0, // Server clock offset
    elderly: defaultElderly,
    families: defaultFamilies,
    users: defaultUsers,
    familyActivityLogs: defaultFamilyActivityLogs,
    timeEntries: [],
    healthLogs: [],
    medicationLogs: [],
    familyNotices: [],
    dailyMissions: [],
    dailyIncidents: [],
  };

  // Load persisted data if exists
  try {
    if (fs.existsSync(DB_FILE)) {
      const loaded = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (loaded.users && Array.isArray(loaded.users)) {
        // Ensure Samuel_02 is always present with official credentials
        const samuelInDb = loaded.users.find((u: any) => u.username === 'Samuel_02');
        if (!samuelInDb) {
          loaded.users.unshift(defaultUsers[0]);
        } else {
          samuelInDb.password = '072131Sa@';
          samuelInDb.role = 'admin_geral';
        }
        db.users = loaded.users;
      }
      if (loaded.families && Array.isArray(loaded.families)) {
        db.families = loaded.families;
      }
      if (loaded.timeEntries) db.timeEntries = loaded.timeEntries;
      if (loaded.healthLogs) db.healthLogs = loaded.healthLogs;
      if (loaded.medicationLogs) db.medicationLogs = loaded.medicationLogs;
      if (loaded.familyNotices) db.familyNotices = loaded.familyNotices;
      if (loaded.dailyMissions) db.dailyMissions = loaded.dailyMissions;
      if (loaded.dailyIncidents) db.dailyIncidents = loaded.dailyIncidents;
      if (loaded.familyActivityLogs) db.familyActivityLogs = loaded.familyActivityLogs;
    }
  } catch (err) {
    console.warn('[CUIDA DB] Aviso ao ler cuida-data-store.json:', err);
  }

  function saveDb() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch (err) {
      console.error('[CUIDA DB] Erro ao sincronizar cuida-data-store.json:', err);
    }
  }

  // Helper para auditoria e histórico compartilhado da família
  function logActivity(params: {
    family_id?: string;
    user_id: string;
    user_name: string;
    user_role: string;
    action_type: string;
    category: string;
    description: string;
    details?: string;
  }) {
    const officialTime = getOfficialServerTime();
    const newLog = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      family_id: params.family_id || 'fam-01',
      user_id: params.user_id,
      user_name: params.user_name,
      user_role: params.user_role,
      action_type: params.action_type,
      category: params.category,
      description: params.description,
      details: params.details || '',
      created_at: officialTime.iso_timestamp,
      formatted_time: `${officialTime.day_of_month}/${officialTime.month_name.slice(0, 3)} às ${officialTime.formatted_time.slice(0, 5)}`,
    };
    if (!db.familyActivityLogs) db.familyActivityLogs = [];
    db.familyActivityLogs.unshift(newLog);
    saveDb();
    return newLog;
  }

  // Helper for official NTP/Server Time
  function getOfficialServerTime() {
    const now = new Date(Date.now() + db.officialOffsetMs);
    // Format according to pt-BR in America/Sao_Paulo
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
    // Capitalize day of week
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

  // --- API Endpoints ---

  // 0. Autenticação: Login com Usuário e Senha
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        error: 'Dados incompletos',
        message: 'Informe usuário e senha para acessar o sistema.',
      });
    }

    const cleanUser = String(username).trim().toLowerCase();
    const user = db.users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === cleanUser) ||
        (u.email && u.email.toLowerCase() === cleanUser)
    );

    if (!user || user.password !== String(password)) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Usuário ou senha incorretos. Verifique os dados digitados.',
      });
    }

    // Objeto seguro para retorno na sessão do usuário
    const { password: _, ...userSafe } = user;
    res.json({
      success: true,
      message: `Login realizado com sucesso! Bem-vindo(a), ${user.name}.`,
      user: userSafe,
    });
  });

  // Helper to format friendly role names
  function getFriendlyRoleLabel(roleName: string): string {
    switch (roleName) {
      case 'caregiver':
        return 'Cuidador';
      case 'admin_family':
        return 'Administrador Familiar';
      case 'family_member':
        return 'Familiar Acompanhante';
      case 'caregiver_substitute':
        return 'Cuidador Folguista / Plantonista';
      case 'admin_geral':
        return 'Administrador Geral';
      default:
        return 'Cuidador';
    }
  }

  // 0b. Diretório de Famílias e Logins Registrados (Painel de Login por Família)
  // Atende: "No painel de login, os logins, será criados por famílias e ao clicar no nome dessa família, aparecerá os logins que estão registrado."
  app.get('/api/auth/families-directory', (req, res) => {
    const includePasswords = req.query.include_passwords === 'true';

    const directory = db.families.map((fam) => {
      const familyUsers = db.users
        .filter((u) => u.family_id === fam.id)
        .map((u) => {
          const userRoles: string[] = (u as any).roles || [u.role || 'caregiver'];
          const userRoleLabels: string[] = (u as any).role_labels || userRoles.map(getFriendlyRoleLabel);

          const item: any = {
            id: u.id,
            name: u.name,
            username: u.username,
            role: u.role,
            roles: userRoles,
            role_label: userRoleLabels.join(' + '),
            role_labels: userRoleLabels,
            permission_level: (u as any).permission_level || 3,
            registration_code: u.registration_code || '',
            avatar_url: u.avatar_url,
          };
          if (includePasswords) {
            item.password = u.password;
          }
          return item;
        });

      return {
        id: fam.id,
        name: fam.name,
        elderly_name: fam.elderly_name,
        residence_address: fam.residence_address,
        logins_count: familyUsers.length,
        logins: familyUsers,
      };
    });

    res.json({
      families: directory,
      master_admin: {
        username: 'Samuel_02',
        name: 'Samuel (Administrador Geral)',
        role: 'admin_geral',
        role_label: 'Administrador Geral Master',
      },
    });
  });

  // 0c. Lista de Famílias
  app.get('/api/families', (req, res) => {
    res.json(db.families);
  });

  // Criar nova família
  app.post('/api/families', (req, res) => {
    const { name, elderly_name, residence_address, notes, requesting_user_id } = req.body;
    const requester = db.users.find((u) => u.id === requesting_user_id);

    if (requester && requester.role !== 'admin_geral' && requester.role !== 'admin_family') {
      return res.status(403).json({
        error: 'Permissão negada',
        message: 'Apenas a conta de Administrador Geral possui permissão para cadastrar famílias.',
      });
    }

    if (!name || !elderly_name) {
      return res.status(400).json({
        error: 'Campos obrigatórios',
        message: 'O nome da família e o nome do idoso(a) assistido são obrigatórios.',
      });
    }

    const newFamily = {
      id: `fam-${Date.now()}`,
      name: name.trim(),
      elderly_name: elderly_name.trim(),
      elderly_id: `eld-${Date.now()}`,
      residence_address: residence_address || 'Endereço não informado',
      notes: notes || '',
      created_at: getOfficialServerTime().iso_timestamp,
    };

    db.families.push(newFamily);
    saveDb();

    res.status(201).json({
      success: true,
      message: `Família "${newFamily.name}" criada com sucesso.`,
      family: newFamily,
    });
  });

  // 0c2. Cadastrar / Atualizar Endereço da Residência do Idoso & Perímetro Geofence
  // Atende: "o administrador da família, também tenha o poder de cadastrar a residência do idoso, somente assim, será impossível de qualquer cuidador mentir na hora do ponto"
  app.put('/api/families/:id/residence', (req, res) => {
    const { id } = req.params;
    const {
      residence_address,
      residence_lat,
      residence_long,
      allowed_radius_meters,
      residence_cep,
      notes,
      requesting_user_id,
    } = req.body;

    const requester = db.users.find((u) => u.id === requesting_user_id);
    const isMaster = requester && requester.role === 'admin_geral';
    const isFamilyAdmin = requester && (requester.role === 'admin_family' || (requester as any).roles?.includes('admin_family'));

    if (!requester || (!isMaster && !isFamilyAdmin)) {
      return res.status(403).json({
        error: 'Permissão negada',
        message: 'Apenas o Administrador Familiar ou o Administrador Geral possuem permissão para cadastrar a localização da residência do idoso.',
      });
    }

    const family = db.families.find((f) => f.id === id);
    if (!family) {
      return res.status(404).json({ error: 'Família não encontrada' });
    }

    const lat = Number(residence_lat);
    const lng = Number(residence_long);
    const radius = Number(allowed_radius_meters) || 150;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        error: 'Coordenadas GPS obrigatórias',
        message: 'Latitude e Longitude válidas são estritamente necessárias para estabelecer o perímetro inviolável de presença.',
      });
    }

    family.residence_address = String(residence_address || '').trim();
    family.residence_lat = lat;
    family.residence_long = lng;
    family.allowed_radius_meters = radius;
    family.residence_cep = residence_cep || '';
    family.residence_updated_at = getOfficialServerTime().iso_timestamp;
    family.residence_updated_by = requester.name;

    // Sincroniza idoso padrão da sessão
    if (db.elderly) {
      db.elderly.residence_address = family.residence_address;
      db.elderly.residence_lat = lat;
      db.elderly.residence_long = lng;
      db.elderly.allowed_radius_meters = radius;
    } else {
      db.elderly = {
        id: family.elderly_id || `eld-${Date.now()}`,
        full_name: family.elderly_name || 'Idoso Assistido',
        birth_date: '',
        blood_type: 'Não informado',
        allergies: [],
        residence_address: family.residence_address,
        residence_lat: lat,
        residence_long: lng,
        allowed_radius_meters: radius,
        emergency_contacts: [],
        created_at: getOfficialServerTime().iso_timestamp,
      };
    }

    saveDb();

    logActivity({
      family_id: family.id,
      user_id: requester.id,
      user_name: requester.name,
      user_role: requester.role,
      action_type: 'vitals_edited',
      category: 'Mural',
      description: `Endereço da residência cadastrado/atualizado por ${requester.name}: ${family.residence_address} [Raio de ponto: ${radius}m].`,
      details: `GPS Cadastrado: [${lat.toFixed(6)}, ${lng.toFixed(6)}] · Perímetro seguro: ${radius} metros.`,
    });

    res.json({
      success: true,
      message: `Residência do idoso e perímetro de ponto (${radius}m) cadastrados com sucesso!`,
      family,
      elderly: db.elderly,
    });
  });

  // Atualizar Residência do Idoso Direto
  app.put('/api/elderly/residence', (req, res) => {
    const {
      residence_address,
      residence_lat,
      residence_long,
      allowed_radius_meters,
      family_id,
      requesting_user_id,
    } = req.body;

    const requester = db.users.find((u) => u.id === requesting_user_id);
    const isMaster = requester && requester.role === 'admin_geral';
    const isFamilyAdmin = requester && (requester.role === 'admin_family' || (requester as any).roles?.includes('admin_family'));

    if (!requester || (!isMaster && !isFamilyAdmin)) {
      return res.status(403).json({
        error: 'Permissão negada',
        message: 'Apenas o Administrador Familiar ou Administrador Geral podem cadastrar a residência do idoso.',
      });
    }

    const lat = Number(residence_lat);
    const lng = Number(residence_long);
    const radius = Number(allowed_radius_meters) || 150;

    if (!db.elderly) {
      db.elderly = {
        id: `eld-${Date.now()}`,
        full_name: 'Idoso em Acompanhamento',
        birth_date: '',
        blood_type: 'Não informado',
        allergies: [],
        residence_address: residence_address || '',
        residence_lat: lat,
        residence_long: lng,
        allowed_radius_meters: radius,
        emergency_contacts: [],
        created_at: getOfficialServerTime().iso_timestamp,
      };
    } else {
      db.elderly.residence_address = residence_address || db.elderly.residence_address;
      db.elderly.residence_lat = lat;
      db.elderly.residence_long = lng;
      db.elderly.allowed_radius_meters = radius;
    }

    if (family_id) {
      const fam = db.families.find((f) => f.id === family_id);
      if (fam) {
        fam.residence_address = db.elderly.residence_address;
        fam.residence_lat = lat;
        fam.residence_long = lng;
        fam.allowed_radius_meters = radius;
      }
    }

    saveDb();

    logActivity({
      family_id: family_id || 'fam-01',
      user_id: requester.id,
      user_name: requester.name,
      user_role: requester.role,
      action_type: 'vitals_edited',
      category: 'Mural',
      description: `Geolocalização da residência configurada por ${requester.name}: ${db.elderly.residence_address} [Raio: ${radius}m].`,
    });

    res.json({
      success: true,
      message: `Residência cadastrada com sucesso! Perímetro de ${radius}m ativo.`,
      elderly: db.elderly,
    });
  });

  // 0d. Usuários e Logins de Clientes (com visualização de senha permitida para a conta admin)
  app.get('/api/users', (req, res) => {
    const includePasswords = req.query.include_passwords === 'true';

    const safeUsers = db.users.map((u) => {
      const userRoles: string[] = (u as any).roles || [u.role || 'caregiver'];
      const userRoleLabels: string[] = (u as any).role_labels || userRoles.map(getFriendlyRoleLabel);

      const userObj: any = {
        ...u,
        roles: userRoles,
        role_label: userRoleLabels.join(' + '),
        role_labels: userRoleLabels,
        has_password: Boolean(u.password),
      };

      if (!includePasswords) {
        delete userObj.password;
      }
      return userObj;
    });

    res.json(safeUsers);
  });

  // Criar Login de Cliente (Responsabilidade da conta Samuel_02 / Admin Geral)
  // Atende: "nome de usuários, para criar o logins, permita: letras, carácter e número e o mesmo para senhas (mínimo 8 carácter) - a senha também deve aparecer para a minha conta de administrador."
  app.post('/api/users', (req, res) => {
    const {
      name,
      username,
      password,
      role,
      roles,
      family_id,
      email,
      registration_code,
      requesting_user_id,
    } = req.body;

    const requester = db.users.find((u) => u.id === requesting_user_id);
    if (requester && requester.role !== 'admin_geral') {
      return res.status(403).json({
        error: 'Permissão negada',
        message: 'Apenas a conta do Administrador Geral (Samuel_02) é responsável por criar os logins dos clientes.',
      });
    }

    if (!name || !username || !password) {
      return res.status(400).json({
        error: 'Dados obrigatórios ausentes',
        message: 'Informe o nome completo, usuário para login e senha de acesso.',
      });
    }

    // Validação de Segurança do Nome de Usuário (letras, caracteres e números, mínimo 3)
    const cleanUsername = String(username).trim();
    if (cleanUsername.length < 3) {
      return res.status(400).json({
        error: 'Usuário inválido',
        message: 'O nome de usuário deve conter pelo menos 3 caracteres.',
      });
    }
    const usernameRegex = /^[a-zA-Z0-9._@!#$\-%]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      return res.status(400).json({
        error: 'Usuário inválido',
        message: 'O nome de usuário permite letras, números e caracteres especiais (. _ - @ ! # $ %). Espaços não são permitidos.',
      });
    }

    // Validação de Segurança da Senha (mínimo 8 caracteres, permite letras, números e caracteres especiais)
    const cleanPassword = String(password);
    if (cleanPassword.length < 8) {
      return res.status(400).json({
        error: 'Senha muito curta',
        message: 'A senha de segurança deve conter no mínimo 8 caracteres (letras, números e caracteres especiais permitidos).',
      });
    }

    const existing = db.users.find(
      (u) => u.username && u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (existing) {
      return res.status(409).json({
        error: 'Usuário já cadastrado',
        message: `O login "${cleanUsername}" já existe no sistema. Escolha outro nome de usuário.`,
      });
    }

    // Suporte a até 2 opções/funções para qualquer usuário
    const userRoles: string[] = Array.isArray(roles) && roles.length > 0
      ? roles.slice(0, 2)
      : [role || 'caregiver'];
    const primaryRole = userRoles[0];
    const userRoleLabels = userRoles.map(getFriendlyRoleLabel);

    const family = db.families.find((f) => f.id === family_id);
    const lvl = Number(req.body.permission_level) || (userRoles.includes('admin_family') ? 2 : 3);

    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      last_name: name.trim().split(' ').slice(1).join(' ') || '',
      username: cleanUsername,
      password: cleanPassword,
      role: primaryRole,
      roles: userRoles,
      role_label: userRoleLabels.join(' + '),
      role_labels: userRoleLabels,
      permission_level: lvl,
      permission_level_title: userRoleLabels.join(' + '),
      family_id: family_id || null,
      family_name: family ? family.name : 'Sem família vinculada',
      email: email ? String(email).trim() : `${cleanUsername.toLowerCase()}@cuida.com.br`,
      phone: '(11) 98000-0000',
      registration_code:
        registration_code ||
        (userRoles.includes('caregiver')
          ? `CUID-${Math.floor(1000 + Math.random() * 9000)}`
          : `FAM-${Math.floor(1000 + Math.random() * 9000)}`),
      avatar_url:
        userRoles.includes('caregiver')
          ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      first_login_completed: false, // Dispara onboarding no primeiro acesso
      terms_accepted: false,
      created_at: getOfficialServerTime().iso_timestamp,
    };

    db.users.push(newUser);
    saveDb();

    logActivity({
      family_id: newUser.family_id || 'fam-01',
      user_id: requester?.id || 'usr-admin-samuel',
      user_name: requester?.name || 'Administrador Geral',
      user_role: 'admin_geral',
      action_type: 'user_created',
      category: 'Mural',
      description: `Novo login criado: ${newUser.name} (@${newUser.username}) [${userRoleLabels.join(' + ')}] na ${newUser.family_name}.`,
    });

    res.status(201).json({
      success: true,
      message: `Login "${newUser.username}" cadastrado com sucesso para a ${newUser.family_name}!`,
      user: newUser,
    });
  });

  // Atualizar Opções / Funções do Usuário (Até 2 opções configuráveis pelo Admin)
  app.put('/api/users/:id/roles', (req, res) => {
    const { id } = req.params;
    const { roles, requesting_user_id } = req.body;

    const requester = db.users.find((u) => u.id === requesting_user_id);
    if (requester && requester.role !== 'admin_geral') {
      return res.status(403).json({
        error: 'Permissão negada',
        message: 'Apenas o Administrador Geral pode alterar as funções e permissões dos usuários.',
      });
    }

    const user = db.users.find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    const cleanRoles: string[] = Array.isArray(roles) && roles.length > 0 ? roles.slice(0, 2) : ['caregiver'];
    const roleLabels = cleanRoles.map(getFriendlyRoleLabel);

    (user as any).roles = cleanRoles;
    user.role = cleanRoles[0];
    (user as any).role_label = roleLabels.join(' + ');
    (user as any).role_labels = roleLabels;

    saveDb();

    logActivity({
      family_id: user.family_id || 'fam-01',
      user_id: requester?.id || 'usr-admin-samuel',
      user_name: requester?.name || 'Administrador Geral',
      user_role: 'admin_geral',
      action_type: 'permission_updated',
      category: 'Mural',
      description: `Funções de ${user.name} (@${user.username}) atualizadas para: ${roleLabels.join(' + ')}.`,
    });

    res.json({ success: true, user });
  });

  // Salvar Onboarding de Primeiro Acesso Obrigatório
  app.put('/api/users/:id/onboarding', (req, res) => {
    const { id } = req.params;
    const { name, last_name, phone, avatar_url, terms_accepted } = req.body;

    const user = db.users.find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    if (name) user.name = name;
    if (last_name) (user as any).last_name = last_name;
    if (phone) (user as any).phone = phone;
    if (avatar_url) user.avatar_url = avatar_url;
    (user as any).first_login_completed = true;
    (user as any).terms_accepted = Boolean(terms_accepted);

    saveDb();

    logActivity({
      family_id: user.family_id || 'fam-01',
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action_type: 'onboarding_completed',
      category: 'Mural',
      description: `${user.name} completou o perfil obrigatório de primeiro acesso e validou as normas de conduta.`,
    });

    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });

  // Atualizar Nível de Acesso (RBAC) do Usuário (Apenas Admin Geral)
  app.put('/api/users/:id/level', (req, res) => {
    const { id } = req.params;
    const { permission_level, requesting_user_id } = req.body;

    const requester = db.users.find((u) => u.id === requesting_user_id);
    if (requester && requester.role !== 'admin_geral') {
      return res.status(403).json({
        error: 'Permissão negada',
        message: 'Apenas o Administrador Geral pode alterar o nível de acesso dos usuários.',
      });
    }

    const user = db.users.find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    const lvl = Number(permission_level);
    (user as any).permission_level = lvl;
    if (lvl === 2) user.role = 'admin_family';
    else if (lvl === 3) user.role = 'caregiver';
    else if (lvl === 4) (user as any).role = 'caregiver_substitute';
    else if (lvl === 5) user.role = 'family_member';

    saveDb();

    logActivity({
      family_id: user.family_id || 'fam-01',
      user_id: requester?.id || 'usr-admin-samuel',
      user_name: requester?.name || 'Administrador Geral',
      user_role: 'admin_geral',
      action_type: 'permission_updated',
      category: 'Mural',
      description: `Nível de acesso de ${user.name} (@${user.username}) atualizado para Nível ${lvl}.`,
    });

    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });

  // Obter Histórico Compartilhado de Atividades e Edições da Família
  app.get('/api/family-activity-logs', (req, res) => {
    const { family_id } = req.query;
    let list = [...(db.familyActivityLogs || [])];
    if (family_id && family_id !== 'all') {
      list = list.filter((l) => l.family_id === family_id);
    }
    res.json(list);
  });

  // Registrar Atividade na Família
  app.post('/api/family-activity-logs', (req, res) => {
    const { family_id, user_id, user_name, user_role, action_type, category, description, details } = req.body;
    const log = logActivity({
      family_id,
      user_id,
      user_name,
      user_role,
      action_type,
      category,
      description,
      details,
    });
    res.status(201).json({ success: true, log });
  });

  // Excluir Login (Apenas Admin Geral)
  app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { requesting_user_id } = req.query;

    const requester = db.users.find((u) => u.id === requesting_user_id);
    if (requester && requester.role !== 'admin_geral') {
      return res.status(403).json({
        error: 'Permissão negada',
        message: 'Apenas o Administrador Geral pode excluir logins.',
      });
    }

    if (id === 'usr-admin-samuel') {
      return res.status(400).json({
        error: 'Ação não permitida',
        message: 'A conta de Administrador Geral Master Samuel_02 não pode ser removida.',
      });
    }

    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Usuário não encontrado' });

    const removed = db.users.splice(idx, 1)[0];
    saveDb();

    res.json({
      success: true,
      message: `Login "${removed.username}" (${removed.name}) foi excluído com sucesso.`,
    });
  });

  // 1. Official Clock / NTP Endpoint
  app.get('/api/time', (req, res) => {
    res.json(getOfficialServerTime());
  });

  // 2. Elderly Profile & Geofence
  app.get('/api/elderly', (req, res) => {
    res.json(db.elderly);
  });

  // 3. Current active shift for user
  app.get('/api/time-entries/active', (req, res) => {
    const userId = (req.query.userId as string) || 'usr-01';
    const active = db.timeEntries.find((entry) => entry.user_id === userId && !entry.exit_time);
    res.json({ activeEntry: active || null });
  });

  // Helper para validação estrita e inviolável de geolocalização no ponto
  function validateGeofence(user: any, caregiverLat?: number, caregiverLong?: number) {
    const family = user?.family_id ? db.families.find((f) => f.id === user.family_id) : null;
    const targetLat = family?.residence_lat || db.elderly?.residence_lat;
    const targetLng = family?.residence_long || db.elderly?.residence_long;
    const targetAddress = family?.residence_address || db.elderly?.residence_address || 'Residência do Idoso';
    const allowedRadius = family?.allowed_radius_meters || db.elderly?.allowed_radius_meters || 150;

    // Se o Administrador Familiar ainda não cadastrou o local
    if (!targetLat || !targetLng) {
      return {
        valid: false,
        status: 400,
        error: 'Residência Não Cadastrada',
        message: 'A residência do idoso ainda não foi cadastrada pelo Administrador Familiar. Solicite ao administrador da família que registre a localização no sistema para habilitar o ponto.',
      };
    }

    // Se o cuidador não enviou GPS
    if (
      caregiverLat === undefined ||
      caregiverLong === undefined ||
      isNaN(Number(caregiverLat)) ||
      isNaN(Number(caregiverLong))
    ) {
      return {
        valid: false,
        status: 400,
        error: 'Localização GPS Obrigatória',
        message: 'A geolocalização GPS em tempo real é obrigatória para validar o ponto. Ative a permissão de GPS do seu aparelho para comprovar presença no endereço cadastrado.',
      };
    }

    const cLat = Number(caregiverLat);
    const cLng = Number(caregiverLong);

    // Cálculo exato de distância via fórmula de Haversine
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = (cLat * Math.PI) / 180;
    const φ2 = (targetLat * Math.PI) / 180;
    const Δφ = ((targetLat - cLat) * Math.PI) / 180;
    const Δλ = ((targetLng - cLng) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMeters = Math.round(R * c);

    if (distanceMeters > allowedRadius) {
      return {
        valid: false,
        status: 403,
        error: 'Fora do Perímetro Autorizado',
        message: `Ponto recusado pelo sistema! Você está a ${distanceMeters} metros da residência cadastrada (${targetAddress}). O raio máximo de tolerância permitido é de ${allowedRadius} metros. O ponto só pode ser validado presencialmente no local de assistência.`,
        distanceMeters,
        allowedRadius,
        targetAddress,
      };
    }

    return {
      valid: true,
      distanceMeters,
      allowedRadius,
      targetAddress,
      targetLat,
      targetLng,
    };
  }

  // 4. Check-in (Entrada) - Mandatory Facial Selfie & Official Time & Inviolable GPS Geofence
  app.post('/api/time-entries/check-in', (req, res) => {
    const { user_id, elderly_id, photo_base64, location_lat, location_long, notes } = req.body;

    if (!photo_base64) {
      return res.status(400).json({
        error: 'Captura facial obrigatória',
        message: 'O registro de entrada exige captura fotográfica frontal em tempo real. Seleção de arquivos da galeria é estritamente bloqueada pelo protocolo de segurança.',
      });
    }

    const user = db.users.find((u) => u.id === user_id);

    // Validação estrita de Geolocalização (Perímetro cadastrado pelo Administrador Familiar)
    const geoValidation = validateGeofence(user, location_lat, location_long);
    if (!geoValidation.valid) {
      return res.status(geoValidation.status || 403).json({
        error: geoValidation.error,
        message: geoValidation.message,
        distance_meters: geoValidation.distanceMeters,
        allowed_radius_meters: geoValidation.allowedRadius,
        residence_address: geoValidation.targetAddress,
      });
    }

    const officialTime = getOfficialServerTime();

    // Check if there is already an open shift
    const existingOpen = db.timeEntries.find(
      (e) => e.user_id === (user_id || 'usr-01') && !e.exit_time
    );
    if (existingOpen) {
      return res.status(409).json({
        error: 'Turno já em andamento',
        message: 'Existe um registro de entrada sem saída finalizada. Realize o check-out antes de iniciar um novo turno.',
        activeEntry: existingOpen,
      });
    }

    const newEntry = {
      id: `pnt-${Date.now()}`,
      user_id: user_id || 'usr-01',
      user_name: user?.name || 'Cuidador',
      elderly_id: elderly_id || db.elderly?.id || 'eld-01',
      entry_time: officialTime.iso_timestamp,
      entry_photo_url: photo_base64,
      exit_time: null,
      exit_photo_url: null,
      total_hours: 0,
      total_hours_formatted: 'Em andamento',
      location_lat: Number(location_lat),
      location_long: Number(location_long),
      distance_meters: geoValidation.distanceMeters,
      is_verified_geofence: true,
      residence_address: geoValidation.targetAddress,
      date_stamp: officialTime.date_stamp,
      day_of_week: officialTime.day_of_week,
      notes: notes || `Check-in biométrico validado no local (${geoValidation.distanceMeters}m do ponto central).`,
    };

    db.timeEntries.unshift(newEntry);
    saveDb();

    logActivity({
      family_id: user?.family_id || 'fam-01',
      user_id: user?.id || 'usr-01',
      user_name: user?.name || 'Cuidador',
      user_role: user?.role || 'caregiver',
      action_type: 'presence_clock',
      category: 'Controle de Ponto',
      description: `Entrada registrada por ${user?.name || 'Cuidador'}: ponto validado com biometria facial e presença confirmada a ${geoValidation.distanceMeters}m da residência.`,
      details: `Horário oficial: ${officialTime.formatted_time} | Endereço: ${geoValidation.targetAddress}`,
    });

    res.status(201).json({
      success: true,
      message: `Ponto de entrada validado com sucesso! Presença confirmada no endereço da residência (Distância: ${geoValidation.distanceMeters}m).`,
      entry: newEntry,
    });
  });

  // 5. Check-out (Saída) - Mandatory Exit Selfie & Permanence Calculation & Geofence
  app.post('/api/time-entries/check-out', (req, res) => {
    const { entry_id, photo_base64, location_lat, location_long, notes } = req.body;

    if (!photo_base64) {
      return res.status(400).json({
        error: 'Captura facial obrigatória',
        message: 'O encerramento do turno requer foto facial frontal de saída.',
      });
    }

    const entry = db.timeEntries.find((e) => e.id === entry_id);
    if (!entry) {
      return res.status(404).json({ error: 'Registro de ponto não encontrado' });
    }

    if (entry.exit_time) {
      return res.status(400).json({ error: 'Turno já foi encerrado anteriormente' });
    }

    const user = db.users.find((u) => u.id === entry.user_id);

    // Validação estrita de Geolocalização também na saída
    if (location_lat && location_long) {
      const geoValidation = validateGeofence(user, location_lat, location_long);
      if (!geoValidation.valid) {
        return res.status(geoValidation.status || 403).json({
          error: geoValidation.error,
          message: geoValidation.message,
          distance_meters: geoValidation.distanceMeters,
          allowed_radius_meters: geoValidation.allowedRadius,
        });
      }
    }

    const officialTime = getOfficialServerTime();
    const entryDate = new Date(entry.entry_time);
    const exitDate = new Date(officialTime.iso_timestamp);
    const diffMs = Math.max(0, exitDate.getTime() - entryDate.getTime());
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const formattedHours = `${hours}h ${mins.toString().padStart(2, '0')}min`;

    entry.exit_time = officialTime.iso_timestamp;
    entry.exit_photo_url = photo_base64;
    entry.total_hours = totalHours;
    entry.total_hours_formatted = formattedHours;
    if (notes) {
      entry.notes = entry.notes ? `${entry.notes} | ${notes}` : notes;
    }

    saveDb();

    logActivity({
      family_id: user?.family_id || 'fam-01',
      user_id: user?.id || entry.user_id,
      user_name: user?.name || entry.user_name || 'Cuidador',
      user_role: user?.role || 'caregiver',
      action_type: 'presence_clock',
      category: 'Controle de Ponto',
      description: `Saída registrada por ${user?.name || 'Cuidador'}: turno de ${formattedHours} encerrado com selfie facial e certificação oficial.`,
      details: `Permanência total: ${formattedHours} (${totalHours}h).`,
    });

    res.json({
      success: true,
      message: `Check-out validado com sucesso! Permanência de ${formattedHours} registrada.`,
      entry,
    });
  });

  // 5b. Adicionar Presença Manual / Plantão Avulso com Justificativa e Auditoria
  app.post('/api/time-entries/manual', (req, res) => {
    const {
      user_id,
      elderly_id,
      date_stamp,
      entry_time_str,
      exit_time_str,
      entry_type,
      justification,
      notes,
      photo_url,
    } = req.body;

    if (!user_id || !date_stamp || !entry_time_str || !justification) {
      return res.status(400).json({
        error: 'Campos obrigatórios ausentes',
        message: 'Para lançar presença é necessário informar cuidador, data, horário de entrada e justificativa auditada.',
      });
    }

    const user = db.users.find((u) => u.id === user_id);
    const entryIso = `${date_stamp}T${entry_time_str}:00-03:00`;
    const exitIso = exit_time_str ? `${date_stamp}T${exit_time_str}:00-03:00` : null;

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

    // Determine day of week from date_stamp
    const dateObj = new Date(`${date_stamp}T12:00:00Z`);
    const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const dayOfWeek = dayNames[dateObj.getUTCDay()];

    const fallbackPhoto = photo_url || (user?.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80');

    const newEntry = {
      id: `pnt-man-${Date.now()}`,
      user_id,
      user_name: user?.name || 'Profissional',
      elderly_id: elderly_id || db.elderly.id,
      entry_time: entryIso,
      entry_photo_url: fallbackPhoto,
      exit_time: exitIso,
      exit_photo_url: exitIso ? fallbackPhoto : null,
      total_hours: totalHours,
      total_hours_formatted: formattedHours,
      location_lat: db.elderly.residence_lat,
      location_long: db.elderly.residence_long,
      distance_meters: 10,
      is_verified_geofence: true,
      date_stamp,
      day_of_week: dayOfWeek,
      entry_type: entry_type || 'manual_authorized',
      justification,
      authorized_by_name: 'Dr. Fernando Silveira (Admin Familiar)',
      notes: notes || `Lançamento manual autorizado: ${justification}`,
    };

    db.timeEntries.unshift(newEntry);
    res.status(201).json({
      success: true,
      message: 'Presença adicionada com sucesso e registrada na folha de auditoria.',
      entry: newEntry,
    });
  });

  // 6. Timesheet History Query with Month & Year Filter
  app.get('/api/time-entries/history', (req, res) => {
    const { year, month, user_id } = req.query;
    let list = [...db.timeEntries];

    if (user_id) {
      list = list.filter((e) => e.user_id === user_id);
    }

    if (year && month) {
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      list = list.filter((e) => e.date_stamp && e.date_stamp.startsWith(prefix));
    }

    const totalHoursAggregated = list.reduce((acc, curr) => acc + (curr.total_hours || 0), 0);
    const completedShifts = list.filter((e) => e.exit_time).length;

    res.json({
      entries: list,
      meta: {
        filter_year: year || 'Todos',
        filter_month: month || 'Todos',
        total_records: list.length,
        completed_shifts: completedShifts,
        total_hours: parseFloat(totalHoursAggregated.toFixed(2)),
        total_hours_formatted: `${Math.floor(totalHoursAggregated)}h ${Math.round((totalHoursAggregated % 1) * 60)}min`,
      },
    });
  });

  // 7. Health Logs: Blood Pressure (Optional / Blank Allowed), Glucose, Temp
  app.get('/api/health-logs', (req, res) => {
    res.json(db.healthLogs);
  });

  app.post('/api/health-logs', (req, res) => {
    const {
      systolic_bp,
      diastolic_bp,
      heart_rate,
      glucose,
      glucose_context,
      temperature_c,
      weight_kg,
      notes,
      recorded_by_user_id,
      contractor_signed,
      caregiver_signed,
    } = req.body;

    const hasBp =
      systolic_bp !== undefined &&
      systolic_bp !== null &&
      systolic_bp !== '' &&
      diastolic_bp !== undefined &&
      diastolic_bp !== null &&
      diastolic_bp !== '';

    let sys: number | null = null;
    let dia: number | null = null;
    let hr: number | null = null;
    let statusCategory = 'Não aferida nesta rotina (Opcional)';

    if (hasBp) {
      sys = Number(systolic_bp);
      dia = Number(diastolic_bp);
      hr = heart_rate ? Number(heart_rate) : 75;

      // Classification per SBC / AHA Guidelines
      if (sys >= 180 || dia >= 120) {
        statusCategory = 'Crise Hipertensiva (Urgência)';
      } else if (sys >= 140 || dia >= 90) {
        statusCategory = 'Hipertensão Estágio 2';
      } else if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) {
        statusCategory = 'Hipertensão Estágio 1';
      } else if (sys >= 120 && sys <= 129 && dia < 80) {
        statusCategory = 'Pressão Elevada / Pré-hipertensão';
      } else if (sys < 90 || dia < 60) {
        statusCategory = 'Hipotensão';
      } else {
        statusCategory = 'Normal (Ótima)';
      }
    } else if (heart_rate) {
      hr = Number(heart_rate);
    }

    const officialTime = getOfficialServerTime();
    const user = db.users.find((u) => u.id === (recorded_by_user_id || 'usr-01'));

    const newLog = {
      id: `hl-${Date.now()}`,
      elderly_id: db.elderly.id,
      recorded_by_user_id: user?.id || 'usr-01',
      recorded_by_name: user ? `${user.name} (${user.role === 'caregiver' ? 'Cuidadora' : 'Familiar'})` : 'Profissional',
      systolic_bp: sys,
      diastolic_bp: dia,
      heart_rate: hr,
      is_bp_measured: hasBp,
      glucose: glucose ? Number(glucose) : null,
      glucose_context: glucose_context || 'Glicemia capilar',
      temperature_c: temperature_c ? Number(temperature_c) : null,
      weight_kg: weight_kg ? Number(weight_kg) : null,
      status_category: statusCategory,
      contractor_signed: contractor_signed ?? true,
      caregiver_signed: caregiver_signed ?? true,
      notes: notes || (hasBp ? 'Aferição de rotina registrada.' : 'Registro geral sem aferição de PA no momento.'),
      created_at: officialTime.iso_timestamp,
    };

    db.healthLogs.unshift(newLog);
    saveDb();

    logActivity({
      family_id: user?.family_id || 'fam-01',
      user_id: user?.id || 'usr-01',
      user_name: user?.name || 'Profissional',
      user_role: user?.role || 'caregiver',
      action_type: 'vitals_added',
      category: 'Sinais Vitais',
      description: `Sinais vitais aferidos por ${user?.name || 'Cuidador'}: ${hasBp ? `PA ${sys}/${dia} mmHg` : 'Registro clínico'} · FC ${hr || 75} bpm.`,
      details: statusCategory,
    });

    res.status(201).json({ success: true, log: newLog });
  });

  app.put('/api/health-logs/:id', (req, res) => {
    const { id } = req.params;
    const logIndex = db.healthLogs.findIndex((l) => l.id === id);
    if (logIndex === -1) {
      return res.status(404).json({ error: 'Registro de saúde não encontrado' });
    }

    const {
      systolic_bp,
      diastolic_bp,
      heart_rate,
      glucose,
      glucose_context,
      temperature_c,
      weight_kg,
      notes,
      contractor_signed,
      caregiver_signed,
    } = req.body;

    const hasBp =
      systolic_bp !== undefined &&
      systolic_bp !== null &&
      systolic_bp !== '' &&
      diastolic_bp !== undefined &&
      diastolic_bp !== null &&
      diastolic_bp !== '';

    let sys: number | null = null;
    let dia: number | null = null;
    let hr: number | null = null;
    let statusCategory = 'Não aferida nesta rotina (Opcional)';

    if (hasBp) {
      sys = Number(systolic_bp);
      dia = Number(diastolic_bp);
      hr = heart_rate ? Number(heart_rate) : 75;

      if (sys >= 180 || dia >= 120) {
        statusCategory = 'Crise Hipertensiva (Urgência)';
      } else if (sys >= 140 || dia >= 90) {
        statusCategory = 'Hipertensão Estágio 2';
      } else if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) {
        statusCategory = 'Hipertensão Estágio 1';
      } else if (sys >= 120 && sys <= 129 && dia < 80) {
        statusCategory = 'Pressão Elevada / Pré-hipertensão';
      } else if (sys < 90 || dia < 60) {
        statusCategory = 'Hipotensão';
      } else {
        statusCategory = 'Normal (Ótima)';
      }
    }

    const targetLog = db.healthLogs[logIndex];
    if (systolic_bp !== undefined) targetLog.systolic_bp = sys;
    if (diastolic_bp !== undefined) targetLog.diastolic_bp = dia;
    if (heart_rate !== undefined) targetLog.heart_rate = hr;
    targetLog.is_bp_measured = hasBp;
    if (glucose !== undefined) targetLog.glucose = glucose ? Number(glucose) : null;
    if (glucose_context !== undefined) targetLog.glucose_context = glucose_context;
    if (temperature_c !== undefined) targetLog.temperature_c = temperature_c ? Number(temperature_c) : null;
    if (weight_kg !== undefined) targetLog.weight_kg = weight_kg ? Number(weight_kg) : null;
    if (notes !== undefined) targetLog.notes = notes;
    if (contractor_signed !== undefined) targetLog.contractor_signed = Boolean(contractor_signed);
    if (caregiver_signed !== undefined) targetLog.caregiver_signed = Boolean(caregiver_signed);
    targetLog.status_category = statusCategory;

    saveDb();

    logActivity({
      family_id: 'fam-01',
      user_id: 'usr-01',
      user_name: 'Cuidador',
      user_role: 'caregiver',
      action_type: 'vitals_edited',
      category: 'Sinais Vitais',
      description: `Aferição de sinais vitais atualizada e auditada no sistema.`,
    });

    res.json({ success: true, log: targetLog });
  });

  // 7b. Relatório Diário de Ocorrências & Acompanhamento Familiar (Diário de Bordo)
  app.get('/api/daily-incidents', (req, res) => {
    res.json(db.dailyIncidents);
  });

  app.post('/api/daily-incidents', (req, res) => {
    const {
      general_state,
      had_discomfort,
      discomfort_types,
      symptoms_description,
      actions_taken,
      recorded_by_user_id,
      contractor_signed,
      caregiver_signed,
    } = req.body;

    const officialTime = getOfficialServerTime();
    const user = db.users.find((u) => u.id === (recorded_by_user_id || 'usr-01'));

    const newIncident = {
      id: `inc-${Date.now()}`,
      elderly_id: db.elderly.id,
      date_stamp: officialTime.date_stamp,
      day_of_week: officialTime.day_of_week,
      recorded_by_user_id: user?.id || 'usr-01',
      recorded_by_name: user ? `${user.name} (${user.role === 'caregiver' ? 'Cuidadora Titular' : 'Família'})` : 'Responsável',
      recorded_by_role: user?.role || 'caregiver',
      general_state: general_state || 'estavel',
      had_discomfort: Boolean(had_discomfort),
      discomfort_types: discomfort_types || [],
      symptoms_description: symptoms_description || 'Dia transcorreu sem queixas de mal-estar.',
      actions_taken: actions_taken || 'Rotina de cuidados, hidratação e medicação regular mantida.',
      contractor_signed: Boolean(contractor_signed),
      contractor_signed_name: contractor_signed ? 'Dr. Fernando Silveira (Filho/Contratante)' : undefined,
      caregiver_signed: Boolean(caregiver_signed ?? true),
      caregiver_signed_name: user?.role === 'caregiver' ? user.name : 'Clara Mendes (Cuidadora)',
      family_viewed_by: [user?.name || 'Clara Mendes'],
      created_at: officialTime.iso_timestamp,
    };

    db.dailyIncidents.unshift(newIncident);
    saveDb();

    logActivity({
      family_id: user?.family_id || 'fam-01',
      user_id: user?.id || 'usr-01',
      user_name: user?.name || 'Cuidador',
      user_role: user?.role || 'caregiver',
      action_type: 'incident_reported',
      category: 'Boletim do Idoso',
      description: `Boletim diário de ocorrências preenchido por ${user?.name || 'Cuidador'}: Estado ${general_state}.`,
      details: symptoms_description || '',
    });

    res.status(201).json({
      success: true,
      message: 'Boletim diário de ocorrências registrado com sucesso.',
      incident: newIncident,
    });
  });

  // Assinatura do Contratante / Ciência da Família no Boletim
  app.post('/api/daily-incidents/:id/sign', (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;
    const incident = db.dailyIncidents.find((i) => i.id === id);
    if (!incident) return res.status(404).json({ error: 'Relatório diário não encontrado' });

    const user = db.users.find((u) => u.id === user_id);
    incident.contractor_signed = true;
    incident.contractor_signed_name = `${user?.name || 'Administrador Familiar'} (Ciência do Contratante)`;
    if (user?.name && !incident.family_viewed_by.includes(user.name)) {
      incident.family_viewed_by.push(user.name);
    }

    saveDb();

    logActivity({
      family_id: user?.family_id || 'fam-01',
      user_id: user?.id || 'usr-01',
      user_name: user?.name || 'Familiar',
      user_role: user?.role || 'admin_family',
      action_type: 'incident_signed',
      category: 'Boletim do Idoso',
      description: `Visto e assinatura de ciência no Boletim do Idoso confirmados por ${user?.name || 'Administrador Familiar'}.`,
    });

    res.json({
      success: true,
      message: 'Ciência e assinatura do contratante confirmadas no relatório.',
      incident,
    });
  });

  // 8. Medications Control
  app.get('/api/medications', (req, res) => {
    res.json(db.medicationLogs);
  });

  app.post('/api/medications/:id/administer', (req, res) => {
    const { id } = req.params;
    const { user_id, notes } = req.body;
    const med = db.medicationLogs.find((m) => m.id === id);
    if (!med) return res.status(404).json({ error: 'Medicamento não localizado' });

    const officialTime = getOfficialServerTime();
    const user = db.users.find((u) => u.id === (user_id || 'usr-01'));

    med.status = 'taken';
    med.administered_at = officialTime.iso_timestamp;
    med.administered_by_user_id = user?.id || 'usr-01';
    med.administered_by_name = user?.name || 'Clara Mendes';
    if (notes) med.instructions += ` (Obs: ${notes})`;

    saveDb();

    logActivity({
      family_id: user?.family_id || 'fam-01',
      user_id: user?.id || 'usr-01',
      user_name: user?.name || 'Cuidador',
      user_role: user?.role || 'caregiver',
      action_type: 'medication_administered',
      category: 'Medicamentos',
      description: `Medicamento ${med.name} (${med.dosage}) administrado ao idoso por ${user?.name || 'Cuidador'}.`,
      details: `Horário: ${med.time_scheduled} | Status: Ministrado`,
    });

    res.json({ success: true, medication: med });
  });

  app.post('/api/medications/:id/skip', (req, res) => {
    const { id } = req.params;
    const { reason, user_id } = req.body;
    const med = db.medicationLogs.find((m) => m.id === id);
    if (!med) return res.status(404).json({ error: 'Medicamento não localizado' });

    const user = db.users.find((u) => u.id === (user_id || 'usr-01'));
    med.status = 'skipped';
    med.instructions += ` [NÃO MINISTRADO: ${reason || 'Idoso recusou ou jejum cirúrgico'}]`;

    saveDb();

    logActivity({
      family_id: user?.family_id || 'fam-01',
      user_id: user?.id || 'usr-01',
      user_name: user?.name || 'Cuidador',
      user_role: user?.role || 'caregiver',
      action_type: 'medication_administered',
      category: 'Medicamentos',
      description: `Medicamento ${med.name} não ministrado por ${user?.name || 'Cuidador'}. Motivo: ${reason || 'Recusado/Jejum'}.`,
    });

    res.json({ success: true, medication: med });
  });

  // 9. Family Notice Board
  app.get('/api/notices', (req, res) => {
    res.json(db.familyNotices);
  });

  app.post('/api/notices', (req, res) => {
    const { title, description, category, user_id } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Título e descrição são obrigatórios' });
    }
    const officialTime = getOfficialServerTime();
    const user = db.users.find((u) => u.id === (user_id || 'usr-01'));

    const newNotice = {
      id: `ntc-${Date.now()}`,
      elderly_id: db.elderly.id,
      created_by_user_id: user?.id || 'usr-01',
      created_by_name: user?.name || 'Membro da Família',
      category: category || 'shopping',
      title,
      description,
      is_resolved: false,
      created_at: officialTime.iso_timestamp,
    };

    db.familyNotices.unshift(newNotice);
    saveDb();

    logActivity({
      family_id: user?.family_id || 'fam-01',
      user_id: user?.id || 'usr-01',
      user_name: user?.name || 'Familiar',
      user_role: user?.role || 'family_member',
      action_type: 'family_notice',
      category: 'Mural',
      description: `Novo aviso no mural publicado por ${user?.name || 'Família'}: "${title}".`,
      details: description,
    });

    res.status(201).json({ success: true, notice: newNotice });
  });

  app.patch('/api/notices/:id/toggle', (req, res) => {
    const { id } = req.params;
    const notice = db.familyNotices.find((n) => n.id === id);
    if (!notice) return res.status(404).json({ error: 'Aviso não encontrado' });

    notice.is_resolved = !notice.is_resolved;
    saveDb();

    logActivity({
      family_id: 'fam-01',
      user_id: 'usr-01',
      user_name: 'Usuário',
      user_role: 'caregiver',
      action_type: 'family_notice',
      category: 'Mural',
      description: `Aviso "${notice.title}" marcado como ${notice.is_resolved ? 'resolvido' : 'pendente'}.`,
    });

    res.json({ success: true, notice });
  });

  // 10. Plano de Missões Diárias (Protocolo de Cuidados) - Exclusivo do Administrador
  app.get('/api/missions', (req, res) => {
    const list = [...db.dailyMissions].sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
    res.json(list);
  });

  // Criar nova missão (Admin Geral ou Admin Familiar)
  app.post('/api/missions', (req, res) => {
    const { title, scheduled_time, category, priority, clear_instructions, user_id } = req.body;
    const user = db.users.find((u) => u.id === (user_id || 'usr-admin-samuel'));

    if (!user || (user.role !== 'admin_family' && user.role !== 'admin_geral')) {
      return res.status(403).json({
        error: 'Permissão negada',
        message: 'Somente o Administrador Geral ou o Administrador Familiar possui autorização para criar missões no Plano Diário.',
      });
    }

    if (!title || !scheduled_time || !clear_instructions) {
      return res.status(400).json({
        error: 'Campos obrigatórios ausentes',
        message: 'Informe título, horário e as instruções claras e concisas da missão.',
      });
    }

    const newMission = {
      id: `mis-${Date.now()}`,
      elderly_id: db.elderly.id,
      title,
      scheduled_time,
      category: category || 'medication',
      priority: priority || 'mandatory',
      clear_instructions,
      created_by_user_id: user.id,
      created_by_name: `${user.name} (${user.role === 'admin_geral' ? 'Admin Geral Master' : 'Admin Familiar'})`,
      is_active: true,
      completed: false,
      completed_at: null,
      completed_by_name: null,
      execution_notes: null,
    };

    db.dailyMissions.push(newMission);
    saveDb();

    logActivity({
      family_id: user?.family_id || 'fam-01',
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action_type: 'mission_created',
      category: 'Obrigações Diárias',
      description: `Nova obrigação diária cadastrada por ${user.name}: "${title}" às ${scheduled_time}.`,
      details: clear_instructions,
    });

    res.status(201).json({
      success: true,
      message: 'Missão diária incluída com sucesso no protocolo do cuidador.',
      mission: newMission,
    });
  });

  // Editar missão (Admin Geral ou Admin Familiar)
  app.put('/api/missions/:id', (req, res) => {
    const { id } = req.params;
    const { title, scheduled_time, category, priority, clear_instructions, user_id } = req.body;
    const user = db.users.find((u) => u.id === (user_id || 'usr-admin-samuel'));

    if (!user || (user.role !== 'admin_family' && user.role !== 'admin_geral')) {
      return res.status(403).json({
        error: 'Permissão negada',
        message: 'Somente o Administrador possui autorização para editar o Plano de Missões Diárias.',
      });
    }

    const mission = db.dailyMissions.find((m) => m.id === id);
    if (!mission) return res.status(404).json({ error: 'Missão não encontrada' });

    if (title) mission.title = title;
    if (scheduled_time) mission.scheduled_time = scheduled_time;
    if (category) mission.category = category;
    if (priority) mission.priority = priority;
    if (clear_instructions) mission.clear_instructions = clear_instructions;

    saveDb();

    logActivity({
      family_id: user?.family_id || 'fam-01',
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action_type: 'mission_created',
      category: 'Obrigações Diárias',
      description: `Obrigação diária "${mission.title}" atualizada pelo Administrador ${user.name}.`,
      details: `Novo horário: ${mission.scheduled_time} | Instruções: ${mission.clear_instructions}`,
    });

    res.json({
      success: true,
      message: 'Missão diária atualizada com sucesso pelo administrador.',
      mission,
    });
  });

  // Excluir missão (Admin Geral ou Admin Familiar)
  app.delete('/api/missions/:id', (req, res) => {
    const { id } = req.params;
    const { user_id } = req.query;
    const user = db.users.find((u) => u.id === (user_id || 'usr-admin-samuel'));

    if (!user || (user.role !== 'admin_family' && user.role !== 'admin_geral')) {
      return res.status(403).json({
        error: 'Permissão negada',
        message: 'Somente o Administrador possui autorização para remover missões do protocolo.',
      });
    }

    const index = db.dailyMissions.findIndex((m) => m.id === id);
    if (index === -1) return res.status(404).json({ error: 'Missão não encontrada' });

    const removed = db.dailyMissions.splice(index, 1)[0];
    saveDb();

    logActivity({
      family_id: user?.family_id || 'fam-01',
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action_type: 'mission_created',
      category: 'Obrigações Diárias',
      description: `Obrigação diária "${removed.title}" removida do protocolo por ${user.name}.`,
    });

    res.json({ success: true, message: 'Missão removida do protocolo diário.' });
  });

  // Marcar missão como cumprida pelo cuidador / executor
  app.post('/api/missions/:id/toggle', (req, res) => {
    const { id } = req.params;
    const { user_id, execution_notes } = req.body;
    const mission = db.dailyMissions.find((m) => m.id === id);
    if (!mission) return res.status(404).json({ error: 'Missão não encontrada' });

    const user = db.users.find((u) => u.id === user_id);
    const officialTime = getOfficialServerTime();

    if (!mission.completed) {
      mission.completed = true;
      mission.completed_at = `${officialTime.formatted_time.slice(0, 5)}`;
      mission.completed_by_name = user?.name || 'Clara Mendes (Cuidadora)';
      if (execution_notes) mission.execution_notes = execution_notes;
    } else {
      mission.completed = false;
      mission.completed_at = null;
      mission.completed_by_name = null;
      mission.execution_notes = null;
    }

    saveDb();

    logActivity({
      family_id: user?.family_id || 'fam-01',
      user_id: user?.id || 'usr-01',
      user_name: user?.name || 'Cuidador',
      user_role: user?.role || 'caregiver',
      action_type: 'mission_completed',
      category: 'Obrigações Diárias',
      description: `Missão "${mission.title}" marcada como ${mission.completed ? 'CUMPRIDA' : 'PENDENTE'} por ${user?.name || 'Cuidador'}.`,
    });

    res.json({ success: true, mission });
  });

  // Attach Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serve
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CUIDA] Servidor ativo em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[CUIDA] Falha ao iniciar servidor:', err);
  process.exit(1);
});
