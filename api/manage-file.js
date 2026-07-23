const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_FIELD_LENGTH = 180;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

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

  const fileId = cleanText(payload.fileId, 80);
  if (!uuidPattern.test(fileId)) return response(res, 400, { error: "Invalid file id." });

  const file = await getProjectFile(fileId);
  if (!file) return response(res, 404, { error: "File not found." });

  const project = await getProject(file.project_id);
  if (!project || !canManageFile(requester, project, file)) {
    return response(res, 403, { error: "You cannot manage this project file." });
  }

  if (req.method === "PATCH") {
    const fileName = cleanText(payload.fileName);
    if (!fileName) return response(res, 400, { error: "Missing file name." });
    const updated = await updateProjectFile(fileId, { file_name: fileName });
    return response(res, 200, { file: updated });
  }

  await deleteProjectFile(file);
  return response(res, 200, { success: true });
};

function canManageFile(requester, project, file) {
  if (requester.platform_admin) return true;
  if (requester.company_id !== project.company_id) return false;
  if (requester.role === "adm") return true;
  if (requester.role === "medidor") return project.medidor_id === requester.id && file.category === "medicao";
  if (requester.role === "projetista") {
    return project.projetista_id === requester.id && ["engenharia", "obra"].includes(file.category);
  }
  if (requester.role === "comprador") return project.comprador_id === requester.id && file.category === "compras";
  return requester.role === "montador" && project.montador_id === requester.id && file.category === "assistencia";
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
  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}&active=eq.true&select=*`, {
    headers: serviceHeaders(),
  });
  if (!response.ok) return null;
  const [profile] = await response.json();
  return profile || null;
}

async function getProjectFile(id) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/project_files?id=eq.${id}&select=*`, {
    headers: serviceHeaders(),
  });
  if (!response.ok) return null;
  const [file] = await response.json();
  return file || null;
}

async function getProject(id) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${id}&select=*`, {
    headers: serviceHeaders(),
  });
  if (!response.ok) return null;
  const [project] = await response.json();
  return project || null;
}

async function updateProjectFile(id, body) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/project_files?id=eq.${id}&select=*`, {
    method: "PATCH",
    headers: {
      ...serviceHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Could not update file.");
  return data[0];
}

async function deleteProjectFile(file) {
  const storagePath = encodeStoragePath(file.storage_path);
  const storageResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/${file.storage_bucket || "project-files"}/${storagePath}`, {
    method: "DELETE",
    headers: serviceHeaders(),
  });
  if (!storageResponse.ok && storageResponse.status !== 404) {
    const data = await storageResponse.json().catch(() => ({}));
    throw new Error(data.message || data.error || "Could not delete stored file.");
  }
  const response = await fetch(`${SUPABASE_URL}/rest/v1/project_files?id=eq.${file.id}`, {
    method: "DELETE",
    headers: serviceHeaders(),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Could not delete file.");
  }
}

function encodeStoragePath(path) {
  return String(path || "")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function parseBearerToken(value = "") {
  const [scheme, token] = String(value).split(" ");
  return scheme === "Bearer" && token ? token : "";
}

function cleanText(value, max = MAX_FIELD_LENGTH) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, max);
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
