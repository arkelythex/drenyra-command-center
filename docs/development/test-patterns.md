---
title: Test Patterns
description: Builders, fixtures, mocks y guías de testing para Drenyra
last-verified: 2026-07-11
audience: developer
---

# Test Patterns

## Object Mothers / Builders

Para entidades fiscales complejas, usamos el patrón Object Mother (builder con defaults).

```typescript
import { Money, RUC } from '@drenyra/domain'

export function aMoney(
  overrides?: Partial<{ cents: number; currency: string }>
) {
  const { cents = 10000, currency = 'PEN' } = overrides ?? {}
  return Money.fromCents(cents, currency as 'PEN' | 'USD')
}

export function aRUC(overrides?: Partial<{ value: string }>) {
  const { value = '20546296564' } = overrides ?? {}
  return RUC.create(value)
}
```

**Reglas:**

- Nombrar con prefijo `a` (ej: `aMoney`, `aRUC`, `aDetraccion`)
- Valores default que sean válidos y realistas
- `overrides` opcional para personalizar
- Los builders están en `packages/test-utils/src/builders/`

## Property-Based Testing

Para invariantes fiscales, usamos `fast-check`. Ver `packages/domain/src/__tests__/fiscal-invariants.property.test.ts`.

```typescript
import { fc } from 'fast-check'
import { Money } from '@drenyra/domain'

const arbMoney = () =>
  fc
    .tuple(
      fc.integer({ min: 0, max: 1_000_000_00 }),
      fc.constantFrom('PEN', 'USD')
    )
    .map(([cents, currency]) => Money.fromCents(cents, currency))

test('la suma es conmutativa', () => {
  fc.assert(
    fc.property(arbMoney(), arbMoney(), (a, b) => {
      return a.add(b).equals(b.add(a))
    })
  )
})
```

**Reglas:**

- Los property tests corren SOLO en CI (son lentos)
- Seeds de falla se guardan como regression tests
- Usar `fc.integer` para cents, no floats

## Mocking

Para servicios externos (SUNAT, OSE, bancos):

```typescript
import { vi } from 'vitest'
import { SunatClient } from '@drenyra/infrastructure'

vi.mock('@drenyra/infrastructure', async () => {
  const actual = await vi.importActual('@drenyra/infrastructure')
  return {
    ...actual,
    SunatClient: vi.fn().mockImplementation(() => ({
      validateRUC: vi.fn().mockResolvedValue({ valid: true }),
    })),
  }
})
```

**Reglas:**

- Mockear en los boundaries (interfaces/ports), no en el dominio
- Preferir integration tests con test containers sobre mocks
- Los mocks de servicios externos están en `packages/test-utils/src/mocks/`
