// ─── Job Tracker ──────────────────────────────────────────

const JOB_STATUSES = ["Applied","Followed Up","Interview","Offer","Rejected"];
const STATUS_COLORS = {
  "Applied":      "#38bdf8",
  "Followed Up":  "#818cf8",
  "Interview":    "#f59e0b",
  "Offer":        "#34d399",
  "Rejected":     "#f87171",
};

function toggleJobForm() {
  const f = document.getElementById("jobForm");
  f.classList.toggle("hidden");
  if (!f.classList.contains("hidden")) {
    document.getElementById("jDate").value = new Date().toISOString().split("T")[0];
    document.getElementById("jCompany").focus();
  }
}

function addJob() {
  const company = document.getElementById("jCompany").value.trim();
  const role    = document.getElementById("jRole").value.trim();
  if (!company || !role) { showToast("Company and Role are required!"); return; }
  const job = {
    id:      Date.now(),
    company, role,
    date:    document.getElementById("jDate").value,
    method:  document.getElementById("jMethod").value,
    notes:   document.getElementById("jNotes").value.trim(),
    status:  "Applied",
  };
  data.jobs = data.jobs || [];
  data.jobs.unshift(job);
  data.applications = data.jobs.length;
  addXP(10, "Job application added! 💼");
  saveData(data);
  setText("applicationsCount", data.applications);
  // clear form
  ["jCompany","jRole","jNotes"].forEach(id => document.getElementById(id).value = "");
  toggleJobForm();
  renderKanban();
  renderJobStats();
  showToast(`${company} added! +10 XP 💼`);
}

function updateJobStatus(id, status) {
  const job = (data.jobs || []).find(j => j.id === id);
  if (!job) return;
  job.status = status;
  if (status === "Offer") { addXP(50, "OFFER RECEIVED! 🎉"); fireConfetti(); }
  else if (status === "Interview") addXP(25, "Interview secured! 🎯");
  saveData(data);
  renderKanban();
  renderJobStats();
}

function deleteJob(id) {
  if (!confirm("Delete this application?")) return;
  data.jobs = (data.jobs || []).filter(j => j.id !== id);
  data.applications = data.jobs.length;
  saveData(data);
  setText("applicationsCount", data.applications);
  renderKanban();
  renderJobStats();
  showToast("Application removed 🗑");
}

function renderJobStats() {
  const container = document.getElementById("jobStatsRow");
  if (!container) return;
  const jobs = data.jobs || [];
  const counts = {};
  JOB_STATUSES.forEach(s => counts[s] = 0);
  jobs.forEach(j => { if (counts[j.status] !== undefined) counts[j.status]++; });
  container.innerHTML = JOB_STATUSES.map(s => `
    <div class="job-stat-card" style="border-color:${STATUS_COLORS[s]}22">
      <div class="job-stat-num" style="color:${STATUS_COLORS[s]}">${counts[s]}</div>
      <div class="job-stat-lbl">${s}</div>
    </div>`).join("");
}

function renderKanban() {
  const board = document.getElementById("kanbanBoard");
  if (!board) return;
  const jobs = data.jobs || [];
  board.innerHTML = JOB_STATUSES.map(status => {
    const col = jobs.filter(j => j.status === status);
    const cards = col.length === 0
      ? `<div class="kanban-empty">No applications</div>`
      : col.map(j => {
          const daysSince = j.date
            ? Math.floor((Date.now() - new Date(j.date)) / 86400000)
            : null;
          const overdue = status === "Applied" && daysSince !== null && daysSince >= 7;
          return `
            <div class="kanban-card ${overdue ? "overdue" : ""}">
              <div class="kanban-card-top">
                <span class="kanban-company">${j.company}</span>
                <button class="kanban-delete" onclick="deleteJob(${j.id})">×</button>
              </div>
              <div class="kanban-role">${j.role}</div>
              <div class="kanban-meta">
                <span class="kanban-method">${j.method}</span>
                ${j.date ? `<span class="kanban-date">${daysSince === 0 ? "Today" : daysSince + "d ago"}</span>` : ""}
                ${overdue ? `<span class="kanban-overdue-flag">⚠️ Follow up!</span>` : ""}
              </div>
              ${j.notes ? `<div class="kanban-notes">${j.notes}</div>` : ""}
              <div class="kanban-status-row">
                ${JOB_STATUSES.filter(s => s !== status).map(s =>
                  `<button class="kanban-move-btn" style="--sc:${STATUS_COLORS[s]}" onclick="updateJobStatus(${j.id},'${s}')">${s}</button>`
                ).join("")}
              </div>
            </div>`;
        }).join("");
    return `
      <div class="kanban-col">
        <div class="kanban-col-header" style="border-color:${STATUS_COLORS[status]}">
          <span>${status}</span>
          <span class="kanban-col-count" style="background:${STATUS_COLORS[status]}22;color:${STATUS_COLORS[status]}">${col.length}</span>
        </div>
        <div class="kanban-cards">${cards}</div>
      </div>`;
  }).join("");
}
