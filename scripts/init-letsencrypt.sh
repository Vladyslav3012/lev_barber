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

# CI writes digests to .env.release; bootstrap may set images in .env instead.
if [ -f .env.release ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.release
  set +a
fi
FRONTEND_IMAGE="${FRONTEND_IMAGE:-$(env_get FRONTEND_IMAGE)}"
NGINX_IMAGE="${NGINX_IMAGE:-$(env_get NGINX_IMAGE)}"
: "${FRONTEND_IMAGE:?FRONTEND_IMAGE is required (.env.release or .env; GHCR digest or local tag)}"
: "${NGINX_IMAGE:?NGINX_IMAGE is required (.env.release or .env; GHCR digest or local tag)}"
export FRONTEND_IMAGE NGINX_IMAGE

wait_nginx_http() {
  local elapsed=0
  local timeout="${NGINX_WAIT_TIMEOUT:-120}"
  local interval=3
  echo "==> Waiting for nginx on :80 (ACME webroot; timeout ${timeout}s)..."
  while [ "$elapsed" -lt "$timeout" ]; do
    local state code
    state="$("${COMPOSE[@]}" ps nginx --format '{{.State}}' 2>/dev/null | head -n1 || true)"
    # Host must match server_name (default_server returns 444 for bare IP).
    # Any HTTP response means nginx is up. 502 from Next is fine for ACME webroot.
    code="$(curl -sS -o /dev/null --connect-timeout 2 -w "%{http_code}" \
      -H "Host: ${DOMAIN}" "http://127.0.0.1/" 2>/dev/null || true)"
    if [ "$state" = "running" ] && [[ "$code" =~ ^[2345][0-9][0-9]$ ]]; then
      echo "==> nginx is accepting HTTP."
      return 0
    fi
    sleep "$interval"
    elapsed=$((elapsed + interval))
  done
  echo "==> nginx did not become reachable on :80 in time." >&2
  "${COMPOSE[@]}" ps || true
  return 1
}

echo "==> Starting production stack (HTTP until certs exist)..."
mkdir -p log
# No --build: production uses pre-built images. For first-time local images:
#   docker compose -f docker-compose.prod.yml -f docker-compose.prod.build.yml up --build -d
# nginx depends_on frontend with service_started so ACME works before Next is healthy.
"${COMPOSE[@]}" up -d

wait_nginx_http

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

echo "==> Checking https://${DOMAIN}/ ..."
smoke_ok=0
for _ in 1 2 3 4 5 6 7 8 9 10; do
  code="$(curl -sS -o /dev/null --connect-timeout 5 --max-time 20 -w "%{http_code}" \
    -L --max-redirs 3 "https://${DOMAIN}/" 2>/dev/null || true)"
  if [ "$code" = "200" ]; then
    smoke_ok=1
    break
  fi
  sleep 3
done
if [ "$smoke_ok" -ne 1 ]; then
  echo "==> HTTPS smoke failed after cert issue (last HTTP ${code:-000})." >&2
  "${COMPOSE[@]}" ps || true
  exit 1
fi

echo "==> Done. Open https://${DOMAIN}/"
