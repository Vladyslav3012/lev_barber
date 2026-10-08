#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "Missing .env — copy .env.production.example and fill in values first."
  exit 1
fi

# Read only what we need (avoid `source .env` — values with spaces/special chars break bash).
env_get() {
  local key="$1"
  local line
  line="$(grep -E "^${key}=" .env | tail -n1 || true)"
  if [ -z "$line" ]; then
    echo ""
    return
  fi
  local val="${line#"${key}="}"
  val="${val%$'\r'}"
  if [[ "$val" == \"*\" ]]; then
    val="${val:1:${#val}-2}"
  elif [[ "$val" == \'*\' ]]; then
    val="${val:1:${#val}-2}"
  fi
  printf '%s' "$val"
}

DOMAIN="$(env_get DOMAIN)"
CERTBOT_EMAIL="$(env_get CERTBOT_EMAIL)"

: "${DOMAIN:?DOMAIN is required in .env}"
: "${CERTBOT_EMAIL:?CERTBOT_EMAIL is required in .env}"

COMPOSE=(docker compose -f docker-compose.prod.yml)

echo "==> Starting production stack (HTTP until certs exist)..."
mkdir -p log
"${COMPOSE[@]}" up -d --build

echo "==> Requesting Let's Encrypt certificate for ${DOMAIN} and www.${DOMAIN}..."
"${COMPOSE[@]}" --profile certbot run --rm certbot certonly \
  --webroot \
  -w /var/www/certbot \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}" \
  --email "${CERTBOT_EMAIL}" \
  --agree-tos \
  --no-eff-email

echo "==> Restarting nginx to enable HTTPS..."
"${COMPOSE[@]}" restart nginx

echo "==> Done. Open https://${DOMAIN}/"
