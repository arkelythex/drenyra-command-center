---
last-verified: 2026-06-20
source-of-truth: packages/test-utils/package.json
auto-generated: false
---

# @drenyra/test-utils — Shared Testing Utilities

**Última actualización**: 2026-06-20 · [Filosofía Gentleman](../../docs/meta/gentleman-philosophy.md)

**Versión**: 1.0.0 | **Dependencias**: @drenyra/domain

---

## De un vistazo

El paquete **test-utils** provee infraestructura de testing reutilizable para todos los paquetes y apps de Drenyra: builders (patrón builder), fixtures, mocks, helpers de base de datos para tests, utilidades de aislamiento de tenant, clientes de API para tests y helpers E2E.

Escribí tests más rápido y con menos boilerplate — los builders y mocks hacen el trabajo pesado.

---

## 📦 Estructura

```text
packages/test-utils/src/
├── builders/           # Patrón builder para creación de datos de test
│   ├── invoice.builder.ts          # Builder de aggregate Invoice
│   ├── journal-entry.builder.ts    # Builder de asiento contable
│   ├── credit-note.builder.ts      # Builder de nota de crédito
│   ├── debit-note.builder.ts       # Builder de nota de débito
│   ├── transaction.builder.ts      # Builder de transacción
│   ├── account.builder.ts          # Builder de cuenta contable
│   ├── bank-transaction.builder.ts # Builder de transacción bancaria
│   ├── company.builder.ts          # Builder de empresa
│   ├── user.builder.ts             # Builder de usuario
│   ├── base.builder.ts             # Clase base de builder
│   └── index.ts
├── fixtures/           # Fixtures de test pre-construidos
│   ├── sire-fixtures.ts            # Fixtures de envío SIRE
│   └── index.ts
├── mocks/              # Implementaciones mock
│   ├── database.mock.ts            # Mock de base de datos
│   ├── email.mock.ts               # Mock de servicio de email
│   ├── llm-provider.mock.ts        # Mock de proveedor LLM
│   ├── payment-gateway.mock.ts     # Mock de gateway de pagos
│   ├── prometeo.mock.ts            # Mock de API Prometeo
│   ├── sunat-api.mock.ts           # Mock de API SUNAT
│   └── types.ts
├── helpers/            # Utilidades helper para tests
│   ├── money-helpers.ts            # Helpers de comparación Money
│   ├── date-helpers.ts             # Helpers de fecha/hora
│   ├── random.ts                   # Generadores de datos aleatorios
│   ├── assertions.ts               # Assertions personalizados
│   └── index.ts
├── database/           # Helpers de base de datos para tests
│   ├── test-db.ts                  # Setup/teardown de DB de test
│   ├── seed.ts                     # Datos semilla de test
│   └── index.ts
├── tenant/             # Utilidades de test de aislamiento de tenant
│   └── index.ts
├── api/                # Utilidades de cliente API para tests
│   └── index.ts
├── e2e/                # Helpers E2E (Playwright)
│   └── index.ts
└── index.ts            # API pública
```

### Lo que podés hacer

| Necesidad | Qué usar |
|-----------|----------|
| Crear una factura para test | `new InvoiceBuilder().withDefaults().build()` |
| Mockear SUNAT | `sunatApiMock.setup()` (de `mocks/`) |
| Base de datos limpia por test | `setupTestDb()` (de `database/`) |
| Comparar montos Money | `moneyHelpers()` (de `helpers/`) |
| Datos de envío SIRE | `sireFixtures` (de `fixtures/`) |

### Builder Pattern

```typescript
import { InvoiceBuilder } from "@drenyra/test-utils/builders";

const invoice = new InvoiceBuilder()
  .withCompanyRuc("20123456789")
  .withAmount(Money.from(1500, "PEN"))
  .withIgv(Money.from(270, "PEN"))
  .build();
```

Builders disponibles: `Invoice`, `JournalEntry`, `CreditNote`, `DebitNote`, `Transaction`, `Account`, `BankTransaction`, `Company`, `User`.

### Mocks

Mocks listos para usar de servicios externos: SUNAT API, Prometeo (banking), proveedores LLM, payment gateways, email y base de datos.

### Subpath Exports

| Ruta de Exportación | Descripción |
|---------------------|-------------|
| `@drenyra/test-utils` | Barrel export principal |
| `@drenyra/test-utils/builders` | Patrón builder |
| `@drenyra/test-utils/fixtures` | Fixtures de test |
| `@drenyra/test-utils/mocks` | Implementaciones mock |
| `@drenyra/test-utils/helpers` | Helpers de test |
| `@drenyra/test-utils/database` | Utilidades de DB para tests |
| `@drenyra/test-utils/tenant` | Utilidades de aislamiento de tenant |
| `@drenyra/test-utils/api` | Clientes API para tests |
| `@drenyra/test-utils/e2e` | Helpers E2E |

---

## 🚀 Scripts

```bash
cd packages/test-utils
bun run typecheck       # TypeScript type check
```

---

## 🔗 Dependencias

- **Runtime**: `@drenyra/domain`
- **Dev**: `@playwright/test`, `drizzle-orm`, `postgres`, TypeScript ^6.0.3, Vitest ^4.1.7

---

## 🧪 Ejemplo de uso

```typescript
import { describe, it, expect } from "vitest";
import { InvoiceBuilder } from "@drenyra/test-utils/builders";
import { sunatApiMock } from "@drenyra/test-utils/mocks";
import { setupTestDb } from "@drenyra/test-utils/database";

describe("Invoice Service", () => {
  it("should create an invoice", async () => {
    const db = await setupTestDb();
    sunatApiMock.setup();

    const invoice = new InvoiceBuilder()
      .withDefaults()
      .build();

    const saved = await db.insert(invoice);
    expect(saved.id).toBeDefined();
  });
});
```
