#!/bin/sh
set -e

# Optional host-visible log file (see docker-compose.prod.yml → ./log).
if [ -n "${LOG_FILE:-}" ]; then
  LOG_DIR="${LOG_DIR:-/var/log/levbarber}"
  mkdir -p "$LOG_DIR"
  touch "${LOG_DIR}/${LOG_FILE}"
  exec >>"${LOG_DIR}/${LOG_FILE}" 2>&1
fi

exec "$@"
