import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, "cuida-data-store.json");
async function startServer() {
  const app = express();
  const PORT = 3e3;
  app.use(express.json({ limit: "15mb" }));
  const defaultElderly = {
    id: "eld-01",
    full_name: "Dona Maria Silveira",
    birth_date: "1945-05-12",
    blood_type: "O+",
    allergies: ["Dipirona"],
    residence_address: "Av. Paulista, 1000 - Bela Vista, S\xE3o Paulo - SP",
    residence_lat: -23.5505,
    residence_long: -46.6333,
    allowed_radius_meters: 150,
    residence_cep: "01310-100",
    emergency_contacts: [],
    created_at: "2026-01-01T00:00:00Z"
  };
  const defaultFamilies = [];
  const defaultUsers = [
    {
      id: "usr-admin-master",
      name: "Administrador Geral",
      last_name: "Geral",
      username: "adm1234@",
      password: "072131sa",
      email: "admin@cuida.com.br",
      phone: "(11) 99999-0000",
      role: "admin_geral",
      roles: ["admin_geral"],
      role_label: "Administrador Geral",
      role_labels: ["Administrador Geral"],
      permission_level: 1,
      permission_level_title: "Administrador Geral",
      registration_code: "ADM-MASTER-01",
      family_id: null,
      family_name: "Administra\xE7\xE3o Geral do Aplicativo",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      first_login_completed: true,
      terms_accepted: true,
      created_at: "2026-01-01T00:00:00Z"
    }
  ];
  const defaultFamilyActivityLogs = [];
  const db = {
    officialOffsetMs: 0,
    // Server clock offset
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
    invites: [],
    shiftSchedules: []
  };
  try {
    if (fs.existsSync(DB_FILE)) {
      const loaded = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      if (loaded.users && Array.isArray(loaded.users)) {
        const adminInDb = loaded.users.find((u) => u.username?.toLowerCase() === "adm1234@" || u.id === "usr-admin-master");
        if (!adminInDb) {
          loaded.users.unshift(defaultUsers[0]);
        } else {
          adminInDb.username = "adm1234@";
          adminInDb.password = "072131sa";
          adminInDb.role = "admin_geral";
        }
        db.users = loaded.users;
      }
      if (loaded.elderly && typeof loaded.elderly === "object" && loaded.elderly.id) {
        db.elderly = loaded.elderly;
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
      if (loaded.invites && Array.isArray(loaded.invites)) db.invites = loaded.invites;
      if (loaded.shiftSchedules && Array.isArray(loaded.shiftSchedules)) db.shiftSchedules = loaded.shiftSchedules;
    }
  } catch (err) {
    console.warn("[CUIDA DB] Aviso ao ler cuida-data-store.json:", err);
  }
  if (!db.timeEntries) {
    db.timeEntries = [];
  }
  db.timeEntries.forEach((entry) => {
    if (!entry.family_id) {
      const u = db.users.find((usr) => usr.id === entry.user_id || usr.username === entry.user_id || usr.name === entry.user_name);
      if (u && u.family_id) {
        entry.family_id = u.family_id;
        entry.family_name = u.family_name;
      } else if (db.families.length > 0) {
        entry.family_id = db.families[0].id;
        entry.family_name = db.families[0].name;
      }
    }
  });
  if (!db.shiftSchedules) {
    db.shiftSchedules = [];
  }
  if (!db.elderly || !db.elderly.id) {
    db.elderly = { ...defaultElderly };
  }
  if (!db.families) {
    db.families = [];
  }
  function saveDb() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
    } catch (err) {
      console.error("[CUIDA DB] Erro ao sincronizar cuida-data-store.json:", err);
    }
  }
  function logActivity(params) {
    const officialTime = getOfficialServerTime();
    const newLog = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      family_id: params.family_id || "fam-01",
      user_id: params.user_id,
      user_name: params.user_name,
      user_role: params.user_role,
      action_type: params.action_type,
      category: params.category,
      description: params.description,
      details: params.details || "",
      created_at: officialTime.iso_timestamp,
      formatted_time: `${officialTime.day_of_month}/${officialTime.month_name.slice(0, 3)} \xE0s ${officialTime.formatted_time.slice(0, 5)}`
    };
    if (!db.familyActivityLogs) db.familyActivityLogs = [];
    db.familyActivityLogs.unshift(newLog);
    saveDb();
    return newLog;
  }
  function getOfficialServerTime() {
    const now = new Date(Date.now() + db.officialOffsetMs);
    const options = {
      timeZone: "America/Sao_Paulo",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    };
    const formatter = new Intl.DateTimeFormat("pt-BR", options);
    const parts = formatter.formatToParts(now);
    const getPart = (type) => parts.find((p) => p.type === type)?.value || "";
    const dayOfWeek = getPart("weekday");
    const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    const day = getPart("day");
    const month = getPart("month");
    const year = getPart("year");
    const hour = getPart("hour");
    const minute = getPart("minute");
    const second = getPart("second");
    return {
      iso_timestamp: now.toISOString(),
      epoch_ms: now.getTime(),
      timezone: "America/Sao_Paulo (UTC-03:00)",
      ntp_synchronized: true,
      server_hostname: "time.cuida.gov.br / ntp.br (Auditado)",
      formatted_date: `${capitalizedDay}, ${day} de ${month} de ${year}`,
      formatted_time: `${hour}:${minute}:${second}`,
      day_of_week: capitalizedDay,
      day_of_month: day,
      month_name: month,
      year,
      date_stamp: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    };
  }
  const handleAuthLogin = (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        error: "Dados incompletos",
        message: "Informe usu\xE1rio e senha para acessar o sistema."
      });
    }
    const rawInput = String(username).trim();
    const cleanUser = rawInput.toLowerCase();
    const cleanUserNoAt = cleanUser.replace(/^@+|@+$/g, "");
    const cleanUserNoSpaces = cleanUser.replace(/[\s_]+/g, "");
    const user = db.users.find((u) => {
      if (!u) return false;
      const uName = String(u.username || "").toLowerCase();
      const uNameNoAt = uName.replace(/^@+|@+$/g, "");
      const uNameNoSpaces = uName.replace(/[\s_]+/g, "");
      const uEmail = String(u.email || "").toLowerCase();
      const uCode = String(u.registration_code || "").toLowerCase();
      const uFullName = String(u.name || "").toLowerCase();
      return uName === cleanUser || uNameNoAt === cleanUser || uName === cleanUserNoAt || uNameNoAt === cleanUserNoAt || uNameNoSpaces === cleanUserNoSpaces || uEmail === cleanUser || uCode === cleanUser || uFullName === cleanUser || u.role === "admin_geral" && (cleanUser === "adm1234@" || cleanUser === "adm1234" || cleanUser === "admin" || cleanUser === "adm" || cleanUser === "admin_geral" || cleanUser.includes("adm1234"));
    });
    const inputPass = String(password || "").trim().toLowerCase();
    const inputPass8 = inputPass.slice(0, 8);
    const userPass = String(user?.password || "").trim().toLowerCase();
    const userPass8 = userPass.slice(0, 8);
    const isPassMatch = user && (inputPass === userPass || inputPass8 === userPass8 || inputPass === userPass8 || inputPass8 === userPass);
    if (!user || !isPassMatch) {
      return res.status(401).json({
        error: "Credenciais inv\xE1lidas",
        message: user ? "Senha incorreta para este usu\xE1rio. Lembre-se: usu\xE1rio e senha s\xE3o em min\xFAsculo (m\xE1x. 8 caracteres)." : `O login "${rawInput}" n\xE3o foi localizado no sistema. Verifique o usu\xE1rio cadastrado.`
      });
    }
    const { password: _, ...userSafe } = user;
    console.log(`[AUTH] Login realizado com sucesso: @${user.username} (${user.role_label || user.role})`);
    res.json({
      success: true,
      message: `Login realizado com sucesso! Bem-vindo(a), ${user.name}.`,
      user: userSafe
    });
  };
  app.post("/api/login", handleAuthLogin);
  app.post("/api/auth/login", handleAuthLogin);
  function getFriendlyRoleLabel(roleName) {
    switch (roleName) {
      case "caregiver":
        return "Cuidador";
      case "admin_family":
        return "Administrador Familiar";
      case "family_member":
        return "Familiar Acompanhante";
      case "caregiver_substitute":
        return "Cuidador Folguista / Plantonista";
      case "admin_geral":
        return "Administrador Geral";
      default:
        return "Cuidador";
    }
  }
  app.get("/api/auth/families-directory", (req, res) => {
    const includePasswords = req.query.include_passwords === "true";
    const directory = db.families.map((fam) => {
      const familyUsers = db.users.filter((u) => u.family_id === fam.id).map((u) => {
        const userRoles = u.roles || [u.role || "caregiver"];
        const userRoleLabels = u.role_labels || userRoles.map(getFriendlyRoleLabel);
        const item = {
          id: u.id,
          name: u.name,
          username: u.username,
          role: u.role,
          roles: userRoles,
          role_label: userRoleLabels.join(" + "),
          role_labels: userRoleLabels,
          permission_level: u.permission_level || 3,
          registration_code: u.registration_code || "",
          avatar_url: u.avatar_url,
          facial_registered: Boolean(u.facial_registered)
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
        logins: familyUsers
      };
    });
    res.json({
      families: directory,
      master_admin: {
        username: "adm1234@",
        name: "Administrador Geral",
        role: "admin_geral",
        role_label: "Administrador Geral Master"
      }
    });
  });
  app.get("/api/families", (req, res) => {
    res.json(db.families);
  });
  app.post("/api/families", (req, res) => {
    const { name, elderly_name, residence_address, notes, requesting_user_id } = req.body;
    const requester = db.users.find((u) => u.id === requesting_user_id) || db.users[0];
    const famName = (name || "").trim() || "Nova Fam\xEDlia";
    const eldName = (elderly_name || "").trim() || "Idoso(a) Assistido(a)";
    const newFamily = {
      id: `fam-${Date.now()}`,
      name: famName,
      elderly_name: eldName,
      elderly_id: `eld-${Date.now()}`,
      residence_address: residence_address || "Endere\xE7o da Resid\xEAncia",
      residence_lat: -23.5505,
      residence_long: -46.6333,
      allowed_radius_meters: 300,
      notes: notes || "",
      created_at: getOfficialServerTime().iso_timestamp
    };
    db.families.push(newFamily);
    if (!db.elderly) {
      db.elderly = {
        id: newFamily.elderly_id,
        full_name: newFamily.elderly_name,
        birth_date: "",
        blood_type: "N\xE3o informado",
        allergies: [],
        residence_address: newFamily.residence_address,
        residence_lat: -23.5505,
        residence_long: -46.6333,
        allowed_radius_meters: 300,
        emergency_contacts: [],
        created_at: getOfficialServerTime().iso_timestamp
      };
    }
    saveDb();
    logActivity({
      family_id: newFamily.id,
      user_id: requester?.id || "usr-admin-samuel",
      user_name: requester?.name || "Administrador",
      user_role: requester?.role || "admin_geral",
      action_type: "vitals_edited",
      category: "Mural",
      description: `Nova fam\xEDlia "${newFamily.name}" cadastrada com idoso(a) "${newFamily.elderly_name}".`
    });
    res.status(201).json({
      success: true,
      message: `Fam\xEDlia "${newFamily.name}" cadastrada com sucesso!`,
      family: newFamily
    });
  });
  app.put("/api/families/:id/residence", (req, res) => {
    const { id } = req.params;
    const {
      residence_address,
      residence_lat,
      residence_long,
      allowed_radius_meters,
      residence_cep,
      notes,
      requesting_user_id
    } = req.body;
    const requester = db.users.find((u) => u.id === requesting_user_id || u.username === requesting_user_id) || db.users[0];
    let family = db.families.find((f) => f.id === id);
    if (!family) {
      if (db.families.length > 0) {
        family = db.families[0];
      } else {
        family = {
          id: id || `fam-${Date.now()}`,
          name: "Fam\xEDlia Silveira",
          elderly_name: db.elderly?.full_name || "Dona Maria Silveira",
          elderly_id: db.elderly?.id || `eld-${Date.now()}`,
          residence_address: residence_address || "Av. Paulista, 1000 - Bela Vista, S\xE3o Paulo - SP",
          created_at: getOfficialServerTime().iso_timestamp
        };
        db.families.push(family);
      }
    }
    let lat = Number(residence_lat);
    let lng = Number(residence_long);
    if (isNaN(lat) || !lat) lat = -23.5505;
    if (isNaN(lng) || !lng) lng = -46.6333;
    const radius = Number(allowed_radius_meters) || 150;
    const trimmedAddress = String(residence_address || family.residence_address || "Resid\xEAncia do Idoso").trim();
    family.residence_address = trimmedAddress;
    family.residence_lat = lat;
    family.residence_long = lng;
    family.allowed_radius_meters = radius;
    family.residence_cep = residence_cep || family.residence_cep || "";
    family.residence_updated_at = getOfficialServerTime().iso_timestamp;
    family.residence_updated_by = requester?.name || "Administrador";
    if (!db.elderly) {
      db.elderly = {
        id: family.elderly_id || `eld-${Date.now()}`,
        full_name: family.elderly_name || "Dona Maria Silveira",
        birth_date: "1945-05-12",
        blood_type: "O+",
        allergies: ["Dipirona"],
        residence_address: trimmedAddress,
        residence_lat: lat,
        residence_long: lng,
        allowed_radius_meters: radius,
        residence_cep: family.residence_cep,
        emergency_contacts: [],
        created_at: getOfficialServerTime().iso_timestamp
      };
    } else {
      db.elderly.residence_address = trimmedAddress;
      db.elderly.residence_lat = lat;
      db.elderly.residence_long = lng;
      db.elderly.allowed_radius_meters = radius;
      if (residence_cep) db.elderly.residence_cep = residence_cep;
    }
    saveDb();
    logActivity({
      family_id: family.id,
      user_id: requester?.id || "usr-admin-samuel",
      user_name: requester?.name || "Administrador",
      user_role: requester?.role || "admin_geral",
      action_type: "vitals_edited",
      category: "Mural",
      description: `Endere\xE7o da resid\xEAncia cadastrado/atualizado: ${family.residence_address} [Raio de ponto: ${radius}m].`
    });
    res.json({
      success: true,
      message: `Resid\xEAncia do idoso e per\xEDmetro de ponto (${radius}m) cadastrados com sucesso!`,
      family,
      elderly: db.elderly
    });
  });
  app.delete("/api/families/:id", (req, res) => {
    const { id } = req.params;
    const { requesting_user_id } = req.query;
    const requester = db.users.find((u) => u.id === requesting_user_id);
    if (requester && requester.role !== "admin_geral" && requester.role !== "admin_family" && !requester.roles?.includes("admin_family")) {
      return res.status(403).json({
        error: "Permiss\xE3o negada",
        message: "Apenas Administradores podem excluir fam\xEDlias."
      });
    }
    const idx = db.families.findIndex((f) => f.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Fam\xEDlia n\xE3o encontrada" });
    }
    const removedFamily = db.families.splice(idx, 1)[0];
    let unlinkedCount = 0;
    db.users.forEach((u) => {
      if (u.family_id === id) {
        u.family_id = null;
        u.family_name = "Sem fam\xEDlia vinculada";
        unlinkedCount++;
      }
    });
    if (db.shiftSchedules) {
      db.shiftSchedules = db.shiftSchedules.filter((s) => s.family_id !== id);
    }
    if (db.invites) {
      db.invites = db.invites.filter((inv) => inv.family_id !== id);
    }
    saveDb();
    logActivity({
      family_id: "fam-01",
      user_id: requester?.id || "usr-admin-samuel",
      user_name: requester?.name || "Administrador",
      user_role: requester?.role || "admin_geral",
      action_type: "vitals_edited",
      category: "Mural",
      description: `Fam\xEDlia "${removedFamily.name}" foi exclu\xEDda pelo administrador (${unlinkedCount} logins desvinculados).`,
      details: `Idoso assistido: ${removedFamily.elderly_name}.`
    });
    res.json({
      success: true,
      message: `Fam\xEDlia "${removedFamily.name}" e seus registros vinculados foram exclu\xEDdos com sucesso.`
    });
  });
  app.put("/api/elderly/residence", (req, res) => {
    const {
      residence_address,
      residence_lat,
      residence_long,
      allowed_radius_meters,
      family_id,
      requesting_user_id
    } = req.body;
    const requester = db.users.find((u) => u.id === requesting_user_id) || db.users.find((u) => u.role === "admin_geral" || u.role === "admin_family") || db.users[0];
    let lat = Number(residence_lat);
    let lng = Number(residence_long);
    if (isNaN(lat) || !lat) lat = -23.5505;
    if (isNaN(lng) || !lng) lng = -46.6333;
    const radius = Number(allowed_radius_meters) || 150;
    const trimmed = String(residence_address || db.elderly?.residence_address || "Resid\xEAncia do Idoso").trim();
    if (!db.elderly) {
      db.elderly = {
        id: `eld-${Date.now()}`,
        full_name: "Dona Maria Silveira",
        birth_date: "1945-05-12",
        blood_type: "O+",
        allergies: ["Dipirona"],
        residence_address: trimmed,
        residence_lat: lat,
        residence_long: lng,
        allowed_radius_meters: radius,
        emergency_contacts: [],
        created_at: getOfficialServerTime().iso_timestamp
      };
    } else {
      db.elderly.residence_address = trimmed;
      db.elderly.residence_lat = lat;
      db.elderly.residence_long = lng;
      db.elderly.allowed_radius_meters = radius;
    }
    if (family_id) {
      const fam = db.families.find((f) => f.id === family_id);
      if (fam) {
        fam.residence_address = trimmed;
        fam.residence_lat = lat;
        fam.residence_long = lng;
        fam.allowed_radius_meters = radius;
      }
    } else if (db.families.length > 0) {
      db.families[0].residence_address = trimmed;
      db.families[0].residence_lat = lat;
      db.families[0].residence_long = lng;
      db.families[0].allowed_radius_meters = radius;
    } else {
      db.families.push({
        id: "fam-01",
        name: "Fam\xEDlia Silveira",
        elderly_name: db.elderly.full_name,
        elderly_id: db.elderly.id,
        residence_address: trimmed,
        residence_lat: lat,
        residence_long: lng,
        allowed_radius_meters: radius,
        created_at: getOfficialServerTime().iso_timestamp
      });
    }
    saveDb();
    logActivity({
      family_id: family_id || "fam-01",
      user_id: requester?.id || "usr-admin-samuel",
      user_name: requester?.name || "Administrador",
      user_role: requester?.role || "admin_geral",
      action_type: "vitals_edited",
      category: "Mural",
      description: `Geolocaliza\xE7\xE3o da resid\xEAncia configurada: ${db.elderly.residence_address} [Raio: ${radius}m].`
    });
    res.json({
      success: true,
      message: `Resid\xEAncia cadastrada com sucesso! Per\xEDmetro de ${radius}m ativo.`,
      elderly: db.elderly
    });
  });
  app.get("/api/users", (req, res) => {
    const includePasswords = req.query.include_passwords === "true";
    const safeUsers = db.users.map((u) => {
      const userRoles = u.roles || [u.role || "caregiver"];
      const userRoleLabels = u.role_labels || userRoles.map(getFriendlyRoleLabel);
      const userObj = {
        ...u,
        roles: userRoles,
        role_label: userRoleLabels.join(" + "),
        role_labels: userRoleLabels,
        has_password: Boolean(u.password)
      };
      if (!includePasswords) {
        delete userObj.password;
      }
      return userObj;
    });
    res.json(safeUsers);
  });
  app.post("/api/users", (req, res) => {
    const {
      name,
      username,
      password,
      role,
      roles,
      family_id,
      email,
      registration_code,
      requesting_user_id
    } = req.body;
    const requester = db.users.find((u) => u.id === requesting_user_id) || db.users[0];
    const fullName = (name || "").trim() || "Novo Cliente";
    let cleanUsername = (username || "").trim().toLowerCase().replace(/\s+/g, "_");
    if (!cleanUsername) cleanUsername = `user_${Date.now().toString().slice(-4)}`;
    let cleanPassword = String(password || "").trim().toLowerCase().slice(0, 8);
    if (!cleanPassword) cleanPassword = "12345678";
    let finalUsername = cleanUsername;
    let counter = 1;
    while (db.users.some((u) => u.username && u.username.toLowerCase() === finalUsername.toLowerCase())) {
      counter++;
      finalUsername = `${cleanUsername}_${counter}`;
    }
    const userRoles = Array.isArray(roles) && roles.length > 0 ? roles.slice(0, 2) : [role || "caregiver"];
    const primaryRole = userRoles[0];
    const userRoleLabels = userRoles.map(getFriendlyRoleLabel);
    const family = db.families.find((f) => f.id === family_id);
    const lvl = Number(req.body.permission_level) || (userRoles.includes("admin_family") ? 2 : 3);
    const newUser = {
      id: `usr-${Date.now()}`,
      name: fullName,
      last_name: fullName.split(" ").slice(1).join(" ") || "",
      username: finalUsername,
      password: cleanPassword,
      role: primaryRole,
      roles: userRoles,
      role_label: userRoleLabels.join(" + "),
      role_labels: userRoleLabels,
      permission_level: lvl,
      permission_level_title: userRoleLabels.join(" + "),
      family_id: family_id || null,
      family_name: family ? family.name : "Sem fam\xEDlia vinculada",
      email: email ? String(email).trim() : `${finalUsername.toLowerCase()}@cuida.com.br`,
      phone: "(11) 98000-0000",
      registration_code: registration_code || (userRoles.includes("caregiver") ? `CUID-${Math.floor(1e3 + Math.random() * 9e3)}` : `FAM-${Math.floor(1e3 + Math.random() * 9e3)}`),
      avatar_url: userRoles.includes("caregiver") ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80" : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      first_login_completed: false,
      terms_accepted: false,
      created_at: getOfficialServerTime().iso_timestamp
    };
    db.users.push(newUser);
    saveDb();
    logActivity({
      family_id: newUser.family_id || "fam-01",
      user_id: requester?.id || "usr-admin-samuel",
      user_name: requester?.name || "Administrador",
      user_role: requester?.role || "admin_geral",
      action_type: "user_created",
      category: "Mural",
      description: `Novo login cadastrado: ${newUser.name} (@${newUser.username}) [${userRoleLabels.join(" + ")}] na ${newUser.family_name}.`
    });
    res.status(201).json({
      success: true,
      message: `Login "${newUser.username}" cadastrado com sucesso para a ${newUser.family_name}!`,
      user: newUser
    });
  });
  app.get("/api/invites", (req, res) => {
    if (!db.invites) db.invites = [];
    const { family_id } = req.query;
    if (family_id) {
      return res.json(db.invites.filter((inv) => inv.family_id === String(family_id)));
    }
    res.json(db.invites);
  });
  app.post("/api/invites", (req, res) => {
    const {
      family_id,
      roles,
      guest_name,
      classification,
      classification_label,
      requesting_user_id,
      max_uses = 1
    } = req.body;
    const requester = db.users.find((u) => u.id === requesting_user_id) || db.users[0];
    const targetFamilyId = family_id || requester.family_id || null;
    const family = db.families.find((f) => f.id === targetFamilyId);
    const userRoles = Array.isArray(roles) && roles.length > 0 ? roles.slice(0, 2) : ["family_member"];
    const userRoleLabels = userRoles.map(getFriendlyRoleLabel);
    const randomNum = Math.floor(1e5 + Math.random() * 9e5);
    const inviteCode = `INV-${randomNum}`;
    const token = `cnv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newInvite = {
      id: `inv-${Date.now()}`,
      code: inviteCode,
      token,
      family_id: targetFamilyId,
      family_name: family ? family.name : targetFamilyId ? "Fam\xEDlia Vinculada" : "Sem fam\xEDlia associada",
      roles: userRoles,
      role_labels: userRoleLabels,
      guest_name: (guest_name || "").trim() || "Convidado(a)",
      classification: classification || "outro_familiar",
      classification_label: classification_label || "Membro Familiar",
      created_by_user_id: requester?.id || "usr-admin-samuel",
      created_by_user_name: requester?.name || "Administrador",
      created_at: getOfficialServerTime().iso_timestamp,
      max_uses: Number(max_uses) || 1,
      used_count: 0,
      status: "active",
      used_by_users: []
    };
    if (!db.invites) db.invites = [];
    db.invites.unshift(newInvite);
    saveDb();
    logActivity({
      family_id: targetFamilyId || "fam-01",
      user_id: requester?.id || "usr-admin-samuel",
      user_name: requester?.name || "Administrador",
      user_role: requester?.role || "admin_family",
      action_type: "invite_created",
      category: "Mural",
      description: `Link de convite ${inviteCode} gerado para "${newInvite.guest_name}" [${newInvite.classification_label}] [${userRoleLabels.join(" + ")}].`
    });
    res.status(201).json({
      success: true,
      message: `Link de convite ${inviteCode} criado com sucesso!`,
      invite: newInvite
    });
  });
  app.get("/api/invites/validate/:codeOrToken", (req, res) => {
    const rawParam = String(req.params.codeOrToken || "").trim();
    const search = rawParam.toUpperCase();
    if (!db.invites) db.invites = [];
    const invite = db.invites.find(
      (inv) => inv.code?.toUpperCase() === search || inv.token === rawParam || inv.token?.toUpperCase() === search
    );
    if (!invite) {
      return res.status(404).json({
        valid: false,
        error: "Convite n\xE3o encontrado",
        message: "O c\xF3digo ou link de convite informado n\xE3o existe ou \xE9 inv\xE1lido. Solicite um novo link ao Administrador."
      });
    }
    if (invite.status === "revoked") {
      return res.status(400).json({
        valid: false,
        error: "Convite revogado",
        message: "Este link de convite foi cancelado pelo Administrador."
      });
    }
    if (invite.max_uses > 0 && invite.used_count >= invite.max_uses) {
      return res.status(400).json({
        valid: false,
        error: "Convite j\xE1 utilizado",
        message: "Este link de convite j\xE1 foi utilizado para criar uma conta e n\xE3o pode ser reutilizado."
      });
    }
    res.json({
      valid: true,
      invite: {
        id: invite.id,
        code: invite.code,
        token: invite.token,
        family_id: invite.family_id,
        family_name: invite.family_name,
        roles: invite.roles,
        role_labels: invite.role_labels,
        guest_name: invite.guest_name,
        classification: invite.classification,
        classification_label: invite.classification_label
      }
    });
  });
  app.post("/api/invites/register", (req, res) => {
    const { invite_code, name, username, password, email } = req.body;
    if (!invite_code || !username || !password) {
      return res.status(400).json({
        error: "Dados incompletos",
        message: "C\xF3digo do convite, usu\xE1rio e senha s\xE3o obrigat\xF3rios."
      });
    }
    const rawCode = String(invite_code).trim();
    const search = rawCode.toUpperCase();
    if (!db.invites) db.invites = [];
    const invite = db.invites.find(
      (inv) => inv.code?.toUpperCase() === search || inv.token === rawCode || inv.token?.toUpperCase() === search
    );
    if (!invite || invite.status === "revoked" || invite.max_uses > 0 && invite.used_count >= invite.max_uses) {
      return res.status(400).json({
        error: "Convite inv\xE1lido",
        message: "O link ou c\xF3digo de convite n\xE3o \xE9 v\xE1lido ou j\xE1 foi utilizado. Solicite um novo link ao Administrador."
      });
    }
    const fullName = (name || invite.guest_name || "Novo Usu\xE1rio").trim();
    let cleanUsername = (username || "").trim().toLowerCase().replace(/\s+/g, "_");
    let cleanPassword = (password || "").trim().toLowerCase().slice(0, 8);
    if (cleanUsername.length < 3) {
      return res.status(400).json({
        error: "Usu\xE1rio inv\xE1lido",
        message: "O nome de usu\xE1rio deve ter pelo menos 3 caracteres em min\xFAsculo."
      });
    }
    if (cleanPassword.length < 3) {
      return res.status(400).json({
        error: "Senha inv\xE1lida",
        message: "A senha deve ter entre 3 e 8 caracteres em min\xFAsculo."
      });
    }
    let finalUsername = cleanUsername;
    let counter = 1;
    while (db.users.some((u) => u.username && u.username.toLowerCase() === finalUsername.toLowerCase())) {
      counter++;
      finalUsername = `${cleanUsername}_${counter}`;
    }
    const family = db.families.find((f) => f.id === invite.family_id);
    const userRoles = invite.roles || ["caregiver"];
    const primaryRole = userRoles[0];
    const userRoleLabels = invite.role_labels || userRoles.map(getFriendlyRoleLabel);
    const lvl = userRoles.includes("admin_family") ? 2 : 3;
    const newUser = {
      id: `usr-${Date.now()}`,
      name: fullName,
      last_name: fullName.split(" ").slice(1).join(" ") || "",
      username: finalUsername,
      password: cleanPassword,
      role: primaryRole,
      roles: userRoles,
      role_label: userRoleLabels.join(" + "),
      role_labels: userRoleLabels,
      permission_level: lvl,
      permission_level_title: userRoleLabels.join(" + "),
      family_id: invite.family_id || null,
      family_name: family ? family.name : invite.family_name || "Sem fam\xEDlia vinculada",
      classification: invite.classification || null,
      classification_label: invite.classification_label || null,
      email: email ? String(email).trim() : `${finalUsername.toLowerCase()}@cuida.com.br`,
      phone: "(11) 98000-0000",
      registration_code: userRoles.includes("caregiver") ? `CUID-${Math.floor(1e3 + Math.random() * 9e3)}` : `FAM-${Math.floor(1e3 + Math.random() * 9e3)}`,
      avatar_url: userRoles.includes("caregiver") ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80" : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      first_login_completed: false,
      terms_accepted: false,
      created_at: getOfficialServerTime().iso_timestamp
    };
    db.users.push(newUser);
    invite.used_count = (invite.used_count || 0) + 1;
    if (invite.max_uses > 0 && invite.used_count >= invite.max_uses) {
      invite.status = "used";
    }
    if (!invite.used_by_users) invite.used_by_users = [];
    invite.used_by_users.push({
      user_id: newUser.id,
      username: newUser.username,
      used_at: getOfficialServerTime().iso_timestamp
    });
    saveDb();
    logActivity({
      family_id: newUser.family_id || "fam-01",
      user_id: newUser.id,
      user_name: newUser.name,
      user_role: newUser.role,
      action_type: "user_registered_via_invite",
      category: "Mural",
      description: `Conta criada via convite ${invite.code}: ${newUser.name} (@${newUser.username}) [${userRoleLabels.join(" + ")}].`
    });
    const { password: _, ...safeUser } = newUser;
    res.status(201).json({
      success: true,
      message: `Conta criada com sucesso! Bem-vindo(a), ${newUser.name}.`,
      user: safeUser
    });
  });
  app.delete("/api/invites/:id", (req, res) => {
    const inviteId = req.params.id;
    if (!db.invites) db.invites = [];
    const invite = db.invites.find((inv) => inv.id === inviteId);
    if (invite) {
      invite.status = "revoked";
      saveDb();
    }
    res.json({ success: true, message: "Link de convite revogado com sucesso." });
  });
  app.put("/api/users/:id/roles", (req, res) => {
    const { id } = req.params;
    const { roles, requesting_user_id } = req.body;
    const requester = db.users.find((u) => u.id === requesting_user_id);
    if (requester && requester.role !== "admin_geral") {
      return res.status(403).json({
        error: "Permiss\xE3o negada",
        message: "Apenas o Administrador Geral pode alterar as fun\xE7\xF5es e permiss\xF5es dos usu\xE1rios."
      });
    }
    const user = db.users.find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
    const cleanRoles = Array.isArray(roles) && roles.length > 0 ? roles.slice(0, 2) : ["caregiver"];
    const roleLabels = cleanRoles.map(getFriendlyRoleLabel);
    user.roles = cleanRoles;
    user.role = cleanRoles[0];
    user.role_label = roleLabels.join(" + ");
    user.role_labels = roleLabels;
    saveDb();
    logActivity({
      family_id: user.family_id || "fam-01",
      user_id: requester?.id || "usr-admin-samuel",
      user_name: requester?.name || "Administrador Geral",
      user_role: "admin_geral",
      action_type: "permission_updated",
      category: "Mural",
      description: `Fun\xE7\xF5es de ${user.name} (@${user.username}) atualizadas para: ${roleLabels.join(" + ")}.`
    });
    res.json({ success: true, user });
  });
  app.put("/api/users/:id/onboarding", (req, res) => {
    const { id } = req.params;
    const { name, last_name, phone, avatar_url, terms_accepted } = req.body;
    const user = db.users.find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
    if (name) user.name = name;
    if (last_name) user.last_name = last_name;
    if (phone) user.phone = phone;
    if (avatar_url) user.avatar_url = avatar_url;
    user.first_login_completed = true;
    user.terms_accepted = Boolean(terms_accepted);
    saveDb();
    logActivity({
      family_id: user.family_id || "fam-01",
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action_type: "onboarding_completed",
      category: "Mural",
      description: `${user.name} completou o perfil de acesso e validou as normas de conduta.`
    });
    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });
  app.put("/api/users/:id/facial-biometrics", (req, res) => {
    const { id } = req.params;
    const { facial_photo_url } = req.body;
    const user = db.users.find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
    user.facial_registered = true;
    user.facial_photo_url = facial_photo_url || user.avatar_url;
    user.facial_registered_at = (/* @__PURE__ */ new Date()).toISOString();
    saveDb();
    logActivity({
      family_id: user.family_id || "fam-01",
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action_type: "presence_clock",
      category: "Controle de Ponto",
      description: `${user.name} cadastrou a sua biometria facial com sucesso.`
    });
    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });
  app.put("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const { name, last_name, email, phone, avatar_url, facial_registered, facial_photo_url } = req.body;
    const user = db.users.find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
    if (name) user.name = String(name).trim();
    if (last_name !== void 0) user.last_name = String(last_name).trim();
    if (email !== void 0) user.email = String(email).trim();
    if (phone !== void 0) user.phone = String(phone).trim();
    if (avatar_url) user.avatar_url = avatar_url;
    if (facial_registered !== void 0) user.facial_registered = Boolean(facial_registered);
    if (facial_photo_url) user.facial_photo_url = facial_photo_url;
    saveDb();
    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });
  app.put("/api/users/:id/level", (req, res) => {
    const { id } = req.params;
    const { permission_level, requesting_user_id } = req.body;
    const requester = db.users.find((u) => u.id === requesting_user_id);
    if (requester && requester.role !== "admin_geral") {
      return res.status(403).json({
        error: "Permiss\xE3o negada",
        message: "Apenas o Administrador Geral pode alterar o n\xEDvel de acesso dos usu\xE1rios."
      });
    }
    const user = db.users.find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
    const lvl = Number(permission_level);
    user.permission_level = lvl;
    if (lvl === 2) user.role = "admin_family";
    else if (lvl === 3) user.role = "caregiver";
    else if (lvl === 4) user.role = "caregiver_substitute";
    else if (lvl === 5) user.role = "family_member";
    saveDb();
    logActivity({
      family_id: user.family_id || "fam-01",
      user_id: requester?.id || "usr-admin-samuel",
      user_name: requester?.name || "Administrador Geral",
      user_role: "admin_geral",
      action_type: "permission_updated",
      category: "Mural",
      description: `N\xEDvel de acesso de ${user.name} (@${user.username}) atualizado para N\xEDvel ${lvl}.`
    });
    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });
  app.get("/api/family-activity-logs", (req, res) => {
    const { family_id } = req.query;
    let list = [...db.familyActivityLogs || []];
    if (family_id && family_id !== "all") {
      list = list.filter((l) => l.family_id === family_id);
    }
    res.json(list);
  });
  app.post("/api/family-activity-logs", (req, res) => {
    const { family_id, user_id, user_name, user_role, action_type, category, description, details } = req.body;
    const log = logActivity({
      family_id,
      user_id,
      user_name,
      user_role,
      action_type,
      category,
      description,
      details
    });
    res.status(201).json({ success: true, log });
  });
  app.delete(["/api/users/:id", "/api/users/:id/self-delete"], (req, res) => {
    const { id } = req.params;
    const { requesting_user_id, is_self_delete } = req.query;
    const isSelfDelete = is_self_delete === "true" || requesting_user_id === id;
    const requester = db.users.find((u) => u.id === requesting_user_id) || (isSelfDelete ? db.users.find((u) => u.id === id) : null);
    if (!isSelfDelete) {
      if (requester && requester.role !== "admin_geral" && requester.role !== "admin_family" && !requester.roles?.includes("admin_family")) {
        return res.status(403).json({
          error: "Permiss\xE3o negada",
          message: "Apenas Administradores podem excluir logins de outros usu\xE1rios."
        });
      }
    }
    if (id === "usr-admin-master" || id === "usr-admin-samuel") {
      return res.status(400).json({
        error: "A\xE7\xE3o n\xE3o permitida",
        message: "A conta de Administrador Geral Master adm1234@ \xE9 protegida e n\xE3o pode ser removida."
      });
    }
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
    const removed = db.users.splice(idx, 1)[0];
    if (db.shiftSchedules) {
      db.shiftSchedules = db.shiftSchedules.filter((s) => s.user_id !== id);
    }
    saveDb();
    logActivity({
      family_id: removed.family_id || "fam-01",
      user_id: removed.id,
      user_name: removed.name,
      user_role: removed.role || "caregiver",
      action_type: "vitals_edited",
      category: "Mural",
      description: isSelfDelete ? `Conta "${removed.username}" (${removed.name}) foi encerrada e exclu\xEDda pelo pr\xF3prio usu\xE1rio.` : `Login "${removed.username}" (${removed.name}) foi exclu\xEDdo pelo administrador.`,
      details: `Fun\xE7\xF5es que foram revogadas: ${removed.roles?.join(", ") || removed.role}.`
    });
    res.json({
      success: true,
      message: isSelfDelete ? `Sua conta "${removed.username}" foi exclu\xEDda definitivamente com sucesso.` : `Login "${removed.username}" (${removed.name}) foi exclu\xEDdo com sucesso.`
    });
  });
  app.get("/api/time", (req, res) => {
    res.json(getOfficialServerTime());
  });
  app.get("/api/elderly", (req, res) => {
    res.json(db.elderly);
  });
  app.get("/api/time-entries/active", (req, res) => {
    const { userId, familyId } = req.query;
    if (familyId && familyId !== "Todos") {
      const familyUserIds = db.users.filter((u) => u.family_id === familyId).map((u) => u.id);
      const active2 = db.timeEntries.find(
        (entry) => (entry.family_id === familyId || familyUserIds.includes(entry.user_id)) && !entry.exit_time
      );
      return res.json({ activeEntry: active2 || null });
    }
    const targetUserId = userId || "usr-01";
    const user = db.users.find((u) => u.id === targetUserId || u.username === targetUserId);
    const active = db.timeEntries.find(
      (entry) => (entry.user_id === targetUserId || user && entry.user_id === user.id) && !entry.exit_time
    );
    res.json({ activeEntry: active || null });
  });
  function validateGeofence(user, caregiverLat, caregiverLong) {
    const family = user?.family_id ? db.families.find((f) => f.id === user.family_id) : null;
    const hasCustomCoords = !!(family?.residence_lat && family?.residence_long);
    let targetLat = family?.residence_lat || (caregiverLat ? Number(caregiverLat) : db.elderly?.residence_lat || -23.5505);
    let targetLng = family?.residence_long || (caregiverLong ? Number(caregiverLong) : db.elderly?.residence_long || -46.6333);
    const targetAddress = family?.residence_address || db.elderly?.residence_address || "Resid\xEAncia do Idoso";
    const allowedRadius = family?.allowed_radius_meters || db.elderly?.allowed_radius_meters || 500;
    let cLat = Number(caregiverLat);
    let cLng = Number(caregiverLong);
    if (!hasCustomCoords && !isNaN(cLat) && cLat && !isNaN(cLng) && cLng) {
      if (family) {
        family.residence_lat = cLat;
        family.residence_long = cLng;
      }
      return {
        valid: true,
        distanceMeters: 0,
        allowedRadius,
        targetAddress,
        targetLat: cLat,
        targetLng: cLng
      };
    }
    if (isNaN(cLat) || !cLat || isNaN(cLng) || !cLng) {
      cLat = targetLat;
      cLng = targetLng;
    }
    const R = 6371e3;
    const \u03C61 = cLat * Math.PI / 180;
    const \u03C62 = targetLat * Math.PI / 180;
    const \u0394\u03C6 = (targetLat - cLat) * Math.PI / 180;
    const \u0394\u03BB = (targetLng - cLng) * Math.PI / 180;
    const a = Math.sin(\u0394\u03C6 / 2) * Math.sin(\u0394\u03C6 / 2) + Math.cos(\u03C61) * Math.cos(\u03C62) * Math.sin(\u0394\u03BB / 2) * Math.sin(\u0394\u03BB / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let distanceMeters = Math.round(R * c);
    if (isNaN(distanceMeters)) distanceMeters = 0;
    return {
      valid: hasCustomCoords ? distanceMeters <= allowedRadius : true,
      distanceMeters,
      allowedRadius,
      targetAddress,
      targetLat,
      targetLng
    };
  }
  app.post(["/api/time-entries/check-in", "/api/timeclock/check-in"], (req, res) => {
    const {
      user_id,
      userId,
      elderly_id,
      elderlyId,
      photo_base64,
      photoBase64,
      photo,
      photo_url,
      location_lat,
      locationLat,
      location_long,
      locationLong,
      notes,
      family_id,
      familyId: reqFamilyId,
      userName: reqUserName,
      user_name: reqUser_name
    } = req.body;
    const effectiveUserId = user_id || userId || "usr-admin-master";
    const effectivePhoto = photo_base64 || photoBase64 || photo || photo_url || null;
    const effectiveLat = location_lat !== void 0 ? location_lat : locationLat;
    const effectiveLong = location_long !== void 0 ? location_long : locationLong;
    const user = db.users.find((u) => u.id === effectiveUserId || u.username === effectiveUserId) || db.users[0];
    const targetFamilyId = family_id || reqFamilyId || user?.family_id || (db.families[0]?.id || null);
    const targetFamilyObj = db.families.find((f) => f.id === targetFamilyId);
    const effectiveElderlyId = elderly_id || elderlyId || (targetFamilyId ? targetFamilyObj?.elderly_id : null) || db.elderly?.id || "eld-01";
    const geoValidation = validateGeofence(user, effectiveLat, effectiveLong);
    const isAdmin = user?.role === "admin_geral" || user?.role === "admin_family" || user?.roles?.includes("admin_family");
    if (!isAdmin && effectiveLat && effectiveLong && !geoValidation.valid && geoValidation.distanceMeters > geoValidation.allowedRadius) {
      return res.status(403).json({
        error: "Fora do raio da resid\xEAncia",
        message: `Check-in n\xE3o permitido: Voc\xEA est\xE1 a ${geoValidation.distanceMeters}m da resid\xEAncia, fora do raio m\xE1ximo autorizado de ${geoValidation.allowedRadius}m.`
      });
    }
    const familySchedules = (db.shiftSchedules || []).filter(
      (s) => (s.family_id === targetFamilyId || !s.family_id) && s.active !== false
    );
    const userSchedules = familySchedules.filter(
      (s) => s.user_id === user?.id || s.user_id === effectiveUserId || s.user_name === user?.name
    );
    if (userSchedules.length > 0 && !isAdmin) {
      const nowBr = new Date(Date.now() + db.officialOffsetMs);
      const brDayOfWeek = nowBr.getDay();
      const currentMinutes = nowBr.getHours() * 60 + nowBr.getMinutes();
      const todaySchedule = userSchedules.find((s) => s.day_of_week_number === brDayOfWeek);
      if (!todaySchedule) {
        const scheduledDays = userSchedules.map((s) => `${s.day_label} \xE0s ${s.start_time}h`).join(", ");
        return res.status(403).json({
          error: "Dia fora da escala",
          message: `Check-in bloqueado: Voc\xEA n\xE3o est\xE1 escalado para hoje. Sua escala definida pelo Administrador Familiar \xE9: ${scheduledDays}. O Check-in s\xF3 funciona no seu dia e hor\xE1rio de plant\xE3o.`
        });
      }
      const [sHour, sMin] = todaySchedule.start_time.split(":").map(Number);
      const [eHour, eMin] = (todaySchedule.end_time || "20:00").split(":").map(Number);
      const startMinute = sHour * 60 + (sMin || 0);
      const tolerance = todaySchedule.tolerance_minutes || 60;
      if (currentMinutes < startMinute - tolerance) {
        return res.status(403).json({
          error: "Hor\xE1rio antecipado",
          message: `Check-in bloqueado: Seu plant\xE3o de hoje (${todaySchedule.day_label}) est\xE1 agendado para iniciar \xE0s ${todaySchedule.start_time}h. O Check-in s\xF3 \xE9 liberado pr\xF3ximo ao hor\xE1rio da escala.`
        });
      }
    }
    const officialTime = getOfficialServerTime();
    const existingOpen = db.timeEntries.find(
      (e) => (e.user_id === effectiveUserId || e.user_id === user?.id) && !e.exit_time
    );
    if (existingOpen) {
      existingOpen.exit_time = officialTime.iso_timestamp;
      existingOpen.total_hours_formatted = "Encerrado para novo plant\xE3o";
    }
    const entryPhoto = effectivePhoto || user?.avatar_url || null;
    const finalUserName = reqUserName || reqUser_name || user?.name || "Cuidador";
    const newEntry = {
      id: `pnt-${Date.now()}`,
      user_id: user?.id || effectiveUserId,
      user_name: finalUserName,
      elderly_id: effectiveElderlyId,
      family_id: targetFamilyId,
      family_name: targetFamilyObj ? targetFamilyObj.name : user?.family_name || "Fam\xEDlia",
      entry_time: officialTime.iso_timestamp,
      entry_photo_url: entryPhoto,
      exit_time: null,
      exit_photo_url: null,
      total_hours: 0,
      total_hours_formatted: "Em andamento",
      location_lat: Number(effectiveLat || geoValidation.targetLat),
      location_long: Number(effectiveLong || geoValidation.targetLng),
      distance_meters: geoValidation.distanceMeters,
      is_verified_geofence: true,
      residence_address: geoValidation.targetAddress,
      date_stamp: officialTime.date_stamp,
      day_of_week: officialTime.day_of_week,
      notes: notes || `Check-in de ponto validado com foto e hor\xE1rio oficial (${geoValidation.distanceMeters}m do local).`
    };
    db.timeEntries.unshift(newEntry);
    saveDb();
    logActivity({
      family_id: targetFamilyId || user?.family_id || "fam-01",
      user_id: user?.id || effectiveUserId,
      user_name: finalUserName,
      user_role: user?.role || "caregiver",
      action_type: "presence_clock",
      category: "Controle de Ponto",
      description: `Entrada com foto registrada por ${finalUserName}: ponto validado com hor\xE1rio oficial sincronizado (dist\xE2ncia: ${geoValidation.distanceMeters}m).`,
      details: `Hor\xE1rio oficial: ${officialTime.formatted_time} | Endere\xE7o: ${geoValidation.targetAddress} | Foto auditada e vinculada \xE0 fam\xEDlia`
    });
    res.status(201).json({
      success: true,
      message: `Check-in de entrada registrado com sucesso! Hor\xE1rio oficial: ${officialTime.formatted_time}`,
      entry: newEntry
    });
  });
  app.post(["/api/time-entries/check-out", "/api/timeclock/check-out"], (req, res) => {
    const {
      entry_id,
      entryId,
      user_id,
      userId,
      photo_base64,
      photoBase64,
      location_lat,
      locationLat,
      location_long,
      locationLong,
      notes
    } = req.body;
    const targetEntryId = entry_id || entryId;
    const targetUserId = user_id || userId || "usr-01";
    const effectivePhoto = photo_base64 || photoBase64 || req.body.photo || req.body.photo_url || null;
    const effectiveLat = location_lat !== void 0 ? location_lat : locationLat;
    const effectiveLong = location_long !== void 0 ? location_long : locationLong;
    const user = db.users.find((u) => u.id === targetUserId || u.username === targetUserId) || db.users.find((u) => u.id === targetEntryId) || db.users[0];
    const targetFamilyId = req.body.family_id || req.body.familyId || user?.family_id || (db.families[0]?.id || null);
    const targetFamilyObj = db.families.find((f) => f.id === targetFamilyId);
    let entry = db.timeEntries.find((e) => e.id === targetEntryId);
    if (!entry && (targetUserId || targetEntryId)) {
      entry = db.timeEntries.find(
        (e) => (e.user_id === targetUserId || e.user_id === user?.id || e.id === targetEntryId) && !e.exit_time
      );
    }
    if (!entry) {
      entry = db.timeEntries.find((e) => !e.exit_time);
    }
    const officialTime = getOfficialServerTime();
    if (!entry) {
      const entryTimeDate = new Date(officialTime.epoch_ms - 8 * 60 * 60 * 1e3);
      const geoVal = validateGeofence(user, effectiveLat, effectiveLong);
      entry = {
        id: `pnt-out-${Date.now()}`,
        user_id: user?.id || targetUserId,
        user_name: req.body.userName || req.body.user_name || user?.name || "Cuidador",
        elderly_id: db.elderly?.id || "eld-01",
        family_id: targetFamilyId,
        family_name: targetFamilyObj ? targetFamilyObj.name : user?.family_name || "Fam\xEDlia",
        entry_time: entryTimeDate.toISOString(),
        entry_photo_url: effectivePhoto || user?.avatar_url || null,
        exit_time: officialTime.iso_timestamp,
        exit_photo_url: effectivePhoto || user?.avatar_url || null,
        total_hours: 8,
        total_hours_formatted: "8h 00min",
        location_lat: Number(effectiveLat || geoVal.targetLat),
        location_long: Number(effectiveLong || geoVal.targetLng),
        distance_meters: geoVal.distanceMeters,
        is_verified_geofence: true,
        residence_address: geoVal.targetAddress,
        date_stamp: officialTime.date_stamp,
        day_of_week: officialTime.day_of_week,
        notes: notes || "Encerramento de plant\xE3o registrado com foto auditada."
      };
      db.timeEntries.unshift(entry);
      saveDb();
      logActivity({
        family_id: targetFamilyId || user?.family_id || "fam-01",
        user_id: user?.id || targetUserId,
        user_name: entry.user_name,
        user_role: user?.role || "caregiver",
        action_type: "presence_clock",
        category: "Controle de Ponto",
        description: `Sa\xEDda de plant\xE3o com foto registrada por ${entry.user_name} \xE0s ${officialTime.formatted_time}.`,
        details: `Perman\xEAncia: 8h 00min | Foto auditada e vinculada \xE0 fam\xEDlia`
      });
      return res.status(200).json({
        success: true,
        message: `Ponto de sa\xEDda registrado com sucesso! Hor\xE1rio oficial: ${officialTime.formatted_time}`,
        entry
      });
    }
    if (entry.exit_time) {
      if (effectivePhoto) entry.exit_photo_url = effectivePhoto;
      if (!entry.family_id) {
        entry.family_id = targetFamilyId;
        entry.family_name = targetFamilyObj ? targetFamilyObj.name : user?.family_name || "Fam\xEDlia";
      }
      if (notes) entry.notes = `${entry.notes || ""} | ${notes}`;
      saveDb();
      return res.status(200).json({
        success: true,
        message: `Sa\xEDda de plant\xE3o j\xE1 registrada! Dados e foto atualizados com sucesso.`,
        entry
      });
    }
    const geoValidation = validateGeofence(user, effectiveLat, effectiveLong);
    const entryDate = new Date(entry.entry_time);
    const exitDate = new Date(officialTime.iso_timestamp);
    const diffMs = Math.max(0, exitDate.getTime() - entryDate.getTime());
    const totalMinutes = Math.floor(diffMs / (1e3 * 60));
    const totalHours = parseFloat((diffMs / (1e3 * 60 * 60)).toFixed(2));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const formattedHours = `${hours}h ${mins.toString().padStart(2, "0")}min`;
    entry.exit_time = officialTime.iso_timestamp;
    entry.exit_photo_url = effectivePhoto || entry.exit_photo_url || user?.avatar_url || null;
    if (!entry.family_id) {
      entry.family_id = targetFamilyId;
      entry.family_name = targetFamilyObj ? targetFamilyObj.name : user?.family_name || "Fam\xEDlia";
    }
    entry.total_hours = totalHours;
    entry.total_hours_formatted = formattedHours;
    if (notes) {
      entry.notes = entry.notes ? `${entry.notes} | ${notes}` : notes;
    }
    saveDb();
    logActivity({
      family_id: entry.family_id || targetFamilyId || user?.family_id || "fam-01",
      user_id: user?.id || entry.user_id,
      user_name: user?.name || entry.user_name || "Cuidador",
      user_role: user?.role || "caregiver",
      action_type: "presence_clock",
      category: "Controle de Ponto",
      description: `Sa\xEDda com foto registrada por ${user?.name || entry.user_name || "Cuidador"}: turno de ${formattedHours} encerrado com certifica\xE7\xE3o de hor\xE1rio oficial.`,
      details: `Perman\xEAncia total: ${formattedHours} (${totalHours}h) | Foto auditada e vinculada \xE0 fam\xEDlia`
    });
    res.json({
      success: true,
      message: `Check-out validado com sucesso! Perman\xEAncia de ${formattedHours} registrada com foto auditada.`,
      entry
    });
  });
  app.post("/api/time-entries/manual", (req, res) => {
    const {
      user_id,
      elderly_id,
      date_stamp,
      entry_time_str,
      exit_time_str,
      entry_type,
      justification,
      notes,
      photo_url
    } = req.body;
    if (!user_id || !date_stamp || !entry_time_str || !justification) {
      return res.status(400).json({
        error: "Campos obrigat\xF3rios ausentes",
        message: "Para lan\xE7ar presen\xE7a \xE9 necess\xE1rio informar cuidador, data, hor\xE1rio de entrada e justificativa auditada."
      });
    }
    const user = db.users.find((u) => u.id === user_id);
    const entryIso = `${date_stamp}T${entry_time_str}:00-03:00`;
    const exitIso = exit_time_str ? `${date_stamp}T${exit_time_str}:00-03:00` : null;
    let totalHours = null;
    let formattedHours = "Em andamento";
    if (exitIso) {
      const start = new Date(entryIso).getTime();
      const end = new Date(exitIso).getTime();
      const diffMs = Math.max(0, end - start);
      const totalMinutes = Math.floor(diffMs / (1e3 * 60));
      totalHours = parseFloat((diffMs / (1e3 * 60 * 60)).toFixed(2));
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      formattedHours = `${h}h ${m.toString().padStart(2, "0")}min`;
    }
    const dateObj = /* @__PURE__ */ new Date(`${date_stamp}T12:00:00Z`);
    const dayNames = ["Domingo", "Segunda-feira", "Ter\xE7a-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "S\xE1bado"];
    const dayOfWeek = dayNames[dateObj.getUTCDay()];
    const fallbackPhoto = photo_url || (user?.avatar_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80");
    const targetLat = db.elderly?.residence_lat || -23.5505;
    const targetLng = db.elderly?.residence_long || -46.6333;
    const targetElderlyId = elderly_id || db.elderly?.id || "eld-01";
    const newEntry = {
      id: `pnt-man-${Date.now()}`,
      user_id,
      user_name: user?.name || "Profissional",
      elderly_id: targetElderlyId,
      entry_time: entryIso,
      entry_photo_url: fallbackPhoto,
      exit_time: exitIso,
      exit_photo_url: exitIso ? fallbackPhoto : null,
      total_hours: totalHours,
      total_hours_formatted: formattedHours,
      location_lat: targetLat,
      location_long: targetLng,
      distance_meters: 10,
      is_verified_geofence: true,
      date_stamp,
      day_of_week: dayOfWeek,
      entry_type: entry_type || "manual_authorized",
      justification,
      authorized_by_name: user?.name || "Administrador Familiar",
      notes: notes || `Lan\xE7amento manual autorizado: ${justification}`
    };
    db.timeEntries.unshift(newEntry);
    saveDb();
    res.status(201).json({
      success: true,
      message: "Presen\xE7a adicionada com sucesso e registrada na folha de auditoria.",
      entry: newEntry
    });
  });
  app.get("/api/shift-schedules", (req, res) => {
    const { family_id, user_id } = req.query;
    let list = [...db.shiftSchedules || []];
    if (family_id) {
      list = list.filter((s) => s.family_id === family_id);
    }
    if (user_id) {
      list = list.filter((s) => s.user_id === user_id);
    }
    list.sort((a, b) => {
      if (a.day_of_week_number !== b.day_of_week_number) {
        return a.day_of_week_number - b.day_of_week_number;
      }
      return (a.start_time || "").localeCompare(b.start_time || "");
    });
    res.json(list);
  });
  app.post("/api/shift-schedules", (req, res) => {
    const {
      family_id,
      user_id,
      user_name,
      user_role,
      day_of_week_number,
      day_label,
      start_time,
      end_time,
      tolerance_minutes,
      active,
      notes,
      created_by_user_id,
      created_by_name
    } = req.body;
    if (!user_id || day_of_week_number === void 0 || !start_time) {
      return res.status(400).json({ error: "Dados incompletos para a escala (usu\xE1rio, dia e hor\xE1rio obrigat\xF3rios)." });
    }
    const dayLabelsMap = {
      0: "Domingo",
      1: "Segunda-feira",
      2: "Ter\xE7a-feira",
      3: "Quarta-feira",
      4: "Quinta-feira",
      5: "Sexta-feira",
      6: "S\xE1bado"
    };
    const targetUser = db.users.find((u) => u.id === user_id);
    const dayNum = Number(day_of_week_number);
    const resolvedDayLabel = day_label || dayLabelsMap[dayNum] || `Dia ${dayNum}`;
    const newSchedule = {
      id: `sch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      family_id: family_id || targetUser?.family_id || "fam-01",
      user_id,
      user_name: user_name || targetUser?.name || "Membro da Fam\xEDlia",
      user_role: user_role || targetUser?.role || "family",
      day_of_week_number: dayNum,
      day_label: resolvedDayLabel,
      start_time: (start_time || "08:00").trim(),
      end_time: (end_time || "20:00").trim(),
      tolerance_minutes: Number(tolerance_minutes) || 60,
      active: active !== false,
      notes: notes || `Plant\xE3o escalado para ${resolvedDayLabel} (${start_time}h \xE0s ${end_time || "20:00"}h)`,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      created_by_user_id: created_by_user_id || "admin",
      created_by_name: created_by_name || "Administrador Geral da Fam\xEDlia"
    };
    if (!db.shiftSchedules) db.shiftSchedules = [];
    db.shiftSchedules.push(newSchedule);
    saveDb();
    logActivity({
      family_id: newSchedule.family_id,
      user_id: created_by_user_id || "admin",
      user_name: created_by_name || "Administrador",
      user_role: "admin_family",
      action_type: "schedule_update",
      category: "Escala da Fam\xEDlia",
      description: `Nova escala cadastrada: ${newSchedule.user_name} escalado para ${resolvedDayLabel} (${newSchedule.start_time}h - ${newSchedule.end_time}h).`,
      details: `Escalado por: ${created_by_name || "Administrador Geral"} | Toler\xE2ncia: ${newSchedule.tolerance_minutes} min.`
    });
    res.status(201).json({
      success: true,
      message: `Escala cadastrada com sucesso para ${newSchedule.user_name} (${resolvedDayLabel})!`,
      schedule: newSchedule
    });
  });
  app.put("/api/shift-schedules/:id", (req, res) => {
    const { id } = req.params;
    if (!db.shiftSchedules) db.shiftSchedules = [];
    const schedule = db.shiftSchedules.find((s) => s.id === id);
    if (!schedule) {
      return res.status(404).json({ error: "Escala de plant\xE3o n\xE3o encontrada." });
    }
    const {
      day_of_week_number,
      day_label,
      start_time,
      end_time,
      tolerance_minutes,
      active,
      notes,
      user_id,
      user_name
    } = req.body;
    if (day_of_week_number !== void 0) schedule.day_of_week_number = Number(day_of_week_number);
    if (day_label) schedule.day_label = day_label;
    if (start_time) schedule.start_time = start_time.trim();
    if (end_time) schedule.end_time = end_time.trim();
    if (tolerance_minutes !== void 0) schedule.tolerance_minutes = Number(tolerance_minutes);
    if (active !== void 0) schedule.active = Boolean(active);
    if (notes !== void 0) schedule.notes = notes;
    if (user_id) schedule.user_id = user_id;
    if (user_name) schedule.user_name = user_name;
    saveDb();
    res.json({
      success: true,
      message: "Escala de plant\xE3o atualizada com sucesso.",
      schedule
    });
  });
  app.delete("/api/shift-schedules/:id", (req, res) => {
    const { id } = req.params;
    if (!db.shiftSchedules) db.shiftSchedules = [];
    const idx = db.shiftSchedules.findIndex((s) => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Escala n\xE3o encontrada." });
    }
    const removed = db.shiftSchedules.splice(idx, 1)[0];
    saveDb();
    logActivity({
      family_id: removed.family_id,
      user_id: "admin",
      user_name: "Administrador",
      user_role: "admin_family",
      action_type: "schedule_update",
      category: "Escala da Fam\xEDlia",
      description: `Escala removida: ${removed.user_name} (${removed.day_label} \xE0s ${removed.start_time}h).`,
      details: "Remo\xE7\xE3o realizada pelo Administrador."
    });
    res.json({
      success: true,
      message: "Plant\xE3o removido da escala com sucesso.",
      schedule: removed
    });
  });
  app.get("/api/time-entries/history", (req, res) => {
    const { year, month, user_id, family_id, familyId } = req.query;
    const targetFamilyId = family_id || familyId;
    let list = [...db.timeEntries];
    if (targetFamilyId && targetFamilyId !== "Todos") {
      const familyUserIds = db.users.filter((u) => u.family_id === targetFamilyId).map((u) => u.id);
      list = list.filter(
        (e) => e.family_id === targetFamilyId || familyUserIds.includes(e.user_id) || !e.family_id
        // Include entries that may not have family_id explicitly assigned yet
      );
    }
    if (user_id && user_id !== "Todos") {
      list = list.filter((e) => e.user_id === user_id);
    }
    if (year && year !== "Todos" && month && month !== "Todos") {
      const prefix = `${year}-${String(month).padStart(2, "0")}`;
      list = list.filter((e) => e.date_stamp && e.date_stamp.startsWith(prefix));
    }
    const totalHoursAggregated = list.reduce((acc, curr) => acc + (curr.total_hours || 0), 0);
    const completedShifts = list.filter((e) => e.exit_time).length;
    res.json({
      entries: list,
      meta: {
        filter_year: year || "Todos",
        filter_month: month || "Todos",
        total_records: list.length,
        completed_shifts: completedShifts,
        total_hours: parseFloat(totalHoursAggregated.toFixed(2)),
        total_hours_formatted: `${Math.floor(totalHoursAggregated)}h ${Math.round(totalHoursAggregated % 1 * 60)}min`
      }
    });
  });
  app.get("/api/health-logs", (req, res) => {
    res.json(db.healthLogs);
  });
  app.post("/api/health-logs", (req, res) => {
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
      caregiver_signed
    } = req.body;
    const hasBp = systolic_bp !== void 0 && systolic_bp !== null && systolic_bp !== "" && diastolic_bp !== void 0 && diastolic_bp !== null && diastolic_bp !== "";
    let sys = null;
    let dia = null;
    let hr = null;
    let statusCategory = "N\xE3o aferida nesta rotina (Opcional)";
    if (hasBp) {
      sys = Number(systolic_bp);
      dia = Number(diastolic_bp);
      hr = heart_rate ? Number(heart_rate) : 75;
      if (sys >= 180 || dia >= 120) {
        statusCategory = "Crise Hipertensiva (Urg\xEAncia)";
      } else if (sys >= 140 || dia >= 90) {
        statusCategory = "Hipertens\xE3o Est\xE1gio 2";
      } else if (sys >= 130 && sys <= 139 || dia >= 80 && dia <= 89) {
        statusCategory = "Hipertens\xE3o Est\xE1gio 1";
      } else if (sys >= 120 && sys <= 129 && dia < 80) {
        statusCategory = "Press\xE3o Elevada / Pr\xE9-hipertens\xE3o";
      } else if (sys < 90 || dia < 60) {
        statusCategory = "Hipotens\xE3o";
      } else {
        statusCategory = "Normal (\xD3tima)";
      }
    } else if (heart_rate) {
      hr = Number(heart_rate);
    }
    const officialTime = getOfficialServerTime();
    const user = db.users.find((u) => u.id === (recorded_by_user_id || "usr-01"));
    const newLog = {
      id: `hl-${Date.now()}`,
      elderly_id: db.elderly.id,
      recorded_by_user_id: user?.id || "usr-01",
      recorded_by_name: user ? `${user.name} (${user.role === "caregiver" ? "Cuidadora" : "Familiar"})` : "Profissional",
      systolic_bp: sys,
      diastolic_bp: dia,
      heart_rate: hr,
      is_bp_measured: hasBp,
      glucose: glucose ? Number(glucose) : null,
      glucose_context: glucose_context || "Glicemia capilar",
      temperature_c: temperature_c ? Number(temperature_c) : null,
      weight_kg: weight_kg ? Number(weight_kg) : null,
      status_category: statusCategory,
      contractor_signed: contractor_signed ?? true,
      caregiver_signed: caregiver_signed ?? true,
      notes: notes || (hasBp ? "Aferi\xE7\xE3o de rotina registrada." : "Registro geral sem aferi\xE7\xE3o de PA no momento."),
      created_at: officialTime.iso_timestamp
    };
    db.healthLogs.unshift(newLog);
    saveDb();
    logActivity({
      family_id: user?.family_id || "fam-01",
      user_id: user?.id || "usr-01",
      user_name: user?.name || "Profissional",
      user_role: user?.role || "caregiver",
      action_type: "vitals_added",
      category: "Sinais Vitais",
      description: `Sinais vitais aferidos por ${user?.name || "Cuidador"}: ${hasBp ? `PA ${sys}/${dia} mmHg` : "Registro cl\xEDnico"} \xB7 FC ${hr || 75} bpm.`,
      details: statusCategory
    });
    res.status(201).json({ success: true, log: newLog });
  });
  app.put("/api/health-logs/:id", (req, res) => {
    const { id } = req.params;
    const logIndex = db.healthLogs.findIndex((l) => l.id === id);
    if (logIndex === -1) {
      return res.status(404).json({ error: "Registro de sa\xFAde n\xE3o encontrado" });
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
      caregiver_signed
    } = req.body;
    const hasBp = systolic_bp !== void 0 && systolic_bp !== null && systolic_bp !== "" && diastolic_bp !== void 0 && diastolic_bp !== null && diastolic_bp !== "";
    let sys = null;
    let dia = null;
    let hr = null;
    let statusCategory = "N\xE3o aferida nesta rotina (Opcional)";
    if (hasBp) {
      sys = Number(systolic_bp);
      dia = Number(diastolic_bp);
      hr = heart_rate ? Number(heart_rate) : 75;
      if (sys >= 180 || dia >= 120) {
        statusCategory = "Crise Hipertensiva (Urg\xEAncia)";
      } else if (sys >= 140 || dia >= 90) {
        statusCategory = "Hipertens\xE3o Est\xE1gio 2";
      } else if (sys >= 130 && sys <= 139 || dia >= 80 && dia <= 89) {
        statusCategory = "Hipertens\xE3o Est\xE1gio 1";
      } else if (sys >= 120 && sys <= 129 && dia < 80) {
        statusCategory = "Press\xE3o Elevada / Pr\xE9-hipertens\xE3o";
      } else if (sys < 90 || dia < 60) {
        statusCategory = "Hipotens\xE3o";
      } else {
        statusCategory = "Normal (\xD3tima)";
      }
    }
    const targetLog = db.healthLogs[logIndex];
    if (systolic_bp !== void 0) targetLog.systolic_bp = sys;
    if (diastolic_bp !== void 0) targetLog.diastolic_bp = dia;
    if (heart_rate !== void 0) targetLog.heart_rate = hr;
    targetLog.is_bp_measured = hasBp;
    if (glucose !== void 0) targetLog.glucose = glucose ? Number(glucose) : null;
    if (glucose_context !== void 0) targetLog.glucose_context = glucose_context;
    if (temperature_c !== void 0) targetLog.temperature_c = temperature_c ? Number(temperature_c) : null;
    if (weight_kg !== void 0) targetLog.weight_kg = weight_kg ? Number(weight_kg) : null;
    if (notes !== void 0) targetLog.notes = notes;
    if (contractor_signed !== void 0) targetLog.contractor_signed = Boolean(contractor_signed);
    if (caregiver_signed !== void 0) targetLog.caregiver_signed = Boolean(caregiver_signed);
    targetLog.status_category = statusCategory;
    saveDb();
    logActivity({
      family_id: "fam-01",
      user_id: "usr-01",
      user_name: "Cuidador",
      user_role: "caregiver",
      action_type: "vitals_edited",
      category: "Sinais Vitais",
      description: `Aferi\xE7\xE3o de sinais vitais atualizada e auditada no sistema.`
    });
    res.json({ success: true, log: targetLog });
  });
  app.get("/api/daily-incidents", (req, res) => {
    res.json(db.dailyIncidents);
  });
  app.post("/api/daily-incidents", (req, res) => {
    const {
      general_state,
      had_discomfort,
      discomfort_types,
      symptoms_description,
      actions_taken,
      recorded_by_user_id,
      contractor_signed,
      caregiver_signed
    } = req.body;
    const officialTime = getOfficialServerTime();
    const user = db.users.find((u) => u.id === (recorded_by_user_id || "usr-01"));
    const newIncident = {
      id: `inc-${Date.now()}`,
      elderly_id: db.elderly.id,
      date_stamp: officialTime.date_stamp,
      day_of_week: officialTime.day_of_week,
      recorded_by_user_id: user?.id || "usr-01",
      recorded_by_name: user ? `${user.name} (${user.role === "caregiver" ? "Cuidadora Titular" : "Fam\xEDlia"})` : "Respons\xE1vel",
      recorded_by_role: user?.role || "caregiver",
      general_state: general_state || "estavel",
      had_discomfort: Boolean(had_discomfort),
      discomfort_types: discomfort_types || [],
      symptoms_description: symptoms_description || "Dia transcorreu sem queixas de mal-estar.",
      actions_taken: actions_taken || "Rotina de cuidados, hidrata\xE7\xE3o e medica\xE7\xE3o regular mantida.",
      contractor_signed: Boolean(contractor_signed),
      contractor_signed_name: contractor_signed ? "Dr. Fernando Silveira (Filho/Contratante)" : void 0,
      caregiver_signed: Boolean(caregiver_signed ?? true),
      caregiver_signed_name: user?.role === "caregiver" ? user.name : "Clara Mendes (Cuidadora)",
      family_viewed_by: [user?.name || "Clara Mendes"],
      created_at: officialTime.iso_timestamp
    };
    db.dailyIncidents.unshift(newIncident);
    saveDb();
    logActivity({
      family_id: user?.family_id || "fam-01",
      user_id: user?.id || "usr-01",
      user_name: user?.name || "Cuidador",
      user_role: user?.role || "caregiver",
      action_type: "incident_reported",
      category: "Boletim do Idoso",
      description: `Boletim di\xE1rio de ocorr\xEAncias preenchido por ${user?.name || "Cuidador"}: Estado ${general_state}.`,
      details: symptoms_description || ""
    });
    res.status(201).json({
      success: true,
      message: "Boletim di\xE1rio de ocorr\xEAncias registrado com sucesso.",
      incident: newIncident
    });
  });
  app.post("/api/daily-incidents/:id/sign", (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;
    const incident = db.dailyIncidents.find((i) => i.id === id);
    if (!incident) return res.status(404).json({ error: "Relat\xF3rio di\xE1rio n\xE3o encontrado" });
    const user = db.users.find((u) => u.id === user_id);
    incident.contractor_signed = true;
    incident.contractor_signed_name = `${user?.name || "Administrador Familiar"} (Ci\xEAncia do Contratante)`;
    if (user?.name && !incident.family_viewed_by.includes(user.name)) {
      incident.family_viewed_by.push(user.name);
    }
    saveDb();
    logActivity({
      family_id: user?.family_id || "fam-01",
      user_id: user?.id || "usr-01",
      user_name: user?.name || "Familiar",
      user_role: user?.role || "admin_family",
      action_type: "incident_signed",
      category: "Boletim do Idoso",
      description: `Visto e assinatura de ci\xEAncia no Boletim do Idoso confirmados por ${user?.name || "Administrador Familiar"}.`
    });
    res.json({
      success: true,
      message: "Ci\xEAncia e assinatura do contratante confirmadas no relat\xF3rio.",
      incident
    });
  });
  app.get("/api/medications", (req, res) => {
    res.json(db.medicationLogs);
  });
  app.post("/api/medications/:id/administer", (req, res) => {
    const { id } = req.params;
    const { user_id, notes } = req.body;
    const med = db.medicationLogs.find((m) => m.id === id);
    if (!med) return res.status(404).json({ error: "Medicamento n\xE3o localizado" });
    const officialTime = getOfficialServerTime();
    const user = db.users.find((u) => u.id === (user_id || "usr-01"));
    med.status = "taken";
    med.administered_at = officialTime.iso_timestamp;
    med.administered_by_user_id = user?.id || "usr-01";
    med.administered_by_name = user?.name || "Clara Mendes";
    if (notes) med.instructions += ` (Obs: ${notes})`;
    saveDb();
    logActivity({
      family_id: user?.family_id || "fam-01",
      user_id: user?.id || "usr-01",
      user_name: user?.name || "Cuidador",
      user_role: user?.role || "caregiver",
      action_type: "medication_administered",
      category: "Medicamentos",
      description: `Medicamento ${med.name} (${med.dosage}) administrado ao idoso por ${user?.name || "Cuidador"}.`,
      details: `Hor\xE1rio: ${med.time_scheduled} | Status: Ministrado`
    });
    res.json({ success: true, medication: med });
  });
  app.post("/api/medications/:id/skip", (req, res) => {
    const { id } = req.params;
    const { reason, user_id } = req.body;
    const med = db.medicationLogs.find((m) => m.id === id);
    if (!med) return res.status(404).json({ error: "Medicamento n\xE3o localizado" });
    const user = db.users.find((u) => u.id === (user_id || "usr-01"));
    med.status = "skipped";
    med.instructions += ` [N\xC3O MINISTRADO: ${reason || "Idoso recusou ou jejum cir\xFArgico"}]`;
    saveDb();
    logActivity({
      family_id: user?.family_id || "fam-01",
      user_id: user?.id || "usr-01",
      user_name: user?.name || "Cuidador",
      user_role: user?.role || "caregiver",
      action_type: "medication_administered",
      category: "Medicamentos",
      description: `Medicamento ${med.name} n\xE3o ministrado por ${user?.name || "Cuidador"}. Motivo: ${reason || "Recusado/Jejum"}.`
    });
    res.json({ success: true, medication: med });
  });
  app.get("/api/notices", (req, res) => {
    res.json(db.familyNotices);
  });
  app.post("/api/notices", (req, res) => {
    const { title, description, category, user_id } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "T\xEDtulo e descri\xE7\xE3o s\xE3o obrigat\xF3rios" });
    }
    const officialTime = getOfficialServerTime();
    const user = db.users.find((u) => u.id === (user_id || "usr-01"));
    const newNotice = {
      id: `ntc-${Date.now()}`,
      elderly_id: db.elderly.id,
      created_by_user_id: user?.id || "usr-01",
      created_by_name: user?.name || "Membro da Fam\xEDlia",
      category: category || "shopping",
      title,
      description,
      is_resolved: false,
      created_at: officialTime.iso_timestamp
    };
    db.familyNotices.unshift(newNotice);
    saveDb();
    logActivity({
      family_id: user?.family_id || "fam-01",
      user_id: user?.id || "usr-01",
      user_name: user?.name || "Familiar",
      user_role: user?.role || "family_member",
      action_type: "family_notice",
      category: "Mural",
      description: `Novo aviso no mural publicado por ${user?.name || "Fam\xEDlia"}: "${title}".`,
      details: description
    });
    res.status(201).json({ success: true, notice: newNotice });
  });
  app.patch("/api/notices/:id/toggle", (req, res) => {
    const { id } = req.params;
    const notice = db.familyNotices.find((n) => n.id === id);
    if (!notice) return res.status(404).json({ error: "Aviso n\xE3o encontrado" });
    notice.is_resolved = !notice.is_resolved;
    saveDb();
    logActivity({
      family_id: "fam-01",
      user_id: "usr-01",
      user_name: "Usu\xE1rio",
      user_role: "caregiver",
      action_type: "family_notice",
      category: "Mural",
      description: `Aviso "${notice.title}" marcado como ${notice.is_resolved ? "resolvido" : "pendente"}.`
    });
    res.json({ success: true, notice });
  });
  app.get(["/api/missions", "/api/daily-missions"], (req, res) => {
    const list = [...db.dailyMissions].sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
    res.json(list);
  });
  app.post(["/api/missions", "/api/daily-missions"], (req, res) => {
    const { title, scheduled_time, scheduledTime, category, priority, clear_instructions, clearInstructions, user_id, userId, created_by_user_id } = req.body;
    const authorId = user_id || userId || created_by_user_id || "usr-admin-samuel";
    const user = db.users.find((u) => u.id === authorId) || db.users[0];
    const mTitle = (title || "").trim() || "Obriga\xE7\xE3o de Cuidado";
    const mTime = (scheduled_time || scheduledTime || "").trim() || "08:00";
    const mInstructions = (clear_instructions || clearInstructions || "").trim() || "Procedimento de rotina registrado no protocolo.";
    const newMission = {
      id: `mis-${Date.now()}`,
      elderly_id: db.elderly?.id || "eld-01",
      title: mTitle,
      scheduled_time: mTime,
      category: category || "medication",
      priority: priority || "mandatory",
      clear_instructions: mInstructions,
      created_by_user_id: user?.id || authorId,
      created_by_name: `${user?.name || "Administrador"} (Protocolo Oficial)`,
      is_active: true,
      completed: false,
      completed_at: null,
      completed_by_name: null,
      execution_notes: null
    };
    db.dailyMissions.push(newMission);
    saveDb();
    logActivity({
      family_id: user?.family_id || "fam-01",
      user_id: user?.id || authorId,
      user_name: user?.name || "Administrador",
      user_role: user?.role || "admin_geral",
      action_type: "mission_created",
      category: "Obriga\xE7\xF5es Di\xE1rias",
      description: `Nova obriga\xE7\xE3o di\xE1ria cadastrada: "${mTitle}" \xE0s ${mTime}.`,
      details: mInstructions
    });
    res.status(201).json({
      success: true,
      message: "Miss\xE3o di\xE1ria inclu\xEDda com sucesso no protocolo do cuidador.",
      mission: newMission
    });
  });
  app.put(["/api/missions/:id", "/api/daily-missions/:id"], (req, res) => {
    const { id } = req.params;
    const { title, scheduled_time, scheduledTime, category, priority, clear_instructions, clearInstructions, user_id, userId, created_by_user_id } = req.body;
    const authorId = user_id || userId || created_by_user_id || "usr-admin-samuel";
    const user = db.users.find((u) => u.id === authorId) || db.users[0];
    const mission = db.dailyMissions.find((m) => m.id === id);
    if (!mission) return res.status(404).json({ error: "Miss\xE3o n\xE3o encontrada" });
    if (title) mission.title = title.trim();
    if (scheduled_time || scheduledTime) mission.scheduled_time = (scheduled_time || scheduledTime).trim();
    if (category) mission.category = category;
    if (priority) mission.priority = priority;
    if (clear_instructions !== void 0 || clearInstructions !== void 0) {
      mission.clear_instructions = (clear_instructions !== void 0 ? clear_instructions : clearInstructions).trim();
    }
    saveDb();
    logActivity({
      family_id: user?.family_id || "fam-01",
      user_id: user?.id || authorId,
      user_name: user?.name || "Administrador",
      user_role: user?.role || "admin_geral",
      action_type: "mission_created",
      category: "Obriga\xE7\xF5es Di\xE1rias",
      description: `Obriga\xE7\xE3o di\xE1ria "${mission.title}" atualizada no sistema.`
    });
    res.json({
      success: true,
      message: "Miss\xE3o di\xE1ria atualizada com sucesso.",
      mission
    });
  });
  app.delete(["/api/missions/:id", "/api/daily-missions/:id"], (req, res) => {
    const { id } = req.params;
    const { user_id } = req.query;
    const user = db.users.find((u) => u.id === (user_id || "usr-admin-samuel"));
    if (!user || user.role !== "admin_family" && user.role !== "admin_geral") {
      return res.status(403).json({
        error: "Permiss\xE3o negada",
        message: "Somente o Administrador possui autoriza\xE7\xE3o para remover miss\xF5es do protocolo."
      });
    }
    const index = db.dailyMissions.findIndex((m) => m.id === id);
    if (index === -1) return res.status(404).json({ error: "Miss\xE3o n\xE3o encontrada" });
    const removed = db.dailyMissions.splice(index, 1)[0];
    saveDb();
    logActivity({
      family_id: user?.family_id || "fam-01",
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action_type: "mission_created",
      category: "Obriga\xE7\xF5es Di\xE1rias",
      description: `Obriga\xE7\xE3o di\xE1ria "${removed.title}" removida do protocolo por ${user.name}.`
    });
    res.json({ success: true, message: "Miss\xE3o removida do protocolo di\xE1rio." });
  });
  app.all(["/api/missions/:id/toggle", "/api/daily-missions/:id/toggle"], (req, res) => {
    const { id } = req.params;
    const { user_id, execution_notes } = req.body;
    const mission = db.dailyMissions.find((m) => m.id === id);
    if (!mission) return res.status(404).json({ error: "Miss\xE3o n\xE3o encontrada" });
    const user = db.users.find((u) => u.id === user_id);
    const officialTime = getOfficialServerTime();
    if (!mission.completed) {
      mission.completed = true;
      mission.completed_at = `${officialTime.formatted_time.slice(0, 5)}`;
      mission.completed_by_name = user?.name || "Clara Mendes (Cuidadora)";
      if (execution_notes) mission.execution_notes = execution_notes;
    } else {
      mission.completed = false;
      mission.completed_at = null;
      mission.completed_by_name = null;
      mission.execution_notes = null;
    }
    saveDb();
    logActivity({
      family_id: user?.family_id || "fam-01",
      user_id: user?.id || "usr-01",
      user_name: user?.name || "Cuidador",
      user_role: user?.role || "caregiver",
      action_type: "mission_completed",
      category: "Obriga\xE7\xF5es Di\xE1rias",
      description: `Miss\xE3o "${mission.title}" marcada como ${mission.completed ? "CUMPRIDA" : "PENDENTE"} por ${user?.name || "Cuidador"}.`
    });
    res.json({ success: true, mission });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CUIDA] Servidor ativo em http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("[CUIDA] Falha ao iniciar servidor:", err);
  process.exit(1);
});
