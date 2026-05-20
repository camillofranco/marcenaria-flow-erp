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
const TOUR_VERSION = "v2";
const SUPABASE_URL = "https://oouxuleswyfjqfczlouh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BX6RrygWROrTcdmjC8oKCw_gxre0b5e";
const supabaseClient =
  window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const state = {
  role: "adm",
  view: "dashboard",
  statusFilter: "todos",
  selectedProjectId: "",
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
const projectList = document.querySelector("#projectList");
const detailPanel = document.querySelector("#detailPanel");
const searchInput = document.querySelector("#searchInput");
const toast = document.querySelector("#toast");
const dialog = document.querySelector("#projectDialog");
const projectForm = document.querySelector("#projectForm");
const personDialog = document.querySelector("#personDialog");
const personForm = document.querySelector("#personForm");
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
const logoutBtn = document.querySelector("#logoutBtn");

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

let tourIndex = 0;

const tourSteps = {
  adm: [
    { selector: "#newProjectBtn", title: "Novo projeto", text: "Abra o card do cliente, defina responsáveis, endereço, data de montagem e ambientes.", side: "left" },
    { selector: "#newPersonBtn", title: "Pessoas e acessos", text: "Cadastre ADM, medidor, projetista, comprador, montador e cliente. Só o ADM cria acessos.", side: "left" },
    { selector: "[data-view='purchases']", title: "Compras", text: "Acompanhe materiais solicitados, aprove o que deve ir ao comprador e mantenha rastreabilidade.", side: "right" },
    { selector: "[data-view='alerts']", title: "Alertas", text: "Use alertas críticos para evitar erros de obra, assistência e retrabalho.", side: "right" },
  ],
  medidor: [
    { selector: "[data-view='projects']", title: "Projetos atribuídos", text: "Veja somente os projetos ligados ao seu usuário e organize a medição por ambiente.", side: "right" },
    { selector: "#projectList", title: "Medição por ambiente", text: "Abra o projeto, confira ambientes e registre fotos técnicas no fluxo de medição.", side: "right" },
    { selector: "#detailPanel", title: "Liberação", text: "Ao terminar, libere o projeto para desenvolvimento do projetista.", side: "left" },
  ],
  projetista: [
    { selector: "#detailPanel", title: "Start e checklist", text: "Registre o início, marque ambientes concluídos e sinalize evolução técnica.", side: "left" },
    { selector: "[data-view='purchases']", title: "Solicitação de compra", text: "Peça ferragens, LEDs e itens especiais para análise do ADM.", side: "right" },
    { selector: "[data-view='drive']", title: "Arquivos técnicos", text: "Separe arquivos de fábrica e arquivos liberados para a obra.", side: "right" },
  ],
  comprador: [
    { selector: "[data-view='purchases']", title: "Compras aprovadas", text: "Controle itens aprovados pelo ADM, status de compra e entrega na fábrica.", side: "right" },
    { selector: "#detailPanel", title: "Comprovantes", text: "Anexe faturas e mantenha o histórico do suprimento ligado ao projeto.", side: "left" },
  ],
  montador: [
    { selector: "#detailPanel", title: "Obra no celular", text: "Consulte rota, arquivos de obra, alertas críticos e checklist de montagem.", side: "left" },
    { selector: "[data-view='alerts']", title: "Pendências", text: "Relate assistência para gerar alerta imediato ao ADM.", side: "right" },
  ],
  cliente: [
    { selector: "#projectList", title: "Acompanhamento", text: "Veja status do projeto, previsão de montagem e evolução dos ambientes.", side: "right" },
    { selector: "[data-view='drive']", title: "Arquivos liberados", text: "O cliente acessa apenas os arquivos próprios para visualização.", side: "right" },
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
  if (state.backendMode) return true;
  if (state.role === "adm") return true;
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
    supabaseClient.from("profiles").select("*").eq("company_id", state.companyId).order("full_name"),
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
  };
}

function mapProject(project, rooms, purchases, alerts, files) {
  const projectFiles = { medicao: [], engenharia: [], obra: [], compras: [], assistencia: [] };
  files
    .filter((file) => file.project_id === project.id)
    .forEach((file) => {
      if (!projectFiles[file.category]) projectFiles[file.category] = [];
      projectFiles[file.category].push(file.file_name);
    });

  return {
    id: project.id,
    number: project.project_number,
    client: project.client_name,
    address: project.address,
    installDate: project.install_date,
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
        id: alert.id,
        level: alert.level,
        title: alert.title,
        source: personName(alert.created_by),
      })),
    files: projectFiles,
  };
}

function nullIfEmpty(value) {
  return value ? value : null;
}

async function createProjectBackend(formData, rooms) {
  const { data: project, error } = await supabaseClient
    .from("projects")
    .insert({
      company_id: state.companyId,
      project_number: String(formData.get("number")).trim(),
      client_name: String(formData.get("client")).trim(),
      address: String(formData.get("address")).trim(),
      install_date: formData.get("installDate"),
      status: "medicao",
      medidor_id: nullIfEmpty(formData.get("medidor")),
      projetista_id: nullIfEmpty(formData.get("projetista")),
      comprador_id: nullIfEmpty(formData.get("comprador")),
      montador_id: nullIfEmpty(formData.get("montador")),
      cliente_id: nullIfEmpty(formData.get("clienteUser")),
      created_by: state.profile.id,
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
    created_by: state.profile.id,
  });

  state.selectedProjectId = project.id;
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

function renderMetrics(projects) {
  const supportNotes = state.projects.flatMap((project) =>
    project.rooms.filter((room) => room.supportNote).map((room) => ({ project, room })),
  );
  const pendingPurchases = state.projects.flatMap((project) =>
    project.purchases.filter((item) => item.approval === "pendente"),
  );
  const criticalAlerts = state.projects.flatMap((project) =>
    project.alerts.filter((alert) => alert.level === "critical"),
  );

  const items = [
    ["Projetos visíveis", projects.length],
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
}

function renderPersonSelect() {
  syncAccessUI();
  if (state.backendMode && state.profile && !state.profile.platform_admin) {
    roleSelect.disabled = true;
    personSelect.disabled = true;
    state.role = state.profile.role;
    state.activePersonId = state.profile.id;
    roleSelect.value = state.role;
    personSelect.innerHTML = `<option value="${state.profile.id}">${state.profile.full_name || state.profile.email}</option>`;
    userEmail.textContent = [state.profile.email, state.profile.phone].filter(Boolean).join(" · ");
    roleLabel.textContent = roleProfiles[state.role].label;
    pageTitle.textContent = roleProfiles[state.role].title;
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
        ? candidates.map((person) => `<option value="${person.id}">${person.name}</option>`).join("")
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
}

function syncAccessUI() {
  const admin = !state.backendMode || requireAdmin();
  newProjectBtn.hidden = !admin;
  newPersonBtn.hidden = !admin;
}

function fillRoleSelect(select, role, selectedId = "") {
  const people = peopleByRole(role);
  select.innerHTML =
    `<option value="">Sem cadastro ainda</option>` +
    people.map((person) => `<option value="${person.id}" ${person.id === selectedId ? "selected" : ""}>${person.name}</option>`).join("");
}

function populateProjectFormPeople() {
  fillRoleSelect(projectForm.elements.medidor, "medidor");
  fillRoleSelect(projectForm.elements.projetista, "projetista");
  fillRoleSelect(projectForm.elements.comprador, "comprador");
  fillRoleSelect(projectForm.elements.montador, "montador");
  fillRoleSelect(projectForm.elements.clienteUser, "cliente");
}

function renderPeople() {
  renderMetrics(filteredProjects());
  const grouped = Object.keys(roleProfiles)
    .map((role) => {
      const people = peopleByRole(role);
      return `
        <section class="detail-block">
          <h3>${roleProfiles[role].label}</h3>
          <div class="people-grid">
            ${
              people.length
                ? people
                    .map(
                      (person) => `
                        <article class="person-card">
                          <div>
                            <strong>${person.name}</strong>
                            <span class="meta">${person.email || "E-mail não informado"}</span>
                          </div>
                          <span class="tag">${person.phone || "Sem telefone"}</span>
                        </article>
                      `,
                    )
                    .join("")
                : `<div class="empty-state">Nenhuma pessoa cadastrada neste perfil.</div>`
            }
          </div>
        </section>
      `;
    })
    .join("");
  projectList.innerHTML = grouped;
  detailPanel.innerHTML = `
    <p class="eyebrow">Cadastro</p>
    <h2>Pessoas do piloto</h2>
    <p class="meta">Cadastre a equipe real da marcenaria e os clientes que acompanharão projetos. Depois vincule essas pessoas no Novo projeto.</p>
    ${
      requireAdmin()
        ? `<div class="action-row">
            <button class="primary-action" data-open-person type="button">Nova pessoa</button>
          </div>`
        : `<div class="empty-state">Somente administradores podem cadastrar acessos.</div>`
    }
  `;
  detailPanel.querySelector("[data-open-person]")?.addEventListener("click", () => personDialog.showModal());
}

function openTour() {
  tourIndex = 0;
  tourLayer.hidden = false;
  renderTour();
}

function renderTour() {
  const steps = tourSteps[state.role] || tourSteps.adm;
  const step = steps[tourIndex];
  tourRole.textContent = `Tour ${roleProfiles[state.role].label}`;
  tourTitle.textContent = step.title;
  tourText.textContent = step.text;
  tourProgress.innerHTML = steps
    .map((_, index) => `<span class="tour-dot ${index === tourIndex ? "active" : ""}"></span>`)
    .join("");
  tourPrevBtn.disabled = tourIndex === 0;
  tourNextBtn.textContent = tourIndex === steps.length - 1 ? "Concluir" : "Próximo";
  positionTour(step);
}

function closeTour() {
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
  const target = document.querySelector(step.selector) || tourBtn;
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
  return `marcenaria-flow-tour-${TOUR_VERSION}-${state.role}`;
}

function renderProjects() {
  const projects = filteredProjects();
  renderMetrics(projects);

  if (!projects.some((project) => project.id === state.selectedProjectId)) {
    state.selectedProjectId = projects[0]?.id ?? "";
  }

  if (!projects.length) {
    projectList.innerHTML = `
      <div class="empty-state">
        Nenhum projeto encontrado para este perfil. Cadastre pessoas reais e crie o primeiro projeto do piloto.
      </div>
    `;
    detailPanel.innerHTML = `<div class="empty-state">Use Nova pessoa e Novo projeto para iniciar o piloto com dados reais.</div>`;
    return;
  }

  projectList.innerHTML = projects
    .map(
      (project) => `
      <article class="project-card ${project.id === state.selectedProjectId ? "active" : ""}" data-project-id="${project.id}">
        <div>
          <h3>${project.number} · ${project.client}</h3>
          <p class="meta">${project.address}</p>
          <div class="project-tags">
            <span class="tag">Montagem ${formatDate(project.installDate)}</span>
            <span class="tag">Medidor ${personName(project.medidorId)}</span>
            <span class="tag">Projetista ${personName(project.projetistaId)}</span>
            <span class="tag">Montador ${personName(project.montadorId)}</span>
          </div>
        </div>
        <div>
          <span class="status-pill status-${project.status}">${statusLabels[project.status]}</span>
        </div>
      </article>
    `,
    )
    .join("");

  document.querySelectorAll("[data-project-id]").forEach((card) => {
    card.addEventListener("click", () => {
      state.selectedProjectId = card.dataset.projectId;
      renderProjects();
    });
  });

  renderDetail();
}

function renderDetail() {
  const project = state.projects.find((item) => item.id === state.selectedProjectId);
  if (!project) return;

  detailPanel.innerHTML = `
    <div>
      <p class="eyebrow">${project.number}</p>
      <h2>${project.client}</h2>
      <p class="meta">${project.address}</p>
      <div class="action-row">
        ${roleActionButtons(project)}
      </div>
    </div>
    ${renderRooms(project)}
    ${state.role === "cliente" ? "" : renderPurchases(project)}
    ${state.role === "cliente" ? "" : renderAlerts(project)}
    ${renderDrive(project)}
  `;

  detailPanel.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action, project.id, button.dataset.extra));
  });

  detailPanel.querySelectorAll("[data-check]").forEach((input) => {
    input.addEventListener("change", () => updateRoomCheck(project.id, input.dataset.room, input.dataset.check, input.checked));
  });

  detailPanel.querySelectorAll("[data-support-note]").forEach((input) => {
    input.addEventListener("change", () => updateSupportNote(project.id, input.dataset.room, input.value));
  });
}

function roleActionButtons(project) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.address)}`;
  const actions = {
    adm: `
      <button class="primary-action" data-action="approveAll" type="button">Aprovar compras</button>
      <button class="secondary-action" data-action="addCriticalAlert" type="button">Alerta crítico</button>
    `,
    medidor: `
      <button class="primary-action" data-action="takePhotos" type="button">Abrir câmera</button>
      <button class="secondary-action" data-action="finishMeasurement" type="button">Liberar projeto</button>
    `,
    projetista: `
      <button class="primary-action" data-action="startDesign" type="button">Start</button>
      <button class="secondary-action" data-action="requestPurchase" type="button">Solicitar material</button>
      <button class="secondary-action" data-action="uploadFiles" type="button">Anexar ficheiros</button>
    `,
    comprador: `
      <button class="primary-action" data-action="markPurchased" type="button">Marcar comprado</button>
      <button class="secondary-action" data-action="attachInvoice" type="button">Anexar fatura</button>
    `,
    montador: `
      <a class="primary-action link-button" href="${mapsUrl}" target="_blank" rel="noreferrer">Abrir rota</a>
      <button class="secondary-action" data-action="reportIssue" type="button">Relatar pendência</button>
    `,
    cliente: `
      <span class="tag">Status: ${statusLabels[project.status] ?? project.status}</span>
      <span class="tag">Montagem ${formatDate(project.installDate)}</span>
    `,
  };
  return actions[state.role] || "";
}

function renderRooms(project) {
  return `
    <section class="detail-block">
      <h3>Ambientes</h3>
      <div class="room-list">
        ${project.rooms
          .map(
            (room) => `
            <article class="room">
              <div class="room-header">
                <div>
                  <strong>${room.name}</strong>
                  <span class="meta">${room.measurementPhotos} fotos de medição</span>
                </div>
                <span class="tag">${drivePath(project, `Medicao / ${room.name}`)}</span>
              </div>
              <div class="checks">
                <label><input data-check="designDone" data-room="${room.name}" type="checkbox" ${room.designDone ? "checked" : ""} ${canEditRoomField("designDone") ? "" : "disabled"}> Projeto concluído</label>
                <label><input data-check="installDone" data-room="${room.name}" type="checkbox" ${room.installDone ? "checked" : ""} ${canEditRoomField("installDone") ? "" : "disabled"}> Montagem concluída</label>
                <label>
                  Nota assistência
                  <input data-support-note data-room="${room.name}" value="${room.supportNote}" placeholder="Sem pendência" ${canEditRoomField("supportNote") ? "" : "disabled"} />
                </label>
              </div>
            </article>
          `,
          )
          .join("")}
      </div>
    </section>
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
            <strong>${item.item}</strong>
            <span class="meta">${item.qty} · ${personName(item.requestedById)}</span>
          </div>
          <div class="project-tags">
            <span class="tag">${item.approval}</span>
            <span class="tag">${item.purchaseStatus}</span>
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
  return `
    <section class="detail-block">
      <h3>Alertas visuais</h3>
      <div class="alert-list">
        ${project.alerts
          .map(
            (alert) => `
            <article class="alert-item alert-${alert.level}">
              <div>
                <strong>${alert.title}</strong>
                <span class="meta">Criado por ${alert.source}</span>
              </div>
              <span class="alert-pill ${alert.level}">${alertLabels[alert.level]}</span>
            </article>
          `,
          )
          .join("")}
      </div>
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
                <strong>${drivePath(project, label)}</strong>
                <small>${(project.files[key] || []).length} ficheiros</small>
                <div class="file-row">
                  ${
                    (project.files[key] || []).length
                      ? project.files[key].map((file) => `<span class="file-chip">${file}</span>`).join("")
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

async function handleAction(action, projectId) {
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) return;

  if (isRealBackend()) {
    try {
      await handleBackendAction(action, project);
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

  if (action === "addCriticalAlert") {
    project.alerts.unshift({ level: "critical", title: "Revisar informação crítica antes da execução", source: "ADM" });
    showToast("Alerta vermelho criado para a equipa de montagem.");
  }

  if (action === "takePhotos") {
    project.rooms.forEach((room) => {
      room.measurementPhotos += 1;
    });
    showToast("Fotos adicionadas e enviadas para as pastas de medição por ambiente.");
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
    project.alerts.unshift({ level: "critical", title: `Assistência aberta em ${firstOpenRoom.name}`, source: "Montador" });
    showToast("Pendência enviada ao ADM com alerta vermelho imediato.");
  }

  persistPilotData();
  renderProjects();
}

async function handleBackendAction(action, project) {
  if (action === "approveAll") {
    const { error } = await supabaseClient
      .from("purchases")
      .update({ approval: "aprovado" })
      .eq("project_id", project.id)
      .eq("approval", "pendente");
    if (error) throw error;
    showToast("Compras pendentes aprovadas e liberadas para o comprador.");
  }

  if (action === "addCriticalAlert") {
    const { error } = await supabaseClient.from("alerts").insert({
      company_id: state.companyId,
      project_id: project.id,
      level: "critical",
      title: "Revisar informação crítica antes da execução",
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
      created_by: state.profile.id,
    });
    if (alertError) throw alertError;
    showToast("Pendência enviada ao ADM com alerta vermelho imediato.");
  }
}

async function updateRoomCheck(projectId, roomName, key, checked) {
  const room = findRoom(projectId, roomName);
  if (!room) return;
  if (isRealBackend()) {
    const column = key === "designDone" ? "design_done" : "install_done";
    const { error } = await supabaseClient.from("rooms").update({ [column]: checked }).eq("id", room.id);
    if (error) {
      showToast(friendlyError(error, "Não foi possível atualizar o checklist."));
      return;
    }
    room[key] = checked;
    showToast(key === "designDone" ? "Checklist do projetista atualizado." : "Checklist de montagem atualizado.");
    await loadBackendData();
    return;
  }
  room[key] = checked;
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
        created_by: state.profile.id,
      });
      showToast("Nota registrada e alerta vermelho enviado ao ADM.");
    }
    await loadBackendData();
    return;
  }
  room.supportNote = value;
  if (value.trim()) {
    const project = state.projects.find((item) => item.id === projectId);
    project.alerts.unshift({ level: "critical", title: `Assistência aberta em ${roomName}`, source: "Montador" });
    showToast("Nota registrada e alerta vermelho enviado ao ADM.");
  }
  persistPilotData();
  renderProjects();
}

function findRoom(projectId, roomName) {
  return state.projects.find((item) => item.id === projectId)?.rooms.find((room) => room.name === roomName);
}

function drivePath(project, suffix) {
  return `Projetos / ${project.number} - ${project.client} / ${suffix}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function setView(view) {
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
  if (state.backendMode && !requireAdmin()) {
    showToast("Somente administradores podem abrir novos projetos.");
    return;
  }
  populateProjectFormPeople();
  dialog.showModal();
});

newPersonBtn.addEventListener("click", () => {
  if (state.backendMode && !requireAdmin()) {
    showToast("Somente administradores podem cadastrar acessos.");
    return;
  }
  personDialog.showModal();
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
tourCloseBtn.addEventListener("click", closeTour);
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
  const rooms = String(formData.get("rooms") || "Ambiente 1")
    .split(",")
    .map((room) => room.trim())
    .filter(Boolean);
  if (isRealBackend()) {
    try {
      await createProjectBackend(formData, rooms);
      projectForm.reset();
      dialog.close();
      showToast("Card real criado com ambientes e permissões.");
    } catch (error) {
      showToast(friendlyError(error, "Não foi possível criar o projeto."));
    }
    return;
  }
  const project = {
    id: `p-${Date.now()}`,
    number: formData.get("number"),
    client: formData.get("client"),
    address: formData.get("address"),
    installDate: formData.get("installDate"),
    status: "medicao",
    medidorId: formData.get("medidor"),
    projetistaId: formData.get("projetista"),
    compradorId: formData.get("comprador"),
    montadorId: formData.get("montador"),
    clienteUserId: formData.get("clienteUser"),
    startedAt: "",
    rooms: rooms.map((name) => ({ name, measurementPhotos: 0, designDone: false, installDone: false, supportNote: "" })),
    purchases: [],
    alerts: [{ level: "info", title: "Projeto criado pelo ADM", source: "ADM" }],
    files: { medicao: [], engenharia: [], obra: [] },
  };
  state.projects.unshift(project);
  state.selectedProjectId = project.id;
  projectForm.reset();
  dialog.close();
  persistPilotData();
  showToast("Card criado com ambientes e pastas-base do Drive.");
  renderProjects();
});

personForm.addEventListener("submit", async (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  const formData = new FormData(personForm);
  if (isRealBackend()) {
    try {
      await createPersonBackend(formData);
      personForm.reset();
      personDialog.close();
      showToast("Acesso criado no Supabase. O usuário já pode entrar com e-mail e senha.");
    } catch (error) {
      showToast(friendlyError(error, "Não foi possível cadastrar a pessoa."));
    }
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
