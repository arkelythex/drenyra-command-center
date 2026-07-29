# RED — Receipt-Driven Execution

**Última actualización:** 2026-07-24
**Content type:** Specification — F0 Foundation
**North star:** [Drenyra Product Philosophy](../products/drenyra-product-philosophy.md)
**Taxonomía:** [Program Taxonomy](../architecture/program-taxonomy.md)

---

## 1. ¿Qué es RED?

RED (Receipt-Driven Execution) es el mecanismo por el cual **cada acción material en Drenyra genera un receipt inmutable** que captura:

```text
input
→ processing context (modelo, reglas, policies)
→ output
→ hash chain
→ firma
```

El receipt no es un log. Es un **artifact verificable** que puede ser validado sin depender del sistema que lo generó.

---

## 2. Anatomía de un receipt

```typescript
interface Receipt {
  /** Identificador único del receipt */
  id: string
  /** Tipo de acción que generó el receipt */
  action: string
  /** Timestamp ISO 8601 */
  timestamp: string
  /** Identidad del actor (usuario o agente) */
  actor: {
    id: string
    type: 'user' | 'agent' | 'system'
  }
  /** Scope fiscal completo */
  scope: {
    organizationId: string
    companyId: string
    companyRuc: string
    fiscalPeriod: string
  }
  /** Input hash (SHA-256 del payload original) */
  inputHash: string
  /** Output hash (SHA-256 del resultado) */
  outputHash: string
  /** Chain hash — SHA-256 del receipt anterior + este receipt */
  chainHash: string
  /** Versión del schema de receipt */
  version: string
  /** Firma del receipt */
  signature: string
}
```

---

## 3. Ciclo de vida

```
Action requested
→ Input captured + hashed
→ Processing (deterministic)
→ Output captured + hashed
→ Receipt constructed
→ Chain linked (previous receipt hash)
→ Signed
→ Stored (S3 + metadata in PostgreSQL)
→ Verifiable via receipt-verifier (Rust CLI)
```

---

## 4. ¿Qué acciones generan receipts?

| Acción                  | Tipo          | Prioridad |
| ----------------------- | ------------- | --------- |
| Journal entry posting   | Contable      | Alta      |
| SIRE submission         | Fiscal        | Alta      |
| Document ingestion      | Documento     | Alta      |
| Month-end close         | Contable      | Alta      |
| Bank reconciliation     | Conciliación  | Media     |
| Approval decision       | Gobernanza    | Alta      |
| Agent action (material) | Agentic       | Media     |
| Policy change           | Configuración | Alta      |

---

## 5. Verificación offline

Cada receipt puede verificarse sin el sistema:

```bash
drenyra-verify receipt.json
# → Valid: ✓ hash chain intact, ✓ signature valid
# → Invalid: ✗ hash mismatch at block 3
```

El verifier (Rust — `engines/receipt-verifier/`) es independiente y portátil.

---

## 6. Integración con el código existente

### Ya existe

| Componente                        | Estado                |
| --------------------------------- | --------------------- |
| Evidence Graph (`evidence-vault`) | ✅ applied            |
| S3-compatible storage             | ✅                    |
| Hash chain (SHA-256)              | ✅ en infraestructura |

### Por implementar

| Componente                   | Prioridad | Ubicación                              |
| ---------------------------- | --------- | -------------------------------------- |
| Receipt domain types         | Alta      | `packages/domain/src/receipt/`         |
| Receipt service (generación) | Alta      | `packages/application/src/receipt/`    |
| Receipt storage adapter      | Alta      | `packages/infrastructure/src/receipt/` |
| Api endpoint (GET receipt)   | Media     | `apps/api/`                            |
| CLI verifier                 | Baja      | `engines/receipt-verifier/`            |

---

## 7. Próximo paso

Crear los domain types de Receipt en `packages/domain/src/receipt/` con:

- `receipt.ts` — tipos canónicos
- `receipt.test.ts` — tests de construcción y validación
- `chain.ts` — lógica de chain hash
- `chain.test.ts` — tests de chain hash
