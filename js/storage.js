
const STORAGE_KEY = "nikhil_warroom_v1";

function getData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) { try { return JSON.parse(saved); } catch(e) {} }
  return {
    completedTopics: [],
    completedProjects: [1,2,3],
    projectLinks: {},
    currentDay: 1,
    dsaCurrentDay: 1,
    sqlCurrentDay: 1,
    dsaCompleted: [],
    sqlDays: [],
    jobs: [],
    streak: 0,
    lastActiveDate: null,
    darkMode: true,
    driveFileId: null,
    lastSynced: null,
  };
}

function saveData(d) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

function resetData() {
  const a = confirm("⚠️ Delete ALL progress permanently?");
  if (!a) return;
  const b = confirm("🚨 Final warning — cannot be undone. Continue?");
  if (!b) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

function exportData() {
  const lines = [
    "# NIKHIL — JOB LANDING WAR ROOM EXPORT",
    `Date: ${new Date().toLocaleDateString()}`, "",
    `AI Topics Done: ${(data.completedTopics||[]).length}`,
    `DSA Solved: ${(data.dsaCompleted||[]).length}/${DSA_PLAN.totalProblems}`,
    `SQL Days: ${(data.sqlDays||[]).length}/30`,
    `Projects: ${(data.completedProjects||[]).length}/${ROADMAP.totalProjects}`,
    `Applications: ${(data.jobs||[]).length}`, "",
    "## JOB APPLICATIONS",
  ];
  (data.jobs||[]).forEach(j => {
    lines.push(`\n${j.company} — ${j.role} [${j.status}]`);
    lines.push(`  Method: ${j.method} | Date: ${j.date}`);
    if (j.notes) lines.push(`  Notes: ${j.notes}`);
  });
  const blob = new Blob([lines.join("\n")], {type:"text/plain"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `nikhil-warroom-${new Date().toISOString().split("T")[0]}.txt`;
  a.click();
  showToast("Exported! 📤");
}



