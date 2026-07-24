# CAP-SIRE-00 — Audit + Contract Freeze

**Capability pack**: 00 of 05 (SIRE vertical slice)
**Status**: PLANNED
**Branch**: `cap/sire-00-audit-contract-freeze`
**Estimated effort**: 1-2 days (read-only, no code changes)

---

## Objective

Establish the boundary contract for SIRE reconciliation before any implementation begins. This is a **read-only discovery phase** — no code mutations, no schema changes, no UI modifications.

---

## Tasks

### T01 — Inventory existing SIRE routes

- Map all API endpoints related to SIRE reconciliation
- Document: method, path, auth scope, tenant scoping, input/output schemas
- Identify unauthenticated or poorly scoped endpoints
- **Files**: `apps/api/src/features/sire/` (if exists) or SIRE-related services

### T02 — Map frontend SIRE components

- Catalog all SIRE-related React components, pages, and hooks
- Document: route, feature module, state management, data fetching pattern
- Identify: hardcoded RUC/period references, missing loading/error/empty states
- **Files**: `apps/web/src/features/sire/`, SIRE references in navigation

### T03 — Verify tenant boundary

- Confirm every SIRE API path enforces tenant isolation (Wave 3A contract)
- Check that `FiscalContext` (orgId, companyId, fiscalPeriodId) propagates correctly
- Identify gaps where tenant scope is inferred from visual state instead of verified membership
- **References**: `docs/adr/W2-04A`, `docs/adr/W2-05A`, `docs/architecture/tenant-access-matrix.md`

### T04 — Map existing evidence and diff schemas

- Document current SIRE evidence flow: source → match → discrepancy → resolution
- Map existing schemas: `SireDiffResponse`, evidence artifacts, reconciliation state
- Identify gaps against SDD-014 (Evidence & Provenance Graph) and SDD-016 (Diff & Materiality)
- **Files**: `SireDiffPage.tsx`, `useSireDiff.ts`, `mapSireDiffResponseToArtifact.ts`

### T05 — Document current job/recovery behavior

- Catalog SIRE-related durable jobs: sync, matching, submission
- Document: idempotency keys, retry policies, UNKNOWN handling
- Verify alignment with SDD-020 (Durable Execution) contracts
- **Files**: Wave 2 tests, `apps/api/src/services/accounting-job-runs/`

### T06 — Freeze capability pack contracts

- Based on T01-T05, define the **minimum contract subset** from each dependency SDD that CAP-SIRE-01 will implement
- For each SDD in the dependency pack (SDD-002, 006, 008, 010, 014, 016, 020, 034, 072), specify:
  - Which portions are **required** for CAP-SIRE-01
  - Which portions can be **deferred** to later CAPs
  - Any **gaps** where the SDD doesn't cover existing behavior
- Write as `docs/ux/cap-sire-01-contracts.md`

---

## Deliverables

| # | Artifact | Format |
|---|---|---|
| D01 | SIRE route inventory | Table in `docs/ux/cap-sire-00/` |
| D02 | SIRE component catalog | Table in `docs/ux/cap-sire-00/` |
| D03 | Tenant boundary gap report | Markdown doc in `docs/ux/cap-sire-00/` |
| D04 | Evidence/diff schema map | Markdown doc in `docs/ux/cap-sire-00/` |
| D05 | Job/recovery alignment report | Markdown doc in `docs/ux/cap-sire-00/` |
| D06 | CAP-SIRE-01 contract freeze | `docs/ux/cap-sire-01-contracts.md` (normative) |

---

## Review gates

After all tasks complete:

- [ ] G1: Route inventory reviewed by API owner
- [ ] G2: Component catalog reviewed by frontend lead
- [ ] G3: Tenant boundary gaps confirmed by security reviewer
- [ ] G4: Contract freeze reviewed by fiscal architect
- [ ] G5: CAP-SIRE-01 plan approved before any code changes

---

## Autonomy policy

CAP-SIRE-00 es auditoría y congelamiento contractual — sin comportamiento productivo. Ejecuta con **autonomía completa** hasta `verify`:

| Fase | Autonomía |
|------|-----------|
| explore → propose → spec → design → tasks → apply → verify | ✅ Completa — no requiere gates intermedios |
| archive / commit / push / PR | 🚫 Gate humano obligatorio |

**Reglas de detención autónoma** (detenerse solo si ocurre alguna):
1. Contradicción entre contratos normativos
2. Falta una decisión fiscal o de negocio que no pueda inferirse
3. La operación requiere modificar comportamiento productivo
4. Requiere migraciones, secretos, infraestructura o servicios externos
5. Podría debilitar tenant isolation, autorización o trazabilidad
6. Los tests o la evidencia contradicen el SDD
7. El alcance necesita expandirse fuera de CAP-SIRE-00

## Agent execution plan

```
1. agent=explore(sire routes, components)    → T01 + T02 (parallel)
2. agent=security-reviewer(tenant boundary)   → T03
3. agent=architect(evidence+diff schemas)     → T04
4. agent=devops(job/recovery mapping)         → T05
5. agent=architect(contract freeze)           → T06 (depends on T01-T05)
6. agent=verify(all deliverables)             → produce final diff + summary
```

**Subagents**: up to 3 in parallel for T01-T03 (read-only exploration). T04-T05 sequential after T01-T03. T06 sequential after T01-T05. No gates intermedios. Toda la secuencia es autónoma.

---

## Risk table

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| R01 | Existing SIRE routes undocumented | High | Medium | All tasks are read-only discovery; no risk of breaking production |
| R02 | Tenant boundary gaps found | Medium | High | Flagged in T03; design remediation in CAP-SIRE-01 |
| R03 | SDD contracts don't match existing behavior | Medium | Medium | T06 explicitly handles this — contract freeze defers mismatches to SDD revision |
| R04 | CAP-SIRE-01 scope grows too large | Medium | Medium | Contract freeze must separate REQUIRED vs DEFERRED portions |
