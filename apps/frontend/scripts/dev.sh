#!/usr/bin/env bash
set -euo pipefail

bash ../../scripts/stop-dev-processes.sh "$PWD" 'pnpm exec next dev' 'next-server'

if [ "${PORTLESS:-1}" = "0" ]; then
  exec pnpm exec next dev
fi

backend_url="$(bash ../../scripts/portless-url.sh api-ai-video-editor)"

export NEXT_PUBLIC_BASE_URL_BACKEND="$backend_url"
export NEXT_PUBLIC_BASE_URL_WEBSOCKET="$backend_url"

exec bash ../../scripts/run-with-portless.sh ai-video-editor pnpm exec next dev
