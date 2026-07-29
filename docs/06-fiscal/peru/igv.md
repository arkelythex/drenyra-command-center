# IGV — Impuesto General a las Ventas

**Última actualización:** 2026-07-29
**Base legal:** TUO D.S. 055-99-EF, Ley 32387 (2025)
**IGV Tasa:** 18% (2026)

---

## Tasa aplicable

La tasa del IGV es **18%** sobre la operación gravada. Se compone de:

| Componente | Tasa |
|---|---|
| Impuesto General a las Ventas (IGV) | 16.0% |
| Impuesto de Promoción Municipal (IPM) | 2.0% |
| **Total** | **18.0%** |

### Evolución del IPM (Ley 32387)

La Ley 32387 establece un incremento gradual del IPM desde 2% hasta 4%, manteniendo la tasa total en 18%:

| Año | IGV | IPM | Total |
|---|---|---|---|
| 2025 | 16.0% | 2.0% | 18% |
| 2026 | 15.5% | 2.5% | 18% |
| 2027 | 15.0% | 3.0% | 18% |
| 2028 | 14.5% | 3.5% | 18% |
| 2029 | 14.0% | 4.0% | 18% |

**A partir de 2026**, el IPM subió a 2.5% y el IGV puro bajó a 15.5%. La tasa total pagada por el consumidor se mantiene en 18% en todo momento.

---

## Hecho gravado

Están gravadas con IGV las siguientes operaciones:

1. **Venta de bienes muebles** en el país
2. **Prestación de servicios** en el país
3. **Contratos de construcción**
4. **Primera venta de inmuebles** realizada por el constructor
5. **Importación de bienes**

### Nacimiento de la obligación

| Operación | Momento (el que ocurra primero) |
|---|---|
| Venta de bienes | Emisión del comprobante o entrega del bien |
| Retiro de bienes | Emisión del comprobante o retiro |
| Prestación de servicios | Emisión del comprobante o percepción de la retribución |
| Utilización de servicios (no domiciliados) | Anotación en Registro de Compras o pago |
| Contratos de construcción | Emisión del comprobante o percepción del ingreso |
| Primera venta de inmuebles | Percepción del ingreso (parcial o total) |
| Importación | Solicitud de despacho a consumo |

---

## Crédito fiscal

El crédito fiscal es el IGV consignado por separado en los comprobantes de pago que respaldan adquisiciones gravadas.

### Requisitos

1. Sean **permitidos como gasto o costo** de la empresa
2. Se **destinen a operaciones gravadas** con IGV
3. El IGV esté **consignado por separado** en el comprobante
4. El comprobante consigne **nombre y RUC del emisor** — el RUC debe estar **Activo y Habido**
5. El comprobante esté **anotado en el Registro de Compras** (legalizado antes de su uso)

### Cálculo

```
IGV a pagar = IGV de ventas - IGV de compras

Ejemplo:
  Ventas del mes:   S/ 10,000 → IGV:  10,000 × 18% = S/ 1,800
  Compras del mes:  S/  6,000 → IGV:   6,000 × 18% = S/ 1,080
  IGV por pagar:                             S/   720
```

### Saldo a favor

Cuando el crédito fiscal excede el impuesto bruto, el exceso constituye **saldo a favor** y se aplica como crédito fiscal en meses siguientes hasta agotarlo.

| Mes | Impuesto Bruto | Crédito Fiscal | Saldo Aplicado | A Pagar |
|---|---|---|---|---|
| Diciembre | 800 | 1,000 | — | (200) saldo |
| Enero | 400 | 400 | (200) | (200) saldo |
| Febrero | 500 | 100 | (200) | 200 |

---

## Operaciones exoneradas e inafectas

| Tipo | Característica | Ejemplos |
|---|---|---|
| **Exoneradas** | Excluidas del pago por período legal | Educación, salud, alquiler de viviendas |
| **Inafectas** | Fuera del ámbito del impuesto | Exportaciones, operaciones financieras específicas |

Ver [relación completa en SUNAT](https://orientacion.sunat.gob.pe/3054-02-operaciones-exoneradas-o-inafectas-y-renuncia-a-la-exoneracion).

---

## Declaración y pago

La declaración del IGV es mensual, según el cronograma de vencimientos basado en el último dígito del RUC.

| Dígito RUC | Fecha de vencimiento |
|---|---|
| 0 | 10 del mes siguiente |
| ... | ... |
| 9 | 19 del mes siguiente |
| Otros | 20 del mes siguiente |

Buenos Contribuyentes tienen 5 días hábiles adicionales.

---

## IGV en Drenyra

```typescript
// Cálculo determinista
const result = calculateIgv({
  amount: 10000,
  rate: IgvRate.Standard,        // 18%
  composition: IgvComposition2026 // igv: 15.5%, ipm: 2.5%
})

result.amount.igv   // S/ 1,550
result.amount.ipm   // S/ 250
result.amount.total // S/ 1,800

// Crédito fiscal
const credit = calculateIgvCredit({
  invoices: purchaseInvoices,   // Comprobantes de compras
  taxRegime: 'general',
  period: '2026-06'
})
```

---

## Do / Don't

### Hacer

- Usar la tasa de 18% compuesta (IGV 15.5% + IPM 2.5%) para 2026.
- Verificar que el RUC del emisor esté Activo y Habido antes de usar crédito fiscal.
- Aplicar el saldo a favor automáticamente en meses siguientes hasta agotarlo.

### No hacer

- No usar 18% IGV directo — la composición cambia cada año hasta 2029.
- No asumir que una operación exonerada hoy lo seguirá siendo mañana.
- No aceptar crédito fiscal de comprobantes sin IGV separado o con RUC no habido.

---

## Referencias

- [TUO Ley del IGV — D.S. 055-99-EF](https://www.sunat.gob.pe/legislacion/igv/tuo.html)
- [Reglamento de la Ley del IGV — D.S. 29-94-EF](https://www.sunat.gob.pe/legislacion/igv/reglamento.html)
- [Ley 32387 — IPM gradual](https://www.gob.pe/7910-impuesto-general-a-las-ventas-igv)
- [SUNAT — Cálculo del IGV](https://orientacion.sunat.gob.pe/3109-05-calculo-del-impuesto)
