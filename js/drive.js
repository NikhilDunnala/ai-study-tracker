
// ─── Google Drive Sync ────────────────────────────────────
// Uses Google Drive REST API with a simple OAuth token
// File stored as "nikhil-warroom-data.json" in Drive root

const DRIVE_FILE_NAME = "nikhil-warroom-data.json";
let driveToken = null;
let syncTimeout = null;

function initDrive() {
  // Check if token exists in localStorage
  driveToken = localStorage.getItem("drive_token");
  updateSyncUI();
}

function connectDrive() {
  const clientId = localStorage.getItem("drive_client_id");
  if (!clientId) {
    const id = prompt(
      "Enter your Google OAuth Client ID.\n\n" +
      "Steps to get it:\n" +
      "1. Go to console.cloud.google.com\n" +
      "2. Create project → Enable Google Drive API\n" +
      "3. Create OAuth 2.0 credentials (Web App)\n" +
      "4. Add your GitHub Pages URL as authorized origin\n" +
      "5. Copy Client ID here"
    );
    if (!id) return;
    localStorage.setItem("drive_client_id", id.trim());
  }
  startOAuth();
}

function startOAuth() {
  const clientId = localStorage.getItem("drive_client_id");
  if (!clientId) { showToast("No Client ID set"); return; }
  const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
  const scope = encodeURIComponent("https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file");
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${decodeURIComponent(redirectUri)}&response_type=token&scope=${scope}&prompt=select_account`;
  window.location.href = url;
}

function handleOAuthCallback() {
  const hash = window.location.hash;
  if (!hash.includes("access_token")) return;
  const params = new URLSearchParams(hash.slice(1));
  const token = params.get("access_token");
  if (token) {
    driveToken = token;
    localStorage.setItem("drive_token", token);
    window.history.replaceState({}, document.title, window.location.pathname);
    updateSyncUI();
    showToast("✅ Google Drive connected!");
    syncToDrive();
  }
}

async function syncToDrive() {
  if (!driveToken) return;
  const btn = document.getElementById("syncBtn");
  if (btn) { btn.textContent = "☁️ Syncing…"; btn.disabled = true; }
  try {
    // Search for existing file
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FILE_NAME}'&spaces=drive&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${driveToken}` } }
    );
    if (searchRes.status === 401) { handleTokenExpiry(); return; }
    const searchData = await searchRes.json();
    const fileId = searchData.files?.[0]?.id || data.driveFileId;
    const content = JSON.stringify(data);

    if (fileId) {
      // Update existing
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${driveToken}`, "Content-Type": "application/json" },
        body: content
      });
      data.driveFileId = fileId;
    } else {
      // Create new
      const meta = { name: DRIVE_FILE_NAME, mimeType: "application/json" };
      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(meta)], {type:"application/json"}));
      form.append("file", new Blob([content], {type:"application/json"}));
      const createRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        { method: "POST", headers: { Authorization: `Bearer ${driveToken}` }, body: form }
      );
      const created = await createRes.json();
      data.driveFileId = created.id;
    }
    data.lastSynced = new Date().toISOString();
    saveData(data);
    updateSyncUI();
    showToast("☁️ Synced to Drive!");
  } catch(e) {
    console.error("Drive sync error:", e);
    showToast("Sync failed — check connection");
  } finally {
    if (btn) { btn.textContent = "☁️ Sync"; btn.disabled = false; }
  }
}

async function loadFromDrive() {
  if (!driveToken) { showToast("Connect Drive first"); return; }
  const btn = document.getElementById("loadBtn");
  if (btn) { btn.textContent = "Loading…"; btn.disabled = true; }
  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FILE_NAME}'&spaces=drive&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${driveToken}` } }
    );
    const searchData = await searchRes.json();
    const fileId = searchData.files?.[0]?.id;
    if (!fileId) { showToast("No backup found in Drive"); return; }
    const fileRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${driveToken}` } }
    );
    const loaded = await fileRes.json();
    Object.assign(data, loaded);
    saveData(data);
    showToast("✅ Data loaded from Drive!");
    location.reload();
  } catch(e) {
    showToast("Load failed");
  } finally {
    if (btn) { btn.textContent = "Load"; btn.disabled = false; }
  }
}

function handleTokenExpiry() {
  driveToken = null;
  localStorage.removeItem("drive_token");
  updateSyncUI();
  showToast("Drive session expired — reconnect");
}

function scheduleAutoSync() {
  if (!driveToken) return;
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(syncToDrive, 3000); // sync 3s after last change
}

function updateSyncUI() {
  const indicator = document.getElementById("syncIndicator");
  const syncBtn = document.getElementById("syncBtn");
  const connectBtn = document.getElementById("connectDriveBtn");
  const loadBtn = document.getElementById("loadBtn");
  if (!indicator) return;

  if (driveToken) {
    const lastSync = data.lastSynced
      ? timeAgo(new Date(data.lastSynced))
      : "never";
    indicator.innerHTML = `<span class="sync-dot connected"></span> Drive connected · ${lastSync}`;
    if (syncBtn) syncBtn.style.display = "inline-flex";
    if (loadBtn) loadBtn.style.display = "inline-flex";
    if (connectBtn) connectBtn.style.display = "none";
  } else {
    indicator.innerHTML = `<span class="sync-dot disconnected"></span> Not synced`;
    if (syncBtn) syncBtn.style.display = "none";
    if (loadBtn) loadBtn.style.display = "none";
    if (connectBtn) connectBtn.style.display = "inline-flex";
  }
}

function timeAgo(date) {
  const sec = Math.floor((new Date() - date) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec/60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec/3600)}h ago`;
  return `${Math.floor(sec/86400)}d ago`;
}

// Auto-save wrapper — call this instead of saveData
function saveAndSync(d) {
  saveData(d);
  scheduleAutoSync();
}




