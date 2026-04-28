#!/usr/bin/env bash
set -Eeuo pipefail

APP_NAME="${PM2_APP_NAME:-csaas-web}"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-3000}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

log() {
  printf '[%s] %s\n' "$(date '+%F %T')" "$*"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Missing required command: %s\n' "$1" >&2
    exit 127
  fi
}

pm2_app_exists() {
  pm2 describe "$APP_NAME" >/dev/null 2>&1
}

start_or_restart_pm2() {
  if pm2_app_exists; then
    log "Restarting PM2 app: $APP_NAME"
    pm2 restart "$APP_NAME" --update-env
  else
    log "PM2 app not found. Starting $APP_NAME on $HOST:$PORT"
    pm2 start npm --name "$APP_NAME" -- start -- -H "$HOST" -p "$PORT"
  fi
  pm2 save >/dev/null 2>&1 || true
}

restore_on_failure() {
  exit_code=$?
  log "Deploy failed with exit code $exit_code."
  if [[ "${HAD_PM2_APP:-0}" == "1" ]]; then
    log "Restoring previous PM2 app state: $APP_NAME"
    pm2 restart "$APP_NAME" --update-env || true
  fi
  exit "$exit_code"
}

require_command npm
require_command pm2

HAD_PM2_APP=0
if pm2_app_exists; then
  HAD_PM2_APP=1
  log "Stopping PM2 app before build: $APP_NAME"
  pm2 stop "$APP_NAME"
else
  log "PM2 app $APP_NAME does not exist yet. It will be started after build."
fi

trap restore_on_failure ERR

if [[ ! -d node_modules ]]; then
  log "node_modules not found. Installing dependencies with npm ci."
  npm ci
fi

log "Building frontend."
npm run build

trap - ERR

start_or_restart_pm2
log "Frontend deploy finished."
pm2 status "$APP_NAME"
