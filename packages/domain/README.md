---
last-verified: 2026-07-09
source-of-truth: packages/domain/package.json
auto-generated: false
---

# @drenyra/domain — Domain Layer

**Última actualización**: 2026-07-09 · [Filosofía Gentleman](../../docs/meta/gentleman-philosophy.md)

**Versión**: 1.0.0 | **Framework**: Ninguno (pure TypeScript, zero dependencies)

---

## De un vistazo

El paquete **domain** es la capa más interna de la arquitectura Drenyra. Contiene todas las entidades de negocio, value objects, eventos de dominio, interfaces de repositorio, errores de dominio y servicios de dominio. Tiene **cero dependencias runtime** y sigue diseño estrictamente framework-free — nada de ORM, HTTP ni frameworks.

Este es el corazón de la lógica de negocio. Todo lo demás depende de él — y eso es exactamente como debería ser.

> 💡 **Regla de oro**: si un concepto de negocio cambia, el cambio empieza acá. Si no pertenece acá, probablemente no pertenece a ningún lado.

---

## 📦 Estructura

```text
packages/domain/src/
├── entities/          # Entidades de dominio (aggregate roots)
├── value-objects/     # Value objects inmutables
├── events/            # Eventos de dominio
├── errors/            # Errores de dominio (clases tipadas)
├── services/          # Servicios de dominio (lógica stateless)
├── repositories/      # Interfaces de repositorio (contratos de persistencia)
├── accounting/        # VOs específicos de contabilidad (periodo, CPE, tipo de cambio, detracción)
├── types/             # Tipos compartidos (currency, product surfaces)
├── fiscal-truth/      # Verdad fiscal — dominio
├── fiscal-memory/     # Memoria fiscal — dominio
├── agents/            # Dominio de agentes
├── drenyra/           # Primitivas de dominio Drenyra
├── platform/          # Conceptos de dominio platform-level
└── index.ts           # API pública
```

### Entidades (`src/entities/`)

| Entidad              | Descripción                                   |
| -------------------- | --------------------------------------------- |
| `Account`            | Cuenta contable con plan de cuentas           |
| `AIPrompt`           | Entidad de template de prompt de IA           |
| `AISettings`         | Configuración de IA                           |
| `BankAccount`        | Cuenta bancaria                               |
| `BankReconciliation` | Agregado de conciliación bancaria             |
| `BankTransaction`    | Transacción bancaria                          |
| `Document`           | Documento genérico                            |
| `Invoice`            | Aggregate root de factura                     |
| `JournalEntry`       | Asiento contable con líneas de débito/crédito |
| `Transaction`        | Transacción financiera                        |

### Value Objects (`src/value-objects/`)

| VO                | Descripción                                               |
| ----------------- | --------------------------------------------------------- |
| `Money`           | Valor monetario con moneda — precisión segura, sin floats |
| `RUC`             | Identificador RUC peruano con checksum Módulo 11          |
| `DNI`             | Identificador DNI peruano                                 |
| `DocumentSeries`  | Serie de documento (ej. F001, B001)                       |
| `AccountType`     | Clasificación tipada de cuenta contable                   |
| `TransactionType` | Categorización tipada de transacción                      |
| `PromptVersion`   | Versión semántica para prompts de IA                      |

### Eventos de Dominio (`src/events/`)

| Evento               | Descripción                 |
| -------------------- | --------------------------- |
| `InvoiceCreated`     | Se emitió una factura       |
| `InvoiceSentToSunat` | La factura se envió a SUNAT |
| `TransactionPosted`  | Se contabilizó un asiento   |

### Errores de Dominio (`src/errors/`)

| Error                        | Descripción                          |
| ---------------------------- | ------------------------------------ |
| `InvalidAmountError`         | Monto monetario fuera de rango       |
| `InvalidDNIError`            | Violación de formato/checksum de DNI |
| `InvalidDocumentSeriesError` | Violación de formato de serie        |
| `InvalidRUCError`            | Violación de formato/checksum de RUC |

### Servicios (`src/services/`)

| Servicio         | Descripción                              |
| ---------------- | ---------------------------------------- |
| `TaxCalculator`  | Cálculo de IGV y desglose de impuestos   |
| `igv-calculator` | Cálculos standalone de porcentaje de IGV |

### Accounting (`src/accounting/`)

| Módulo              | Descripción                          |
| ------------------- | ------------------------------------ |
| `accounting-period` | Value object de periodo contable     |
| `cpe-log`           | Tipos de log de CPE (Comprobante)    |
| `detraccion`        | VOs del sistema de detracciones SPOT |
| `exchange-rate`     | Value object de tipo de cambio       |

### Interfaces de Repositorio (`src/repositories/`)

Contratos para persistencia — las implementaciones viven en `@drenyra/persistence`:

`account.repository`, `invoice.repository`, `document.repository`, `journal-entry.repository`, `transaction.repository`, `bank-account`, `bank-reconciliation`, `bank-transaction`, `client.repository`, `provider.repository`, `accounting-period.repository`, `detraction.repository`, `ai-settings.repository`, `ai-prompt.repository`, `exchange-rate.repository`, `fiscal-memory.repository`, `cpe-log.repository`

---

## 🚀 Scripts

```bash
cd packages/domain
bun run typecheck    # TypeScript type check
bun run test         # Ejecutar tests unitarios (Vitest)
```

---

## 🧱 Domain Boundary Audit (2026-07-11)

Resultado de la auditoría de boundaries del SDD S4. Cada directorio en `src/` fue clasificado:

| Directorio               | Veredicto           | Acción                                                                      |
| ------------------------ | ------------------- | --------------------------------------------------------------------------- |
| `ai/`                    | ✅ Fuera de dominio | Ya removido                                                                 |
| `agents/`                | ✅ Fuera de dominio | Ya removido                                                                 |
| `fiscal-agentic-ledger/` | ✅ Fuera de dominio | Ya removido                                                                 |
| `fiscal-memory/`         | ✅ Domain-pure      | Entidad con validación, sin I/O                                             |
| `fiscal-ontology/`       | ✅ Domain-pure      | Tipos de ontología fiscal                                                   |
| `platform/`              | ✅ Fuera de dominio | Ya removido                                                                 |
| `roi/`                   | ✅ Fuera de dominio | Ya removido                                                                 |
| `services/`              | ✅ Domain-pure      | Servicios de dominio (cálculos fiscales puros)                              |
| `types/`                 | ⚠️ Limpiado         | `product-surfaces.ts` y `product-surface-registry.ts` removidos (dead code) |

### Regla de boundary

```
packages/domain/ NO debe importar de:
- Cualquier paquete externo (runtime)
- Capas de infraestructura (DB, HTTP, filesystem)
- Paquetes de aplicación (@drenyra/application, apps/api)
- Paquetes de AI/agentes (@drenyra/ai, @drenyra/pi)
```

---

## 🔗 Dependencias

- **Runtime**: Ninguna (zero dependencies)
- **Dev**: TypeScript ^6.0.3, Vitest ^4.1.7

---

## 📋 Restricciones de Diseño

| Regla                                                                   | Por qué                                               |
| ----------------------------------------------------------------------- | ----------------------------------------------------- |
| Sin imports de frameworks                                               | El dominio debe poder testearse sin infraestructura   |
| Sin concerns de infraestructura (DB, HTTP, filesystem)                  | Esa es responsabilidad de la capa de aplicación       |
| Todos los valores monetarios usan `Money` — nunca `number`              | Los floats causan errores de redondeo en contabilidad |
| Identificadores fiscales peruanos (`RUC`, `DNI`) validados al construir | No puede existir un RUC inválido en el dominio        |
| Eventos de dominio son objetos planos                                   | No atados a ningún event bus                          |
| Las entidades aplican invariantes en sus constructores                  | Un objeto inválido no debería poder crearse           |
