#!/usr/bin/env bash
# Deploy pre-built GHCR images by digest, wait for health, record/rollback release state.
#
# Required env:
#   FRONTEND_IMAGE  — ghcr.io/.../barber-frontend@sha256:...
#   NGINX_IMAGE     — ghcr.io/.../barber-nginx@sha256:...
#   GHCR_USERNAME   — GHCR login user (usually GitHub owner)
#   GHCR_PULL_TOKEN — PAT with read:packages
#
# Optional:
#   DEPLOY_PATH     — app directory (default: cwd)
#   HEALTH_TIMEOUT  — seconds to wait for healthy (default: 180)
#   HEALTH_INTERVAL — poll interval seconds (default: 5)
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-.}"
cd "$DEPLOY_PATH"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
RELEASE_ENV=".env.release"
RELEASE_STATE=".release-state"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-180}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-5}"

: "${FRONTEND_IMAGE:?FRONTEND_IMAGE is required (image@sha256:...)}"
: "${NGINX_IMAGE:?NGINX_IMAGE is required (image@sha256:...)}"
: "${GHCR_USERNAME:?GHCR_USERNAME is required}"
: "${GHCR_PULL_TOKEN:?GHCR_PULL_TOKEN is required}"

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
    local fe ngx_state
    fe="$(service_health frontend)"
    ngx_state="$("${COMPOSE[@]}" ps nginx --format '{{.State}}' 2>/dev/null | head -n1 || true)"
    echo "    frontend=${fe:-unknown} nginx=${ngx_state:-unknown} (${elapsed}s)"
    # frontend has a compose healthcheck; nginx has none — require running after depends_on.
    if [ "$fe" = "healthy" ] && [ "$ngx_state" = "running" ]; then
      echo "==> Healthy."
      return 0
    fi
    sleep "$HEALTH_INTERVAL"
    elapsed=$((elapsed + HEALTH_INTERVAL))
  done
  echo "==> Health check timed out." >&2
  "${COMPOSE[@]}" ps || true
  return 1
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
  wait_healthy
}

echo "==> Logging in to ghcr.io as ${GHCR_USERNAME}..."
echo "$GHCR_PULL_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin

echo "==> Deploying frontend=${FRONTEND_IMAGE}"
echo "==>           nginx=${NGINX_IMAGE}"
write_release_env "$FRONTEND_IMAGE" "$NGINX_IMAGE"

if ! compose_up_pull; then
  echo "==> Pull/up failed; attempting rollback..." >&2
  rollback || true
  exit 1
fi

if ! wait_healthy; then
  echo "==> New release unhealthy; attempting rollback..." >&2
  if rollback; then
    echo "==> Rollback succeeded; failing deploy job." >&2
  else
    echo "==> Rollback failed or unavailable." >&2
  fi
  exit 1
fi

record_success
"${COMPOSE[@]}" ps
echo "==> Deploy complete."
