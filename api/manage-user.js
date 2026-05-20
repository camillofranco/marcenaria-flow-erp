const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const validRoles = new Set(["adm", "medidor", "projetista", "comprador", "montador", "cliente"]);
const MAX_FIELD_LENGTH = 180;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store, max-age=0",
};

module.exports = async function handler(req, res) {
  if (!["PATCH", "DELETE"].includes(req.method)) {
    return response(res, 405, { error: "Method not allowed" });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return response(res, 500, { error: "Supabase function environment is not configured." });
  }

  const token = parseBearerToken(req.headers.authorization);
  if (!token) return response(res, 401, { error: "Missing authorization token." });

  let payload;
  try {
    payload = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch {
    return response(res, 400, { error: "Invalid JSON." });
  }

  const requester = await getRequesterProfile(token);
  if (!requester) return response(res, 403, { error: "Requester profile not found." });
  if (!requester.platform_admin && requester.role !== "adm") {
    return response(res, 403, { error: "Only administrators can manage users." });
  }

  if (req.method === "PATCH") return updateUser(res, requester, payload);
  return deleteUser(res, requester, payload);
};

async function updateUser(res, requester, payload) {
  const id = cleanText(payload.id, 80);
  const email = normalizeEmail(payload.email);
  const fullName = cleanText(payload.fullName);
  const role = payload.role;
  const phone = cleanText(payload.phone || "", 40);
  const password = String(payload.password || "");
  if (!id || !email || !fullName || !role) {
    return response(res, 400, { error: "Missing required user fields." });
  }
  if (!uuidPattern.test(id)) {
    return response(res, 400, { error: "Invalid user id." });
  }
  if (!emailPattern.test(email)) {
    return response(res, 400, { error: "Invalid email." });
  }
  if (!validRoles.has(role)) {
    return response(res, 400, { error: "Invalid user role." });
  }
  if (password && String(password).length < 6) {
    return response(res, 400, { error: "Password must have at least 6 characters." });
  }

  const target = await getProfileById(id);
  if (!target) return response(res, 404, { error: "User profile not found." });
  if (!requester.platform_admin && target.company_id !== requester.company_id) {
    return response(res, 403, { error: "User belongs to another company." });
  }
  if (target.platform_admin && !requester.platform_admin) {
    return response(res, 403, { error: "Only platform admin can edit this user." });
  }

  try {
    await updateAuthUser({ id, email, fullName, role, password });
    const profile = await updateProfile({ id, email, fullName, role, phone });
    return response(res, 200, { profile });
  } catch (error) {
    return response(res, 400, { error: error.message || "Could not update user." });
  }
}

async function deleteUser(res, requester, payload) {
  const id = cleanText(payload.id, 80);
  if (!id) return response(res, 400, { error: "Missing user id." });
  if (!uuidPattern.test(id)) return response(res, 400, { error: "Invalid user id." });
  if (id === requester.id) return response(res, 400, { error: "You cannot delete your own active user." });

  const target = await getProfileById(id);
  if (!target) return response(res, 404, { error: "User profile not found." });
  if (!requester.platform_admin && target.company_id !== requester.company_id) {
    return response(res, 403, { error: "User belongs to another company." });
  }
  if (target.platform_admin) {
    return response(res, 403, { error: "Platform admin cannot be deleted here." });
  }

  const linked = await hasProjectLink(id, target.company_id);
  if (linked) {
    return response(res, 409, { error: "User is linked to a project. Remove project links before deleting." });
  }

  try {
    const profile = await patchProfile(id, { active: false });
    await updateAuthUser({ id, fullName: target.full_name, email: target.email, role: target.role, banned: true });
    return response(res, 200, { profile });
  } catch (error) {
    return response(res, 400, { error: error.message || "Could not delete user." });
  }
}

async function getRequesterProfile(token) {
  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!userResponse.ok) return null;
  const user = await userResponse.json();
  return getProfileById(user.id);
}

async function getProfileById(id) {
  const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}&active=eq.true&select=*`, {
    headers: serviceHeaders(),
  });
  if (!profileResponse.ok) return null;
  const [profile] = await profileResponse.json();
  return profile || null;
}

function parseBearerToken(value = "") {
  const [scheme, token] = String(value).split(" ");
  return scheme === "Bearer" && token ? token : "";
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase().slice(0, MAX_FIELD_LENGTH);
}

function cleanText(value, max = MAX_FIELD_LENGTH) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, max);
}

async function updateAuthUser({ id, email, fullName, role, password, banned = false }) {
  const body = {
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  };
  if (password) body.password = password;
  if (banned) body.ban_duration = "876000h";

  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
    method: "PUT",
    headers: serviceHeaders(),
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(formatSupabaseAuthError(data));
  return data;
}

async function updateProfile({ id, email, fullName, role, phone }) {
  return patchProfile(id, {
    full_name: fullName,
    email,
    role,
    phone,
    active: true,
  });
}

async function patchProfile(id, body) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}&select=*`, {
    method: "PATCH",
    headers: {
      ...serviceHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Could not update profile.");
  return data[0];
}

async function hasProjectLink(id, companyId) {
  const or = [
    `medidor_id.eq.${id}`,
    `projetista_id.eq.${id}`,
    `comprador_id.eq.${id}`,
    `montador_id.eq.${id}`,
    `cliente_id.eq.${id}`,
  ].join(",");
  const url = `${SUPABASE_URL}/rest/v1/projects?select=id&company_id=eq.${companyId}&or=(${or})&limit=1`;
  const response = await fetch(url, { headers: serviceHeaders() });
  if (!response.ok) return true;
  const data = await response.json();
  return data.length > 0;
}

function formatSupabaseAuthError(data) {
  const message = data.message || data.error_description || data.error || "";
  const searchable = `${message} ${JSON.stringify(data)}`;
  if (/already|registered|exists|duplicate|email_exists|user_already_exists/i.test(searchable)) {
    return "Este e-mail já possui acesso cadastrado.";
  }
  if (/password/i.test(searchable)) {
    return "A senha não atende aos requisitos mínimos.";
  }
  if (/email/i.test(searchable)) {
    return "Informe um e-mail válido.";
  }
  return message || "Não foi possível atualizar o acesso no Supabase Auth.";
}

function serviceHeaders() {
  return {
    ...headers,
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  };
}

function response(res, statusCode, body) {
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
  return res.status(statusCode).json(body);
}
