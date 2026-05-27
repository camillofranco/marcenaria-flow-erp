const roleProfiles = {
  adm: {
    label: "Administrador",
    title: "Painel de controle",
    subtitle: "Projetos, compras, responsáveis e alertas de assistência.",
  },
  medidor: {
    label: "Medidor",
    title: "Medições agendadas",
    subtitle: "Clientes atribuídos, fotos por ambiente e pastas de medição.",
  },
  projetista: {
    label: "Projetista",
    title: "Desenvolvimento técnico",
    subtitle: "Ambientes liberados, checklists e pedidos de compra.",
  },
  comprador: {
    label: "Comprador",
    title: "Suprimentos aprovados",
    subtitle: "Materiais aprovados, compra, entrega e faturas.",
  },
  montador: {
    label: "Montador",
    title: "Roteiro de montagem",
    subtitle: "Rotas, ficheiros de obra, alertas e checklist.",
  },
  cliente: {
    label: "Cliente",
    title: "Acompanhamento da obra",
    subtitle: "Status do projeto, previsão de montagem, arquivos liberados e pendências.",
  },
};

const STORAGE_KEY = "marcenaria-flow-pilot-v2";
const TOUR_VERSION = "v4";
const PRODUCTION_URL = "https://marcenaria-flow-erp.vercel.app";
const SUPABASE_URL = "https://oouxuleswyfjqfczlouh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BX6RrygWROrTcdmjC8oKCw_gxre0b5e";
const supabaseGlobal = window.supabase || (typeof supabase !== "undefined" ? supabase : null);
const supabaseClient =
  supabaseGlobal && SUPABASE_URL && SUPABASE_ANON_KEY
    ? supabaseGlobal.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const state = {
  role: "adm",
  view: "dashboard",
  statusFilter: "todos",
  selectedProjectId: "",
  selectedPersonId: "",
  activePersonId: "",
  search: "",
  projects: [],
  people: [],
  backendMode: false,
  session: null,
  profile: null,
  companyId: "",
};

Object.assign(state, loadPilotData());

const roleSelect = document.querySelector("[data-role-select]");
const personSelect = document.querySelector("#personSelect");
const userEmail = document.querySelector("#userEmail");
const roleLabel = document.querySelector("#roleLabel");
const pageTitle = document.querySelector("#pageTitle");
const mainPanelTitle = document.querySelector("#mainPanelTitle");
const mainPanelSubtitle = document.querySelector("#mainPanelSubtitle");
const metrics = document.querySelector("#metrics");
const contentGrid = document.querySelector(".content-grid");
const projectList = document.querySelector("#projectList");
const detailPanel = document.querySelector("#detailPanel");
const searchInput = document.querySelector("#searchInput");
const toast = document.querySelector("#toast");
const dialog = document.querySelector("#projectDialog");
const projectForm = document.querySelector("#projectForm");
const projectDialogEyebrow = document.querySelector("#projectDialogEyebrow");
const projectDialogTitle = document.querySelector("#projectDialogTitle");
const projectSubmitBtn = document.querySelector("#projectSubmitBtn");
const alertDialog = document.querySelector("#alertDialog");
const alertForm = document.querySelector("#alertForm");
const alertDialogTitle = document.querySelector("#alertDialogTitle");
const personDialog = document.querySelector("#personDialog");
const personForm = document.querySelector("#personForm");
const personDialogTitle = document.querySelector("#personDialogTitle");
const passwordDialog = document.querySelector("#passwordDialog");
const passwordForm = document.querySelector("#passwordForm");
const tourLayer = document.querySelector("#tourLayer");
const tourPopover = document.querySelector("#tourPopover");
const tourLine = document.querySelector("#tourLine");
const tourRole = document.querySelector("#tourRole");
const tourTitle = document.querySelector("#tourTitle");
const tourText = document.querySelector("#tourText");
const tourProgress = document.querySelector("#tourProgress");
const tourCloseBtn = document.querySelector("#tourCloseBtn");
const tourPrevBtn = document.querySelector("#tourPrevBtn");
const tourNextBtn = document.querySelector("#tourNextBtn");
const newProjectBtn = document.querySelector("#newProjectBtn");
const newPersonBtn = document.querySelector("#newPersonBtn");
const tourBtn = document.querySelector("#tourBtn");
const exportDataBtn = document.querySelector("#exportDataBtn");
const importDataBtn = document.querySelector("#importDataBtn");
const importDataInput = document.querySelector("#importDataInput");
const authGate = document.querySelector("#authGate");
const loginForm = document.querySelector("#loginForm");
const forgotPasswordBtn = document.querySelector("#forgotPasswordBtn");
const changePasswordBtn = document.querySelector("#changePasswordBtn");
const logoutBtn = document.querySelector("#logoutBtn");
const sessionBadge = document.querySelector("#sessionBadge");

const statusLabels = {
  abertura: "Abertura",
  medicao: "Medição técnica",
  desenvolvimento: "Em desenvolvimento",
  compras: "Compras",
  fabrica: "Fábrica",
  montagem: "Montagem",
  assistencia: "Assistência",
  concluido: "Concluído",
};

const alertLabels = {
  critical: "Crítico",
  attention: "Atenção",
  info: "Informativo",
};

const scheduleLabels = {
  medicao: "Medição",
  montagem: "Montagem",
};

const projectFlow = ["abertura", "medicao", "desenvolvimento", "compras", "fabrica", "montagem", "assistencia", "concluido"];

const checklistByRole = {
  adm: [
    ["Projeto aberto", (project) => Boolean(project.number && project.client)],
    ["Responsáveis vinculados", (project) => [project.medidorId, project.projetistaId, project.montadorId].every(Boolean)],
    ["Compras pendentes revisadas", (project) => !project.purchases.some((item) => item.approval === "pendente")],
    ["Alertas críticos tratados", (project) => !hasCriticalAlert(project)],
  ],
  medidor: [
    ["Ambientes conferidos", (project) => project.rooms.length > 0],
    ["Fotos de medição registradas", (project) => project.rooms.length > 0 && project.rooms.every((room) => Number(room.measurementPhotos) > 0)],
    ["Projeto liberado", (project) => project.status !== "medicao" && project.status !== "abertura"],
  ],
  projetista: [
    ["Start registrado", (project) => Boolean(project.startedAt) || ["desenvolvimento", "compras", "fabrica", "montagem", "concluido"].includes(project.status)],
    ["Ambientes de projeto concluídos", (project) => project.rooms.length > 0 && project.rooms.every((room) => room.designDone)],
    ["Arquivos técnicos adicionados", (project) => (project.files.engenharia || []).length > 0 && (project.files.obra || []).length > 0],
  ],
  comprador: [
    ["Compras aprovadas pelo ADM", (project) => project.purchases.some((item) => item.approval === "aprovado")],
    ["Itens comprados", (project) => project.purchases.filter((item) => item.approval === "aprovado").every((item) => ["comprado", "entregue"].includes(item.purchaseStatus))],
    ["Faturas anexadas", (project) => project.purchases.filter((item) => item.approval === "aprovado").every((item) => item.invoice)],
  ],
  montador: [
    ["Rota e arquivos conferidos", (project) => Boolean(project.address) && (project.files.obra || []).length > 0],
    ["Ambientes montados", (project) => project.rooms.length > 0 && project.rooms.every((room) => room.installDone)],
    ["Pendências registradas", (project) => project.rooms.every((room) => room.installDone || room.supportNote)],
  ],
  cliente: [
    ["Projeto em andamento", (project) => project.status !== "abertura"],
    ["Previsão disponível", (project) => Boolean(project.installDate || project.measurementDate)],
    ["Arquivos liberados", (project) => (project.files.obra || []).length > 0],
  ],
};

let tourIndex = 0;

const tourSteps = {
  adm: [
    { selector: "#newProjectBtn", title: "Abrir projeto", text: "Crie o card do cliente com número, endereço, agenda ativa, data de medição, data de montagem, ambientes e responsáveis.", side: "right" },
    { selector: "#projectList", title: "Editar projeto", text: "Clique em um card e use Editar projeto no painel lateral para alterar datas, status, responsáveis, cliente vinculado e ambientes.", side: "right" },
    { selector: "#projectList", title: "Agenda do card", text: "A agenda ativa define qual data aparece no card. O ADM pode alternar entre medição e montagem a qualquer momento.", side: "right" },
    { selector: "#projectList", title: "Alertas visuais", text: "Use Novo alerta para registrar riscos críticos, atenção ou informação. Quando houver alerta crítico aberto, o card fica vermelho automaticamente.", side: "right" },
    { selector: "#newPersonBtn", title: "Gerir acessos", text: "Cadastre, altere ou exclua usuários reais. O ADM controla perfis de medidor, projetista, comprador, montador, cliente e outros ADMs.", side: "right" },
    { selector: "#roleSelect", title: "Visão por perfil", text: "No acesso real, o usuário comum fica travado no próprio perfil. O programador admin pode alternar a visão para validar a operação.", side: "right" },
    { selector: "[data-view='purchases']", title: "Compras e aprovação", text: "Acompanhe materiais solicitados pelo projetista, aprove compras e libere apenas o que o comprador deve executar.", side: "right" },
    { selector: "[data-view='alerts']", title: "Central de alertas", text: "Nesta visão ficam reunidas as ocorrências críticas, atenção e informações de obra para o ADM priorizar antes da equipe avançar.", side: "right" },
    { selector: "#searchInput", title: "Busca operacional", text: "Filtre rapidamente por número do projeto, cliente ou endereço, sempre respeitando a permissão do usuário logado.", side: "right" },
  ],
  medidor: [
    { selector: "[data-view='projects']", title: "Projetos atribuídos", text: "O medidor enxerga apenas obras onde foi vinculado pelo ADM. Sem vínculo, a tela fica vazia.", side: "right" },
    { selector: "#projectList", title: "Medição técnica", text: "Abra o card na obra, confira cliente, endereço, agenda ativa e ambientes contratados antes de iniciar a medição.", side: "right" },
    { selector: "#projectList", title: "Fotos e liberação", text: "Use Abrir câmera para registrar fotos por ambiente e Liberar projeto quando a medição estiver pronta para o projetista.", side: "right" },
    { selector: "#projectList", title: "Alertas no detalhe", text: "Leia alertas antes de medir. Alertas críticos aparecem em vermelho e também deixam o card destacado.", side: "right" },
    { selector: "[data-view='drive']", title: "Pastas automáticas", text: "As fotos ficam organizadas por cliente, projeto, etapa de medição e ambiente.", side: "right" },
  ],
  projetista: [
    { selector: "[data-view='projects']", title: "Projetos liberados", text: "O projetista vê apenas projetos atribuídos a ele, já com as fotos e ambientes vindos da medição.", side: "right" },
    { selector: "#projectList", title: "Start e checklist", text: "Registre o início do desenvolvimento e marque ambiente por ambiente quando o técnico estiver concluído.", side: "right" },
    { selector: "#projectList", title: "Alertas de projeto", text: "Crie alertas quando identificar risco técnico, mudança de obra ou informação importante para montagem.", side: "right" },
    { selector: "[data-view='purchases']", title: "Pedidos especiais", text: "Solicite ferragens, LEDs e materiais fora do padrão para análise e aprovação do ADM.", side: "right" },
    { selector: "[data-view='drive']", title: "Arquivos técnicos", text: "Separe arquivo de fábrica em Engenharia e arquivo de visualização em Obra para a equipe de montagem.", side: "right" },
  ],
  comprador: [
    { selector: "[data-view='purchases']", title: "Itens aprovados", text: "O comprador vê somente projetos vinculados ao seu usuário e com compras aprovadas pelo ADM.", side: "right" },
    { selector: "#projectList", title: "Compra e entrega", text: "Atualize itens para comprado, acompanhe entrega na fábrica e mantenha comprovantes ligados ao projeto.", side: "right" },
    { selector: "#searchInput", title: "Busca de suprimentos", text: "Localize rapidamente projetos por cliente, número ou endereço antes de cotar ou registrar uma compra.", side: "right" },
  ],
  montador: [
    { selector: "[data-view='projects']", title: "Roteiro de montagem", text: "O montador enxerga apenas obras onde foi escalado pelo ADM, com data, endereço e status.", side: "right" },
    { selector: "#projectList", title: "Obra no celular", text: "Abra rota no Maps, consulte arquivos da pasta Obra, leia alertas e marque o checklist de montagem por ambiente.", side: "right" },
    { selector: "#projectList", title: "Card vermelho", text: "Quando existir alerta crítico aberto, o card aparece em vermelho para evitar que a equipe ignore riscos antes da execução.", side: "right" },
    { selector: "[data-view='alerts']", title: "Pendências e assistência", text: "Ao relatar pendência, o ADM recebe alerta vermelho para fabricar reposição ou tratar pós-venda.", side: "right" },
  ],
  cliente: [
    { selector: "#projectList", title: "Acompanhamento", text: "O cliente acessa apenas projetos vinculados ao e-mail dele. Sem vínculo, nenhum dado interno aparece.", side: "right" },
    { selector: "#projectList", title: "Status da obra", text: "Veja etapa atual, previsão de montagem e evolução dos ambientes sem acessar compras ou alertas internos.", side: "right" },
    { selector: "[data-view='drive']", title: "Arquivos liberados", text: "O cliente acessa somente os arquivos de visualização da pasta Obra.", side: "right" },
  ],
};

function activePerson() {
  return state.people.find((person) => person.id === state.activePersonId);
}

function personName(id) {
  return state.people.find((person) => person.id === id)?.name || "Sem responsável";
}

function peopleByRole(role) {
  return state.people.filter((person) => person.role === role);
}

function profileById(id) {
  return state.people.find((person) => person.id === id);
}

function getProject(projectId) {
  return state.projects.find((item) => item.id === projectId);
}

function roleMatches(project) {
  const person = activePerson();
  if ((!state.backendMode || requireAdmin()) && state.role === "adm") return true;
  if (!person) return false;
  return {
    medidor: project.medidorId === person.id,
    projetista: project.projetistaId === person.id,
    comprador: project.compradorId === person.id && project.purchases.some((item) => item.approval === "aprovado"),
    montador: project.montadorId === person.id,
    cliente: project.clienteUserId === person.id,
  }[state.role];
}

function filteredProjects() {
  const query = state.search.trim().toLowerCase();
  return state.projects.filter((project) => {
    const canSee = roleMatches(project);
    const statusMatch = state.statusFilter === "todos" || project.status === state.statusFilter;
    const textMatch = [project.number, project.client, project.address].join(" ").toLowerCase().includes(query);
    return canSee && statusMatch && textMatch;
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 3200);
}

function showAuthGate(show) {
  authGate.hidden = !show;
  document.body.classList.toggle("auth-open", show);
}

function isRealBackend() {
  return state.backendMode && supabaseClient && state.session;
}

function requireAdmin() {
  return state.profile?.platform_admin || state.profile?.role === "adm";
}

function canEditRoomField(field) {
  if (!state.backendMode && state.role === "adm") return true;
  if (requireAdmin()) return true;
  return {
    designDone: state.role === "projetista",
    installDone: state.role === "montador",
    supportNote: state.role === "montador",
  }[field];
}

function friendlyError(error, fallback) {
  return error?.message || fallback || "Não foi possível concluir a operação.";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}

function loadPilotData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      projects: Array.isArray(data?.projects) ? data.projects : [],
      people: Array.isArray(data?.people) ? data.people : [],
      activePersonId: data?.activePersonId || "",
    };
  } catch {
    return { projects: [], people: [], activePersonId: "" };
  }
}

function persistPilotData() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 2,
      projects: state.projects,
      people: state.people,
      activePersonId: state.activePersonId,
    }),
  );
}

function exportPilotData() {
  const payload = {
    app: "Marcenaria Flow ERP",
    version: 2,
    exportedAt: new Date().toISOString(),
    projects: state.projects,
    people: state.people,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `marcenaria-flow-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Backup exportado. Guarde este arquivo para recuperar ou transportar os dados do piloto.");
}

function importPilotData(file) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const payload = JSON.parse(reader.result);
      const projects = Array.isArray(payload) ? payload : payload.projects;
      const people = Array.isArray(payload.people) ? payload.people : [];
      if (!Array.isArray(projects)) throw new Error("Arquivo sem lista de projetos.");
      state.projects = projects;
      state.people = people;
      state.selectedProjectId = projects[0]?.id ?? "";
      persistPilotData();
      renderPersonSelect();
      renderProjects();
      showToast("Dados importados com sucesso neste navegador.");
    } catch {
      showToast("Não foi possível importar. Use um backup JSON exportado pelo Marcenaria Flow.");
    }
  });
  reader.readAsText(file);
}

async function bootApp() {
  if (!supabaseClient) {
    showAuthGate(false);
    renderPersonSelect();
    renderProjects();
    maybeOpenFirstAccessTour();
    return;
  }

  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    await startBackendSession(data.session);
    return;
  }

  showAuthGate(true);
  renderPersonSelect();
  renderProjects();
}

async function startBackendSession(session) {
  state.backendMode = true;
  state.session = session;
  showAuthGate(false);
  exportDataBtn.hidden = true;
  importDataBtn.hidden = true;
  await loadBackendData();
  maybeOpenFirstAccessTour();
}

async function loadBackendData() {
  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", state.session.user.id)
    .single();
  if (profileError) throw profileError;

  state.profile = profile;
  state.companyId = profile.company_id;
  state.role = profile.role;
  state.activePersonId = profile.id;
  roleSelect.value = state.role;

  const [{ data: profiles, error: peopleError }, { data: projects, error: projectsError }] = await Promise.all([
    supabaseClient.from("profiles").select("*").eq("company_id", state.companyId).eq("active", true).order("full_name"),
    supabaseClient.from("projects").select("*").order("install_date", { ascending: true }),
  ]);
  if (peopleError) throw peopleError;
  if (projectsError) throw projectsError;

  const projectIds = (projects || []).map((project) => project.id);
  const [roomsResult, purchasesResult, alertsResult, filesResult] = await Promise.all([
    projectIds.length ? supabaseClient.from("rooms").select("*").in("project_id", projectIds).order("sort_order") : { data: [], error: null },
    projectIds.length ? supabaseClient.from("purchases").select("*").in("project_id", projectIds).order("created_at") : { data: [], error: null },
    projectIds.length ? supabaseClient.from("alerts").select("*").in("project_id", projectIds).order("created_at", { ascending: false }) : { data: [], error: null },
    projectIds.length ? supabaseClient.from("project_files").select("*").in("project_id", projectIds).order("created_at", { ascending: false }) : { data: [], error: null },
  ]);

  [roomsResult, purchasesResult, alertsResult, filesResult].forEach((result) => {
    if (result.error) throw result.error;
  });

  state.people = (profiles || []).map(mapProfile);
  state.projects = (projects || []).map((project) =>
    mapProject(project, roomsResult.data || [], purchasesResult.data || [], alertsResult.data || [], filesResult.data || []),
  );
  await hydrateSignedFileUrls();
  state.selectedProjectId = state.projects[0]?.id || "";
  renderPersonSelect();
  setView(state.view);
}

function mapProfile(profile) {
  return {
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    role: profile.role,
    phone: profile.phone || "",
    active: profile.active !== false,
  };
}

function mapProject(project, rooms, purchases, alerts, files) {
  const projectFiles = { medicao: [], engenharia: [], obra: [], compras: [], assistencia: [] };
  const notes = parseProjectNotes(project.notes);
  files
    .filter((file) => file.project_id === project.id)
    .forEach((file) => {
      if (!projectFiles[file.category]) projectFiles[file.category] = [];
      projectFiles[file.category].push({
        id: file.id,
        name: file.file_name,
        path: file.storage_path,
        bucket: file.storage_bucket || "project-files",
        roomId: file.room_id || "",
        url: "",
      });
    });

  return {
    id: project.id,
    number: project.project_number,
    client: project.client_name,
    address: project.address,
    installDate: project.install_date,
    measurementDate: notes.measurementDate || "",
    scheduleType: notes.scheduleType === "medicao" ? "medicao" : "montagem",
    activity: Array.isArray(notes.activity) ? notes.activity : [],
    notesData: notes,
    status: project.status,
    medidorId: project.medidor_id,
    projetistaId: project.projetista_id,
    compradorId: project.comprador_id,
    montadorId: project.montador_id,
    clienteUserId: project.cliente_id,
    startedAt: project.started_design_at || "",
    rooms: rooms
      .filter((room) => room.project_id === project.id)
      .map((room) => ({
        id: room.id,
        name: room.name,
        measurementPhotos: room.measurement_photos_count || 0,
        measurements: parseMeasurementNotes(room.measurement_notes),
        designDone: room.design_done,
        installDone: room.install_done,
        supportNote: room.support_note || "",
      })),
    purchases: purchases
      .filter((item) => item.project_id === project.id)
      .map((item) => ({
        id: item.id,
        item: item.material,
        qty: item.quantity,
        requestedById: item.requested_by,
        approval: item.approval,
        purchaseStatus: item.purchase_status,
        invoice: item.invoice_path || "",
      })),
    alerts: alerts
      .filter((alert) => alert.project_id === project.id)
      .map((alert) => ({
        ...parseAlertMeta(alert.description),
        id: alert.id,
        level: alert.level,
        title: alert.title,
        resolved: alert.resolved === true,
        source: personName(alert.created_by),
      })),
    files: projectFiles,
  };
}

async function hydrateSignedFileUrls() {
  if (!supabaseClient) return;
  const files = state.projects.flatMap((project) => Object.values(project.files || {}).flat()).filter((file) => file?.path);
  await Promise.all(
    files.map(async (file) => {
      const { data } = await supabaseClient.storage.from(file.bucket || "project-files").createSignedUrl(file.path, 60 * 60);
      file.url = data?.signedUrl || "";
    }),
  );
}

function nullIfEmpty(value) {
  return value ? value : null;
}

function parseProjectNotes(notes) {
  if (!notes) return {};
  try {
    const data = JSON.parse(notes);
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function parseMeasurementNotes(notes) {
  const defaults = { width: "", height: "", depth: "", linear: "", notes: "" };
  if (!notes) return defaults;
  try {
    const data = JSON.parse(notes);
    return { ...defaults, ...(data && typeof data === "object" ? data : {}) };
  } catch {
    return { ...defaults, notes };
  }
}

function measurementNotesPayload(measurements) {
  return JSON.stringify({
    width: measurements.width || "",
    height: measurements.height || "",
    depth: measurements.depth || "",
    linear: measurements.linear || "",
    notes: measurements.notes || "",
  });
}

function projectSchedule(project) {
  const type = project.scheduleType === "medicao" ? "medicao" : "montagem";
  const date = type === "medicao" ? project.measurementDate || project.installDate : project.installDate || project.measurementDate;
  return { type, date };
}

function hasCriticalAlert(project) {
  return project.alerts.some((alert) => alert.level === "critical" && alert.resolved !== true);
}

function scheduleNotes({ scheduleType, measurementDate, installDate }, base = {}) {
  return JSON.stringify({
    ...base,
    scheduleType: scheduleType === "medicao" ? "medicao" : "montagem",
    measurementDate: measurementDate || "",
    installDate: installDate || "",
  });
}

function parseAlertMeta(description) {
  if (!description) return {};
  try {
    const data = JSON.parse(description);
    return data && typeof data === "object" ? data : {};
  } catch {
    return { description };
  }
}

function alertDescription({ assigneeId = "", dueDate = "", status = "open", description = "" } = {}) {
  return JSON.stringify({ assigneeId, dueDate, status, description });
}

function actorName() {
  return state.backendMode ? state.profile?.full_name || state.profile?.email || "Usuário" : activePerson()?.name || roleProfiles[state.role]?.label || "Usuário";
}

function addActivity(project, label) {
  const item = {
    id: `log-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    at: new Date().toISOString(),
    actor: actorName(),
    label,
  };
  project.activity = [item, ...(project.activity || [])].slice(0, 20);
  project.notesData = { ...(project.notesData || {}), activity: project.activity };
  return item;
}

function projectNotesPayload(project, schedule = projectSchedule(project)) {
  return scheduleNotes(
    {
      scheduleType: schedule.type || project.scheduleType,
      measurementDate: project.measurementDate,
      installDate: project.installDate,
    },
    { ...(project.notesData || {}), activity: project.activity || [] },
  );
}

async function persistProjectNotes(project) {
  if (!isRealBackend()) {
    persistPilotData();
    return;
  }
  const { error } = await supabaseClient.from("projects").update({ notes: projectNotesPayload(project) }).eq("id", project.id);
  if (error) throw error;
}

function validateSchedule(formData) {
  const scheduleType = formData.get("scheduleType") === "montagem" ? "montagem" : "medicao";
  const measurementDate = String(formData.get("measurementDate") || "");
  const installDate = String(formData.get("installDate") || "");
  const activeDate = scheduleType === "medicao" ? measurementDate : installDate;
  if (!activeDate) {
    throw new Error(scheduleType === "medicao" ? "Informe a data da medição." : "Informe a data da montagem.");
  }
  return { scheduleType, measurementDate, installDate, activeDate };
}

function roomsFromForm(formData) {
  return String(formData.get("rooms") || "Ambiente 1")
    .split(",")
    .map((room) => room.trim())
    .filter(Boolean);
}

async function createProjectBackend(formData, rooms) {
  const schedule = validateSchedule(formData);
  const { data: project, error } = await supabaseClient
    .from("projects")
    .insert({
      company_id: state.companyId,
      project_number: String(formData.get("number")).trim(),
      client_name: String(formData.get("client")).trim(),
      address: String(formData.get("address")).trim(),
      install_date: schedule.installDate || schedule.measurementDate,
      medidor_id: nullIfEmpty(formData.get("medidor")),
      projetista_id: nullIfEmpty(formData.get("projetista")),
      comprador_id: nullIfEmpty(formData.get("comprador")),
      montador_id: nullIfEmpty(formData.get("montador")),
      cliente_id: nullIfEmpty(formData.get("clienteUser")),
      notes: scheduleNotes(schedule, {
        activity: [{ id: `log-${Date.now()}`, at: new Date().toISOString(), actor: actorName(), label: "Projeto criado" }],
      }),
      created_by: state.profile.id,
      status: formData.get("status") || "medicao",
    })
    .select()
    .single();
  if (error) throw error;

  if (rooms.length) {
    const { error: roomsError } = await supabaseClient.from("rooms").insert(
      rooms.map((name, index) => ({
        company_id: state.companyId,
        project_id: project.id,
        name,
        sort_order: index + 1,
      })),
    );
    if (roomsError) throw roomsError;
  }

  await supabaseClient.from("alerts").insert({
    company_id: state.companyId,
    project_id: project.id,
    level: "info",
    title: "Projeto criado pelo ADM",
    description: alertDescription({ status: "open" }),
    created_by: state.profile.id,
  });

  state.selectedProjectId = project.id;
  await loadBackendData();
}

async function updateProjectBackend(formData, rooms) {
  const projectId = String(formData.get("id") || "");
  const current = getProject(projectId);
  if (!current) throw new Error("Projeto não encontrado para edição.");
  const schedule = validateSchedule(formData);
  const activity = [
    { id: `log-${Date.now()}`, at: new Date().toISOString(), actor: actorName(), label: "Projeto atualizado" },
    ...(current.activity || []),
  ].slice(0, 20);
  const { error } = await supabaseClient
    .from("projects")
    .update({
      project_number: String(formData.get("number")).trim(),
      client_name: String(formData.get("client")).trim(),
      address: String(formData.get("address")).trim(),
      install_date: schedule.installDate || schedule.measurementDate,
      status: formData.get("status") || current.status,
      medidor_id: nullIfEmpty(formData.get("medidor")),
      projetista_id: nullIfEmpty(formData.get("projetista")),
      comprador_id: nullIfEmpty(formData.get("comprador")),
      montador_id: nullIfEmpty(formData.get("montador")),
      cliente_id: nullIfEmpty(formData.get("clienteUser")),
      notes: scheduleNotes(schedule, { ...(current.notesData || {}), activity }),
    })
    .eq("id", projectId);
  if (error) throw error;

  const existingRooms = current.rooms || [];
  const updates = rooms.map((name, index) => {
    const existing = existingRooms[index];
    if (existing?.id) {
      return supabaseClient.from("rooms").update({ name, sort_order: index + 1 }).eq("id", existing.id);
    }
    return supabaseClient.from("rooms").insert({
      company_id: state.companyId,
      project_id: projectId,
      name,
      sort_order: index + 1,
    });
  });
  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;

  state.selectedProjectId = projectId;
  await loadBackendData();
}

async function createPersonBackend(formData) {
  const password = String(formData.get("password") || "").trim();
  if (password.length < 6) {
    throw new Error("Informe uma senha inicial com pelo menos 6 caracteres.");
  }

  const response = await fetch("/api/create-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.session.access_token}`,
    },
    body: JSON.stringify({
      fullName: String(formData.get("name")).trim(),
      email: String(formData.get("email")).trim(),
      password,
      role: formData.get("role"),
      phone: String(formData.get("phone")).trim(),
      companyId: state.companyId,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Não foi possível criar o usuário.");
  await loadBackendData();
}

async function updatePersonBackend(formData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) throw new Error("Selecione um usuário para alterar.");
  const password = String(formData.get("password") || "").trim();
  const response = await fetch("/api/manage-user", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.session.access_token}`,
    },
    body: JSON.stringify({
      id,
      fullName: String(formData.get("name")).trim(),
      email: String(formData.get("email")).trim(),
      password,
      role: formData.get("role"),
      phone: String(formData.get("phone")).trim(),
      companyId: state.companyId,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Não foi possível alterar o usuário.");
  await loadBackendData();
}

async function deletePersonBackend(id) {
  const response = await fetch("/api/manage-user", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.session.access_token}`,
    },
    body: JSON.stringify({ id, companyId: state.companyId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Não foi possível excluir o usuário.");
  await loadBackendData();
}

function openPersonDialog(person = null) {
  personForm.reset();
  personForm.elements.id.value = person?.id || "";
  personForm.elements.name.value = person?.name || "";
  personForm.elements.email.value = person?.email || "";
  personForm.elements.password.value = "";
  personForm.elements.role.value = person?.role || "adm";
  personForm.elements.phone.value = person?.phone || "";
  personForm.elements.password.placeholder = person ? "Opcional: nova senha" : "Mínimo 6 caracteres";
  personForm.elements.password.required = !person && isRealBackend();
  personDialogTitle.textContent = person ? "Alterar pessoa" : "Nova pessoa";
  personDialog.showModal();
}

async function deletePerson(id) {
  const person = profileById(id);
  if (!person) return;
  if (state.backendMode && person.id === state.profile?.id) {
    showToast("Não é possível excluir o próprio usuário logado.");
    return;
  }
  const linked = state.projects.some((project) =>
    [project.medidorId, project.projetistaId, project.compradorId, project.montadorId, project.clienteUserId].includes(id),
  );
  if (linked) {
    showToast("Usuário vinculado a projeto. Remova o vínculo no projeto antes de excluir.");
    return;
  }
  if (isRealBackend()) {
    try {
      await deletePersonBackend(id);
      state.selectedPersonId = "";
      renderPersonSelect();
      renderPeople();
      showToast("Usuário excluído do painel de acessos.");
    } catch (error) {
      showToast(friendlyError(error, "Não foi possível excluir o usuário."));
    }
    return;
  }
  state.people = state.people.filter((item) => item.id !== id);
  state.selectedPersonId = "";
  persistPilotData();
  renderPersonSelect();
  renderPeople();
  showToast("Usuário excluído do piloto local.");
}

function renderMetrics(projects) {
  const visibleProjects = projects || filteredProjects();
  const supportNotes = visibleProjects.flatMap((project) =>
    project.rooms.filter((room) => room.supportNote).map((room) => ({ project, room })),
  );
  const pendingPurchases = visibleProjects.flatMap((project) =>
    project.purchases.filter((item) => item.approval === "pendente"),
  );
  const criticalAlerts = visibleProjects.flatMap((project) =>
    project.alerts.filter((alert) => alert.level === "critical" && alert.resolved !== true),
  );

  const items = [
    ["Projetos visíveis", visibleProjects.length],
    ["Compras para aprovar", pendingPurchases.length],
    ["Alertas críticos", criticalAlerts.length],
    ["Assistências abertas", supportNotes.length],
  ];

  metrics.innerHTML = items
    .map(
      ([label, value]) => `
      <article class="metric-card">
        <span>${label}</span>
        <strong>${value}</strong>
      </article>
    `,
    )
    .join("");

  if (state.role === "adm") {
    const overdue = visibleProjects.filter((project) => {
      const schedule = projectSchedule(project);
      return schedule.date && new Date(`${schedule.date}T23:59:59`) < new Date() && !["concluido", "assistencia"].includes(project.status);
    });
    const upcoming = visibleProjects.filter((project) => {
      const schedule = projectSchedule(project);
      if (!schedule.date) return false;
      const diff = new Date(`${schedule.date}T12:00:00`) - new Date();
      return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 7;
    });
    const unassigned = visibleProjects.filter((project) => !project.medidorId || !project.projetistaId || !project.montadorId);
    const priorityItems = [
      ["Projetos atrasados", overdue.length, "danger"],
      ["Próximos 7 dias", upcoming.length, "attention"],
      ["Sem responsável", unassigned.length, "info"],
      ["Compras pendentes", pendingPurchases.length, "attention"],
    ];
    metrics.insertAdjacentHTML(
      "beforeend",
      `<article class="metric-card priority-card">
        <span>Prioridades ADM</span>
        <div class="priority-list">
          ${priorityItems
            .map(([label, value, tone]) => `<span class="priority-item ${tone}"><strong>${value}</strong>${label}</span>`)
            .join("")}
        </div>
      </article>`,
    );
  }
}

function renderPersonSelect() {
  syncAccessUI();
  if (state.backendMode && state.profile && !state.profile.platform_admin) {
    roleSelect.disabled = true;
    personSelect.disabled = true;
    state.role = state.profile.role;
    state.activePersonId = state.profile.id;
    roleSelect.value = state.role;
    personSelect.innerHTML = `<option value="${escapeAttr(state.profile.id)}">${escapeHtml(state.profile.full_name || state.profile.email)}</option>`;
    userEmail.textContent = [state.profile.email, state.profile.phone].filter(Boolean).join(" · ");
    roleLabel.textContent = roleProfiles[state.role].label;
    pageTitle.textContent = roleProfiles[state.role].title;
    renderSessionBadge();
    return;
  }

  roleSelect.disabled = false;
  const candidates = peopleByRole(state.role);
  if (!candidates.some((person) => person.id === state.activePersonId)) {
    state.activePersonId = candidates[0]?.id ?? "";
  }

  personSelect.disabled = state.role === "adm" || candidates.length === 0 || state.backendMode;
  personSelect.innerHTML =
    state.role === "adm"
      ? `<option value="">${state.backendMode ? "Visão ADM real" : "Visão geral ADM"}</option>`
      : candidates.length
        ? candidates.map((person) => `<option value="${escapeAttr(person.id)}">${escapeHtml(person.name)}</option>`).join("")
        : `<option value="">Cadastre uma pessoa ${roleProfiles[state.role].label.toLowerCase()}</option>`;
  personSelect.value = state.activePersonId;

  const person = activePerson();
  userEmail.textContent = person
    ? [person.email, person.phone].filter(Boolean).join(" · ")
    : state.backendMode
      ? state.profile?.email || "Sessão Supabase ativa."
      : state.role === "adm"
      ? "Administrador visualiza todos os dados cadastrados neste navegador."
      : "Cadastre pessoas reais para simular permissões.";
  renderSessionBadge();
}

function renderSessionBadge() {
  const person = activePerson();
  const name = state.backendMode
    ? state.profile?.full_name || state.profile?.email || "Usuário conectado"
    : person?.name || "Modo local";
  const role = roleProfiles[state.role]?.label || "Perfil";
  sessionBadge.innerHTML = `<span>${escapeHtml(role)}</span><strong>${escapeHtml(name)}</strong>`;
}

function syncAccessUI() {
  const admin = !state.backendMode || requireAdmin();
  newProjectBtn.hidden = !admin;
  newPersonBtn.hidden = !admin;
  document.querySelector("[data-view='people']").hidden = !admin;
  if (!admin && state.view === "people") state.view = "dashboard";
  changePasswordBtn.hidden = !isRealBackend();
}

function fillRoleSelect(select, role, selectedId = "") {
  const people = peopleByRole(role);
  select.innerHTML =
    `<option value="">Sem cadastro ainda</option>` +
    people
      .map((person) => `<option value="${escapeAttr(person.id)}" ${person.id === selectedId ? "selected" : ""}>${escapeHtml(person.name)}</option>`)
      .join("");
}

function populateProjectFormPeople() {
  fillRoleSelect(projectForm.elements.medidor, "medidor");
  fillRoleSelect(projectForm.elements.projetista, "projetista");
  fillRoleSelect(projectForm.elements.comprador, "comprador");
  fillRoleSelect(projectForm.elements.montador, "montador");
  fillRoleSelect(projectForm.elements.clienteUser, "cliente");
}

function openProjectDialog(project = null) {
  if (state.backendMode && !requireAdmin()) {
    showToast("Somente administradores podem abrir ou editar projetos.");
    return;
  }
  projectForm.reset();
  populateProjectFormPeople();
  const editing = Boolean(project);
  projectDialogEyebrow.textContent = editing ? "Edição ADM" : "Abertura ADM";
  projectDialogTitle.textContent = editing ? "Editar projeto" : "Novo projeto";
  projectSubmitBtn.textContent = editing ? "Salvar alterações" : "Criar card";

  projectForm.elements.id.value = project?.id || "";
  projectForm.elements.number.value = project?.number || "";
  projectForm.elements.client.value = project?.client || "";
  projectForm.elements.address.value = project?.address || "";
  projectForm.elements.scheduleType.value = project?.scheduleType || "medicao";
  projectForm.elements.measurementDate.value = project?.measurementDate || "";
  projectForm.elements.installDate.value = project?.installDate || "";
  projectForm.elements.status.value = project?.status || "medicao";
  projectForm.elements.medidor.value = project?.medidorId || "";
  projectForm.elements.projetista.value = project?.projetistaId || "";
  projectForm.elements.comprador.value = project?.compradorId || "";
  projectForm.elements.montador.value = project?.montadorId || "";
  projectForm.elements.clienteUser.value = project?.clienteUserId || "";
  projectForm.elements.rooms.value = project?.rooms?.map((room) => room.name).join(", ") || "";
  dialog.showModal();
}

function openAlertDialog(projectId, alertId = "") {
  const project = getProject(projectId);
  if (!project) return;
  if (!["adm", "projetista"].includes(state.role)) {
    showToast("Somente ADM e projetista podem criar alertas.");
    return;
  }
  if (alertId && !requireAdmin()) {
    showToast("Somente administradores podem editar alertas existentes.");
    return;
  }
  const alert = project.alerts.find((item) => item.id === alertId);
  alertForm.reset();
  alertForm.elements.assignee.innerHTML =
    `<option value="">Sem responsável definido</option>` +
    state.people
      .filter((person) => person.active !== false && person.role !== "cliente")
      .map((person) => `<option value="${escapeAttr(person.id)}">${escapeHtml(person.name)} · ${escapeHtml(roleProfiles[person.role]?.label || person.role)}</option>`)
      .join("");
  alertDialogTitle.textContent = alert ? "Editar alerta" : "Novo alerta";
  alertForm.elements.projectId.value = projectId;
  alertForm.elements.alertId.value = alert?.id || "";
  alertForm.elements.level.value = alert?.level || "critical";
  alertForm.elements.assignee.value = alert?.assigneeId || "";
  alertForm.elements.dueDate.value = alert?.dueDate || "";
  alertForm.elements.status.value = alert?.status || (alert?.resolved ? "done" : "open");
  alertForm.elements.title.value = alert?.title || "";
  alertDialog.showModal();
}

function renderPeople() {
  contentGrid.classList.remove("accordion-layout");
  detailPanel.hidden = false;
  renderMetrics(filteredProjects());
  const visiblePeople = state.people.filter((person) => person.active !== false);
  const selectedId = state.selectedPersonId || visiblePeople[0]?.id || "";
  state.selectedPersonId = selectedId;
  const selected = profileById(selectedId);
  projectList.innerHTML = `
    <section class="person-manager">
      <label>
        Usuários cadastrados
        <select id="managedPersonSelect">
          ${
            visiblePeople.length
              ? visiblePeople
                  .map(
                    (person) =>
                      `<option value="${escapeAttr(person.id)}" ${person.id === selectedId ? "selected" : ""}>${escapeHtml(person.name)} · ${escapeHtml(roleProfiles[person.role]?.label || person.role)}</option>`,
                  )
                  .join("")
              : `<option value="">Nenhum usuário cadastrado</option>`
          }
        </select>
      </label>
      ${
        selected
          ? `
            <article class="person-card">
              <div>
                <strong>${escapeHtml(selected.name)}</strong>
                <span class="meta">${escapeHtml(selected.email || "E-mail não informado")}</span>
                <span class="meta">${escapeHtml(roleProfiles[selected.role]?.label || selected.role)} · ${escapeHtml(selected.phone || "Sem telefone")}</span>
              </div>
              <div class="action-row">
                <button class="secondary-action" data-edit-person="${escapeAttr(selected.id)}" type="button">Alterar</button>
                <button class="danger-action" data-delete-person="${escapeAttr(selected.id)}" type="button">Excluir</button>
              </div>
            </article>
          `
          : `<div class="empty-state">Cadastre o primeiro usuário real do piloto.</div>`
      }
    </section>
  `;
  detailPanel.innerHTML = `
    <p class="eyebrow">Cadastro</p>
    <h2>Usuários do sistema</h2>
    <p class="meta">O ADM pode criar, alterar e excluir acessos. Cada usuário só verá projetos onde estiver vinculado como responsável ou cliente.</p>
    ${
      requireAdmin()
        ? `<div class="action-row">
            <button class="primary-action" data-open-person type="button">Nova pessoa</button>
          </div>`
        : `<div class="empty-state">Somente administradores podem cadastrar acessos.</div>`
    }
  `;
  projectList.querySelector("#managedPersonSelect")?.addEventListener("change", (event) => {
    state.selectedPersonId = event.target.value;
    renderPeople();
  });
  projectList.querySelector("[data-edit-person]")?.addEventListener("click", (event) => {
    openPersonDialog(profileById(event.currentTarget.dataset.editPerson));
  });
  projectList.querySelector("[data-delete-person]")?.addEventListener("click", (event) => {
    deletePerson(event.currentTarget.dataset.deletePerson);
  });
  detailPanel.querySelector("[data-open-person]")?.addEventListener("click", () => openPersonDialog());
}

function openTour() {
  tourIndex = 0;
  tourLayer.hidden = false;
  renderTour();
}

function renderTour() {
  const steps = tourSteps[state.role] || tourSteps.adm;
  const step = steps[tourIndex];
  tourLayer.classList.add("is-transitioning");
  tourRole.textContent = `Tour ${roleProfiles[state.role].label}`;
  tourTitle.textContent = step.title;
  tourText.textContent = step.text;
  tourProgress.innerHTML = steps
    .map((_, index) => `<span class="tour-dot ${index === tourIndex ? "active" : ""}"></span>`)
    .join("");
  tourPrevBtn.disabled = tourIndex === 0;
  tourNextBtn.textContent = tourIndex === steps.length - 1 ? "Concluir" : "Próximo";
  window.setTimeout(() => {
    positionTour(step);
    window.requestAnimationFrame(() => tourLayer.classList.remove("is-transitioning"));
  }, 110);
}

function closeTour(markDone = false) {
  if (markDone) localStorage.setItem(tourKey(), "done");
  clearTourTarget();
  tourLayer.hidden = true;
}

function clearTourTarget() {
  document.querySelectorAll("[data-tour-active]").forEach((element) => {
    element.removeAttribute("data-tour-active");
  });
}

function positionTour(step) {
  clearTourTarget();
  const candidate = document.querySelector(step.selector);
  const target = candidate && !candidate.hidden ? candidate : tourBtn;
  target.dataset.tourActive = "true";
  target.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });

  window.setTimeout(() => {
    const margin = 18;
    const rect = target.getBoundingClientRect();
    const popRect = tourPopover.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;
    let left = step.side === "right" ? rect.right + margin : rect.left - popRect.width - margin;
    let top = rect.top + rect.height / 2 - popRect.height / 2;

    left = Math.max(14, Math.min(left, window.innerWidth - popRect.width - 14));
    top = Math.max(14, Math.min(top, window.innerHeight - popRect.height - 14));

    tourPopover.style.left = `${left}px`;
    tourPopover.style.top = `${top}px`;

    const popX = left + (targetX < left ? 0 : popRect.width);
    const popY = top + popRect.height / 2;
    const deltaX = popX - targetX;
    const deltaY = popY - targetY;
    const length = Math.hypot(deltaX, deltaY);
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    tourLine.style.left = `${targetX}px`;
    tourLine.style.top = `${targetY}px`;
    tourLine.style.width = `${length}px`;
    tourLine.style.transform = `rotate(${angle}deg)`;
  }, 260);
}

function nextTourStep() {
  const steps = tourSteps[state.role] || tourSteps.adm;
  if (tourIndex === steps.length - 1) {
    localStorage.setItem(tourKey(), "done");
    closeTour();
    return;
  }
  tourIndex += 1;
  renderTour();
}

function previousTourStep() {
  if (tourIndex === 0) return;
  tourIndex -= 1;
  renderTour();
}

function maybeOpenFirstAccessTour() {
  if (!localStorage.getItem(tourKey())) {
    window.setTimeout(openTour, 650);
  }
}

function tourKey() {
  const identity = state.backendMode ? state.profile?.email || state.profile?.id || "real" : state.activePersonId || "local";
  return `marcenaria-flow-tour-${TOUR_VERSION}-${state.role}-${identity}`;
}

function renderProjects() {
  contentGrid.classList.add("accordion-layout");
  detailPanel.hidden = true;
  const projects = filteredProjects();
  renderMetrics(projects);

  if (!projects.some((project) => project.id === state.selectedProjectId)) {
    state.selectedProjectId = "";
  }

  if (!projects.length) {
    projectList.innerHTML = `
      <div class="empty-state">
        Nenhum projeto vinculado a este usuário no momento.
      </div>
    `;
    return;
  }

  projectList.innerHTML = projects
    .map(
      (project) => {
        const schedule = projectSchedule(project);
        const critical = hasCriticalAlert(project);
        const expanded = project.id === state.selectedProjectId;
        return `
      <article class="project-card ${expanded ? "active" : ""} ${critical ? "has-critical-alert" : ""}" data-project-id="${escapeAttr(project.id)}">
        <button class="project-card-header" data-project-toggle="${escapeAttr(project.id)}" type="button" aria-expanded="${expanded ? "true" : "false"}">
          <div>
            <span class="eyebrow">${escapeHtml(project.number)}</span>
            <h3>${escapeHtml(project.client)}</h3>
            <p class="meta">${escapeHtml(project.address)}</p>
            <div class="project-tags">
              ${critical ? `<span class="alert-pill critical">Alerta crítico</span>` : ""}
              <span class="tag">${scheduleLabels[schedule.type]} ${formatDate(schedule.date)}</span>
              <span class="tag">${escapeHtml(statusLabels[project.status] || project.status)}</span>
            </div>
          </div>
          <span class="project-chevron" aria-hidden="true">${expanded ? "−" : "+"}</span>
        </button>
        ${expanded ? renderExpandedProject(project) : ""}
      </article>
    `;
      },
    )
    .join("");

  projectList.querySelectorAll("[data-project-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedProjectId = state.selectedProjectId === button.dataset.projectToggle ? "" : button.dataset.projectToggle;
      renderProjects();
    });
  });

  projectList.querySelectorAll("[data-action]").forEach((button) => {
    const projectId = button.closest("[data-project-id]")?.dataset.projectId;
    if (projectId) button.addEventListener("click", () => handleAction(button.dataset.action, projectId, button.dataset.extra));
  });

  projectList.querySelectorAll("[data-edit-alert]").forEach((button) => {
    const projectId = button.closest("[data-project-id]")?.dataset.projectId;
    if (projectId) button.addEventListener("click", () => openAlertDialog(projectId, button.dataset.editAlert));
  });

  projectList.querySelectorAll("[data-delete-alert]").forEach((button) => {
    const projectId = button.closest("[data-project-id]")?.dataset.projectId;
    if (projectId) button.addEventListener("click", () => deleteAlert(projectId, button.dataset.deleteAlert));
  });

  projectList.querySelectorAll("[data-check]").forEach((input) => {
    const projectId = input.closest("[data-project-id]")?.dataset.projectId;
    if (projectId) input.addEventListener("change", () => updateRoomCheck(projectId, input.dataset.room, input.dataset.check, input.checked));
  });

  projectList.querySelectorAll("[data-support-note]").forEach((input) => {
    const projectId = input.closest("[data-project-id]")?.dataset.projectId;
    if (projectId) input.addEventListener("change", () => updateSupportNote(projectId, input.dataset.room, input.value));
  });

  projectList.querySelectorAll("[data-measure]").forEach((input) => {
    const projectId = input.closest("[data-project-id]")?.dataset.projectId;
    if (projectId) input.addEventListener("change", () => updateRoomMeasurement(projectId, input.dataset.room, input.dataset.measure, input.value));
  });

  projectList.querySelectorAll("[data-room-photo-input]").forEach((input) => {
    const projectId = input.closest("[data-project-id]")?.dataset.projectId;
    if (projectId) input.addEventListener("change", () => uploadRoomPhotos(projectId, input.dataset.room, input.files));
  });

  projectList.querySelectorAll("[data-edit-photo]").forEach((button) => {
    const projectId = button.closest("[data-project-id]")?.dataset.projectId;
    if (projectId) button.addEventListener("click", () => renamePhoto(projectId, button.dataset.editPhoto));
  });

  projectList.querySelectorAll("[data-delete-photo]").forEach((button) => {
    const projectId = button.closest("[data-project-id]")?.dataset.projectId;
    if (projectId) button.addEventListener("click", () => deletePhoto(projectId, button.dataset.deletePhoto));
  });
}

function renderExpandedProject(project) {
  const schedule = projectSchedule(project);
  if (state.role === "cliente") return renderClientProject(project, schedule);

  return `
    <div class="project-expanded">
      ${renderProjectTimeline(project)}
      <div class="project-tags">
        <span class="tag">Agenda ativa: ${escapeHtml(scheduleLabels[schedule.type])}</span>
        ${project.measurementDate ? `<span class="tag">Medição ${formatDate(project.measurementDate)}</span>` : ""}
        ${project.installDate ? `<span class="tag">Montagem ${formatDate(project.installDate)}</span>` : ""}
        <span class="tag">Medidor ${escapeHtml(personName(project.medidorId))}</span>
        <span class="tag">Projetista ${escapeHtml(personName(project.projetistaId))}</span>
        <span class="tag">Montador ${escapeHtml(personName(project.montadorId))}</span>
      </div>
      <div class="action-row">
        ${requireAdmin() ? `<button class="secondary-action" data-action="editProject" type="button">Editar projeto</button>` : ""}
        ${roleActionButtons(project)}
      </div>
    </div>
    ${renderOperationalChecklist(project)}
    ${renderRooms(project)}
    ${state.role === "cliente" ? "" : renderPurchases(project)}
    ${state.role === "cliente" ? "" : renderAlerts(project)}
    ${renderDrive(project)}
    ${renderActivity(project)}
  `;
}

function renderClientProject(project, schedule) {
  const doneRooms = project.rooms.filter((room) => room.installDone || room.designDone).length;
  const progress = project.rooms.length ? Math.round((doneRooms / project.rooms.length) * 100) : 0;
  return `
    <div class="project-expanded client-project">
      ${renderProjectTimeline(project)}
      <section class="client-summary">
        <div>
          <span class="eyebrow">Status da obra</span>
          <strong>${escapeHtml(statusLabels[project.status] || project.status)}</strong>
          <span class="meta">Próxima referência: ${escapeHtml(scheduleLabels[schedule.type])} ${formatDate(schedule.date)}</span>
        </div>
        <div class="progress-ring" style="--progress:${progress}%">
          <strong>${progress}%</strong>
          <span>evolução</span>
        </div>
      </section>
      ${renderOperationalChecklist(project)}
      ${renderRooms(project)}
      ${renderDrive(project)}
    </div>
  `;
}

function renderProjectTimeline(project) {
  const currentIndex = Math.max(0, projectFlow.indexOf(project.status));
  return `
    <ol class="timeline" aria-label="Linha do tempo do projeto">
      ${projectFlow
        .map((status, index) => {
          const stateClass = index < currentIndex ? "done" : index === currentIndex ? "current" : "future";
          return `<li class="${stateClass}"><span></span><strong>${escapeHtml(statusLabels[status] || status)}</strong></li>`;
        })
        .join("")}
    </ol>
  `;
}

function renderOperationalChecklist(project) {
  const items = checklistByRole[state.role] || checklistByRole.adm;
  return `
    <section class="detail-block checklist-panel">
      <h3>Checklist ${escapeHtml(roleProfiles[state.role]?.label || "Operacional")}</h3>
      <div class="checklist-grid">
        ${items
          .map(([label, test]) => {
            const done = Boolean(test(project));
            return `<span class="check-item ${done ? "done" : ""}"><i>${done ? "✓" : "•"}</i>${escapeHtml(label)}</span>`;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderActivity(project) {
  const items = (project.activity || []).slice(0, 8);
  return `
    <section class="detail-block activity-panel">
      <h3>Histórico</h3>
      ${
        items.length
          ? `<div class="activity-list">${items
              .map(
                (item) => `
                <article>
                  <strong>${escapeHtml(item.label)}</strong>
                  <span class="meta">${escapeHtml(item.actor || "Sistema")} · ${formatDateTime(item.at)}</span>
                </article>`,
              )
              .join("")}</div>`
          : `<div class="empty-state">As próximas ações deste projeto aparecerão aqui.</div>`
      }
    </section>
  `;
}

function roleActionButtons(project) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.address)}`;
  const actions = {
    adm: `
      <button class="primary-action" data-action="approveAll" type="button">Aprovar compras</button>
      <button class="secondary-action" data-action="openAlert" type="button">Novo alerta</button>
      <button class="secondary-action" data-action="setSchedule" data-extra="medicao" type="button">Usar data medição</button>
      <button class="secondary-action" data-action="setSchedule" data-extra="montagem" type="button">Usar data montagem</button>
    `,
    medidor: `
      <button class="primary-action" data-action="takePhotos" type="button">Abrir câmera</button>
      <button class="secondary-action" data-action="finishMeasurement" type="button">Liberar projeto</button>
    `,
    projetista: `
      <button class="primary-action" data-action="startDesign" type="button">Start</button>
      <button class="secondary-action" data-action="openAlert" type="button">Novo alerta</button>
      <button class="secondary-action" data-action="requestPurchase" type="button">Solicitar material</button>
      <button class="secondary-action" data-action="uploadFiles" type="button">Anexar ficheiros</button>
    `,
    comprador: `
      <button class="primary-action" data-action="markPurchased" type="button">Marcar comprado</button>
      <button class="secondary-action" data-action="attachInvoice" type="button">Anexar fatura</button>
    `,
    montador: `
      <a class="primary-action link-button" href="${escapeAttr(mapsUrl)}" target="_blank" rel="noreferrer">Abrir rota</a>
      <button class="secondary-action" data-action="reportIssue" type="button">Relatar pendência</button>
    `,
    cliente: `
      <span class="tag">Status: ${escapeHtml(statusLabels[project.status] ?? project.status)}</span>
      <span class="tag">Montagem ${formatDate(project.installDate)}</span>
    `,
  };
  return actions[state.role] || "";
}

function renderRooms(project) {
  const client = state.role === "cliente";
  const canMeasure = ["adm", "medidor"].includes(state.role);
  return `
    <section class="detail-block">
      <h3>${client ? "Evolução por ambiente" : "Ambientes"}</h3>
      <div class="room-list">
        ${project.rooms
          .map(
            (room) => `
            <article class="room">
              <div class="room-header">
                <div>
                  <strong>${escapeHtml(room.name)}</strong>
                  <span class="meta">${client ? (room.installDone ? "Montagem concluída" : room.designDone ? "Projeto concluído" : "Em andamento") : `${Number(room.measurementPhotos) || 0} fotos de medição`}</span>
                </div>
                ${client ? `<span class="tag">${room.installDone ? "Concluído" : "Em andamento"}</span>` : `<span class="tag">${escapeHtml(drivePath(project, `Medicao / ${room.name}`))}</span>`}
              </div>
              ${
                client
                  ? ""
                  : `${renderMeasurementPanel(project, room, canMeasure)}
                    <div class="checks">
                      <label><input data-check="designDone" data-room="${escapeAttr(room.name)}" type="checkbox" ${room.designDone ? "checked" : ""} ${canEditRoomField("designDone") ? "" : "disabled"}> Projeto concluído</label>
                      <label><input data-check="installDone" data-room="${escapeAttr(room.name)}" type="checkbox" ${room.installDone ? "checked" : ""} ${canEditRoomField("installDone") ? "" : "disabled"}> Montagem concluída</label>
                      <label>
                        Nota assistência
                        <input data-support-note data-room="${escapeAttr(room.name)}" value="${escapeAttr(room.supportNote)}" placeholder="Sem pendência" ${canEditRoomField("supportNote") ? "" : "disabled"} />
                      </label>
                    </div>`
              }
            </article>
          `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderMeasurementPanel(project, room, canMeasure) {
  const measurements = room.measurements || {};
  const photos = (project.files.medicao || []).filter((file) => file.roomId === room.id || file.roomName === room.name);
  return `
    <div class="measurement-panel">
      <div class="measurement-grid">
        <label>Comprimento / largura<input data-measure="width" data-room="${escapeAttr(room.name)}" value="${escapeAttr(measurements.width || "")}" placeholder="Ex: 2,40 m" ${canMeasure ? "" : "disabled"} /></label>
        <label>Altura<input data-measure="height" data-room="${escapeAttr(room.name)}" value="${escapeAttr(measurements.height || "")}" placeholder="Ex: 2,70 m" ${canMeasure ? "" : "disabled"} /></label>
        <label>Profundidade<input data-measure="depth" data-room="${escapeAttr(room.name)}" value="${escapeAttr(measurements.depth || "")}" placeholder="Ex: 0,60 m" ${canMeasure ? "" : "disabled"} /></label>
        <label>Metragem linear<input data-measure="linear" data-room="${escapeAttr(room.name)}" value="${escapeAttr(measurements.linear || "")}" placeholder="Ex: 5,80 m" ${canMeasure ? "" : "disabled"} /></label>
      </div>
      <label class="measurement-notes">Observações de medição<input data-measure="notes" data-room="${escapeAttr(room.name)}" value="${escapeAttr(measurements.notes || "")}" placeholder="Paredes fora de esquadro, pontos elétricos, recortes..." ${canMeasure ? "" : "disabled"} /></label>
      <div class="photo-toolbar">
        <strong>Fotos da medição</strong>
        ${
          canMeasure
            ? `<label class="secondary-action compact-action photo-capture">Abrir câmera<input data-room-photo-input data-room="${escapeAttr(room.name)}" type="file" accept="image/*" capture="environment" multiple /></label>`
            : ""
        }
      </div>
      <div class="photo-grid">
        ${
          photos.length
            ? photos.map((photo) => renderPhotoThumb(photo, canMeasure)).join("")
            : `<span class="empty-state inline-empty">Nenhuma foto registrada neste ambiente.</span>`
        }
      </div>
    </div>
  `;
}

function renderPhotoThumb(photo, canManage) {
  const src = photo.url || photo.preview || "";
  return `
    <article class="photo-thumb">
      ${src ? `<a href="${escapeAttr(src)}" target="_blank" rel="noreferrer"><img src="${escapeAttr(src)}" alt="${escapeAttr(photo.name)}" loading="lazy" /></a>` : `<div class="photo-placeholder">Imagem</div>`}
      <div>
        <strong>${escapeHtml(photo.name)}</strong>
        ${
          canManage
            ? `<span class="photo-actions">
                <button class="secondary-action compact-action" data-edit-photo="${escapeAttr(photo.id)}" type="button">Editar</button>
                <button class="danger-action compact-action" data-delete-photo="${escapeAttr(photo.id)}" type="button">Excluir</button>
              </span>`
            : ""
        }
      </div>
    </article>
  `;
}

function renderPurchases(project) {
  const items =
    project.purchases.length === 0
      ? `<div class="empty-state">Nenhuma compra solicitada para este projeto.</div>`
      : project.purchases
          .map(
            (item) => `
        <article class="purchase-item">
          <div>
            <strong>${escapeHtml(item.item)}</strong>
            <span class="meta">${escapeHtml(item.qty)} · ${escapeHtml(personName(item.requestedById))}</span>
          </div>
          <div class="project-tags">
            <span class="tag">${escapeHtml(item.approval)}</span>
            <span class="tag">${escapeHtml(item.purchaseStatus)}</span>
          </div>
        </article>
      `,
          )
          .join("");
  return `
    <section class="detail-block">
      <h3>Lista de compras</h3>
      <div class="purchase-list">${items}</div>
    </section>
  `;
}

function renderAlerts(project) {
  const canEditAlerts = requireAdmin();
  const visibleAlerts = project.alerts.filter((alert) => alert.resolved !== true);
  const alerts =
    visibleAlerts.length === 0
      ? `<div class="empty-state">Nenhum alerta registrado para este projeto.</div>`
      : visibleAlerts
          .map(
            (alert) => `
            <article class="alert-item alert-${escapeAttr(alert.level)}">
              <div>
                <strong>${escapeHtml(alert.title)}</strong>
                <span class="meta">
                  Criado por ${escapeHtml(alert.source)}
                  ${alert.assigneeId ? ` · Resp. ${escapeHtml(personName(alert.assigneeId))}` : ""}
                  ${alert.dueDate ? ` · Prazo ${formatDate(alert.dueDate)}` : ""}
                </span>
              </div>
              <div class="alert-actions">
                <span class="alert-pill ${escapeAttr(alert.level)}">${escapeHtml(alertLabels[alert.level] || alert.level)}</span>
                <span class="tag">${alert.status === "done" ? "Resolvido" : "Aberto"}</span>
                ${canEditAlerts && alert.id ? `<button class="secondary-action compact-action" data-edit-alert="${escapeAttr(alert.id)}" type="button">Editar</button>` : ""}
                ${canEditAlerts && alert.id ? `<button class="danger-action compact-action" data-delete-alert="${escapeAttr(alert.id)}" type="button">Excluir</button>` : ""}
              </div>
            </article>
          `,
          )
          .join("");
  return `
    <section class="detail-block">
      <h3>Alertas visuais</h3>
      <div class="alert-list">${alerts}</div>
    </section>
  `;
}

function renderDrive(project) {
  const allFolders = [
    ["Medição", "medicao"],
    ["Engenharia", "engenharia"],
    ["Obra", "obra"],
  ];
  const folders = state.role === "cliente" || state.role === "montador" ? [["Obra", "obra"]] : allFolders;
  return `
    <section class="detail-block">
      <h3>Arquivos do projeto</h3>
      <div class="folder-grid">
        ${folders
          .map(
            ([label, key]) => `
            <article class="folder">
              <div>
                <strong>${escapeHtml(drivePath(project, label))}</strong>
                <small>${(project.files[key] || []).length} ficheiros</small>
                <div class="file-row">
                  ${
                    (project.files[key] || []).length
                      ? project.files[key].map((file) => `<span class="file-chip">${escapeHtml(file.name || file)}</span>`).join("")
                      : `<span class="file-chip">Pasta criada automaticamente</span>`
                  }
                </div>
              </div>
            </article>
          `,
          )
          .join("")}
      </div>
    </section>
  `;
}

async function handleAction(action, projectId, extra = "") {
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) return;

  if (action === "editProject") {
    openProjectDialog(project);
    return;
  }

  if (action === "openAlert") {
    openAlertDialog(project.id);
    return;
  }

  if (isRealBackend()) {
    try {
      await handleBackendAction(action, project, extra);
      const label = actionActivityLabel(action, extra);
      if (label) {
        if (action === "setSchedule") project.scheduleType = extra === "montagem" ? "montagem" : "medicao";
        addActivity(project, label);
        await persistProjectNotes(project);
      }
      await loadBackendData();
    } catch (error) {
      showToast(friendlyError(error, "Não foi possível atualizar o projeto."));
    }
    return;
  }

  if (action === "approveAll") {
    project.purchases.forEach((item) => {
      if (item.approval === "pendente") item.approval = "aprovado";
    });
    showToast("Compras pendentes aprovadas e liberadas para o comprador.");
  }

  if (action === "setSchedule") {
    project.scheduleType = extra === "montagem" ? "montagem" : "medicao";
    showToast(`Agenda ativa alterada para data da ${project.scheduleType === "medicao" ? "medição" : "montagem"}.`);
  }

  if (action === "addCriticalAlert") {
    project.alerts.unshift({ id: `a-${Date.now()}`, level: "critical", title: "Revisar informação crítica antes da execução", status: "open", source: "ADM", resolved: false });
    showToast("Alerta vermelho criado para a equipa de montagem.");
  }

  if (action === "takePhotos") {
    project.rooms.forEach((room) => {
      room.measurementPhotos += 1;
    });
    showToast("Abra o ambiente desejado e use Abrir câmera para anexar fotos reais.");
  }

  if (action === "finishMeasurement") {
    project.status = "desenvolvimento";
    showToast("Medição finalizada. O projeto foi liberado para o projetista.");
  }

  if (action === "startDesign") {
    project.status = "desenvolvimento";
    project.startedAt = new Date().toLocaleString("pt-BR");
    showToast("Start registado. O ADM foi notificado.");
  }

  if (action === "requestPurchase") {
    project.purchases.push({
      id: `c-${Date.now()}`,
      item: "Ferragem especial sob medida",
      qty: "1 kit",
      requestedById: activePerson()?.id || "",
      approval: "pendente",
      purchaseStatus: "aguardando",
      invoice: "",
    });
    showToast("Material enviado para análise do ADM.");
  }

  if (action === "uploadFiles") {
    project.files.engenharia.push(`Fabrica_${project.number}.plano`);
    project.files.obra.push(`Obra_${project.number}.pdf`);
    showToast("Ficheiros enviados para Engenharia e Obra no Drive.");
  }

  if (action === "markPurchased") {
    project.purchases.forEach((item) => {
      if (item.approval === "aprovado" && item.purchaseStatus !== "entregue") item.purchaseStatus = "comprado";
    });
    showToast("Itens aprovados marcados como comprados.");
  }

  if (action === "attachInvoice") {
    project.purchases.forEach((item) => {
      if (item.approval === "aprovado" && !item.invoice) item.invoice = `NF-${project.number}.pdf`;
    });
    showToast("Fatura anexada ao pedido de compra.");
  }

  if (action === "reportIssue") {
    const firstOpenRoom = project.rooms.find((room) => !room.installDone) ?? project.rooms[0];
    firstOpenRoom.supportNote = "Pendência reportada na montagem. ADM deve fabricar reposição.";
    project.alerts.unshift({ id: `a-${Date.now()}`, level: "critical", title: `Assistência aberta em ${firstOpenRoom.name}`, status: "open", source: "Montador", resolved: false });
    showToast("Pendência enviada ao ADM com alerta vermelho imediato.");
  }

  const label = actionActivityLabel(action, extra);
  if (label) addActivity(project, label);
  persistPilotData();
  renderProjects();
}

function actionActivityLabel(action, extra = "") {
  const labels = {
    approveAll: "Compras aprovadas pelo ADM",
    setSchedule: `Agenda ativa alterada para ${extra === "medicao" ? "medição" : "montagem"}`,
    addCriticalAlert: "Alerta crítico criado",
    takePhotos: "Fotos de medição registradas",
    finishMeasurement: "Medição finalizada",
    startDesign: "Desenvolvimento iniciado",
    requestPurchase: "Material solicitado para aprovação",
    uploadFiles: "Arquivos técnicos anexados",
    markPurchased: "Itens marcados como comprados",
    attachInvoice: "Fatura anexada",
    reportIssue: "Pendência de montagem relatada",
  };
  return labels[action] || "";
}

async function handleBackendAction(action, project, extra = "") {
  if (action === "approveAll") {
    const { error } = await supabaseClient
      .from("purchases")
      .update({ approval: "aprovado" })
      .eq("project_id", project.id)
      .eq("approval", "pendente");
    if (error) throw error;
    showToast("Compras pendentes aprovadas e liberadas para o comprador.");
  }

  if (action === "setSchedule") {
    const scheduleType = extra === "montagem" ? "montagem" : "medicao";
    const notes = scheduleNotes({
      scheduleType,
      measurementDate: project.measurementDate,
      installDate: project.installDate,
    }, project.notesData || {});
    const { error } = await supabaseClient.from("projects").update({ notes }).eq("id", project.id);
    if (error) throw error;
    showToast(`Agenda ativa alterada para data da ${scheduleType === "medicao" ? "medição" : "montagem"}.`);
  }

  if (action === "addCriticalAlert") {
    const { error } = await supabaseClient.from("alerts").insert({
      company_id: state.companyId,
      project_id: project.id,
      level: "critical",
      title: "Revisar informação crítica antes da execução",
      description: alertDescription({ status: "open" }),
      created_by: state.profile.id,
    });
    if (error) throw error;
    showToast("Alerta vermelho criado para a equipa de montagem.");
  }

  if (action === "takePhotos") {
    const updates = project.rooms.map((room) =>
      supabaseClient
        .from("rooms")
        .update({ measurement_photos_count: room.measurementPhotos + 1 })
        .eq("id", room.id),
    );
    const results = await Promise.all(updates);
    const failed = results.find((result) => result.error);
    if (failed) throw failed.error;
    showToast("Fotos adicionadas às pastas de medição por ambiente.");
  }

  if (action === "finishMeasurement") {
    const { error } = await supabaseClient.from("projects").update({ status: "desenvolvimento" }).eq("id", project.id);
    if (error) throw error;
    showToast("Medição finalizada. O projeto foi liberado para o projetista.");
  }

  if (action === "startDesign") {
    const { error } = await supabaseClient
      .from("projects")
      .update({ status: "desenvolvimento", started_design_at: new Date().toISOString() })
      .eq("id", project.id);
    if (error) throw error;
    await supabaseClient.from("alerts").insert({
      company_id: state.companyId,
      project_id: project.id,
      level: "info",
      title: "Projetista iniciou o desenvolvimento",
      description: alertDescription({ status: "open" }),
      created_by: state.profile.id,
    });
    showToast("Start registado. O ADM foi notificado.");
  }

  if (action === "requestPurchase") {
    const { error } = await supabaseClient.from("purchases").insert({
      company_id: state.companyId,
      project_id: project.id,
      material: "Ferragem especial sob medida",
      quantity: "1 kit",
      requested_by: state.profile.id,
      approval: "pendente",
      purchase_status: "aguardando",
    });
    if (error) throw error;
    showToast("Material enviado para análise do ADM.");
  }

  if (action === "uploadFiles") {
    const files = [
      { category: "engenharia", file_name: `Fabrica_${project.number}.plano` },
      { category: "obra", file_name: `Obra_${project.number}.pdf` },
    ];
    const { error } = await supabaseClient.from("project_files").insert(
      files.map((file) => ({
        company_id: state.companyId,
        project_id: project.id,
        category: file.category,
        file_name: file.file_name,
        storage_path: `${state.companyId}/${project.id}/${file.category}/${file.file_name}`,
        uploaded_by: state.profile.id,
      })),
    );
    if (error) throw error;
    showToast("Ficheiros registrados em Engenharia e Obra.");
  }

  if (action === "markPurchased") {
    const { error } = await supabaseClient
      .from("purchases")
      .update({ purchase_status: "comprado" })
      .eq("project_id", project.id)
      .eq("approval", "aprovado");
    if (error) throw error;
    showToast("Itens aprovados marcados como comprados.");
  }

  if (action === "attachInvoice") {
    const { error } = await supabaseClient
      .from("purchases")
      .update({ invoice_path: `NF-${project.number}.pdf` })
      .eq("project_id", project.id)
      .eq("approval", "aprovado")
      .is("invoice_path", null);
    if (error) throw error;
    showToast("Fatura anexada ao pedido de compra.");
  }

  if (action === "reportIssue") {
    const room = project.rooms.find((item) => !item.installDone) || project.rooms[0];
    if (!room) throw new Error("Cadastre um ambiente antes de relatar pendência.");
    const { error: roomError } = await supabaseClient
      .from("rooms")
      .update({ support_note: "Pendência reportada na montagem. ADM deve fabricar reposição.", support_open: true })
      .eq("id", room.id);
    if (roomError) throw roomError;
    const { error: alertError } = await supabaseClient.from("alerts").insert({
      company_id: state.companyId,
      project_id: project.id,
      room_id: room.id,
      level: "critical",
      title: `Assistência aberta em ${room.name}`,
      description: alertDescription({ status: "open" }),
      created_by: state.profile.id,
    });
    if (alertError) throw alertError;
    showToast("Pendência enviada ao ADM com alerta vermelho imediato.");
  }
}

async function saveAlertFromForm(formData) {
  const projectId = String(formData.get("projectId") || "");
  const alertId = String(formData.get("alertId") || "");
  const title = String(formData.get("title") || "").trim();
  const level = ["critical", "attention", "info"].includes(formData.get("level")) ? formData.get("level") : "critical";
  const assigneeId = String(formData.get("assignee") || "");
  const dueDate = String(formData.get("dueDate") || "");
  const status = formData.get("status") === "done" ? "done" : "open";
  const project = getProject(projectId);
  if (!project) throw new Error("Projeto não encontrado para o alerta.");
  if (!title) throw new Error("Informe a mensagem do alerta.");

  if (isRealBackend()) {
    const payload = {
      level,
      title,
      description: alertDescription({ assigneeId, dueDate, status }),
      resolved: status === "done",
      resolved_at: status === "done" ? new Date().toISOString() : null,
    };
    const result = alertId
      ? await supabaseClient.from("alerts").update(payload).eq("id", alertId)
      : await supabaseClient.from("alerts").insert({
          company_id: state.companyId,
          project_id: projectId,
          level,
          title,
          description: alertDescription({ assigneeId, dueDate, status }),
          resolved: status === "done",
          resolved_at: status === "done" ? new Date().toISOString() : null,
          created_by: state.profile.id,
        });
    if (result.error) throw result.error;
    addActivity(project, alertId ? `Alerta atualizado: ${title}` : `Alerta criado: ${title}`);
    await persistProjectNotes(project);
    await loadBackendData();
    return;
  }

  if (alertId) {
    const alert = project.alerts.find((item) => item.id === alertId);
    if (alert) Object.assign(alert, { level, title, assigneeId, dueDate, status, resolved: status === "done", source: activePerson()?.name || "ADM" });
    addActivity(project, `Alerta atualizado: ${title}`);
  } else {
    project.alerts.unshift({ id: `a-${Date.now()}`, level, title, assigneeId, dueDate, status, source: activePerson()?.name || "ADM", resolved: status === "done" });
    addActivity(project, `Alerta criado: ${title}`);
  }
  persistPilotData();
}

async function deleteAlert(projectId, alertId) {
  if (!requireAdmin()) {
    showToast("Somente administradores podem excluir alertas.");
    return;
  }
  const project = getProject(projectId);
  const alert = project?.alerts.find((item) => item.id === alertId);
  if (!project || !alert) return;
  const confirmed = window.confirm(`Excluir o alerta "${alert.title}" deste projeto?`);
  if (!confirmed) return;

  if (isRealBackend()) {
    try {
      const { error } = await supabaseClient
        .from("alerts")
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", alertId);
      if (error) throw error;
      addActivity(project, `Alerta excluído: ${alert.title}`);
      await persistProjectNotes(project);
      await loadBackendData();
      renderProjects();
      showToast("Alerta excluído da interface do projeto.");
    } catch (error) {
      showToast(friendlyError(error, "Não foi possível excluir o alerta."));
    }
    return;
  }

  project.alerts = project.alerts.filter((item) => item.id !== alertId);
  addActivity(project, `Alerta excluído: ${alert.title}`);
  persistPilotData();
  renderProjects();
  showToast("Alerta excluído do projeto.");
}

async function updateRoomCheck(projectId, roomName, key, checked) {
  const room = findRoom(projectId, roomName);
  if (!room) return;
  if (isRealBackend()) {
    const project = getProject(projectId);
    const column = key === "designDone" ? "design_done" : "install_done";
    const { error } = await supabaseClient.from("rooms").update({ [column]: checked }).eq("id", room.id);
    if (error) {
      showToast(friendlyError(error, "Não foi possível atualizar o checklist."));
      return;
    }
    room[key] = checked;
    if (project) {
      addActivity(project, `${key === "designDone" ? "Checklist de projeto" : "Checklist de montagem"} atualizado em ${roomName}`);
      await persistProjectNotes(project);
    }
    showToast(key === "designDone" ? "Checklist do projetista atualizado." : "Checklist de montagem atualizado.");
    await loadBackendData();
    return;
  }
  room[key] = checked;
  const project = getProject(projectId);
  if (project) addActivity(project, `${key === "designDone" ? "Checklist de projeto" : "Checklist de montagem"} atualizado em ${roomName}`);
  persistPilotData();
  showToast(key === "designDone" ? "Checklist do projetista atualizado." : "Checklist de montagem atualizado.");
}

async function updateSupportNote(projectId, roomName, value) {
  const room = findRoom(projectId, roomName);
  if (!room) return;
  if (isRealBackend()) {
    const project = getProject(projectId);
    const trimmed = value.trim();
    const { error: roomError } = await supabaseClient
      .from("rooms")
      .update({ support_note: trimmed || null, support_open: Boolean(trimmed) })
      .eq("id", room.id);
    if (roomError) {
      showToast(friendlyError(roomError, "Não foi possível registrar a nota."));
      return;
    }
    if (trimmed) {
      await supabaseClient.from("alerts").insert({
        company_id: state.companyId,
        project_id: project.id,
        room_id: room.id,
        level: "critical",
        title: `Assistência aberta em ${roomName}`,
        description: alertDescription({ status: "open" }),
        created_by: state.profile.id,
      });
      addActivity(project, `Assistência aberta em ${roomName}`);
      await persistProjectNotes(project);
      showToast("Nota registrada e alerta vermelho enviado ao ADM.");
    }
    await loadBackendData();
    return;
  }
  room.supportNote = value;
  if (value.trim()) {
    const project = state.projects.find((item) => item.id === projectId);
    project.alerts.unshift({ id: `a-${Date.now()}`, level: "critical", title: `Assistência aberta em ${roomName}`, status: "open", source: "Montador", resolved: false });
    addActivity(project, `Assistência aberta em ${roomName}`);
    showToast("Nota registrada e alerta vermelho enviado ao ADM.");
  }
  persistPilotData();
  renderProjects();
}

function findRoom(projectId, roomName) {
  return state.projects.find((item) => item.id === projectId)?.rooms.find((room) => room.name === roomName);
}

function findPhoto(project, photoId) {
  return Object.values(project.files || {})
    .flat()
    .find((file) => file?.id === photoId);
}

async function updateRoomMeasurement(projectId, roomName, key, value) {
  const project = getProject(projectId);
  const room = findRoom(projectId, roomName);
  if (!project || !room) return;
  room.measurements = { ...(room.measurements || {}), [key]: value.trim() };
  if (isRealBackend()) {
    const { error } = await supabaseClient.from("rooms").update({ measurement_notes: measurementNotesPayload(room.measurements) }).eq("id", room.id);
    if (error) {
      showToast(friendlyError(error, "Não foi possível salvar a metragem."));
      return;
    }
    addActivity(project, `Metragem atualizada em ${roomName}`);
    await persistProjectNotes(project);
    await loadBackendData();
  } else {
    addActivity(project, `Metragem atualizada em ${roomName}`);
    persistPilotData();
  }
  showToast("Metragem salva no ambiente.");
}

async function uploadRoomPhotos(projectId, roomName, fileList) {
  const project = getProject(projectId);
  const room = findRoom(projectId, roomName);
  const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
  if (!project || !room || !files.length) return;

  if (isRealBackend()) {
    try {
      for (const file of files) {
        const safeName = `${Date.now()}-${file.name}`.replace(/[^\w.\-]+/g, "-");
        const storagePath = `${state.companyId}/${project.id}/medicao/${room.id}/${safeName}`;
        const upload = await supabaseClient.storage.from("project-files").upload(storagePath, file, { contentType: file.type, upsert: false });
        if (upload.error) throw upload.error;
        const { error } = await supabaseClient.from("project_files").insert({
          company_id: state.companyId,
          project_id: project.id,
          room_id: room.id,
          category: "medicao",
          file_name: file.name,
          storage_path: storagePath,
          uploaded_by: state.profile.id,
        });
        if (error) throw error;
      }
      const { error: roomError } = await supabaseClient
        .from("rooms")
        .update({ measurement_photos_count: room.measurementPhotos + files.length })
        .eq("id", room.id);
      if (roomError) throw roomError;
      addActivity(project, `${files.length} foto(s) adicionada(s) em ${roomName}`);
      await persistProjectNotes(project);
      await loadBackendData();
      showToast("Fotos enviadas para a pasta de medição.");
    } catch (error) {
      showToast(friendlyError(error, "Não foi possível enviar as fotos. Confirme se o Storage project-files está configurado."));
    }
    return;
  }

  const loaded = await Promise.all(files.map(readFileAsDataUrl));
  project.files.medicao = project.files.medicao || [];
  loaded.forEach(({ file, url }) => {
    project.files.medicao.unshift({ id: `photo-${Date.now()}-${Math.random().toString(16).slice(2)}`, name: file.name, roomName, preview: url, url });
  });
  room.measurementPhotos += loaded.length;
  addActivity(project, `${loaded.length} foto(s) adicionada(s) em ${roomName}`);
  persistPilotData();
  renderProjects();
  showToast("Fotos adicionadas ao ambiente.");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ file, url: reader.result });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function renamePhoto(projectId, photoId) {
  const project = getProject(projectId);
  const photo = project ? findPhoto(project, photoId) : null;
  if (!project || !photo) return;
  const nextName = window.prompt("Nome/legenda da foto", photo.name);
  if (!nextName || nextName.trim() === photo.name) return;
  const fileName = nextName.trim().slice(0, 120);

  if (isRealBackend()) {
    const ok = await manageProjectFile({ method: "PATCH", fileId: photo.id, fileName });
    if (!ok) return;
    addActivity(project, `Foto renomeada: ${fileName}`);
    await persistProjectNotes(project);
    await loadBackendData();
  } else {
    photo.name = fileName;
    addActivity(project, `Foto renomeada: ${fileName}`);
    persistPilotData();
    renderProjects();
  }
  showToast("Foto atualizada.");
}

async function deletePhoto(projectId, photoId) {
  const project = getProject(projectId);
  const photo = project ? findPhoto(project, photoId) : null;
  if (!project || !photo) return;
  if (!window.confirm(`Excluir a foto "${photo.name}"?`)) return;

  if (isRealBackend()) {
    const ok = await manageProjectFile({ method: "DELETE", fileId: photo.id });
    if (!ok) return;
    addActivity(project, `Foto excluída: ${photo.name}`);
    await persistProjectNotes(project);
    await loadBackendData();
  } else {
    Object.keys(project.files || {}).forEach((category) => {
      project.files[category] = (project.files[category] || []).filter((file) => file.id !== photoId);
    });
    addActivity(project, `Foto excluída: ${photo.name}`);
    persistPilotData();
    renderProjects();
  }
  showToast("Foto excluída.");
}

async function manageProjectFile({ method, fileId, fileName = "" }) {
  try {
    const response = await fetch("/api/manage-file", {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.session?.access_token || ""}`,
      },
      body: JSON.stringify({ fileId, fileName }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Falha ao gerir arquivo.");
    return true;
  } catch (error) {
    showToast(friendlyError(error, "Não foi possível gerir a foto."));
    return false;
  }
}

function drivePath(project, suffix) {
  return `Projetos / ${project.number} - ${project.client} / ${suffix}`;
}

function formatDate(value) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function formatDateTime(value) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function setView(view) {
  if (view === "people" && state.backendMode && !requireAdmin()) {
    view = "dashboard";
  }
  state.view = view;
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === view));

  const labels = {
    dashboard: ["Projetos em andamento", roleProfiles[state.role].subtitle],
    projects: ["Projetos", "Responsáveis, ambientes, datas e status geral."],
    people: ["Pessoas", "Equipe, clientes e permissões que serão usadas no piloto."],
    purchases: ["Compras", "Materiais, aprovação, compra, entrega e faturas."],
    alerts: ["Alertas", "Ocorrências críticas, atenção e informações de obra."],
    drive: ["Drive", "Pastas por projeto, cliente, etapa e ambiente."],
  };
  [mainPanelTitle.textContent, mainPanelSubtitle.textContent] = labels[view];
  if (view === "people") {
    renderPeople();
    return;
  }
  renderProjects();
}

roleSelect.addEventListener("change", () => {
  state.role = roleSelect.value;
  const profile = roleProfiles[state.role];
  roleLabel.textContent = profile.label;
  pageTitle.textContent = profile.title;
  document.body.dataset.role = state.role;
  renderPersonSelect();
  persistPilotData();
  showToast(`Filtro de acesso aplicado para ${profile.label}.`);
  setView(state.view);
});

personSelect.addEventListener("change", () => {
  state.activePersonId = personSelect.value;
  persistPilotData();
  renderPersonSelect();
  renderProjects();
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

document.querySelectorAll("[data-status-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    state.statusFilter = button.dataset.statusFilter;
    document.querySelectorAll("[data-status-filter]").forEach((item) => item.classList.toggle("active", item === button));
    renderProjects();
  });
});

searchInput.addEventListener("input", () => {
  state.search = searchInput.value;
  renderProjects();
});

newProjectBtn.addEventListener("click", () => {
  openProjectDialog();
});

newPersonBtn.addEventListener("click", () => {
  if (state.backendMode && !requireAdmin()) {
    showToast("Somente administradores podem cadastrar acessos.");
    return;
  }
  openPersonDialog();
});

exportDataBtn.addEventListener("click", exportPilotData);

importDataBtn.addEventListener("click", () => {
  importDataInput.click();
});

importDataInput.addEventListener("change", () => {
  const [file] = importDataInput.files;
  if (file) importPilotData(file);
  importDataInput.value = "";
});

tourBtn.addEventListener("click", openTour);
tourCloseBtn.addEventListener("click", () => closeTour(true));
tourNextBtn.addEventListener("click", nextTourStep);
tourPrevBtn.addEventListener("click", previousTourStep);
window.addEventListener("resize", () => {
  if (!tourLayer.hidden) renderTour();
});

document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(`#${button.dataset.closeDialog}`)?.close();
  });
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabaseClient) {
    showToast("Não foi possível carregar a conexão segura. Recarregue a página e tente novamente.");
    return;
  }
  const formData = new FormData(loginForm);
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: String(formData.get("email")).trim(),
    password: String(formData.get("password")),
  });
  if (error) {
    showToast("Login não autorizado. Confira e-mail e senha.");
    return;
  }
  try {
    await startBackendSession(data.session);
    showToast("Login real conectado ao Supabase.");
  } catch (loadError) {
    showToast(friendlyError(loadError, "Login feito, mas não foi possível carregar o perfil."));
  }
});

forgotPasswordBtn.addEventListener("click", async () => {
  if (!supabaseClient) {
    showToast("Não foi possível carregar a conexão segura. Recarregue a página e tente novamente.");
    return;
  }
  const email = String(new FormData(loginForm).get("email") || "").trim();
  if (!email) {
    showToast("Informe seu e-mail antes de solicitar a recuperação.");
    return;
  }
  const redirectTo = window.location.origin === PRODUCTION_URL ? window.location.origin : PRODUCTION_URL;
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  showToast(
    error
      ? friendlyError(error, "Não foi possível enviar recuperação agora. Use a URL publicada e confirme o e-mail no Supabase.")
      : "Enviamos um link de recuperação para o e-mail informado.",
  );
});

changePasswordBtn.addEventListener("click", () => {
  passwordDialog.showModal();
});

passwordForm.addEventListener("submit", async (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  const newPassword = String(new FormData(passwordForm).get("newPassword") || "").trim();
  if (newPassword.length < 6) {
    showToast("A nova senha deve ter pelo menos 6 caracteres.");
    return;
  }
  const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
  if (error) {
    showToast("Não foi possível alterar a senha agora.");
    return;
  }
  passwordForm.reset();
  passwordDialog.close();
  showToast("Senha alterada com sucesso.");
});

logoutBtn.addEventListener("click", async () => {
  if (supabaseClient) await supabaseClient.auth.signOut();
  state.backendMode = false;
  state.session = null;
  state.profile = null;
  state.companyId = "";
  showAuthGate(true);
  showToast("Sessão encerrada.");
});

projectForm.addEventListener("submit", async (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  const formData = new FormData(projectForm);
  const editingId = String(formData.get("id") || "").trim();
  let schedule;
  try {
    schedule = validateSchedule(formData);
  } catch (error) {
    showToast(error.message);
    return;
  }
  const rooms = roomsFromForm(formData);
  if (isRealBackend()) {
    try {
      if (editingId) {
        await updateProjectBackend(formData, rooms);
      } else {
        await createProjectBackend(formData, rooms);
      }
      projectForm.reset();
      dialog.close();
      showToast(editingId ? "Projeto atualizado com sucesso." : "Card real criado com ambientes e permissões.");
    } catch (error) {
      showToast(friendlyError(error, editingId ? "Não foi possível atualizar o projeto." : "Não foi possível criar o projeto."));
    }
    return;
  }

  if (editingId) {
    const project = getProject(editingId);
    if (!project) {
      showToast("Projeto não encontrado para edição.");
      return;
    }
    Object.assign(project, {
      number: formData.get("number"),
      client: formData.get("client"),
      address: formData.get("address"),
      installDate: schedule.installDate,
      measurementDate: schedule.measurementDate,
      scheduleType: schedule.scheduleType,
      status: formData.get("status") || project.status,
      medidorId: formData.get("medidor"),
      projetistaId: formData.get("projetista"),
      compradorId: formData.get("comprador"),
      montadorId: formData.get("montador"),
      clienteUserId: formData.get("clienteUser"),
      rooms: rooms.map((name, index) => project.rooms[index] || { name, measurementPhotos: 0, designDone: false, installDone: false, supportNote: "" }),
    });
    project.rooms.forEach((room, index) => {
      room.name = rooms[index] || room.name;
    });
    addActivity(project, "Projeto atualizado");
    projectForm.reset();
    dialog.close();
    persistPilotData();
    showToast("Projeto atualizado com sucesso.");
    renderProjects();
    return;
  }

  const project = {
    id: `p-${Date.now()}`,
    number: formData.get("number"),
    client: formData.get("client"),
    address: formData.get("address"),
    installDate: schedule.installDate,
    measurementDate: schedule.measurementDate,
    scheduleType: schedule.scheduleType,
    status: formData.get("status") || "medicao",
    medidorId: formData.get("medidor"),
    projetistaId: formData.get("projetista"),
    compradorId: formData.get("comprador"),
    montadorId: formData.get("montador"),
    clienteUserId: formData.get("clienteUser"),
    startedAt: "",
    rooms: rooms.map((name) => ({ name, measurementPhotos: 0, designDone: false, installDone: false, supportNote: "" })),
    purchases: [],
    alerts: [{ id: `a-${Date.now()}`, level: "info", title: "Projeto criado pelo ADM", source: "ADM", resolved: false }],
    files: { medicao: [], engenharia: [], obra: [] },
    activity: [{ id: `log-${Date.now()}`, at: new Date().toISOString(), actor: actorName(), label: "Projeto criado" }],
    notesData: {},
  };
  state.projects.unshift(project);
  state.selectedProjectId = project.id;
  projectForm.reset();
  dialog.close();
  persistPilotData();
  showToast("Card criado com ambientes e pastas-base do Drive.");
  renderProjects();
});

alertForm.addEventListener("submit", async (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  const formData = new FormData(alertForm);
  const editing = Boolean(String(formData.get("alertId") || ""));
  try {
    await saveAlertFromForm(formData);
    alertForm.reset();
    alertDialog.close();
    showToast(editing ? "Alerta atualizado com sucesso." : "Alerta criado e destacado no projeto.");
    renderProjects();
  } catch (error) {
    showToast(friendlyError(error, "Não foi possível salvar o alerta."));
  }
});

personForm.addEventListener("submit", async (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  const formData = new FormData(personForm);
  const editingId = String(formData.get("id") || "").trim();
  if (isRealBackend()) {
    try {
      if (editingId) {
        await updatePersonBackend(formData);
      } else {
        await createPersonBackend(formData);
      }
      personForm.reset();
      personDialog.close();
      showToast(editingId ? "Usuário alterado com sucesso." : "Acesso criado no Supabase. O usuário já pode entrar com e-mail e senha.");
    } catch (error) {
      showToast(friendlyError(error, "Não foi possível cadastrar a pessoa."));
    }
    return;
  }
  if (editingId) {
    const person = profileById(editingId);
    if (!person) return;
    person.name = String(formData.get("name")).trim();
    person.email = String(formData.get("email")).trim();
    person.role = formData.get("role");
    person.phone = String(formData.get("phone")).trim();
    personForm.reset();
    personDialog.close();
    persistPilotData();
    renderPersonSelect();
    renderPeople();
    showToast("Pessoa alterada no piloto local.");
    return;
  }
  const person = {
    id: `u-${Date.now()}`,
    name: String(formData.get("name")).trim(),
    email: String(formData.get("email")).trim(),
    role: formData.get("role"),
    phone: String(formData.get("phone")).trim(),
  };
  state.people.push(person);
  if (person.role === state.role) state.activePersonId = person.id;
  personForm.reset();
  personDialog.close();
  persistPilotData();
  renderPersonSelect();
  if (state.view === "people") renderPeople();
  showToast("Pessoa cadastrada para o piloto.");
});

bootApp().catch((error) => {
  showToast(friendlyError(error, "Não foi possível iniciar o app."));
  showAuthGate(true);
});

if ("serviceWorker" in navigator && window.location.protocol === "https:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
