# Drenyra Engines — Rust

Núcleo crítico verificable. Cada engine es un crate independiente en un Cargo workspace.

## Candidatos actuales

| Engine              | Propósito                                                                            | Prioridad |
| ------------------- | ------------------------------------------------------------------------------------ | --------- |
| `ledger/`           | Ledger validation: débitos=créditos, precision, period locking, compensating entries | Alta      |
| `canonicalization/` | Normalización + hashing determinista + receipt signing                               | Alta      |
| `fiscal-rules/`     | Reglas fiscales compiladas a WASM para ejecución sandboxed                           | Media     |
| `receipt-verifier/` | CLI independiente para verificar receipts sin servidor                               | Media     |

## Estrategia

Extracción progresiva vía strangler pattern:

1. TypeScript port exists
2. Adapter → Rust engine
3. Compare outputs (shadow)
4. Verification
5. Gradual cutover

Ver [Canonical Stack](../docs/architecture/canonical-stack.md).
