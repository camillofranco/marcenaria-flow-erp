const baseUrl = process.env.APP_URL || "https://marcenaria-flow-erp.vercel.app";

const checks = [];

function assert(name, condition, detail = "") {
  checks.push({ name, ok: Boolean(condition), detail });
}

async function head(path) {
  return fetch(new URL(path, baseUrl), { method: "HEAD", redirect: "manual" });
}

async function get(path) {
  return fetch(new URL(path, baseUrl));
}

const home = await head("/");
const homeHeaders = home.headers;
const csp = homeHeaders.get("content-security-policy") || "";

assert("home returns 200", home.status === 200, `status=${home.status}`);
assert("CSP header present", Boolean(homeHeaders.get("content-security-policy")));
assert("CSP blocks object-src", csp.includes("object-src 'none'"));
assert("CSP restricts frame ancestors", csp.includes("frame-ancestors 'none'"));
assert("CSP avoids third-party scripts", !csp.includes("cdn.jsdelivr.net"));
assert("CSP allows Supabase API only", csp.includes("https://*.supabase.co"));
assert("HSTS present", Boolean(homeHeaders.get("strict-transport-security")));
assert("nosniff present", homeHeaders.get("x-content-type-options") === "nosniff");
assert("frame denied", homeHeaders.get("x-frame-options") === "DENY");
assert("permissions policy present", Boolean(homeHeaders.get("permissions-policy")));

const createUserGet = await head("/api/create-user");
assert("create-user GET blocked", createUserGet.status === 405, `status=${createUserGet.status}`);
assert("create-user no-store", createUserGet.headers.get("cache-control")?.includes("no-store"));

const manageUserGet = await head("/api/manage-user");
assert("manage-user GET blocked", manageUserGet.status === 405, `status=${manageUserGet.status}`);
assert("manage-user no-store", manageUserGet.headers.get("cache-control")?.includes("no-store"));

const manageFileGet = await head("/api/manage-file");
assert("manage-file GET blocked", manageFileGet.status === 405, `status=${manageFileGet.status}`);
assert("manage-file no-store", manageFileGet.headers.get("cache-control")?.includes("no-store"));

const config = await get("/api/config");
const configJson = await config.json();
assert("config endpoint available", config.status === 200, `status=${config.status}`);
assert("config endpoint no-store", config.headers.get("cache-control")?.includes("no-store"));
assert("config exposes only public Supabase settings", !("serviceRoleKey" in configJson) && !("dbPassword" in configJson));
assert("config Supabase URL is valid when configured", !configJson.configured || String(configJson.supabaseUrl || "").endsWith(".supabase.co"));

const manifest = await get("/manifest.webmanifest");
const manifestJson = await manifest.json();
assert("manifest available", manifest.status === 200, `status=${manifest.status}`);
assert("manifest standalone", manifestJson.display === "standalone");
assert("manifest has icons", Array.isArray(manifestJson.icons) && manifestJson.icons.length >= 2);

const sw = await get("/sw.js");
const swText = await sw.text();
assert("service worker available", sw.status === 200, `status=${sw.status}`);
assert("service worker skips API cache", swText.includes('url.pathname.startsWith("/api/")'));
assert("service worker same-origin guard", swText.includes("isSameOrigin"));
assert("service worker caches local Supabase client", swText.includes("/assets/vendor/supabase.min.js"));

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  const mark = check.ok ? "PASS" : "FAIL";
  console.log(`${mark} ${check.name}${check.detail ? ` (${check.detail})` : ""}`);
}

if (failed.length) {
  console.error(`\n${failed.length} security smoke check(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${checks.length} security smoke checks passed for ${baseUrl}.`);
