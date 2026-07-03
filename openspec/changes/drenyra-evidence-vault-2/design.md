# Design: Evidence Vault 2.0

**Última actualización:** 2026-07-03
**Change:** drenyra-evidence-vault-2

---

## 1. Database Schema

### EvidenceLink (nueva)

```sql
CREATE TABLE evidence_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id   UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  entity_type   TEXT NOT NULL CHECK (entity_type IN ('journal_entry','thread','diff','agent_run')),
  entity_id     TEXT NOT NULL,
  relationship  TEXT NOT NULL DEFAULT 'supporting' CHECK (relationship IN ('source','supporting','output','audit_trail')),
  linked_by     TEXT NOT NULL,
  linked_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata      JSONB DEFAULT '{}',
  UNIQUE(evidence_id, entity_type, entity_id, relationship)
);

CREATE INDEX idx_evidence_links_evidence_id ON evidence_links(evidence_id);
CREATE INDEX idx_evidence_links_entity ON evidence_links(entity_type, entity_id);
```

### Evidence (columnas nuevas)

```sql
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS validations JSONB DEFAULT '[]';
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS lineage_summary JSONB DEFAULT '{}';
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS source_detail JSONB DEFAULT '{}';
```

---

## 2. Domain Entities

```typescript
// evidence-link-type.ts
export type EvidenceLinkEntityType = "journal_entry" | "thread" | "diff" | "agent_run";
export type EvidenceLinkRelationship = "source" | "supporting" | "output" | "audit_trail";

// evidence-link.ts
export class EvidenceLink {
  id: string;
  evidenceId: string;
  entityType: EvidenceLinkEntityType;
  entityId: string;
  relationship: EvidenceLinkRelationship;
  linkedBy: string;
  linkedAt: Date;
  metadata: Record<string, unknown>;
}
```

---

## 3. API Endpoints

All under prefix `/api/v2/evidence`:

```
GET    /search?type=&source=&status=&companyId=&period=&q=
       → { data: EvidenceDTO[], total: number }

GET    /:id
       → { data: EvidenceDetailDTO }  // incluye links + validations

POST   /:id/validate
       → { data: ValidationResult }

POST   /batch-validate
  Body: { ids: string[] }
       → { data: { validated: number, failed: number, results: ValidationResult[] } }

POST   /link
  Body: { evidenceId, entityType, entityId, relationship }
       → { data: EvidenceLinkDTO }

POST   /unlink
  Body: { linkId }
       → { data: { unlinked: true } }

GET    /lineage/:entityType/:entityId
       → { data: { entity: { type, id }, evidence: EvidenceDTO[] } }
```

---

## 4. UI Architecture

```tsx
<EvidenceVaultPage>
  <EvidenceSearchBar filters={{ type, source, status, period }} />
  <EvidenceTable items={evidence} onSelect={openDetail} />
  <EvidenceUploadZone onUpload={handleUpload} />
</EvidenceVaultPage>

// Inspector detail
<DocumentDetailPanel evidence={selected}>
  <EvidenceValidationStatus />
  <EvidenceTimeline />
  <EvidenceLinksList />
</DocumentDetailPanel>

// Reusable lineage panel
<EvidenceLineagePanel entityType="journal" entityId={id}>
  <EvidenceTree lineage={lineage} />
</EvidenceLineagePanel>
```

---

## 5. State

- TanStack Query para datos del servidor
- `useEvidenceList(filters)` — search con debounce
- `useEvidenceDetail(id)` — detail con linaje
- `useLinkEvidence()` / `useUnlinkEvidence()` — mutations
- `useValidateEvidence()` / `useBatchValidate()` — mutations
