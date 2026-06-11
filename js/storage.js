const STORAGE_KEY = "nikhil_ai_tracker_v3";

function getData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) { try { return JSON.parse(saved); } catch(e) {} }
  return {
    videosCompleted: 0,
    applications: 0,
    darkMode: true,
    completedTopics: [],
    completedProjects: [3],
    currentDay: 1,
    notes: {},
    hoursPerDay: {},
    streak: 0,
    lastActiveDate: null,
    xp: 0,
    milestonesShown: [],
    jobs: [],
  };
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function resetData() {
  const a = confirm("⚠️ WARNING: Delete ALL progress — topics, notes, hours, jobs, everything?\n\nAre you sure?");
  if (!a) return;
  const b = confirm("🚨 FINAL WARNING: No undo. Permanently lost.\n\nConfirm reset?");
  if (!b) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}
