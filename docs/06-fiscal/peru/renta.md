# Renta — Impuesto a la Renta

**Última actualización:** 2026-07-29
**Base legal:** TUO Ley del Impuesto a la Renta (D.S. 179-2004-EF), modificatorias

---

## Qué es

El Impuesto a la Renta grava las ganancias obtenidas por personas naturales, sociedades y otras entidades domiciliadas en Perú. Se aplica sobre la renta neta (ingresos menos gastos deducibles) según la categoría correspondiente.

---

## Categorías

| Categoría | Sujeto | Actividad |
|---|---|---|
| **Primera** | Personas naturales | Ingresos por alquiler de inmuebles |
| **Segunda** | Personas naturales | Ingresos por venta de valores, regalías, intereses |
| **Tercera** | Personas jurídicas y naturales con negocio | Rentas empresariales (comercio, industria, servicios) |
| **Cuarta** | Personas naturales | Ingresos independientes (recibo por honorarios) |
| **Quinta** | Personas naturales | Ingresos por trabajo dependiente (planilla) |

---

## Tercera categoría — Tasa

| Concepto | Tasa 2026 |
|---|---|
| **Tasa general** | 29.5% sobre la renta neta imponible |
| MYPE Tributario (hasta 15 UIT) | 10% |
| MYPE Tributario (exceso de 15 UIT) | 29.5% |

### Pagos a cuenta mensuales

Los contribuyentes de tercera categoría realizan pagos a cuenta mensuales:

| Régimen | Cálculo |
|---|---|
| **General** | 1.5% sobre ingresos netos mensuales (o coeficiente si hay utilidad) |
| **RER** | 1.5% sobre ingresos netos mensuales |
| **MYPE Tributario** | 1.0% sobre ingresos netos mensuales |

Al cierre del ejercicio, el impuesto anual se determina y se compara con los pagos a cuenta realizados. La diferencia se paga o se devuelve.

---

## Cuarta categoría — Recibo por Honorarios

| Concepto | Detalle |
|---|---|
| Tasa de retención | 8% sobre el monto bruto |
| Límite de retención | S/ 1,794 por recibo |
| Tope anual sin retención | 7 UIT (S/ 37,450 en 2026) |
| Declaración | Mensual vía SOL |

---

## Quinta categoría — Planilla

| Concepto | Detalle |
|---|---|
| Tasa | Escala progresiva acumulativa |
| Deducción anual | 7 UIT (S/ 37,450 en 2026) |
| Cálculo | (Ingresos anuales - 7 UIT) × tasa progresiva |
| Retención | Efectuada por el empleador |

---

## Declaración anual

**Fecha límite:** Los últimos días de marzo del año siguiente (cronograma según último dígito del RUC).

### Formularios

| Formulario | Contenido |
|---|---|
| **709** | Renta anual — personas naturales |
| **710** | Renta anual — personas jurídicas |
| **706** | Renta anual — MYPE |

### Información requerida

- Estados financieros auditados (según ingresos)
- Conciliación contable-tributaria
- Detalle de gastos deducibles y no deducibles
- Pagos a cuenta realizados
- Saldo a favor del IGV aplicado

---

## Renta en Drenyra

```typescript
interface RentaCalculation {
  category: RentaCategory
  period: string
  income: number              // Ingresos del período
  deductibleExpenses: number  // Gastos deducibles
  taxCredits: TaxCredit[]     // Pagos a cuenta, retenciones

  // Resultado
  netIncome: number           // Renta neta imponible
  taxRate: number             // Tasa aplicable
  annualTax: number           // Impuesto anual calculado
  paymentsMade: number        // Pagos a cuenta ya realizados
  balanceToPay: number        // Diferencia a pagar o devolver
}

// Cálculo mensual (pago a cuenta)
const payment = calculateMonthlyPayment({
  regime: TaxRegime.General,
  netIncome: 100000
  // → S/ 1,500 (1.5%)
})
```

---

## Do / Don't

### Hacer

- Calcular pagos a cuenta en cada período mensual.
- Conciliar pagos a cuenta con el impuesto anual calculado.
- Mantener registro de gastos deducibles con sustento.

### No hacer

- No omitir pagos a cuenta mensuales — generan intereses moratorios.
- No deducir gastos sin comprobante válido.
- No asumir que el mismo coeficiente aplica todo el año — recalcular con cada estado financiero.

---

## Referencias

- [TUO Ley del Impuesto a la Renta](https://www.sunat.gob.pe/legislacion/renta/tuo.html)
- [SUNAT — Renta](https://www.gob.pe/7910-impuesto-general-a-las-ventas-igv)
- [SUNAT — Renta anual](https://www.sunat.gob.pe/)
