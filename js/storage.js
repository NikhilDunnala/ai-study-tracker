const STORAGE_KEY = "nikhil_warroom_v1";

function getData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch(e) {}
  }
  return {
    completedTopics:    [],
    completedProjects:  [],   // fixed: was [1,2,3] — no projects pre-completed
    projectLinks:       {},
    currentDay:         1,
    dsaCurrentDay:      1,
    sqlCurrentDay:      1,
    dsaCompleted:       [],
    sqlDays:            [],
    jobs:               [],
    streak:             0,
    lastActiveDate:     null,
    darkMode:           true,
    driveFileId:        null,
    lastSynced:         null,
  };
}

function saveData(d) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch(e) {
    showToast("⚠️ Could not save — storage full or blocked.");
  }
}

function resetData() {
  const confirmed1 = confirm("⚠️ Delete ALL progress permanently?");
  if (!confirmed1) return;
  const confirmed2 = confirm("🚨 Final warning — cannot be undone. Continue?");
  if (!confirmed2) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

function exportData() {
  // Use getData() defensively instead of relying on global `data`
  const d = (typeof data !== "undefined") ? data : getData();

  const totalDSA      = (typeof DSA_PLAN  !== "undefined") ? DSA_PLAN.totalProblems  : "?";
  const totalProjects = (typeof ROADMAP   !== "undefined") ? ROADMAP.totalProjects   : "?";

  const lines = [
    "# NIKHIL — JOB LANDING WAR ROOM EXPORT",
    `Date: ${new Date().toLocaleDateString()}`,
    "",
    `AI Topics Done:  ${(d.completedTopics  || []).length}`,
    `DSA Solved:      ${(d.dsaCompleted     || []).length}/${totalDSA}`,
    `SQL Days:        ${(d.sqlDays          || []).length}/30`,
    `Projects:        ${(d.completedProjects|| []).length}/${totalProjects}`,
    `Applications:    ${(d.jobs            || []).length}`,
    "",
    "## JOB APPLICATIONS",
  ];

  (d.jobs || []).forEach(j => {
    lines.push(`\n${j.company} — ${j.role} [${j.status}]`);
    lines.push(`  Method: ${j.method} | Date: ${j.date}`);
    if (j.notes) lines.push(`  Notes: ${j.notes}`);
  });

  const blob  = new Blob([lines.join("\n")], { type: "text/plain" });
  const url   = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href     = url;
  anchor.download = `nikhil-warroom-${new Date().toISOString().split("T")[0]}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);   // clean up memory
  showToast("Exported! 📤");
}
