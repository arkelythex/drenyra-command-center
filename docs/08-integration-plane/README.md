# 08 — Integration Plane

**Última actualización:** 2026-07-27
**FEOS Plano:** 7 de 8 — Integración
**Propósito:** DFP (Drenyra Financial Protocol), SUNAT, banks, ERPs, authorities
**Principio:** Adopt before build — compose before customize

---

## Filosofía

Drenyra no construye conectores desde cero. Adopta, compone y extiende.

### DFP — Drenyra Financial Protocol

MCP no debe exponerse directamente como la identidad estratégica del producto. Drenyra construye una abstracción propia:

> **DFP: Drenyra Financial Protocol**

Internamente puede usar MCP, APIs, colas y adaptadores. Externamente ofrece una interfaz financiera homogénea.

```
DFP Connectors
├── Tax Authorities
│   ├── SUNAT (Perú)
│   ├── DIAN (Colombia)
│   ├── SAT (México)
│   ├── SII (Chile)
│   └── SRI (Ecuador)
├── Banking
├── Electronic Invoicing
├── Payroll
├── ERP connectors
├── Payment gateways
├── Document storage
└── Government registries
```

### Strict tool contracts

Cada herramienta tiene contratos estrictos. La IA nunca envía texto libre a sistemas externos:

```typescript
// ✅ Correcto
submitFiscalRecord({
  jurisdiction: 'PE',
  companyId: 'cmp_...',
  fiscalPeriodId: 'period_...',
  recordType: 'RVIE' | 'RCE',
  candidateReceipt: 'receipt_...',
  approvalToken: 'token_...',
})

// ❌ Incorrecto
submitToSunat(rawTextFromModel)
```

---

## Adopt before build

| Problema          | Adoptar                | Drenyra construye     |
| ----------------- | ---------------------- | --------------------- |
| Durable workflows | Temporal               | Workflows contables   |
| Event streaming   | NATS JetStream         | Eventos de dominio    |
| Object storage    | S3-compatible          | Evidence graph        |
| Auth/Identity     | IdP probado            | Tenant/role semantics |
| Secrets           | Vault/KMS              | Credential policy     |
| OCR/Extraction    | Proveedores existentes | Verificación fiscal   |

---

## Documentos planificados

Los siguientes documentos están identificados pero aún no han sido creados. Se generarán como parte de los SDDs del [programa FEOS](../01-foundation/feos-program.md):

- `dfp-protocol.md` — Drenyra Financial Protocol, contratos
- `sunat-connector.md` — SOL, RVIE, RCE, CDR, OSE
- `bank-connectors.md` — Belvo/Plaid, bancos peruanos
- `connector-framework.md` — Conformance, testing, versionado
- `erp-connectors.md` — Integración con sistemas legacy

---

## Relación con otros planos

| Plano                                                   | Relación                             |
| ------------------------------------------------------- | ------------------------------------ |
| [04 — Intelligence](../04-intelligence-plane/README.md) | Tools tipadas para agentes           |
| [05 — Trust](../05-trust-plane/README.md)               | Conectores requieren approval tokens |
| [06 — Execution](../06-execution-plane/README.md)       | Llamadas externas con fencing        |
| [09 — Country](../09-country-plane/README.md)           | Conectores varían por país           |
