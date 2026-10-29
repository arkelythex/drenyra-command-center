# Codebase guide

**Última actualización**: 2026-10-02

A five-minute map. The authoritative, generated inventory is [`.codebase/index.yml`](../.codebase/index.yml); the human navigation map is [`CODEX-MAP.md`](../CODEX-MAP.md).

## Layers (dependency direction ↓)

| Layer | Where | Rule |
|-------|-------|------|
| Domain | `packages/domain` | Framework-free; entities, value objects (`Money` in cents), events. Coverage target: 100%. |
| Application | `packages/application` | Use cases, DTOs, ports. Vertical slice + CQRS. |
| Persistence / Infrastructure | `packages/persistence`, `packages/infrastructure` | Drizzle, adapters. Every query is tenant-scoped (`TenantScope`). |
| Adapters | `apps/api` (Elysia), `apps/web` (React 19) | Elysia is an input adapter, not the architecture. No domain logic in endpoints. |
| Agents and missions | `packages/agent-runtime`, `packages/mission-*`, `packages/drenyra-orchestrator`, `packages/fiscal-fsd` | Consume `drenyra-ai` contracts. |
| Engines and services | `engines/`, `services/go` | Rust verifies, Go connects. |

Check boundaries with `bun run architecture:check-boundaries`, which runs the full
enforcement pack (`bun run architecture:check`):

| Gate | What it refuses |
|------|-----------------|
| `check-package-boundaries` | a package importing upward, a dependency cycle, or an undeclared workspace dependency |
| `check-framework-isolation` | `elysia`, `react`, `drizzle-orm` or `pg` inside a domain or application package |
| `check-baseline-policy` | growing `.ci/typecheck-baseline.json` instead of fixing the error |
| `check-migration-governance` | renaming, reordering or dropping an applied migration |
| `audit-tsconfig-check-features` | a `tsconfig.check.json` relaxing a soundness option the root program enforces |
| `score-module-extraction` | importing a path that a package's `exports` map does not publish |

Accepted debt lives in `.ci/architecture-baseline.json` (gate key to finding keys) and the
applied-migration prefix in `.ci/migration-lock.json`. Both are reviewed like code: `--update`
records an exception, it never hides one.

## Find things

- Fiscal truth: `packages/domain/src/fiscal-truth`; SUNAT/SIRE docs: [`docs/06-fiscal`](06-fiscal).
- Per-app maps: `apps/api/MAP.md`, `apps/web/MAP.md`.
- Decisions: [`docs/11-adr`](11-adr/README.md). Work in flight: `odd/tasks/`.
- Agent skills: `.agent/skills/`.

## Verify a change

```bash
bun run typecheck && bun run lint
bun run docs:verify
bun scripts/sire-ledger-repro-check.ts   # when touching invoicing or books
```
