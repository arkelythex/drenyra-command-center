# Detracciones

**Última actualización:** 2026-07-29
**Base legal:** D. Leg. 940, D. Leg. 1713 (2025), R.S. 183-2024/SUNAT

---

## Qué son

Las detracciones (o SPOT — Sistema de Pago de Obligaciones Tributarias) son un mecanismo por el cual el adquiriente de un bien o servicio sujeto a detracción debe depositar un porcentaje del monto de la operación en una cuenta del Banco de la Nación. Ese monto queda congelado y solo puede usarse para pagar obligaciones tributarias.

### Objetivo

> Asegurar el pago de obligaciones tributarias en sectores de alto riesgo de incumplimiento: construcción, transporte, minería, servicios, entre otros.

---

## Operaciones sujetas

La SUNAT publica una tabla de bienes y servicios con sus porcentajes de detracción. Los principales:

### Bienes

| Bien | Porcentaje |
|---|---|
| Azúcar | 10% |
| Alcohol etílico | 10% |
| Algodón | 10% |
| Arena y piedra | 10% |
| Bienes exonerados del IGV | 1.5% |
| Minerales metálicos no auríferos | 10% |
| Oro y metales auríferos | 12% |
| **Recursos hidrobiológicos** | 10% |
| Maíz amarillo duro | 10% |
| Cemento | 10% |
| Leche | 10% |
| Madera | 10% |
| Papel y cartón | 10% |
| **Arroz** | 10% |
| **Plomo** | 15% |
| **Carbón** | 15% |
| **Hierro** | 15% |
| **Residuos y subproductos** | 15% |
| Bienes incautados | 10% |
| **Pasajes** | 10% |
| **Otros bienes** | 10% |

*Los porcentajes pueden variar según actualizaciones de SUNAT.*

### Servicios

| Servicio | Porcentaje |
|---|---|
| Intermediación laboral | 12% |
| Arrendamiento de bienes | 10% |
| Mantenimiento y reparación | 10% |
| Servicios de transporte de personas | 10% |
| Transporte de carga | 4% |
| Contratos de construcción | 5% |
| Comisión mercantil | 10% |
| Fabricación de bienes | 10% |
| Servicio de alojamiento | 10% |
| Servicios a través de entidades educativas | 12% |
| **Espectáculos públicos** | 10% |
| **Otros servicios empresariales** | 10% |

---

## Cálculo

```
Monto detraído = Total de la operación × Porcentaje de detracción

Ejemplo:
  Servicio de mantenimiento:    S/ 10,000
  Porcentaje:                   10%
  Depósito en Banco Nación:     S/  1,000
  Neto a pagar al proveedor:    S/  9,000
```

El adquiriente realiza el depósito en la **Cuenta de Detracciones** del proveedor en el Banco de la Nación, dentro del plazo establecido.

---

## Decreto Legislativo 1713 (2025)

El D. Leg. 1713 introdujo cambios significativos:

- **Deuda exigible** — las detracciones depositadas pueden aplicarse al pago de deudas tributarias exigibles, incluso antes del vencimiento de la declaración
- **Liberación automática** — los montos no aplicados después de 6 meses se liberan automáticamente
- **Nuevos supuestos** — se ampliaron los servicios sujetos a detracción

---

## Detracciones en Drenyra

```typescript
interface DetraccionRule {
  bienes: Array<{
    category: string
    code: string        // Código SUNAT del bien/servicio
    percentage: number  // Ej: 0.10 para 10%
  }>
}

// Cálculo
const detraccion = calculateDetraccion({
  amount: 10000,
  category: 'mantenimiento-reparacion',
  percentage: 0.10
  // Resultado: S/ 1,000
})

// Validación
const isSubject = isSubjectToDetraccion({
  productCode: '731011',
  amount: 10000,
  buyerRuc: '20123456789'
})
```

---

## Do / Don't

### Hacer

- Verificar si la operación está sujeta a detracción antes de emitir el comprobante.
- Depositar el monto correcto en la cuenta del proveedor dentro del plazo.
- Registrar el comprobante de depósito como evidencia.

### No hacer

- No olvidar la detracción al calcular el neto a pagar al proveedor.
- No asumir que el porcentaje es el mismo para todas las operaciones de una categoría.
- No liberar montos detraídos sin verificar el cumplimiento de plazos del D. Leg. 1713.

---

## Referencias

- [SUNAT — Detracciones (marco legal)](https://www.sunat.gob.pe/legislacion/tributaria/detracciones/index.html)
- [D. Leg. 940](https://www.sunat.gob.pe/legislacion/tributaria/detracciones/)
- [D. Leg. 1713 (2025)](https://bybconsultores.pe/detracciones/decreto-legislativo-1713-detracciones-deuda-exigible/)
- [Tabla completa de detracciones 2026](https://contabuzpro.com/blog/detracciones-sunat-2026-tabla-completa)
