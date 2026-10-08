#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Compose interpolates FRONTEND_IMAGE / NGINX_IMAGE for the whole file.
if [ -f .env.release ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.release
  set +a
fi

COMPOSE=(docker compose -f docker-compose.prod.yml)

echo "==> Renewing certificates..."
"${COMPOSE[@]}" --profile certbot run --rm certbot renew \
  --deploy-hook "touch /var/run/nginx-reload/reload"

echo "==> Done (nginx reloads automatically when a cert is renewed)."
