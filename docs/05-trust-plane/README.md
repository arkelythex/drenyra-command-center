# 05 — Trust Plane

**Última actualización:** 2026-07-27
**FEOS Plano:** 4 de 8 — Confianza
**Propósito:** Evidence, policy, materiality, approval, receipts, candidate authority
**Principio:** Gentle-AI — candidato exacto, recepción verificable, fail-closed

---

## Filosofía

> **El profesional no aprueba una intención. Aprueba un candidato financiero exacto.**

Cada acción material en Drenyra sigue este flujo:

```
Financial Candidate
→ freeze
→ hash
→ review
→ receipt
→ approval
→ revalidate
→ execute
```

Si cualquier elemento cambia (asiento, documento, periodo, política, monto, evidencia, compañía, aprobación), la autorización anterior deja de ser válida.

### Cadena de confianza

```
Candidate hash     sha256:...
Evidence root      sha256:...
Policy version     PE-SIRE-2026.07
Validation result  PASS
Reviewed by        user_...
Approved at        timestamp
```

### Before execution

```
recompute candidate hash
recompute evidence root
verify policy version
verify approval authority
verify company and period
verify external state
```

Si no coincide → **se bloquea**.

---

## Principios rectores

### 1. Candidato exacto

No se aprueban intenciones ni descripciones. Se congela el payload completo, se hashea y ese hash viaja por toda la cadena.

### 2. Evidence graph

Cada acción tiene un trail completo:

```
source → validated → proposed → approved → executed
```

### 3. Policy versionada

Las reglas fiscales y políticas contables tienen versiones inmutables. El candidate references la versión exacta.

### 4. Materiality

No todo requiere aprobación humana. El materiality engine determina umbrales por:

- Monto
- Tipo de transacción
- Compañía
- Periodo
- Historial de errores
- Riesgo fiscal

### 5. Fail-closed

Si algo no puede verificarse → no se ejecuta. `UNKNOWN` nunca equivale a éxito.

---

## Documentos planificados

Los siguientes documentos están identificados pero aún no han sido creados. Se generarán como parte de los SDDs del [programa FEOS](../01-foundation/feos-program.md):

- `evidence-graph.md` — Grafo de evidencia, lineage, provenance
- `receipt-protocol.md` — Receipt-Driven Execution (RED)
- `exact-candidate-authority.md` — Freeze, hash, verificación
- `approval-control-plane.md` — Gates, roles, materiality, escalamiento
- `policy-engine.md` — Políticas versionadas, evaluación
- `audit-trail.md` — Hash chain, logs append-only

---

## RED — Receipt-Driven Execution

Cada acción relevante genera un receipt inmutable:

```json
{
  "executionId": "exec_01K...",
  "workflow": "rce-reconciliation",
  "company": "cmp_...",
  "period": "2026-06",
  "inputHash": "sha256:...",
  "policyVersion": "pe-tax-2026.07",
  "model": "specialized-model-v4",
  "deterministicChecks": { "passed": 42, "failed": 0 },
  "approvedBy": "user_...",
  "executedAt": "2026-07-27T...",
  "outputHash": "sha256:..."
}
```

---

## Relación con otros planos

| Plano                                                   | Relación                                 |
| ------------------------------------------------------- | ---------------------------------------- |
| [04 — Intelligence](../04-intelligence-plane/README.md) | Agentes requieren approval gates R0–R3   |
| [06 — Execution](../06-execution-plane/README.md)       | Workflows durables ejecutan con receipts |
| [07 — Financial](../07-financial-plane/README.md)       | Asientos y cierres generan evidence      |
| [08 — Integration](../08-integration-plane/README.md)   | Conectores externos generan receipts     |
