#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: scripts/stop-dev-processes.sh <cwd> <pattern...>" >&2
  exit 1
fi

target_cwd="$1"
shift

matched_pids=()

while IFS= read -r process_line; do
  pid="${process_line%% *}"
  command="${process_line#* }"

  if [ -z "$pid" ] || [ "$pid" = "$$" ]; then
    continue
  fi

  is_match='0'
  for pattern in "$@"; do
    if [[ "$command" == *"$pattern"* ]]; then
      is_match='1'
      break
    fi
  done

  if [ "$is_match" = '0' ]; then
    continue
  fi

  process_cwd="$(
    lsof -a -d cwd -p "$pid" -Fn 2>/dev/null | sed -n 's/^n//p' | tail -n 1 || true
  )"

  if [ "$process_cwd" = "$target_cwd" ]; then
    matched_pids+=("$pid")
  fi
done < <(ps -axo pid=,command=)

if [ "${#matched_pids[@]}" -eq 0 ]; then
  exit 0
fi

echo "Stopping existing dev processes in $target_cwd: ${matched_pids[*]}" >&2
kill "${matched_pids[@]}" 2>/dev/null || true
sleep 1

for pid in "${matched_pids[@]}"; do
  if kill -0 "$pid" 2>/dev/null; then
    kill -9 "$pid" 2>/dev/null || true
  fi
done
