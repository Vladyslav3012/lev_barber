#!/usr/bin/env bash
# One-time host prep for Ubuntu/Debian VPS (Hetzner CX23 / similar).
# Run as root (or via sudo) on the server before the first app deploy.
#
#   curl -fsSL … | bash   # not used — copy the repo (or this script) first, then:
#   sudo ./scripts/bootstrap-vps.sh
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo $0" >&2
  exit 1
fi

SWAP_FILE="${SWAP_FILE:-/swapfile}"
SWAP_SIZE_MB="${SWAP_SIZE_MB:-2048}"

echo "==> Ensuring ${SWAP_SIZE_MB}M swap at ${SWAP_FILE}..."
if swapon --show | grep -q .; then
  echo "    Swap already active:"
  swapon --show
else
  if [ ! -f "$SWAP_FILE" ]; then
    fallocate -l "${SWAP_SIZE_MB}M" "$SWAP_FILE" 2>/dev/null \
      || dd if=/dev/zero of="$SWAP_FILE" bs=1M count="$SWAP_SIZE_MB" status=progress
    chmod 600 "$SWAP_FILE"
    mkswap "$SWAP_FILE"
  fi
  swapon "$SWAP_FILE"
  if ! grep -qF "$SWAP_FILE" /etc/fstab; then
    echo "$SWAP_FILE none swap sw 0 0" >>/etc/fstab
  fi
  echo "    Swap enabled."
fi

echo "==> Installing Docker Engine (official apt repo) if missing..."
if ! command -v docker >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y ca-certificates curl
  install -m 0755 -d /etc/apt/keyrings
  # shellcheck disable=SC1091
  . /etc/os-release
  case "$ID" in
    ubuntu | debian) ;;
    *)
      echo "Unsupported distro '$ID' — install Docker manually, then re-run." >&2
      exit 1
      ;;
  esac
  if [ ! -f /etc/apt/keyrings/docker.asc ]; then
    curl -fsSL "https://download.docker.com/linux/${ID}/gpg" -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc
  fi
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/${ID} ${VERSION_CODENAME} stable" \
    >/etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable --now docker
else
  echo "    Docker already installed: $(docker --version)"
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose plugin missing after install" >&2
  exit 1
fi

echo "==> UFW: allow OpenSSH + 80/443 (enable only if ufw is present)..."
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable || true
  ufw status || true
else
  echo "    ufw not installed — open 22/80/443 in the Hetzner Cloud Firewall / security group."
fi

echo "==> Host ready."
echo "Next:"
echo "  1. Put the app in e.g. /opt/barber (git clone or rsync)."
echo "  2. cp .env.production.example .env  # DOMAIN=levbarber.com, TELEGRAM_*, CERTBOT_EMAIL"
echo "  3. Point DNS A (@ and www) to this server; disable Porkbun URL forwarding."
echo "  4. Bootstrap images + TLS:"
echo "       docker compose -f docker-compose.prod.yml -f docker-compose.prod.build.yml up --build -d"
echo "       ./scripts/init-letsencrypt.sh"
echo "       ./scripts/install-cert-renewal.sh"
