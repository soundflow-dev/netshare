# NetShare — painel de partilha de internet por Wi-Fi

**Português** · [English](README.md)

<p align="center">
  <img src="docs/screenshots/dashboard.png" alt="NetShare — painel principal" width="820">
</p>

Transforma um mini-PC com Ubuntu Server num **gateway de backup**: recebe a
internet por **Wi-Fi** de outra rede e partilha-a por cabo Ethernet para a
porta WAN secundária do teu router principal (ex.: WAN2 de uma UniFi Dream
Machine). Para quem quer **redundância de WAN** sem ter de contratar uma
segunda ligação.

Em vez de editar `netplan`, `nftables` e `dnsmasq` à mão, atribuis o papel de
cada placa num **painel web** ao estilo UniFi:

- **Painel "Internet"** com ISP, IP público, organização e localização.
- **Throughput ao vivo** (↓/↑) por interface, com gráficos de área.
- IPs e estado de cada placa em tempo real.
- Scanner de redes Wi-Fi por BSSID/banda e ligação com 1 clique.
- Bilingue **Português / Inglês** com auto-deteção pelo browser.

> **Modo demonstração:** abrir `static/index.html` num browser, sem backend,
> mostra dados fictícios animados — só para veres o aspeto.

---

## Instalação rápida (via SSH)

Pré-requisitos:

- **Ubuntu Server** instalado, SSH a funcionar.
- **Cabo Ethernet temporário com internet** durante o setup (para descarregar
  pacotes e instalar drivers, se preciso).

### Instalação padrão

Para a maioria das máquinas (placas Wi-Fi Intel, Realtek, MediaTek, Atheros, ou
Broadcom suportadas pelo driver aberto `brcmfmac`). Por SSH:

```bash
# 1) Clona o NetShare2
git clone https://github.com/soundflow-dev/NetShare2.git
cd NetShare2

# 2) Preparação universal do sistema (NetworkManager, iw, ...)
sudo ./bootstrap.sh && sudo reboot
```

Após o reboot, reconecta-te por SSH e:

```bash
# 3) Instala o painel e o mecanismo de rota de gestão
cd NetShare2
sudo ./install.sh && sudo systemctl restart netshare
```

Abre **`http://<IP-de-gestão>:8088`** no browser. No 1.º acesso o painel
pede-te para criar utilizador + password — não há credenciais por defeito.

### Receita recomendada para Broadcom BCM43xx

Se vais reinstalar do zero numa máquina com placa Broadcom BCM43xx/Fenvi que
precisa do driver proprietário `wl`, usa esta ordem:

```bash
git clone --branch v1.0.4 https://github.com/soundflow-dev/NetShare2.git
cd NetShare2

sudo ./broadcom-wl-setup.sh
sudo ./bootstrap.sh
sudo reboot
```

Após o reboot:

```bash
cd ~/NetShare2
sudo ./install.sh
sudo systemctl restart netshare
```

No painel, define a Wi-Fi Broadcom como **Recebe internet**, escolhe a linha
**5 GHz** do SSID no scanner, define a Ethernet para o router/WAN2 como
**Partilha internet** e a Ethernet de gestão como **Rede normal**. Para redes
dual-band com o mesmo SSID, instala também o watchdog 5 GHz:

```bash
cd ~/NetShare2
sudo install -m755 wan-watchdog.sh /opt/netshare/wan-watchdog.sh
sudo cp netshare-wan-watchdog.service /etc/systemd/system/
sudo cp netshare-wan-watchdog.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now netshare-wan-watchdog.timer
```

### Caso especial: placa Wi-Fi Broadcom BCM43xx

Algumas placas Wi-Fi têm chip Broadcom **BCM43xx** que não é suportado pela
mainline do Linux (são típicas em cartões "Fenvi" / "OS-X-compatible" /
"Hackintosh-ready" — modelos com chip BCM4360, BCM4352, BCM4364, BCM43224,
etc.). Estas precisam do driver proprietário **`broadcom-sta-dkms`** (`wl`),
distribuído pela Broadcom, instalado via DKMS.

**Como saberes se é o teu caso:**
```bash
lspci -nn | grep -i 'network\|wireless'
```
Se a saída mostrar uma linha "**Broadcom Inc. ... BCM43xx**" e a Wi-Fi não
aparece no `nmcli device status` após o `bootstrap.sh`, precisas deste passo.

**Como instalar (executar ANTES do `bootstrap.sh`):**

```bash
git clone https://github.com/soundflow-dev/NetShare2.git
cd NetShare2

# 0) ANTES do bootstrap — instala o driver Broadcom proprietário
sudo ./broadcom-wl-setup.sh

# 1+2+3) Resto igual à instalação padrão
sudo ./bootstrap.sh && sudo reboot
# após o reboot:
cd NetShare2
sudo ./install.sh && sudo systemctl restart netshare
```

**Porquê este passo extra:**
- O driver `wl` da Broadcom não está na mainline → instala-se via **DKMS**
  (recompila a cada actualização de kernel).
- Os drivers abertos (`b43`, `bcma`, `brcmfmac`) competem pela mesma placa
  no boot → o script faz **blacklist** desses para forçar o uso do `wl`.
- O `wl` tem historicamente partido em kernels novos sem aviso → o script
  trava o kernel (**`apt-mark hold`**) para o `apt upgrade` não puxar uma
  versão que parta a Wi-Fi sem reparares.

Se algum dia quiseres actualizar o kernel, podes libertar com:
```bash
sudo apt-mark unhold linux-image-generic linux-headers-generic linux-generic
```
mas faz isso com a **porta de gestão acessível** (monitor, ou SSH garantido)
caso a Wi-Fi parta no kernel novo.

> Não sabes se a tua placa precisa? Faz a instalação padrão primeiro. Se a
> Wi-Fi não aparecer no `nmcli device status` após o reboot, corre o
> `broadcom-wl-setup.sh` e reinicia outra vez.

> Já não tens o Ubuntu Server instalado? O guia
> [`SETUP-FROM-SCRATCH.pt.md`](SETUP-FROM-SCRATCH.pt.md) explica tudo do zero,
> incluindo cablagem e atribuição de papéis às placas.

---

## Atribuir papéis às placas (no painel)

Depois de criar a conta, no painel atribuis o papel de cada interface:

| Papel | Para que serve | O que o painel faz (via nmcli) |
|---|---|---|
| **Recebe internet** (WAN) | Placa que liga à rede que fornece a internet | Wi-Fi: liga à rede escolhida; Ethernet: DHCP normal; fornece a rota default |
| **Partilha internet** | Saída para o router/dispositivos | Ethernet ou Wi-Fi AP com `ipv4.method shared` → NAT + DHCP automáticos (`10.42.0.1/24`) |
| **Rede normal** | Cabo de gestão/SSH | DHCP normal, mas `ipv4.never-default yes` (nunca vira saída) |
| **Inativa** | Desligar a interface | — |

> A partilha por Wi-Fi só aparece em placas cujo chip/driver suporta **modo AP**.
> Broadcom BCM43xx com driver proprietário `wl` costuma servir como WAN cliente,
> mas não como hotspot; nesses casos usa Ethernet para partilhar.

---

## O que cada script faz

### `bootstrap.sh` (universal — corres sempre)
- Troca o renderer do **netplan** para **NetworkManager** (necessário para
  scan de Wi-Fi e modo *shared* — o `systemd-networkd` do Ubuntu Server não
  faz nada disto).
- Desactiva a configuração de rede do cloud-init (para não reescrever o
  netplan no boot).
- Instala o **`iw`** (usado para ler a banda Wi-Fi, detectar modo AP e pelo watchdog).
- Desliga o `wait-online` (corta ~150 s no arranque).

### `broadcom-wl-setup.sh` (só se tiveres placa Broadcom BCM43xx)
- Instala o **`broadcom-sta-dkms`** (driver proprietário `wl`).
- Faz **blacklist** dos drivers abertos conflituantes (`b43`, `bcma`,
  `brcmsmac`, `brcmfmac`, ...).
- Trava o **kernel** (`apt-mark hold`) — o `wl` recompila a cada update e
  parte com frequência em kernels novos.

### `install.sh` (corres a seguir, em ambos os casos)
- Copia o painel para `/opt/netshare/` e arranca o serviço.
- Instala o mecanismo de **rota de retorno de gestão** (mantém o SSH vivo
  quando a Wi-Fi assume a rota default — ver secção abaixo).
- Fixa `ip_forward=1` persistente (para a partilha funcionar).

Tudo idempotente e seguro de correr mais que uma vez.

---

## Como funciona o routing de gestão (mantém o SSH vivo)

O grande risco numa montagem como esta: quando a Wi-Fi assume a rota default
para alimentar a partilha, as respostas do gateway para um administrador
**numa subnet diferente** (típico em redes com VLANs) tentam sair pela Wi-Fi
e o SSH morre. Resolve-se com uma **rota de retorno mais-específica** para a
rede de gestão, via a gateway de gestão, na tabela principal.

O `install.sh` instala automaticamente:

- **`mgmt-route.sh`** — script que lê interface, IP e gateway de gestão em
  tempo real (via `nmcli`, sem IPs fixos) e acrescenta a rota mais-específica.
  Funciona em qualquer máquina/rede.
- **`netshare-mgmt-route.service`** — serviço oneshot que corre o script no
  arranque (com retries até a rede estar pronta).
- **`dispatcher/90-netshare-mgmt`** — dispatcher do NetworkManager que repõe
  a rota sempre que a ligação `netshare-lan` (rede normal) sobe.

Dois mecanismos para garantir que o SSH sobrevive a qualquer reboot.

---

## Opcional: vigia da WAN Wi-Fi (forçar 5 GHz após reconnect)

> **Quando precisas disto?** Se a WAN é uma Wi-Fi dual-band (mesmo SSID em
> **2.4 GHz** + **5 GHz**) e o router de origem **vai abaixo e volta** (ex.:
> reset diário, falha de luz, agendamento de stand-by), o autoconnect do
> NetworkManager tende a apanhar primeiro o BSSID com sinal mais forte —
> quase sempre a **2.4 GHz** — mesmo com `wifi.band a` no perfil. A WAN fica
> na banda lenta até alguém forçar manualmente um reconnect.
>
> Este vigia opcional faz isso automaticamente: a cada 1 min verifica se a
> `netshare-wan` está presa a um BSSID de 5 GHz. Se já estiver em 5 GHz, fixa
> o BSSID atual. Se estiver em 2.4 GHz, procura o melhor BSSID de 5 GHz para
> o SSID atual, fixa esse BSSID no perfil e força um `down/up`. Isto é mais
> robusto do que usar só `wifi.band a`, porque alguns APs/drivers fazem
> roaming de volta para o BSSID de 2.4 GHz.

Se NÃO tens este caso, **ignora esta secção** — não precisas.

### Ver em que banda a WAN está agora (sem instalar nada)

```bash
freq=$(sudo iw dev wlp1s0 link | awk '/freq:/ {print $2}' | cut -d. -f1)
if   [ -z "$freq" ];        then echo "WAN sem ligação"
elif [ "$freq" -lt 3000 ];  then echo "WAN em 2.4 GHz (freq $freq MHz)"
elif [ "$freq" -lt 6000 ];  then echo "WAN em 5 GHz (freq $freq MHz)"
else                              echo "WAN em $freq MHz"
fi
```

(troca `wlp1s0` pelo nome da tua placa Wi-Fi se for outro)

### Instalar (a partir da pasta do repo)

```bash
sudo install -m755 wan-watchdog.sh /opt/netshare/wan-watchdog.sh
sudo cp netshare-wan-watchdog.service /etc/systemd/system/
sudo cp netshare-wan-watchdog.timer   /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now netshare-wan-watchdog.timer
```

### Verificar que está activo

```bash
# o timer está ligado e quando dispara a próxima vez?
systemctl list-timers netshare-wan-watchdog.timer --no-pager

# logs (vazio = nunca foi preciso agir, o que é bom sinal)
sudo journalctl -t netshare-wan-watchdog -n 20 --no-pager

# fazer correr já uma verificação (sem esperar pelo timer)
sudo /opt/netshare/wan-watchdog.sh
```

Quando o vigia agir, vês no `journalctl` algo do género:
```
WAN em 2.4 GHz (2412 MHz) — fixei BSSID 5 GHz aa:bb:cc:dd:ee:ff para SSID 'MinhaRede'
após reconnect: 5 GHz (5260 MHz)
```

### Desinstalar (se um dia quiseres remover)

```bash
sudo systemctl disable --now netshare-wan-watchdog.timer
sudo rm /etc/systemd/system/netshare-wan-watchdog.service
sudo rm /etc/systemd/system/netshare-wan-watchdog.timer
sudo rm /opt/netshare/wan-watchdog.sh
sudo systemctl daemon-reload
```

Confirma com:
```bash
systemctl status netshare-wan-watchdog.timer 2>&1 | head -3
# deve dizer "Unit netshare-wan-watchdog.timer could not be found." → removido OK
```

### Nota

O painel também passa o BSSID escolhido quando ligas a uma rede Wi-Fi. Se
escolheres a entrada 5 GHz no scanner, o perfil fica preso a esse AP. O vigia
reforça isso depois de reboots/reconnects. Se quiseres limpar esse BSSID
manualmente:

```bash
sudo nmcli connection modify netshare-wan 802-11-wireless.bssid ""
```

---

## Segurança — ler

- O painel corre **como root** (reconfigura a rede). Trata-o como acesso
  privilegiado.
- Autenticação por **sessão (cookie)**: no 1.º acesso crias utilizador+password
  no painel; a password é guardada com **hash PBKDF2** em
  `/etc/netshare/auth.json` (nunca em texto). Mudas a password no menu de
  conta. Para reset (esqueceste-te), apaga `auth.json` e recarrega o painel —
  volta ao ecrã de criação de conta.
- **Não exponhas isto à internet nem à rede Wi-Fi de origem (WAN).** Deixa-o
  acessível só pela rede de gestão. Recomendado restringir no firewall, ex.:
  ```bash
  sudo ufw allow from 10.10.0.0/16 to any port 8088 proto tcp
  ```
  (ajusta à tua subnet de gestão). Idealmente, mudar `host` no `config.json`
  para o IP da interface de gestão em vez de `0.0.0.0`.
- HTTP é em claro. Para a rede de gestão local é aceitável; se quiseres TLS,
  põe um reverse-proxy à frente mais tarde.
- **Identificação do ISP** faz um pedido a `ip-api.com` (serviço externo
  gratuito, sem chave) para descobrir o IP público e o provedor da WAN — sai
  um pedido HTTP do gateway de 10 em 10 min (resultado em cache). Se não
  quiseres essa chamada externa, basta não usares o endpoint `/api/isp` (ou
  removê-lo do `app.py`); o resto do painel funciona à mesma.

---

## Ficheiros

```
app.py                            backend (stdlib + nmcli)
static/index.html                 UI gerada (autossuficiente)
static/app.js                     lógica do frontend
static/style.css                  estilos
build.py                          gera o index.html autossuficiente

netshare.service                  unidade systemd do painel
config.example.json               modelo de configuração

bootstrap.sh                      prepara o SO (NetworkManager + iw, universal)
broadcom-wl-setup.sh              opcional, só p/ placas Wi-Fi Broadcom BCM43xx
install.sh                        instala painel + rota de gestão

mgmt-route.sh                     repõe rota de retorno de gestão
netshare-mgmt-route.service       enquadra o script acima no boot
dispatcher/90-netshare-mgmt       reforça a rota quando a netshare-lan sobe

# opcional — só se precisares (ver secção do vigia da WAN):
wan-watchdog.sh                   força 5 GHz na netshare-wan se cair para 2.4
netshare-wan-watchdog.service     oneshot que corre o script
netshare-wan-watchdog.timer       dispara o serviço de 1 em 1 min
```

---

## Estado

Validado em produção num mini-PC com Ubuntu Server (placa Broadcom BCM4360 +
2× Ethernet Realtek): bootstrap automático, painel deployado, partilha NAT a
alimentar a WAN2 de uma Dream Machine, sobrevive a reboot limpo (rota de
retorno de gestão reposta no arranque), e
reinstalação completa do zero confirmada via clone limpo.
