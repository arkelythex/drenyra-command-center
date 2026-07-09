# P3: Testing Infrastructure

**Fecha:** 2026-07-07
**Autor:** el Gentleman
**PRs estimados:** 2
**Líneas estimadas:** ~600
**Depende de:** Nada

---

## Problema

Drenyra tiene tests unitarios en varios paquetes, pero carece de:

- **Coverage targets**: no hay mínimo obligatorio por paquete
- **Integration tests**: los flujos fiscales no se prueban end-to-end
- **Property-based testing**: las reglas fiscales (IGV, detracciones) no se verifican con datos aleatorios
- **Test patterns**: no hay convención de cómo escribir tests (builders, fixtures, mocks)
- **CI gate**: los tests no bloquean el merge

Para un proyecto que maneja **dinero y obligaciones tributarias**, esto es un riesgo fiscal.

## Cambios Propuestos

### PR 1: Testing Foundation + Coverage Gates (350 líneas)

**Qué:** Configurar la infraestructura de testing y establecer reglas.

**Archivos/contenido:**

- `vitest.config.ts` — cobertura por paquete, thresholds
- `.github/workflows/test.yml` — CI que corre tests y verifica cobertura
- `packages/test-utils/` — builders, fixtures, mocks compartidos (ya existe, expandir)

**Coverage targets por paquete:**

| Paquete                           | Target | Justificación                         |
| --------------------------------- | ------ | ------------------------------------- |
| `packages/domain/src/accounting/` | ≥90%   | Reglas fiscales, dinero, detracciones |
| `packages/domain/src/fiscal/`     | ≥90%   | SIRE, RUC, IGV, tasas                 |
| `packages/domain/src/entities/`   | ≥80%   | Entidades de dominio                  |
| `packages/application/`           | ≥70%   | Casos de uso (orquestación)           |
| `packages/persistence/`           | ≥60%   | Repositorios (requiere DB)            |
| `packages/infrastructure/`        | ≥50%   | Adaptadores externos                  |

**Test patterns documentados:**

- `builder.md` — cómo usar object mothers/builders para entidades fiscales
- `property-based.md` — cómo y cuándo usar fast-check para reglas fiscales
- `mock-guide.md` — cómo mockear SUNAT, servicios externos

### PR 2: Property-Based Testing para Reglas Fiscales (250 líneas)

**Qué:** Tests generativos que verifican invariantes fiscales con datos aleatorios.

**Invariantes a testear:**

1. **IGV = baseImponible * 0.18** — para cualquier monto positivo, el IGV calculado debe coincidir
2. **Detracción no puede exceder el monto de la factura** — para cualquier SPOT code y monto
3. **Balance contable: total débitos = total créditos** — para cualquier asiento válido
4. **Transiciones de estado de detracción** — solo secuencias válidas (pendiente → depositado → usado/liberado)
5. **RUC checksum** — el dígito verificador debe ser correcto para cualquier RUC generado

**Herramienta:** `fast-check` (property-based testing para TypeScript)

**Ejemplo concreto:**

```typescript
import { test } from 'vitest'
import { fc } from '@fast-check/vitest'

test.prop([
  fc.integer({ min: 1, max: 1_000_000_000 }), // base imponible en céntimos
  fc.constant(18), // IGV rate
])('IGV debe ser exactamente 18% de la base imponible', (baseCents, rate) => {
  const base = Money.fromCents(baseCents, 'PEN')
  const igv = base.multiply(rate).divide(100)
  const calculated = base.multiply(0.18)
  expect(igv.equals(calculated)).toBe(true)
})
```

## Criterios de Aceptación

1. `bun run test` pasa con coverage reporting
2. Cada paquete de dominio fiscal tiene property-based tests
3. Los thresholds de cobertura bloquean el CI si no se alcanzan
4. `builder.md` documentado y usado en al menos 5 tests existentes
5. No hay regresión de cobertura en domain/accounting/ y domain/fiscal/
