// ─── Google Drive Sync ────────────────────────────────────
// Uses Google Drive REST API with implicit OAuth token
// File stored as "nikhil-warroom-data.json" in Drive root

const DRIVE_FILE_NAME   = "nikhil-warroom-data.json";
const TOKEN_KEY         = "drive_token";
const TOKEN_TS_KEY      = "drive_token_ts";
const CLIENT_ID_KEY     = "drive_client_id";
const TOKEN_TTL_MS      = 55 * 60 * 1000; // 55 min (Google tokens last 60 min)

let driveToken    = null;
let syncTimeout   = null;

// ── Init ─────────────────────────────────────────────────
function initDrive() {
  const token = localStorage.getItem(TOKEN_KEY);
  const ts    = parseInt(localStorage.getItem(TOKEN_TS_KEY) || "0", 10);

  // Expire stored token if older than TTL
  if (token && (Date.now() - ts) < TOKEN_TTL_MS) {
    driveToken = token;
  } else if (token) {
    // Token too old — clear it silently
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_TS_KEY);
  }

  updateSyncUI();
}

// ── OAuth ─────────────────────────────────────────────────
function connectDrive() {
  let clientId = localStorage.getItem(CLIENT_ID_KEY);
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
    clientId = id.trim();
    localStorage.setItem(CLIENT_ID_KEY, clientId);
  }
  startOAuth();
}

function startOAuth() {
  const clientId = localStorage.getItem(CLIENT_ID_KEY);
  if (!clientId) { showToast("No Client ID set"); return; }

  const redirectUri = window.location.origin + window.location.pathname;
  const scope = "https://www.googleapis.com/auth/drive.file"; // drive.file is sufficient
  const url = "https://accounts.google.com/o/oauth2/v2/auth" +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=token` +
    `&scope=${encodeURIComponent(scope)}` +
    `&prompt=select_account`;
  window.location.href = url;
}

// Called from app.js on DOMContentLoaded
function handleOAuthCallback() {
  const hash = window.location.hash;
  if (!hash.includes("access_token")) return;

  const params = new URLSearchParams(hash.slice(1));
  const token  = params.get("access_token");
  if (!token) return;

  driveToken = token;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_TS_KEY, Date.now().toString());

  // Clean the token from the URL bar
  window.history.replaceState({}, document.title, window.location.pathname);
  updateSyncUI();
  showToast("✅ Google Drive connected!");
  syncToDrive();
}

// ── Sync to Drive ─────────────────────────────────────────
async function syncToDrive() {
  if (!driveToken) return;

  const d = (typeof data !== "undefined") ? data : getData();
  const btn = document.getElementById("syncBtn");
  if (btn) { btn.textContent = "☁️ Syncing…"; btn.disabled = true; }

  try {
    // Search for existing file
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FILE_NAME}'&spaces=drive&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${driveToken}` } }
    );
    if (searchRes.status === 401) { handleTokenExpiry(); return; }
    if (!searchRes.ok) throw new Error(`Search failed: ${searchRes.status}`);

    const searchData = await searchRes.json();
    const fileId     = searchData.files?.[0]?.id || d.driveFileId;
    const content    = JSON.stringify(d);

    if (fileId) {
      // Update existing file
      const updateRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method:  "PATCH",
          headers: { Authorization: `Bearer ${driveToken}`, "Content-Type": "application/json" },
          body:    content
        }
      );
      if (updateRes.status === 401) { handleTokenExpiry(); return; }
      d.driveFileId = fileId;
    } else {
      // Create new file (multipart: metadata + content)
      const meta = { name: DRIVE_FILE_NAME, mimeType: "application/json" };
      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(meta)], { type: "application/json" }));
      form.append("file",     new Blob([content],              { type: "application/json" }));

      const createRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        { method: "POST", headers: { Authorization: `Bearer ${driveToken}` }, body: form }
      );
      if (createRes.status === 401) { handleTokenExpiry(); return; }
      const created = await createRes.json();
      d.driveFileId = created.id;
    }

    d.lastSynced = new Date().toISOString();
    saveData(d);
    updateSyncUI();
    showToast("☁️ Synced to Drive!");

  } catch(e) {
    console.error("Drive sync error:", e);
    showToast("Sync failed — check connection");
  } finally {
    if (btn) { btn.textContent = "☁️ Sync"; btn.disabled = false; }
  }
}

// ── Load from Drive ───────────────────────────────────────
async function loadFromDrive() {
  if (!driveToken) { showToast("Connect Drive first"); return; }

  const btn = document.getElementById("loadBtn");
  if (btn) { btn.textContent = "Loading…"; btn.disabled = true; }

  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FILE_NAME}'&spaces=drive&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${driveToken}` } }
    );
    if (searchRes.status === 401) { handleTokenExpiry(); return; }
    if (!searchRes.ok) throw new Error(`Search failed: ${searchRes.status}`);

    const searchData = await searchRes.json();
    const fileId     = searchData.files?.[0]?.id;
    if (!fileId) { showToast("No backup found in Drive"); return; }

    const fileRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${driveToken}` } }
    );
    if (fileRes.status === 401) { handleTokenExpiry(); return; }
    if (!fileRes.ok) throw new Error(`File fetch failed: ${fileRes.status}`);

    const loaded = await fileRes.json();
    const d = (typeof data !== "undefined") ? data : getData();
    Object.assign(d, loaded);
    saveData(d);
    showToast("✅ Data loaded from Drive!");
    location.reload();

  } catch(e) {
    console.error("Drive load error:", e);
    showToast("Load failed — check connection");
  } finally {
    if (btn) { btn.textContent = "⬇️ Load"; btn.disabled = false; }
  }
}

// ── Token Expiry ──────────────────────────────────────────
function handleTokenExpiry() {
  driveToken = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_TS_KEY);
  updateSyncUI();
  showToast("Drive session expired — reconnect");
}

// ── Auto-sync (debounced, 3s after last change) ───────────
function scheduleAutoSync() {
  if (!driveToken) return;
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(syncToDrive, 3000);
}

// Public API: use this everywhere instead of saveData() directly
function saveAndSync(d) {
  saveData(d);
  scheduleAutoSync();
}

// ── Sync UI ───────────────────────────────────────────────
function updateSyncUI() {
  const indicator  = document.getElementById("syncIndicator");
  const syncBtn    = document.getElementById("syncBtn");
  const connectBtn = document.getElementById("connectDriveBtn");
  const loadBtn    = document.getElementById("loadBtn");
  if (!indicator) return;

  const d = (typeof data !== "undefined") ? data : getData();

  if (driveToken) {
    const lastSync = d.lastSynced ? timeAgo(new Date(d.lastSynced)) : "never";
    indicator.innerHTML = `<span class="sync-dot connected"></span> Drive connected · ${lastSync}`;
    // Use classList to match the .hidden utility class from CSS
    syncBtn?.classList.remove("hidden");
    loadBtn?.classList.remove("hidden");
    connectBtn?.classList.add("hidden");
  } else {
    indicator.innerHTML = `<span class="sync-dot disconnected"></span> Not synced`;
    syncBtn?.classList.add("hidden");
    loadBtn?.classList.add("hidden");
    connectBtn?.classList.remove("hidden");
  }
}

// ── Helpers ───────────────────────────────────────────────
function timeAgo(date) {
  const sec = Math.floor((Date.now() - date) / 1000);
  if (sec < 60)    return "just now";
  if (sec < 3600)  return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}
