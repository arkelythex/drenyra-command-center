# Test Patterns — Property-Based Testing

**Última actualización:** 2026-07-09

## ¿Qué es Property-Based Testing?

En vez de escribir casos concretos (`expect(add(2, 2)).toBe(4)`), describís invariantes que deben cumplirse para TODA entrada válida:

```typescript
test.prop([fc.integer({ min: 1, max: 1_000_000_000 })])(
  'IGV debe ser 18% de la base imponible',
  (baseCents) => {
    const base = Money.fromCents(baseCents, 'PEN')
    expect(base.multiply(0.18).equals(base.multiply(18).divide(100))).toBe(true)
  }
)
```

## Herramienta

Usamos `@fast-check/vitest` (v0.4.1+), que se integra nativamente con Vitest.

## Cuándo usar PBT

| Situación                           | PBT                                      | Test tradicional        |
| ----------------------------------- | ---------------------------------------- | ----------------------- |
| Reglas fiscales (IGV, detracciones) | ✅ Invariantes matemáticos               | ✅ Casos borde          |
| Validación de RUC/DNI               | ✅ Checksum con datos aleatorios         | ✅ Formatos conocidos   |
| Transiciones de estado              | ✅ Secuencias válidas/inválidas          | ✅ Caminos específicos  |
| Parseo de fechas fiscales           | ✅ Cualquier fecha del calendario fiscal | ✅ Fechas típicas       |
| UI components                       | ❌                                       | ✅ Snapshot/interaction |

## Patrones

### 1. Invariante matemático

```typescript
test.prop([
  fc.integer({ min: 1, max: 10_000_000_00 }), // base en céntimos
])('IGV = base * 0.18 para cualquier monto positivo', (baseCents) => {
  const base = Money.fromCents(baseCents, 'PEN')
  const igv = base.multiply(18).divide(100)
  expect(igv.equals(base.multiply(0.18))).toBe(true)
  expect(igv.amount).toBe(Math.round(baseCents * 0.18))
})
```

### 2. Transiciones de estado válidas

```typescript
const validTransitions = {
  pending: ['deposited'],
  deposited: ['used', 'released'],
  used: [],
  released: [],
}

test.prop([fc.constantFrom(['pending', 'deposited', 'used', 'released'])])(
  'solo transiciones válidas de detracción',
  (fromState) => {
    const nextStates = validTransitions[fromState]
    for (const toState of Object.keys(validTransitions)) {
      if (nextStates.includes(toState)) {
        expect(() => detraccion.transition(fromState, toState)).not.toThrow()
      } else if (fromState !== toState) {
        expect(() => detraccion.transition(fromState, toState)).toThrow()
      }
    }
  }
)
```

### 3. Checksum validation

```typescript
test.prop([fc.integer({ min: 10_000_000_000, max: 20_000_000_000 })])(
  'RUC checksum debe ser válido',
  (rucNumber) => {
    const ruc = rucNumber.toString()
    const isValid = validateRucChecksum(ruc)
    // Si pasa el formato, el checksum debe ser correcto
    if (isValid) {
      expect(verifyRucChecksum(ruc)).toBe(true)
    }
  }
)
```

## Referencias

- [fast-check documentation](https://fast-check.dev/)
- [@fast-check/vitest](https://www.npmjs.com/package/@fast-check/vitest)
