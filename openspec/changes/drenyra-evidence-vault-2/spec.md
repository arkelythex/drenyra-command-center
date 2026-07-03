# Spec: Evidence Vault 2.0 — Full Evidence Lineage

**Última actualización:** 2026-07-03
**Estado:** Spec
**Change:** drenyra-evidence-vault-2
**Delivery:** auto-chain — 4 PRs (~1,500 líneas)

---

## 1. Executive Summary

Refinar el Evidence Vault existente con **linaje probatorio completo**: cada asiento contable, diff, y thread debe poder mostrar su cadena de evidencia rastreable. Agregar `EvidenceLink` polimórfico para vincular evidencia a cualquier entidad (journal entry, thread, diff), validación batch contra SUNAT, y search avanzado.

---

## 2. What

### 2.1 EvidenceLink — Linaje Polimórfico

Nueva entidad que vincula evidencia a entidades del negocio:

```typescript
EvidenceLink {
  id: string;
  evidenceId: string;
  entityType: "journal_entry" | "thread" | "diff" | "agent_run";
  entityId: string;
  relationship: "source" | "supporting" | "output" | "audit_trail";
  linkedBy: string;     // who linked it
  linkedAt: Date;
  metadata?: Record<string, unknown>;
}
```

### 2.2 Evidence Refinements

Agregar al schema existente:

- `validations` JSONB — array de resultados de validación (SUNAT, hash, firma)
- `lineageSummary` JSONB — cache del linaje para queries rápidas
- `sourceDetail` JSONB — metadatos extendidos de la fuente (email origin, SUNAT ticket, etc.)

### 2.3 API

- `GET /api/v2/evidence` — search con filtros (tipo, fuente, estado, periodo, cliente)
- `GET /api/v2/evidence/:id` — detail con linaje expandido
- `POST /api/v2/evidence/validate` — validar documento contra SUNAT
- `POST /api/v2/evidence/batch-validate` — validación batch
- `POST /api/v2/evidence/link` — vincular a entidad
- `POST /api/v2/evidence/unlink` — desvincular
- `GET /api/v2/evidence/lineage/:entityType/:entityId` — linaje completo

### 2.4 UI

- EvidenceVaultPage (refactor de EvidenceBrowserPage existente)
- EvidenceLineagePanel (nuevo, reutilizable en inspector/diff/thread)
- EvidenceSearchBar con filtros
- EvidenceUploadZone drag-and-drop
- BatchValidateButton

---

## 3. Scope

### PR1 — Domain + Persistence (~350 lines)

- `EvidenceLink` entity + `EvidenceLinkType` + `EvidenceLinkRelationship`
- `evidence-links.schema.ts` — Drizzle schema
- Refinements a `EvidenceType` (agregar XML, CDR, PDF explícitos)
- Migration para `evidence_links` + columnas nuevas en `evidence`

### PR2 — API (~400 lines)

- Evidence V2 routes (search, detail, validate, link, lineage, batch)
- EvidenceLineageService (resolver linaje polimórfico)
- BatchValidateService

### PR3 — UI: Vault page (~400 lines)

- EvidenceVaultPage con search + table
- EvidenceUploadZone drag-drop
- EvidenceSearchBar filtros

### PR4 — UI: Lineage + integración (~350 lines)

- EvidenceLineagePanel (árbol visual)
- Integración con thread/diff/agent inspectors
- BatchValidateButton

### Out of scope

- OCR de documentos
- SUNAT en vivo (ya existe en infra)
- Plans 1-5 (referenciados pero no implementados)
