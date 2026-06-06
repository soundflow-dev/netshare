#!/usr/bin/env python3
"""NetShare - painel web para gerir a partilha de internet por Wi-Fi.

Backend só com a biblioteca padrao do Python (sem pip), por baixo fala com o
NetworkManager via `nmcli`. Serve a SPA estatica em static/ e expoe uma pequena
API JSON. Pensado para correr como servico systemd, preso a interface de gestao.
"""
import hashlib
import hmac
import json
import os
import re
import secrets
import socket
import subprocess
import sys
import time
import urllib.request
from base64 import urlsafe_b64decode, urlsafe_b64encode
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from http.cookies import SimpleCookie
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
CONFIG_PATH = os.environ.get("NETSHARE_CONFIG", "/etc/netshare/config.json")

DEFAULTS = {
    "host": "0.0.0.0",
    "port": 8088,
    "share_subnet": "10.42.0.1/24",
    "share_wifi_ssid": "NetShare",
}

# Nomes fixos das ligacoes que este painel cria/gere, por papel.
CON = {"wan": "netshare-wan", "share": "netshare-share", "lan": "netshare-lan"}


def load_config():
    cfg = dict(DEFAULTS)
    try:
        with open(CONFIG_PATH) as fh:
            cfg.update(json.load(fh))
    except FileNotFoundError:
        pass
    return cfg


CONFIG = load_config()


# --------------------------------------------------------------------------- #
#  autenticacao (credenciais com hash + sessoes por cookie)                   #
# --------------------------------------------------------------------------- #
AUTH_PATH = os.environ.get("NETSHARE_AUTH", "/etc/netshare/auth.json")
SESSION_TTL = 7 * 24 * 3600      # 7 dias
COOKIE_NAME = "netshare_session"
_PBKDF_ROUNDS = 200_000


def load_auth():
    """Le as credenciais guardadas, ou None se ainda nao houver (1.o arranque)."""
    try:
        with open(AUTH_PATH) as fh:
            return json.load(fh)
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def _hash_pw(password, salt_hex):
    return hashlib.pbkdf2_hmac(
        "sha256", password.encode(), bytes.fromhex(salt_hex), _PBKDF_ROUNDS
    ).hex()


def set_credentials(username, password):
    """Cria/actualiza o utilizador. Mantem o segredo de sessao se ja existir."""
    if not username or not password:
        raise ValueError("utilizador e password sao obrigatorios")
    if len(password) < 6:
        raise ValueError("a password tem de ter pelo menos 6 caracteres")
    existing = load_auth() or {}
    salt = secrets.token_hex(16)
    auth = {
        "username": username,
        "salt": salt,
        "hash": _hash_pw(password, salt),
        "secret": existing.get("secret") or secrets.token_hex(32),
    }
    os.makedirs(os.path.dirname(AUTH_PATH), exist_ok=True)
    with open(AUTH_PATH, "w") as fh:
        json.dump(auth, fh)
    os.chmod(AUTH_PATH, 0o600)


def verify_pw(username, password):
    auth = load_auth()
    if not auth:
        return False
    user_ok = hmac.compare_digest(username or "", auth["username"])
    pass_ok = hmac.compare_digest(_hash_pw(password or "", auth["salt"]), auth["hash"])
    return user_ok and pass_ok


def make_token():
    auth = load_auth()
    exp = str(int(time.time()) + SESSION_TTL)
    payload = f"{auth['username']}|{exp}"
    sig = hmac.new(bytes.fromhex(auth["secret"]), payload.encode(),
                   hashlib.sha256).hexdigest()
    return urlsafe_b64encode(f"{payload}|{sig}".encode()).decode()


def verify_token(token):
    auth = load_auth()
    if not auth or not token:
        return False
    try:
        raw = urlsafe_b64decode(token.encode()).decode()
        username, exp, sig = raw.rsplit("|", 2)
        payload = f"{username}|{exp}"
        good = hmac.new(bytes.fromhex(auth["secret"]), payload.encode(),
                        hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, good):
            return False
        if int(exp) < time.time():
            return False
        return hmac.compare_digest(username, auth["username"])
    except Exception:  # noqa: BLE001
        return False


# --------------------------------------------------------------------------- #
#  nmcli helpers                                                              #
# --------------------------------------------------------------------------- #
# Forçar locale C em TODAS as ferramentas de rede: garante saída em inglês
# canónico (ex.: estado "connected") seja qual for o idioma do sistema. Sem
# isto, num SO noutra língua o nmcli devolveria "ligado"/"verbunden"/... e o
# parsing (e a UI) partia-se.
_C_ENV = {**os.environ, "LC_ALL": "C", "LANG": "C"}


def nmcli(*args, check=False, timeout=40):
    """Corre nmcli e devolve (rc, stdout, stderr)."""
    try:
        proc = subprocess.run(
            ["nmcli", *args],
            capture_output=True, text=True, timeout=timeout, env=_C_ENV,
        )
    except FileNotFoundError:
        return 127, "", "nmcli nao encontrado (NetworkManager instalado?)"
    except subprocess.TimeoutExpired:
        return 124, "", "nmcli excedeu o tempo limite"
    if check and proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or "erro nmcli")
    return proc.returncode, proc.stdout, proc.stderr


def _terse(out):
    """Divide a saida -t do nmcli em linhas de campos, respeitando o escape \\:."""
    rows = []
    for line in out.splitlines():
        if not line:
            continue
        fields = re.split(r"(?<!\\):", line)
        rows.append([f.replace("\\:", ":").replace("\\\\", "\\") for f in fields])
    return rows


def list_devices():
    """Lista interfaces fisicas com tipo, estado, ligacao e papel atribuido."""
    rc, out, _ = nmcli("-t", "-f", "DEVICE,TYPE,STATE,CONNECTION", "device", "status")
    devices = []
    if rc != 0:
        return devices
    con_to_role = {v: k for k, v in CON.items()}
    for row in _terse(out):
        if len(row) < 4:
            continue
        dev, typ, state, con = row[:4]
        if typ not in ("wifi", "ethernet"):
            continue
        entry = {
            "device": dev,
            "type": typ,
            "state": state,
            "connection": con,
            "role": con_to_role.get(con, "none"),
            "ipv4": _device_ipv4(dev),
        }
        connected = state == "connected"
        if typ == "wifi":
            entry["ap_capable"] = wifi_ap_capable(dev)
            # banda actual (2.4 GHz / 5 GHz / 6 GHz) — só se ligado
            entry["band"] = _wifi_band(dev) if connected else ""
        elif typ == "ethernet":
            # velocidade negociada do link (100 Mbps / 1 Gbps / 2.5 Gbps / ...)
            entry["link_speed"] = _eth_link_speed(dev) if connected else ""
        devices.append(entry)
    return devices


def _wifi_band(dev):
    """Devolve a banda Wi-Fi actual ('2.4 GHz' / '5 GHz' / '6 GHz') ou ''."""
    try:
        out = subprocess.run(["iw", "dev", dev, "link"],
                             capture_output=True, text=True,
                             timeout=4, env=_C_ENV).stdout
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return ""
    m = re.search(r"freq:\s*(\d+)", out)
    if not m:
        return ""
    f = int(m.group(1))
    if f < 3000:
        return "2.4 GHz"
    if f < 6000:
        return "5 GHz"
    if f < 8000:
        return "6 GHz"
    return f"{f} MHz"


def _eth_link_speed(dev):
    """Devolve a velocidade do link ('100 Mbps' / '1 Gbps' / '2.5 Gbps' / ...) ou ''."""
    try:
        speed = int(Path(f"/sys/class/net/{dev}/speed").read_text().strip())
    except (OSError, ValueError):
        return ""
    if speed <= 0:
        return ""
    if speed >= 1000:
        gbps = speed / 1000
        return f"{int(gbps)} Gbps" if gbps == int(gbps) else f"{gbps:g} Gbps"
    return f"{speed} Mbps"


def _device_ipv4(dev):
    rc, out, _ = nmcli("-t", "-f", "IP4.ADDRESS", "device", "show", dev)
    if rc != 0:
        return ""
    addrs = []
    for row in _terse(out):
        if len(row) >= 2 and row[0].startswith("IP4.ADDRESS"):
            addrs.append(row[1])
    return ", ".join(addrs)


def wifi_scan(dev):
    nmcli("device", "wifi", "rescan", "ifname", dev, timeout=20)
    rc, out, err = nmcli(
        "-t", "-f", "IN-USE,SSID,SIGNAL,SECURITY", "device", "wifi", "list",
        "ifname", dev,
    )
    if rc != 0:
        raise RuntimeError(err.strip() or "scan falhou")
    seen, nets = set(), []
    for row in _terse(out):
        if len(row) < 4:
            continue
        in_use, ssid, signal, sec = row[0], row[1], row[2], row[3]
        if not ssid or ssid in seen:
            continue
        seen.add(ssid)
        nets.append({
            "ssid": ssid,
            "signal": int(signal) if signal.isdigit() else 0,
            "security": sec or "Open",
            "in_use": in_use.strip() == "*",
        })
    nets.sort(key=lambda n: n["signal"], reverse=True)
    return nets


# --------------------------------------------------------------------------- #
#  accoes                                                                     #
# --------------------------------------------------------------------------- #
WAN_METRIC = "50"  # métrica baixa => a WAN Wi-Fi é a rota default primária


def wifi_connect(dev, ssid, password):
    """Liga a interface Wi-Fi a uma rede e marca essa ligacao como a WAN.

    Remove primeiro qualquer perfil netshare-wan antigo (evita o erro
    'key-mgmt property is missing' ao religar) e volta a fixar a metrica baixa
    para a WAN continuar a ser o default primario.
    """
    if not dev or not ssid:
        raise ValueError("interface e SSID sao obrigatorios")
    if not is_wifi(dev):
        raise ValueError("a interface escolhida nao e Wi-Fi")

    # A WAN é única, mas antes de a mover para esta placa limpamos também
    # qualquer perfil NetShare antigo associado à própria interface.
    _delete_managed_for_device(dev, keep=None)
    _delete_conn(CON["wan"])
    args = ["device", "wifi", "connect", ssid, "ifname", dev,
            "name", CON["wan"]]
    if password:
        args += ["password", password]
    rc, _, err = nmcli(*args, timeout=60)
    if rc != 0:
        raise RuntimeError(err.strip() or "ligacao Wi-Fi falhou")
    nmcli("connection", "modify", CON["wan"],
          "ipv4.never-default", "no",
          "ipv4.route-metric", WAN_METRIC, "ipv6.route-metric", WAN_METRIC)
    nmcli("connection", "up", CON["wan"], timeout=40)
    return True


def wifi_disconnect(dev):
    """Desliga a Wi-Fi (baixa a ligacao WAN). A gestao/SSH e por cabo, fica."""
    if not dev:
        raise ValueError("interface obrigatoria")
    rc, _, err = nmcli("device", "disconnect", dev, timeout=30)
    if rc != 0:
        raise RuntimeError(err.strip() or "falha ao desligar")
    return True


AUTOCONNECT_PRIO = "50"     # netshare-* ganham às ligações geradas pelo netplan


def is_wifi(dev):
    base = Path("/sys/class/net") / dev
    return (base / "wireless").exists() or (base / "phy80211").exists()


def wifi_ap_capable(dev):
    """True se a placa Wi-Fi suporta modo AP.

    Drivers sem mac80211/phy80211 (ex.: Broadcom BCM43xx com `wl`) devolvem
    False, que é exatamente o que queremos: podem ser WAN, mas não hotspot.
    """
    phylink = Path("/sys/class/net") / dev / "phy80211"
    try:
        phy = phylink.resolve().name          # ex.: "phy0"
    except OSError:
        return False
    if not phy.startswith("phy"):
        return False
    try:
        info = subprocess.run(["iw", "phy", phy, "info"],
                              capture_output=True, text=True, timeout=8,
                              env=_C_ENV).stdout
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False
    in_modes = False
    for line in info.splitlines():
        s = line.strip()
        if "Supported interface modes" in s:
            in_modes = True
            continue
        if in_modes:
            if s.startswith("*"):
                if s.replace("*", "").strip() == "AP":
                    return True
            elif s:
                break
    return False


def apply_role(dev, role, opts=None):
    """Atribui um papel a uma interface, criando/ajustando a ligacao NM."""
    opts = opts or {}
    if not dev:
        raise ValueError("interface obrigatoria")
    if role not in ("wan", "share", "lan", "none"):
        raise ValueError("papel invalido")

    _delete_managed_for_device(dev, keep=None)

    if role == "none":
        _clear_device(dev)
        return

    name = CON[role]
    # O papel é único: se já existir noutra interface, move para esta.
    _delete_conn(name)

    if role == "wan":
        if is_wifi(dev):
            raise RuntimeError("Para usar Wi-Fi como WAN, escolhe a rede Wi-Fi no painel.")
        _add_ethernet(dev, name, method="auto", never_default=False)
    elif role == "share":
        _add_share(dev, name, opts)
        _ensure_ip_forward()
    elif role == "lan":
        # gestao/rede normal: apanha IP mas NUNCA vira rota default
        _add_ethernet(dev, name, method="auto", never_default=True)

    # garantir que as ligacoes do painel ganham as do netplan no arranque
    nmcli("connection", "modify", name,
          "connection.autoconnect", "yes",
          "connection.autoconnect-priority", AUTOCONNECT_PRIO)

    rc, _, err = nmcli("connection", "up", name, timeout=40)
    if rc != 0:
        raise RuntimeError(err.strip() or f"falha ao ativar {name}")

    if role == "lan":
        # routing de gestão automático (genérico, sem IPs fixos)
        _apply_mgmt_policy(dev)


def _add_ethernet(dev, name, method, never_default):
    nmcli("connection", "add", "type", "ethernet", "ifname", dev,
          "con-name", name, "ipv4.method", method, check=True)
    nmcli("connection", "modify", name,
          "ipv4.never-default", "yes" if never_default else "no")


def _add_share(dev, name, opts=None):
    """Modo partilha: NAT + DHCP automaticos do NetworkManager."""
    opts = opts or {}
    if is_wifi(dev):
        _add_wifi_share(dev, name, opts)
        return
    nmcli("connection", "add", "type", "ethernet", "ifname", dev,
          "con-name", name, "ipv4.method", "shared", check=True)
    subnet = CONFIG.get("share_subnet") or DEFAULTS["share_subnet"]
    nmcli("connection", "modify", name, "ipv4.addresses", subnet)


def _add_wifi_share(dev, name, opts):
    """Cria hotspot Wi-Fi com NAT/DHCP via NetworkManager shared mode."""
    if not wifi_ap_capable(dev):
        raise RuntimeError(
            "Esta placa Wi-Fi não suporta modo AP — pode receber internet, "
            "mas não pode partilhar por Wi-Fi. Em Broadcom BCM43xx com driver "
            "`wl`, usa Ethernet para partilhar.")
    ssid = (opts.get("ssid") or CONFIG.get("share_wifi_ssid")
            or DEFAULTS["share_wifi_ssid"]).strip()
    password = (opts.get("password") or CONFIG.get("share_wifi_password") or "")
    if not ssid:
        raise ValueError("SSID do hotspot obrigatorio")
    if len(password) < 8:
        raise ValueError("password do hotspot Wi-Fi tem de ter pelo menos 8 caracteres")

    subnet = CONFIG.get("share_subnet") or DEFAULTS["share_subnet"]
    nmcli("connection", "add", "type", "wifi", "ifname", dev,
          "con-name", name, "ssid", ssid, check=True)
    nmcli("connection", "modify", name,
          "wifi.mode", "ap",
          "ipv4.method", "shared",
          "ipv4.addresses", subnet,
          "wifi-sec.key-mgmt", "wpa-psk",
          "wifi-sec.psk", password,
          check=True)


def _ensure_ip_forward():
    try:
        Path("/proc/sys/net/ipv4/ip_forward").write_text("1")
    except OSError:
        pass


def _delete_conn(name):
    nmcli("connection", "delete", name)  # best effort


def _conn_devices(name):
    rc, out, _ = nmcli("-g", "GENERAL.DEVICES", "connection", "show", name)
    if rc != 0:
        return []
    return [line.strip() for line in out.splitlines() if line.strip()]


def _conn_interface_name(name):
    rc, out, _ = nmcli("-g", "connection.interface-name", "connection", "show", name)
    if rc != 0:
        return ""
    return out.strip().splitlines()[0].strip() if out.strip() else ""


def _conn_bound_to_device(name, dev):
    return dev in _conn_devices(name) or _conn_interface_name(name) == dev


def _delete_managed_for_device(dev, keep=None):
    """Remove perfis NetShare ligados a esta interface.

    Importante: ao pôr uma placa como "Inativa" não podemos apagar os perfis
    globais das outras placas, senão uma mudança inocente desmonta WAN/gestão.
    """
    for name in CON.values():
        if name == keep:
            continue
        if _conn_bound_to_device(name, dev):
            _delete_conn(name)


def _nmcli_first(dev, field):
    rc, out, _ = nmcli("-g", field, "device", "show", dev)
    lines = [x for x in out.strip().splitlines() if x.strip()] if rc == 0 else []
    return lines[0] if lines else ""


def _ip(*args):
    try:
        subprocess.run(["ip", *args], capture_output=True, text=True,
                       timeout=8, env=_C_ENV)
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass


def _apply_mgmt_policy(dev):
    """Rota de retorno de gestão — simples e ROBUSTA (sem policy routing).

    Acrescenta uma rota MAIS ESPECÍFICA para a rede de gestão (o /16 à volta do
    IP de gestão) via a gateway de gestão, na tabela principal. Mais específica
    que o default => o tráfego para o admin volta sempre pela interface de
    gestão, mesmo com a WAN como default — sem tabelas/regras separadas, que se
    mostraram frágeis no arranque e causaram lockouts. Persistência no arranque:
    netshare-mgmt-route.service + dispatcher 90-netshare-mgmt (chamam mgmt-route.sh).
    """
    addr = _nmcli_first(dev, "IP4.ADDRESS")     # ex.: 192.168.10.22/24
    gw = _nmcli_first(dev, "IP4.GATEWAY")       # ex.: 192.168.10.1
    if not addr or not gw:
        return
    src = addr.split("/")[0]
    net = ".".join(src.split(".")[:2]) + ".0.0/16"   # 192.168.10.22 -> 192.168.0.0/16
    _ip("route", "replace", net, "via", gw, "dev", dev, "metric", "50")


def _clear_device(dev):
    nmcli("device", "disconnect", dev)


def status():
    rc, out, _ = nmcli("networking", "connectivity")
    connectivity = out.strip() if rc == 0 else "unknown"
    return {
        "connectivity": connectivity,   # full|limited|portal|none|unknown
        "hostname": socket.gethostname(),
        "devices": list_devices(),
    }


# --------------------------------------------------------------------------- #
#  throughput (leitura rapida de /sys, sem nmcli)                             #
# --------------------------------------------------------------------------- #
SYS_NET = Path("/sys/class/net")


def throughput():
    """Contadores rx/tx (bytes) + velocidade do link por interface.

    A UI faz o delta entre amostras para calcular o ritmo. Le so de /sys,
    por isso e leve e pode ser pedido de 1 em 1 segundo.
    """
    devices = {}
    if not SYS_NET.is_dir():
        return {"ts": time.time(), "devices": devices}
    for path in SYS_NET.iterdir():
        name = path.name
        if name == "lo":
            continue
        try:
            rx = int((path / "statistics/rx_bytes").read_text())
            tx = int((path / "statistics/tx_bytes").read_text())
        except OSError:
            continue
        speed = 0
        try:
            speed = int((path / "speed").read_text())  # Mbps (-1 se sem link)
        except OSError:
            pass
        devices[name] = {"rx": rx, "tx": tx, "speed": max(speed, 0)}
    return {"ts": time.time(), "devices": devices}


# --------------------------------------------------------------------------- #
#  identificacao do provedor (IP publico visto pela WAN)                      #
# --------------------------------------------------------------------------- #
_ISP_CACHE = {"ts": 0.0, "data": None}
_ISP_TTL = 600  # 10 min


def isp_info(force=False):
    now = time.time()
    if not force and _ISP_CACHE["data"] and now - _ISP_CACHE["ts"] < _ISP_TTL:
        return _ISP_CACHE["data"]
    url = ("http://ip-api.com/json/?fields="
           "status,message,country,city,isp,org,as,query")
    try:
        with urllib.request.urlopen(url, timeout=6) as resp:
            data = json.loads(resp.read().decode())
    except Exception as exc:  # noqa: BLE001
        data = {"status": "fail", "message": str(exc)}
    _ISP_CACHE.update(ts=now, data=data)
    return data


# --------------------------------------------------------------------------- #
#  HTTP                                                                       #
# --------------------------------------------------------------------------- #
class Handler(BaseHTTPRequestHandler):
    server_version = "NetShare/1.0"

    def _session_ok(self):
        cookie = SimpleCookie(self.headers.get("Cookie", ""))
        morsel = cookie.get(COOKIE_NAME)
        return verify_token(morsel.value) if morsel else False

    def _deny(self):
        self._json({"error": "nao autenticado"}, 401)

    def _set_session(self, token, clear=False):
        if clear:
            cookie = f"{COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
        else:
            cookie = (f"{COOKIE_NAME}={token}; Path=/; Max-Age={SESSION_TTL}; "
                      "HttpOnly; SameSite=Lax")
        self._extra_cookie = cookie

    def _json(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        if getattr(self, "_extra_cookie", None):
            self.send_header("Set-Cookie", self._extra_cookie)
        self.end_headers()
        self.wfile.write(body)

    def _body(self):
        length = int(self.headers.get("Content-Length", 0) or 0)
        if not length:
            return {}
        try:
            return json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            return {}

    # -- routing -------------------------------------------------------------
    def do_GET(self):
        path = self.path.split("?")[0]
        # publicos: pagina, assets estaticos e o estado de autenticacao
        if path == "/" or path == "/index.html":
            return self._serve_static("index.html")
        if path == "/api/me":
            auth = load_auth()
            return self._json({
                "setup_needed": auth is None,
                "authenticated": self._session_ok(),
                "username": auth["username"] if auth else None,
            })
        if not path.startswith("/api/"):
            return self._serve_static(path.lstrip("/"))
        # daqui para baixo: API protegida
        if not self._session_ok():
            return self._deny()
        if path == "/api/status":
            return self._safe(status)
        if path == "/api/throughput":
            return self._safe(throughput)
        if path == "/api/isp":
            force = self._query("force") == "1"
            return self._safe(lambda: isp_info(force=force))
        if path == "/api/devices":
            return self._safe(lambda: {"devices": list_devices()})
        if path == "/api/wifi/scan":
            dev = self._query("dev")
            if not dev:
                return self._json({"error": "falta ?dev="}, 400)
            return self._safe(lambda: {"networks": wifi_scan(dev)})
        return self._json({"error": "not found"}, 404)

    def do_POST(self):
        path = self.path.split("?")[0]
        data = self._body()

        # 1.o arranque: criar utilizador (so funciona se ainda nao existir)
        if path == "/api/setup":
            if load_auth() is not None:
                return self._json({"error": "ja configurado"}, 403)
            try:
                set_credentials(data.get("username"), data.get("password"))
            except ValueError as exc:
                return self._json({"error": str(exc)}, 400)
            self._set_session(make_token())
            return self._json({"ok": True})

        if path == "/api/login":
            if verify_pw(data.get("username"), data.get("password")):
                self._set_session(make_token())
                return self._json({"ok": True})
            return self._json({"error": "credenciais invalidas"}, 401)

        if path == "/api/logout":
            self._set_session(None, clear=True)
            return self._json({"ok": True})

        # daqui para baixo: precisa de sessao valida
        if not self._session_ok():
            return self._deny()

        if path == "/api/change-password":
            auth = load_auth()
            if not verify_pw(auth["username"], data.get("current")):
                return self._json({"error": "password atual incorreta"}, 403)
            try:
                set_credentials(data.get("username") or auth["username"],
                                data.get("new"))
            except ValueError as exc:
                return self._json({"error": str(exc)}, 400)
            self._set_session(make_token())  # renovar sessao
            return self._json({"ok": True})

        if path == "/api/wifi/connect":
            return self._safe(lambda: {"ok": wifi_connect(
                data.get("dev"), data.get("ssid"), data.get("password", ""))})
        if path == "/api/wifi/disconnect":
            return self._safe(lambda: {"ok": wifi_disconnect(data.get("dev"))})
        if path == "/api/role":
            return self._safe(lambda: (apply_role(
                data.get("dev"), data.get("role"), data), {"ok": True})[1])
        return self._json({"error": "not found"}, 404)

    # -- helpers -------------------------------------------------------------
    def _query(self, key):
        from urllib.parse import urlparse, parse_qs
        return parse_qs(urlparse(self.path).query).get(key, [None])[0]

    def _safe(self, fn):
        try:
            return self._json(fn())
        except Exception as exc:  # noqa: BLE001 - devolver erro legivel a UI
            return self._json({"error": str(exc)}, 500)

    def _serve_static(self, rel):
        target = (STATIC_DIR / rel).resolve()
        try:
            target.relative_to(STATIC_DIR.resolve())
        except ValueError:
            return self._json({"error": "not found"}, 404)
        if not target.is_file():
            return self._json({"error": "not found"}, 404)
        ctype = {
            ".html": "text/html; charset=utf-8",
            ".js": "application/javascript",
            ".css": "text/css",
            ".svg": "image/svg+xml",
            ".png": "image/png",
            ".ico": "image/x-icon",
            ".webmanifest": "application/manifest+json",
            ".json": "application/json",
        }.get(target.suffix, "application/octet-stream")
        data = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt, *args):  # silenciar logs por request
        pass


def main():
    host, port = CONFIG["host"], int(CONFIG["port"])
    if load_auth() is None:
        print("1.o arranque: abre o painel para criar utilizador e password.",
              file=sys.stderr)
    httpd = ThreadingHTTPServer((host, port), Handler)
    print(f"NetShare a ouvir em http://{host}:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.shutdown()


if __name__ == "__main__":
    main()
