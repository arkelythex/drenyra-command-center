# Tasks — Drenyra Fiscal Editorial v3

**Última actualización:** 2026-06-30

## Review Workload Forecast

| Metric | Value |
|--------|-------|
| 400-line budget risk | **Exceeded every phase** |
| Chained PRs recommended | **Yes — 12 PRs** |
| Decision needed before apply | ADR-2026-FE-001 accepted |

## Phase 0 — PR1: ADR + DESIGN.md v3

- [x] ADR-2026-FE-001
- [ ] DESIGN.md v3 rewrite
- [ ] design-influences-2026.md
- [ ] exploration audit doc

## Phase 1 — PR2: DTCG rebrand

- [ ] Update `tokens.dtcg.json` v3.0.0 Fiscal Editorial
- [ ] Sync `generated/tokens.css` + `tokens.ts`
- [ ] Update `contrast.test.ts` expected values

## Phase 2 — PR3: packages/ui parity

- [ ] Sync `packages/ui/src/styles/tokens.css`
- [ ] Button/Card/Panel editorial styles

## Phase 3 — PR4: Web adapters

- [ ] SurfacePanel component
- [ ] Deprecate glass-card, liquid-glass
- [ ] Export from ui/index.ts

## Phase 4 — PR5: FiscalEditorialShell

- [ ] Create FiscalEditorialShell.tsx
- [ ] Wire MainLayoutShell to use it
- [ ] CodexShell shim

## Phase 5 — PR6: Theme store

- [ ] Default accent `voltage`
- [ ] theme-package voltage preset
- [ ] Settings appearance token unification

## Phase 6 — PR7: Agent surfaces

- [ ] DiffViewerV3
- [ ] ArtifactSidebar
- [ ] RightPanel integration

## Phase 7 — PR8: Pilot rollout

- [ ] Dashboard token pass
- [ ] SireDiffPage DiffViewer integration

## Phase 8 — PR9: Invoices + Banking

- [ ] Replace glass-card usages in invoices feature
- [ ] Banking surfaces token pass

## Phase 9 — PR10: Compliance + Reports

- [ ] Compliance tabs editorial surfaces
- [ ] Reports header token pass

## Phase 10 — PR11: Codemod + ESLint

- [ ] Tighten eslint-plugin-design-tokens
- [ ] Ban backdrop-blur-glass in features (warn)

## Phase 11 — PR12: Verify + archive

- [ ] Playwright visual stub
- [ ] OpenPencil manifest stub
- [ ] verify-report.md
- [ ] Update AGENTS.md §6

## Gates (every PR)

```bash
bun run typecheck
bun run lint
bun run test:run -- apps/web/src/lib/design-tokens apps/web/src/components/ui
bun run build && bun run check:bundle
```
