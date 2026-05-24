FROM node:20-bookworm-slim AS base
WORKDIR /app

# Writable home/cache and pnpm
ENV HOME=/app
ENV XDG_CACHE_HOME=/app/.cache
ENV PNPM_HOME=/app/.pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN mkdir -p "$XDG_CACHE_HOME" "$PNPM_HOME" && npm i -g pnpm@10.22.0

# Runtime deps for audio tooling
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg ca-certificates tzdata && \
    rm -rf /var/lib/apt/lists/*

# ---- Prune workspace for the server only
FROM base AS pruner
WORKDIR /app
COPY . .
RUN pnpm dlx turbo@2.6.1 prune server --docker

# ---- Install deps and build
FROM base AS builder
WORKDIR /app
ENV CI=true
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /app/out/full/ .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter api-types run build
RUN pnpm --filter server run build

# ---- Runtime
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 serveruser

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN mkdir -p /app/apps/server/temporary-files/input /app/apps/server/temporary-files/output \
  && mkdir -p /app/temporary-files/input /app/temporary-files/output \
  && chown -R serveruser:nodejs /app/apps/server/temporary-files /app/temporary-files

USER serveruser
EXPOSE 4000
CMD ["node", "apps/server/dist/main.js"]
