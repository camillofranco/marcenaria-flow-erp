const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store, max-age=0",
};

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return response(res, 405, { error: "Method not allowed" });
  }

  const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const supabaseAnonKey = String(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "").trim();

  return response(res, 200, {
    configured: Boolean(supabaseUrl && supabaseAnonKey),
    supabaseUrl,
    supabaseAnonKey,
  });
};

function normalizeSupabaseUrl(value) {
  const raw = String(value || "").trim().replace(/\/+$/, "");
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co")) return "";
    return url.toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

function response(res, statusCode, body) {
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
  return res.status(statusCode).json(body);
}
