# Comprobantes Electrónicos — CPE

**Última actualización:** 2026-07-29
**Base legal:** R.S. 200-2014/SUNAT y modificatorias
**Acceso:** [cpe.sunat.gob.pe](https://cpe.sunat.gob.pe/)

---

## Qué son

Los Comprobantes de Pago Electrónicos (CPE) son documentos tributarios emitidos electrónicamente con efectos fiscales. Desde 2014, SUNAT promueve su adopción obligatoria progresiva. Hoy son el estándar para la mayoría de operaciones en Perú.

---

## Tipos de CPE

| Tipo | Código | Descripción |
|---|---|---|
| **Factura electrónica** | 01 | Para operaciones con IGV. Acredita crédito fiscal al adquiriente. |
| **Boleta de venta electrónica** | 03 | Para consumidores finales. No acredita crédito fiscal. |
| **Nota de crédito electrónica** | 07 | Anula o reduce una factura o boleta. |
| **Nota de débito electrónica** | 08 | Incrementa el monto de una factura o boleta. |
| **Recibo por honorarios electrónico** | — | Para servicios profesionales. |
| **Comprobante de retención electrónico** | 20 | Retención del IGV a proveedores no domiciliados o sujetos a retención. |
| **Comprobante de percepción electrónico** | 40 | Percepción del IGV en operaciones específicas. |
| **Guía de remisión electrónica** | — | Sustenta traslado de bienes. |

---

## SEE — Sistema de Emisión Electrónica

### SEE – SUNAT (gratuito)

Portal web de SUNAT donde el contribuyente emite CPE sin necesidad de software propio.

- Límite: S/ 10,000 por comprobante
- Ideal para pequeños contribuyentes

### SEE – SOL (gratuito)

Emisión desde SOL para operaciones simples.

- Integrado con SOL
- Sin límite de monto
- Para contribuyentes con pocas operaciones

### SEE – Contribuyente (propio)

El contribuyente implementa su propio sistema de emisión y se conecta con SUNAT vía API.

- Sin límite de monto
- Integración directa con sistemas contables
- Envío y recepción automatizados

### SEE – OSE

Operador de Servicios Electrónicos autorizado por SUNAT.

- Terceriza la emisión y envío
- Para contribuyentes que no quieren implementar su propio SEE
- OSE autorizados: empresas certificadas por SUNAT

---

## Plazos de envío

| Tipo de comprobante | Plazo máximo |
|---|---|
| Factura electrónica | 72 horas desde la emisión |
| Boleta de venta | 7 días calendario |
| Nota de crédito | 72 horas desde la emisión |
| Nota de débito | 72 horas desde la emisión |
| Retención electrónica | 5 días hábiles |
| Percepción electrónica | 5 días hábiles |

---

## Estructura del CPE

```xml
<Invoice>
  <UBLVersionID>2.1</UBLVersionID>
  <ID>F001-00012345</ID>           <!-- Serie y correlativo -->
  <IssueDate>2026-06-15</IssueDate>
  <InvoiceTypeCode>01</InvoiceTypeCode>  <!-- Tipo: factura -->
  <AccountingSupplierParty>
    <Party>
      <PartyLegalEntity>
        <RegistrationName>Facturación Total S.A.C.</RegistrationName>
      </PartyLegalEntity>
    </Party>
    <CustomerAssignedAccountID>20123456789</CustomerAssignedAccountID>
  </AccountingSupplierParty>
  <LegalMonetaryTotal>
    <PayableAmount>11800.00</PayableAmount>
  </LegalMonetaryTotal>
  <TaxTotal>
    <TaxAmount>1800.00</TaxAmount>     <!-- IGV 18% -->
    <TaxSubtotal>
      <TaxAmount>1550.00</TaxAmount>   <!-- IGV puro 15.5% -->
      <TaxCategory>
        <ID>S</ID>                      <!-- Gravado -->
        <Percent>15.5</Percent>
      </TaxCategory>
    </TaxSubtotal>
    <TaxSubtotal>
      <TaxAmount>250.00</TaxAmount>    <!-- IPM 2.5% -->
      <TaxCategory>
        <ID>S</ID>
        <Percent>2.5</Percent>
      </TaxCategory>
    </TaxSubtotal>
  </TaxTotal>
</Invoice>
```

### Elementos clave del UBL 2.1

| Campo | Descripción |
|---|---|
| `UBLVersionID` | Versión del estándar UBL (2.1) |
| `ID` | Serie + correlativo (F001-00012345) |
| `InvoiceTypeCode` | 01=factura, 03=boleta, 07=NC, 08=ND |
| `RegistrationName` | Razón social del emisor |
| `CustomerAssignedAccountID` | RUC del adquiriente |
| `TaxAmount` | Total IGV + IPM |
| `PayableAmount` | Total del comprobante |

---

## Validaciones SUNAT

SUNAT aplica las siguientes validaciones al recibir un CPE:

1. **RUC del emisor activo** — el emisor debe tener RUC activo
2. **RUC del adquiriente activo** — si es factura, el adquiriente debe tener RUC activo
3. **Serie válida** — la serie debe corresponder al tipo de comprobante y al punto de emisión
4. **Correlativo único** — no debe existir otro CPE con la misma serie y número
5. **Monto correcto** — la suma de impuestos debe coincidir con el total
6. **Formato UBL 2.1** — el XML debe ser válido contra el XSD

---

## CPE en Drenyra

```typescript
interface CpeDocument {
  id: string                    // F001-00012345
  type: CpeType.Factura | CpeType.Boleta | CpeType.NotaCredito | CpeType.NotaDebito
  supplier: {
    ruc: string
    name: string
  }
  customer?: {
    ruc: string
    name: string
  }
  issueDate: string
  currency: string              // PEN
  totals: {
    taxable: number
    igv: number
    ipm: number
    total: number
  }
  lines: Array<CpeLine>
  ublXml: string                // XML original UBL 2.1
  cdrStatus: CdrStatus
}
```

### Parseo y validación

```typescript
// Ingestion
const parsed = parseCpe(xmlContent)
// parsed: CpeDocument validado contra schema UBL 2.1

// Validación fiscal
const validation = validateCpe(cpe)
validation.igvRateMatches      // true (18%)
validation.rucIsActive         // true
validation.seriesIsValid       // true
validation.correlativeUnique   // true
```

---

## Do / Don't

### Hacer

- Validar cada CPE contra el XSD de SUNAT antes de aceptarlo.
- Verificar RUC del emisor y adquiriente en cada operación.
- Conservar el XML original como evidencia.
- Registrar el CDR de cada CPE para la trazabilidad.

### No hacer

- No aceptar un CPE sin verificar su CDR (aceptado por SUNAT).
- No modificar el XML original después de emitido.
- No emitir boletas cuando el cliente requiere factura con IGV separado.
- No asumir que un CPE es válido porque el XML es sintácticamente correcto — validar contra SUNAT.

---

## Referencias

- [SUNAT CPE — Tipos de comprobantes](https://cpe.sunat.gob.pe/tipos_de_comprobantes/factura)
- [SUNAT SEE — Sistemas de emisión](https://cpe.sunat.gob.pe/sistema_emision/see_contribuyente)
- [SUNAT CPE — Portal](https://cpe.sunat.gob.pe/)
- [UBL 2.1 — Estándar](https://www.sunat.gob.pe/legislacion/comprobantes/)
