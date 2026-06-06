#!/usr/bin/env bash
# Instalador do NetShare (Ubuntu Server).
# Corre na maquina alvo: sudo ./install.sh
set -euo pipefail
export LC_ALL=C

APP_DIR=/opt/netshare
CFG_DIR=/etc/netshare
SRC="$(cd "$(dirname "$0")" && pwd)"

if [[ $EUID -ne 0 ]]; then
  echo "Corre com sudo: sudo ./install.sh" >&2
  exit 1
fi

echo "==> Verificar dependencias"
command -v python3 >/dev/null || { echo "python3 em falta"; exit 1; }
if ! command -v nmcli >/dev/null; then
  echo "ERRO: nmcli (NetworkManager) nao esta instalado."
  echo "      Ubuntu Server usa netplan/systemd-networkd por defeito."
  echo "      Instala e ativa o NetworkManager primeiro (ver README)."
  exit 1
fi
# 'iw' é usado para ler a banda Wi-Fi, detectar modo AP e pelo watchdog opcional
if ! command -v iw >/dev/null; then
  echo "    a instalar 'iw' (banda Wi-Fi/modo AP/watchdog)..."
  apt-get install -y iw >/dev/null 2>&1 || echo "    (aviso: não instalou iw — banda Wi-Fi/modo AP/watchdog indisponíveis)"
fi

echo "==> Copiar app para $APP_DIR"
mkdir -p "$APP_DIR"
cp "$SRC/app.py" "$APP_DIR/"
cp -r "$SRC/static" "$APP_DIR/"
install -m755 "$SRC/mgmt-route.sh" "$APP_DIR/mgmt-route.sh"

echo "==> Config em $CFG_DIR"
mkdir -p "$CFG_DIR"
if [[ ! -f "$CFG_DIR/config.json" ]]; then
  cp "$SRC/config.example.json" "$CFG_DIR/config.json"
  chmod 600 "$CFG_DIR/config.json"
  echo "    config.json criado. As credenciais sao criadas no 1.o acesso ao painel."
else
  echo "    config.json ja existe, mantido."
fi

echo "==> Instalar rota de retorno de gestao (servico + dispatcher)"
# Mecanismo robusto: rota mais-especifica no main table, reposta no arranque por
# um servico systemd (com retries) E pelo dispatcher quando a netshare-lan sobe.
install -m755 "$SRC/dispatcher/90-netshare-mgmt" \
  /etc/NetworkManager/dispatcher.d/90-netshare-mgmt
cp "$SRC/netshare-mgmt-route.service" /etc/systemd/system/netshare-mgmt-route.service

echo "==> Garantir ip_forward persistente (router)"
echo "net.ipv4.ip_forward=1" > /etc/sysctl.d/99-netshare-forward.conf
sysctl -p /etc/sysctl.d/99-netshare-forward.conf >/dev/null

echo "==> Instalar servico systemd"
cp "$SRC/netshare.service" /etc/systemd/system/netshare.service
systemctl daemon-reload
systemctl enable netshare.service
systemctl enable netshare-mgmt-route.service

echo
echo "Feito. Passos finais:"
echo "  1) sudo systemctl restart netshare"
echo "  2) abre  http://<IP-de-gestao>:8088"
echo "     -> no 1.o acesso cria o utilizador e password no proprio painel."
