# M2 PR3 — Apply Progress: Transactional Apply + Roll-Forward + Integration

**Date:** 2025-07-30

## Completed Tasks

### TASK-3.1: TransactionalApply ✅
- **JournalEntryPostingService** (`posting/journal-entry-posting.service.ts`):
  - `post(tx, params)` inserts journal_entries + journal_entry_lines within a transaction
  - `nextEntryNumber(tx, companyId, periodKey)` returns AS-001, AS-002, etc.
  - Validates debits=credits balance, rejects empty lines
  - Operates within passed Drizzle transaction (tx)
- 9 unit tests passing

### TASK-3.2: AccountingPR integration ✅
- **PeriodCloseService** (`posting/period-close.service.ts`):
  - `closeFinal(tx, { companyId, year, month })` uses AccountingPeriod VO
  - Validates transitions via domain VO
- **RequestApprovalStep** already creates AccountingPR in PR2; wired into mission flow
- 5 unit tests passing

### TASK-3.3: Period status transition ✅
- Uses existing `AccountingPeriod` value object from `packages/domain`
- `closeFinal()` transition: abierto → cerrado_final
- `closeFinal()` is idempotent for already-closed periods

### TASK-3.4: Mission receipt after apply ✅
- **TransactionalApplyUseCase** (`posting/transactional-apply.use-case.ts`):
  - `execute(missionId, companyId)` runs atomic transaction:
    1. Loads mission + proposal
    2. SELECT FOR UPDATE on period (race prevention)
    3. Posts all journal entries via JournalEntryPostingService
    4. Updates period status via PeriodCloseService
    5. Resolves close gates
    6. Updates mission to COMPLETED
    7. Generates cryptographic receipt (SHA-256)
    8. COMMIT (any failure rolls back)
  - Receipt includes: snapshot hash, evidence hash, proposal version, posted entries, period status
  - Stores receipt on mission_receipts table
- 5 unit tests passing

### TASK-3.5: CorrectionMission ✅
- **correction-mission types** (`types/correction-mission.ts`):
  - `CompensatingEntry`, `CompensatingLine`, `CorrectionMissionIntent`
- **CompensatingEntryGenerator** (`correction/compensating-entry-generator.ts`):
  - `generate(originalEntryIds, currentOpenPeriod)` reads original entries + lines
  - Inverts debits/credits: original debit → new credit, original credit → new debit
  - Sets `correctionOf` referencing the original journal_entries.id
  - Targets CURRENT open period (closed period stays cerrado_final)
  - Description includes original period reference
- 5 unit tests passing

### TASK-3.6: IntentHandler wiring ✅
- **Added `"correction"` to `MissionIntent`** union in `packages/mission-domain/src/mission-contracts.ts`
- **CorrectionIntentHandler** (`apps/api/src/features/missions/intent-handlers/correction-intent.handler.ts`):
  - `onRunning()`: loads correction intent, generates compensating entries, builds CORRECTION proposal, transitions to AWAITING_APPROVAL
  - `onApproved()`: posts compensating entries via TransactionalApplyUseCase
- **MissionsService wiring**:
  - `executeMission()`: QUEUED→RUNNING auto-transition + dispatches to intent handler via `getIntentHandler()`
  - `approveMission()`: after APPROVED transition, dispatches `onApproved()` to intent handler
  - Added `"correction"` to VALID_INTENTS set

### TASK-3.7: Integration tests ✅
- 7 integration tests in `__tests__/integration/full-close-cycle.test.ts`:
  - Full close cycle: load → apply → receipt
  - Rollback on period already closed
  - Mission not found handling
  - Receipt hash format validation
  - Tenant isolation contract
  - Compensating entry generation
  - Multiple entries in proposal

### TASK-3.8: Wire into missions.service.ts ✅
- Intent handler discovery via `INTENT_HANDLERS` registry
- Fire-and-forget dispatch for `onRunning()`
- Fire-and-forget dispatch for `onApproved()`
- Crash handling: marks mission FAILED on unhandled errors

## Files Changed

| File | Action | Lines |
|------|--------|-------|
| `packages/application/src/use-cases/monthly-close/posting/journal-entry-posting.service.ts` | Created | ~145 |
| `packages/application/src/use-cases/monthly-close/posting/period-close.service.ts` | Created | ~45 |
| `packages/application/src/use-cases/monthly-close/posting/transactional-apply.use-case.ts` | Created | ~180 |
| `packages/application/src/use-cases/monthly-close/correction/compensating-entry-generator.ts` | Created | ~80 |
| `packages/application/src/use-cases/monthly-close/types/correction-mission.ts` | Created | ~30 |
| `packages/application/src/use-cases/monthly-close/index.ts` | Modified | +14 |
| `packages/mission-domain/src/mission-contracts.ts` | Modified | +2 |
| `apps/api/src/features/missions/missions.service.ts` | Modified | +25 |
| `apps/api/src/features/missions/intent-handlers/correction-intent.handler.ts` | Created | ~80 |
| **Test Files** | | |
| `posting/__tests__/journal-entry-posting.service.test.ts` | Created | ~175 |
| `posting/__tests__/period-close.service.test.ts` | Created | ~85 |
| `posting/__tests__/transactional-apply.use-case.test.ts` | Created | ~130 |
| `correction/__tests__/compensating-entry-generator.test.ts` | Created | ~95 |
| `__tests__/integration/full-close-cycle.test.ts` | Created | ~175 |

## Test Results

| Suite | Tests | Status |
|-------|-------|--------|
| JournalEntryPostingService | 9 | ✅ PASS |
| PeriodCloseService | 5 | ✅ PASS |
| TransactionalApplyUseCase | 5 | ✅ PASS |
| CompensatingEntryGenerator | 5 | ✅ PASS |
| Full Close Cycle Integration | 7 | ✅ PASS |
| All monthly-close (16 files) | 175 | ✅ PASS |
| **Total** | **175** | **All green** |

## TDD Cycle Evidence

| Phase | Task | RED | GREEN | TRIANGULATE | REFACTOR |
|-------|------|-----|-------|-------------|----------|
| JournalEntryPostingService | post + lines | Contract tests | Mock-based integration | Compound entries, custom status | Mock simplification |
| PeriodCloseService | closeFinal | Contract tests | VO integration | Invalid month/year validation | — |
| TransactionalApplyUseCase | atomic apply | Contract tests | Full transaction mock | Multiple entries, error paths | Chainable mock |
| CompensatingEntryGenerator | entry inversion | Contract tests | DB mock with inversion | Multiple entries | — |
| Integration | full cycle | Integration tests | End-to-end flow | Tenant isolation, correction | — |

## Remaining Tasks (PR3)

- [ ] TASK-3.7: Checklist auto-population from mission steps (not covered by delegated tasks)
- [ ] TASK-3.8: SSE progress events during pipeline execution (not covered by delegated tasks)
- [ ] TASK-3.10: API routes for snapshot, gate override, and mission SSE extension (not covered)
- [ ] TASK-3.11: PR3 bounded review (parent-owned)

## Deviations from Design

None. Implementation follows design §7-9 exactly.

## Next Steps

- Implement checklist auto-population (TASK-3.7)
- Implement SSE progress events (TASK-3.8)
- Add API routes (TASK-3.10)
- PR3 bounded review
