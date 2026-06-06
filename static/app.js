"use strict";

// =====================================================================
//  i18n — traduções
// =====================================================================
// Idioma seguido: 1) preferência guardada (localStorage) → 2) idioma do
// browser (navigator.language) → 3) fallback "en". O utilizador pode mudar
// no menu de conta. Tudo o que está visível na UI passa por t("chave").
const TRANSLATIONS = {
  pt: {
    "account.account": "conta",
    "account.changePassword": "Mudar password",
    "account.logout": "Sair",
    "account.language": "Idioma",

    "conn.checking": "a verificar…",
    "conn.full": "Internet OK",
    "conn.limited": "Ligado, sem internet",
    "conn.portal": "Portal cativo",
    "conn.none": "Sem internet",
    "conn.unknown": "Desconhecido",

    "hero.label": "INTERNET",
    "hero.publicIp": "IP público",
    "hero.org": "Org",
    "hero.location": "Local",
    "hero.wan": "WAN",
    "hero.noWan": "sem WAN",
    "hero.unknownIsp": "Provedor desconhecido",
    "hero.noInternet": "Sem ligação à internet",
    "hero.demoMode": "modo demonstração",
    "hero.gateway": "Gateway",

    "sections.interfaces": "Interfaces",
    "sections.refresh": "↻ Atualizar",
    "sections.wifiNetworks": "Redes Wi-Fi",
    "sections.scan": "⟳ Procurar",

    "device.active": "ativa",
    "device.inactive": "inativa",
    "device.ipv4": "IPv4",
    "device.role": "Papel",
    "device.wifiBtn": "📡 Redes",
    "device.appliedRole": "{dev}: papel aplicado.",

    "role.wan": "Recebe internet",
    "role.share": "Partilha internet",
    "role.lan": "Rede normal",
    "role.none": "Inativa",
    "role.noAp": "sem modo AP",

    "wifi.scanning": "A procurar redes…",
    "wifi.noNetworks": "Nenhuma rede encontrada.",
    "wifi.connected": "● Ligado",
    "wifi.disconnect": "Desligar",
    "wifi.connect": "Ligar",
    "wifi.open": "aberta",
    "wifi.pickToConnect": "Escolhe a rede Wi-Fi a que ligar.",
    "wifi.confirmDisconnect":
      "Desligar a Wi-Fi do vizinho? O box fica sem essa internet (a gestão/SSH por cabo mantém-se).",
    "wifi.disconnecting": "A desligar…",
    "wifi.disconnected": "Wi-Fi desligada.",
    "wifi.connecting": "A ligar a \"{ssid}\"…",
    "wifi.connectedToWan": "Ligado a \"{ssid}\". Esta interface é a WAN.",
    "wifi.passwordPlaceholder": "Password da rede",
    "wifi.shareSsidPrompt": "Nome da rede Wi-Fi a criar",
    "wifi.sharePasswordPrompt": "Password da rede Wi-Fi (mín. 8 caracteres)",
    "wifi.sharePasswordShort": "A password do hotspot Wi-Fi precisa de pelo menos 8 caracteres.",

    "modal.cancel": "Cancelar",
    "modal.connect": "Ligar",
    "modal.save": "Guardar",
    "modal.changePassword": "Mudar password",
    "modal.currentPw": "Password atual",
    "modal.newPw": "Nova password (mín. 6)",
    "modal.confirmNewPw": "Confirmar nova password",

    "auth.signIn": "Entrar",
    "auth.createAccount": "Criar conta",
    "auth.signInBtn": "Entrar",
    "auth.createSignInBtn": "Criar e entrar",
    "auth.firstAccess":
      "Primeiro acesso — define o utilizador e a password de administração.",
    "auth.username": "Utilizador",
    "auth.password": "Password",
    "auth.confirmPassword": "Confirmar password",
    "auth.fillAll": "Preenche todos os campos.",
    "auth.minPw": "Password com mínimo de 6 caracteres.",
    "auth.pwMismatch": "As passwords não coincidem.",
    "auth.sessionExpired": "A sessão expirou. Entra novamente.",
    "auth.signedOut": "Sessão terminada.",

    "pw.minNew": "Nova password com mínimo de 6 caracteres.",
    "pw.newMismatch": "As novas passwords não coincidem.",
    "pw.changed": "Password alterada com sucesso.",

    "demo.activated": "Modo demonstração (sem backend) — dados fictícios.",
    "err.prefix": "Erro: ",
    "err.failPrefix": "Falha: ",
    "pwEye.title": "Ver/ocultar password",
  },
  en: {
    "account.account": "account",
    "account.changePassword": "Change password",
    "account.logout": "Sign out",
    "account.language": "Language",

    "conn.checking": "checking…",
    "conn.full": "Internet OK",
    "conn.limited": "Connected, no internet",
    "conn.portal": "Captive portal",
    "conn.none": "No internet",
    "conn.unknown": "Unknown",

    "hero.label": "INTERNET",
    "hero.publicIp": "Public IP",
    "hero.org": "Org",
    "hero.location": "Location",
    "hero.wan": "WAN",
    "hero.noWan": "no WAN",
    "hero.unknownIsp": "Unknown ISP",
    "hero.noInternet": "No internet connection",
    "hero.demoMode": "demo mode",
    "hero.gateway": "Gateway",

    "sections.interfaces": "Interfaces",
    "sections.refresh": "↻ Refresh",
    "sections.wifiNetworks": "Wi-Fi networks",
    "sections.scan": "⟳ Scan",

    "device.active": "active",
    "device.inactive": "inactive",
    "device.ipv4": "IPv4",
    "device.role": "Role",
    "device.wifiBtn": "📡 Networks",
    "device.appliedRole": "{dev}: role applied.",

    "role.wan": "Receives internet",
    "role.share": "Shares internet",
    "role.lan": "Local network",
    "role.none": "Inactive",
    "role.noAp": "no AP mode",

    "wifi.scanning": "Scanning for networks…",
    "wifi.noNetworks": "No networks found.",
    "wifi.connected": "● Connected",
    "wifi.disconnect": "Disconnect",
    "wifi.connect": "Connect",
    "wifi.open": "open",
    "wifi.pickToConnect": "Pick a Wi-Fi network to connect to.",
    "wifi.confirmDisconnect":
      "Disconnect the Wi-Fi? The box will lose that internet (cable management/SSH stays up).",
    "wifi.disconnecting": "Disconnecting…",
    "wifi.disconnected": "Wi-Fi disconnected.",
    "wifi.connecting": "Connecting to \"{ssid}\"…",
    "wifi.connectedToWan": "Connected to \"{ssid}\". This interface is the WAN.",
    "wifi.passwordPlaceholder": "Network password",
    "wifi.shareSsidPrompt": "Wi-Fi network name to create",
    "wifi.sharePasswordPrompt": "Wi-Fi network password (min. 8 characters)",
    "wifi.sharePasswordShort": "The Wi-Fi hotspot password must be at least 8 characters.",

    "modal.cancel": "Cancel",
    "modal.connect": "Connect",
    "modal.save": "Save",
    "modal.changePassword": "Change password",
    "modal.currentPw": "Current password",
    "modal.newPw": "New password (min. 6)",
    "modal.confirmNewPw": "Confirm new password",

    "auth.signIn": "Sign in",
    "auth.createAccount": "Create account",
    "auth.signInBtn": "Sign in",
    "auth.createSignInBtn": "Create and sign in",
    "auth.firstAccess":
      "First access — set the admin username and password.",
    "auth.username": "Username",
    "auth.password": "Password",
    "auth.confirmPassword": "Confirm password",
    "auth.fillAll": "Fill in all fields.",
    "auth.minPw": "Password must be at least 6 characters.",
    "auth.pwMismatch": "Passwords don't match.",
    "auth.sessionExpired": "Session expired. Sign in again.",
    "auth.signedOut": "Signed out.",

    "pw.minNew": "New password must be at least 6 characters.",
    "pw.newMismatch": "New passwords don't match.",
    "pw.changed": "Password changed successfully.",

    "demo.activated": "Demo mode (no backend) — fictitious data.",
    "err.prefix": "Error: ",
    "err.failPrefix": "Failed: ",
    "pwEye.title": "Show/hide password",
  },
};

const SUPPORTED_LANGS = ["pt", "en"];
const DEFAULT_LANG = "en";

function detectLang() {
  // 1) escolha do utilizador (localStorage)
  try {
    const saved = localStorage.getItem("netshare_lang");
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  } catch (_) {}
  // 2) browser (ex.: "pt-PT" -> "pt"; "en-US" -> "en")
  const langs = (navigator.languages && navigator.languages.length)
    ? navigator.languages : [navigator.language || ""];
  for (const l of langs) {
    const base = (l || "").toLowerCase().split("-")[0];
    if (SUPPORTED_LANGS.includes(base)) return base;
  }
  // 3) fallback
  return DEFAULT_LANG;
}

let CURRENT_LANG = detectLang();

function t(key, vars) {
  let s = (TRANSLATIONS[CURRENT_LANG] && TRANSLATIONS[CURRENT_LANG][key])
    || TRANSLATIONS[DEFAULT_LANG][key]
    || key;
  if (vars) {
    for (const k in vars) s = s.replaceAll("{" + k + "}", vars[k]);
  }
  return s;
}

function applyI18n(root) {
  const r = root || document;
  r.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  r.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
  });
  r.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
  });
  // refletir nas zonas dinâmicas
  const lhtml = document.documentElement;
  if (lhtml) lhtml.setAttribute("lang", CURRENT_LANG);
  refreshDynamicI18n();
}

function refreshDynamicI18n() {
  // textos que dependem do estado atual e foram inseridos por JS
  const c = document.getElementById("conn-text");
  if (c && c.dataset.connKey) c.textContent = t(c.dataset.connKey);
  if (devicesMeta && devicesMeta.length) renderDevices();
  updateHeroMeta();
  // sub-título: se não estiver em demo, deixa o hostname
  const sub = document.querySelector(".brand-sub");
  if (sub && sub.dataset.demo === "1") sub.textContent = t("hero.demoMode");
  // se o ecrã de auth estiver aberto, repinta-o
  if (!document.getElementById("auth-screen").classList.contains("hidden")) {
    showAuth(authMode);
  }
}

function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  CURRENT_LANG = lang;
  try { localStorage.setItem("netshare_lang", lang); } catch (_) {}
  // atualizar o "✓" no seletor
  document.querySelectorAll("[data-lang-opt]").forEach((el) => {
    el.classList.toggle("selected", el.dataset.langOpt === lang);
  });
  applyI18n();
}

// =====================================================================
//  Estado / constantes
// =====================================================================
const ROLE_TAG = { wan: "WAN", share: "PARTILHA", lan: "REDE", none: "—" };
function rolesList() {
  return [
    { id: "wan", label: t("role.wan") },
    { id: "share", label: t("role.share") },
    { id: "lan", label: t("role.lan") },
    { id: "none", label: t("role.none") },
  ];
}
const HIST = 60; // amostras guardadas por interface

let wifiDev = null;
let devicesMeta = [];          // ultima leitura de /api/status
let lastTp = null;             // ultima amostra de /api/throughput
const rates = {};              // dev -> {down, up}
const history = {};            // dev -> [{down, up}, ...]

// ---- modo demonstracao (quando nao ha backend, ex. preview) ------------
let demoMode = false;
let demoT = 0;
const DEMO_DEVICES = [
  { device: "wlan0", type: "wifi", state: "connected", connection: "netshare-wan", role: "wan", ipv4: "192.168.1.42/24", band: "5 GHz" },
  { device: "eth0", type: "ethernet", state: "connected", connection: "netshare-share", role: "share", ipv4: "10.42.0.1/24", link_speed: "1 Gbps" },
  { device: "eth1", type: "ethernet", state: "connected", connection: "netshare-lan", role: "lan", ipv4: "10.10.0.55/16", link_speed: "1 Gbps" },
];
function enterDemo() {
  if (demoMode) return;
  demoMode = true;
  toast(t("demo.activated"));
}
function demoTick() {
  demoT += 0.4;
  const wave = (amp, base, off) => Math.max(0,
    base + amp * (Math.sin(demoT + off) + 0.4 * Math.sin(demoT * 2.3 + off))
    + (Math.random() - 0.5) * amp * 0.4);
  const gen = {
    wlan0: { down: wave(3e6, 6e6, 0), up: wave(6e5, 1.2e6, 1) },
    eth0: { down: wave(6e5, 1.2e6, 2), up: wave(3e6, 6e6, 3) },
    eth1: { down: wave(2e5, 4e5, 4), up: wave(2e5, 4e5, 5) },
  };
  for (const [dev, r] of Object.entries(gen)) {
    rates[dev] = { down: r.down, up: r.up, speed: 1000 };
    pushHistory(dev, r.down, r.up);
  }
  paintRates(); paintHero();
}

// ---------------------------------------------------------------- helpers
async function api(path, opts) {
  const res = await fetch(path, opts);
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !demoMode) {
    // sessao expirou -> voltar ao login
    showAuth("login", t("auth.sessionExpired"));
  }
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[ch]);
}

function toast(msg, isError) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast" + (isError ? " error" : "");
  setTimeout(() => el.classList.add("hidden"), 3500);
}

function fmtRate(bytesPerSec) {
  const bits = bytesPerSec * 8;
  const units = ["bps", "Kbps", "Mbps", "Gbps"];
  let v = bits, i = 0;
  while (v >= 1000 && i < units.length - 1) { v /= 1000; i++; }
  const num = v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1);
  return [num, units[i]];
}

function pushHistory(dev, down, up) {
  if (!history[dev]) history[dev] = [];
  const h = history[dev];
  h.push({ down, up });
  if (h.length > HIST) h.shift();
}

// ---------------------------------------------------------------- canvas
function drawGraph(canvas, data, opts = {}) {
  if (!canvas || !data) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight || canvas.height;
  if (w === 0) return;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const maxV = Math.max(
    1,
    ...data.map((d) => Math.max(d.down, d.up))
  ) * 1.2;
  const n = Math.max(data.length, 2);
  const step = w / (HIST - 1);
  const x0 = w - (n - 1) * step;

  const series = [
    { key: "down", color: opts.downColor || "#2680ff" },
    { key: "up", color: opts.upColor || "#25c685" },
  ];
  for (const s of series) {
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = x0 + i * step;
      const y = h - (d[s.key] / maxV) * (h - 4) - 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    // area fill
    ctx.lineTo(x0 + (n - 1) * step, h);
    ctx.lineTo(x0, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, s.color + "55");
    grad.addColorStop(1, s.color + "00");
    ctx.fillStyle = grad; ctx.fill();
    // line
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = x0 + i * step;
      const y = h - (d[s.key] / maxV) * (h - 4) - 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = s.color; ctx.lineWidth = 1.6; ctx.stroke();
  }
}

// ---------------------------------------------------------------- status
function setConn(connectivity) {
  const map = {
    full: ["ok", "conn.full"],
    limited: ["warn", "conn.limited"],
    portal: ["warn", "conn.portal"],
    none: ["bad", "conn.none"],
    unknown: ["", "conn.unknown"],
  };
  const [cls, key] = map[connectivity] || map.unknown;
  document.getElementById("conn-pill").className = "conn-pill " + cls;
  const el = document.getElementById("conn-text");
  el.dataset.connKey = key;
  el.textContent = t(key);
}

async function refreshStatus() {
  try {
    const data = await api("/api/status");
    setConn(data.connectivity);
    const sub = document.querySelector(".brand-sub");
    sub.dataset.demo = "0";
    sub.textContent = data.hostname || t("hero.gateway");
    devicesMeta = data.devices;
    renderDevices();
    updateHeroMeta();
  } catch (e) {
    // sem backend -> cai em modo demonstracao
    enterDemo();
    setConn("full");
    const sub = document.querySelector(".brand-sub");
    sub.dataset.demo = "1";
    sub.textContent = t("hero.demoMode");
    devicesMeta = DEMO_DEVICES;
    renderDevices();
    updateHeroMeta();
  }
}

// Pequena "pílula" no canto do bloco ↓/↑ a mostrar a banda Wi-Fi actual
// (2.4 GHz / 5 GHz / 6 GHz) ou a velocidade negociada do link Ethernet
// (100 Mbps / 1 Gbps / 2.5 Gbps / ...). Em modo demo usa valores fictícios.
function linkInfoSpan(dev) {
  let txt = "";
  if (dev.type === "wifi") {
    txt = dev.band || (demoMode ? "5 GHz" : "");
  } else if (dev.type === "ethernet") {
    txt = dev.link_speed || (demoMode ? "1 Gbps" : "");
  }
  if (!txt) return "";
  return `<div class="m link-info" title="${esc(txt)}">${esc(txt)}</div>`;
}

function deviceCard(dev) {
  const isWifi = dev.type === "wifi";
  const card = document.createElement("div");
  card.className = "card role-" + dev.role;
  card.dataset.dev = dev.device;
  const up = dev.state === "connected";
  // Wi-Fi só pode partilhar se o driver expõe modo AP (Broadcom wl fica false).
  const shareBlocked = isWifi && dev.ap_capable === false;
  const opts = rolesList().map((r) => {
    const block = r.id === "share" && shareBlocked;
    return `<option value="${r.id}" ${dev.role === r.id ? "selected" : ""}` +
      `${block ? " disabled" : ""}>${esc(r.label)}` +
      `${block ? " (" + esc(t("role.noAp")) + ")" : ""}</option>`;
  }).join("");

  card.innerHTML = `
    <div class="card-top">
      <div class="ico ${isWifi ? "wifi" : "eth"}">${isWifi ? "📶" : "🔌"}</div>
      <div>
        <div class="card-name">${esc(dev.device)}</div>
        <div class="card-sub">${isWifi ? "Wi-Fi" : "Ethernet"}${dev.connection ? " · " + esc(dev.connection) : ""}</div>
      </div>
      <span class="pill ${up ? "up" : "down"}">${up ? t("device.active") : t("device.inactive")}</span>
    </div>
    <div class="kv"><span class="k">${esc(t("device.ipv4"))}</span><span class="v">${esc(dev.ipv4 || "—")}</span></div>
    <div class="kv"><span class="k">${esc(t("device.role"))}</span><span class="v role-tag ${esc(dev.role)}">${esc(ROLE_TAG[dev.role] || "—")}</span></div>
    <div class="mini">
      <div class="m down"><span>↓</span><span class="r-down">0</span><small class="u-down">bps</small></div>
      <div class="m up"><span>↑</span><span class="r-up">0</span><small class="u-up">bps</small></div>
      ${linkInfoSpan(dev)}
    </div>
    <canvas class="spark"></canvas>
    <div class="card-ctrl">
      <label>${esc(t("device.role"))}
        <select data-dev="${esc(dev.device)}" data-type="${esc(dev.type)}">${opts}</select>
      </label>
      ${isWifi ? `<button class="ghost wifi-btn">${esc(t("device.wifiBtn"))}</button>` : ""}
    </div>`;

  card.querySelector("select").addEventListener("change", (e) => onRoleChange(e.target));
  const wb = card.querySelector(".wifi-btn");
  if (wb) wb.addEventListener("click", () => openWifi(dev.device));
  return card;
}

function renderDevices() {
  const box = document.getElementById("devices");
  box.innerHTML = "";
  devicesMeta.forEach((d) => box.appendChild(deviceCard(d)));
  paintRates();
}

// ---------------------------------------------------------------- throughput
async function refreshThroughput() {
  if (demoMode) { demoTick(); return; }
  let tp;
  try { tp = await api("/api/throughput"); } catch { return; }
  if (lastTp) {
    const dt = tp.ts - lastTp.ts;
    if (dt > 0) {
      for (const [dev, cur] of Object.entries(tp.devices)) {
        const prev = lastTp.devices[dev];
        if (!prev) continue;
        const down = Math.max(0, (cur.rx - prev.rx) / dt);
        const up = Math.max(0, (cur.tx - prev.tx) / dt);
        rates[dev] = { down, up, speed: cur.speed };
        pushHistory(dev, down, up);
      }
    }
  }
  lastTp = tp;
  paintRates();
  paintHero();
}

function paintRates() {
  document.querySelectorAll(".card").forEach((card) => {
    const dev = card.dataset.dev;
    const r = rates[dev] || { down: 0, up: 0 };
    const [dn, du] = fmtRate(r.down);
    const [un, uu] = fmtRate(r.up);
    card.querySelector(".r-down").textContent = dn;
    card.querySelector(".u-down").textContent = du;
    card.querySelector(".r-up").textContent = un;
    card.querySelector(".u-up").textContent = uu;
    drawGraph(card.querySelector(".spark"), history[dev] || []);
  });
}

// ---------------------------------------------------------------- hero
function wanDevice() {
  return devicesMeta.find((d) => d.role === "wan") || null;
}

function updateHeroMeta() {
  const wan = wanDevice();
  const el = document.getElementById("hero-wan");
  if (!el) return;
  el.textContent = wan
    ? `${wan.device} (${wan.type === "wifi" ? "Wi-Fi" : "Ethernet"})`
    : t("hero.noWan");
  if (wan) loadIsp();
}

function paintHero() {
  const wan = wanDevice();
  const r = wan ? (rates[wan.device] || { down: 0, up: 0 }) : { down: 0, up: 0 };
  const [dn, du] = fmtRate(r.down);
  const [un, uu] = fmtRate(r.up);
  document.getElementById("hero-down").textContent = dn;
  document.getElementById("hero-down-u").textContent = du;
  document.getElementById("hero-up").textContent = un;
  document.getElementById("hero-up-u").textContent = uu;
  drawGraph(document.getElementById("hero-canvas"), wan ? (history[wan.device] || []) : []);
}

async function loadIsp(force) {
  if (demoMode) {
    document.getElementById("hero-isp").textContent = "MEO Fibra";
    document.getElementById("hero-ip").textContent = "85.240.13.207";
    document.getElementById("hero-org").textContent = "MEO – Comunicações";
    document.getElementById("hero-loc").textContent = "Lisboa, Portugal";
    return;
  }
  try {
    const d = await api("/api/isp" + (force ? "?force=1" : ""));
    if (d.status === "success") {
      document.getElementById("hero-isp").textContent = d.isp || t("hero.unknownIsp");
      document.getElementById("hero-ip").textContent = d.query || "—";
      document.getElementById("hero-org").textContent = d.org || d.as || "—";
      document.getElementById("hero-loc").textContent =
        [d.city, d.country].filter(Boolean).join(", ") || "—";
    } else {
      document.getElementById("hero-isp").textContent = t("hero.noInternet");
      document.getElementById("hero-ip").textContent = "—";
    }
  } catch { /* silencioso */ }
}

// ---------------------------------------------------------------- roles
async function onRoleChange(select) {
  const dev = select.dataset.dev, role = select.value;
  if (role === "wan" && select.dataset.type === "wifi") {
    openWifi(dev);
    toast(t("wifi.pickToConnect"));
    return;
  }
  const body = { dev, role };
  if (role === "share" && select.dataset.type === "wifi") {
    const ssid = prompt(t("wifi.shareSsidPrompt"), `NetShare-${dev}`);
    if (!ssid) { refreshStatus(); return; }
    const password = prompt(t("wifi.sharePasswordPrompt"), "");
    if (!password) { refreshStatus(); return; }
    if (password.length < 8) {
      toast(t("wifi.sharePasswordShort"), true);
      refreshStatus();
      return;
    }
    body.ssid = ssid;
    body.password = password;
  }
  try {
    await api("/api/role", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    toast(t("device.appliedRole", { dev }));
    refreshStatus();
  } catch (e) { toast(t("err.prefix") + e.message, true); refreshStatus(); }
}

// ---------------------------------------------------------------- wifi
function openWifi(dev) {
  wifiDev = dev;
  document.getElementById("wifi-section").classList.remove("hidden");
  document.getElementById("wifi-dev").textContent = "· " + dev;
  scanWifi();
  document.getElementById("wifi-section").scrollIntoView({ behavior: "smooth" });
}

async function scanWifi() {
  if (!wifiDev) return;
  const list = document.getElementById("wifi-list");
  list.innerHTML = `<div class="muted">${t("wifi.scanning")}</div>`;
  try {
    const data = await api("/api/wifi/scan?dev=" + encodeURIComponent(wifiDev));
    list.innerHTML = "";
    if (!data.networks.length) { list.innerHTML = `<div class="muted">${t("wifi.noNetworks")}</div>`; return; }
    data.networks.forEach((n) => list.appendChild(wifiRow(n)));
  } catch (e) {
    list.innerHTML = "";
    const err = document.createElement("div");
    err.className = "muted error";
    err.textContent = t("err.prefix") + e.message;
    list.appendChild(err);
  }
}

function wifiRow(net) {
  const row = document.createElement("div");
  row.className = "wifi-row" + (net.in_use ? " in-use" : "");
  const bars = Math.min(4, Math.round(net.signal / 25));
  const locked = net.security && net.security !== "Open";
  const action = net.in_use
    ? `<span class="wifi-state">${t("wifi.connected")}</span><button class="ghost disconnect">${t("wifi.disconnect")}</button>`
    : `<button class="connect">${t("wifi.connect")}</button>`;
  row.innerHTML = `
    <span class="signal s${bars}">▂▄▆█</span>
    <span class="ssid">${esc(net.ssid)}</span>
    <span class="sec">${locked ? "🔒 " + esc(net.security) : esc(t("wifi.open"))}</span>
    ${action}`;
  if (net.in_use) {
    row.querySelector(".disconnect").addEventListener("click", disconnectWifi);
  } else {
    row.querySelector(".connect").addEventListener("click", () =>
      locked ? askPassword(net.ssid) : connect(net.ssid, ""));
  }
  return row;
}

async function disconnectWifi() {
  if (!confirm(t("wifi.confirmDisconnect"))) return;
  toast(t("wifi.disconnecting"));
  try {
    await api("/api/wifi/disconnect", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dev: wifiDev }),
    });
    toast(t("wifi.disconnected"));
    refreshStatus(); scanWifi();
  } catch (e) { toast(t("err.failPrefix") + e.message, true); }
}

let pendingSsid = null;
function askPassword(ssid) {
  pendingSsid = ssid;
  document.getElementById("modal-ssid").textContent = ssid;
  document.getElementById("modal-pass").value = "";
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("modal-pass").focus();
}
function closeModal() { document.getElementById("modal").classList.add("hidden"); pendingSsid = null; }

async function connect(ssid, password) {
  toast(t("wifi.connecting", { ssid }));
  try {
    await api("/api/wifi/connect", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dev: wifiDev, ssid, password }),
    });
    toast(t("wifi.connectedToWan", { ssid }));
    refreshStatus(); loadIsp(true);
    setTimeout(scanWifi, 1500);   // atualizar a lista (estado Ligado)
  } catch (e) { toast(t("err.failPrefix") + e.message, true); }
}

// ---------------------------------------------------------------- AUTENTICACAO
let authMode = "login";        // "login" | "setup"
let dashboardStarted = false;

function $(id) { return document.getElementById(id); }

function showAuth(mode, msg) {
  authMode = mode;
  const setup = mode === "setup";
  $("auth-title").textContent = setup ? t("auth.createAccount") : t("auth.signIn");
  $("auth-sub").textContent = setup ? t("auth.firstAccess") : (msg || "");
  $("auth-error").textContent = setup ? "" : (msg || "");
  $("auth-pass2").classList.toggle("hidden", !setup);
  $("auth-submit").textContent = setup ? t("auth.createSignInBtn") : t("auth.signInBtn");
  $("auth-pass").setAttribute("autocomplete", setup ? "new-password" : "current-password");
  $("auth-user").value = ""; $("auth-pass").value = ""; $("auth-pass2").value = "";
  $("auth-screen").classList.remove("hidden");
  $("auth-user").focus();
}

function hideAuth() { $("auth-screen").classList.add("hidden"); }

async function submitAuth() {
  const user = $("auth-user").value.trim();
  const pass = $("auth-pass").value;
  $("auth-error").textContent = "";
  if (!user || !pass) { $("auth-error").textContent = t("auth.fillAll"); return; }
  if (authMode === "setup") {
    if (pass.length < 6) { $("auth-error").textContent = t("auth.minPw"); return; }
    if (pass !== $("auth-pass2").value) { $("auth-error").textContent = t("auth.pwMismatch"); return; }
  }
  try {
    await api("/api/" + (authMode === "setup" ? "setup" : "login"), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass }),
    });
    hideAuth();
    $("acct-name").textContent = user;
    startDashboard();
  } catch (e) {
    $("auth-error").textContent = e.message;
  }
}

async function logout() {
  try { await api("/api/logout", { method: "POST" }); } catch {}
  showAuth("login", t("auth.signedOut"));
}

async function changePassword() {
  const cur = $("pw-current").value, nw = $("pw-new").value, nw2 = $("pw-new2").value;
  $("pw-error").textContent = "";
  if (nw.length < 6) { $("pw-error").textContent = t("pw.minNew"); return; }
  if (nw !== nw2) { $("pw-error").textContent = t("pw.newMismatch"); return; }
  try {
    await api("/api/change-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current: cur, new: nw }),
    });
    $("pw-modal").classList.add("hidden");
    toast(t("pw.changed"));
  } catch (e) { $("pw-error").textContent = e.message; }
}

function startDashboard() {
  if (dashboardStarted) return;
  dashboardStarted = true;
  refreshStatus();
  refreshThroughput();
  setInterval(refreshThroughput, 2000);
  setInterval(refreshStatus, 8000);
  setInterval(() => loadIsp(), 300000);
}

async function checkAuth() {
  let me;
  try {
    me = await api("/api/me");
  } catch (e) {
    // sem backend (ex. preview file://) -> modo demonstracao, sem login.
    // Esconder só os itens que dependem de login; manter o seletor de idioma.
    enterDemo();
    hideAuth();
    $("acct-chpw").classList.add("hidden");
    $("acct-logout").classList.add("hidden");
    startDashboard();
    return;
  }
  if (me.setup_needed) return showAuth("setup");
  if (!me.authenticated) return showAuth("login");
  hideAuth();
  $("acct-name").textContent = me.username || t("account.account");
  startDashboard();
}

// olho para ver/ocultar todas as passwords
function addPasswordToggles() {
  document.querySelectorAll('input[type="password"]').forEach((inp) => {
    if (inp.dataset.eye) return;
    inp.dataset.eye = "1";
    const wrap = document.createElement("span");
    wrap.className = "pw-wrap";
    inp.parentNode.insertBefore(wrap, inp);
    wrap.appendChild(inp);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pw-eye";
    btn.textContent = "👁";
    btn.title = t("pwEye.title");
    btn.addEventListener("click", () => {
      const show = inp.getAttribute("type") === "password";
      inp.setAttribute("type", show ? "text" : "password");
      btn.textContent = show ? "🙈" : "👁";
    });
    wrap.appendChild(btn);
  });
}

// ---------------------------------------------------------------- bind
$("refresh").addEventListener("click", refreshStatus);
$("scan").addEventListener("click", scanWifi);
$("modal-cancel").addEventListener("click", closeModal);
$("modal-connect").addEventListener("click", () => {
  const pw = $("modal-pass").value, ssid = pendingSsid;
  closeModal(); connect(ssid, pw);
});
$("auth-submit").addEventListener("click", submitAuth);
$("auth-pass").addEventListener("keydown", (e) => { if (e.key === "Enter" && authMode === "login") submitAuth(); });
$("auth-pass2").addEventListener("keydown", (e) => { if (e.key === "Enter") submitAuth(); });
$("acct-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  $("acct-menu").classList.toggle("hidden");
});
document.addEventListener("click", () => $("acct-menu").classList.add("hidden"));
$("acct-logout").addEventListener("click", logout);
$("acct-chpw").addEventListener("click", () => {
  $("pw-current").value = ""; $("pw-new").value = ""; $("pw-new2").value = "";
  $("pw-error").textContent = "";
  $("pw-modal").classList.remove("hidden");
});
$("pw-cancel").addEventListener("click", () => $("pw-modal").classList.add("hidden"));
$("pw-save").addEventListener("click", changePassword);
// seletor de idioma (no menu de conta)
document.querySelectorAll("[data-lang-opt]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    setLang(el.dataset.langOpt);
  });
  if (el.dataset.langOpt === CURRENT_LANG) el.classList.add("selected");
});
window.addEventListener("resize", () => { paintRates(); paintHero(); });

applyI18n();
addPasswordToggles();
checkAuth();
