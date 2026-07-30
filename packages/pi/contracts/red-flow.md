# RED Flow — Receipt-Driven Execution

RED is the accounting equivalent of RDD (Receipt-Driven Development).
Every material accounting action generates an immutable receipt.

## Lifecycle

```
Action → record_receipt() → Receipt stored → Gate validation → Effect
```

## Where RED applies

| Action | Receipt fields | Gate |
|--------|---------------|------|
| Journal entry | account, debe, haber, period | ledger-integrity |
| SUNAT submission | document series, CDR, RUC | sunat-compliance |
| Period close | phase, approver, timestamp | human approval (R2+) |
| Configuration change | setting, old value, new value | audit-trail |
| Data migration | table, rows affected, backup | tenant-isolation |

## Receipt structure

See `contracts/red/receipt.schema.json` for the full schema.

Key fields:

- `id`: unique receipt ID (red-{timestamp}-{nonce})
- `timestamp`: ISO 8601
- `action`: what was done
- `ruc`: fiscal scope
- `periodo`: fiscal period
- `beforeState` / `afterState`: state diff
- `hash`: content hash for immutability

## RED in the FSD lifecycle

Each FSD phase transition generates a RED receipt:

```
captura → [RED: CPEs captured] → clasificacion → [RED: CPEs classified] →
conciliacion → [RED: Bank reconciled] → cierre → [RED: Period closed] →
declaracion → [RED: SUNAT filed] → auditoria → [RED: Audit complete]
```
