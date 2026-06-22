# Contributing to Arkelythex

> **Última actualización:** 2026-06-20

Bienvenido. Esto es lo que necesitás saber para contribuir de forma predecible, revisable y segura.

---

## Tabla de Contenidos

- [Issue-First Workflow](#issue-first-workflow)
- [PR Budget and Delivery Strategies](#pr-budget-and-delivery-strategies)
- [Checks Before a PR](#checks-before-a-pr)
- [Branches, Pull Requests, and Merging](#branches-pull-requests-and-merging)
- [Commits](#commits)
- [Review Empathy](#review-empathy)
- [Agent and IDE Configuration](#agent-and-ide-configuration)
- [Documentation Updates](#documentation-updates)

---

## Issue-First Workflow

No PR sin un issue aprobado. Esta no es una sugerencia — es la regla.

```
1. GitHub Issue (bug report / feature request / docs change)
2. Discusion y aprobacion (label: triaged)
3. Branch desde main -> feat/fix/docs/<issue-number>-<topic>
4. PR apuntando al issue (closes #N)
5. Review + merge
```

**Excepciones:** fixes triviales (typo, link roto, un test) o emergencias de seguridad documentadas.

---

## PR Budget and Delivery Strategies

### Hard limit: 400 lines

**Maximum 400 changed lines per PR.** Esto es revisable, no negociable. Un PR de 400 líneas ya es grande; uno de 600 es inhumano.

Cada commit debe ser un **work unit revisable**: código + tests + docs juntos. Nada de commits separados "add tests" o "update docs".

### Cuando superás las 400 líneas

Elegí UNA de estas estrategias y documentala en el body del PR:

| Estrategia | Cuando usarla | Como |
|------------|---------------|------|
| **ask-on-risk** | Estimacion inicial incierta | Pregunta primero: "Esto va a ser ~600 lineas. Partimos en dos PRs?" |
| **auto-chain** | Claramente divisible en fases | PR1: schema + migracion. PR2: API + tests. PR3: frontend + docs. |
| **single-pr** | Riesgo bajo, reviewer con contexto | Un solo PR de hasta 600 lines si el reviewer conoce el area. |
| **exception-ok** | Refactor mecanico (rename, move) | Un solo PR documentando que es cambio mecanico y revisable por diff. |

> **Delivery strategy reference:** [Gentleman Philosophy — Delivery Strategies](../docs/meta/gentleman-philosophy.md#delivery-strategies)

---

## Checks Before a PR

Run locally (subset of CI):

```bash
bun install
bun run lint
bun run typecheck
```

Para cambios que tocan dominio fiscal, SUNAT, DB schema, tenant isolation, o money calculations, agregá:

```bash
bun run test                          # Unit + integration
bun run compliance:sire-gate          # SUNAT compliance
bun run docs:verify                   # Docs freshness & links
```

---

## Branches, Pull Requests, and Merging

Do not push directly to `main`. All changes go through a **pull request**.

1. **Start from an updated `main`:**
   ```bash
   git fetch origin main
   git checkout main && git pull origin main
   git checkout -b feat/your-topic   # or fix/..., docs/..., chore/...
   ```
2. **Before opening or updating a PR:** merge or rebase `main` so your branch is up to date with the base:
   ```bash
   git fetch origin main && git merge origin/main
   ```
3. **Open a PR to `main`:** use the [pull request template](.github/pull_request_template.md) (summary, how to test, scope, review path). Keep PRs under 400 lines. Prefer chained PRs for larger changes.
4. **Address review and CI:** resolve conversation threads, fix failing checks, and re-push.
5. **Merge on GitHub:** use **Squash and merge** (linear history on `main`).
6. **After merge:** delete the remote feature branch.

---

## Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/) as used elsewhere in the monorepo (`feat:`, `fix:`, `docs:`, etc.).

Cada commit debe ser un work unit completo: código + tests + docs, no parches separados.

---

## Review Empathy

Diseñá tu PR para que el reviewer pueda verificar tu intención sin reconstruir toda la historia.

### PR Body Template

```markdown
## Summary
[Una linea: que cambia y por que]

## Scope
- [ ] Feature implementation
- [ ] Bug fix
- [ ] Docs update
- [ ] Refactor
- [ ] Tests only

## Out of scope
[Que NO cambia este PR]

## Review path
1. Primero: [archivo mas importante]
2. Despues: [archivo secundario]

## Verification
- [ ] Tests pasan localmente
- [ ] Typecheck pasa
- [ ] Links funcionales (si toca docs)
- [ ] Sin console.log ni secretos
```

### Reglas

1. **Scope explícito**: decí qué archivos tocás y cuáles NO tocás.
2. **Chained PRs**: si el cambio es grande (>400 lines), dividilo en PRs encadenados.
3. **Review workload forecast**: si son +300 líneas, estimá cuánto tiempo debería tomar revisarlo.
4. **Links funcionales**: todos los links internos deben funcionar antes del PR.

---

## Agent and IDE Configuration

This repository configures several AI/IDE surfaces (Cursor, Claude Code, Codex, etc.). They can drift if each copy-pastes the same policies.

**Canonical architecture and governance text** lives under `docs/`, especially:

- [docs/01-architecture/README.md](docs/01-architecture/README.md) — architecture index and "source of truth" order.
- [docs/01-architecture/agent-tooling.md](docs/01-architecture/agent-tooling.md) — how agent rules should relate to docs.
- [docs/01-architecture/package-dependency-graph.md](docs/01-architecture/package-dependency-graph.md) — allowed package dependency directions.
- [docs/01-architecture/monorepo-pipeline.md](docs/01-architecture/monorepo-pipeline.md) — Bun + Turborepo task graph and CI caching.

When adding or changing a rule for agents, **update docs or shared skills first**, then add a short pointer in `.cursor/`, `.claude/`, or `.codex/` rather than duplicating long policy blocks. For the layout of `.cursor/` (Project rules, vendored SDD, sync from Gentle AI), read [.cursor/README.md](.cursor/README.md).

### AI Agent Delegation Triggers

Cuando trabajás con agentes AI, estos triggers determinan cuándo delegar a sub-agentes especializados:

| Trigger | Cuando delegar | A quien |
|---------|----------------|---------|
| **4-file rule** | El cambio requiere modificar 4+ archivos | `explore` para mapear, luego `build` |
| **Multi-file write** | Escribir 3+ archivos nuevos o modificar 5+ | Sub-agente con contexto completo |
| **PR pre-review** | Cambio genera PR de +200 lineas | `reviewer` o `code-reviewer` |
| **Incident** | Bug fiscal, de seguridad, o data loss | `security-reviewer` + `judge` |
| **SUNAT/fiscal** | Cualquier cambio en logica fiscal/SUNAT | `sunat-compliance` skill + `tester` |
| **Architecture decision** | Decision con tradeoffs significativos | `architect` + ADR |

> **Full reference:** [Gentleman Philosophy — Delegation Triggers](../docs/meta/gentleman-philosophy.md#delegation-triggers-para-agentes)

---

## Documentation Updates

ARKELYTHEX sigue la [Gentleman Philosophy](docs/meta/gentleman-philosophy.md) para documentación:

1. **Docs-as-Code**: actualizá docs en el MISMO PR que el código. Commits atómicos incluyen docs.
2. **Diátaxis**: cada doc pertenece a UN cuadrante (tutorial / how-to / reference / explanation). No mezcles.
3. **Cognitive load**: cada doc debe cumplir AL MENOS 3 de 6 patrones (lead with answer, progressive disclosure, chunking, signposting, recognition over recall, review empathy).
4. **Date freshness**: cada doc tiene `**Última actualización**: YYYY-MM-DD` al inicio.
5. **Doc stale**: si pasaron 6 meses sin updates, agregá banner: "⚠️ **Documento no revisado desde [fecha].**"
6. **Warm teaching**: explicá el POR QUÉ, no solo el QUÉ.

> Ver [Documentation Standards (2026)](docs/meta/documentation-standards-2026.md) y [Gentleman Philosophy](docs/meta/gentleman-philosophy.md) para la guía completa.
