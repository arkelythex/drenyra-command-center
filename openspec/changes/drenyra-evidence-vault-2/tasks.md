# Tasks: Evidence Vault 2.0

**Change:** drenyra-evidence-vault-2
**Delivery:** auto-chain — 4 PRs

---

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1,400–1,600 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |

---

## PR1 — Domain + Persistence (~350 lines)

- [ ] 1.1 Create `EvidenceLink` domain entity + types
- [ ] 1.2 Refine `EvidenceType` (add XML, CDR, PDF to enum)
- [ ] 1.3 Create `evidence-links.schema.ts` Drizzle schema
- [ ] 1.4 Add `validations`, `lineage_summary`, `source_detail` columns to evidence schema
- [ ] 1.5 Barrel exports for domain + persistence

## PR2 — API (~400 lines)

- [ ] 2.1 Evidence V2 search/list route
- [ ] 2.2 Evidence detail with lineage route
- [ ] 2.3 Evidence validate + batch-validate routes
- [ ] 2.4 Evidence link + unlink routes
- [ ] 2.5 Lineage endpoint (resolver links + join evidence)
- [ ] 2.6 Register routes in app-core

## PR3 — UI: Vault Page (~400 lines)

- [ ] 3.1 EvidenceSearchBar with filters
- [ ] 3.2 EvidenceTable component
- [ ] 3.3 EvidenceUploadZone drag-drop
- [ ] 3.4 EvidenceVaultPage refactor
- [ ] 3.5 TanStack Query hooks

## PR4 — UI: Lineage + Integración (~350 lines)

- [ ] 4.1 EvidenceLineagePanel tree component
- [ ] 4.2 DocumentDetailPanel in inspector
- [ ] 4.3 BatchValidateButton
- [ ] 4.4 Integrate lineage into diff/thread/agent views
