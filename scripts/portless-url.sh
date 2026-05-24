#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: scripts/portless-url.sh <route-name>" >&2
  exit 1
fi

route_name="$1"
port="${PORTLESS_PORT:-1355}"
protocol="${PORTLESS_PROTOCOL:-http}"

if { [ "$protocol" = "https" ] && [ "$port" = "443" ]; } || { [ "$protocol" = "http" ] && [ "$port" = "80" ]; }; then
  echo "${protocol}://${route_name}.localhost"
else
  echo "${protocol}://${route_name}.localhost:${port}"
fi
