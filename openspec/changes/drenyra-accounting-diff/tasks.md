# Tasks: Drenyra Accounting Diff + Review Queue

## Delivery Strategy

- auto-chain: 3 PRs
- Review workload: ~1200 lines total

---

## PR 1 — Domain + Persistence + API (~450 lines)

- [ ] **1.1**: Create domain types: DiffId, DiffType, DiffStatus en packages/domain/src/diff/
- [ ] **1.2**: Create AccountingDiff entity with state machine (pending→approved/rejected/info_requested)
- [ ] **1.3**: Create DiffChange, DiffImpact value objects
- [ ] **1.4**: Create ReviewQueueItem entity and ReviewDecision value object
- [ ] **1.5**: Update packages/domain index exports
- [ ] **1.6**: Create persistence schemas: accounting-diffs.schema.ts, review-queue.schema.ts
- [ ] **1.7**: Create diffs API feature: types, schemas, service, routes (8 endpoints)
- [ ] **1.8**: Register diffsRoutes in app-core.ts
- [ ] **1.9**: Write service tests (≥10 test cases)

## PR 2 — Frontend Diff View (~400 lines)

- [ ] **2.1**: Create diffs.types.ts (frontend DTOs)
- [ ] **2.2**: Create diffs.api.ts (Eden Treaty client)
- [ ] **2.3**: Create query-keys.ts + query-options.ts
- [ ] **2.4**: Create AccountingDiffView.tsx (split Before/After)
- [ ] **2.5**: Create DiffProposalCard.tsx
- [ ] **2.6**: Create DiffImpactPanel.tsx
- [ ] **2.7**: Create DiffEvidencePanel.tsx
- [ ] **2.8**: Create DiffActionBar.tsx
- [ ] **2.9**: Create route diffs/index.tsx

## PR 3 — Frontend Review Queue (~350 lines)

- [ ] **3.1**: Create review-queue.types.ts
- [ ] **3.2**: Create review-queue.api.ts
- [ ] **3.3**: Create review-queue.store.ts (Zustand: filters, selected)
- [ ] **3.4**: Create ReviewQueuePage.tsx (agrupado por prioridad)
- [ ] **3.5**: Create ReviewQueueItem.tsx (card con prioridad)
- [ ] **3.6**: Create ReviewQueueFilter.tsx
- [ ] **3.7**: Create ReviewHistoryTimeline.tsx
- [ ] **3.8**: Create BatchApproveDialog.tsx
- [ ] **3.9**: Create route review-queue/index.tsx
- [ ] **3.10**: Add sidebar nav items for /diffs/ and /review-queue/
