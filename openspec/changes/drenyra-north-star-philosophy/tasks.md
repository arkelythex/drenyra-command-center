# Tasks — Drenyra North Star Philosophy

## PR 1 — OpenSpec strategy foundation (~250 lines)

- [x] Create parent proposal, spec, design, and tasks artifacts.
- [x] Create child OpenSpec plans for web, CLI, and docs alignment.
- [ ] Update `openspec/config.yaml` with the philosophy track.
- [ ] Update `openspec/master-index.md` with the dependency graph and delivery order.

## PR 2 — Canonical product philosophy docs (~300 lines)

- [ ] Create `docs/products/drenyra-product-philosophy.md` as the canonical north star.
- [ ] Link the doc from `CODEX-MAP.md`.
- [ ] Add review path and non-goals to prevent vague implementation.

## PR 3 — Surface guidance alignment (~350 lines)

- [ ] Update `apps/web/MAP.md` with web experience principles.
- [ ] Update `apps/cli/MAP.md` with terminal experience principles.
- [ ] Update `AGENTS.md` with philosophy-aware delivery guidance.

## Verification

- [ ] `bun run docs:verify` passes or the nearest available docs check is documented.
- [ ] Markdown lint issues are fixed or explicitly scoped as pre-existing.
- [ ] No fiscal behavior, API contract, or database schema was changed by docs-only PRs.

## Review workload forecast

- Chained PRs recommended: Yes, if docs alignment exceeds 400 changed lines.
- 400-line budget risk: Medium.
- Decision needed before apply: No, unless the canonical product doc expands into implementation detail.
