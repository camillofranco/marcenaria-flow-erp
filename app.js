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

const state = {
  role: "adm",
  view: "dashboard",
  statusFilter: "todos",
  selectedProjectId: "",
  activePersonId: "",
  search: "",
  projects: [],
  people: [],
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
const tourDialog = document.querySelector("#tourDialog");
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
    ["Visão geral", "Aqui o ADM acompanha todos os projetos, responsáveis, compras pendentes, alertas e assistências abertas."],
    ["Pessoas reais", "Comece cadastrando medidor, projetista, comprador, montador e clientes em Nova pessoa."],
    ["Abertura do projeto", "Depois clique em Novo projeto para informar cliente, endereço, data, responsáveis e ambientes."],
    ["Piloto seguro", "Durante esta fase os dados ficam no navegador. Use Exportar ao fim do dia para gerar backup."],
  ],
  medidor: [
    ["Projetos atribuídos", "O medidor visualiza os projetos vinculados à pessoa selecionada neste perfil."],
    ["Medição por ambiente", "Entre no projeto, confira os ambientes e use Abrir câmera para simular fotos por ambiente."],
    ["Liberação", "Ao finalizar, use Liberar projeto para mover o fluxo ao projetista."],
  ],
  projetista: [
    ["Start do projeto", "Use Start para registrar o início do desenvolvimento e sinalizar ao ADM."],
    ["Checklist técnico", "Marque os ambientes concluídos e registre solicitações de compra quando houver materiais especiais."],
    ["Arquivos", "Use Anexar ficheiros para simular envio de arquivo de fábrica e arquivo de obra."],
  ],
  comprador: [
    ["Compras aprovadas", "O comprador acompanha itens aprovados pelo ADM e atualiza o andamento da compra."],
    ["Comprovantes", "Use Anexar fatura para simular registro de nota fiscal ou comprovante."],
  ],
  montador: [
    ["Obra no celular", "O montador consulta rota, arquivos da obra, alertas críticos e checklist por ambiente."],
    ["Pendências", "Ao relatar pendência, o sistema cria alerta vermelho para o ADM tratar assistência ou reposição."],
  ],
  cliente: [
    ["Acompanhamento", "O cliente acompanha status, previsão de montagem, ambientes e arquivos liberados para visualização."],
    ["Transparência", "Este perfil não mostra compras internas nem arquivos de engenharia; mostra somente o que interessa ao cliente."],
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

function roleMatches(project) {
  const person = activePerson();
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
  const candidates = peopleByRole(state.role);
  if (!candidates.some((person) => person.id === state.activePersonId)) {
    state.activePersonId = candidates[0]?.id ?? "";
  }

  personSelect.disabled = state.role === "adm" || candidates.length === 0;
  personSelect.innerHTML =
    state.role === "adm"
      ? `<option value="">Visão geral ADM</option>`
      : candidates.length
        ? candidates.map((person) => `<option value="${person.id}">${person.name}</option>`).join("")
        : `<option value="">Cadastre uma pessoa ${roleProfiles[state.role].label.toLowerCase()}</option>`;
  personSelect.value = state.activePersonId;

  const person = activePerson();
  userEmail.textContent = person
    ? [person.email, person.phone].filter(Boolean).join(" · ")
    : state.role === "adm"
      ? "Administrador visualiza todos os dados cadastrados neste navegador."
      : "Cadastre pessoas reais para simular permissões.";
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
    <div class="action-row">
      <button class="primary-action" data-open-person type="button">Nova pessoa</button>
    </div>
  `;
  detailPanel.querySelector("[data-open-person]").addEventListener("click", () => personDialog.showModal());
}

function openTour() {
  tourIndex = 0;
  renderTour();
  tourDialog.showModal();
}

function renderTour() {
  const steps = tourSteps[state.role] || tourSteps.adm;
  const [title, text] = steps[tourIndex];
  tourRole.textContent = `Tour ${roleProfiles[state.role].label}`;
  tourTitle.textContent = title;
  tourText.textContent = text;
  tourProgress.innerHTML = steps
    .map((_, index) => `<span class="tour-dot ${index === tourIndex ? "active" : ""}"></span>`)
    .join("");
  tourPrevBtn.disabled = tourIndex === 0;
  tourNextBtn.textContent = tourIndex === steps.length - 1 ? "Concluir" : "Próximo";
}

function nextTourStep() {
  const steps = tourSteps[state.role] || tourSteps.adm;
  if (tourIndex === steps.length - 1) {
    localStorage.setItem(`marcenaria-flow-tour-${state.role}`, "done");
    tourDialog.close();
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
  if (!localStorage.getItem(`marcenaria-flow-tour-${state.role}`)) {
    window.setTimeout(openTour, 450);
  }
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
    ${renderAlerts(project)}
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
                <label><input data-check="designDone" data-room="${room.name}" type="checkbox" ${room.designDone ? "checked" : ""}> Projeto concluído</label>
                <label><input data-check="installDone" data-room="${room.name}" type="checkbox" ${room.installDone ? "checked" : ""}> Montagem concluída</label>
                <label>
                  Nota assistência
                  <input data-support-note data-room="${room.name}" value="${room.supportNote}" placeholder="Sem pendência" />
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
  const folders = [
    ["Medição", "medicao"],
    ["Engenharia", "engenharia"],
    ["Obra", "obra"],
  ];
  return `
    <section class="detail-block">
      <h3>Google Drive</h3>
      <div class="folder-grid">
        ${folders
          .map(
            ([label, key]) => `
            <article class="folder">
              <div>
                <strong>${drivePath(project, label)}</strong>
                <small>${project.files[key].length} ficheiros</small>
                <div class="file-row">
                  ${
                    project.files[key].length
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

function handleAction(action, projectId) {
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) return;

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

function updateRoomCheck(projectId, roomName, key, checked) {
  const room = findRoom(projectId, roomName);
  if (!room) return;
  room[key] = checked;
  persistPilotData();
  showToast(key === "designDone" ? "Checklist do projetista atualizado." : "Checklist de montagem atualizado.");
}

function updateSupportNote(projectId, roomName, value) {
  const room = findRoom(projectId, roomName);
  if (!room) return;
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
  populateProjectFormPeople();
  dialog.showModal();
});

newPersonBtn.addEventListener("click", () => {
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
tourCloseBtn.addEventListener("click", () => tourDialog.close());
tourNextBtn.addEventListener("click", nextTourStep);
tourPrevBtn.addEventListener("click", previousTourStep);

projectForm.addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  const formData = new FormData(projectForm);
  const rooms = String(formData.get("rooms") || "Ambiente 1")
    .split(",")
    .map((room) => room.trim())
    .filter(Boolean);
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
  persistPilotData();
  showToast("Card criado com ambientes e pastas-base do Drive.");
  renderProjects();
});

personForm.addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  const formData = new FormData(personForm);
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
  persistPilotData();
  renderPersonSelect();
  if (state.view === "people") renderPeople();
  showToast("Pessoa cadastrada para o piloto.");
});

renderPersonSelect();
renderProjects();
maybeOpenFirstAccessTour();
