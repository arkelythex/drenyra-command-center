# Tasks — S4: Domain Package Boundary Audit

## Review Workload Forecast

- Total: ~350 lines, 2 PRs
- Budget risk: Low

## PR1 — Audit & Quick Moves

- [ ] Inspect fiscal-memory/ contents (6 files)
- [ ] Inspect fiscal-ontology/ contents (3 files)
- [ ] Inspect types/ contents (5 files)
- [ ] Inspect services/ contents (7+ files)
- [ ] Classify each as domain-pure or violator
- [ ] Move violators to application/ or infrastructure/
- [ ] Verify: `bun run typecheck` in packages/domain passes

## PR2 — Boundary Enforcement

- [ ] Add architecture:check-boundaries script
- [ ] Add domain-isolation test (domain imports nothing external)
- [ ] Update packages/domain/README.md with boundary rules
- [ ] Verify CI-compatible
