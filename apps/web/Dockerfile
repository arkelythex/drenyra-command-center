# ───────────────────────────────────────────────────────
# ARKELYTHEX Web — React SPA (Vite + TanStack Router)
# ───────────────────────────────────────────────────────
# Multi-stage build using turborepo prune for minimal
# build context and optimal layer caching.
#
# Build: docker build -f apps/web/Dockerfile .
# Bake:  docker buildx bake web

# ── Stage 1: Pruner ────────────────────────────────────
# Uses turbo prune to extract ONLY the packages needed by
# @arkelythex/web from the monorepo dependency graph.
FROM node:22-alpine AS pruner
WORKDIR /app
RUN npm install -g turbo@^2
COPY . .
RUN turbo prune @arkelythex/web --docker

# ── Stage 2: Installer ─────────────────────────────────
# Installs dependencies in isolation so layer is cached
# across builds unless package.json/lockfile changes.
FROM oven/bun:1.3 AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock
RUN bun install --frozen-lockfile

# ── Stage 3: Builder ───────────────────────────────────
# Copies source from pruned output + node_modules from
# installer, then compiles the React SPA with Vite.
FROM oven/bun:1.3 AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
RUN bun run --cwd apps/web build

# ── Stage 4: Runner ────────────────────────────────────
# Minimal nginx serving the built SPA assets.
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY --from=builder /app/apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
