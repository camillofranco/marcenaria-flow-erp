const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return response(405, { error: "Method not allowed" });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return response(500, { error: "Supabase function environment is not configured." });
  }

  const token = event.headers.authorization?.replace("Bearer ", "");
  if (!token) return response(401, { error: "Missing authorization token." });

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return response(400, { error: "Invalid JSON." });
  }

  const { email, password, fullName, role, phone } = payload;
  if (!email || !password || !fullName || !role) {
    return response(400, { error: "Missing required user fields." });
  }

  const requester = await getRequesterProfile(token);
  if (!requester) return response(403, { error: "Requester profile not found." });
  if (!requester.platform_admin && requester.role !== "adm") {
    return response(403, { error: "Only administrators can create users." });
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

    return response(200, { user: authUser, profile });
  } catch (error) {
    return response(400, { error: error.message || "Could not create user." });
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
  if (!response.ok) throw new Error(data.message || "Could not create auth user.");
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

function serviceHeaders() {
  return {
    ...headers,
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  };
}

function response(statusCode, body) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}
