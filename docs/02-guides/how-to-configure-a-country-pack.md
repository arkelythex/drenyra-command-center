# How to Configure a Country Pack

**Last updated:** 2026-07-29
**Prerequisites:** Understanding of fiscal rules for the target country, Drenyra contributor access
**FEOS Planes:** [Country](../09-country-plane/README.md) · [Financial](../07-financial-plane/README.md) · [Integration](../08-integration-plane/README.md)

---

A Country Pack encapsulates the legal and operational differences of a jurisdiction without duplicating the core product. It declares what authority applies, what documents exist, how taxes are calculated, what fiscal calendar governs, what declarations must be filed, and what connectors to enable.

Drenyra starts with Peru and expands in this sequence: **Peru → Colombia → Chile → Ecuador → México → Brasil**.

---

## What a Country Pack contains

```text
country-packs/{country}/
├── README.md              → Overview and status
├── manifest.yaml          → Metadata: codes, currencies, timezone
├── rules/                 → Tax rules, rate tables, exemptions
│   ├── igv.yaml
│   ├── detracciones.yaml
│   ├── renta.yaml
│   └── ...
├── calendar/              → Fiscal calendar (deadlines, periods)
│   ├── annual.yaml
│   └── monthly.yaml
├── declarations/          → Declarations and forms
│   ├── sire.yaml
│   ├── ple.yaml
│   └── ...
├── documents/             → Document types and schemas
│   ├── invoices.yaml
│   ├── credit-notes.yaml
│   └── ...
├── connectors/            → External integrations
│   ├── sunat.yaml
│   └── ...
└── localization/          → Labels, terminology, currency formatting
    ├── labels.json
    └── format.yaml
```

---

## Step 1: Create the Pack Structure

Start from the Peru pack as a reference:

```bash
cp -r country-packs/peru country-packs/{country}
```

Edit `manifest.yaml`:

```yaml
# country-packs/{country}/manifest.yaml
country:
  code: CO # ISO 3166-1 alpha-2
  name: Colombia
  currency: COP
  locale: es-CO
  timezone: America/Bogota

authority:
  name: DIAN
  url: https://www.dian.gov.co

status: draft # draft | active | deprecated
maintainer: # Who owns this pack
  name: Your Name
  email: your@email.com
```

---

## Step 2: Define Tax Rules

Tax rules are deterministic functions expressed as YAML. The format separates the **rule definition** from the **computation logic** (which lives in the country runtime).

```yaml
# country-packs/{country}/rules/iva.yaml
rule: iva
name: Impuesto al Valor Agregado
type: consumption-tax

rates:
  standard: 0.19 # 19%
  reduced: [] # No reduced rate in CO baseline
  exempt:
    - 'Basic food basket items'
    - 'Medical services'
    - 'Education'

computation:
  base: taxable-amount
  rounding: round-half-up
  precision: 2

exemptions:
  - category: 'Exportaciones'
    condition: 'destination outside Colombia'
  - category: 'Servicios financieros'
    condition: 'explicitly exempted by DIAN'
```

Map the rule to the tax engine via `manifest.yaml`:

```yaml
# In manifest.yaml
rules:
  iva: rules/iva.yaml
  withholding: rules/withholding.yaml
```

---

## Step 3: Define the Fiscal Calendar

```yaml
# country-packs/{country}/calendar/monthly.yaml
calendar:
  - obligation: iva
    frequency: monthly
    deadline:
      rule: 'business-day-after'
      day: 15
      month_offset: 1 # Next month
    period: monthly

  - obligation: income-tax
    frequency: annual
    deadline:
      rule: 'fixed-day'
      day: 30
      month: 4 # April 30
    period: annual
```

---

## Step 4: Define Document Types

```yaml
# country-packs/{country}/documents/invoices.yaml
document_type: invoice
name: Factura Electrónica
authority: DIAN

schema:
  required_fields:
    - authority_id # DIAN invoice UUID
    - issuer_nit # NIT (Colombia's tax ID)
    - receiver_nit
    - issue_date
    - total_amount
    - iva_amount
    - withholdings

  optional_fields:
    - notes
    - payment_terms

validation:
  - rule: 'nit must be valid DIAN format'
  - rule: 'iva_rate must be one of [0.19, 0.0]'
  - rule: 'total_amount = sum(lines) + iva_amount - withholdings'
```

---

## Step 5: Configure Connectors

```yaml
# country-packs/{country}/connectors/dian.yaml
connector:
  authority: DIAN
  protocol: rest
  base_url: https://api.dian.gov.co/v1

  auth:
    type: client-certificate
    environment: production # Or testing

  operations:
    send_invoice:
      method: POST
      path: /documents/invoice
      validation: required
    query_status:
      method: GET
      path: /documents/{id}/status
```

---

## Step 6: Register the Pack

Once the pack is defined, register it in the Country Plane:

```typescript
import { registerCountryPack } from '@drenyra/country-packs'

await registerCountryPack({
  code: 'CO',
  manifest: manifestYaml,
  rules: { iva, withholding },
  calendar: monthlyCalendar,
  documents: { invoice, creditNote },
  connectors: { dian },
})
```

The system validates:

- All required fields are present
- Rule references resolve to actual files
- Calendar entries have valid frequency and deadline rules
- Document types have required validation rules
- Connectors have at least one operation

---

## Do / Don't

### Do

- Start from the Peru pack — it has the most complete reference.
- Test each rule with known inputs and expected outputs before registering.
- Document country-specific edge cases in the pack's README.
- Keep the pack self-contained — it should not depend on another country's files.

### Don't

- Don't modify the core domain to accommodate a country-specific quirk — use the pack instead.
- Don't add a country pack without at least one tax rule and one document type.
- Don't skip validation rules — they are what make the pack deterministic.
- Don't hardcode credentials or secrets in the pack — use the connector's auth configuration.

---

## Testing a Country Pack

```bash
# Run country pack tests
bun run test --filter=@drenyra/country-packs

# Test a specific rule
bun run test --filter=@drenyra/country-packs -- -t "IVA calculation"

# Validate the pack structure
bun run country-packs:validate --country=CO
```

---

## Next steps

- [Country Plane](../09-country-plane/README.md) — understand the country pack runtime
- [Add a Fiscal Obligation](./how-to-add-a-fiscal-obligation.md) — model a specific declaration within a pack
- [Connector Conformance Framework](../01-foundation/feos-program.md#sdd-feos-015) — FEOS-015 specification
