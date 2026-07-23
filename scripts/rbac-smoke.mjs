const supabaseUrl = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const appUrl = String(process.env.APP_URL || "").replace(/\/$/, "");

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  console.error("Set SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const password = `Qa-${crypto.randomUUID()}-9a!`;
const roles = ["adm", "medidor", "projetista", "comprador", "montador", "cliente"];
const users = {};
const tokens = {};
const storagePaths = [];
const checks = [];
let companyId = "";

function assert(name, condition, detail = "") {
  checks.push({ name, ok: Boolean(condition), detail });
}

function headers(token = serviceRoleKey, extra = {}) {
  return {
    apikey: token === serviceRoleKey ? serviceRoleKey : anonKey,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function request(path, { method = "GET", token = serviceRoleKey, body, extraHeaders = {} } = {}) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    method,
    headers: headers(token, extraHeaders),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { response, data };
}

async function createAuthUser(role) {
  const email = `qa-${role}-${suffix}@example.com`;
  const { response, data } = await request("/auth/v1/admin/users", {
    method: "POST",
    body: {
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `QA ${role}`, role },
    },
  });
  if (!response.ok) throw new Error(`Could not create ${role}: ${JSON.stringify(data)}`);
  users[role] = { id: data.id, email };
}

async function signIn(role) {
  const { response, data } = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    token: anonKey,
    body: { email: users[role].email, password },
  });
  if (!response.ok) throw new Error(`Could not sign in ${role}: ${JSON.stringify(data)}`);
  tokens[role] = data.access_token;
}

async function cleanup() {
  for (const path of storagePaths) {
    await fetch(`${supabaseUrl}/storage/v1/object/project-files/${path}`, {
      method: "DELETE",
      headers: headers(),
    }).catch(() => {});
  }
  if (companyId) {
    await request(`/rest/v1/companies?id=eq.${companyId}`, { method: "DELETE" }).catch(() => {});
  }
  for (const user of Object.values(users)) {
    await request(`/auth/v1/admin/users/${user.id}`, { method: "DELETE" }).catch(() => {});
  }
}

try {
  const companyResult = await request("/rest/v1/companies?select=id", {
    method: "POST",
    body: { name: `QA RBAC ${suffix}`, slug: `qa-rbac-${suffix}` },
    extraHeaders: { Prefer: "return=representation" },
  });
  if (!companyResult.response.ok) throw new Error(`Could not create QA company: ${JSON.stringify(companyResult.data)}`);
  companyId = companyResult.data[0].id;

  for (const role of roles) await createAuthUser(role);
  const profileResult = await request("/rest/v1/profiles", {
    method: "POST",
    body: roles.map((role) => ({
      id: users[role].id,
      company_id: companyId,
      full_name: `QA ${role}`,
      email: users[role].email,
      role,
      active: true,
    })),
  });
  if (!profileResult.response.ok) throw new Error(`Could not create QA profiles: ${JSON.stringify(profileResult.data)}`);

  const projectResult = await request("/rest/v1/projects?select=id", {
    method: "POST",
    body: [
      {
        company_id: companyId,
        project_number: `QA-${suffix}-A`,
        client_name: "QA Assigned",
        address: "QA Street 1",
        install_date: "2030-01-10",
        status: "medicao",
        medidor_id: users.medidor.id,
        projetista_id: users.projetista.id,
        comprador_id: users.comprador.id,
        montador_id: users.montador.id,
        cliente_id: users.cliente.id,
        created_by: users.adm.id,
      },
      {
        company_id: companyId,
        project_number: `QA-${suffix}-B`,
        client_name: "QA Unassigned",
        address: "QA Street 2",
        install_date: "2030-01-11",
        status: "abertura",
        medidor_id: null,
        projetista_id: null,
        comprador_id: null,
        montador_id: null,
        cliente_id: null,
        created_by: users.adm.id,
      },
    ],
    extraHeaders: { Prefer: "return=representation" },
  });
  if (!projectResult.response.ok) throw new Error(`Could not create QA projects: ${JSON.stringify(projectResult.data)}`);
  const [assignedProject, unassignedProject] = projectResult.data;

  const roomResult = await request("/rest/v1/rooms?select=id", {
    method: "POST",
    body: {
      company_id: companyId,
      project_id: assignedProject.id,
      name: "QA Kitchen",
      sort_order: 1,
    },
    extraHeaders: { Prefer: "return=representation" },
  });
  if (!roomResult.response.ok) throw new Error(`Could not create QA room: ${JSON.stringify(roomResult.data)}`);
  const roomId = roomResult.data[0].id;

  for (const role of roles) await signIn(role);

  const medidorProjects = await request("/rest/v1/projects?select=id", { token: tokens.medidor });
  assert("assigned user sees only assigned project", medidorProjects.response.ok && medidorProjects.data.length === 1);

  const clientProjects = await request("/rest/v1/projects?select=id,client_name", { token: tokens.cliente });
  assert("client sees only linked project", clientProjects.response.ok && clientProjects.data.length === 1);

  const buyerProfiles = await request("/rest/v1/profiles?select=id,email,phone,role", { token: tokens.comprador });
  assert("non-admin profile query returns self only", buyerProfiles.response.ok && buyerProfiles.data.length === 1);

  const directory = await request("/rest/v1/rpc/project_directory", {
    method: "POST",
    token: tokens.comprador,
    body: {},
  });
  assert("safe project directory is available", directory.response.ok && directory.data.length >= 1);
  assert("safe directory excludes PII", directory.response.ok && directory.data.every((row) => !("email" in row) && !("phone" in row)));

  const foreignPurchase = await request("/rest/v1/purchases", {
    method: "POST",
    token: tokens.projetista,
    body: {
      company_id: companyId,
      project_id: unassignedProject.id,
      material: "Denied material",
      quantity: "1",
      requested_by: users.projetista.id,
    },
  });
  assert("project designer cannot request for unassigned project", !foreignPurchase.response.ok, `status=${foreignPurchase.response.status}`);

  const ownPurchase = await request("/rest/v1/purchases?select=id", {
    method: "POST",
    token: tokens.projetista,
    body: {
      company_id: companyId,
      project_id: assignedProject.id,
      room_id: roomId,
      material: "Approved QA material",
      quantity: "2",
      requested_by: users.projetista.id,
    },
    extraHeaders: { Prefer: "return=representation" },
  });
  assert("assigned designer can request purchase", ownPurchase.response.ok);
  const purchaseId = ownPurchase.data?.[0]?.id;

  await request(`/rest/v1/purchases?id=eq.${purchaseId}`, {
    method: "PATCH",
    token: tokens.adm,
    body: { approval: "aprovado" },
  });
  await request("/rest/v1/purchases", {
    method: "POST",
    body: {
      company_id: companyId,
      project_id: assignedProject.id,
      material: "Pending hidden material",
      quantity: "1",
      requested_by: users.projetista.id,
      approval: "pendente",
    },
  });
  const buyerPurchases = await request("/rest/v1/purchases?select=id,approval", { token: tokens.comprador });
  assert("buyer sees approved purchases", buyerPurchases.response.ok && buyerPurchases.data.length === 1 && buyerPurchases.data[0].approval === "aprovado");
  assert("buyer cannot see pending purchases", buyerPurchases.response.ok && buyerPurchases.data.every((item) => item.approval === "aprovado"));

  const buyerApprovalChange = await request(`/rest/v1/purchases?id=eq.${purchaseId}`, {
    method: "PATCH",
    token: tokens.comprador,
    body: { approval: "recusado" },
  });
  assert("buyer cannot change approval", !buyerApprovalChange.response.ok, `status=${buyerApprovalChange.response.status}`);

  const buyerStatusChange = await request(`/rest/v1/purchases?id=eq.${purchaseId}`, {
    method: "PATCH",
    token: tokens.comprador,
    body: { purchase_status: "comprado" },
  });
  assert("buyer can update approved purchase status", buyerStatusChange.response.ok);

  const forbiddenProjectChange = await request(`/rest/v1/projects?id=eq.${assignedProject.id}`, {
    method: "PATCH",
    token: tokens.medidor,
    body: { client_name: "Tampered" },
  });
  assert("measurement user cannot alter client data", !forbiddenProjectChange.response.ok, `status=${forbiddenProjectChange.response.status}`);

  const allowedProjectChange = await request(`/rest/v1/projects?id=eq.${assignedProject.id}`, {
    method: "PATCH",
    token: tokens.medidor,
    body: { status: "desenvolvimento" },
  });
  assert("measurement user can advance assigned project", allowedProjectChange.response.ok);

  const allowedRoomChange = await request(`/rest/v1/rooms?id=eq.${roomId}`, {
    method: "PATCH",
    token: tokens.medidor,
    body: { measurement_notes: "{\"width\":\"2.4\"}" },
  });
  assert("measurement user can update measurements", allowedRoomChange.response.ok);

  const forbiddenRoomChange = await request(`/rest/v1/rooms?id=eq.${roomId}`, {
    method: "PATCH",
    token: tokens.medidor,
    body: { name: "Tampered room" },
  });
  assert("measurement user cannot rename rooms", !forbiddenRoomChange.response.ok, `status=${forbiddenRoomChange.response.status}`);

  const montadorRoomChange = await request(`/rest/v1/rooms?id=eq.${roomId}`, {
    method: "PATCH",
    token: tokens.montador,
    body: { support_note: "QA assistance", support_open: true },
  });
  assert("installer can report assigned room assistance", montadorRoomChange.response.ok);

  const clientAlert = await request("/rest/v1/alerts", {
    method: "POST",
    token: tokens.cliente,
    body: {
      company_id: companyId,
      project_id: assignedProject.id,
      level: "critical",
      title: "Denied client alert",
      created_by: users.cliente.id,
    },
  });
  assert("client cannot create internal alert", !clientAlert.response.ok, `status=${clientAlert.response.status}`);

  const filesSeed = await request("/rest/v1/project_files", {
    method: "POST",
    body: [
      {
        company_id: companyId,
        project_id: assignedProject.id,
        category: "obra",
        file_name: "obra.pdf",
        storage_path: `${companyId}/${assignedProject.id}/obra/obra.pdf`,
        uploaded_by: users.adm.id,
      },
      {
        company_id: companyId,
        project_id: assignedProject.id,
        category: "engenharia",
        file_name: "factory.dwg",
        storage_path: `${companyId}/${assignedProject.id}/engenharia/factory.dwg`,
        uploaded_by: users.adm.id,
      },
    ],
  });
  if (!filesSeed.response.ok) throw new Error(`Could not seed files: ${JSON.stringify(filesSeed.data)}`);

  const clientFiles = await request("/rest/v1/project_files?select=category", { token: tokens.cliente });
  assert("client reads only work files", clientFiles.response.ok && clientFiles.data.length === 1 && clientFiles.data[0].category === "obra");

  const medidorMetadata = await request("/rest/v1/project_files", {
    method: "POST",
    token: tokens.medidor,
    body: {
      company_id: companyId,
      project_id: assignedProject.id,
      room_id: roomId,
      category: "medicao",
      file_name: "measure.jpg",
      storage_path: `${companyId}/${assignedProject.id}/medicao/measure.jpg`,
      uploaded_by: users.medidor.id,
    },
  });
  assert("measurement user can create measurement metadata", medidorMetadata.response.ok);

  const medidorWrongMetadata = await request("/rest/v1/project_files", {
    method: "POST",
    token: tokens.medidor,
    body: {
      company_id: companyId,
      project_id: assignedProject.id,
      category: "obra",
      file_name: "denied.pdf",
      storage_path: `${companyId}/${assignedProject.id}/obra/denied.pdf`,
      uploaded_by: users.medidor.id,
    },
  });
  assert("measurement user cannot write work files", !medidorWrongMetadata.response.ok, `status=${medidorWrongMetadata.response.status}`);

  const buyerMetadata = await request("/rest/v1/project_files", {
    method: "POST",
    token: tokens.comprador,
    body: {
      company_id: companyId,
      project_id: assignedProject.id,
      category: "compras",
      file_name: "invoice.pdf",
      storage_path: `${companyId}/${assignedProject.id}/compras/invoice.pdf`,
      uploaded_by: users.comprador.id,
    },
  });
  assert("buyer can create invoice metadata", buyerMetadata.response.ok);

  const allowedStoragePath = `${companyId}/${assignedProject.id}/medicao/qa.jpg`;
  const deniedStoragePath = `${companyId}/${assignedProject.id}/obra/qa.pdf`;
  storagePaths.push(allowedStoragePath);
  const allowedStorage = await fetch(`${supabaseUrl}/storage/v1/object/project-files/${allowedStoragePath}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${tokens.medidor}`,
      "Content-Type": "image/jpeg",
    },
    body: new Uint8Array([255, 216, 255, 217]),
  });
  assert("measurement user can upload measurement object", allowedStorage.ok, `status=${allowedStorage.status}`);

  const deniedStorage = await fetch(`${supabaseUrl}/storage/v1/object/project-files/${deniedStoragePath}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${tokens.medidor}`,
      "Content-Type": "application/pdf",
    },
    body: new Uint8Array([37, 80, 68, 70]),
  });
  assert("measurement user cannot upload work object", !deniedStorage.ok, `status=${deniedStorage.status}`);

  const clientStoragePath = `${companyId}/${assignedProject.id}/obra/client-denied.pdf`;
  const clientStorage = await fetch(`${supabaseUrl}/storage/v1/object/project-files/${clientStoragePath}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${tokens.cliente}`,
      "Content-Type": "application/pdf",
    },
    body: new Uint8Array([37, 80, 68, 70]),
  });
  assert("client cannot upload project object", !clientStorage.ok, `status=${clientStorage.status}`);

  const deleteUnassigned = await request(`/rest/v1/projects?id=eq.${unassignedProject.id}`, {
    method: "DELETE",
    token: tokens.adm,
  });
  assert("administrator can delete project", deleteUnassigned.response.ok);

  if (appUrl) {
    const forbiddenApi = await fetch(`${appUrl}/api/create-user`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.medidor}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: "Denied QA user",
        email: `denied-${suffix}@example.com`,
        password,
        role: "adm",
      }),
    });
    assert("non-admin cannot use user provisioning API", forbiddenApi.status === 403, `status=${forbiddenApi.status}`);

    const managedEmail = `managed-${suffix}@example.com`;
    const createManaged = await fetch(`${appUrl}/api/create-user`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.adm}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: "Managed QA user",
        email: managedEmail,
        password,
        role: "medidor",
      }),
    });
    const createManagedData = await createManaged.json().catch(() => ({}));
    assert("administrator can provision user through API", createManaged.ok && createManagedData.profile?.id, `status=${createManaged.status}`);

    if (createManagedData.profile?.id) {
      const managedId = createManagedData.profile.id;
      users.managed = { id: managedId, email: managedEmail };
      const updateManaged = await fetch(`${appUrl}/api/manage-user`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${tokens.adm}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: managedId,
          fullName: "Managed QA updated",
          email: managedEmail,
          role: "projetista",
          phone: "11999990000",
        }),
      });
      const updateManagedData = await updateManaged.json().catch(() => ({}));
      assert(
        "administrator can update user through API",
        updateManaged.ok && updateManagedData.profile?.role === "projetista",
        `status=${updateManaged.status}`,
      );

      const deleteManaged = await fetch(`${appUrl}/api/manage-user`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${tokens.adm}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: managedId }),
      });
      assert("administrator can deactivate user through API", deleteManaged.ok, `status=${deleteManaged.status}`);

      const blockedLogin = await request("/auth/v1/token?grant_type=password", {
        method: "POST",
        token: anonKey,
        body: { email: managedEmail, password },
      });
      assert("deactivated user cannot sign in", !blockedLogin.response.ok, `status=${blockedLogin.response.status}`);
    }
  }
} catch (error) {
  console.error(error);
  checks.push({ name: "RBAC smoke setup", ok: false, detail: error.message });
} finally {
  await cleanup();
}

const failed = checks.filter((check) => !check.ok);
for (const check of checks) {
  console.log(`${check.ok ? "PASS" : "FAIL"} ${check.name}${check.detail ? ` (${check.detail})` : ""}`);
}
if (failed.length) {
  console.error(`\n${failed.length} RBAC check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} RBAC checks passed.`);
