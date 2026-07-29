# Perú — Fiscal Domain

**Última actualización:** 2026-07-29
**FEOS Plano:** [09 — Country Plane](../09-country-plane/README.md)
**Country Pack:** `country-packs/peru/`

---

El sistema tributario peruano es el punto de partida de Drenyra. Perú tiene la infraestructura de facturación electrónica más madura de Latinoamérica (CPE desde 2014, SIRE desde 2023, PLE desde 2010) y una complejidad fiscal que exige automatización determinista, no aproximaciones.

Este directorio documenta las reglas fiscales peruanas que Drenyra modela, valida y ejecuta. Cada documento cubre una obligación o concepto, su base legal, cómo funciona y cómo Drenyra lo implementa.

---

## Regímenes tributarios

| Régimen | Siglas | IGV | Renta | Límite ingresos |
|---|---|---|---|---|
| Nuevo Régimen Único Simplificado | NRUS | Exonerado | Cuota fija | S/ 96,000 anual |
| Régimen Especial de Renta | RER | 18% | 1.5% ingresos netos | S/ 525,000 anual |
| MYPE Tributario | MYPE | 18% | Escala progresiva | 1,700 UIT |
| Régimen General | REG | 18% | 29.5% | Sin límite |

**UIT 2026:** S/ 5,350

---

## Obligaciones principales

| Obligación | Frecuencia | Base legal actualizada |
|---|---|---|
| IGV — Declaración mensual | Mensual | TUO D.S. 055-99-EF, Ley 32387 (IPM gradual) |
| Renta — Pagos a cuenta | Mensual | Ley del Impuesto a la Renta |
| Renta — Declaración anual | Anual | Ley del Impuesto a la Renta |
| SIRE — RCE y RVIE | Mensual | R.S. 112-2021/SUNAT, modificatorias hasta 2026 |
| PLE — Libros electrónicos | Mensual | R.S. 286-2009/SUNAT y modificatorias |
| Detracciones — Depósito | Operación | D. Leg. 940, D. Leg. 1713 (2025) |
| CPE — Envío SUNAT | 72h / 7 días | R.S. 200-2014/SUNAT y modificatorias |

---

## Documentos

| Documento | Qué cubre |
|---|---|
| [SUNAT Basics](./sunat-basics.md) | RUC, SOL, clave SOL, regímenes, OSE, cronogramas |
| [IGV](./igv.md) | Tasa 18% (composición 2026–2029), crédito fiscal, saldo a favor, operaciones gravadas/exoneradas/inafectas |
| [Detracciones](./detracciones.md) | Sistema de detracciones, ratios, bienes/servicios sujetos, Decreto Legislativo 1713 |
| [Comprobantes Electrónicos](./comprobantes.md) | CPE: factura, boleta, NC, ND, retención, percepción — formatos, plazos, SEE |
| [CDR](./cdr.md) | CDR: estados (aceptado, rechazado, baja), códigos, flujo, plazos de comunicación |
| [SIRE](./sire.md) | SIRE: RVIE, RCE, cronograma de obligatoriedad, reemplazo, unknown, facultad discrecional 2026 |
| [PLE](./ple.md) | Programa de Libros Electrónicos: formatos 3.1–14.1, plazos, cierre, migración a SIRE |
| [Renta](./renta.md) | Impuesto a la Renta: categorías, pagos a cuenta, tasa 29.5%, declaración anual |

---

## Referencias legales

| Norma | Descripción |
|---|---|
| D.S. 055-99-EF | TUO Ley del IGV |
| D.S. 29-94-EF | Reglamento de la Ley del IGV |
| R.S. 200-2014/SUNAT | Sistema de Emisión Electrónica (SEE) |
| R.S. 112-2021/SUNAT | Creación del SIRE |
| R.S. 286-2009/SUNAT | Creación del PLE |
| D. Leg. 940 | Detracciones |
| D. Leg. 1713 (2025) | Modificaciones a detracciones — deuda exigible |
| Ley 32387 (2025) | Incremento gradual del IPM |
| R.S. 32-2026/SUNAT | Facultad discrecional SIRE — regularización hasta 31/08/2026 |

---

## Verificación

Drenyra incluye comandos para verificar el cumplimiento fiscal:

```bash
# Verificar configuración SUNAT
bun run compliance:sunat-check

# Validar SIRE
bun run compliance:sire-gate

# Reprocesar SIRE con datos actualizados
bun run compliance:sire-repro

# Verificar RUC
bun run compliance:ruc-validate
```
