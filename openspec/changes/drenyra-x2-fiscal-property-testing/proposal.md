# X2: Property-Based Fiscal Testing

**Estado:** proposal
**Creado:** 2026-07-11
**Depende de:** P3 (Testing Infrastructure — proposal)
**PRs estimados:** 2
**Líneas estimadas:** ~600

---

## Problema

Los tests actuales son **example-based**: cubren escenarios específicos pero no garantizan que las invariantes fiscales se cumplan para TODAS las entradas posibles. Para un producto fiscal peruano:

- ¿Qué pasa si el IGV se calcula con `base = 0.01`? ¿Con `999999999.99`?
- ¿Qué pasa si una detracción tiene porcentaje en el borde exacto?
- ¿El checksum de RUC funciona para TODOS los 11 dígitos posibles?
- ¿El Money suma correctamente para TODOS los valores entre `-10^6` y `10^6`?
- ¿Las operaciones contables respetan la conservación (debe = haber)?

**Dato:** Según el artículo de NordVarg (2024), property-based testing encontró **41 bugs en producción** en sistemas financieros en 4 años. De esos, 7 eran críticos y 12 eran errores de rounding que costaban plata real.

## Solución Propuesta

### PR1: Fast-Check Test Suite (TS)

Usar `fast-check` (Property-Based Testing para TypeScript) para:

**Invariantes de Money:**

```typescript
import { fc, test } from 'fast-check'

test('Money addition is commutative', () => {
  fc.assert(
    fc.property(arbMoney(), arbMoney(), (a, b) => {
      const sum1 = a.add(b)
      const sum2 = b.add(a)
      return sum1.equals(sum2)
    })
  )
})

test('IGV total = base + tax', () => {
  fc.assert(
    fc.property(arbPositiveMoney(), (base) => {
      const { igv, total } = calculateIGV(base)
      return total.equals(base.add(igv))
    })
  )
})
```

**Invariantes a testear:**

| Invariante                                    | Dominio                                      | Prioridad |
| --------------------------------------------- | -------------------------------------------- | --------- |
| Money: suma conmutativa                       | `packages/domain/src/value-objects/Money.ts` | CRÍTICA   |
| Money: resta inversa de suma                  | Money                                        | CRÍTICA   |
| IGV: total = base + igv                       | `packages/domain/src/fiscal/`                | CRÍTICA   |
| IGV: igv >= 0 para base >= 0                  | fiscal                                       | CRÍTICA   |
| RUC: checksum válido para 10^10 combinaciones | RUC.ts                                       | ALTA      |
| RUC: dígito verificador consistente           | RUC.ts                                       | ALTA      |
| Detracción: porcentaje en [0,1]               | detraccion.ts                                | ALTA      |
| AccountingPeriod: status lifecycle válido     | accounting-period.ts                         | MEDIA     |
| ExchangeRate: multiplicación inversa          | exchange-rate.ts                             | MEDIA     |
| DocumentSeries: formato consistente           | DocumentSeries.ts                            | MEDIA     |

**Arbitraries personalizados:**

```typescript
const arbMoney = (): fc.Arbitrary<Money> =>
  fc
    .tuple(
      fc.integer({ min: -1_000_000_00, max: 1_000_000_00 }), // cents
      fc.constantFrom('PEN', 'USD')
    )
    .map(([cents, currency]) => Money.fromCents(cents, currency))
```

### PR2: CI Integration + Seed-Based Regression

- Ejecutar property tests en CI (no en local — son lentos)
- Usar `fc.sample()` para generar casos de borde como unit tests concretos
- Cuando un property test encuentra un bug: guardar el seed como regression test
- Métrica: **cobertura de invariantes > 90% en dominio fiscal**

```bash
bun run test:property  # Ejecuta SOLO property tests (separado de unit)
bun run test  # Ejecuta unit + integration (rápido, sin property)
```

## Criterios de Aceptación

- [ ] 10+ invariantes fiscales cubiertas con property tests
- [ ] Money, IGV, RUC, Detracción, AccountingPeriod — todos cubiertos
- [ ] Property tests corren en CI (no en local developer flow)
- [ ] Seeds de falla guardados como regression tests
- [ ] README con "cómo agregar un property test"

## Riesgos

- **Alto**: Property tests son 10-100x más lentos que unit tests → solo en CI
- **Medio**: `fast-check` puede encontrar falsos positivos si los arbitraries no son representativos
- **Bajo**: Developers no familiarizados con PBT pueden ignorar fallas

## Review Workload Forecast

| PR                   | Líneas | Review time | Reviewer         |
| -------------------- | ------ | ----------- | ---------------- |
| PR1: Test suite      | ~400   | 30 min      | Domain + testing |
| PR2: CI + regression | ~200   | 15 min      | DevOps + domain  |
