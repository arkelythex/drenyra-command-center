# Proposal — Drenyra Fiscal Editorial v3

**Última actualización:** 2026-06-30  
**Status:** Approved for apply  
**Change ID:** `drenyra-fiscal-editorial-v3`

## Intent

Rebrand the Drenyra web design system from **Glass & Steel / Ember Noir** to **Fiscal Editorial**: a warm editorial command center inspired by Cursor 3 and Codex App patterns, unified under a single DTCG token pipeline, without changing fiscal domain logic or API contracts.

## In scope

- Token unification (`tokens.dtcg.json` → web + `@drenyra/ui`)
- DESIGN.md v3 agent contract + anti-patterns
- Primitives v3 (Button, Card, Panel, SurfacePanel)
- `FiscalEditorialShell` (merge MainLayout + CodexShell)
- Agent surfaces: DiffViewer v3, ArtifactSidebar, FloatingInspectPanel
- Theme store migration (accent `voltage` default)
- Settings appearance token parity
- Pilot rollout: dashboard, SIRE diff
- ESLint token enforcement + visual regression stubs

## Out of scope

- SUNAT/IGV/SIRE business logic
- Money VO / domain calculations
- Database schemas / API contracts
- Landing full parity (tracked as follow-up capability)

## Capabilities

| Capability | Type | Contract |
|------------|------|----------|
| `design-tokens-core` | Modified | Single DTCG source; Fiscal Editorial palette |
| `design-md-contract` | New | DESIGN.md v3 + influences doc |
| `packages-ui-parity` | Modified | UI package consumes web-generated tokens |
| `fiscal-editorial-shell` | New | Unified shell with operational + command-center modes |
| `primitives-v3` | Modified | Flat editorial components; glass deprecated |
| `agent-command-surfaces` | Modified | Codex/Cursor diff + artifact patterns |
| `complexity-density-modes` | Modified | Preserved unchanged behavior |
| `lint-enforcement` | New | Tighter ESLint + adapter tests |

## Approach

Phased auto-chain delivery (12 PRs). Lane-based design (A–F). Operations-first layout zones preserved per `operations-first-ai-assisted-2026.md`.

## Affected areas

| Area | Impact |
|------|--------|
| `apps/web/src/lib/design-tokens/` | High |
| `apps/web/src/index.css` | Medium |
| `packages/ui/` | High |
| `apps/web/src/components/layout/` | High |
| `apps/web/src/components/agentic/` | Medium |
| `apps/web/src/features/sire/` | Medium (pilot) |
| `apps/web/DESIGN.md` | High |

## Risks

| Risk | Mitigation |
|------|------------|
| Ecosystem brand conflict (Copper → Voltage) | ADR-2026-FE-001 |
| Visual regression on fiscal tables | Contract tests + pilot routes first |
| 340+ file migration | Codemod + ESLint incremental |

## Rollback

Each PR is independently revertable. Token rollback: restore `tokens.dtcg.json` v2.0.0 snapshot from git.

## Success criteria

- Single token source of truth
- WCAG AA on dark + light editorial
- No glass on critical routes
- Shell unified with CodexShell shim
- Bundle budget preserved (<350 KB max chunk)
