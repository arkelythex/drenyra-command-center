# SDD-WB-010 — Evidence Inspector & Provenance Navigation

**Change ID:** `sdd-wb-010`
**Capability:** CAP-WB-10 (Evidence Inspector & Provenance)
**Wave:** C (Review Model)
**Created:** 2026-07-27
**Extends:** `drenyra-evidence-vault-2` (applied)

## Purpose

Provide a visual evidence inspector that shows document support, verification status, policy reference, and provenance chain for any financial decision — answering "Why does this entry exist? Show me the evidence."

## Scope

### Included

1. **EvidenceInspector component** — Evidence list with type badges (document/receipt/calculation/source/policy), verification status (green check / amber X), hash preview
2. **ProvenanceChain component** — Visual chain of custody (journal_entry → diff → agent_run → approval → evidence) with timestamps and actors
3. **Policy reference section** — Applied policy code, name, version, date
4. **Summary bar** — Count of evidence + verified count

### Existing code

| File                                         | Status     | Evolution                            |
| -------------------------------------------- | ---------- | ------------------------------------ |
| `drenyra-evidence-vault-2`                   | ✅ applied | Backend evidence storage and lineage |
| `features/evidence/EvidenceBrowserPage.tsx`  | ✅ exists  | Browser page for evidence vault      |
| `features/evidence/EvidenceDetailPage.tsx`   | ✅ exists  | Detail page per evidence             |
| `components/workbench/EvidenceInspector.tsx` | ✅ NEW     | Inline evidence inspector component  |

## PRs

| PR  | Scope                       | Files est. | Lines est. |
| --- | --------------------------- | ---------- | ---------- |
| PR1 | EvidenceInspector component | 1          | ~250       |
| PR2 | ProvenanceChain component   | same file  | —          |
| PR3 | Policy reference section    | same file  | —          |
