
let data = getData();

// ─── XP System ────────────────────────────────────────────
const XP_LEVELS = [
  { name:"Beginner 🌱",     min:0    },
  { name:"Learner 📚",      min:50   },
  { name:"Coder 💻",        min:150  },
  { name:"Builder 🔨",      min:300  },
  { name:"ML Dev 🤖",       min:500  },
  { name:"AI Engineer 🚀",  min:800  },
  { name:"Legend 🏆",       min:1200 },
];

function getLevelInfo(xp) {
  let level = XP_LEVELS[0];
  for (const l of XP_LEVELS) { if (xp >= l.min) level = l; else break; }
  const idx  = XP_LEVELS.indexOf(level);
  const next = XP_LEVELS[idx + 1];
  const pct  = next ? Math.round(((xp - level.min) / (next.min - level.min)) * 100) : 100;
  return { level, next, pct };
}

function addXP(amount, reason) {
  data.xp = (data.xp || 0) + amount;
  saveData(data);
  updateXPBar();
}

function updateXPBar() {
  const xp   = data.xp || 0;
  const info = getLevelInfo(xp);
  setText("xpLevel",   info.level.name);
  setText("xpPoints",  xp + " XP");
  setText("xpDisplay", xp);
  setText("splashXP",  xp + " XP");
  const bar = document.getElementById("xpBar");
  if (bar) bar.style.width = info.pct + "%";
  setText("xpNext", info.next ? `${info.next.min - xp} XP to ${info.next.name}` : "Max level! 🏆");
}

// ─── Splash ────────────────────────────────────────────────
const SPLASH_QUOTES = [
  "The only way out is through. Keep building.",
  "Every expert was once a beginner who refused to quit.",
  "You don't have to be great to start, but you have to start to be great.",
  "One day or day one. You decide.",
  "The pain of discipline is nothing compared to the pain of regret.",
  "Stop waiting for motivation. Build the habit instead.",
  "You're closer than you think. Don't stop now.",
  "Hard work beats talent when talent doesn't work hard.",
  "The grind you hate today is the story you'll love tomorrow.",
  "Nobody remembers the person who almost did it.",
  "Your future self is watching. Make them proud.",
  "Every line of code you write today is a step toward your dream job.",
  "Doubt kills more dreams than failure ever will.",
  "You chose this path. Now walk it like you mean it.",
  "Sep 8 is coming whether you're ready or not. Choose ready.",
];

function closeSplash() {
  const splash = document.getElementById("splash");
  splash.classList.add("fade-out");
  setTimeout(() => splash.style.display = "none", 600);
}

function initSplash() {
  const today     = new Date().toDateString();
  const quoteIdx  = Math.abs(today.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % SPLASH_QUOTES.length;
  setText("splashQuote",    SPLASH_QUOTES[quoteIdx]);
  setText("splashDay",      `Day ${getDayNumber()}`);
  setText("splashCountdown", daysUntilEnd());
  updateXPBar();
}

// ─── Countdown ────────────────────────────────────────────
function daysUntilEnd() {
  const end  = new Date("2026-09-08");
  const now  = new Date();
  const diff = Math.ceil((end - now) / 86400000);
  return Math.max(0, diff);
}

// ─── Navigation ───────────────────────────────────────────
function nextDay() {
  if (data.currentDay < ROADMAP.totalDays) { data.currentDay++; saveData(data); updateAll(); }
}
function previousDay() {
  if (data.currentDay > 1) { data.currentDay--; saveData(data); updateAll(); }
}
function jumpToDay(n) {
  data.currentDay = Math.max(1, Math.min(77, n));
  saveData(data); updateAll();
}
function getDayNumber()  { return data.currentDay || 1; }
function getWeekNumber() { return Math.min(11, Math.ceil(getDayNumber() / 7)); }
function getStartDate()  { return new Date("2026-06-11"); }
function getDayDate(n) {
  const d = getStartDate();
  d.setDate(d.getDate() + n - 1);
  return d.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
}

// ─── Theme ────────────────────────────────────────────────
function toggleTheme() {
  document.body.classList.toggle("light");
  data.darkMode = !document.body.classList.contains("light");
  document.getElementById("themeBtn").textContent = data.darkMode ? "☀️ Light" : "🌙 Dark";
  saveData(data);
}

// ─── Tab switching ────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-pane").forEach(p => { p.classList.remove("active"); p.classList.remove("entering"); });
  document.querySelector(`[data-tab="${tab}"]`).classList.add("active");
  const pane = document.getElementById(`tab-${tab}`);
  pane.classList.add("active");
  requestAnimationFrame(() => pane.classList.add("entering"));
  if (tab === "weeks")    renderWeeksTab();
  if (tab === "projects") renderProjectsTab();
  if (tab === "log")      renderLogTab();
  if (tab === "jobs")     { renderKanban(); renderJobStats(); }
}

// ─── Checklist ────────────────────────────────────────────
function renderChecklist() {
  const dayData   = ROADMAP.days[getDayNumber()];
  const container = document.getElementById("videoChecklist");
  if (!container || !dayData) return;
  container.innerHTML = "";
  dayData.topics.forEach(topic => {
    const key     = `d${getDayNumber()}_${topic}`;
    const checked = data.completedTopics.includes(key);
    const div     = document.createElement("div");
    div.className = "check-item" + (checked ? " done" : "");
    div.innerHTML = `<label><input type="checkbox" ${checked ? "checked" : ""} onchange="toggleTopic('${key}')"><span class="check-label">${topic}</span></label>`;
    container.appendChild(div);
  });
}

function toggleTopic(key) {
  if (data.completedTopics.includes(key)) {
    data.completedTopics = data.completedTopics.filter(t => t !== key);
    data.videosCompleted  = Math.max(0, data.videosCompleted - 1);
  } else {
    data.completedTopics.push(key);
    data.videosCompleted++;
    addXP(5, "Topic completed");
  }
  updateStreak();
  saveData(data);
  updateAll();
  checkMilestones();
}

// ─── Projects ─────────────────────────────────────────────
function renderProjectsTab() {
  const container = document.getElementById("projectsGrid");
  if (!container) return;
  container.innerHTML = "";
  ROADMAP.projects.forEach(p => {
    const done = data.completedProjects.includes(p.id);
    const div  = document.createElement("div");
    div.className = "project-card" + (done ? " done" : "");
    div.innerHTML = `
      <div class="project-header">
        <span class="project-id">P${String(p.id).padStart(2,"0")}</span>
        <span class="project-week">Week ${p.week}</span>
      </div>
      <div class="project-name">${p.name}</div>
      <button class="project-toggle" onclick="toggleProject(${p.id})">${done ? "✅ Completed" : "⬜ Mark Done"}</button>`;
    container.appendChild(div);
  });
}

function toggleProject(id) {
  if (data.completedProjects.includes(id)) {
    data.completedProjects = data.completedProjects.filter(x => x !== id);
  } else {
    data.completedProjects.push(id);
    addXP(50, "Project completed! 🚀");
    fireConfetti();
    showMilestone("🚀", "Project Completed!", ROADMAP.projects.find(p=>p.id===id)?.name || "");
  }
  saveData(data); updateAll(); renderProjectsTab();
}

// ─── Weeks ────────────────────────────────────────────────
function renderWeeksTab() {
  const container   = document.getElementById("weeksGrid");
  if (!container) return;
  container.innerHTML = "";
  const cw = getWeekNumber();
  Object.entries(ROADMAP.weeks).forEach(([wNum, week]) => {
    const wn = parseInt(wNum);
    const div = document.createElement("div");
    div.className = `week-card ${wn === cw ? "current" : ""} ${wn < cw ? "past" : ""}`;
    div.innerHTML = `
      <div class="week-header"><span class="week-label">Week ${wn}</span><span class="week-badge">${wn<cw?"✅":wn===cw?"🔥 Now":"⏳"}</span></div>
      <div class="week-playlist">${week.playlist}</div>
      <div class="week-dates">${week.dateRange}</div>
      <div class="week-meta"><span>🎥 ${week.targetVideos} videos</span><span>⏰ ${week.targetHours}h</span></div>
      <div class="week-deliverable">📦 ${week.deliverable}</div>`;
    container.appendChild(div);
  });
}

// ─── Heatmap ──────────────────────────────────────────────
function renderHeatmap() {
  const container = document.getElementById("heatmap");
  if (!container) return;
  container.innerHTML = "";
  for (let d = 1; d <= 77; d++) {
    const keys      = (ROADMAP.days[d]?.topics || []).map(t => `d${d}_${t}`);
    const done      = keys.filter(k => data.completedTopics.includes(k)).length;
    const total     = keys.length;
    const hasHours  = parseFloat((data.hoursPerDay||{})[d]) > 0;
    let level = 0;
    if (done > 0 || hasHours) level = 1;
    if (done >= Math.ceil(total * 0.5)) level = 2;
    if (done === total && total > 0) level = 3;
    const cell = document.createElement("div");
    cell.className  = `heatmap-cell s${level}`;
    cell.title      = `Day ${d}: ${done}/${total} topics${hasHours ? " + hours logged" : ""}`;
    cell.onclick    = () => jumpToDay(d);
    container.appendChild(cell);
  }
}

// ─── Playlist bars ────────────────────────────────────────
function renderPlaylistBars() {
  const container = document.getElementById("playlistBars");
  if (!container) return;
  container.innerHTML = "";
  ROADMAP.playlists.forEach(pl => {
    // count completed topics that belong to this playlist
    let total = 0, done = 0;
    for (let d = 1; d <= 77; d++) {
      const day = ROADMAP.days[d];
      if (!day || day.playlist !== pl.name) continue;
      total += day.topics.length;
      done  += day.topics.filter(t => data.completedTopics.includes(`d${d}_${t}`)).length;
    }
    const pct = total ? Math.round((done / total) * 100) : 0;
    container.innerHTML += `
      <div class="pl-bar-row">
        <span class="pl-name">${pl.name}</span>
        <div class="pl-track"><div class="pl-fill" style="width:${pct}%"></div></div>
        <span class="pl-pct">${pct}%</span>
      </div>`;
  });
}

// ─── Log Tab ──────────────────────────────────────────────
function renderLogTab() {
  const container = document.getElementById("logContainer");
  if (!container) return;
  const day     = getDayNumber();
  const dayData = ROADMAP.days[day];
  const note    = (data.notes||{})[day] || "";
  const hours   = (data.hoursPerDay||{})[day] || "";
  const totalH  = Object.values(data.hoursPerDay||{}).reduce((s,h)=>s+(parseFloat(h)||0),0).toFixed(1);

  // notes history
  const allNotes = Object.entries(data.notes||{}).filter(([,v])=>v&&v.trim()).sort(([a],[b])=>parseInt(b)-parseInt(a));
  const notesHtml = allNotes.length === 0
    ? `<p class="no-entries">No notes yet. Write your first one! 📝</p>`
    : allNotes.map(([dn, text]) => {
        const d = ROADMAP.days[dn];
        const cur = parseInt(dn) === day;
        return `<div class="log-entry ${cur?"entry-current":""}">
          <div class="entry-header">
            <span class="entry-day-badge">Day ${dn}</span>
            <span class="entry-date">${getDayDate(parseInt(dn))}</span>
            ${d?`<span class="entry-meta">🛠️ ${d.practice}</span>`:""}
            <button class="entry-delete" onclick="deleteNote(${dn})">🗑</button>
          </div>
          <div class="entry-body">${text.replace(/\n/g,"<br>")}</div>
        </div>`;
      }).join("");

  // hours history + weekly chart
  const allHoursEntries = Object.entries(data.hoursPerDay||{}).filter(([,v])=>parseFloat(v)>0).sort(([a],[b])=>parseInt(b)-parseInt(a));
  const hoursHtml = allHoursEntries.length === 0
    ? `<p class="no-entries">No hours logged yet. Start tracking! ⏱</p>`
    : allHoursEntries.map(([dn, h]) => {
        const d   = ROADMAP.days[dn];
        const cur = parseInt(dn) === day;
        const pct = Math.min(100, Math.round((parseFloat(h)/8)*100));
        return `<div class="log-entry ${cur?"entry-current":""}">
          <div class="entry-header">
            <span class="entry-day-badge">Day ${dn}</span>
            <span class="entry-date">${getDayDate(parseInt(dn))}</span>
            ${d?`<span class="entry-meta">${d.playlist}</span>`:""}
            <span class="entry-hours-val">${h}h</span>
            <button class="entry-delete" onclick="deleteHours(${dn})">🗑</button>
          </div>
          <div class="hours-bar-track"><div class="hours-bar-fill" style="width:${pct}%"></div></div>
        </div>`;
      }).join("");

  // weekly bar chart (current week days)
  const weekStart = (getWeekNumber() - 1) * 7 + 1;
  const weekDays  = Array.from({length:7}, (_,i) => weekStart + i).filter(d => d <= 77);
  const maxH      = Math.max(1, ...weekDays.map(d => parseFloat((data.hoursPerDay||{})[d])||0));
  const weekBars  = weekDays.map(d => {
    const h   = parseFloat((data.hoursPerDay||{})[d])||0;
    const pct = Math.round((h/maxH)*100);
    const cur = d === day;
    return `<div class="week-bar-col">
      <div class="week-bar-val">${h>0?h+"h":""}</div>
      <div class="week-bar-track"><div class="week-bar-fill ${cur?"cur":""}" style="height:${pct}%"></div></div>
      <div class="week-bar-lbl">D${d}</div>
    </div>`;
  }).join("");

  // recent jobs preview
  const recentJobs = (data.jobs||[]).slice(0,3);
  const jobsPreview = recentJobs.length === 0
    ? `<p class="no-entries">No applications yet. <button class="link-btn" onclick="switchTab('jobs')">Go to Job Tracker →</button></p>`
    : recentJobs.map(j => `
        <div class="log-entry">
          <div class="entry-header">
            <span class="entry-day-badge" style="background:${STATUS_COLORS[j.status]}22;color:${STATUS_COLORS[j.status]}">${j.status}</span>
            <span class="entry-date">${j.company}</span>
            <span class="entry-meta">${j.role}</span>
            <button class="link-btn" onclick="switchTab('jobs')">View all →</button>
          </div>
        </div>`).join("");

  container.innerHTML = `
    <div class="log-section">
      <div class="log-section-title">📝 Day ${day} Notes <span class="log-section-sub">${getDayDate(day)}</span></div>
      ${dayData?`<p class="log-practice">Practice: <strong>${dayData.practice}</strong></p>`:""}
      <textarea id="noteInput" class="log-textarea" placeholder="What did you learn? Thoughts, blockers, wins…">${note}</textarea>
      <button class="log-save-btn" onclick="saveNote()">💾 Save Note</button>
    </div>

    <div class="log-section">
      <div class="log-section-title">⏱ Hours — Day ${day} <span class="log-section-sub">Total: ${totalH}h</span></div>
      <div class="hours-input-row">
        <input type="number" id="hoursInput" class="hours-input" min="0" max="24" step="0.5" placeholder="Hours today (e.g. 4.5)" value="${hours}">
        <button class="log-save-btn" onclick="logHours()">⏱ Save</button>
      </div>
      <div class="week-bar-chart">${weekBars}</div>
    </div>

    <div class="log-section">
      <div class="log-section-title">💼 Applications <span class="log-section-sub">${(data.jobs||[]).length} total</span></div>
      ${jobsPreview}
    </div>

    <div class="log-section">
      <div class="log-section-title">📚 Notes History <span class="log-count-badge">${allNotes.length}</span></div>
      <div class="entries-list">${notesHtml}</div>
    </div>

    <div class="log-section">
      <div class="log-section-title">📊 Hours History <span class="log-count-badge">${allHoursEntries.length} days</span> <span class="log-section-sub">${totalH}h total</span></div>
      <div class="entries-list">${hoursHtml}</div>
    </div>

    <div class="log-section danger-zone">
      <div class="log-section-title danger-title">⚠️ Danger Zone</div>
      <p class="danger-desc">Permanently delete ALL progress. Cannot be undone.</p>
      <button class="reset-btn" onclick="resetData()">🗑 Reset All Progress</button>
    </div>`;
}

function saveNote() {
  const val = document.getElementById("noteInput").value;
  if (!val.trim()) { showToast("Nothing to save!"); return; }
  if (!data.notes) data.notes = {};
  data.notes[getDayNumber()] = val;
  addXP(2, "Note saved");
  saveData(data); showToast("Note saved! 📝"); renderLogTab();
}
function deleteNote(dn) {
  if (!confirm(`Delete note for Day ${dn}?`)) return;
  delete data.notes[dn]; saveData(data); showToast("Deleted 🗑"); renderLogTab();
}
function logHours() {
  const h = parseFloat(document.getElementById("hoursInput").value);
  if (isNaN(h)||h<0) { showToast("Enter valid hours"); return; }
  if (!data.hoursPerDay) data.hoursPerDay = {};
  data.hoursPerDay[getDayNumber()] = h;
  addXP(h >= 4 ? 15 : h >= 2 ? 8 : 3, "Hours logged");
  saveData(data); showToast(`${h}h saved for Day ${getDayNumber()} 🔥`); renderLogTab();
  updateWeeklyRing();
}
function deleteHours(dn) {
  if (!confirm(`Delete hours for Day ${dn}?`)) return;
  delete data.hoursPerDay[dn]; saveData(data); showToast("Deleted 🗑"); renderLogTab();
}

// ─── Milestones ───────────────────────────────────────────
const MILESTONES = [
  { key:"p25",  pct:25,  emoji:"⚡", title:"25% Done!",   sub:"Quarter of the way there. Keep going!" },
  { key:"p50",  pct:50,  emoji:"🔥", title:"Halfway!",    sub:"You've done half the roadmap. Incredible!" },
  { key:"p75",  pct:75,  emoji:"🚀", title:"75% Done!",   sub:"Almost there. Don't stop now!" },
  { key:"p100", pct:100, emoji:"🏆", title:"COMPLETE!",   sub:"You finished the entire roadmap. LEGEND!" },
];

function checkMilestones() {
  const pct = Math.round((data.videosCompleted / ROADMAP.totalVideos) * 100);
  MILESTONES.forEach(m => {
    if (pct >= m.pct && !(data.milestonesShown||[]).includes(m.key)) {
      data.milestonesShown = [...(data.milestonesShown||[]), m.key];
      addXP(100, m.title);
      saveData(data);
      showMilestone(m.emoji, m.title, m.sub);
      fireConfetti();
    }
  });
}

function showMilestone(emoji, title, sub) {
  setText("milestoneEmoji", emoji);
  setText("milestoneTitle", title);
  setText("milestoneSub",   sub);
  document.getElementById("milestonePopup").classList.remove("hidden");
}
function closeMilestone() {
  document.getElementById("milestonePopup").classList.add("hidden");
}

// ─── Confetti ─────────────────────────────────────────────
function fireConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  if (!canvas) return;
  canvas.style.display = "block";
  const ctx   = canvas.getContext("2d");
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const pieces = Array.from({length:120}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -canvas.height,
    w: 6 + Math.random() * 8,
    h: 3 + Math.random() * 5,
    r: Math.random() * Math.PI * 2,
    dr: (Math.random() - 0.5) * 0.2,
    dy: 2 + Math.random() * 4,
    dx: (Math.random() - 0.5) * 2,
    color: ["#38bdf8","#818cf8","#34d399","#f59e0b","#f87171","#fb7185"][Math.floor(Math.random()*6)],
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(p => {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
      p.y += p.dy; p.x += p.dx; p.r += p.dr;
    });
    frame++;
    if (frame < 120) requestAnimationFrame(draw);
    else { ctx.clearRect(0,0,canvas.width,canvas.height); canvas.style.display="none"; }
  }
  draw();
}

// ─── Streak ───────────────────────────────────────────────
function updateStreak() {
  const today     = new Date().toDateString();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
  if (data.lastActiveDate !== today) {
    data.streak = data.lastActiveDate === yesterday.toDateString() ? (data.streak||0)+1 : 1;
    data.lastActiveDate = today;
  }
}

// ─── Weekly ring ──────────────────────────────────────────
function updateWeeklyRing() {
  const wStart = (getWeekNumber()-1)*7+1;
  const wDays  = Array.from({length:7},(_,i)=>wStart+i).filter(d=>d<=77);
  const weekH  = wDays.reduce((s,d)=>s+(parseFloat((data.hoursPerDay||{})[d])||0),0);
  const target = ROADMAP.weeks[getWeekNumber()]?.targetHours || 20;
  const pct    = Math.min(100, Math.round((weekH/target)*100));
  const ring   = document.getElementById("weeklyRing");
  if (ring) {
    const c = 2*Math.PI*32;
    ring.style.strokeDasharray  = c;
    ring.style.strokeDashoffset = c - (pct/100)*c;
  }
  setText("weeklyRingLabel", weekH.toFixed(1)+"h");
}

// ─── Export ───────────────────────────────────────────────
function exportData() {
  const lines = ["# Nikhil AI Roadmap — Export", `Date: ${new Date().toLocaleDateString()}`, ""];
  lines.push("## HOURS LOG");
  Object.entries(data.hoursPerDay||{}).sort(([a],[b])=>parseInt(a)-parseInt(b)).forEach(([d,h])=>{
    lines.push(`Day ${d} (${getDayDate(parseInt(d))}): ${h}h`);
  });
  lines.push(`\nTotal Hours: ${Object.values(data.hoursPerDay||{}).reduce((s,h)=>s+(parseFloat(h)||0),0).toFixed(1)}h`);
  lines.push("\n## NOTES");
  Object.entries(data.notes||{}).sort(([a],[b])=>parseInt(a)-parseInt(b)).forEach(([d,n])=>{
    lines.push(`\n### Day ${d} — ${getDayDate(parseInt(d))}`);
    lines.push(n);
  });
  lines.push("\n## JOB APPLICATIONS");
  (data.jobs||[]).forEach(j=>{
    lines.push(`\n${j.company} — ${j.role}`);
    lines.push(`  Status: ${j.status} | Method: ${j.method} | Date: ${j.date}`);
    if (j.notes) lines.push(`  Notes: ${j.notes}`);
  });
  const blob = new Blob([lines.join("\n")], {type:"text/plain"});
  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(blob);
  a.download = `nikhil-ai-tracker-export-${new Date().toISOString().split("T")[0]}.txt`;
  a.click();
  showToast("Exported! 📤");
}

// ─── Toast ────────────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("visible");
  setTimeout(() => toast.classList.remove("visible"), 2500);
}

// ─── Progress Ring ────────────────────────────────────────
function updateProgressRing(pct) {
  const circle = document.getElementById("progressRing");
  if (!circle) return;
  const c = 2*Math.PI*70;
  circle.style.strokeDasharray  = c;
  circle.style.strokeDashoffset = c-(pct/100)*c;
}

// ─── Dynamic motivator ────────────────────────────────────
const QUOTES_EARLY  = ["You planted the seed. Now water it every day.","Day 1 energy, but make it permanent.","The beginning is always the hardest. You're past it."];
const QUOTES_MID    = ["You're in the grind now. This is where most people quit. Not you.","Halfway means you've already proven you can do this.","The middle is messy. That's how you know it's real."];
const QUOTES_LATE   = ["The finish line is in sight. Sprint.","You're almost there. Don't let up now.","Future Nikhil is waiting. Get him his dream job."];

function updateMotivator() {
  const pct = Math.round((data.videosCompleted/ROADMAP.totalVideos)*100);
  const pool = pct < 30 ? QUOTES_EARLY : pct < 70 ? QUOTES_MID : QUOTES_LATE;
  const today = new Date().toDateString();
  const idx   = Math.abs(today.split("").reduce((a,c)=>a+c.charCodeAt(0),0)) % pool.length;
  setText("motivatorQuote", `"${pool[idx]}"`);
  setText("motivatorSub",   `— Day ${getDayNumber()} of 77. ${daysUntilEnd()} days until Sep 8. 🔥`);
}

// ─── Master update ────────────────────────────────────────
function updateAll() {
  const day      = getDayNumber();
  const week     = getWeekNumber();
  const progress = Math.min(100, Math.round((data.videosCompleted/ROADMAP.totalVideos)*100));
  const dayData  = ROADMAP.days[day];

  setText("currentDay",        `📅 Day ${day}`);
  setText("currentWeek",       `🚀 Week ${week}`);
  setText("overallProgressPct", progress+"%");
  setText("videosCompleted",   `${data.videosCompleted} / ${ROADMAP.totalVideos}`);
  setText("daysCompleted",     `${day} / ${ROADMAP.totalDays}`);
  setText("projectsCompleted", `${(data.completedProjects||[]).length} / ${ROADMAP.totalProjects}`);
  setText("applicationsCount", (data.jobs||[]).length);
  setText("streakCount",       data.streak||0);
  setText("countdownDays",     daysUntilEnd());

  updateProgressRing(progress);
  updateXPBar();
  updateWeeklyRing();
  updateMotivator();
  renderHeatmap();
  renderPlaylistBars();

  if (dayData) {
    setText("todayDate", getDayDate(day));
    const tHtml = dayData.topics.map(t=>`<span class="topic-tag">${t}</span>`).join("");
    document.getElementById("todayMission").innerHTML = `
      <div class="mission-playlist">${dayData.playlist}</div>
      <div class="mission-topics">${tHtml}</div>
      <div class="mission-meta">
        <span>🎥 ${dayData.targetVideos} videos</span>
        <span>⏰ ${dayData.targetHours}h</span>
        <span>🛠️ ${dayData.practice}</span>
      </div>`;
  }

  const dayKeys = dayData ? dayData.topics.map(t=>`d${day}_${t}`) : [];
  const doneT   = dayKeys.filter(k=>data.completedTopics.includes(k)).length;
  const dayPct  = dayKeys.length ? Math.round((doneT/dayKeys.length)*100) : 0;
  const bar     = document.getElementById("dayProgressBar");
  if (bar) bar.style.width = dayPct+"%";
  setText("dayProgressPct", dayPct+"%");

  // streak banner
  const banner = document.getElementById("streakBanner");
  if (banner) {
    if ((data.streak||0) >= 3) {
      banner.classList.remove("hidden");
      setText("streakBannerText", `${data.streak}-day streak`);
    } else { banner.classList.add("hidden"); }
  }

  if (!data.darkMode) {
    document.body.classList.add("light");
    document.getElementById("themeBtn").textContent = "🌙 Dark";
  } else {
    document.body.classList.remove("light");
    document.getElementById("themeBtn").textContent = "☀️ Light";
  }

  renderChecklist();
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ─── Keyboard shortcuts ───────────────────────────────────
document.addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
  if (e.key === "n" || e.key === "N") nextDay();
  if (e.key === "p" || e.key === "P") previousDay();
  if (e.key === "1") switchTab("today");
  if (e.key === "2") switchTab("weeks");
  if (e.key === "3") switchTab("projects");
  if (e.key === "4") switchTab("jobs");
  if (e.key === "5") switchTab("log");
});

// ─── Init ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initSplash();
  updateAll();

  document.getElementById("themeBtn").addEventListener("click", toggleTheme);
  document.getElementById("nextDayBtn").addEventListener("click", nextDay);
  document.getElementById("prevDayBtn").addEventListener("click", previousDay);
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
  const ji = document.getElementById("jumpInput");
  if (ji) {
    ji.addEventListener("change", () => jumpToDay(parseInt(ji.value)));
    ji.addEventListener("keydown", e => { if(e.key==="Enter") jumpToDay(parseInt(ji.value)); });
  }

  // animate stats count-up
  setTimeout(() => {
    document.querySelectorAll(".stat-card").forEach((c,i) => {
      setTimeout(() => c.classList.add("pop"), i * 80);
    });
  }, 200);
});
