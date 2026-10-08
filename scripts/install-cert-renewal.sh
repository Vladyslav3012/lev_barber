#!/usr/bin/env bash
# Install a weekly cron job that runs renew-certs.sh on this host.
# Idempotent: replaces any previous levbarber cert-renew crontab entry.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RENEW="${ROOT}/scripts/renew-certs.sh"
MARKER="# levbarber-cert-renew"
LOG_DIR="${ROOT}/log"
LOG_FILE="${LOG_DIR}/cert-renew.log"

if [ ! -x "$RENEW" ]; then
  chmod +x "$RENEW" scripts/init-letsencrypt.sh 2>/dev/null || true
fi
if [ ! -f "$RENEW" ]; then
  echo "Missing ${RENEW}" >&2
  exit 1
fi

mkdir -p "$LOG_DIR"

# Sunday 03:15 — well inside Let's Encrypt's renew window; not peak traffic.
CRON_CMD="15 3 * * 0 cd ${ROOT} && ${RENEW} >> ${LOG_FILE} 2>&1"

existing="$(crontab -l 2>/dev/null || true)"
# Drop prior marker and any cron line that runs this renew script.
filtered="$(
  printf '%s\n' "$existing" | awk -v m="$MARKER" -v renew="$RENEW" '
    $0 == m { next }
    index($0, renew) { next }
    { print }
  '
)"
{
  printf '%s\n' "$filtered"
  printf '%s\n' "$MARKER"
  printf '%s\n' "$CRON_CMD"
} | crontab -

echo "==> Installed weekly cert renew cron:"
echo "    ${CRON_CMD}"
echo "==> Logs: ${LOG_FILE}"
echo "==> Verify: crontab -l | grep -A1 levbarber-cert-renew"
