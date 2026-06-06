# Instalar tudo do ZERO (Ubuntu Server novo)

**Português** · [English](SETUP-FROM-SCRATCH.md)

Guia completo para montar um mini-PC como **gateway de WAN de backup por
Wi-Fi**. Segue as fases por ordem. Tempo típico: ~30-45 min, maior parte em
download + reboot(s).

> Os exemplos usam nomes de interface típicos de uma máquina com 2× Ethernet
> (`enp2s0`, `enp3s0`) e uma placa Wi-Fi PCIe (`wlp1s0`), mas o procedimento
> funciona em qualquer máquina com Ubuntu Server e pelo menos 1 placa Wi-Fi
> + 1 cabo Ethernet livre.

---

## A grande armadilha (lê primeiro)

Se a tua placa Wi-Fi precisa de drivers que não vêm na imagem do Ubuntu
(p.ex. **Broadcom BCM43xx** das placas "Fenvi" / "Hackintosh-ready"), a Wi-Fi
**só funciona depois** de instalar o driver — mas instalar o driver precisa
de **internet**, que viria normalmente do Wi-Fi. Galinha-e-ovo.

**Solução:** durante a preparação, liga um **cabo Ethernet temporário** de
uma porta da máquina a um router com internet (a tua rede doméstica serve).
Só para o setup. No fim re-cablas para a topologia final.

Faz tudo isto com **monitor + teclado na máquina** (ou pela porta de gestão),
porque vais trocar a stack de rede e o SSH pode cair a meio.

---

## Fase 0 — Instalar o Ubuntu Server

1. Grava o Ubuntu Server numa pen e instala normalmente.
2. Aceita o **OpenSSH server** quando perguntar. Cria o teu utilizador.
3. Após instalar, liga o **cabo Ethernet temporário** com internet a uma das
   portas da máquina.

## Fase 1 — Driver da placa Wi-Fi (se preciso)

Se a tua placa Wi-Fi é **Intel, Realtek, MediaTek, Atheros, ou Broadcom
suportada pela mainline (`brcmfmac`)** — salta directo para a Fase 2.

Se a tua placa é **Broadcom BCM43xx** (típico em cartões Fenvi /
Hackintosh — chips BCM4360, BCM4352, BCM4364, BCM43224, ...), corre antes:

```bash
git clone https://github.com/soundflow-dev/NetShare2.git
cd NetShare2
sudo ./broadcom-wl-setup.sh
```

Isto instala o driver proprietário `broadcom-sta-dkms` (`wl`), faz blacklist
dos drivers abertos conflituantes e trava o kernel (o `wl` parte com
frequência em kernels novos). Detalhes no README do repo.

> Para confirmar o teu hardware:
> ```bash
> lspci -nn | grep -i 'network\|wireless'
> ```

## Fase 2 — Preparação universal do sistema

Com o cabo temporário ligado, na máquina (se ainda não clonaste o repo,
clona agora):

```bash
git clone https://github.com/soundflow-dev/NetShare2.git
cd NetShare2
sudo ./bootstrap.sh
sudo reboot
```

> Quando houver releases, podes usar uma tag estável de
> https://github.com/soundflow-dev/NetShare2/releases. Se ainda não tiveres
> rede nenhuma, copia a pasta por pen USB ou
> `scp -r NetShare2/ <user>@<IP-do-box>:~/` a partir de outro computador.

O `bootstrap.sh` instala o NetworkManager (necessário para scan Wi-Fi + modo
*shared*), o `iw` (banda Wi-Fi/modo AP/watchdog), desactiva a configuração de rede do
cloud-init e o `wait-online`.

**Depois do reboot**, confirma que a Wi-Fi aparece:

```bash
nmcli device status
```

Deves ver `wlXXX  wifi  disconnected` (ou connected). Se aparecer, o driver
está bom. Se **não** aparecer numa máquina com placa Broadcom BCM43xx, volta
à Fase 1 e corre o `broadcom-wl-setup.sh`. Para outras placas, vê os
*Problemas* no fim.

## Fase 3 — Instalar o painel NetShare

```bash
cd ~/NetShare2
sudo ./install.sh
sudo systemctl restart netshare
```

Isto instala a app em `/opt/netshare/`, o serviço `netshare.service`, e o
mecanismo de **rota de retorno de gestão** (`mgmt-route.sh` +
`netshare-mgmt-route.service` + dispatcher) que mantém o SSH vivo quando a
Wi-Fi vira rota default.

Abre no browser: **http://<IP-de-gestão>:8088**
No 1.º acesso cria utilizador + password (não há credenciais por defeito).

## Fase 4 — Atribuir papéis no painel

No painel, em cada placa escolhe o papel:

| Interface | Papel | Notas |
|-----------|-------|-------|
| Wi-Fi (ex. `wlp1s0`) | **Recebe internet** ou **Partilha internet** | WAN cliente se ligares a um SSID; hotspot só se suportar modo AP |
| Cabo p/ router/dispositivos (ex. `enp2s0`) | **Recebe internet** ou **Partilha internet** | WAN por DHCP ou NAT + DHCP automáticos (`10.42.0.1/24`) |
| Cabo de gestão (ex. `enp3s0`) | **Rede normal** | DHCP normal mas `never-default` |

> Broadcom BCM43xx com driver proprietário `wl` é caso especial importante:
> normalmente funciona como cliente WAN, mas não expõe modo AP. O painel deve
> bloquear “Partilha internet” nessa placa; usa Ethernet para partilhar.

## Fase 5 — Cablagem final

1. Cabo **"Partilha internet" → porta WAN secundária** do teu router principal
   (ex.: WAN2 de uma Dream Machine).
2. Cabo **"Rede normal" → switch/VLAN da tua rede de gestão**.
3. Tira o cabo temporário (se era diferente destes).
4. No router principal, confirma que a WAN secundária apanha lease
   `10.42.0.x`. O failover é automático quando a WAN principal cair.

---

## Verificação final (opcional, por SSH)

```bash
ip route get 8.8.8.8                       # deve sair pela Wi-Fi
ip route get 8.8.8.8 from 10.42.0.1        # tráfego partilhado também pela Wi-Fi
ip route | grep -E '/16'                   # rota de gestão presente
sudo systemctl is-active netshare netshare-mgmt-route   # ambos active
```

Reinicia uma vez para confirmar que **o SSH sobrevive sozinho** (sem tocar
na consola) — é o teste que importa.

---

## Recuperação de emergência (se ficares sem SSH)

Na **consola** da máquina (substitui pelos valores da tua rede de gestão):

```bash
sudo ip route add <REDE-GESTÃO>/16 via <GW-GESTÃO> dev <IFACE-GESTÃO> metric 50
# exemplo: sudo ip route add 192.168.0.0/16 via 192.168.0.1 dev enp3s0 metric 50
```

## Problemas

- **Wi-Fi não aparece após o `bootstrap.sh` + reboot:** o driver não carregou.
  Confirma o teu hardware com `lspci -nn | grep -i 'network\|wireless'`. Se
  for Broadcom BCM43xx, corre `sudo ./broadcom-wl-setup.sh` e reinicia.
  Para Broadcom já com driver `wl` instalado: `sudo dmesg | grep -iE "wl|b43|bcma"`
  e `lsmod | grep wl` — se o `b43` ainda agarrou a placa, confirma o
  ficheiro de blacklist e corre de novo `sudo update-initramfs -u && sudo reboot`.
- **Sem internet no setup:** confirma o cabo temporário e `ip a` (a porta
  Ethernet tem de ter IP por DHCP). O renderer só muda para NM depois do
  bootstrap.
- **Atualizar o kernel mais tarde** (só relevante se tens o `wl`): o kernel
  está *hold* de propósito. Para atualizar, faz `sudo apt-mark unhold
  linux-image-generic linux-headers-generic linux-generic`, atualiza **com a
  porta de gestão acessível** (o `wl` pode partir num kernel novo) e volta
  a pôr `hold`.
