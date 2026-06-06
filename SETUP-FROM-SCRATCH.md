# Install everything from SCRATCH (fresh Ubuntu Server)

**English** · [Português](SETUP-FROM-SCRATCH.pt.md)

Complete guide to set up a mini-PC as a **Wi-Fi backup WAN gateway**.
Follow the phases in order. Typical time: ~30-45 min, most of which is
downloading + reboot(s).

> The examples use typical interface names for a machine with 2× Ethernet
> (`enp2s0`, `enp3s0`) and a PCIe Wi-Fi card (`wlp1s0`), but the procedure
> works on any machine running Ubuntu Server with at least 1 Wi-Fi card +
> 1 free Ethernet port.

---

## The big gotcha (read first)

If your Wi-Fi card needs drivers that don't ship in the Ubuntu image (e.g.
**Broadcom BCM43xx** in "Fenvi" / "Hackintosh-ready" cards), Wi-Fi **only
works after** you install the driver — but installing the driver needs
**internet**, which would normally come from Wi-Fi. Chicken-and-egg.

**Solution:** during setup, connect a **temporary Ethernet cable** from one
of the machine's ports to a router with internet (your home network is
fine). Just for the setup. At the end you re-cable for the final topology.

Do all of this with a **monitor + keyboard on the machine** (or via the
management port), because you're swapping the network stack and SSH may
drop midway.

---

## Phase 0 — Install Ubuntu Server

1. Flash Ubuntu Server to a USB drive and install normally.
2. Accept **OpenSSH server** when asked. Create your user account.
3. After installation, plug the **temporary Ethernet cable** with internet
   into one of the machine's ports.

## Phase 1 — Wi-Fi card driver (if needed)

If your Wi-Fi card is **Intel, Realtek, MediaTek, Atheros, or a Broadcom
supported by the mainline (`brcmfmac`)** — skip directly to Phase 2.

If your card is **Broadcom BCM43xx** (typical in Fenvi / Hackintosh cards —
chips BCM4360, BCM4352, BCM4364, BCM43224, ...), run this first:

```bash
git clone https://github.com/soundflow-dev/NetShare2.git
cd NetShare2
sudo ./broadcom-wl-setup.sh
```

This installs the proprietary driver `broadcom-sta-dkms` (`wl`), blacklists
the conflicting open drivers, and pins the kernel (because `wl` often
breaks on new kernels). Details in the repo's README.

> To confirm your hardware:
> ```bash
> lspci -nn | grep -i 'network\|wireless'
> ```

## Phase 2 — Universal system preparation

With the temporary cable connected, on the machine (clone the repo now if
you haven't already):

```bash
git clone https://github.com/soundflow-dev/NetShare2.git
cd NetShare2
sudo ./bootstrap.sh
sudo reboot
```

> When releases exist, you can use a stable tag from
> https://github.com/soundflow-dev/NetShare2/releases. If you have no
> network at all yet, copy the folder via USB stick or
> `scp -r NetShare2/ <user>@<box-IP>:~/` from another computer.

`bootstrap.sh` installs NetworkManager (needed for Wi-Fi scan + *shared*
mode), `iw` (Wi-Fi band/AP mode/watchdog), disables cloud-init's network config and
`wait-online`.

**After the reboot**, confirm Wi-Fi appears:

```bash
nmcli device status
```

You should see `wlXXX  wifi  disconnected` (or connected). If it appears,
the driver is fine. If it does **not** appear on a machine with a Broadcom
BCM43xx card, go back to Phase 1 and run `broadcom-wl-setup.sh`. For other
cards, see the *Troubleshooting* section at the end.

## Phase 3 — Install the NetShare panel

```bash
cd ~/NetShare2
sudo ./install.sh
sudo systemctl restart netshare
```

This installs the app into `/opt/netshare/`, the `netshare.service`, and
the **management return-route mechanism** (`mgmt-route.sh` +
`netshare-mgmt-route.service` + dispatcher) that keeps SSH alive when
Wi-Fi takes over the default route.

Open in your browser: **http://<management-IP>:8088**
On the first access, create username + password (no default credentials).

## Phase 4 — Assign roles in the panel

In the panel, choose each interface's role:

| Interface | Role | Notes |
|-----------|------|-------|
| Wi-Fi (e.g. `wlp1s0`) | **Receives internet** or **Shares internet** | WAN client when joining an SSID; hotspot only if AP mode is supported |
| Cable to router/devices (e.g. `enp2s0`) | **Receives internet** or **Shares internet** | WAN over DHCP or automatic NAT + DHCP (`10.42.0.1/24`) |
| Management cable (e.g. `enp3s0`) | **Local network** | standard DHCP but `never-default` |

> Broadcom BCM43xx with the proprietary `wl` driver is an important special
> case: it usually works as a WAN client, but does not expose AP mode. The panel
> should block “Shares internet” on that card; use Ethernet for sharing.

## Phase 5 — Final cabling

1. Cable **"Shares internet" → secondary WAN port** of your main router
   (e.g. WAN2 on a Dream Machine).
2. Cable **"Local network" → switch/VLAN of your management network**.
3. Remove the temporary cable (if it was different from these).
4. On the main router, confirm the secondary WAN picks up a `10.42.0.x`
   lease. Failover is automatic when the primary WAN goes down.

---

## Final verification (optional, over SSH)

```bash
ip route get 8.8.8.8                       # should leave via Wi-Fi
ip route get 8.8.8.8 from 10.42.0.1        # shared traffic also via Wi-Fi
ip route | grep -E '/16'                   # management route present
sudo systemctl is-active netshare netshare-mgmt-route   # both active
```

Reboot once to confirm that **SSH survives on its own** (without touching
the console) — that's the test that matters.

---

## Emergency recovery (if you lose SSH)

On the machine's **console** (replace with the values of your management
network):

```bash
sudo ip route add <MGMT-NETWORK>/16 via <MGMT-GW> dev <MGMT-IFACE> metric 50
# example: sudo ip route add 192.168.0.0/16 via 192.168.0.1 dev enp3s0 metric 50
```

## Troubleshooting

- **Wi-Fi doesn't appear after `bootstrap.sh` + reboot:** the driver didn't
  load. Confirm your hardware with `lspci -nn | grep -i 'network\|wireless'`.
  If it's Broadcom BCM43xx, run `sudo ./broadcom-wl-setup.sh` and reboot.
  For Broadcom with the `wl` driver already installed:
  `sudo dmesg | grep -iE "wl|b43|bcma"` and `lsmod | grep wl` — if `b43`
  has grabbed the card, check the blacklist file and run
  `sudo update-initramfs -u && sudo reboot` again.
- **No internet during setup:** confirm the temporary cable and `ip a`
  (the Ethernet port must have a DHCP-assigned IP). The renderer only
  switches to NM after bootstrap.
- **Upgrading the kernel later** (only relevant if you have `wl`): the
  kernel is on *hold* on purpose. To upgrade, run `sudo apt-mark unhold
  linux-image-generic linux-headers-generic linux-generic`, upgrade **with
  the management port reachable** (`wl` may break on a new kernel) and
  put it back on `hold`.
