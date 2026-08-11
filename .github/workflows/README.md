# GitHub Actions Workflows

CI/CD pipelines for ARKELYTHEX. El **gate principal** para merge en PR está en **`ci.yml`** (job `lint-and-typecheck` y jobs dependientes). **`quality-gates.yml`** añade comprobaciones self-hosted (Biome, heurísticas de seguridad, métricas) y **no** sustituye al typecheck estricto del pipeline principal.

---

## Primary pipeline (`ci.yml`)

**Triggers:** `pull_request` y `push` a `main` y `develop`.

**Job `lint-and-typecheck` (bloqueante):**

- ESLint (`bun run lint`)
- Biome (`bunx @biomejs/biome@2.3.11 biome check`)
- TypeScript: `bun run typecheck` (`tsc -p tsconfig.check.json`) — **falla el job si hay errores**
- `bun run architecture:check-product-surfaces`
- Comprobaciones de docs: `docs:check-links`
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

**Checks:** cobertura JSDoc, READMEs de features, diagramas Mermaid, archivos críticos.

**Umbrales:** JSDoc &lt; 60% puede bloquear según configuración del workflow.

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

Incluye cobertura (api + web), contratos, E2E, seguridad (`bun audit`) y un job resumen. Los jobs de benchmarks y polyglot fueron removidos porque sus scripts nunca existieron en el repo.

---

## Variante manual `ci-optimized.yml`

Pipeline alternativo/optimizado para ejecuciones manuales (`workflow_dispatch`). Decisión vigente: mantenerlo como diagnóstico bajo demanda, pero **no ejecutarlo automáticamente ni convertirlo en el gate canónico de PR** mientras duplique jobs de `ci.yml`.

Reglas de mantenimiento:

- `ci.yml` sigue siendo el source of truth para PRs y branch protection.
- `ci-optimized.yml` puede ejecutarse manualmente para diagnósticos post-merge, pero sus comandos deben mantenerse alineados con `ci.yml` cuando validen el mismo contrato.
- No ejecutar linters/formatters sobre todo el baseline histórico si el repositorio todavía tiene deuda fuera del diff; usar rangos de archivos cambiados.
- Si un job optimizado falla por drift con `ci.yml`, corregir el drift o retirar el job duplicado antes de hacerlo required.
- Si la capacidad de runners vuelve a ser cuello de botella, preferir reducir duplicación en `ci-optimized.yml` antes que desactivar checks requeridos.


---

## Self-hosted pilot workflows

`quality-gates-self-hosted-pilot.yml` and `ci-self-hosted-pilot.yml` are **experimental runner-readiness workflows**. They validate host connectivity, labels, and native dependencies before promoting any broader self-hosted migration. They are not branch-protection gates and must not be treated as substitutes for `ci.yml`.

Use them when changing runner host images, service registration, Docker/native packages, or uv/Python availability. If their checks duplicate `ci.yml`, keep the pilot scoped to proving the runner host can execute the canonical commands instead of adding a second required signal.

Canonical runner maintenance docs:

- [Self-hosted runner host runbook](../../docs/06-runbooks/self-hosted-runner-host-runbook-2026.md) — provisioning and standard operations.
- [Self-hosted runner troubleshooting index](../../docs/09-troubleshooting/self-hosted-runner-host-runbook-2026.md) — quick triage path that points back to the canonical runbook.
---

## Uso local (antes de push)

```bash
bun install --frozen-lockfile
bun run typecheck
bun run architecture:check-product-surfaces
bun run docs:check-links
```

Ver también [CONTRIBUTING.md](../../CONTRIBUTING.md) y [docs/01-architecture/monorepo-pipeline.md](../../docs/01-architecture/monorepo-pipeline.md).

---

## Umbrales (resumen)

| Área | Pipeline principal `ci.yml` | Notas |
|------|-----------------------------|--------|
| TypeScript (`tsc`) | Error → falla el job | No es “solo warning” |
| Architecture scripts | Fallo → falla el job | Ver lista arriba |
| JSDoc / docs quality | Workflow dedicado | `documentation-quality.yml` |
| Biome (PR principal) | Incluido en `lint-and-typecheck` | Además en `quality-gates.yml` |

---

## Referencias

- [GitHub Actions](https://docs.github.com/en/actions)
- [Bun en CI](https://bun.sh/docs/test/ci)
- [Turborepo — CI](https://turbo.build/repo/docs/ci)

**Last updated:** 2026-06-14

---

*Alineado con la [Filosofía Gentleman](../../docs/meta/gentleman-philosophy.md) de ARKELYTHEX — documentación que reduce carga cognitiva y enseña con calidez.*
