# SIRE — Sistema Integrado de Registros Electrónicos

**Última actualización:** 2026-07-29
**Base legal:** R.S. 112-2021/SUNAT, R.S. 32-2026/SUNAT
**Acceso:** [sire.sunat.gob.pe](https://sire.sunat.gob.pe/)

---

## Qué es

El **Sistema Integrado de Registros Electrónicos (SIRE)** es la plataforma de SUNAT que reemplaza progresivamente al PLE y al SLE-Portal. Genera automáticamente el **Registro de Ventas e Ingresos Electrónico (RVIE)** y el **Registro de Compras Electrónico (RCE)** a partir de los comprobantes de pago electrónicos (CPE) que el contribuyente emite y recibe.

El contribuyente ya no ingresa datos manualmente — solo **valida y acepta** la propuesta que SUNAT genera, o la **reemplaza o complementa** si no está conforme.

### Beneficios

- **Ahorro de tiempo** — no hay ingreso manual de registros
- **Reducción de costos** — gratuito, sin papel
- **Menos errores** — alertas preventivas desde la emisión del CPE
- **Declaración IGV prellenada** — SUNAT genera la propuesta de declaración mensual
- **Seguridad** — información almacenada accesible cuando se necesita

---

## Cronograma de obligatoriedad

| Desde | Sujetos obligados |
|---|---|
| Julio 2023 | Anexo 7 de R.S. 112-2021/SUNAT |
| Octubre 2023 | RER y MYPE Tributario obligados a PLE a septiembre 2023 |
| Agosto 2024 | RER y MYPE Tributario obligados a RVIE/RCE al 31/07/2024 |
| Enero 2025 | Contribuyentes obligados a RVIE/RCE al 31/12/2024, no PRICOS |
| Enero 2026 | PRICOS designados al 31/12/2024, ingresos ≤ 2,300 UIT |
| **Octubre 2026** | PRICOS designados al 31/12/2024, ingresos > 2,300 UIT |

**Octubre 2026** completa la obligatoriedad universal del SIRE para todos los contribuyentes obligados a llevar RVIE y RCE.

---

## Facultad discrecional 2026

La **Resolución de Superintendencia Nacional Adjunta de Tributos Internos N.º 000032-2026-SUNAT/700000** establece:

> Los contribuyentes obligados a usar SIRE al período mayo 2026 pueden regularizar la generación de sus registros y efectuar ajustes **hasta el 31 de agosto de 2026**, sin aplicación de sanciones administrativas (infracciones del Art. 175, numerales 2 y 10 del Código Tributario).

Para contribuyentes que adquieren la obligación a partir de junio 2026, la facultad se extiende a los períodos junio y julio 2026, con el mismo plazo máximo del 31 de agosto de 2026.

Esto abarca tanto a quienes ya estaban obligados hasta diciembre de 2025 como a quienes empezaron en enero de 2026.

---

## Flujo SIRE

```
CPE emitidos por el contribuyente
  → SUNAT procesa CPE
  → Propuesta RVIE + RCE generada automáticamente
  → Contribuyente valida la propuesta
      ├── Acepta → registros confirmados
      └── Rechaza → propuesta de reemplazo
          → Contribuyente ingresa datos corregidos
          → SUNAT valida consistencia
          → Registros reemplazados
  → SUNAT propone declaración IGV mensual
  → Contribuyente presenta declaración
```

### Estados del registro

| Estado | Significado |
|---|---|
| **Propuesta** | Generado por SUNAT, pendiente de validación |
| **Aceptado** | Validado por el contribuyente sin cambios |
| **Reemplazado** | El contribuyente proporcionó datos corregidos |
| **Complementado** | Se agregaron operaciones no incluidas en la propuesta |
| **Cerrado** | Período cerrado, ya no admite cambios |

---

## RVIE — Registro de Ventas e Ingresos Electrónico

Contiene todas las operaciones de venta e ingresos del contribuyente. SUNAT lo genera a partir de:

- CPE emitidos (facturas, boletas, NC, ND)
- Operaciones no electrónicas declaradas
- Ajustes y rectificaciones

### Validaciones

- Coincidencia con CPE emitidos en el período
- Consistencia de IGV (tasa aplicable según tipo de operación)
- Correlatividad de documentos
- RUC del adquiriente activo

---

## RCE — Registro de Compras Electrónico

Contiene todas las adquisiciones del contribuyente. SUNAT lo genera a partir de:

- CPE recibidos de proveedores
- Comprobantes de importación
- Comprobantes de operaciones no domiciliadas
- Ajustes

### Validaciones

- Coincidencia con CPE recibidos
- RUC del proveedor activo y habido
- Crédito fiscal válido (requisitos del IGV)
- No duplicidad de documentos

---

## Modalidades de acceso

| Modalidad | Descripción |
|---|---|
| **Portal Web** | Interfaz web en sire.sunat.gob.pe |
| **Aplicativo Cliente SIRE** | Aplicación de escritorio para envío masivo |
| **API SIRE** | Servicio web para integración directa |

Drenyra se integra vía **API SIRE** para automatizar la reconciliación.

---

## SIRE en Drenyra

### Flujo de reconciliación

```
1. Obtener RVIE del período (API SUNAT)
2. Obtener RCE del período (API SUNAT)
3. Comparar contra registros internos (ledger)
4. Identificar diferencias
5. Clasificar diferencias:
   └── Bajo tolerancia (≤ S/ 0.50) → auto-resuelve
   └── Sobre tolerancia → genera reemplazo candidato
6. Validar reemplazo contra invariantes
7. Presentar cambio vía Change Set
8. Ejecución → envío a SUNAT → receipt
```

### Manejo de UNKNOWN

Cuando el estado de un registro no puede determinarse (timeout, error de red, respuesta ambigua):

```
1. Marcar registro como unknown
2. Conservar evidencia del intento
3. Reconciliar vía consulta de estado (API SUNAT)
4. Si se confirma → cerrar con receipt
5. Si no se confirma → reintentar bajo el mismo contrato
6. Si persiste la incertidumbre → escalar a revisión profesional
```

---

## Do / Don't

### Hacer

- Validar la propuesta SIRE dentro del plazo de facultad discrecional (31/08/2026).
- Comparar RVIE/RCE contra registros internos en cada período.
- Generar reemplazos solo cuando las diferencias excedan tolerancia.
- Conservar receipt de cada envío a SUNAT.

### No hacer

- No aceptar la propuesta SIRE sin validar contra el ledger interno.
- No asumir que el estado del registro es correcto sin verificar contra SUNAT.
- No cerrar un período si hay registros en estado `unknown` sin reconciliar.
- No reemplazar datos sin verificar las invariantes de IGV y RUC.

---

## Referencias

- [SIRE — Portal Oficial](https://sire.sunat.gob.pe/)
- [SIRE — Información general](https://www.gob.pe/institucion/sunat/informes-publicaciones/4445314-sistema-integrado-de-registros-electronicos-sire)
- [R.S. 112-2021/SUNAT](https://www.sunat.gob.pe/legislacion/superin/2021/112-2021.pdf)
- [Emprender SUNAT — SIRE](https://emprender.sunat.gob.pe/comprobantes-libros/registros-libros-electronicos/sistema-integrado-registros-electronicos-sire)
- [Facultad discrecional R.S. 32-2026/SUNAT](https://sire.sunat.gob.pe/)
