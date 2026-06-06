#!/usr/bin/env bash
# NetShare — preparação universal do sistema (Ubuntu Server).
#
# Trata do que é comum a QUALQUER placa Wi-Fi suportada nativamente no Linux
# (Intel, Realtek, MediaTek, Atheros, e Broadcom com driver brcmfmac):
#   - NetworkManager (renderer do netplan, necessário para scan Wi-Fi + modo
#     `shared` que o systemd-networkd não suporta)
#   - iw (banda Wi-Fi, deteção de modo AP e watchdog)
#   - cloud-init: parar de reescrever o netplan no boot
#   - mask wait-online (arranque mais rápido)
#
# PRÉ-REQUISITO: o box precisa de INTERNET durante este passo. Liga um cabo
# Ethernet temporário a um router com internet.
#
# Para placas Wi-Fi Broadcom BCM43xx (chip que NÃO é suportado nativamente —
# tipicamente as Fenvi para Hackintosh: 4360, 4364, 43224...) corre PRIMEIRO
# o `broadcom-wl-setup.sh` deste mesmo repo. Vê o README para detalhes.
#
# Corre:  sudo ./bootstrap.sh
# No fim: REINICIA. Depois do reboot, corre  sudo ./install.sh
set -euo pipefail
export LC_ALL=C

if [[ $EUID -ne 0 ]]; then echo "Corre com sudo: sudo ./bootstrap.sh" >&2; exit 1; fi

echo "==> [1/4] apt update"
apt-get update -y

echo "==> [2/4] Pacotes: NetworkManager + iw"
DEBIAN_FRONTEND=noninteractive apt-get install -y network-manager iw

echo "==> [3/4] Renderer de rede = NetworkManager"
cat > /etc/netplan/01-nm.yaml <<'EOF'
network:
  version: 2
  renderer: NetworkManager
EOF
chmod 600 /etc/netplan/01-nm.yaml
# impedir o cloud-init de reescrever o netplan no arranque
mkdir -p /etc/cloud/cloud.cfg.d
echo 'network: {config: disabled}' > /etc/cloud/cloud.cfg.d/99-disable-network-config.cfg
netplan generate

echo "==> [4/4] Desligar wait-online (arranque mais rápido)"
systemctl mask systemd-networkd-wait-online.service 2>/dev/null || true
systemctl mask NetworkManager-wait-online.service 2>/dev/null || true

echo
echo "Feito."
echo
echo "  >> REINICIA AGORA:  sudo reboot"
echo "     (o reboot aplica o NetworkManager em limpo)"
echo
echo "  Depois do reboot:"
echo "     nmcli device status        # confirma que a Wi-Fi aparece"
echo "     sudo ./install.sh"
echo "     sudo systemctl restart netshare"
