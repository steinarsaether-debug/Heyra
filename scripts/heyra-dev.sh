#!/bin/sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
APP_PORT="${APP_PORT:-3010}"
APP_HOST="${APP_HOST:-127.0.0.1}"
APP_PUBLIC_HOST="${APP_PUBLIC_HOST:-$APP_HOST}"
APP_PUBLIC_URL="${APP_PUBLIC_URL:-http://$APP_PUBLIC_HOST:$APP_PORT}"
NEXT_DIST_DIR="${NEXT_DIST_DIR:-.next-dev}"
PID_FILE="$ROOT_DIR/.heyra-dev.pid"
LOG_FILE="$ROOT_DIR/.heyra-dev.log"

load_database_url() {
  if [ -n "${DATABASE_URL:-}" ]; then
    printf '%s' "$DATABASE_URL"
    return 0
  fi

  if [ -f "$ROOT_DIR/.env.local" ]; then
    awk -F= '/^DATABASE_URL=/{sub(/^DATABASE_URL=/, ""); gsub(/^"|"$/, "", $0); print; exit}' "$ROOT_DIR/.env.local"
    return 0
  fi

  if [ -f "$ROOT_DIR/.env" ]; then
    awk -F= '/^DATABASE_URL=/{sub(/^DATABASE_URL=/, ""); gsub(/^"|"$/, "", $0); print; exit}' "$ROOT_DIR/.env"
    return 0
  fi

  printf '%s' ""
}

uses_local_database() {
  DATABASE_URL_VALUE="$(load_database_url)"

  case "$DATABASE_URL_VALUE" in
    *localhost*|*127.0.0.1*|*@db:*|*@postgres:* )
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

usage() {
  cat <<EOF
Usage: ./scripts/heyra-dev.sh <start|restart|stop|status|seed>

Environment overrides:
  APP_PORT   Default: 3010
  APP_HOST   Default: 127.0.0.1
  APP_PUBLIC_HOST Default: APP_HOST
  APP_PUBLIC_URL  Default: http://APP_PUBLIC_HOST:APP_PORT
  NEXT_DIST_DIR Default: .next-dev
EOF
}

is_running() {
  [ -f "$PID_FILE" ] || return 1
  PID="$(cat "$PID_FILE")"
  kill -0 "$PID" 2>/dev/null
}

start_db() {
  if ! uses_local_database; then
    echo "Skipping local database startup because DATABASE_URL points to an external database."
    return 0
  fi

  echo "Starting Heyra database..."
  (cd "$ROOT_DIR" && docker compose up -d db >/dev/null)
}

stop_db() {
  if ! uses_local_database; then
    echo "Skipping local database shutdown because DATABASE_URL points to an external database."
    return 0
  fi

  echo "Stopping Heyra database..."
  (cd "$ROOT_DIR" && docker compose stop db >/dev/null)
}

start_app() {
  if is_running; then
    echo "Heyra app is already running on $APP_HOST:$APP_PORT"
    return 0
  fi

  echo "Starting Heyra app on $APP_PUBLIC_URL (binding to $APP_HOST:$APP_PORT) ..."
  (
    cd "$ROOT_DIR"
    NEXTAUTH_URL="$APP_PUBLIC_URL" \
    NEXT_PUBLIC_APP_URL="$APP_PUBLIC_URL" \
    HEYRA_NEXT_DIST_DIR="$NEXT_DIST_DIR" \
    AUTH_SECRET="${AUTH_SECRET:-heyra-local-auth-secret-change-me}" \
    npm run dev -- --hostname "$APP_HOST" --port "$APP_PORT" >>"$LOG_FILE" 2>&1 &
    echo $! >"$PID_FILE"
  )
}

stop_app() {
  if ! [ -f "$PID_FILE" ]; then
    echo "Heyra app is not running."
    return 0
  fi

  PID="$(cat "$PID_FILE")"
  if kill -0 "$PID" 2>/dev/null; then
    echo "Stopping Heyra app (PID $PID)..."
    kill "$PID"
  else
    echo "Heyra app PID file exists, but the process is already gone."
  fi
  rm -f "$PID_FILE"
}

status() {
  echo "Heyra root: $ROOT_DIR"
  echo "App bind: $APP_HOST:$APP_PORT"
  echo "App target: $APP_PUBLIC_URL"

  if is_running; then
    echo "App: running (PID $(cat "$PID_FILE"))"
    echo "Log: $LOG_FILE"
  else
    echo "App: stopped"
  fi

  echo "Database:"
  (cd "$ROOT_DIR" && docker compose ps db)
}

seed() {
  echo "Seeding demo accounts..."
  cd "$ROOT_DIR"
  node ./scripts/seed-demo-accounts.mjs
}

case "${1:-}" in
  start)
    start_db
    start_app
    echo "Done. Check status with ./scripts/heyra-dev.sh status"
    ;;
  restart)
    stop_app
    stop_db
    start_db
    start_app
    echo "Restarted. Check status with ./scripts/heyra-dev.sh status"
    ;;
  stop)
    stop_app
    stop_db
    ;;
  status)
    status
    ;;
  seed)
    seed
    ;;
  *)
    usage
    exit 1
    ;;
esac
