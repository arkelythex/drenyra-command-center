# Test Patterns — Builders / Object Mothers

**Última actualización:** 2026-07-09

Los builders evitan repetir datos de fixtures y hacen los tests más legibles.

## Builders Centralizados

Viven en `packages/test-utils/src/builders/`.

```typescript
import { buildInvoice } from '@drenyra/test-utils/builders'

test('detracción no excede monto', () => {
  const invoice = buildInvoice({ total: 1000 })
  expect(invoice.detraccion.amount).toBeLessThanOrEqual(invoice.total)
})
```

## Builders Disponibles

| Builder | Props | Default |
|---------|-------|---------|
| `buildInvoice()` | `total`, `ruc`, `series`, `date`, `detraccion` | Invoice válida con defaults |
| `buildBill()` | `total`, `ruc`, `provider`, `igv` | Bill válida |
| `buildDetraccion()` | `amount`, `spotCode`, `depositDate` | Detracción sin depositar |
| `buildRetencion()` | `amount`, `rate`, `period` | Retención estándar 3% |
| `buildCompany()` | `ruc`, `name`, `fiscalStatus` | Empresa activa |
| `buildRuc()` | `number` | RUC válido con checksum correcto |
| `buildFiscalPeriod()` | `year`, `month` | Periodo actual |
| `buildApprovalRequest()` | `type`, `amount`, `requester` | Solicitud pendiente |
| `buildApprovalDecision()` | `requestId`, `approved` | Decisión aprobada |

## Patrón

```typescript
// packages/test-utils/src/builders/invoice.builder.ts
import { faker } from '@faker-js/faker'
import type { Invoice } from '@drenyra/domain'

interface InvoiceOverrides {
  total?: number
  ruc?: string
  series?: string
  date?: Date
  detraccion?: Detraccion
}

export function buildInvoice(overrides: InvoiceOverrides = {}): Invoice {
  return {
    id: faker.string.uuid(),
    total: overrides.total ?? faker.number.int({ min: 100, max: 100_000 }),
    ruc: overrides.ruc ?? '20123456789',
    series: overrides.series ?? `F${faker.number.int({ min: 1, max: 999 })}`,
    date: overrides.date ?? new Date(),
    detraccion: overrides.detraccion ?? buildDetraccion(),
  }
}
```

## Reglas

1. Siempre usar `overrides: Partial<T>` para permitir defaults sensatos
2. Usar `faker` para datos irrelevantes al test
3. Usar valores fijos para datos relevantes al dominio fiscal (RUC, SPOT codes)
4. Documentar el builder en su archivo
