---
title: Cómo escribir tests
description: Patrones y convenciones para testing en Drenyra
last-verified: 2026-07-11
audience: developer
---

# Cómo escribir tests

Drenyra usa **Vitest** para TypeScript, **pytest** para Python y **go test** para Go. Esta guía cubre los patrones comunes.

## Stack de testing

| Stack                  | Runner       | Ubicación   |
| ---------------------- | ------------ | ----------- |
| TypeScript (API + Web) | Vitest 4.1.5 | `*.test.ts` |
| Python (data-engine)   | pytest       | `test_*.py` |
| Go (CLI)               | go test      | `*_test.go` |

## Patrones para TypeScript

### Unit tests

Tests sin dependencias externas (no DB, no API).

```typescript
import { describe, expect, it } from 'vitest'
import { Money } from '@drenyra/domain'

describe('Money', () => {
  it('suma dos montos correctamente', () => {
    const a = Money.fromAmount(100, 'PEN')
    const b = Money.fromAmount(50, 'PEN')
    const result = a.add(b)
    expect(result.amount).toBe(150)
  })

  it('lanza error si las monedas difieren', () => {
    const pen = Money.fromAmount(100, 'PEN')
    const usd = Money.fromAmount(50, 'USD')
    expect(() => pen.add(usd)).toThrow('Currency mismatch')
  })
})
```

**Reglas:**

- Arrange → Act → Assert (AAA)
- Un `it` por comportamiento
- Describí el escenario, no la implementación

### Integration tests

Tests que tocan DB o API. Usan helpers de `packages/test-utils/`.

```typescript
import { describe, expect, it } from 'vitest'
import { createTestDb, seedCompany } from '@drenyra/test-utils'

describe('CompanyRepository', () => {
  it('encuentra compañía por RUC', async () => {
    const db = await createTestDb()
    const company = await seedCompany(db, { ruc: '20546296564' })
    const found = await db.query.companies.findFirst({
      where: (c, { eq }) => eq(c.ruc, '20546296564'),
    })
    expect(found?.id).toBe(company.id)
  })
})
```

### Property-based tests (dominio fiscal)

Para invariantes que deben cumplirse para TODAS las entradas posibles.

```typescript
import { describe, expect, it } from 'vitest'
import { fc } from 'fast-check'
import { Money } from '@drenyra/domain'

const arbMoney = fc
  .tuple(
    fc.integer({ min: -1_000_000, max: 1_000_000 }),
    fc.constantFrom('PEN', 'USD')
  )
  .map(([cents, currency]) => Money.fromCents(cents, currency))

describe('Money (property-based)', () => {
  it('la suma es conmutativa', () => {
    fc.assert(
      fc.property(arbMoney, arbMoney, (a, b) => {
        const sum1 = a.add(b)
        const sum2 = b.add(a)
        return sum1.equals(sum2)
      })
    )
  })
})
```

## Convenciones

- Tests al lado del archivo que testean: `domain/src/Money.ts` → `domain/src/__tests__/Money.test.ts`
- Nombres de tests en español (describen el comportamiento)
- Usar fábricas de `packages/test-utils/` para datos de prueba
- Los integration tests que requieren DB se marcan con `--runInBand`
- Los property tests corren solo en CI (separados de unit)

## Comandos

```bash
bun run test              # Todos los tests
bun run test -- --run     # Unit + integration (sin watch)
bun run test:property     # Solo property tests (CI)
bun run test -- --coverage # Coverage report
```
