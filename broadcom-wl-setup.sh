#!/usr/bin/env bash
# NetShare — driver Wi-Fi proprietário Broadcom (`wl` via broadcom-sta-dkms).
#
# QUANDO PRECISAS DISTO:
# Só se a tua placa Wi-Fi tem chip Broadcom BCM43xx que NÃO é suportado pelo
# driver aberto da mainline (b43, brcmfmac). É o caso típico das placas
# "Fenvi" / "OS-X-compatible" / "Hackintosh-ready" com chip:
#
#     BCM4360, BCM4352, BCM4364, BCM43224, BCM4322, BCM4313, ...
#
# Confirma assim (substitui pelo teu device se for diferente):
#
#     lspci -nn | grep -i 'network\|wireless'
#
# Se vires "Broadcom Inc. ... BCM43xx" SEM aparecer driver válido em
# `lspci -k`, ou se o `nmcli device status` não lista a tua Wi-Fi, precisas
# deste script. Caso contrário NÃO precisas.
#
# PORQUÊ É NECESSÁRIO:
# Estas placas usam um driver proprietário (`wl`) distribuído pela Broadcom
# como `broadcom-sta-dkms`. Não está na mainline do kernel — instala-se via
# DKMS (recompila a cada actualização de kernel). E os drivers abertos
# (`b43`, `bcma`, `brcmfmac`) competem pela mesma placa, por isso precisam de
# blacklist explícita, senão arrancam primeiro e "roubam-na" ao `wl`.
#
# Como o driver `wl` tem historicamente partido em kernels novos sem aviso,
# este script também **trava o kernel** (`apt-mark hold`) para o `apt upgrade`
# não puxar uma versão que parta a Wi-Fi sem ti dares conta. Reavalia quando
# quiseres actualizar, com a porta de gestão acessível.
#
# PRÉ-REQUISITO: cabo Ethernet com internet (precisas de descarregar pacotes).
#
# Corre:  sudo ./broadcom-wl-setup.sh
# Depois: corre  sudo ./bootstrap.sh && sudo reboot

set -euo pipefail
export LC_ALL=C

if [[ $EUID -ne 0 ]]; then
  echo "Corre com sudo: sudo ./broadcom-wl-setup.sh" >&2
  exit 1
fi

echo "==> [1/5] apt update"
apt-get update -y

echo "==> [2/5] DKMS + headers + driver broadcom-sta-dkms"
# tenta os headers do kernel actual; cai para o pacote genérico se não houver
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  dkms "linux-headers-$(uname -r)" 2>/dev/null || \
  DEBIAN_FRONTEND=noninteractive apt-get install -y dkms linux-headers-generic
DEBIAN_FRONTEND=noninteractive apt-get install -y broadcom-sta-dkms

echo "==> [3/5] Blacklist dos drivers abertos que roubam a placa"
cat > /etc/modprobe.d/blacklist-broadcom-open.conf <<'EOF'
# Bloqueia drivers abertos para forçar o uso do `wl` (broadcom-sta) nas
# placas Broadcom BCM43xx que não estão suportadas pela mainline.
blacklist b43
blacklist b43legacy
blacklist ssb
blacklist bcma
blacklist brcmsmac
blacklist brcmfmac
EOF
echo "wl" > /etc/modules-load.d/broadcom-wl.conf
update-initramfs -u

echo "==> [4/5] Travar o kernel (driver wl pode partir num kernel novo)"
apt-mark hold linux-image-generic linux-headers-generic linux-generic || true

echo "==> [5/5] Feito."
echo
echo "Próximos passos:"
echo "  1) sudo ./bootstrap.sh        # preparação universal do sistema"
echo "  2) sudo reboot                # carrega o driver wl em limpo"
echo "  3) sudo ./install.sh          # instala o painel NetShare"
echo
echo "Para libertar o kernel mais tarde (so se quiseres actualizar; faz com"
echo "a porta de gestão acessível, porque o driver wl pode partir):"
echo "  sudo apt-mark unhold linux-image-generic linux-headers-generic linux-generic"
