# PLE — Programa de Libros Electrónicos

**Última actualización:** 2026-07-29
**Base legal:** R.S. 286-2009/SUNAT y modificatorias
**Acceso:** [emprender.sunat.gob.pe/librosple](https://emprender.sunat.gob.pe/librosple)

---

## Qué es

El **Programa de Libros Electrónicos (PLE)** es el sistema anterior a SIRE para llevar los registros contables y tributarios de forma electrónica. Fue creado en 2009 y ha sido el estándar para la mayoría de contribuyentes hasta la migración progresiva a SIRE.

A julio 2026, el PLE sigue activo para contribuyentes que aún no están obligados a usar SIRE o que mantienen obligaciones de libros que SIRE aún no cubre.

---

## Formatos del PLE

| Formato | Libro / Registro | Versión |
|---|---|---|
| 3.1 | Registro de Ventas | 7.0 |
| 3.2 | Registro de Compras | 7.0 |
| 4.1 | Libro Diario | 7.0 |
| 4.2 | Libro Mayor | 7.0 |
| 5.1 | Libro de Inventarios y Balances | 7.0 |
| 6.1 | Registro de Activos Fijos | 7.0 |
| 7.1 | Registro de Compras Intracomunitarias | 7.0 |
| 8.1 | Registro de Ventas Intracomunitarias | 7.0 |
| 8.2 | Registro de Consignaciones | 7.0 |
| 8.3 | Registro de Existencias | 7.0 |
| 9.1 | Libro de Retenciones | 7.0 |
| 12.1 | Libro de Percepciones | 7.0 |
| 13.1 | Libro de Ingresos y Gastos | 7.0 |
| 14.1 | Libro de Inventarios | 7.0 |

---

## Estructura del archivo PLE

El PLE genera un archivo de texto plano con formato específico por cada libro:

```
Formato 3.1 — Registro de Ventas
─────────────────────────────────────────────
| Campo | Longitud | Descripción |
|---|---|---|
| 1 | 2 | Código del libro (14) |
| 2 | 4 | Período (AAAAMM) |
| 3 | 1 | Moneda (2 = soles) |
| 4 | 11 | RUC del emisor |
| 5 | 200 | Razón social |
| 6 | 4 | Código de operación |
| 7 | 4 | Serie del CPE |
| 8 | 8 | Número del CPE |
| 9 | 8 | Fecha de emisión (AAAAMMDD) |
| 10 | 8 | Fecha de vencimiento |
| ... | ... | ... |
| 62 | 16 | Total IGV |

Formato: campos separados por "|"
Ejemplo:
14|202606|2|20123456789|FACTURACIÓN TOTAL S.A.C.|...
```

---

## Plazos de presentación

### Cierre mensual

El cierre de cada libro debe realizarse dentro de los plazos establecidos:

| Dígito RUC | Cierre mes anterior | Cierre mes actual |
|---|---|---|
| 0–9 | Hasta el 10 del mes siguiente | Hasta el 15 del mes siguiente |
| B. Contrib. | Hasta el 15 del mes siguiente | Hasta el 22 del mes siguiente |

### Cierre anual

El libro de Inventarios y Balances (formato 5.1) debe cerrarse hasta la fecha de presentación de la declaración anual del Impuesto a la Renta.

---

## Migración a SIRE

La migración de PLE a SIRE es progresiva. Cuando un contribuyente pasa a SIRE:

1. Deja de presentar PLE para RVIE y RCE
2. Los períodos anteriores permanecen en PLE (históricos no se migran automáticamente)
3. Si no realizó el cierre de PLE antes de la migración, puede hacerlo hasta el **31 de enero del año siguiente** sin multa

### Multa por no cerrar PLE

No cerrar los libros PLE antes de migrar a SIRE puede generar infracciones. La **R.S. 32-2026/SUNAT** extiende la facultad discrecional hasta el **31 de agosto de 2026** para regularizar sin multa.

---

## PLE en Drenyra

```typescript
interface PleFormat {
  code: string          // "3.1", "4.1", etc.
  period: string        // "202606"
  currency: string      // "2" (soles)
  lines: Array<PleLine>
}

interface PleLine {
  fields: string[]      // Campos según formato
}

// Generar archivo PLE
const pleFile = generatePleFile({
  format: '3.1',
  period: '202606',
  ruc: '20123456789',
  records: ventasRecords,
})

// Validar contra SUNAT
const validation = validatePleFile(pleFile)
```

---

## Diferencias PLE vs SIRE

| Aspecto | PLE | SIRE |
|---|---|---|
| Carga de datos | El contribuyente genera y envía el archivo | SUNAT genera la propuesta automática |
| Formato | Texto plano con formato específico | XML / API |
| Validación | Al enviar el archivo | En tiempo real |
| Correcciones | Reemplazo manual del archivo | Reemplazo o complemento en línea |
| Estado actual | Activo (contribuyentes no migrados) | Activo (expansión progresiva) |
| Cobertura | Todos los libros contables | RVIE + RCE inicialmente |

---

## Do / Don't

### Hacer

- Cerrar cada libro dentro del plazo correspondiente al dígito del RUC.
- Validar el archivo PLE contra las reglas de SUNAT antes de enviar.
- Conservar los archivos PLE históricos como evidencia.

### No hacer

- No mezclar períodos en un mismo archivo PLE.
- No enviar archivos PLE después del cierre sin el formato de rectificatoria.
- No asumir que la migración a SIRE elimina la obligación de conservar PLE históricos.

---

## Referencias

- [SUNAT — PLE](https://emprender.sunat.gob.pe/comprobantes-libros/registros-libros-electronicos/programa-libros-electronicos-ple)
- [SUNAT — Formatos PLE (versiones)](https://emprender.sunat.gob.pe/librosple)
- [SUNAT — Preguntas frecuentes PLE](https://orientacion.sunat.gob.pe/preguntas-frecuentes-libros-y-registros)
- [R.S. 286-2009/SUNAT](https://www.sunat.gob.pe/legislacion/superin/2009/286-2009.pdf)
