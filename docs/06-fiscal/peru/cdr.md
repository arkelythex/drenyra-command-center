# CDR — Comunicación de Recepción

**Última actualización:** 2026-07-29
**Base legal:** R.S. 200-2014/SUNAT, R.S. 097-2016/SUNAT

---

## Qué es

El **Comprobante de Recepción (CDR)** es la constancia electrónica que SUNAT emite al recibir y procesar un comprobante de pago electrónico (CPE). Es un archivo XML firmado digitalmente por SUNAT que certifica el resultado de la validación.

**Sin CDR, no hay comprobante válido.** Un CPE sin CDR no tiene efectos tributarios.

---

## Estados del CDR

| Estado | Código | Significado |
|---|---|---|
| **Aceptado** | 0 | El CPE cumple todas las validaciones. Es válido. |
| **Aceptado con observaciones** | 0 | Aceptado pero hay observaciones no bloqueantes. |
| **Rechazado** | - | El CPE no pasa una o más validaciones. Debe corregirse y reenviarse. |
| **Baja** | — | Un CPE previamente aceptado fue dado de baja (nota de crédito o débito). |

### Códigos de rechazo comunes

| Código | Descripción |
|---|---|
| 2001 | RUC del emisor no activo |
| 2002 | RUC del adquiriente no activo |
| 2003 | Serie no válida para el tipo de comprobante |
| 2004 | Correlativo ya registrado |
| 2011 | Monto total no coincide con la suma de montos |
| 2012 | IGV calculado incorrecto |
| 2013 | Fecha de emisión fuera de rango |

---

## Formato del CDR

```xml
<ApplicationResponse>
  <ID>20123456789-01-F001-00012345</ID>
  <ResponseDate>2026-06-15</ResponseDate>
  <ResponseTime>14:30:00</ResponseTime>
  <Response>
    <ResponseCode>0</ResponseCode>    <!-- 0 = aceptado -->
    <Description>La Factura N° F001-00012345 ha sido aceptada</Description>
  </Response>
  <DocumentReference>
    <ID>F001-00012345</ID>
  </DocumentReference>
  <!-- Firma digital SUNAT -->
  <Signature>
    <DigestValue>...</DigestValue>
    <SignatureValue>...</SignatureValue>
  </Signature>
</ApplicationResponse>
```

### Elementos clave

| Campo | Descripción |
|---|---|
| `ID` | Identificador del CDR: RUC-tipo-serie-número |
| `ResponseCode` | 0 = aceptado, cualquier otro = rechazado o estado pendiente |
| `Description` | Descripción del resultado |
| `DigestValue` | Hash del CPE aceptado |
| `SignatureValue` | Firma digital de SUNAT |

---

## Flujo de comunicación

```
Contribuyente                     SUNAT
     │                              │
     │  1. Enviar CPE (XML)         │
     │─────────────────────────────>│
     │                              │  2. Validar
     │                              │     - Esquema XSD
     │                              │     - RUC activo
     │                              │     - Serie/correlativo
     │                              │     - Montos
     │                              │  3. Generar CDR
     │                              │
     │  4. Recibir CDR (XML)        │
     │<─────────────────────────────│
     │                              │
     │  5. Verificar firma digital  │
     │  6. Almacenar CPE + CDR      │
```

---

## Plazos de comunicación

La SUNAT debe comunicar el CDR en los siguientes plazos:

| Sistema | Plazo |
|---|---|
| SEE – SUNAT | Inmediato (síncrono) |
| SEE – Contribuyente | Inmediato (síncrono) |
| SEE – OSE | Inmediato (síncrono) |

Si la SUNAT no responde dentro del plazo, el estado queda como `pendiente` y debe consultarse el estado del CPE posteriormente.

---

## Baja de CPE

Un CPE previamente aceptado puede ser dado de baja mediante:

1. **Nota de crédito** (tipo 07) — anula totalmente o parcialmente el CPE original
2. **Nota de débito** (tipo 08) — incrementa el monto del CPE original
3. **Comunicación de baja** — para boletas de venta, dentro de los 7 días calendario de emitida

La baja debe ser aceptada por SUNAT mediante un nuevo CDR.

---

## CDR en Drenyra

```typescript
interface CdrDocument {
  id: string                  // RUC-tipo-serie-numero
  cpeId: string               // F001-00012345
  responseCode: number        // 0 = aceptado
  description: string
  responseDate: string
  responseTime: string
  signatureDigest: string     // Hash del CPE
  signatureValue: string      // Firma SUNAT
  rawXml: string              // XML original del CDR
}

// Verificación
const isValid = verifyCdrSignature(cdr)
// → true si la firma digital de SUNAT es válida

// Almacenamiento como evidencia
const receipt = await storeCdrEvidence(cdr, {
  workspaceId: workspace.id,
  changeSetId: changeSet.id,
})
```

---

## Do / Don't

### Hacer

- Verificar la firma digital del CDR antes de aceptar un CPE como válido.
- Almacenar CPE + CDR como evidencia vinculada.
- Consultar el estado del CPE si no se recibe CDR dentro del plazo.

### No hacer

- No considerar un CPE como válido sin CDR aceptado (código 0).
- No modificar el CDR — contiene la firma de SUNAT que se invalida con cualquier cambio.
- No ignorar observaciones en CDR aceptado con observaciones — documentarlas.

---

## Referencias

- [SUNAT — CDR y comprobantes](https://cpe.sunat.gob.pe/)
- [R.S. 097-2016/SUNAT](https://www.sunat.gob.pe/legislacion/superin/2016/097-2016.pdf)
- [UBL 2.1 — ApplicationResponse](https://www.sunat.gob.pe/legislacion/comprobantes/)
