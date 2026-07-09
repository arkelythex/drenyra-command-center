# P4: Build & CI/CD Pipeline

**Fecha:** 2026-07-07
**Autor:** el Gentleman
**PRs estimados:** 3
**Líneas estimadas:** ~500
**Depende de:** P3 (tests first)

---

## Problema

Drenyra no tiene una pipeline CI/CD robusta:

- `turbo.json` existe pero no está optimizado (cache miss frecuente)
- Docker builds sin layer caching (cada build rebuild todo)
- No hay release automation (gh releases, changelog, version bump)
- GitHub Actions corre todo secuencial (typecheck → lint → test → build en serie)
- No hay artifact publishing (Docker images, npm packages, Go binary)

Para un proyecto que toca dinero fiscal, la entrega debe ser automatizada y confiable.

## Cambios Propuestos

### PR 1: Turborepo Pipeline Optimization (150 líneas)

**Qué:** Optimizar `turbo.json` para builds rápidos y cache efectivo.

**Cambios:**

- Definir tareas con `dependsOn` preciso (no dependencias genéricas)
- Configurar remote cache (local file system primero, S3 después)
- `outputs` específicos por tarea (no caché de node_modules)
- `inputs` específicos (solo archivos que afectan el output)
- Pipeline: typecheck → lint → test → build (paralelo donde se pueda)

### PR 2: Docker + CI Matrix (200 líneas)

**Qué:** Docker builds optimizados + CI paralelo.

**Dockerfile multi-stage:**

```dockerfile
# Stage 1: Dependencies (cacheable)
FROM oven/bun:1 AS deps
COPY bun.lock package.json ./
RUN bun install --frozen-lockfile

# Stage 2: Build (cacheable por cambios en source)
FROM deps AS build
COPY . .
RUN bun run build

# Stage 3: Production (minimal)
FROM oven/bun:1-slim AS production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
CMD ["bun", "dist/index.js"]
```

**GitHub Actions matrix:**

```yaml
jobs:
  quality:
    strategy:
      matrix:
        task: [typecheck, lint, test, build]
    steps:
      - uses: actions/checkout@v4
      - run: bun install --frozen-lockfile
      - run: bun run ${{ matrix.task }}
```

### PR 3: Release Automation (150 líneas)

**Qué:** Scripts de release que generan changelog, tag, y artifacts.

- `scripts/release.sh` — bump version, generate changelog, git tag
- GitHub Action que publica Docker images a GHCR
- GitHub Action que publica Go binary a releases
- Versionado semántico: `major.minor.patch` con `prerelease` para branches

## Criterios de Aceptación

1. `turbo run build` con cache → <10s en segunda ejecución
2. CI completo (typecheck + lint + test + build) < 5 minutos
3. Docker build con cache → <30s en rebuild
4. `bun run release` crea tag, changelog, y GitHub Release
5. Docker image publicada en GHCR automáticamente
