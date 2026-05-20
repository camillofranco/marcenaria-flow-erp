const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const validRoles = new Set(["adm", "medidor", "projetista", "comprador", "montador", "cliente"]);

const headers = {
  "Content-Type": "application/json",
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return response(res, 405, { error: "Method not allowed" });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return response(res, 500, { error: "Supabase function environment is not configured." });
  }

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return response(res, 401, { error: "Missing authorization token." });

  let payload;
  try {
    payload = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch {
    return response(res, 400, { error: "Invalid JSON." });
  }

  const { email, password, fullName, role, phone } = payload;
  if (!email || !password || !fullName || !role) {
    return response(res, 400, { error: "Missing required user fields." });
  }
  if (!validRoles.has(role)) {
    return response(res, 400, { error: "Invalid user role." });
  }
  if (String(password).length < 6) {
    return response(res, 400, { error: "Password must have at least 6 characters." });
  }

  const requester = await getRequesterProfile(token);
  if (!requester) return response(res, 403, { error: "Requester profile not found." });
  if (!requester.platform_admin && requester.role !== "adm") {
    return response(res, 403, { error: "Only administrators can create users." });
  }

  try {
    const authUser = await createAuthUser({ email, password, fullName, role });
    const companyId = payload.companyId && requester.platform_admin ? payload.companyId : requester.company_id;
    const profile = await createProfile({
      id: authUser.id,
      companyId,
      fullName,
      email,
      role,
      phone,
      platformAdmin: false,
    });

    return response(res, 200, { user: authUser, profile });
  } catch (error) {
    return response(res, 400, { error: error.message || "Could not create user." });
  }
};

async function getRequesterProfile(token) {
  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!userResponse.ok) return null;
  const user = await userResponse.json();
  const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=*`, {
    headers: serviceHeaders(),
  });
  if (!profileResponse.ok) return null;
  const [profile] = await profileResponse.json();
  return profile;
}

async function createAuthUser({ email, password, fullName, role }) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: serviceHeaders(),
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(formatSupabaseAuthError(data));
  return data;
}

async function createProfile({ id, companyId, fullName, email, role, phone, platformAdmin }) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      ...serviceHeaders(),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({
      id,
      company_id: companyId,
      full_name: fullName,
      email,
      role,
      phone,
      platform_admin: platformAdmin,
      active: true,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Could not create profile.");
  return data[0];
}

function formatSupabaseAuthError(data) {
  const message = data.message || data.error_description || data.error || "";
  const searchable = `${message} ${JSON.stringify(data)}`;
  if (/already|registered|exists|duplicate|email_exists|user_already_exists/i.test(searchable)) {
    return "Este e-mail já possui acesso cadastrado.";
  }
  if (/password/i.test(searchable)) {
    return "A senha inicial não atende aos requisitos mínimos.";
  }
  if (/email/i.test(searchable)) {
    return "Informe um e-mail válido para criar o acesso.";
  }
  return message || "Não foi possível criar o acesso no Supabase Auth.";
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
