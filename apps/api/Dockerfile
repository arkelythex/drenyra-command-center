# ───────────────────────────────────────────────────────
# DRENYRA API — Bun/Elysia Backend
# ───────────────────────────────────────────────────────
# Multi-stage build with turborepo prune and minimal Alpine
# runtime. The API uses `bun build --compile` to produce a
# standalone binary (~50 MB), then runs it on alpine:3.20
# (~10 MB + binary) instead of the full oven/bun:1.3 image
# (~220 MB).
#
# Build: docker build -f apps/api/Dockerfile .
# Bake:  docker buildx bake api
#
# NOTE: S3/Supabase are regular deps so bun --compile
# bundles static imports. Dynamic imports (storage.service.ts)
# are kept as externals and loaded at runtime from the
# node_modules directory (still present at build time).

# ── Stage 1: Pruner ────────────────────────────────────
# Extracts ONLY the packages needed by @drenyra/api.
FROM node:22-alpine AS pruner
WORKDIR /app
RUN npm install -g turbo@^2
COPY . .
RUN turbo prune @drenyra/api --docker

# ── Stage 2: Installer ─────────────────────────────────
# Install dependencies from the pruned lockfile.
FROM oven/bun:1.3 AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock
RUN bun install --frozen-lockfile

# ── Stage 3: Builder ───────────────────────────────────
# Build the standalone binary with bun --compile.
# S3/Supabase deps are already installed (regular deps).
# bun --compile will bundle static imports and keep
# dynamic imports (storage.service.ts) as externals.
FROM oven/bun:1.3 AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
RUN bun build --compile \
    ./apps/api/src/index.ts \
    --outfile /app/drenyra-api \
    --minify \
    --sourcemap

# ── Stage 4: Runner (minimal Alpine) ────────────────────
# Alpine 3.20 provides musl libc (compatible with bun's
# musl-linked binary) without the full bun Docker image.
# Result: ~60 MB vs ~220 MB for oven/bun:1.3.
#
# NOTE: If bun releases a fully static binary in the
# future, this can switch to scratch or distroless/base.
FROM alpine:3.20 AS runner
RUN apk add --no-cache ca-certificates tzdata libstdc++ libgcc
COPY --from=builder /app/drenyra-api /app/api
EXPOSE 3000
CMD ["/app/api"]
