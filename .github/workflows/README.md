# GitHub Actions Workflows

CI/CD pipelines for ARKELYTHEX. El **gate principal** para merge en PR está en **`ci.yml`** (job `lint-and-typecheck` y jobs dependientes). **`quality-gates.yml`** añade comprobaciones self-hosted (Biome, heurísticas de seguridad, métricas) y **no** sustituye al typecheck estricto del pipeline principal.

---

## Primary pipeline (`ci.yml`)

**Triggers:** `pull_request` y `push` a `main` y `develop`.

**Job `lint-and-typecheck` (bloqueante):**

- ESLint (`bun run lint`)
- ESLint design-tokens plugin (`bun run lint:design-tokens`) — **bloquea off-brand colors, inline money format, imports deprecados**
- Biome (`bunx @biomejs/biome@2.3.11 biome check`)
- TypeScript: `bun run typecheck` (`tsc -p tsconfig.check.json`) — **falla el job si hay errores**
- `bun run architecture:check-tsconfig-features`
- `bun run architecture:check-boundaries`
- `bun run architecture:check-framework-isolation`
- `bun run architecture:check-product-surfaces`
- En PR: `architecture:check-policy` (contra la rama base)
- Verificación de `fetch()` legacy en web

**Job `build`:**

- Build Web (Turborepo)
- **Bundle size budget check** (`check:bundle`) — falla si el chunk principal excede 550KB o el JS total excede 3,500KB

**Caché Turborepo:** el workflow guarda/restaura `.turbo/`. Variables opcionales para caché remota: `TURBO_TOKEN` (secret), `TURBO_TEAM` (variable del repo/org).

**Otros jobs en el mismo workflow:** tests unitarios, build (p. ej. `turbo run build --filter=@drenyra/web`), auditoría `bun audit`, Gitleaks, migraciones DB, tests DB, contratos TS↔Python en PR (`contracts-smoke`), smoke Prometeo (opcional), job agregador `all-checks-passed`.

**Contratos data-engine en PR:** ver sección más abajo (`contracts-smoke`).

---

## Quality Gates complementarios (`quality-gates.yml`)

**Triggers:** push a `main` y `workflow_dispatch`.

**Enfoque:** Biome, comprobaciones heurísticas de seguridad y métricas de tamaño/complejidad. **No** ejecuta el mismo bloque que `ci.yml` para `tsc` ni los `architecture:*` del job principal, y no reemplaza el gate canónico de PR.

---

## Documentation Quality (`documentation-quality.yml`)

**Checks:** archivos críticos (`docs/00-INDEX.md` y `CHANGELOG.md`), READMEs de features y diagramas Mermaid.

El workflow ejecuta únicamente comprobaciones respaldadas por archivos y comandos vigentes en el repositorio.

---

## Docs Maintenance (`docs-maintenance.yml`)

Ejecuta `bun run docs:check-links`. En pull requests se activa únicamente cuando cambian archivos bajo `docs/**`, archivos Markdown en la raíz (`*.md`) o scripts bajo `scripts/docs/**`.

---

## Data Engine contracts — nightly (`contracts-nightly.yml`)

**Triggers:** días laborables (cron) y `workflow_dispatch`.

- Arranca `apps/data-engine` con `uv`
- `bun run --filter @drenyra/api test:contracts` con `REQUIRE_DATA_ENGINE_CONTRACTS=1`
- Artefactos: informe JSON y log del engine

---

## Data Engine contracts — smoke en PR (`ci.yml` / `contracts-smoke`)

**Triggers:** `pull_request` a `main` / `develop`.

- `DATA_ENGINE_CONTRACT_SCOPE=smoke`
- `bun run --filter @drenyra/api test:contracts`

---

## Nightly (`nightly.yml`)

Incluye cobertura, benchmarks, contratos, E2E, seguridad y un job **`nightly-polyglot`** que ejecuta `scripts/architecture/check-polyglot-runtime.sh` (tests Rust en `packages/rust-core` y Go en `services/go/reconciliation-worker`) con toolchains configuradas en el runner.

---

## Uso local (antes de push)

```bash
bun install --frozen-lockfile
bun run typecheck
bun run architecture:check-tsconfig-features
bun run architecture:check-boundaries
bun run architecture:check-framework-isolation
bun run architecture:check-product-surfaces
bun run docs:check-links
```

Ver también [CONTRIBUTING.md](../../CONTRIBUTING.md) y [Canonical Stack](../../docs/01-foundation/canonical-stack.md).

---

## Umbrales (resumen)

| Área | Pipeline principal `ci.yml` | Notas |
|------|-----------------------------|--------|
| TypeScript (`tsc`) | Error → falla el job | No es “solo warning” |
| Architecture scripts | Fallo → falla el job | Ver lista arriba |
| Documentation quality | Workflow dedicado | `documentation-quality.yml` |
| Biome (PR principal) | Incluido en `lint-and-typecheck` | Además en `quality-gates.yml` |

---

## Referencias

- [GitHub Actions](https://docs.github.com/en/actions)
- [Bun en CI](https://bun.sh/docs/test/ci)
- [Turborepo — CI](https://turbo.build/repo/docs/ci)

**Last updated:** 2026-08-30

---

*Alineado con la [filosofía de producto de Drenyra](../../docs/products/drenyra-product-philosophy.md) — documentación que reduce carga cognitiva y enseña con calidez.*
