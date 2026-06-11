
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
EOF
echo "jobs done"
Output

jobs done
Done
Now the main app.js:


Ran 3 commands
Ran 3 commands

Write main app.js

Script

Write index.html

Script

Write style.css
bash

cat > /home/claude/war-room/style.css << 'CSSEOF'
/* ── Variables ── */
:root {
  --bg:     #07090f;
  --bg2:    #0d1117;
  --bg3:    #131920;
  --bg4:    #1a2130;
  --border: #1e2736;
  --bd2:    #263044;
  --text:   #e8edf5;
  --text2:  #7d8fa8;
  --text3:  #4a5568;
  --blue:   #38bdf8;
  --purple: #818cf8;
  --green:  #34d399;
  --amber:  #f59e0b;
  --red:    #f87171;
  --pink:   #fb7185;
  --r:      12px;
  --r2:     8px;
  --font:   'Space Grotesk', system-ui, sans-serif;
  --mono:   'JetBrains Mono', monospace;
  --sw:     228px;
}
body.light {
  --bg:#f0f3f9; --bg2:#fff; --bg3:#edf0f7; --bg4:#e2e8f2;
  --border:#d1d9e8; --bd2:#bdc7d8; --text:#0f1520; --text2:#3d4f68; --text3:#8a9bb8;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body{height:100%;}
body{font-family:var(--font);background:var(--bg);color:var(--text);overflow-x:hidden;line-height:1.6;}
body::before{
  content:"";position:fixed;inset:0;pointer-events:none;z-index:0;
  background:
    radial-gradient(ellipse 60% 40% at 15% 0%,rgba(56,189,248,.045) 0%,transparent 60%),
    radial-gradient(ellipse 50% 40% at 85% 100%,rgba(129,140,248,.04) 0%,transparent 60%);
}
button{cursor:pointer;font-family:var(--font);}
input,select,textarea{font-family:var(--font);}
a{color:inherit;}
.hidden{display:none!important;}

/* ── Confetti / Toast ── */
#confetti{position:fixed;inset:0;pointer-events:none;z-index:9999;display:none;}
#toast{
  position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);
  background:var(--bg2);border:1px solid var(--bd2);color:var(--text);
  padding:10px 22px;border-radius:50px;font-size:13px;font-weight:600;
  z-index:9998;transition:transform .35s cubic-bezier(.34,1.56,.64,1);
  pointer-events:none;white-space:nowrap;box-shadow:0 8px 40px rgba(0,0,0,.5);
}
#toast.show{transform:translateX(-50%) translateY(0);}

/* ── Shell ── */
.shell{display:flex;min-height:100vh;position:relative;z-index:1;}

/* ── Sidebar ── */
.sidebar{
  width:var(--sw);min-width:var(--sw);
  background:var(--bg2);border-right:1px solid var(--border);
  display:flex;flex-direction:column;padding:20px 14px;gap:18px;
  position:sticky;top:0;height:100vh;overflow-y:auto;
}
.brand{display:flex;align-items:center;gap:10px;padding-bottom:18px;border-bottom:1px solid var(--border);}
.brand-icon{
  width:38px;height:38px;border-radius:10px;flex-shrink:0;
  background:linear-gradient(135deg,var(--blue),var(--purple));
  display:flex;align-items:center;justify-content:center;
  font-weight:800;font-size:16px;color:#fff;
  box-shadow:0 4px 14px rgba(56,189,248,.25);
}
.brand-name{font-size:13px;font-weight:800;letter-spacing:.06em;color:var(--text);}
.brand-sub{font-size:10px;color:var(--text3);margin-top:1px;}

/* Sidebar countdown */
.sidebar-countdown{
  background:linear-gradient(135deg,rgba(248,113,113,.08),rgba(245,158,11,.05));
  border:1px solid rgba(248,113,113,.2);border-radius:var(--r);
  padding:14px;text-align:center;
}
.sc-label{font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:var(--text3);margin-bottom:4px;}
.sc-num{font-size:42px;font-weight:900;font-family:var(--mono);color:var(--red);line-height:1;}
.sc-sub{font-size:10px;color:var(--text3);margin-top:4px;font-style:italic;}

/* Sidebar nav */
.sidebar-nav{display:flex;flex-direction:column;gap:3px;}
.tab-btn{
  background:transparent;border:none;color:var(--text2);text-align:left;
  padding:9px 12px;border-radius:var(--r2);font-size:13px;font-weight:500;
  transition:all .15s;letter-spacing:.01em;border-left:2px solid transparent;
}
.tab-btn:hover{background:var(--bg3);color:var(--text);transform:translateX(2px);}
.tab-btn.active{background:rgba(56,189,248,.1);color:var(--blue);font-weight:700;border-left-color:var(--blue);}

/* Sidebar tracks */
.sidebar-tracks{display:flex;flex-direction:column;gap:7px;padding:12px 0;border-top:1px solid var(--border);}
.st-row{display:flex;align-items:center;gap:8px;}
.st-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.st-name{font-size:12px;color:var(--text2);flex:1;}
.st-pct{font-size:12px;font-weight:800;font-family:var(--mono);color:var(--text);}

/* Drive sync */
.drive-section{display:flex;flex-direction:column;gap:8px;padding:12px 0;border-top:1px solid var(--border);}
.sync-indicator{font-size:11px;color:var(--text3);display:flex;align-items:center;gap:6px;}
.sync-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.sync-dot.connected{background:var(--green);box-shadow:0 0 6px var(--green);}
.sync-dot.disconnected{background:var(--text3);}
.drive-btns{display:flex;gap:6px;flex-wrap:wrap;}
.drive-btn{
  background:var(--bg3);border:1px solid var(--border);color:var(--text2);
  padding:6px 10px;border-radius:6px;font-size:11px;font-weight:600;
  transition:all .15s;
}
.drive-btn:hover{border-color:var(--blue);color:var(--blue);}

/* Sidebar bottom */
.sidebar-bottom{margin-top:auto;display:flex;flex-direction:column;gap:5px;}
.sb-btn{
  background:transparent;border:1px solid var(--border);color:var(--text2);
  padding:7px 10px;border-radius:var(--r2);font-size:12px;text-align:left;
  transition:all .15s;
}
.sb-btn:hover{border-color:var(--bd2);color:var(--text);}
.sb-btn.danger{color:var(--red);border-color:rgba(248,113,113,.2);}
.sb-btn.danger:hover{background:rgba(248,113,113,.08);}

/* ── Main ── */
.main{flex:1;min-width:0;padding:28px;max-width:1300px;}

/* ── Tab Panes ── */
.tab-pane{display:none;}
.tab-pane.active{display:block;animation:fadeUp .22s ease;}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}

/* ── Section Card ── */
.section-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:22px;margin-bottom:16px;}
.sc-title{font-size:15px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.sc-sub{font-size:12px;color:var(--text3);font-weight:400;margin-left:auto;}

/* ── WAR BANNER ── */
.war-banner{
  background:linear-gradient(135deg,#0c0e18 0%,#11152a 50%,#0a0e1c 100%);
  border:1px solid rgba(129,140,248,.2);border-radius:var(--r);
  padding:22px 26px;margin-bottom:16px;position:relative;overflow:hidden;
}
.war-banner::before{
  content:"";position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,var(--blue),var(--purple),var(--red),var(--amber));
  animation:gradMove 4s linear infinite;background-size:200%;
}
@keyframes gradMove{0%{background-position:0%}100%{background-position:200%}}
.war-quote{font-size:17px;font-weight:700;line-height:1.45;letter-spacing:-.01em;}
.war-quote.fire-quote{color:var(--text);}
.war-meta{display:flex;align-items:center;gap:10px;margin-top:8px;font-size:12px;flex-wrap:wrap;}
.war-streak{color:var(--amber);font-weight:700;}
.war-sep{color:var(--text3);}

/* ── Mission Hero ── */
.mission-hero{
  display:grid;grid-template-columns:140px 1fr auto;
  gap:20px;align-items:center;
  background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);
  padding:20px 24px;margin-bottom:16px;
}
.countdown-block{text-align:center;}
.cd-num{font-size:58px;font-weight:900;font-family:var(--mono);line-height:1;}
.cd-label{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:var(--text3);margin-top:2px;}
.cd-sub{font-size:11px;color:var(--text3);}

.overall-block{flex:1;}
.overall-label{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:6px;}
.overall-pct{font-size:28px;font-weight:900;font-family:var(--mono);margin-bottom:12px;}
.three-bars{display:flex;flex-direction:column;gap:8px;}
.tbar{display:flex;align-items:center;gap:10px;}
.tbar-lbl{font-size:12px;font-weight:700;min-width:70px;}
.tbar-track{flex:1;height:6px;background:var(--bg3);border-radius:3px;overflow:hidden;}
.tbar-fill{height:100%;border-radius:3px;transition:width .6s ease;}
.tbar-pct{font-size:12px;font-weight:800;font-family:var(--mono);min-width:34px;text-align:right;}

.mission-stats-grid{
  display:grid;grid-template-columns:repeat(3,1fr);gap:10px;min-width:200px;
}
.ms-stat{background:var(--bg3);border-radius:var(--r2);padding:12px 10px;text-align:center;}
.ms-num{font-size:22px;font-weight:900;font-family:var(--mono);line-height:1;}
.ms-lbl{font-size:10px;color:var(--text3);margin-top:3px;text-transform:uppercase;letter-spacing:.06em;}

/* ── Today 3-Track Grid ── */
.today-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:16px;}
.today-card{
  background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);
  padding:18px;display:flex;flex-direction:column;gap:10px;
  transition:border-color .2s;
}
.today-card:hover{border-color:var(--bd2);}
.ai-card:hover{border-color:rgba(129,140,248,.3);}
.dsa-card:hover{border-color:rgba(56,189,248,.3);}
.sql-card:hover{border-color:rgba(52,211,153,.3);}

.tc-header{display:flex;align-items:flex-start;gap:10px;}
.tc-icon{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.tc-info{flex:1;}
.tc-title{font-size:13px;font-weight:700;line-height:1.2;}
.tc-sub{font-size:11px;color:var(--text3);margin-top:2px;}
.tc-nav{display:flex;gap:4px;}
.tcn-btn{background:var(--bg3);border:1px solid var(--border);color:var(--text2);width:28px;height:28px;border-radius:6px;font-size:11px;transition:all .15s;}
.tcn-btn:hover{border-color:var(--bd2);color:var(--text);}

.tc-tasks{display:flex;flex-direction:column;gap:5px;}
.tc-progress{font-size:11px;color:var(--text3);font-family:var(--mono);}
.tc-practice{font-size:11px;font-weight:600;color:var(--amber);background:rgba(245,158,11,.1);padding:5px 9px;border-radius:6px;display:inline-block;}

/* Mission checks */
.mission-check{
  display:flex;align-items:center;gap:9px;padding:8px 10px;
  background:var(--bg3);border-radius:7px;cursor:pointer;border:1px solid transparent;
  font-size:12px;font-weight:500;transition:all .15s;
}
.mission-check:hover{border-color:var(--bd2);}
.mission-check.done{opacity:.45;text-decoration:line-through;}
.mission-check input[type=checkbox]{accent-color:var(--blue);flex-shrink:0;cursor:pointer;}
.diff{font-size:10px;font-weight:700;margin-left:auto;flex-shrink:0;}
.tuf{color:var(--blue);font-size:10px;font-weight:700;text-decoration:none;flex-shrink:0;opacity:.7;}
.tuf:hover{opacity:1;}
.no-probs{font-size:12px;color:var(--text3);text-align:center;padding:12px;}

/* SQL big check */
.sql-big-check{
  display:flex;align-items:center;gap:12px;
  background:var(--bg3);border:1px solid var(--border);border-radius:var(--r2);
  padding:14px;cursor:pointer;transition:all .15s;
}
.sql-big-check:hover{border-color:rgba(52,211,153,.4);}
.sql-big-check.done{border-color:rgba(52,211,153,.35);background:rgba(52,211,153,.06);}
.sql-big-check input[type=checkbox]{accent-color:var(--green);width:18px;height:18px;flex-shrink:0;cursor:pointer;}
.sql-check-title{font-size:13px;font-weight:700;}
.sql-check-sub{font-size:11px;color:var(--text3);margin-top:2px;}

.sql-dots{display:grid;grid-template-columns:repeat(10,1fr);gap:4px;}
.sql-dot{
  aspect-ratio:1;border-radius:4px;background:var(--bg3);
  border:1px solid var(--border);cursor:pointer;transition:all .15s;
}
.sql-dot:hover{border-color:rgba(52,211,153,.6);}
.sql-dot.done{background:rgba(52,211,153,.5);border-color:var(--green);}
.sql-dot.now{border:2px solid var(--green);}

/* ── AI Tab ── */
.ai-header{margin-bottom:16px;}
.ai-nav-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px;}
.ai-day-info{text-align:center;}
.ai-day-num{font-size:24px;font-weight:900;font-family:var(--mono);display:block;}
.ai-day-date{font-size:11px;color:var(--text3);}
.nav-btn{background:var(--bg2);border:1px solid var(--border);color:var(--text2);padding:8px 14px;border-radius:var(--r2);font-size:13px;font-family:var(--font);transition:all .15s;}
.nav-btn:hover{border-color:var(--blue);color:var(--blue);}
.jump-inp{background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:8px 10px;border-radius:var(--r2);font-family:var(--mono);font-size:13px;width:100px;}
.jump-inp:focus{outline:none;border-color:var(--blue);}
.ai-overall-bar{display:flex;align-items:center;gap:12px;}
.ai-ovlbl{font-size:12px;color:var(--text3);min-width:130px;}
.ai-ov-track{flex:1;height:6px;background:var(--bg3);border-radius:3px;overflow:hidden;}
.ai-ov-fill{height:100%;background:linear-gradient(90deg,var(--purple),var(--blue));border-radius:3px;transition:width .6s;}
.ai-ovpct{font-size:13px;font-weight:800;font-family:var(--mono);color:var(--purple);}

.ai-checks{display:flex;flex-direction:column;gap:6px;}
.ai-check{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--r2);cursor:pointer;transition:all .15s;}
.ai-check:hover{border-color:rgba(129,140,248,.4);}
.ai-check.done{opacity:.4;text-decoration:line-through;}
.ai-check input[type=checkbox]{accent-color:var(--purple);flex-shrink:0;cursor:pointer;}
.ai-check span{font-size:13px;flex:1;}
.ai-tick{color:var(--green);font-weight:900;}

.pl-bars{display:flex;flex-direction:column;gap:10px;}
.pl-row{display:flex;align-items:center;gap:12px;}
.pl-name{font-size:12px;font-weight:600;min-width:120px;}
.pl-bar{flex:1;height:7px;background:var(--bg3);border-radius:4px;overflow:hidden;}
.pl-fill{height:100%;border-radius:4px;transition:width .7s;}
.pl-pct{font-size:12px;font-weight:800;font-family:var(--mono);min-width:36px;text-align:right;}

.weeks-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;}
.wk-card{background:var(--bg3);border:1px solid var(--border);border-radius:var(--r2);padding:14px;transition:all .15s;}
.wk-card.cur{border-color:rgba(56,189,248,.5);background:rgba(56,189,248,.04);}
.wk-card.past{opacity:.6;}
.wk-card:hover{border-color:var(--bd2);}
.wk-top{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
.wk-num{font-size:13px;font-weight:800;}
.wk-badge{font-size:11px;font-weight:700;color:var(--amber);}
.wk-pct{font-size:13px;font-weight:800;font-family:var(--mono);color:var(--blue);margin-left:auto;}
.wk-pl{font-size:12px;color:var(--text2);font-weight:600;}
.wk-dates{font-size:11px;color:var(--text3);margin:2px 0 8px;}
.wk-bar{height:4px;background:var(--bg2);border-radius:2px;overflow:hidden;margin-bottom:8px;}
.wk-fill{height:100%;background:var(--blue);border-radius:2px;transition:width .5s;}
.wk-del{font-size:11px;color:var(--green);font-weight:600;}

/* ── DSA Tab ── */
.dsa-hdr{
  display:flex;gap:24px;align-items:center;
  background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);
  padding:20px 24px;margin-bottom:16px;flex-wrap:wrap;
}
.dsa-overall{text-align:center;min-width:130px;}
.dsa-big-num{font-size:44px;font-weight:900;font-family:var(--mono);line-height:1;}
.dsa-big-num span{font-size:20px;color:var(--text3);}
.dsa-big-lbl{font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin:4px 0;}
.dsa-ov-bar{height:6px;background:var(--bg3);border-radius:3px;overflow:hidden;margin:6px 0;}
.dsa-ov-fill{height:100%;background:linear-gradient(90deg,var(--blue),var(--purple));border-radius:3px;transition:width .6s;}
.dsa-ov-pct{font-size:12px;font-weight:800;font-family:var(--mono);color:var(--blue);}
.dsa-day-ctrl{flex:1;}
.ddc-label{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:8px;}
.ddc-row{display:flex;align-items:center;gap:12px;margin-bottom:4px;}
.ddc-num{font-size:26px;font-weight:900;font-family:var(--mono);}
.ddc-sub{font-size:11px;color:var(--text3);}

.dsa-steps{display:flex;flex-direction:column;gap:10px;}
.dsa-step{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;}
.dsa-step.has-today{border-color:rgba(56,189,248,.35);}
.dsa-step-hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;cursor:pointer;transition:background .15s;}
.dsa-step-hdr:hover{background:var(--bg3);}
.dsa-sl{display:flex;align-items:center;gap:12px;}
.dsa-icon{font-size:20px;}
.dsa-stitle{font-size:14px;font-weight:700;}
.dsa-smeta{font-size:11px;color:var(--text3);margin-top:2px;}
.dsa-sr{display:flex;align-items:center;gap:10px;}
.dsa-sbar{width:80px;height:5px;background:var(--bg3);border-radius:3px;overflow:hidden;}
.dsa-sfill{height:100%;border-radius:3px;transition:width .5s;}
.dsa-spct{font-size:13px;font-weight:800;font-family:var(--mono);}
.dsa-sdone{font-size:11px;color:var(--text3);font-family:var(--mono);}
.dsa-chev{font-size:11px;color:var(--text3);transition:transform .2s;}

.dsa-probs{padding:0 18px 12px;display:flex;flex-direction:column;gap:4px;}
.dsa-prow{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--bg3);border-radius:7px;border:1px solid transparent;transition:all .15s;}
.dsa-prow:hover{border-color:var(--bd2);}
.dsa-prow.done{opacity:.35;}
.dsa-prow.today{border-color:rgba(245,158,11,.4);background:rgba(245,158,11,.06);}
.dsa-plabel{display:flex;align-items:center;gap:8px;cursor:pointer;flex:1;min-width:0;}
.dsa-plabel input[type=checkbox]{accent-color:var(--blue);flex-shrink:0;cursor:pointer;}
.dsa-plabel span{font-size:12px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
.dsa-pmeta{display:flex;align-items:center;gap:6px;flex-shrink:0;}
.today-tag{font-size:9px;font-weight:800;letter-spacing:.08em;color:var(--amber);background:rgba(245,158,11,.2);border-radius:4px;padding:2px 5px;}
.day-tag{font-size:10px;color:var(--text3);font-family:var(--mono);}
.diff-tag{font-size:10px;font-weight:700;border-radius:4px;padding:1px 5px;font-family:var(--mono);}
.tuf-a{color:var(--blue);text-decoration:none;font-size:11px;font-weight:700;opacity:.7;transition:opacity .15s;}
.tuf-a:hover{opacity:1;}

/* ── Projects Tab ── */
.projects-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;}
.proj-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:18px;display:flex;flex-direction:column;gap:10px;transition:border-color .15s;}
.proj-card:hover{border-color:var(--bd2);}
.proj-card.done{border-color:rgba(52,211,153,.3);}
.proj-hdr{display:flex;align-items:center;gap:8px;}
.proj-id{font-size:11px;font-weight:800;color:var(--text3);font-family:var(--mono);background:var(--bg3);padding:3px 7px;border-radius:5px;}
.proj-wk{font-size:11px;color:var(--blue);background:rgba(56,189,248,.12);padding:3px 7px;border-radius:5px;font-weight:600;}
.proj-shipped{font-size:11px;font-weight:800;color:var(--green);margin-left:auto;}
.proj-name{font-size:15px;font-weight:700;line-height:1.3;}
.proj-links{display:flex;flex-direction:column;gap:6px;}
.proj-inp{background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:8px 10px;border-radius:var(--r2);font-size:12px;font-family:var(--mono);width:100%;transition:border-color .15s;}
.proj-inp:focus{outline:none;border-color:var(--blue);}
.proj-btn{background:var(--bg3);border:1px solid var(--border);color:var(--text2);padding:9px;border-radius:var(--r2);font-family:var(--font);font-size:13px;font-weight:600;transition:all .15s;}
.proj-btn:hover{border-color:var(--blue);color:var(--blue);}
.proj-btn.done{border-color:rgba(52,211,153,.35);color:var(--green);background:rgba(52,211,153,.07);}

/* ── Jobs Tab ── */
.jobs-topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
.page-title{font-size:22px;font-weight:800;}
.add-btn{background:var(--blue);color:#000;font-weight:700;border:none;padding:9px 18px;border-radius:var(--r2);font-size:13px;font-family:var(--font);transition:opacity .15s;}
.add-btn:hover{opacity:.85;}

.job-stats-row{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;}
.job-stat-card{background:var(--bg2);border:1px solid;border-color:color-mix(in srgb,var(--sc) 25%,transparent);border-radius:var(--r2);padding:12px 16px;min-width:90px;text-align:center;}
.job-stat-num{font-size:28px;font-weight:900;font-family:var(--mono);color:var(--sc);}
.job-stat-lbl{font-size:11px;color:var(--text3);margin-top:2px;}

.job-form{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:22px;margin-bottom:16px;animation:fadeUp .2s ease;}
.jf-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;}
.fg{display:flex;flex-direction:column;gap:5px;}
.fg.full{grid-column:1/-1;}
.fg label{font-size:11px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.06em;}
.fg input,.fg select{background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:9px 12px;border-radius:var(--r2);font-size:13px;transition:border-color .15s;}
.fg input:focus,.fg select:focus{outline:none;border-color:var(--blue);}
.fg select option{background:var(--bg2);}
.jf-actions{display:flex;gap:10px;}
.save-btn{background:var(--blue);color:#000;font-weight:700;border:none;padding:9px 20px;border-radius:var(--r2);font-family:var(--font);font-size:13px;}
.cancel-btn{background:var(--bg3);border:1px solid var(--border);color:var(--text2);padding:9px 16px;border-radius:var(--r2);font-family:var(--font);font-size:13px;}
.cancel-btn:hover{border-color:var(--bd2);color:var(--text);}

.kanban-board{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;}
.kanban-col{min-width:200px;flex:1;}
.kanban-header{
  display:flex;justify-content:space-between;align-items:center;
  padding:10px 12px;border-top:3px solid var(--sc);border-radius:var(--r2) var(--r2) 0 0;
  background:color-mix(in srgb,var(--sc) 8%,var(--bg2));
  font-size:12px;font-weight:800;color:var(--sc);margin-bottom:8px;
}
.kanban-cnt{font-family:var(--mono);font-size:11px;background:color-mix(in srgb,var(--sc) 18%,transparent);padding:2px 8px;border-radius:12px;}
.kanban-cards{display:flex;flex-direction:column;gap:8px;}
.kanban-empty{color:var(--text3);font-size:12px;text-align:center;padding:20px;border:1px dashed var(--border);border-radius:var(--r2);}

.kanban-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r2);padding:12px;transition:all .15s;}
.kanban-card:hover{border-color:var(--bd2);transform:translateY(-2px);}
.kanban-card.overdue{border-color:rgba(245,158,11,.4);}
.kc-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3px;}
.kc-company{font-size:13px;font-weight:700;}
.kc-del{background:none;border:none;color:var(--text3);font-size:16px;padding:0;line-height:1;}
.kc-del:hover{color:var(--red);}
.kc-role{font-size:12px;color:var(--text2);margin-bottom:7px;}
.kc-meta{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:7px;}
.kc-method{font-size:10px;background:var(--bg3);padding:2px 6px;border-radius:4px;color:var(--text3);}
.kc-date{font-size:10px;color:var(--text3);}
.kc-overdue{font-size:10px;color:var(--amber);font-weight:700;}
.kc-notes{font-size:11px;color:var(--text3);font-style:italic;margin-bottom:8px;padding:5px 8px;background:var(--bg3);border-radius:5px;}
.kc-moves{display:flex;gap:4px;flex-wrap:wrap;}
.kc-move{font-size:10px;font-family:var(--font);padding:3px 8px;border-radius:5px;border:1px solid var(--sc);background:transparent;color:var(--sc);cursor:pointer;transition:all .15s;}
.kc-move:hover{background:var(--sc);color:#000;}

/* ── Scrollbar ── */
::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:3px;}
::-webkit-scrollbar-thumb:hover{background:var(--text3);}

/* ── Mobile ── */
@media(max-width:900px){
  :root{--sw:0px;}
  .sidebar{
    display:flex;flex-direction:row;width:100%;height:auto;
    position:fixed;bottom:0;top:auto;border-right:none;border-top:1px solid var(--border);
    padding:6px 8px;gap:0;overflow-x:auto;z-index:20;
  }
  .brand,.sidebar-countdown,.sidebar-tracks,.drive-section,.sidebar-bottom{display:none;}
  .sidebar-nav{flex-direction:row;width:100%;gap:2px;}
  .tab-btn{flex:1;text-align:center;padding:8px 4px;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-left:none;border-bottom:2px solid transparent;}
  .tab-btn.active{border-bottom-color:var(--blue);border-left:none;}
  .main{margin-left:0;padding:16px;padding-bottom:72px;}
  .mission-hero{grid-template-columns:1fr;gap:14px;}
  .today-grid{grid-template-columns:1fr;}
  .dsa-hdr{flex-direction:column;}
  .kanban-board{flex-direction:column;}
  .kanban-col{min-width:unset;}
  .weeks-grid{grid-template-columns:1fr 1fr;}
  .projects-grid{grid-template-columns:1fr;}
  .jf-grid{grid-template-columns:1fr;}
  .mission-stats-grid{grid-template-columns:repeat(3,1fr);}
}
@media(max-width:560px){
  .today-grid,.weeks-grid{grid-template-columns:1fr;}
  .mission-stats-grid{grid-template-columns:repeat(2,1fr);}
  .job-stats-row{gap:6px;}
  .job-stat-card{min-width:70px;padding:10px;}
}
CSSEOF





