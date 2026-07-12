# Design — S4: Domain Package Boundary Audit

## PR1 — Audit & Quick Moves (~200 lines)

1. Inspect fiscal-memory/, fiscal-ontology/, types/, services/
2. Classify each file as domain-pure or violator
3. Move violators to application/ or infrastructure/
4. Verify typecheck passes after moves

## PR2 — Boundary Enforcement (~150 lines)

1. Add architecture:check-boundaries script
2. Add CI check for domain import violations
3. Update packages/domain/README.md with boundaries
4. Add domain-isolation test
