# Fiscal Seams — Technical Design

> Peru-first, architectured for LATAM scalability.
> Each seam introduces an abstraction without moving everything to `country-packs/` today.

---

## Seam 1 — `TaxIdentifier`

### Hoy

```typescript
// RUC.ts — concreto, módulo-11 peruano
class RUC {
  constructor(value: string) {
    /* validate módulo-11 */
  }
}

// Organization.ts
class Organization {
  ruc: string
} // raw string, no abstraction
```

### Target

```typescript
// domain/src/types/tax-identifier.ts
interface TaxIdentifier {
  readonly value: string
  readonly countryCode: CountryCode
  readonly type: TaxIdentifierType
  validate(): boolean
  format(): string
}

type TaxIdentifierType = 'RUC' | 'DNI' | 'CUIT' | 'RUT' | 'RFC' | 'NIT'
type CountryCode = 'PE' | 'AR' | 'CL' | 'MX' | 'CO'

// RUC implementa TaxIdentifier
class RUC implements TaxIdentifier {
  /* módulo-11 intacto */
}

// Organization cambia
class Organization {
  taxIdentifiers: TaxIdentifier[] // antes: ruc: string
}

// Factory
function createTaxIdentifier(value: string, country: CountryCode): TaxIdentifier
```

### Impacto

| Archivos                                       | Cambio                                        |
| ---------------------------------------------- | --------------------------------------------- |
| `packages/domain/src/value-objects/RUC.ts`     | Implementar `TaxIdentifier`                   |
| `packages/domain/src/value-objects/DNI.ts`     | Implementar `TaxIdentifier`                   |
| `packages/domain/src/entities/Organization.ts` | `ruc` → `taxIdentifiers[]`                    |
| `packages/domain/src/entities/Invoice.ts`      | `clientRUC` → `buyerTaxId: TaxIdentifier`     |
| ~40 archivos que referencian `RUC`             | `new RUC(x)` → `createTaxIdentifier(x, 'PE')` |

> **Riesgo:** Bajo. Cambio mecánico, RUC sigue siendo RUC para Perú.

---

## Seam 2 — `CountryPack`

### Hoy

```typescript
interface CountryPackBoundary {
  countryCode: 'PE' // literal
  taxAuthority: 'SUNAT' // literal
  electronicDocumentName: 'CPE'
  registryFeedName: 'SIRE'
  defaultCurrency: 'PEN'
}

const SUPPORTED_COUNTRY_CODES = ['PE'] as const
```

### Target

```typescript
// domain/src/country-pack/types.ts
interface CountryPack {
  readonly code: CountryCode
  readonly name: string // "Perú"
  readonly taxAuthorityName: string // "SUNAT"
  readonly defaultCurrency: CurrencyCode
  readonly locale: string // "es-PE"
  readonly timezone: string // "America/Lima"
  readonly taxIdentifierTypes: TaxIdentifierType[]
  readonly fiscalDocumentTypes: FiscalDocumentType[]
  readonly taxRegime: TaxRegimeConfig
}

// domain/src/country-pack/peru.ts
const peruCountryPack: CountryPack = {
  code: 'PE',
  taxAuthorityName: 'SUNAT',
  defaultCurrency: 'PEN',
  fiscalDocumentTypes: [
    { id: 'FACTURA', seriesPrefix: 'F' },
    { id: 'BOLETA', seriesPrefix: 'B' },
    { id: 'NOTA_CREDITO', seriesPrefix: 'FC|BC' },
    // ...
  ],
  taxRegime: {
    defaultRate: 0.18,
    rounding: 2,
    hasWithholding: true,
    hasPerception: true,
  },
}

// domain/src/country-pack/registry.ts
function getCountryPack(code: CountryCode): CountryPack
function registerCountryPack(pack: CountryPack): void
```

### Impacto

| Archivos                                | Cambio                                             |
| --------------------------------------- | -------------------------------------------------- |
| `fiscal-ontology/types.ts`              | Reemplazar `CountryPackBoundary` por `CountryPack` |
| ~50 archivos con `countryCode: 'PE'`    | Usar `getCountryPack('PE').code`                   |
| Todos los tests con `countryCode: 'PE'` | Cambio mínimo                                      |

> **Riesgo:** Medio-bajo. Nuevo archivo + migración de referencias.

---

## Seam 3 — `TaxAuthority` adapter

### Hoy

```typescript
// Invoice tiene SUNAT lifecycle hardcodeado
type SunatStatus = 'SENT' | 'ACCEPTED' | 'REJECTED' | 'OBSERVED' | 'CANCELLED';

// Infraestructura llama a SUNAT directo
class SunatCpeClient { ... }
class OseProvider { ... }
```

### Target

```typescript
// domain/src/ports/tax-authority.port.ts
interface TaxAuthorityPort {
  readonly countryCode: CountryCode

  submit(document: FiscalDocument): Promise<SubmissionResult>
  queryStatus(taxId: TaxIdentifier, ref: string): Promise<FiscalStatus>
  cancel(
    taxId: TaxIdentifier,
    ref: string,
    reason: string
  ): Promise<CancelResult>
  downloadResponse(taxId: TaxIdentifier, ref: string): Promise<FiscalResponse>
}

// domain/value-objects/FiscalStatus (reemplaza SunatStatus)
type FiscalStatus =
  'PENDING' | 'ACCEPTED' | 'REJECTED' | 'OBSERVED' | 'CANCELLED'

// infrastructure/tax-authority/sunat.authority.ts
class SunatTaxAuthority implements TaxAuthorityPort {
  readonly countryCode = 'PE'
  // OSE + CDR + UBL viven ACÁ, no en el dominio
}

// infrastructure/tax-authority/sunat-ose.provider.ts
// El OSE deja de ser un concepto de dominio, es un detalle de infra
```

### Impacto

| Archivos                                              | Cambio                                                            |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| `packages/persistence/src/schema/invoicing.schema.ts` | `sunat_status` → `fiscal_status`                                  |
| `packages/domain/src/entities/Invoice.ts`             | `sunatStatus` → `fiscalStatus`, `sunatTicket` → `fiscalReference` |
| `packages/application/src/use-cases/invoice/*`        | Usar `TaxAuthorityPort` en vez de directo                         |
| `packages/infrastructure/src/ose/`                    | Pasar a ser impl de `TaxAuthorityPort`                            |
| `packages/infrastructure/src/sunat/`                  | Pasar a ser impl de `TaxAuthorityPort`                            |

> **Riesgo:** Alto. Es el cambio más grande porque toca invoice, que es una de las entidades más referenciadas.

---

## Seam 4 — Invoice cleanup (entidad genérica)

### Hoy

```typescript
class Invoice {
  clientRUC: RUC
  igvAmount: Money
  sunatStatus: SunatStatus
  sunatTicket?: string
  cdrData?: CDRData
  documentType: 'FACTURA' | 'BOLETA' // literal
  series: DocumentSeries // peruano
}
```

### Target

```typescript
class Invoice {
  buyerTaxId: TaxIdentifier // antes: clientRUC
  taxAmount: Money // antes: igvAmount
  fiscalStatus: FiscalStatus // antes: sunatStatus
  fiscalReference?: FiscalReference // antes: sunatTicket + cdrData
  documentType: string // antes: literal
  series: string // antes: DocumentSeries peruano
}
```

> Nota: `FiscalDocumentType` se valida contra el `CountryPack` activo, no contra literals.

### Impacto

- El Invoice DTO en la API cambia — frontend también.
- `InvoiceMapper` adapta entre DB genérica y dominio.
- Los campos `sunat_*` en DB se renombran a `fiscal_*` (migración).

> **Riesgo:** Alto. Cambia contrato público de la entidad más usada.

---

## Seam 5 — `TaxRegime` (TaxCalculator configurable)

### Hoy

```typescript
// domain/services/TaxCalculator.ts
class TaxCalculator {
  calculateIGV(amount: Money): Money {
    return amount.multiply(0.18)
  }
  calculateDetraccion(amount: Money): Money {
    /* SPOT codes */
  }
}
```

### Target

```typescript
// domain/services/tax-regime/types.ts
interface TaxRegime {
  readonly countryCode: CountryCode
  calculate(amount: Money, taxType: string): Money
  getApplicableTaxes(docType: string, amount: Money): TaxApplication[]
  getWithholdingRate(buyerType: string): number
}

// domain/services/tax-regime/peru.ts
class PeruGeneralRegime implements TaxRegime {
  readonly countryCode = 'PE'
  calculate(amount: Money, taxType: string): Money {
    switch (taxType) {
      case 'IGV':
        return amount.multiply(0.18)
      case 'DETRACCION':
        return DetraccionTable.lookup(amount)
      case 'RETENCION':
        return amount.multiply(0.03) // 3% Renta
    }
  }
}

// TaxCalculator pasa a ser facade sobre el regime activo
class TaxCalculator {
  constructor(private regime: TaxRegime) {}
  calculate(amount: Money, type: string) {
    return this.regime.calculate(amount, type)
  }
}
```

### Impacto

| Archivos                                           | Cambio                                   |
| -------------------------------------------------- | ---------------------------------------- |
| `domain/services/TaxCalculator.ts`                 | Refactor completo                        |
| `domain/services/tax-calculator/igv-calculator.ts` | Fusionar en `PeruGeneralRegime`          |
| ~30 archivos que llaman `calculateIGV`             | `taxCalculator.calculate(amount, 'IGV')` |

> **Riesgo:** Medio. Muchos call sites pero cambio mecánico.

---

## Matriz de priorización

| Seam                 | Esfuerzo | Riesgo | Impacto escalabilidad    | Dependencia |
| -------------------- | -------- | ------ | ------------------------ | ----------- |
| 1. `TaxIdentifier`   | 2 días   | Bajo   | Alto (define el patrón)  | Ninguna     |
| 2. `CountryPack`     | 1 día    | Bajo   | Alto (config, no código) | Ninguna     |
| 5. `TaxRegime`       | 3 días   | Medio  | Medio                    | Ninguna     |
| 3. `TaxAuthority`    | 5 días   | Alto   | Alto                     | 1, 2        |
| 4. `Invoice cleanup` | 4 días   | Alto   | Alto                     | 1, 2, 3     |

### Orden recomendado

```
Fase 1 (Perú sin deuda):   TaxIdentifier → CountryPack → TaxRegime
Fase 2 (Preparar invoice):  TaxAuthority (nueva interfaz, SIN migrar DB aún)
Fase 3 (Migrar entidad):    Invoice cleanup + DB migration
```
