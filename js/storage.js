const STORAGE_KEY = "nikhil_tracker_v4";

function getData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) { try { return JSON.parse(saved); } catch(e) {} }
  return {
    completedTopics: [],
    completedProjects: [1,2,3],
    currentDay: 1,
    notes: {},
    streak: 0,
    lastActiveDate: null,
    jobs: [],
    dsaCompleted: [],      // array of problem ids
    sqlDays: [],           // array of day numbers (1-30) completed
    aiVideosDone: {},      // { "dayKey_topicIdx": true }
  };
}

function saveData(d) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

function exportData() {
  const lines = ["# Nikhil Job Landing Tracker — Export", `Date: ${new Date().toLocaleDateString()}`, ""];
  lines.push("## AI TRACK TOPICS COMPLETED");
  lines.push(`${(data.completedTopics||[]).length} topics checked`);
  lines.push("\n## DSA COMPLETED");
  lines.push(`${(data.dsaCompleted||[]).length} problems solved`);
  lines.push("\n## SQL DAYS COMPLETED");
  lines.push(`${(data.sqlDays||[]).length}/30 days done`);
  lines.push("\n## JOB APPLICATIONS");
  (data.jobs||[]).forEach(j => {
    lines.push(`\n${j.company} — ${j.role}`);
    lines.push(`  Status: ${j.status} | Method: ${j.method} | Date: ${j.date}`);
    if (j.notes) lines.push(`  Notes: ${j.notes}`);
  });
  const blob = new Blob([lines.join("\n")], {type:"text/plain"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `nikhil-tracker-export-${new Date().toISOString().split("T")[0]}.txt`;
  a.click();
  showToast("Exported! 📤");
}
