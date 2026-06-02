#!/usr/bin/env bash
set -euo pipefail

bash ../../scripts/stop-dev-processes.sh "$PWD" 'pnpm exec nest start --watch' "$PWD/dist/main"

if [ "${PORTLESS:-1}" = "0" ]; then
  exec pnpm exec nest start --watch
fi

frontend_url="$(bash ../../scripts/portless-url.sh edith)"
media_processor_url="$(bash ../../scripts/portless-url.sh media-edith)"

export FRONTEND_URL="$frontend_url"
export WEBSOCKET_ALLOWED_ORIGINS="$frontend_url"
export MEDIA_PROCESSOR_URL="$media_processor_url"

exec bash ../../scripts/run-with-portless.sh api-edith pnpm exec nest start --watch
