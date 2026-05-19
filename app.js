const roleProfiles = {
  adm: {
    label: "Administrador",
    email: "adm@marcenariaflow.com",
    title: "Painel de controle",
    subtitle: "Projetos, compras, responsáveis e alertas de assistência.",
  },
  medidor: {
    label: "Medidor",
    email: "rafael@marcenariaflow.com",
    title: "Medições agendadas",
    subtitle: "Clientes atribuídos, fotos por ambiente e pastas de medição.",
  },
  projetista: {
    label: "Projetista",
    email: "camila@marcenariaflow.com",
    title: "Desenvolvimento técnico",
    subtitle: "Ambientes liberados, checklists e pedidos de compra.",
  },
  comprador: {
    label: "Comprador",
    email: "suprimentos@marcenariaflow.com",
    title: "Suprimentos aprovados",
    subtitle: "Materiais aprovados, compra, entrega e faturas.",
  },
  montador: {
    label: "Montador",
    email: "joao@marcenariaflow.com",
    title: "Roteiro de montagem",
    subtitle: "Rotas, ficheiros de obra, alertas e checklist.",
  },
};

const initialProjects = [
  {
    id: "p-001",
    number: "MF-2401",
    client: "Ana Martins",
    address: "Rua das Acácias, 212 - Campinas, SP",
    installDate: "2026-06-02",
    status: "desenvolvimento",
    medidor: "Rafael",
    projetista: "Camila",
    comprador: "Larissa",
    montador: "João",
    startedAt: "2026-05-18 09:12",
    rooms: [
      { name: "Cozinha", measurementPhotos: 8, designDone: true, installDone: false, supportNote: "" },
      { name: "Lavanderia", measurementPhotos: 5, designDone: false, installDone: false, supportNote: "" },
      { name: "Cristaleira", measurementPhotos: 4, designDone: false, installDone: false, supportNote: "" },
    ],
    purchases: [
      { id: "c-01", item: "Perfil LED 3000K", qty: "12 m", requestedBy: "Camila", approval: "pendente", purchaseStatus: "aguardando", invoice: "" },
      { id: "c-02", item: "Dobradiça Blum clip top", qty: "22 un.", requestedBy: "Camila", approval: "aprovado", purchaseStatus: "comprado", invoice: "NF-9812.pdf" },
    ],
    alerts: [
      { level: "critical", title: "Canos de gás na parede da torre quente", source: "ADM" },
      { level: "attention", title: "Tomada deslocada na bancada", source: "Projetista" },
    ],
    files: {
      medicao: ["Cozinha 01.jpg", "Cozinha 02.jpg", "Lavanderia 01.jpg"],
      engenharia: ["Fabrica_MF-2401.plano", "Plano_de_corte.pdf"],
      obra: ["Obra_MF-2401.pdf", "Perspectivas_Cliente.pdf"],
    },
  },
  {
    id: "p-002",
    number: "MF-2402",
    client: "Bruno Almeida",
    address: "Av. Brasil, 1640 - Valinhos, SP",
    installDate: "2026-05-27",
    status: "medicao",
    medidor: "Rafael",
    projetista: "Diego",
    comprador: "Larissa",
    montador: "Marcos",
    startedAt: "",
    rooms: [
      { name: "Quarto casal", measurementPhotos: 0, designDone: false, installDone: false, supportNote: "" },
      { name: "Home office", measurementPhotos: 0, designDone: false, installDone: false, supportNote: "" },
    ],
    purchases: [],
    alerts: [{ level: "info", title: "Cliente pediu puxador cava em todo o projeto", source: "ADM" }],
    files: { medicao: [], engenharia: [], obra: [] },
  },
  {
    id: "p-003",
    number: "MF-2398",
    client: "Clínica Sorriso",
    address: "Rua Padre Vieira, 905 - Campinas, SP",
    installDate: "2026-05-21",
    status: "montagem",
    medidor: "Bianca",
    projetista: "Camila",
    comprador: "Larissa",
    montador: "João",
    startedAt: "2026-05-12 13:40",
    rooms: [
      { name: "Recepção", measurementPhotos: 7, designDone: true, installDone: true, supportNote: "" },
      { name: "Consultório 1", measurementPhotos: 6, designDone: true, installDone: false, supportNote: "Falta lateral direita do armário aéreo." },
      { name: "Esterilização", measurementPhotos: 5, designDone: true, installDone: false, supportNote: "" },
    ],
    purchases: [
      { id: "c-03", item: "Corrediça telescópica 45 cm", qty: "18 pares", requestedBy: "Camila", approval: "aprovado", purchaseStatus: "entregue", invoice: "NF-9741.pdf" },
    ],
    alerts: [
      { level: "critical", title: "Parede de drywall não suporta módulo suspenso sem reforço", source: "Projetista" },
      { level: "attention", title: "Montar fora do horário de atendimento", source: "ADM" },
    ],
    files: {
      medicao: ["Recepcao 01.jpg", "Consultorio 01.jpg"],
      engenharia: ["Fabrica_MF-2398.plano"],
      obra: ["Obra_MF-2398.pdf", "Mapa_de_modulos.pdf"],
    },
  },
];

const state = {
  role: "adm",
  view: "dashboard",
  statusFilter: "todos",
  selectedProjectId: "p-001",
  search: "",
  projects: loadProjects(),
};

const roleSelect = document.querySelector("[data-role-select]");
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
const newProjectBtn = document.querySelector("#newProjectBtn");

const statusLabels = {
  medicao: "Medição técnica",
  desenvolvimento: "Em desenvolvimento",
  montagem: "Montagem",
  concluido: "Concluído",
};

const alertLabels = {
  critical: "Crítico",
  attention: "Atenção",
  info: "Informativo",
};

function filteredProjects() {
  const query = state.search.trim().toLowerCase();
  return state.projects.filter((project) => {
    const canSee = {
      adm: true,
      medidor: project.medidor === "Rafael" && project.status === "medicao",
      projetista: project.projetista === "Camila" && ["desenvolvimento", "montagem"].includes(project.status),
      comprador: project.purchases.some((item) => item.approval === "aprovado"),
      montador: project.montador === "João" && project.status === "montagem",
    }[state.role];
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

function loadProjects() {
  try {
    return JSON.parse(localStorage.getItem("marcenaria-flow-projects")) || structuredClone(initialProjects);
  } catch {
    return structuredClone(initialProjects);
  }
}

function persistProjects() {
  localStorage.setItem("marcenaria-flow-projects", JSON.stringify(state.projects));
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

function renderProjects() {
  const projects = filteredProjects();
  renderMetrics(projects);

  if (!projects.some((project) => project.id === state.selectedProjectId)) {
    state.selectedProjectId = projects[0]?.id ?? "";
  }

  if (!projects.length) {
    projectList.innerHTML = `<div class="empty-state">Nenhum card aparece para este perfil com os filtros atuais.</div>`;
    detailPanel.innerHTML = `<div class="empty-state">Selecione outro perfil ou ajuste a busca para ver detalhes.</div>`;
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
            <span class="tag">Medidor ${project.medidor}</span>
            <span class="tag">Projetista ${project.projetista}</span>
            <span class="tag">Montador ${project.montador}</span>
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
    ${renderPurchases(project)}
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
  };
  return actions[state.role];
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
            <span class="meta">${item.qty} · ${item.requestedBy}</span>
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
      requestedBy: "Camila",
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

  persistProjects();
  renderProjects();
}

function updateRoomCheck(projectId, roomName, key, checked) {
  const room = findRoom(projectId, roomName);
  if (!room) return;
  room[key] = checked;
  persistProjects();
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
  persistProjects();
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
    purchases: ["Compras", "Materiais, aprovação, compra, entrega e faturas."],
    alerts: ["Alertas", "Ocorrências críticas, atenção e informações de obra."],
    drive: ["Drive", "Pastas por projeto, cliente, etapa e ambiente."],
  };
  [mainPanelTitle.textContent, mainPanelSubtitle.textContent] = labels[view];
  renderProjects();
}

roleSelect.addEventListener("change", () => {
  state.role = roleSelect.value;
  const profile = roleProfiles[state.role];
  userEmail.textContent = profile.email;
  roleLabel.textContent = profile.label;
  pageTitle.textContent = profile.title;
  document.body.dataset.role = state.role;
  showToast(`Filtro de acesso aplicado para ${profile.label}.`);
  setView(state.view);
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
  dialog.showModal();
});

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
    medidor: formData.get("medidor"),
    projetista: formData.get("projetista"),
    comprador: "Larissa",
    montador: formData.get("montador"),
    startedAt: "",
    rooms: rooms.map((name) => ({ name, measurementPhotos: 0, designDone: false, installDone: false, supportNote: "" })),
    purchases: [],
    alerts: [{ level: "info", title: "Projeto criado pelo ADM", source: "ADM" }],
    files: { medicao: [], engenharia: [], obra: [] },
  };
  state.projects.unshift(project);
  state.selectedProjectId = project.id;
  projectForm.reset();
  persistProjects();
  showToast("Card criado com ambientes e pastas-base do Drive.");
  renderProjects();
});

renderProjects();
