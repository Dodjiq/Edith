#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: scripts/run-with-portless.sh <name> <command...>" >&2
  exit 1
fi

app_name="$1"
shift

if [ "${PORTLESS:-1}" = "0" ]; then
  exec "$@"
fi

if [ "${PORTLESS_PORT:-1355}" -lt 1024 ]; then
  portless_state_dir="${PORTLESS_STATE_DIR:-/tmp/portless}"
else
  portless_state_dir="${PORTLESS_STATE_DIR:-$HOME/.portless}"
fi

portless_lock_path="$portless_state_dir/routes.lock"
stale_lock_seconds=15
max_attempts=8
attempt=1

while true; do
  while [ -d "$portless_lock_path" ]; do
    lock_mtime="$(stat -f '%m' "$portless_lock_path" 2>/dev/null || echo 0)"
    now="$(date +%s)"
    lock_age="$((now - lock_mtime))"

    if [ "$lock_age" -ge "$stale_lock_seconds" ]; then
      rm -rf "$portless_lock_path"
      break
    fi

    sleep 0.2
  done

  log_file="$(mktemp -t portless-run.XXXXXX)"

  set +e
  portless "$app_name" --force -- "$@" > >(tee "$log_file") 2> >(tee -a "$log_file" >&2)
  status=$?
  set -e

  if [ "$status" -eq 0 ]; then
    rm -f "$log_file"
    exit 0
  fi

  if grep -q 'Failed to acquire route lock' "$log_file" && [ "$attempt" -lt "$max_attempts" ]; then
    rm -f "$log_file"
    attempt=$((attempt + 1))
    sleep 0.4
    continue
  fi

  rm -f "$log_file"
  exit "$status"
done
