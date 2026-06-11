
let data = getData();

// ─── Utility ──────────────────────────────────────────────
function setText(id, v) { const e=document.getElementById(id); if(e) e.textContent=v; }
function showToast(msg) {
  const t=document.getElementById("toast"); if(!t) return;
  t.textContent=msg; t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2800);
}
function fireConfetti() {
  const c=document.getElementById("confetti"); if(!c) return;
  c.style.display="block";
  const ctx=c.getContext("2d"); c.width=innerWidth; c.height=innerHeight;
  const colors=["#38bdf8","#818cf8","#34d399","#f59e0b","#f87171","#fff"];
  const p=Array.from({length:130},()=>({
    x:Math.random()*c.width, y:Math.random()*c.height-c.height,
    w:Math.random()*10+4, h:Math.random()*6+3,
    color:colors[Math.floor(Math.random()*colors.length)],
    dx:Math.random()*2-1, dy:Math.random()*4+2, dr:Math.random()*.2-.1, r:0
  }));
  let f=0;
  function draw(){
    ctx.clearRect(0,0,c.width,c.height);
    p.forEach(p=>{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.color;ctx.globalAlpha=.9;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();p.y+=p.dy;p.x+=p.dx;p.r+=p.dr;});
    f++; if(f<140) requestAnimationFrame(draw);
    else {ctx.clearRect(0,0,c.width,c.height); c.style.display="none";}
  }
  draw();
}

// ─── Dates ────────────────────────────────────────────────
function daysLeft()  { return Math.max(0,Math.ceil((new Date("2026-09-08")-new Date())/86400000)); }
function getTodayAIDay() {
  const diff = Math.floor((new Date()-new Date("2026-06-11"))/86400000)+1;
  return Math.max(1,Math.min(77,diff));
}
function getDayDate(n) {
  const d=new Date("2026-06-11"); d.setDate(d.getDate()+n-1);
  return d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
}
function updateStreak() {
  const today=new Date().toDateString(), yest=new Date();
  yest.setDate(yest.getDate()-1);
  if(data.lastActiveDate!==today){
    data.streak = data.lastActiveDate===yest.toDateString() ? (data.streak||0)+1 : 1;
    data.lastActiveDate=today;
  }
}

// ─── Tab switching ────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
  document.querySelectorAll(".tab-pane").forEach(p=>p.classList.remove("active"));
  const btn=document.querySelector(`[data-tab="${tab}"]`);
  const pane=document.getElementById(`tab-${tab}`);
  if(btn)  btn.classList.add("active");
  if(pane) pane.classList.add("active");
  if(tab==="mission") renderMission();
  if(tab==="dsa")     renderDSATab();
  if(tab==="ai")      renderAITab();
  if(tab==="projects")renderProjectsTab();
  if(tab==="jobs")    renderJobsTab();
}

// ─── QUOTES ───────────────────────────────────────────────
const WARROOM_QUOTES = [
  { q:"The person who gets that job is grinding right now. What are you doing?", fire:true },
  { q:"Sep 8 is fixed. The only variable is how prepared you show up.", fire:false },
  { q:"Every algorithm you solve today is a question you'll answer in the interview.", fire:true },
  { q:"You chose this path. Nobody forced you. Now walk it like you mean it.", fire:false },
  { q:"Future Nikhil has the job, the salary, the life. He needs you to not quit today.", fire:true },
  { q:"The grind you hate today is the story you'll love telling tomorrow.", fire:false },
  { q:"Discomfort is the curriculum. Confusion means you're learning.", fire:true },
  { q:"One more problem. One more video. One more day closer.", fire:false },
  { q:"They didn't hire the smartest. They hired the most prepared.", fire:true },
  { q:"Your GitHub is your resume. Every commit is an interview point.", fire:false },
  { q:"You're not studying. You're becoming an AI Engineer.", fire:true },
  { q:"Nobody remembers who almost made it. Finish what you started.", fire:false },
];

function getDailyQuote() {
  const idx = Math.abs(new Date().toDateString().split("").reduce((a,c)=>a+c.charCodeAt(0),0)) % WARROOM_QUOTES.length;
  return WARROOM_QUOTES[idx];
}

// ─── MISSION TAB ──────────────────────────────────────────
function renderMission() {
  const c = document.getElementById("mission-content");
  if (!c) return;

  const aiDay   = data.currentDay || getTodayAIDay();
  const dsaDay  = data.dsaCurrentDay || 1;
  const sqlDay  = data.sqlCurrentDay || 1;
  const aiData  = ROADMAP.days[aiDay];
  const dl      = daysLeft();
  const quote   = getDailyQuote();
  const streak  = data.streak || 0;

  // Progress counts
  const totalAI  = Object.values(ROADMAP.days).reduce((s,d)=>s+d.topics.length,0);
  const doneAI   = (data.completedTopics||[]).length;
  const aiPct    = Math.round((doneAI/totalAI)*100);
  const doneDSA  = (data.dsaCompleted||[]).length;
  const dsaPct   = Math.round((doneDSA/DSA_PLAN.totalProblems)*100);
  const doneSql  = (data.sqlDays||[]).length;
  const sqlPct   = Math.round((doneSql/30)*100);
  const overallPct = Math.round((aiPct+dsaPct+sqlPct)/3);

  // Today's AI topics
  const aiTopics = aiData ? aiData.topics.map((t,i)=>{
    const key=`d${aiDay}_${i}`, done=(data.completedTopics||[]).includes(key);
    return `<label class="mission-check ${done?"done":""}">
      <input type="checkbox" ${done?"checked":""} onchange="toggleAI('${key}')">
      <span>${t}</span>
    </label>`;
  }).join("") : "";

  // Today's DSA problems
  const dsaProbs = [];
  DSA_PLAN.topics.forEach(t=>t.subtopics.forEach(p=>{if(p.day===dsaDay)dsaProbs.push({...p,color:t.color});}));
  const dsaHtml = dsaProbs.map(p=>{
    const done=(data.dsaCompleted||[]).includes(p.id);
    const dc=p.difficulty==="Easy"?"#34d399":p.difficulty==="Medium"?"#f59e0b":"#f87171";
    return `<label class="mission-check ${done?"done":""}">
      <input type="checkbox" ${done?"checked":""} onchange="toggleDSA('${p.id}')">
      <span>${p.title}</span>
      <span class="diff" style="color:${dc}">${p.difficulty}</span>
      <a href="${p.link}" target="_blank" class="tuf">TUF↗</a>
    </label>`;
  }).join("") || `<div class="no-probs">No problems assigned for Day ${dsaDay}</div>`;

  // SQL today
  const sqlDone = (data.sqlDays||[]).includes(sqlDay);

  // Urgency level
  const urgColor = dl<=14?"#f87171":dl<=30?"#f59e0b":"#34d399";
  const urgText  = dl<=14?"🚨 FINAL SPRINT":dl<=30?"⚡ CRUNCH TIME":"🔥 KEEP MOVING";

  c.innerHTML = `
    <!-- WAR BANNER -->
    <div class="war-banner">
      <div class="war-quote ${quote.fire?"fire-quote":""}">"${quote.q}"</div>
      <div class="war-meta">
        <span class="war-streak">${streak>0?`🔥 ${streak}-day streak`:"Start your streak today"}</span>
        <span class="war-sep">·</span>
        <span style="color:${urgColor};font-weight:700">${urgText}</span>
      </div>
    </div>

    <!-- COUNTDOWN + OVERALL -->
    <div class="mission-hero">
      <div class="countdown-block">
        <div class="cd-num" style="color:${urgColor}">${dl}</div>
        <div class="cd-label">DAYS LEFT</div>
        <div class="cd-sub">Sep 8, 2026</div>
      </div>
      <div class="overall-block">
        <div class="overall-label">OVERALL PROGRESS</div>
        <div class="overall-pct">${overallPct}%</div>
        <div class="three-bars">
          <div class="tbar">
            <span class="tbar-lbl" style="color:#818cf8">🤖 AI</span>
            <div class="tbar-track"><div class="tbar-fill" style="width:${aiPct}%;background:#818cf8"></div></div>
            <span class="tbar-pct">${aiPct}%</span>
          </div>
          <div class="tbar">
            <span class="tbar-lbl" style="color:#38bdf8">📊 DSA</span>
            <div class="tbar-track"><div class="tbar-fill" style="width:${dsaPct}%;background:#38bdf8"></div></div>
            <span class="tbar-pct">${dsaPct}%</span>
          </div>
          <div class="tbar">
            <span class="tbar-lbl" style="color:#34d399">🗄️ SQL</span>
            <div class="tbar-track"><div class="tbar-fill" style="width:${sqlPct}%;background:#34d399"></div></div>
            <span class="tbar-pct">${sqlPct}%</span>
          </div>
        </div>
      </div>
      <div class="mission-stats-grid">
        <div class="ms-stat"><div class="ms-num">${doneDSA}</div><div class="ms-lbl">DSA Solved</div></div>
        <div class="ms-stat"><div class="ms-num">${doneAI}</div><div class="ms-lbl">AI Topics</div></div>
        <div class="ms-stat"><div class="ms-num">${doneSql}</div><div class="ms-lbl">SQL Days</div></div>
        <div class="ms-stat"><div class="ms-num">${(data.completedProjects||[]).length}</div><div class="ms-lbl">Projects</div></div>
        <div class="ms-stat"><div class="ms-num">${(data.jobs||[]).length}</div><div class="ms-lbl">Apps Sent</div></div>
        <div class="ms-stat"><div class="ms-num" style="color:${urgColor}">${dl}</div><div class="ms-lbl">Days Left</div></div>
      </div>
    </div>

    <!-- TODAY'S TASKS — 3 COLUMNS -->
    <div class="today-grid">

      <!-- AI TRACK -->
      <div class="today-card ai-card">
        <div class="tc-header">
          <div class="tc-icon" style="background:#818cf820;color:#818cf8">🤖</div>
          <div class="tc-info">
            <div class="tc-title">AI Track — Day ${aiDay}/77</div>
            <div class="tc-sub">${aiData?.playlist||""} · ${aiData?.targetVideos||0} videos · ${aiData?.targetHours||0}h</div>
          </div>
          <div class="tc-nav">
            <button onclick="changeAIDay(-1)" class="tcn-btn">◀</button>
            <button onclick="changeAIDay(1)"  class="tcn-btn">▶</button>
          </div>
        </div>
        <div class="tc-tasks">${aiTopics}</div>
        <div class="tc-practice">🛠️ ${aiData?.practice||""}</div>
      </div>

      <!-- DSA TRACK -->
      <div class="today-card dsa-card">
        <div class="tc-header">
          <div class="tc-icon" style="background:#38bdf820;color:#38bdf8">📊</div>
          <div class="tc-info">
            <div class="tc-title">DSA Track — Day ${dsaDay}/90</div>
            <div class="tc-sub">Striver A2Z · ${dsaProbs.length} problems today</div>
          </div>
          <div class="tc-nav">
            <button onclick="changeDSADay(-1)" class="tcn-btn">◀</button>
            <button onclick="changeDSADay(1)"  class="tcn-btn">▶</button>
          </div>
        </div>
        <div class="tc-tasks">${dsaHtml}</div>
        <div class="tc-progress">${doneDSA}/${DSA_PLAN.totalProblems} total solved</div>
      </div>

      <!-- SQL TRACK -->
      <div class="today-card sql-card">
        <div class="tc-header">
          <div class="tc-icon" style="background:#34d39920;color:#34d399">🗄️</div>
          <div class="tc-info">
            <div class="tc-title">SQL Track — Day ${sqlDay}/30</div>
            <div class="tc-sub">1 focused hour · ${doneSql} days done</div>
          </div>
          <div class="tc-nav">
            <button onclick="changeSQLDay(-1)" class="tcn-btn">◀</button>
            <button onclick="changeSQLDay(1)"  class="tcn-btn">▶</button>
          </div>
        </div>
        <label class="sql-big-check ${sqlDone?"done":""}">
          <input type="checkbox" ${sqlDone?"checked":""} onchange="toggleSQL(${sqlDay})">
          <div class="sql-check-body">
            <div class="sql-check-title">${sqlDone?"✅ SQL hour done!":"Study SQL for 1 hour"}</div>
            <div class="sql-check-sub">${sqlDone?"Great work. Come back tomorrow.":"Open SQLZOO, LeetCode SQL, or your notes."}</div>
          </div>
        </label>
        <div class="sql-dots">
          ${Array.from({length:30},(_,i)=>{
            const d=i+1, done=(data.sqlDays||[]).includes(d), isNow=d===sqlDay;
            return `<div class="sql-dot ${done?"done":""} ${isNow?"now":""}" title="Day ${d}" onclick="toggleSQL(${d})"></div>`;
          }).join("")}
        </div>
        <div class="tc-progress">${doneSql}/30 days complete · ${30-doneSql} left</div>
      </div>

    </div>`;
}

// ─── Toggles ──────────────────────────────────────────────
function toggleAI(key) {
  const arr=data.completedTopics||[];
  data.completedTopics = arr.includes(key) ? arr.filter(x=>x!==key) : [...arr,key];
  updateStreak(); saveAndSync(data); renderMission();
}
function toggleDSA(id) {
  const arr=data.dsaCompleted||[];
  const adding = !arr.includes(id);
  data.dsaCompleted = adding ? [...arr,id] : arr.filter(x=>x!==id);
  if(adding) showToast("Problem solved! 💪");
  updateStreak(); saveAndSync(data); renderMission();
  const dsaPane=document.getElementById("tab-dsa");
  if(dsaPane&&dsaPane.classList.contains("active")) renderDSATab();
}
function toggleSQL(day) {
  const arr=data.sqlDays||[];
  const adding = !arr.includes(day);
  data.sqlDays = adding ? [...arr,day] : arr.filter(x=>x!==day);
  if(adding) showToast("SQL hour logged! 🗄️");
  updateStreak(); saveAndSync(data); renderMission();
}
function changeAIDay(d) {
  data.currentDay=Math.max(1,Math.min(77,(data.currentDay||1)+d));
  saveAndSync(data); renderMission();
  const p=document.getElementById("tab-ai"); if(p&&p.classList.contains("active")) renderAITab();
}
function changeDSADay(d) {
  data.dsaCurrentDay=Math.max(1,Math.min(90,(data.dsaCurrentDay||1)+d));
  saveAndSync(data); renderMission();
  const p=document.getElementById("tab-dsa"); if(p&&p.classList.contains("active")) renderDSATab();
}
function changeSQLDay(d) {
  data.sqlCurrentDay=Math.max(1,Math.min(30,(data.sqlCurrentDay||1)+d));
  saveAndSync(data); renderMission();
}

// ─── AI TAB ───────────────────────────────────────────────
function renderAITab() {
  const c=document.getElementById("ai-content"); if(!c) return;
  const day=data.currentDay||1, aiData=ROADMAP.days[day], cw=Math.min(11,Math.ceil(day/7));

  const totalAI=Object.values(ROADMAP.days).reduce((s,d)=>s+d.topics.length,0);
  const doneAI=(data.completedTopics||[]).length;
  const aiPct=Math.round((doneAI/totalAI)*100);

  // Playlist bars
  const plColors={"Sheryians":"#f59e0b","100 Days ML":"#38bdf8","100 Days DL":"#818cf8","NLP":"#fb7185","LangChain":"#f59e0b","LangGraph":"#34d399","FastAPI":"#06d6a0","MCP":"#a78bfa","Revision":"#94a3b8","Interview Prep":"#f87171"};
  const plBars = ROADMAP.playlists.map(pl=>{
    const plDays=Object.entries(ROADMAP.days).filter(([,d])=>d.playlist===pl.name);
    const tot=plDays.reduce((s,[,d])=>s+d.topics.length,0);
    const done=plDays.reduce((s,[dn,d])=>s+d.topics.filter((_,i)=>(data.completedTopics||[]).includes(`d${dn}_${i}`)).length,0);
    const pct=tot?Math.round((done/tot)*100):0;
    const col=plColors[pl.name]||"#38bdf8";
    return `<div class="pl-row">
      <span class="pl-name">${pl.name}</span>
      <div class="pl-bar"><div class="pl-fill" style="width:${pct}%;background:${col}"></div></div>
      <span class="pl-pct" style="color:${col}">${pct}%</span>
    </div>`;
  }).join("");

  // Checklist
  const checks = aiData ? aiData.topics.map((t,i)=>{
    const key=`d${day}_${i}`, done=(data.completedTopics||[]).includes(key);
    return `<label class="ai-check ${done?"done":""}">
      <input type="checkbox" ${done?"checked":""} onchange="toggleAI('${key}')">
      <span>${t}</span>
      ${done?'<span class="ai-tick">✓</span>':""}
    </label>`;
  }).join("") : "";

  // Weeks grid
  const weeks = Object.entries(ROADMAP.weeks).map(([wn,wk])=>{
    const w=parseInt(wn);
    const wDays=Array.from({length:7},(_,i)=>(w-1)*7+1+i).filter(d=>d<=77);
    const tot=wDays.reduce((s,d)=>s+(ROADMAP.days[d]?.topics?.length||0),0);
    const done=wDays.reduce((s,d)=>{
      if(!ROADMAP.days[d]) return s;
      return s+ROADMAP.days[d].topics.filter((_,i)=>(data.completedTopics||[]).includes(`d${d}_${i}`)).length;
    },0);
    const pct=tot?Math.round((done/tot)*100):0;
    const cur=w===cw, past=w<cw;
    return `<div class="wk-card ${cur?"cur":""} ${past?"past":""}">
      <div class="wk-top">
        <span class="wk-num">Week ${w}</span>
        <span class="wk-badge">${past?"✅":cur?"🔥 NOW":"⏳"}</span>
        <span class="wk-pct">${pct}%</span>
      </div>
      <div class="wk-pl">${wk.playlist}</div>
      <div class="wk-dates">${wk.dateRange}</div>
      <div class="wk-bar"><div class="wk-fill" style="width:${pct}%"></div></div>
      <div class="wk-del">🎯 ${wk.deliverable}</div>
    </div>`;
  }).join("");

  c.innerHTML = `
    <div class="ai-header">
      <div class="ai-nav-row">
        <button onclick="changeAIDay(-1)" class="nav-btn">◀ Prev</button>
        <div class="ai-day-info">
          <span class="ai-day-num">Day ${day}</span>
          <span class="ai-day-date">${getDayDate(day)}</span>
        </div>
        <button onclick="changeAIDay(1)" class="nav-btn">Next ▶</button>
        <input type="number" min="1" max="77" placeholder="Jump…" class="jump-inp"
          onchange="data.currentDay=Math.max(1,Math.min(77,parseInt(this.value)));saveAndSync(data);renderAITab();">
      </div>
      <div class="ai-overall-bar">
        <span class="ai-ovlbl">Overall AI Progress</span>
        <div class="ai-ov-track"><div class="ai-ov-fill" style="width:${aiPct}%"></div></div>
        <span class="ai-ovpct">${aiPct}%</span>
      </div>
    </div>
    <div class="section-card">
      <div class="sc-title">📺 ${aiData?.playlist||""} — Day ${day} Topics
        <span class="sc-sub">🛠️ ${aiData?.practice||""} · 🎥 ${aiData?.targetVideos||0} videos · ⏰ ${aiData?.targetHours||0}h</span>
      </div>
      <div class="ai-checks">${checks}</div>
    </div>
    <div class="section-card">
      <div class="sc-title">📚 Playlist Progress</div>
      <div class="pl-bars">${plBars}</div>
    </div>
    <div class="section-card">
      <div class="sc-title">🗓️ 11-Week Timeline</div>
      <div class="weeks-grid">${weeks}</div>
    </div>`;
}

// ─── DSA TAB ──────────────────────────────────────────────
function renderDSATab() {
  const c=document.getElementById("dsa-content"); if(!c) return;
  const done=(data.dsaCompleted||[]).length, total=DSA_PLAN.totalProblems;
  const pct=Math.round((done/total)*100), dsaDay=data.dsaCurrentDay||1;

  const steps = DSA_PLAN.topics.map(topic=>{
    const td=topic.subtopics.filter(p=>(data.dsaCompleted||[]).includes(p.id)).length;
    const tp=Math.round((td/topic.subtopics.length)*100);
    const hasToday=topic.subtopics.some(p=>p.day===dsaDay);
    return `<div class="dsa-step ${hasToday?"has-today":""}">
      <div class="dsa-step-hdr" onclick="toggleStep('ds-${topic.step}','dc-${topic.step}')">
        <div class="dsa-sl">
          <span class="dsa-icon">${topic.icon}</span>
          <div>
            <div class="dsa-stitle" style="color:${topic.color}">${topic.title}</div>
            <div class="dsa-smeta">Days ${topic.days} · ${topic.subtopics.length} problems</div>
          </div>
        </div>
        <div class="dsa-sr">
          <div class="dsa-sbar"><div class="dsa-sfill" style="width:${tp}%;background:${topic.color}"></div></div>
          <span class="dsa-spct" style="color:${topic.color}">${tp}%</span>
          <span class="dsa-sdone">${td}/${topic.subtopics.length}</span>
          <span id="dc-${topic.step}" class="dsa-chev">${hasToday?"▲":"▼"}</span>
        </div>
      </div>
      <div id="ds-${topic.step}" class="dsa-probs ${hasToday?"":"hidden"}">
        ${topic.subtopics.map(p=>{
          const done=(data.dsaCompleted||[]).includes(p.id), isToday=p.day===dsaDay;
          const dc=p.difficulty==="Easy"?"#34d399":p.difficulty==="Medium"?"#f59e0b":"#f87171";
          return `<div class="dsa-prow ${done?"done":""} ${isToday?"today":""}">
            <label class="dsa-plabel">
              <input type="checkbox" ${done?"checked":""} onchange="toggleDSA('${p.id}')">
              <span>${p.title}</span>
            </label>
            <div class="dsa-pmeta">
              ${isToday?`<span class="today-tag">TODAY</span>`:`<span class="day-tag">D${p.day}</span>`}
              <span class="diff-tag" style="color:${dc};background:${dc}18">${p.difficulty}</span>
              <a href="${p.link}" target="_blank" class="tuf-a">TUF↗</a>
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>`;
  }).join("");

  c.innerHTML = `
    <div class="dsa-hdr">
      <div class="dsa-overall">
        <div class="dsa-big-num">${done}<span>/${total}</span></div>
        <div class="dsa-big-lbl">Problems Solved</div>
        <div class="dsa-ov-bar"><div class="dsa-ov-fill" style="width:${pct}%"></div></div>
        <div class="dsa-ov-pct">${pct}% of Striver A2Z Complete</div>
      </div>
      <div class="dsa-day-ctrl">
        <div class="ddc-label">DSA Day</div>
        <div class="ddc-row">
          <button onclick="changeDSADay(-1)" class="nav-btn">◀</button>
          <span class="ddc-num">Day ${dsaDay}/90</span>
          <button onclick="changeDSADay(1)" class="nav-btn">▶</button>
        </div>
        <div class="ddc-sub">Striver A2Z Sheet</div>
      </div>
    </div>
    <div class="dsa-steps">${steps}</div>`;
}

function toggleStep(id,chevId) {
  const el=document.getElementById(id), cv=document.getElementById(chevId);
  if(el) el.classList.toggle("hidden");
  if(cv) cv.textContent = el.classList.contains("hidden")?"▼":"▲";
}

// ─── PROJECTS TAB ─────────────────────────────────────────
function renderProjectsTab() {
  const c=document.getElementById("projects-content"); if(!c) return;
  c.innerHTML = `<div class="projects-grid">` +
  ROADMAP.projects.map(p=>{
    const done=(data.completedProjects||[]).includes(p.id);
    const links=(data.projectLinks||{})[p.id]||{};
    return `<div class="proj-card ${done?"done":""}">
      <div class="proj-hdr">
        <span class="proj-id">P${String(p.id).padStart(2,"0")}</span>
        <span class="proj-wk">Week ${p.week}</span>
        ${done?'<span class="proj-shipped">✅ SHIPPED</span>':""}
      </div>
      <div class="proj-name">${p.name}</div>
      <div class="proj-links">
        <input class="proj-inp" type="text" placeholder="GitHub URL" value="${links.github||""}"
          onchange="saveProjectLink(${p.id},'github',this.value)">
        <input class="proj-inp" type="text" placeholder="Live Demo URL" value="${links.demo||""}"
          onchange="saveProjectLink(${p.id},'demo',this.value)">
      </div>
      <button class="proj-btn ${done?"done":""}" onclick="toggleProject(${p.id})">
        ${done?"✅ Mark Incomplete":"⬜ Mark as Shipped"}
      </button>
    </div>`;
  }).join("") + `</div>`;
}
function toggleProject(id) {
  const arr=data.completedProjects||[];
  data.completedProjects = arr.includes(id) ? arr.filter(x=>x!==id) : [...arr,id];
  if(!arr.includes(id)) { fireConfetti(); showToast("🚀 Project shipped!"); }
  saveAndSync(data); renderProjectsTab();
}
function saveProjectLink(id,type,val) {
  data.projectLinks=data.projectLinks||{};
  data.projectLinks[id]=data.projectLinks[id]||{};
  data.projectLinks[id][type]=val;
  saveAndSync(data);
}

// ─── Theme ────────────────────────────────────────────────
function toggleTheme() {
  document.body.classList.toggle("light");
  data.darkMode=!document.body.classList.contains("light");
  const b=document.getElementById("themeBtn");
  if(b) b.textContent=data.darkMode?"☀️ Light":"🌙 Dark";
  saveAndSync(data);
}

// ─── Keyboard shortcuts ───────────────────────────────────
document.addEventListener("keydown", e=>{
  if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA") return;
  if(e.key==="1") switchTab("mission");
  if(e.key==="2") switchTab("ai");
  if(e.key==="3") switchTab("dsa");
  if(e.key==="4") switchTab("projects");
  if(e.key==="5") switchTab("jobs");
});

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", ()=>{
  // Auto-sync AI day to real date
  const realDay = getTodayAIDay();
  data.currentDay = realDay;
  if(!data.dsaCurrentDay) data.dsaCurrentDay=1;
  if(!data.sqlCurrentDay) data.sqlCurrentDay=1;
  if(data.darkMode===undefined) data.darkMode=true;
  if(!data.darkMode) document.body.classList.add("light");

  updateStreak();
  saveData(data);

  // Theme btn
  const tb=document.getElementById("themeBtn");
  if(tb){ tb.textContent=data.darkMode?"☀️ Light":"🌙 Dark"; tb.addEventListener("click",toggleTheme); }

  // Tabs
  document.querySelectorAll(".tab-btn").forEach(btn=>{
    btn.addEventListener("click",()=>switchTab(btn.dataset.tab));
  });

  // Sidebar countdown
  const dlEl=document.getElementById("sidebarDays");
  if(dlEl) dlEl.textContent=daysLeft();

  // Sidebar track progress
  const totalAI=Object.values(ROADMAP.days).reduce((s,d)=>s+d.topics.length,0);
  const doneAI=(data.completedTopics||[]).length;
  const doneDSA=(data.dsaCompleted||[]).length;
  const doneSql=(data.sqlDays||[]).length;
  setText("sideAIPct",  Math.round((doneAI/totalAI)*100)+"%");
  setText("sideDSAPct", Math.round((doneDSA/DSA_PLAN.totalProblems)*100)+"%");
  setText("sideSQLPct", Math.round((doneSql/30)*100)+"%");

  // Drive init
  handleOAuthCallback();
  initDrive();

  // Render first tab
  renderMission();
});

