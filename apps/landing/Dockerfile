FROM oven/bun:1.3 AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/landing/package.json ./apps/landing/package.json
COPY packages/ ./packages/
RUN bun install --frozen-lockfile

FROM oven/bun:1.3 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY apps/landing ./apps/landing
WORKDIR /app/apps/landing
RUN bun run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/landing/.next/standalone ./
COPY --from=builder /app/apps/landing/.next/static ./.next/static
COPY --from=builder /app/apps/landing/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
