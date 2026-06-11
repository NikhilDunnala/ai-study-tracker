const JOB_STATUSES = ["Applied","Followed Up","Interview","Offer","Rejected"];
const STATUS_COLORS = {
  "Applied":     "#38bdf8",
  "Followed Up": "#818cf8",
  "Interview":   "#f59e0b",
  "Offer":       "#34d399",
  "Rejected":    "#f87171",
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
  if (!company || !role) { showToast("Company and Role required!"); return; }
  const job = {
    id: Date.now(), company, role,
    date:   document.getElementById("jDate").value,
    method: document.getElementById("jMethod").value,
    notes:  document.getElementById("jNotes").value.trim(),
    status: "Applied",
  };
  data.jobs = data.jobs || [];
  data.jobs.unshift(job);
  saveAndSync(data);
  ["jCompany","jRole","jNotes"].forEach(id => document.getElementById(id).value = "");
  toggleJobForm();
  renderJobsTab();
  showToast(`${company} added! 💼`);
}

function updateJobStatus(id, status) {
  const job = (data.jobs||[]).find(j => j.id === id);
  if (!job) return;
  job.status = status;
  if (status === "Offer")     { fireConfetti(); showToast("🎉 OFFER! You crushed it!"); }
  if (status === "Interview") showToast("🎯 Interview locked in!");
  saveAndSync(data);
  renderJobsTab();
}

function deleteJob(id) {
  if (!confirm("Remove this application?")) return;
  data.jobs = (data.jobs||[]).filter(j => j.id !== id);
  saveAndSync(data);
  renderJobsTab();
  showToast("Removed 🗑");
}

function renderJobsTab() {
  const jobs = data.jobs || [];

  // Stats row
  const statsEl = document.getElementById("jobStatsRow");
  if (statsEl) {
    const counts = {};
    JOB_STATUSES.forEach(s => counts[s] = 0);
    jobs.forEach(j => { if (counts[j.status] !== undefined) counts[j.status]++; });
    statsEl.innerHTML = JOB_STATUSES.map(s => `
      <div class="job-stat-card" style="--sc:${STATUS_COLORS[s]}">
        <div class="job-stat-num">${counts[s]}</div>
        <div class="job-stat-lbl">${s}</div>
      </div>`).join("");
  }

  // Kanban
  const board = document.getElementById("kanbanBoard");
  if (!board) return;
  board.innerHTML = JOB_STATUSES.map(status => {
    const col = jobs.filter(j => j.status === status);
    const cards = col.length === 0
      ? `<div class="kanban-empty">No applications here</div>`
      : col.map(j => {
          const days = j.date ? Math.floor((Date.now()-new Date(j.date))/86400000) : null;
          const overdue = status==="Applied" && days!==null && days>=7;
          return `<div class="kanban-card ${overdue?"overdue":""}">
            <div class="kc-top">
              <span class="kc-company">${j.company}</span>
              <button class="kc-del" onclick="deleteJob(${j.id})">×</button>
            </div>
            <div class="kc-role">${j.role}</div>
            <div class="kc-meta">
              <span class="kc-method">${j.method}</span>
              ${days!==null?`<span class="kc-date">${days===0?"Today":days+"d ago"}</span>`:""}
              ${overdue?`<span class="kc-overdue">⚠️ Follow up!</span>`:""}
            </div>
            ${j.notes?`<div class="kc-notes">${j.notes}</div>`:""}
            <div class="kc-moves">
              ${JOB_STATUSES.filter(s=>s!==status).map(s=>
                `<button class="kc-move" style="--sc:${STATUS_COLORS[s]}" onclick="updateJobStatus(${j.id},'${s}')">${s}</button>`
              ).join("")}
            </div>
          </div>`;
        }).join("");
    return `<div class="kanban-col">
      <div class="kanban-header" style="--sc:${STATUS_COLORS[status]}">
        <span>${status}</span>
        <span class="kanban-cnt">${col.length}</span>
      </div>
      <div class="kanban-cards">${cards}</div>
    </div>`;
  }).join("");
}

// ─── Wire up Jobs tab buttons (called from app.js DOMContentLoaded) ───────────
function initJobsTab() {
  const addBtn    = document.getElementById("addJobBtn");
  const saveBtn   = document.getElementById("saveJobBtn");
  const cancelBtn = document.getElementById("cancelJobBtn");
  const exportBtn = document.getElementById("exportBtn");
  const resetBtn  = document.getElementById("resetBtn");

  if (addBtn)    addBtn.addEventListener("click", toggleJobForm);
  if (saveBtn)   saveBtn.addEventListener("click", addJob);
  if (cancelBtn) cancelBtn.addEventListener("click", toggleJobForm);

  if (exportBtn) exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "warroom-backup.json"; a.click();
    showToast("Data exported! 📤");
  });

  if (resetBtn) resetBtn.addEventListener("click", () => {
    if (confirm("Reset ALL data? This cannot be undone.")) {
      localStorage.clear(); location.reload();
    }
  });
}
