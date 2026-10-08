#!/usr/bin/env bash
# Deploy pre-built GHCR images by digest, wait for health, record/rollback release state.
#
# Required env:
#   FRONTEND_IMAGE  — ghcr.io/.../barber-frontend@sha256:...
#   NGINX_IMAGE     — ghcr.io/.../barber-nginx@sha256:...
#   GHCR_USERNAME   — GHCR login user (usually GitHub owner)
#   GHCR_PULL_TOKEN — PAT with read:packages
#     OR GHCR_TOKEN_FILE — path to a 0600 file containing the token (preferred;
#     file is deleted after read so the secret is not left on disk / in argv)
#
# Optional:
#   DEPLOY_PATH     — app directory (default: cwd)
#   HEALTH_TIMEOUT  — seconds to wait for healthy (default: 180)
#   HEALTH_INTERVAL — poll interval seconds (default: 5)
#   SMOKE_BASE_URL  — public HTTPS origin for post-deploy smoke (default: from .env)
#   SMOKE_TIMEOUT   — curl max-time seconds per request (default: 20)
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-.}"
cd "$DEPLOY_PATH"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
RELEASE_ENV=".env.release"
RELEASE_STATE=".release-state"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-180}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-5}"
SMOKE_TIMEOUT="${SMOKE_TIMEOUT:-20}"

: "${FRONTEND_IMAGE:?FRONTEND_IMAGE is required (image@sha256:...)}"
: "${NGINX_IMAGE:?NGINX_IMAGE is required (image@sha256:...)}"
: "${GHCR_USERNAME:?GHCR_USERNAME is required}"

# Prefer token file (CI) so the secret never appears in `ps` remote argv.
if [ -n "${GHCR_TOKEN_FILE:-}" ]; then
  if [ ! -f "$GHCR_TOKEN_FILE" ]; then
    echo "GHCR_TOKEN_FILE is set but missing: $GHCR_TOKEN_FILE" >&2
    exit 1
  fi
  GHCR_PULL_TOKEN="$(tr -d '\r\n' <"$GHCR_TOKEN_FILE")"
  rm -f "$GHCR_TOKEN_FILE"
fi
: "${GHCR_PULL_TOKEN:?GHCR_PULL_TOKEN or GHCR_TOKEN_FILE is required}"

logged_in=0
cleanup() {
  if [ "$logged_in" -eq 1 ]; then
    docker logout ghcr.io >/dev/null 2>&1 || true
  fi
  if [ -n "${GHCR_TOKEN_FILE:-}" ] && [ -f "${GHCR_TOKEN_FILE}" ]; then
    rm -f "$GHCR_TOKEN_FILE"
  fi
}
trap cleanup EXIT

case "$FRONTEND_IMAGE" in
  *@sha256:*) ;;
  *)
    echo "FRONTEND_IMAGE must be pinned by digest (…@sha256:…), got: $FRONTEND_IMAGE" >&2
    exit 1
    ;;
esac
case "$NGINX_IMAGE" in
  *@sha256:*) ;;
  *)
    echo "NGINX_IMAGE must be pinned by digest (…@sha256:…), got: $NGINX_IMAGE" >&2
    exit 1
    ;;
esac

COMPOSE=(docker compose -f "$COMPOSE_FILE")

state_get() {
  local key="$1"
  if [ ! -f "$RELEASE_STATE" ]; then
    echo ""
    return
  fi
  local line
  line="$(grep -E "^${key}=" "$RELEASE_STATE" | tail -n1 || true)"
  if [ -z "$line" ]; then
    echo ""
    return
  fi
  printf '%s' "${line#"${key}="}"
}

write_release_env() {
  local frontend="$1"
  local nginx="$2"
  cat >"$RELEASE_ENV" <<EOF
FRONTEND_IMAGE=${frontend}
NGINX_IMAGE=${nginx}
EOF
}

# Export image pins for compose interpolation (overrides .env).
load_release_env() {
  set -a
  # shellcheck disable=SC1090
  source "$RELEASE_ENV"
  set +a
}

compose_up_pull() {
  load_release_env
  mkdir -p log
  "${COMPOSE[@]}" pull frontend nginx
  "${COMPOSE[@]}" up -d --no-build --remove-orphans
}

service_health() {
  local service="$1"
  # Prefer Health column when present; fall back to State.
  local health
  health="$("${COMPOSE[@]}" ps "$service" --format '{{.Health}}' 2>/dev/null | head -n1 || true)"
  if [ -n "$health" ] && [ "$health" != "<no value>" ]; then
    printf '%s' "$health"
    return
  fi
  "${COMPOSE[@]}" ps "$service" --format '{{.State}}' 2>/dev/null | head -n1 || true
}

wait_healthy() {
  local elapsed=0
  echo "==> Waiting for services to become healthy (timeout ${HEALTH_TIMEOUT}s)..."
  while [ "$elapsed" -lt "$HEALTH_TIMEOUT" ]; do
    local fe ngx
    fe="$(service_health frontend)"
    ngx="$(service_health nginx)"
    echo "    frontend=${fe:-unknown} nginx=${ngx:-unknown} (${elapsed}s)"
    if [ "$fe" = "healthy" ] && [ "$ngx" = "healthy" ]; then
      echo "==> Container health OK."
      return 0
    fi
    sleep "$HEALTH_INTERVAL"
    elapsed=$((elapsed + HEALTH_INTERVAL))
  done
  echo "==> Health check timed out." >&2
  "${COMPOSE[@]}" ps || true
  return 1
}

# Read KEY=value from .env without sourcing (avoids executing shell metacharacters).
env_file_get() {
  local key="$1"
  local file="${2:-.env}"
  if [ ! -f "$file" ]; then
    echo ""
    return
  fi
  local line
  line="$(grep -E "^${key}=" "$file" | tail -n1 || true)"
  if [ -z "$line" ]; then
    echo ""
    return
  fi
  local value="${line#"${key}="}"
  value="${value%$'\r'}"
  if [[ "$value" == \"*\" && "$value" == *\" ]]; then
    value="${value:1:${#value}-2}"
  elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
    value="${value:1:${#value}-2}"
  fi
  printf '%s' "$value"
}

resolve_smoke_base_url() {
  local base="${SMOKE_BASE_URL:-}"
  if [ -z "$base" ]; then
    base="$(env_file_get NEXT_PUBLIC_SITE_URL)"
  fi
  if [ -z "$base" ]; then
    local domain
    domain="$(env_file_get DOMAIN)"
    if [ -n "$domain" ]; then
      base="https://${domain}"
    fi
  fi
  if [ -z "$base" ]; then
    echo ""
    return
  fi
  printf '%s' "${base%/}"
}

# HTTP status for a request. Prints code or 000 on transport failure.
http_status() {
  local method="$1"
  local url="$2"
  shift 2
  local code
  code="$(
    curl -sS -o /dev/null -w '%{http_code}' \
      --connect-timeout 10 --max-time "$SMOKE_TIMEOUT" \
      -X "$method" "$@" "$url" 2>/dev/null || true
  )"
  if [ -z "$code" ]; then
    code="000"
  fi
  printf '%s' "$code"
}

expect_status() {
  local label="$1"
  local method="$2"
  local url="$3"
  local expected="$4"
  shift 4
  local code
  code="$(http_status "$method" "$url" "$@")"
  if [ "$code" != "$expected" ]; then
    echo "    FAIL ${label}: expected HTTP ${expected}, got ${code} (${method} ${url})" >&2
    return 1
  fi
  echo "    OK   ${label}: HTTP ${code}"
}

# Public HTTPS smoke — container "running/healthy" is not enough.
smoke_public() {
  local base
  base="$(resolve_smoke_base_url)"
  if [ -z "$base" ]; then
    echo "==> Smoke test skipped: set SMOKE_BASE_URL or NEXT_PUBLIC_SITE_URL/DOMAIN in .env" >&2
    return 1
  fi

  echo "==> Public smoke test against ${base} ..."
  local failed=0

  # Homepage must be reachable over public HTTPS (follow apex redirects once).
  if ! expect_status "GET /" GET "${base}/" "200" -L --max-redirs 3; then
    failed=1
  fi

  # Static asset served via nginx → Next.
  if ! expect_status "GET /favicon.svg" GET "${base}/favicon.svg" "200" -L --max-redirs 3; then
    failed=1
  fi

  # Career API: only POST is defined → GET is Method Not Allowed.
  if ! expect_status "GET /api/career" GET "${base}/api/career" "405"; then
    failed=1
  fi

  # Browser POSTs without Origin/Referer must be rejected in production.
  if ! expect_status "POST /api/career (no Origin)" POST "${base}/api/career" "403" \
    -H "Content-Type: application/json" \
    --data '{"name":"Smoke","contact":"@smoke","message":"deploy smoke"}'; then
    failed=1
  fi

  # Wrong Origin must not be accepted even with a plausible body.
  if ! expect_status "POST /api/career (bad Origin)" POST "${base}/api/career" "403" \
    -H "Content-Type: application/json" \
    -H "Origin: https://evil.example" \
    --data '{"name":"Smoke","contact":"@smoke","message":"deploy smoke"}'; then
    failed=1
  fi

  if [ "$failed" -ne 0 ]; then
    echo "==> Public smoke test failed." >&2
    return 1
  fi
  echo "==> Public smoke test passed."
  return 0
}

verify_release() {
  wait_healthy && smoke_public
}

record_success() {
  local prev_fe prev_ngx
  prev_fe="$(state_get FRONTEND_CURRENT)"
  prev_ngx="$(state_get NGINX_CURRENT)"
  cat >"$RELEASE_STATE" <<EOF
FRONTEND_CURRENT=${FRONTEND_IMAGE}
NGINX_CURRENT=${NGINX_IMAGE}
FRONTEND_PREVIOUS=${prev_fe}
NGINX_PREVIOUS=${prev_ngx}
UPDATED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF
  echo "==> Recorded release state in ${RELEASE_STATE}"
}

# Drop dangling layers; keep CURRENT + PREVIOUS digests for rollback.
prune_old_images() {
  echo "==> Pruning dangling images..."
  docker image prune -f >/dev/null 2>&1 || true
}

rollback() {
  # Auto-rollback restores last known-good CURRENT (state is only updated after success).
  local good_fe good_ngx
  good_fe="$(state_get FRONTEND_CURRENT)"
  good_ngx="$(state_get NGINX_CURRENT)"
  if [ -z "$good_fe" ] || [ -z "$good_ngx" ]; then
    echo "==> No previous release to roll back to." >&2
    return 1
  fi
  if [ "$good_fe" = "$FRONTEND_IMAGE" ] && [ "$good_ngx" = "$NGINX_IMAGE" ]; then
    echo "==> Last known-good digests match the failed candidate; nothing to roll back to." >&2
    return 1
  fi
  echo "==> Rolling back to last known-good digests..."
  write_release_env "$good_fe" "$good_ngx"
  compose_up_pull
  verify_release
}

echo "==> Logging in to ghcr.io as ${GHCR_USERNAME}..."
echo "$GHCR_PULL_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin
logged_in=1
# Drop token from shell memory as soon as login succeeds.
unset GHCR_PULL_TOKEN

echo "==> Deploying frontend=${FRONTEND_IMAGE}"
echo "==>           nginx=${NGINX_IMAGE}"
write_release_env "$FRONTEND_IMAGE" "$NGINX_IMAGE"

if ! compose_up_pull; then
  echo "==> Pull/up failed; attempting rollback..." >&2
  rollback || true
  exit 1
fi

if ! verify_release; then
  echo "==> New release failed health/smoke; attempting rollback..." >&2
  if rollback; then
    echo "==> Rollback succeeded; failing deploy job." >&2
  else
    echo "==> Rollback failed or unavailable." >&2
  fi
  exit 1
fi

record_success
prune_old_images
"${COMPOSE[@]}" ps
echo "==> Deploy complete."
