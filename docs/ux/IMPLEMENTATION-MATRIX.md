# Drenyra SDD Implementation Matrix

**Last updated**: 2026-07-14
**Branch base**: `security/w3a-0-auth-tenant-context`
**Purpose**: Map each SDD against existing code, tests, and verification gates. Agents MUST check this before implementing to avoid duplicating existing work.

---

## Status legend

| Status | Meaning |
|---|---|
| ❌ Not started | No code, no design, no tests |
| 🔍 Analysis | Investigation/inventory in progress |
| 📝 Specified | SDD written (PROPOSED) |
| 🏗️ In progress | Active implementation |
| ✅ Implemented | Code exists behind feature flag or in production |
| 🔬 Verifying | Tests passing, gates pending |
| 🟢 Done | Implemented, verified, deployed |

---

## Program & Discovery (SDD-000–005)

| SDD | Title | Spec | Code | Tests | Evidence | Gap |
|---|---|---|---|---|---|---|
| 000 | Experience Transformation Program | 🟢 APPROVED | ❌ | ❌ | SDD-000.md | N/A — constitution |
| 001 | User Roles, Personas & JTBD | 🟢 APPROVED | ❌ | ❌ | SDD-001.md | Personas defined, no code mapping |
| 002 | Fiscal Domain Language & IA | 📝 PROPOSED | ❌ | ❌ | SDD-002.md | Vocabulary defined, no enforcement |
| 003 | Current Experience Redundancy Audit | 📝 PROPOSED | ❌ | ❌ | SDD-003.md | Not started |
| 004 | Critical Workflow Baseline | 📝 PROPOSED | ❌ | ❌ | SDD-004.md | Not started |
| 005 | Product & Design Governance | 📝 PROPOSED | ❌ | ❌ | SDD-005.md | Governance rules defined, not enforced |

---

## Fiscal Trust Core (SDD-006–020)

| SDD | Title | Spec | Code | Tests | Evidence | Gap |
|---|---|---|---|---|---|---|
| 006 | Fiscal Trust Contracts | 📝 PROPOSED | ❌ | ❌ | SDD-006.md | Cross-cutting — not started |
| 007 | Error Recovery Patterns | 📝 PROPOSED | ❌ | ❌ | SDD-007.md | Not started |
| 008 | Evidence-First Content Strategy | 📝 PROPOSED | ❌ | ❌ | SDD-008.md | Not started |
| 010 | Verified Fiscal Context Propagation | 📝 PROPOSED | 🏗️ | 🔬 | PR #104/#105, `security/w3a-0-auth-tenant-context` | Tenant isolation in progress; UI propagation missing |
| 011 | Accounting Period Lifecycle | 📝 PROPOSED | ❌ | ❌ | — | Not started |
| 012 | Roles, Permissions & SoD | 📝 PROPOSED | ❌ | ❌ | — | Not started |
| 013 | Fiscal Artifact Identity & Versioning | 📝 PROPOSED | ❌ | ❌ | — | Not started |
| 014 | Evidence & Provenance Graph | 📝 PROPOSED | ✅ Partial | ❌ | `EvidenceBrowserPage`, `EvidenceDetailPage` | Evidence browser exists; provenance graph missing |
| 015 | Human Review & Approval Workflow | 📝 PROPOSED | ✅ Partial | ❌ | `approval-hub/`, `review/` features | Approval hub exists; workflow automation missing |
| 016 | Accounting Diff & Materiality Engine | 📝 PROPOSED | ✅ Partial | ❌ | `diffs/` feature, `SireDiffPage` | Diff viewer exists; materiality engine missing |
| 017 | Correction, Reversal & Rectification | 📝 PROPOSED | ❌ | ❌ | — | Not started |
| 018 | Immutable Audit Ledger & Retention | 📝 PROPOSED | ✅ Partial | ❌ | `agent-audit-trail/` API feature | Audit trail exists; append-only + export missing |
| 019 | AI Action Safety Contract | 📝 PROPOSED | ✅ Partial | ❌ | `ai-tool-permissions/`, `agents/` | AI permissions exist; L0-L3 contract missing |
| 020 | Durable Fiscal Execution | 📝 PROPOSED | ✅ | 🟢 | Wave 2: W2-04/05/06/07 | Idempotency, natural uniqueness, consumer dedup, job uniqueness all implemented and tested |

---

## Experience Platform (SDD-030–041)

| SDD | Title | Spec | Code | Tests | Evidence | Gap |
|---|---|---|---|---|---|---|
| 030 | Design Token Architecture | 📝 PROPOSED | ✅ Partial | ❌ | — | Tokens exist; semantic layering missing |
| 031 | Light & Black OLED Themes | 📝 PROPOSED | ✅ Partial | ❌ | — | Themes exist; consistency gaps |
| 032 | Typography, Numerals & Localization | 📝 PROPOSED | ✅ Partial | ❌ | — | Typography exists; numeral formats not fiscal-specific |
| 033 | Density System | 📝 PROPOSED | ❌ | ❌ | — | Not started |
| 034 | Financial Data Grid | 📝 PROPOSED | ✅ Partial | ❌ | — | Data grids exist; fiscal-specific patterns missing |
| 035 | Fiscal Forms & Validation | 📝 PROPOSED | ✅ Partial | ❌ | — | Forms exist; fiscal validation rules not centralized |
| 036 | Accessibility & Keyboard Navigation | 📝 PROPOSED | ❌ | ❌ | — | References in `references/SDD-005-detailed-accessibility.md` |
| 037 | Application Shell & Navigation | 📝 PROPOSED | ✅ | ❌ | `agentic-shell/`, `layout/` | Shell exists; context bar and inspector patterns pending |
| 038 | Persistent Fiscal Context Bar | 📝 PROPOSED | ❌ | ❌ | — | Not started |
| 039 | Adaptive Workspace & Inspector | 📝 PROPOSED | ❌ | ❌ | — | Not started |
| 040 | Command Palette & Universal Search | 📝 PROPOSED | ✅ Partial | ❌ | `DrenyraCommandBar` | Command bar exists; search scoping missing |
| 041 | Frontend Architecture & Performance | 📝 PROPOSED | ❌ | ❌ | — | Not started |

---

## Operational Workspace (SDD-050–059)

| SDD | Title | Spec | Code | Tests | Evidence | Gap |
|---|---|---|---|---|---|---|
| 050 | Fiscal Attention Inbox | 📝 PROPOSED | ✅ Partial | ❌ | `inbox/`, `accounting-inbox/` | Inbox exists; fiscal attention model pending |
| 051 | Object-Centered Fiscal Workspace | 📝 PROPOSED | ❌ | ❌ | — | Not started |
| 052 | Evidence & Approval Inspector | 📝 PROPOSED | ❌ | ❌ | — | Not started |
| 053 | Accounting Review & Diff Workspace | 📝 PROPOSED | ✅ Partial | ❌ | `diffs/`, `review/` | Diff viewer + review pages exist; integrated workspace missing |
| 054 | Contextual Agent Interaction | 📝 PROPOSED | ✅ Partial | ❌ | `agents/`, `ai-swarm/` | Agent UI exists; contextual scoping missing |
| 055 | Fiscal Cases, Tasks & Collaboration | 📝 PROPOSED | ❌ | ❌ | — | Not started |
| 056 | Execution Timeline & Activity | 📝 PROPOSED | ❌ | ❌ | — | Not started |
| 057 | Notifications & Deadline Management | 📝 PROPOSED | ✅ Partial | ❌ | `notifications/` component | Notification UI exists; fiscal deadline integration missing |
| 058 | Automations Control Center | 📝 PROPOSED | ✅ Partial | ❌ | `automations/` feature | Automation config exists; control center design pending |
| 059 | Fiscal Rules & Skills Administration | 📝 PROPOSED | ❌ | ❌ | — | Not started |

---

## Fiscal Vertical Slices (SDD-070–078)

| SDD | Title | Spec | Code | Tests | Evidence | Gap |
|---|---|---|---|---|---|---|
| 070 | Company Onboarding & Data Readiness | 📝 PROPOSED | ✅ Partial | ❌ | `onboarding/` feature | Onboarding flow exists; fiscal readiness checks missing |
| 071 | CPE & Source Document Ingestion | 📝 PROPOSED | ✅ | ❌ | `documents/`, `invoices/` | Document ingestion exists; CPE-specific validation pending |
| 072 | SIRE Reconciliation Workspace | 📝 PROPOSED | ✅ Partial | ❌ | `sire/` feature, `SireDiffPage`, `useSireDiff` | SIRE routes + diff exist; full reconciliation workspace missing |
| 073 | Banking Reconciliation Workspace | 📝 PROPOSED | ✅ Partial | ❌ | `banking/`, `reconciliations/` | Banking reconciliation UI exists; workspace integration pending |
| 074 | IGV Determination Workspace | 📝 PROPOSED | ❌ | ❌ | — | Not started |
| 075 | Monthly Close Command Workspace | 📝 PROPOSED | 🏗️ | ❌ | `cierre-mensual/` feature, `P0Hero`, `ContextualSidePanel` | Close workspace in active development |
| 076 | Tax Filing & Pre-submission Review | 📝 PROPOSED | ❌ | ❌ | — | Not started |
| 077 | Rectification Workflow | 📝 PROPOSED | ❌ | ❌ | — | Not started |
| 078 | Audit & Evidence Export | 📝 PROPOSED | ✅ Partial | ❌ | `audit/`, `evidence/` | Audit UI + evidence browser exist; export + integrity seal missing |

---

## Production & Migration (SDD-090–096)

| SDD | Title | Spec | Code | Tests | Evidence | Gap |
|---|---|---|---|---|---|---|
| 090 | Privacy, Security & Sensitive Data UX | 📝 PROPOSED | ✅ Partial | 🔬 | Wave 3A (tenant isolation) | Auth + tenant boundary in progress; sensitive data UX missing |
| 091 | Cross-layer Verification Strategy | 📝 PROPOSED | 🏗️ | 🔬 | Wave 2 gates | Integration tests exist; structured verification strategy pending |
| 092 | Visual Regression & Design QA | 📝 PROPOSED | ❌ | ❌ | — | Not started |
| 093 | Product Observability & UX Telemetry | 📝 PROPOSED | ❌ | ❌ | — | Not started |
| 094 | Legacy UI Migration & Deprecation | 📝 PROPOSED | ❌ | ❌ | — | Not started |
| 095 | Progressive Rollout & Feature Flags | 📝 PROPOSED | ❌ | ❌ | — | Not started |
| 096 | Onboarding, Documentation & Support | 📝 PROPOSED | 📝 | ❌ | — | Not started |

---

## Consolidated view

| Status | Count | SDDs |
|---|---|---|
| 🟢 APPROVED / implemented + tested | 1 | 020 |
| ✅ Implemented (partial) | 16 | 010, 014, 015, 016, 018, 019, 030, 031, 032, 034, 035, 037, 040, 050, 057, 078 |
| 🏗️ In progress | 3 | 010 (UI), 075, 091 |
| 📝 Specified only | 27 | 002, 003, 004, 005, 006, 007, 008, 011, 012, 013, 017, 033, 036, 038, 039, 041, 051, 052, 055, 056, 059, 070, 072, 074, 076, 077, 096 |
| ❌ Not started (no SDD) | 11 | 053, 054, 058, 071, 073, 090, 092, 093, 094, 095 — (gaps in numbering) |

**Total**: 58 SDDs tracked
**Critical path**: SDD-020 (DONE) + SDD-010 (in progress) + SDD-072 (partial) form the SIRE dependency pack backbone.

---

## References

Detailed implementation references in `docs/ux/references/`:

| Reference | Consumed by | Content |
|---|---|---|
| `references/SDD-002-detailed-trust-contracts.md` | SDD-006 | Trust contracts UI patterns |
| `references/SDD-004-detailed-telemetry.md` | SDD-093 | Trust metrics (ETS, AGE, Trust Velocity) |
| `references/SDD-005-detailed-accessibility.md` | SDD-036 | WCAG fiscal table patterns |
| `references/SDD-009-detailed-ruc-scope.md` | SDD-010 | Multi-RUC visual modes, color hash |
| `references/SDD-010-detailed-approval-gates.md` | SDD-015 | Gate levels G1-G5, 28 action types |
| `references/SDD-011-detailed-audit-trail.md` | SDD-018 | EventEntry model, timeline components |
| `references/SDD-012-detailed-notifications.md` | SDD-057 | 5 severities, 9 categories, offline queue |
| `references/SDD-013-detailed-error-recovery.md` | SDD-007 | 20 error codes, 16 recovery paths |
| Full list: see `references/README.md` | | |
