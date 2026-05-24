#!/usr/bin/env bash
set -euo pipefail

bash ../../scripts/stop-dev-processes.sh "$PWD" 'node scripts/dev.mjs' 'cargo watch -x run'

if [ "${PORTLESS:-1}" = "0" ]; then
  exec node scripts/dev.mjs
fi

exec bash ../../scripts/run-with-portless.sh media-ai-video-editor node scripts/dev.mjs
