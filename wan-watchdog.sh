#!/bin/bash
# NetShare — vigia da WAN Wi-Fi: garante que a ligação `netshare-wan` está na
# banda 5 GHz preferida. Se estiver em 2.4 GHz (acontece quando o AP cai e
# volta — o autoconnect agarra-se à 2.4 GHz por ter sinal mais forte, antes da
# 5 GHz ficar disponível), fixa o melhor BSSID de 5 GHz desse SSID e força um
# reconnect. Só `wifi.band a` nem sempre chega: alguns APs/drivers acabam por
# fazer roaming de volta para o BSSID 2.4 GHz.
#
# Frequência mínima considerada "boa": 5000 MHz (qualquer 5 GHz serve). Pode
# passar-se outra como arg 1 (ex.: 5260 para canal 52 específico).
#
# Tolerante a falhas de propósito (sem `set -e`) — nunca deve abortar a rede.

export LC_ALL=C
CONN=netshare-wan
MIN_FREQ="${1:-5000}"

# Converte uma frequência (MHz) num nome de banda amigável (2.4 GHz / 5 GHz / 6 GHz).
band_name() {
  local f="${1:-}"
  [ -z "$f" ] && { echo "sem ligação"; return; }
  if   [ "$f" -lt 3000 ]; then echo "2.4 GHz"
  elif [ "$f" -lt 6000 ]; then echo "5 GHz"
  elif [ "$f" -lt 8000 ]; then echo "6 GHz"
  else                          echo "${f} MHz"
  fi
}

current_ssid() {
  iw dev "$1" link 2>/dev/null | sed -n 's/^[[:space:]]*SSID: //p' | head -1
}

best_5ghz_bssid() {
  local iface="$1" ssid="$2" min_freq="$3"
  [ -n "$iface" ] && [ -n "$ssid" ] || return
  nmcli device wifi rescan ifname "$iface" >/dev/null 2>&1
  # Formato -t -e no: BSSID tem 6 campos separados por ":"; depois FREQ,
  # SIGNAL e SSID. Juntamos o resto para SSIDs com ":".
  nmcli -t -e no -f BSSID,FREQ,SIGNAL,SSID device wifi list ifname "$iface" 2>/dev/null |
    awk -F: -v want="$ssid" -v min="$min_freq" '
      NF >= 9 {
        bssid=$1 ":" $2 ":" $3 ":" $4 ":" $5 ":" $6
        freq=$7 + 0
        signal=$8 + 0
        name=$9
        for (i=10; i<=NF; i++) name=name ":" $i
        if (name == want && freq >= min && signal > best_signal) {
          best_signal=signal
          best_bssid=bssid
        }
      }
      END { if (best_bssid) print best_bssid }
    '
}

# A connection está activa?
state=$(nmcli -g GENERAL.STATE connection show "$CONN" 2>/dev/null | head -1)
[ "$state" = "activated" ] || exit 0

# Qual a interface activa?
iface=$(nmcli -g GENERAL.DEVICES connection show "$CONN" 2>/dev/null | head -1)
[ -n "$iface" ] || exit 0

# Que frequência (MHz) está ligado?
freq=$(iw dev "$iface" link 2>/dev/null | awk '/freq:/ {print $2}' | head -1 | cut -d. -f1)
[ -n "$freq" ] || exit 0

if [ "$freq" -lt "$MIN_FREQ" ]; then
  ssid=$(current_ssid "$iface")
  bssid=$(best_5ghz_bssid "$iface" "$ssid" "$MIN_FREQ")
  if [ -n "$bssid" ]; then
    nmcli connection modify "$CONN" 802-11-wireless.band a 802-11-wireless.bssid "$bssid" >/dev/null 2>&1
    logger -t netshare-wan-watchdog "WAN em $(band_name "$freq") (${freq} MHz) — fixei BSSID 5 GHz $bssid para SSID '$ssid'"
  else
    nmcli connection modify "$CONN" 802-11-wireless.band a >/dev/null 2>&1
    logger -t netshare-wan-watchdog "WAN em $(band_name "$freq") (${freq} MHz) — sem BSSID 5 GHz encontrado para SSID '$ssid', a tentar só band=a"
  fi
  nmcli connection down "$CONN" >/dev/null 2>&1
  sleep 2
  nmcli connection up "$CONN" >/dev/null 2>&1
  # Confirmar e logar resultado
  new_freq=$(iw dev "$iface" link 2>/dev/null | awk '/freq:/ {print $2}' | head -1 | cut -d. -f1)
  logger -t netshare-wan-watchdog "após reconnect: $(band_name "$new_freq") (${new_freq:-sem ligação} MHz)"
fi
exit 0
