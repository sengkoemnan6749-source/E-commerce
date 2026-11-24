import 'dotenv/config';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { db } from '../config/firebase.js';
import { startBakongSettlementWatcher } from '../services/paymentService.js';

const PORT = Number(process.env.BAKONG_PANEL_PORT || 5055);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEEP_ALIVE_PS1 = path.join(__dirname, 'keepAliveWatcher.ps1');
const STARTUP_DIR = path.join(
  process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
  'Microsoft',
  'Windows',
  'Start Menu',
  'Programs',
  'Startup'
);
const STARTUP_VBS_PATH = path.join(STARTUP_DIR, 'TechTonicBakongWatcher.vbs');

let stopWatcherFn = null;
let paused = false;
const startedAt = new Date().toISOString();
let activeSessions = [];
let recentSettled = [];
let lastError = null;
let lastGatewayCheck = null;

function isAutoStartEnabled() {
  return fs.existsSync(STARTUP_VBS_PATH);
}

function setAutoStart(enabled) {
  if (enabled) {
    fs.mkdirSync(STARTUP_DIR, { recursive: true });
    const escapedPs1 = KEEP_ALIVE_PS1.replace(/"/g, '""');
    const vbs = [
      'Set WshShell = CreateObject("WScript.Shell")',
      `WshShell.Run "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File ""${escapedPs1}""", 0, False`,
      '',
    ].join('\r\n');
    fs.writeFileSync(STARTUP_VBS_PATH, vbs, 'utf8');
  } else if (fs.existsSync(STARTUP_VBS_PATH)) {
    fs.unlinkSync(STARTUP_VBS_PATH);
  }
  return isAutoStartEnabled();
}

function startWatcher() {
  if (stopWatcherFn) return;
  paused = false;
  lastError = null;
  stopWatcherFn = startBakongSettlementWatcher({
    intervalMs: 2500,
    onSessionsUpdate: (list) => {
      activeSessions = Array.isArray(list) ? list : [];
    },
    onSettled: (entry) => {
      lastError = null;
      recentSettled = [entry, ...recentSettled.filter((x) => x.transactionId !== entry.transactionId)].slice(0, 25);
    },
    onError: (msg) => {
      lastError = { message: msg, at: new Date().toISOString() };
    },
  });
}

function pauseWatcher() {
  if (stopWatcherFn) {
    stopWatcherFn();
    stopWatcherFn = null;
  }
  paused = true;
}

async function pingGateway() {
  const gatewayUrl = String(process.env.BAKONG_GATEWAY_URL || 'https://lorndavid.online')
    .trim()
    .replace(/\/+$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${gatewayUrl}/api/v1/check/00000000000000000000000000000000`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    lastGatewayCheck = {
      ok: res.status === 200 || res.status === 404,
      status: res.status,
      checkedAt: new Date().toISOString(),
    };
  } catch (err) {
    lastGatewayCheck = {
      ok: false,
      status: 0,
      error: err?.message || 'Network error',
      checkedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timer);
  }
  return lastGatewayCheck;
}

async function preloadRecentSettled() {
  if (!db) return;
  try {
    const snap = await db.collection('payments').orderBy('createdAt', 'desc').limit(15).get();
    const preloaded = [];
    for (const doc of snap.docs) {
      const d = doc.data() || {};
      if (d.status === 'PAID' && d.verifiedBy === 'bakong_api') {
        preloaded.push({
          transactionId: d.transactionId || doc.id,
          billNumber: d.billNumber || null,
          amount: d.amount,
          currency: d.currency,
          payer: d.payerAccountName || d.bakongData?.fromAccountName || d.bakongData?.fromAccountId || null,
          externalRef: d.bakongData?.externalRef || null,
          settledAt: d.paidAt || d.createdAt || null,
        });
      }
      if (preloaded.length >= 6) break;
    }
    if (preloaded.length > 0 && recentSettled.length === 0) {
      recentSettled = preloaded;
    }
  } catch {
    // Non-fatal preload failure
  }
}

function isAllowedLocalPost(req) {
  const host = String(req.headers.host || '').toLowerCase();
  const validHost = host === `127.0.0.1:${PORT}` || host === `localhost:${PORT}`;
  if (!validHost) return false;
  const origin = String(req.headers.origin || '').toLowerCase();
  if (origin && origin !== `http://127.0.0.1:${PORT}` && origin !== `http://localhost:${PORT}`) {
    return false;
  }
  return true;
}

function getStatusPayload() {
  return {
    running: !paused,
    startedAt,
    autoStart: isAutoStartEnabled(),
    activeSessions,
    recentSettled,
    lastError,
    lastGatewayCheck,
    accountId: String(process.env.BAKONG_ACCOUNT_ID || 'seng_koemnan@bkrt').trim(),
    gatewayUrl: String(process.env.BAKONG_GATEWAY_URL || 'https://lorndavid.online').trim(),
  };
}

const PANEL_HTML = `<!doctype html>
<html lang="km">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>TechTonic Bakong Auto-Verify Panel</title>
  <style>
    :root { color-scheme: dark; --bg:#090d16; --card:#111827; --border:#1f2937; --text:#f8fafc; --muted:#94a3b8; --green:#10b981; --amber:#f59e0b; --red:#ef4444; }
    * { box-sizing: border-box; font-family: "Segoe UI", "Khmer OS Battambang", system-ui, sans-serif; }
    body { margin: 0; background: var(--bg); color: var(--text); padding: 16px; }
    .wrap { max-width: 460px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 14px 16px; }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .title { font-size: 16px; font-weight: 700; margin: 0; }
    .sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
    .badge.ok { background: rgba(16,185,129,.15); color: #34d399; border: 1px solid rgba(16,185,129,.35); }
    .badge.paused { background: rgba(245,158,11,.15); color: #fbbf24; border: 1px solid rgba(245,158,11,.35); }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
    .btns { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
    button { border: 1px solid var(--border); background: #1e293b; color: var(--text); padding: 9px 12px; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; transition: .15s; }
    button:hover { background: #334155; }
    button.primary { background: #059669; border-color: #10b981; }
    button.primary:hover { background: #047857; }
    button.warn { background: #b45309; border-color: #f59e0b; }
    .kv { display: flex; justify-content: space-between; font-size: 12px; padding: 5px 0; border-bottom: 1px dashed rgba(255,255,255,.06); }
    .kv:last-child { border-bottom: none; }
    .mono { font-family: ui-monospace, Consolas, monospace; color: #e2e8f0; }
    .list { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; max-height: 210px; overflow: auto; }
    .item { background: rgba(15,23,42,.75); border: 1px solid var(--border); border-radius: 10px; padding: 9px 11px; font-size: 12px; }
    .empty { font-size: 12px; color: var(--muted); text-align: center; padding: 12px 4px; }
    .pill { font-size: 11px; padding: 2px 7px; border-radius: 6px; background: rgba(16,185,129,.16); color: #34d399; font-weight: 600; }
    .err { background: rgba(239,68,68,.12); border: 1px solid rgba(239,68,68,.35); color: #fca5a5; padding: 8px 10px; border-radius: 10px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="row">
        <div>
          <h1 class="title">Bakong KHQR Auto-Verify</h1>
          <div class="sub">ប្រព័ន្ធផ្ទៀងផ្ទាត់ស្វ័យប្រវត្តិ (Cambodia IP Bridge)</div>
        </div>
        <span id="statusBadge" class="badge ok"><span class="dot"></span><span id="statusText">Running</span></span>
      </div>
      <div style="margin-top:10px;">
        <div class="kv"><span class="sub">Bakong Account</span><span id="acc" class="mono">-</span></div>
        <div class="kv"><span class="sub">Gateway Status</span><span id="gw" class="mono">-</span></div>
        <div class="kv"><span class="sub">Windows Auto-Start</span><span id="autostart" class="mono">-</span></div>
        <div class="kv"><span class="sub">Uptime</span><span id="uptime" class="mono">-</span></div>
      </div>
      <div class="btns">
        <button id="btnPause" type="button">Pause Auto-Verify</button>
        <button id="btnAuto" type="button">Toggle Auto-Start</button>
        <button id="btnPing" class="primary" type="button" style="grid-column:span 2;">Test Gateway (lorndavid.online)</button>
      </div>
      <div id="errBox" class="err" style="display:none;margin-top:10px;"></div>
    </div>

    <div class="card">
      <div class="row">
        <strong style="font-size:13px;">Active Pending QR (<span id="pendingCount">0</span>)</strong>
        <span class="sub">កំពុងរង់ចាំការស្កេន</span>
      </div>
      <div id="pendingList" class="list"></div>
    </div>

    <div class="card">
      <div class="row">
        <strong style="font-size:13px;">Recent Auto-Verified (<span id="settledCount">0</span>)</strong>
        <span class="sub">ទូទាត់ជោគជ័យថ្មីៗ</span>
      </div>
      <div id="settledList" class="list"></div>
    </div>
  </div>
  <script>
    const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString() : '-';
    const fmtUptime = (startIso) => {
      const s = Math.max(0, Math.floor((Date.now() - Date.parse(startIso)) / 1000));
      const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
      return (h ? h + 'h ' : '') + (m ? m + 'm ' : '') + sec + 's';
    };

    async function refresh() {
      try {
        const res = await fetch('/api/status');
        const d = await res.json();
        const badge = document.getElementById('statusBadge');
        badge.className = 'badge ' + (d.running ? 'ok' : 'paused');
        document.getElementById('statusText').textContent = d.running ? 'កំពុងដំណើរការ (Running)' : 'ផ្អាក (Paused)';
        document.getElementById('btnPause').textContent = d.running ? 'ផ្អាក (Pause)' : 'បន្តដំណើរការ (Resume)';
        document.getElementById('btnPause').className = d.running ? 'warn' : 'primary';

        document.getElementById('acc').textContent = d.accountId || '-';
        const gw = d.lastGatewayCheck;
        document.getElementById('gw').textContent = gw
          ? (gw.ok ? 'OK (' + gw.status + ') @ ' + fmtTime(gw.checkedAt) : 'Blocked/Err (' + gw.status + ')')
          : 'Not tested yet';
        document.getElementById('autostart').textContent = d.autoStart ? 'ON (Run on Boot)' : 'OFF';
        document.getElementById('btnAuto').textContent = d.autoStart ? 'បិទ Auto-Start (OFF)' : 'បើក Auto-Start (ON)';
        document.getElementById('uptime').textContent = fmtUptime(d.startedAt);

        const errBox = document.getElementById('errBox');
        if (d.lastError && d.lastError.message) {
          errBox.style.display = 'block';
          errBox.textContent = fmtTime(d.lastError.at) + ' — ' + d.lastError.message;
        } else {
          errBox.style.display = 'none';
        }

        const pending = d.activeSessions || [];
        document.getElementById('pendingCount').textContent = pending.length;
        document.getElementById('pendingList').innerHTML = pending.length
          ? pending.map(x => '<div class="item"><div class="row"><strong>' + (x.billNumber || x.transactionId) + '</strong><span class="mono">' + x.amount + ' ' + x.currency + '</span></div><div class="sub">' + x.transactionId + ' · ' + x.status + '</div></div>').join('')
          : '<div class="empty">មិនទាន់មាន QR កំពុងរង់ចាំទេ (Ready)</div>';

        const settled = d.recentSettled || [];
        document.getElementById('settledCount').textContent = settled.length;
        document.getElementById('settledList').innerHTML = settled.length
          ? settled.map(x => '<div class="item"><div class="row"><strong>' + (x.billNumber || x.transactionId) + '</strong><span class="pill">' + x.amount + ' ' + x.currency + ' PAID</span></div><div class="sub">' + (x.payer || 'Bakong') + ' · ' + fmtTime(x.settledAt) + '</div></div>').join('')
          : '<div class="empty">មិនទាន់មានប្រតិបត្តិការជោគជ័យថ្មីទេ</div>';
      } catch {}
    }

    async function postAction(path) {
      await fetch(path, { method: 'POST' });
      await refresh();
    }

    document.getElementById('btnPause').onclick = () => postAction('/api/toggle-pause');
    document.getElementById('btnAuto').onclick = () => postAction('/api/toggle-autostart');
    document.getElementById('btnPing').onclick = () => postAction('/api/ping-gateway');
    refresh();
    setInterval(refresh, 2000);
  </script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  const urlPath = String(req.url || '/').split('?')[0];

  if (req.method === 'GET' && urlPath === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(PANEL_HTML);
    return;
  }

  if (req.method === 'GET' && urlPath === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(getStatusPayload()));
    return;
  }

  if (req.method === 'POST') {
    if (!isAllowedLocalPost(req)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Forbidden origin/host' }));
      return;
    }

    if (urlPath === '/api/toggle-pause') {
      if (paused) startWatcher();
      else pauseWatcher();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getStatusPayload()));
      return;
    }

    if (urlPath === '/api/toggle-autostart') {
      setAutoStart(!isAutoStartEnabled());
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getStatusPayload()));
      return;
    }

    if (urlPath === '/api/ping-gateway') {
      await pingGateway();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getStatusPayload()));
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.on('error', (err) => {
  if (err?.code === 'EADDRINUSE') {
    console.log(`[Bakong Auto-Verify] Panel already running on http://127.0.0.1:${PORT}`);
    process.exit(0);
  }
  console.error('[Bakong Panel Server Error]', err);
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[Bakong Auto-Verify] Panel active at http://127.0.0.1:${PORT}`);
  startWatcher();
  void pingGateway();
  void preloadRecentSettled();
});
