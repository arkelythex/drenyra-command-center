# SDD Proposal: drenyra-treasury-core

| Field              | Value                       |
| ------------------ | --------------------------- |
| **Change ID**      | `drenyra-treasury-core`     |
| **SDD Phase**      | Proposal                    |
| **Status**         | Draft                       |
| **Author**         | SDD Proposer (el Gentleman) |
| **Created**        | 2026-07-25                  |
| **Target**         | Treasury & Banking          |
| **Capabilities**   | CAP-TREAS-01 → CAP-TREAS-11 |
| **Artifact Store** | openspec + engram           |

---

## Executive Summary

Drenyra Treasury & Banking tiene **implementación parcial significativa** (API banking 62 files, 19 tests; WEB banking 44 files, 6 tests; API cashflow 9 files; WEB cashflow 19 files; Domain entities; Application use cases) **pero 0 SDDs formales**. Banking API es madura: CRUD cuentas, transacciones con importación CSV, conciliación manual y automática, **shadow reconciliation** para cutover controlado, proyección de cashflow, balance summary. La prioridad inmediata es **formalizar y activar en producción** lo que ya existe, no construir desde cero.

---

## Product decisions (deliberadas con el stakeholder)

1. **Primer slice MVP**: Integración bancaria en vivo (Prometeo) + conciliación automática. Activar el código Prometeo que ya existe pero no está en producción, promover shadow reconciliation a modo principal.
2. **Dolor principal**: Clientes necesitan conexión bancaria en vivo. El cuello de botella actual es la alimentación manual de transacciones.
3. **Fiscal peruano**: Integrar detracciones SPOT E ITF E reportes SUNAT (PDT/PLE) como requisitos no negociables del módulo de tesorería.

---

## Scope (Capabilities del capability map)

| ID           | Capability                            | Estado real                                               | Prioridad | SDD propuesto                     |
| ------------ | ------------------------------------- | --------------------------------------------------------- | --------- | --------------------------------- |
| CAP-TREAS-01 | Bank accounts & connectivity          | 🟡 CRUD completo, faltan providers en vivo                | P0        | `drenyra-treasury-bank-accounts`  |
| CAP-TREAS-02 | Bank transactions feed & import       | 🟡 Manual + CSV existente, falta feed automático          | P0        | `drenyra-treasury-transactions`   |
| CAP-TREAS-03 | Bank reconciliation & matching        | 🟡 Manual + shadow reconciliation existente               | P0        | `drenyra-treasury-reconciliation` |
| CAP-TREAS-04 | Auto-reconciliation engine            | 🟡 Shadow mode exists, promotion needed                   | P0        | `drenyra-treasury-autoreconcile`  |
| CAP-TREAS-05 | Cashflow projection & forecasting     | 🟡 API + WEB existente, validar datos reales vs simulados | P1        | `drenyra-treasury-cashflow`       |
| CAP-TREAS-06 | Payments & disbursements              | ◌ No implementado                                         | P1        | `drenyra-treasury-payments`       |
| CAP-TREAS-07 | Liquidity management                  | ◌ No implementado                                         | P2        | `drenyra-treasury-liquidity`      |
| CAP-TREAS-08 | Bank provider integrations (Prometeo) | 🟡 Código existe (8 files) pero no en producción          | P0        | `drenyra-treasury-providers`      |
| CAP-TREAS-09 | CBDC / digital wallet                 | 🟡 CBDCWallet UI existe (3 files WEB)                     | P3        | `drenyra-treasury-cbdc`           |
| CAP-TREAS-10 | Treasury agent & automation           | 🟡 Infrastructure agents/treasury existe                  | P2        | `drenyra-treasury-agent`          |
| CAP-TREAS-11 | Detracciones bancarias vinculadas     | 🟡 API detractions (3 files), schema existe               | P1        | `drenyra-treasury-detractions`    |

---

## Prioridades y secuencia

### Fase 0 (P0 — Inmediata): Formalizar y activar existente

| SDD                               | Acción                                                               | Archivos a tocar                         |
| --------------------------------- | -------------------------------------------------------------------- | ---------------------------------------- |
| `drenyra-treasury-providers`      | Auditar código Prometeo, activar en producción, tests de integración | API banking-providers (8 files)          |
| `drenyra-treasury-autoreconcile`  | Promover shadow reconciliation a modo principal, remover shadow gate | banking/reconciliation-shadow.service.ts |
| `drenyra-treasury-bank-accounts`  | SDD formal + tests faltantes + documentación API                     | Domain bank-account, API accounts CRUD   |
| `drenyra-treasury-transactions`   | SDD formal + tests de importación + documentación                    | API transactions, import, CSV parser     |
| `drenyra-treasury-reconciliation` | SDD formal + tests de matching + edge cases                          | API reconciliation (manual + auto)       |

### Fase 1 (P1 — Próximo): Completar ciclo

| SDD                            | Acción                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| `drenyra-treasury-cashflow`    | Validar que los datos de cashflow vengan de ledger real, no simulados. Integrar AR/AP |
| `drenyra-treasury-payments`    | Construir lote de pagos, programación, integración bancaria para disbursements        |
| `drenyra-treasury-detractions` | Integrar detracciones SPOT al flujo de pagos bancarios                                |

### Fase 2 (P2 — Futuro): Avanzado

| SDD                          | Acción                                                           |
| ---------------------------- | ---------------------------------------------------------------- |
| `drenyra-treasury-liquidity` | Gestión de liquidez multi-moneda, forecasting multi-escenario    |
| `drenyra-treasury-agent`     | Treasury agent automatizado (conciliación, alertas, sugerencias) |
| `drenyra-treasury-cbdc`      | CBDC wallet digital (cuando el mercado lo requiera)              |

---

## Fiscal requirements (Perú)

### Detracciones SPOT

- Integrar cálculo de detracción en el flujo de pagos a proveedores
- Vincular cuenta bancaria de detracciones (cuenta corriente especial)
- Reporte de detracciones para SUNAT

### ITF (Impuesto a las Transacciones Financieras)

- Calcular ITF (0.005% desde 2024, verificar tasa actual) en cada movimiento bancario
- Reporte mensual de ITF para contabilidad

### SUNAT reports

- Exportar movimientos bancarios en formato PLE
- Conciliación bancaria como parte del cierre mensual (SUNAT req.)

---

## Review workload forecast

| Estimación                 | Valor                                                          |
| -------------------------- | -------------------------------------------------------------- |
| Archivos a tocar en Fase 0 | ~80–120 (incluyendo tests)                                     |
| Líneas estimadas en Fase 0 | ~2,000–3,500                                                   |
| Chained PRs recomendadas   | Sí — dividir en 3 PRs (providers, reconciliation, formal SDDs) |
| Pr 1                       | Bank providers activation + reconciliation promotion           |
| PR 2                       | Formal SDDs for accounts + transactions                        |
| PR 3                       | Formal SDD for reconciliation + integration tests              |
| PR 4+                      | Cashflow, payments, detractions                                |

---

## Risks

| Riesgo                                         | Impacto | Mitigación                                             |
| ---------------------------------------------- | ------- | ------------------------------------------------------ |
| Prometeo integration no testeada en producción | Alto    | Activar con feature flag, shadow mode primero          |
| Shadow reconciliation data loss                | Alto    | Cutover solo tras N ciclos exitosos + metrics          |
| Detracciones SPOT mal calculadas               | Fiscal  | Tests de compliance con casos SUNAT reales             |
| Cashflow projection con datos simulados        | Medio   | Validar origen de datos antes de promover a producción |

---

## Next steps

1. ✅ Product decisions validated (integrating + autoconciliation first)
2. ⏳ Codebase exploration completa para dimensionar Fase 0
3. ⏳ SDD Spec: bank-providers activation
4. ⏳ SDD Spec: auto-reconciliation promotion
5. ⏳ SDD Spec: bank-accounts formalization
