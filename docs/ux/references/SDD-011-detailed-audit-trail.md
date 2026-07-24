---
status: reference
normative: false
consumed_by: SDD-018
---

---
title: "SDD-011 — Audit Trail Visual"
description: "Timeline de acciones fiscales con quién, cuándo, qué, y por qué — trazabilidad completa de cada operación en el sistema"
version: "0.1"
tags: [sdd, ux, fiscal-trust, audit-trail, traceability, timeline]
audience: [ux-engineer, frontend-engineer, product-manager, fiscal-architect, compliance]
status: borrador
last_updated: 2026-07-14
---

> **SDD-011** | Ola 2 — Fiscal Trust Core | **Previsto**: 5 días hábiles

---

## 1. Abstract

SDD-011 define el **sistema de visualización del audit trail** de Drenyra — cómo cada acción fiscal se registra, presenta y navega en una línea de tiempo comprensible, verificable y exportable. Es la implementación concreta del **Contrato de Trazabilidad de Auditoría (I5)** de SDD-002 (§7.4), integrado con el modelo de reversibilidad (SDD-008), las gates de aprobación (SDD-010), y el sistema de evidencia (SDD-006).

El audit trail visual no es un log técnico disfrazado de UI. Es un **instrumento de confianza**: cualquier usuario — desde un auxiliar contable hasta un revisor fiscal o una autoridad SUNAT — debe poder reconstruir la historia completa de una entidad fiscal en segundos, entendiendo quién hizo qué, cuándo, con qué autorización, y qué cambió.

---

## 2. North Star

> "Que un revisor fiscal pueda reconstruir la historia completa de una declaración mensual — desde su creación hasta su presentación final — en menos de 30 segundos, sin necesidad de preguntarle a nadie ni buscar en sistemas externos."

---

## 3. Problem Statement

Los audit trails en sistemas contables actuales fallan por cinco razones:

1. **Son logs técnicos, no históricos de negocio.** Muestran eventos del sistema (HTTP 200, job completado) en lugar de acciones con significado fiscal ("Se presentó DET mensual", "Se revocó aprobación", "Se corrigió base imponible").

2. **No hay narrativa.** Las acciones aparecen como filas independientes sin conexión causal. No se puede responder "¿esto pasó antes o después de aquello?"

3. **Sin contexto de aprobación.** Falta información sobre quién autorizó la acción, desde qué gate, y qué evidencia se mostró al aprobador.

4. **Sin evidencia adjunta.** El trail técnico no guarda qué datos se vieron, qué valores cambiaron, o qué reglas se aplicaron.

5. **No exportables.** Cuando un revisor fiscal o SUNAT solicita el histórico, no hay forma de generar un reporte legible y completo.

Drenyra, como plataforma de inteligencia fiscal, debe resolver esto desde el día cero: la trazabilidad no es un accesorio, es un requisito fiscal.

---

## 4. User Research (links a SDD-001)

| Hallazgo SDD-001 | Implicación para SDD-011 |
|---|---|
| P4 (Socio firma) audita operaciones del equipo | Necesita vista consolidada de acciones multi-usuario |
| P5 (Auxiliar) registra, no decide | Audit trail como mecanismo de visibilidad de su trabajo |
| P6 (Contador dependiente) rinde cuentas | Trail como evidencia de diligencia debida |
| P7 (Revisor fiscal) existe para verificar | Timeline entidad como pantalla principal de trabajo |
| J8: "Demostrar que seguí el proceso" | Audit trail exportable como prueba de cumplimiento |
| J12: "Auditar un periodo cerrado" | Trail sin posibilidad de alteración post-acciones |
| Cadencia de cierre mensual | Trail filtrable por periodo, acción, rol, RUC |

> Ver SDD-001: §6 (arquetipos P4-P7), §7 (roles), §8 (JTBD J8, J12), §10 (cadencia)

---

## 5. Invariantes Afectados

| # | Invariante | Prioridad | Relación con SDD-011 |
|---|---|---|---|
| I5 | ✅ Trazabilidad de auditoría | **Crítico** | Este SDD es la implementación de I5 |
| I3 | ✅ Reversibilidad | Alta | Cada reversión se registra como entrada de trail |
| I2 | ✅ Explicabilidad | Alta | Timeline debe explicar QUÉ pasó y POR QUÉ |
| I10 | ✅ Preparación para impresión | Alta | Exportación de audit trail a PDF legible |
| I1 | ✅ Alcance por RUC | Alta | Trail filtrado por RUC activo (SDD-009) |
| I12 | ✅ WCAG 2.2 AA+ | Media | Timeline navegable por teclado, live regions |

---

## 6. Arquitectura de Eventos de Auditoría

### 6.1 Modelo de Datos

Cada entrada del audit trail (en adelante: **EventEntry**) sigue esta estructura:

```typescript
interface EventEntry {
  id: string                // UUID v7 (ordenable por tiempo)
  timestamp: ISO8601        // Cuándo ocurrió
  ruc: RUC                  // RUC al que pertenece la acción
  actor: {
    id: string
    name: string
    role: string            // Rol operacional (SDD-001 §7)
    source: 'user' | 'system' | 'api' | 'ai'
  }
  action: {
    type: ActionType        // Ver §6.2
    category: ActionCategory // create | update | delete | approve | reject | revert | export | view
    description: string     // Frase legible: "Se presentó DET de Marzo 2026"
    verb: string            // Verbo corto: "presentó", "aprobó", "rechazó"
  }
  target: {
    type: string            // Tipo de entidad: "det", "invoice", "declaration", "configuration"
    id: string
    label: string           // Nombre legible: "DET Marzo 2026"
  }
  context: {
    ruc: RUC
    periodo?: string        // Periodo fiscal: "2026-03"
    sessionId?: string
    ip?: string
    userAgent?: string
  }
  evidence?: {
    depth: EvidenceDepth    // L0 | L1 | L2 (SDD-006)
    confidence?: number     // Si es acción AI
    snapshot?: string       // Referencia a instantánea de datos previos
  }
  approval?: {
    gate: string            // G1–G5 (SDD-010)
    approvedBy?: string
    approvedAt?: ISO8601
  }
  reversion?: {
    originalEntryId: string
    reason: string
  }
  metadata: {
    source: string          // Componente o servicio que generó el evento
    version: string         // Versión del schema de eventos
  }
}
```

### 6.2 Taxonomía de ActionType

| Categoría | ActionTypes | ¿Visible por defecto? |
|---|---|---|
| **Creación** | `document.created`, `entity.created`, `draft.created` | Sí |
| **Modificación** | `document.updated`, `entity.updated`, `draft.saved` | Sí (colapsable en versiones) |
| **Envío** | `det.submitted`, `declaration.presented`, `invoice.sent` | Sí |
| **Aprobación** | `approval.solicited`, `approval.granted`, `approval.rejected`, `approval.deferred`, `approval.revoked` | Sí |
| **Ejecución AI** | `ai.recommended`, `ai.prepared`, `ai.executed`, `ai.failed` | Sí (con indicador L0-L3) |
| **Reversión** | `reversion.executed`, `reversion.failed`, `reversion.initiated` | Sí |
| **Corrección** | `rectification.created`, `rectification.completed` | Sí |
| **Exportación** | `report.exported`, `data.exported` | Sí (colapsable) |
| **Configuración** | `config.updated`, `permission.changed`, `tenant.updated` | Sí |
| **Visualización** | `document.viewed`, `report.viewed` | No (por defecto, configurable) |

### 6.3 Almacenamiento: Append-Only con Referencias

- El audit trail es **append-only**: no se editan ni borran entradas.
- Las correcciones generan nuevas entradas con referencia a la original vía `reversion.originalEntryId`.
- Las reversiones (SDD-008) se registran como nuevas entradas que referencian la entrada revertida.
- No hay cascada de borrado lógico: el trail es inmutable por diseño.
- Las entradas se almacenan en una tabla separada con índice compuesto `(ruc, periodo, timestamp)` para consultas eficientes.

---

## 7. Timeline Visual

### 7.1 Timeline Vertical (Principal)

El timeline es el componente central del audit trail — una lista cronológica invertida (más reciente primero) con:

```
┌──────────────────────────────────────────────────────┐
│ 🔍 [Buscar en timeline...]   📅 [Período ▼]    [RUC] │
│ [Filtros: Acción ▾ | Rol ▾ | Fuente ▾ | Fecha ▾]    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Hoy, 14:23                                       ── │
│  ──────────────────────────────────────────────      │
│                                                      │
│  ● [✅] Se PRESENTÓ DET Marzo 2026                   │
│  ├── por: rezagos@estudio.pe (Contador)              │
│  ├── aprobado por: revisor@estudio.pe (Revisor) G4   │
│  ├── con evidencia: [Ver L1 ▸]                        │
│  └── 🔄 Reversión disponible hasta 14:28             │
│                                                      │
│  ● [📝] Se RECHAZÓ DET Marzo 2026                    │
│  ├── por: revisor@estudio.pe (Revisor Fiscal)         │
│  └── motivo: "Base imponible no coincide con libros"  │
│                                                      │
│  Ayer, 10 de julio                                ── │
│  ──────────────────────────────────────────────      │
│                                                      │
│  ● [⏳] Se SOMETIÓ DET Marzo 2026 a aprobación       │
│  ├── por: rezagos@estudio.pe (Contador)              │
│  └── ⏰ Pendiente de aprobación (G4)                 │
│                                                      │
│  ● [✏️] Se ACTUALIZÓ DET Marzo 2026                  │
│  ├── por: rezagos@estudio.pe (Contador)               │
│  └── [Ver cambios ▸]                                  │
│                                                      │
│  8 de julio                                       ── │
│  ──────────────────────────────────────────────      │
│                                                      │
│  ● [🤖] Se RECOMENDÓ ajuste en DET Marzo 2026       │
│  ├── por: Drenyra AI (L1)                            │
│  ├── con 83% de confianza                            │
│  └── [Ver recomendación ▸]                           │
│                                                      │
│  ● [📄] Se CREÓ DET Marzo 2026                       │
│  └── por: rezagos@estudio.pe (Contador)               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 7.2 Componentes del Timeline

#### Entry Card (cada eventos)

Cada entrada del timeline es una card expandible con:

| Elemento | Descripción | Visible siempre | Requiere expansión |
|---|---|---|---|
| Indicador visual | Icono + color según tipo de acción | ✅ | — |
| Verbo | "Presentó", "Aprobó", "Rechazó" | ✅ | — |
| Target | Nombre de la entidad afectada | ✅ | — |
| Actor | Quién ejecutó la acción | ✅ | — |
| Timestamp | Fecha y hora absolutas | ✅ | — |
| Separador de fecha | Línea con fecha cuando cambia el día | ✅ | — |
| Evidencia L1 | Resumen de datos clave | — | ✅ |
| Detalle de cambios | Diff de valores antes/después | — | ✅ |
| Metadata técnica | sessionId, IP, userAgent | — | ✅ |

#### Separadores de Fecha

Se muestran separadores de fecha:
- **Hoy**: "Hoy, 14:23" (tiempo relativo dentro del día)
- **Ayer**: "Ayer, 10 de julio"
- **Esta semana**: "Martes, 8 de julio"
- **Semana pasada**: "Semana del 30 de junio"
- **Mes anterior**: "Junio 2026"
- **Antiguo**: "Abril 2026" (solo mes)
- Las fechas del mismo día no repiten el separador

#### Badge de Estado

Cada entrada lleva un badge que indica su estado contextual:

| Badge | Significado | Color |
|---|---|---|
| ✅ | Completado exitosamente | Verde |
| ❌ | Falló / Rechazado | Rojo |
| ⏳ | Pendiente (esperando acción) | Amarillo |
| 🔄 | Reversión disponible | Azul claro |
| 🤖 | Acción AI | Púrpura |
| 📝 | Requiere atención | Naranja |

---

## 8. Filtros y Búsqueda

### 8.1 Filtros del Timeline

| Filtro | Tipo | Comportamiento |
|---|---|---|
| **Período** | Date range picker | Por defecto: período fiscal actual. Precarga último período cerrado. |
| **Tipo de acción** | Multi-select checklist | Taxonomía completa del §6.2, agrupada por categoría |
| **Actor** | User select con búsqueda | Lista de usuarios del RUC activo |
| **Rol** | Multi-select | Roles operacionales de SDD-001 §7 |
| **Fuente** | Toggle buttons | `👤 Humano` `🤖 AI` `⚙️ Sistema` `🔌 API` |
| **Target** | Text input | Busca en target.label (autocomplete con entidades del RUC) |
| **Fecha exacta** | Calendar | Sobreescribe el período |
| **RUC** | Select (de SDD-009) | Solo visible en modo multi-RUC |

### 8.2 Búsqueda Full-Text

- Busca en: `actor.name`, `action.description`, `target.label`, `approval.gate`
- Autocomplete con acciones recientes del RUC activo
- Resultados resaltan el texto buscado
- Búsqueda en tiempo real (debounce 300ms)

### 8.3 Persistencia de Filtros

- Los filtros se persiguen en la URL (query params) para compartir enlaces
- Al cambiar de RUC (SDD-009), los filtros se reinician al período fiscal del nuevo RUC
- Preferencias de filtros guardadas por usuario + RUC

---

## 9. Timeline por Entidad (Vista Detalle)

Además del timeline global por RUC, cada entidad fiscal tiene su propio timeline contextual:

```
┌────────────────────────────────────────────────────────┐
│  DET Marzo 2026                     Estado: ✅ Aprobado │
│  RUC: 20123456789                                      │
│                                                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [📄 Historia] [📊 Detalle] [🔁 Reversiones] [📎 ...]│ │
│  ├────────────────────────────────────────────────────┤ │
│  │ Timeline de esta entidad                           │ │
│  │                                                    │ │
│  │ ● CREADO · 8 jul · rezagos@estudio.pe              │ │
│  │ ● MODIFICADO (×4) · 8-10 jul · rezagos@estudio.pe  │ │
│  │   [Ver cambios ▼                                   │ │
│  │    10 jul 14:10 → Base imponible: 120,000 → 125,000│ │
│  │    10 jul 11:30 → IGV: 21,600 → 22,500             │ │
│  │    9 jul 16:45 → Proveedor: "XYZ" → "ABC"          │ │
│  │    8 jul 09:00 → Versión inicial]                   │ │
│  │ ● SOMETIDO · 10 jul · rezagos@estudio.pe            │ │
│  │ ● APROBADO (G4) · 10 jul · revisor@estudio.pe       │ │
│  │ ● PRESENTADO · 10 jul · Sistema (vía SUNAT API)    │ │
│  │ ● RECIBIDO CDR · 10 jul · Sistema                  │ │
│  └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

**Reglas:**
- La vista de entidad muestra solo eventos que afectan a esa entidad específica
- Las modificaciones múltiples se agrupan por defecto en "Modificado (×N)" con expansión
- El timeline de entidad se abre por defecto mostrando los últimos 20 eventos
- Botón "Ver historia completa" lleva al timeline global filtrado a esa entidad

---

## 10. Modificaciones Agrupadas (Diff View)

Cuando una entidad se modifica múltiples veces, las entradas se agrupan:

### 10.1 Agrupación por Defecto

```
● MODIFICADO (×4) · 8-10 jul · rezagos@estudio.pe
  [Ver cambios ▸]
```

### 10.2 Vista Expandida: Cambios por Versión

Al expandir, se muestra cada versión con diff:

```
● MODIFICACIÓN #1 · 8 jul 09:00
  ┌──────────────────────────────────────┐
  │ ✏️ Base imponible: 0 → 120,000      │
  │ ✏️ IGV: 0 → 21,600                   │
  │ ✏️ Proveedor: — → "XYZ"              │
  └──────────────────────────────────────┘
● MODIFICACIÓN #2 · 9 jul 16:45
  ┌──────────────────────────────────────┐
  │ ✏️ Proveedor: "XYZ" → "ABC"          │
  └──────────────────────────────────────┘
● MODIFICACIÓN #3 · 10 jul 11:30
  ┌──────────────────────────────────────┐
  │ ✏️ Base imponible: 120,000 → 125,000 │
  │ ✏️ IGV: 21,600 → 22,500              │
  └──────────────────────────────────────┘
```

### 10.3 Visualización de Diffs

| Tipo de campo | Visualización de diff |
|---|---|
| **Monto** | Valor anterior tachado → valor nuevo. Diferencia en rojo/verde. |
| **Texto corto** | Anterior → Nuevo con resaltado de cambios |
| **Proveedor/Entidad** | Anterior → Nuevo con link a detalle |
| **Fecha** | Cambio nominal: "15/03/2026 → 16/03/2026" |
| **Estado** | Cambio nominal con badge: `📄 Borrador` → `⏳ Pendiente` |
| **Booleano** | Toggle con texto: "Sí → No" |
| **Nuevo campo** | `— → Valor` (verde, cursiva) |
| **Campo eliminado** | `Valor → —` (rojo, tachado) |

### 10.4 Umbrales de Agrupación

| Condición | Agrupación |
|---|---|
| Misma entidad, mismo actor, < 5 min entre cambios | **Agrupar** como "Modificado en lote" |
| Misma entidad, diferentes actores, cualquier tiempo | **No agrupar** |
| Misma entidad, mismo actor, > 30 min entre cambios | **Agrupar por sesión** con separadores de hora |
| Cambio de configuración del mismo tipo | **Agrupar** con conteo ("3 configs actualizadas") |
| Vistas de documento | **Ocultar** por defecto (toggle "Mostrar consultas") |


---

## 11. Entradas de Acciones AI en el Timeline

Las acciones del modelo L0-L3 (SDD-007) tienen representación especial en el timeline:

| Nivel | Visualización | Indicador |
|---|---|---|
| **L0 (Explain)** | No genera entrada de audit trail | — |
| **L1 (Recommend)** | Entrada con badge 🤖 y confianza | "Drenyra AI recomendó ajuste con 83% de confianza" |
| **L2 (Prepare)** | Entrada con badge 🤖 + "Preparado por AI" | "Drenyra AI preparó DET borrador. Pendiente de revisión." |
| **L3 (Execute)** | Entrada con badge 🤖 + "Ejecutado por AI" | "Drenyra AI presentó DET (auto-aprobado, confianza 94%)" |

**Reglas específicas:**

- Las acciones AI siempre muestran el nivel (L1/L2/L3) como badge secundario
- Las acciones AI en L3 incluyen el confidence score y un link a la evidencia (SDD-006)
- Si una acción AI es revertida (SDD-008), ambas entradas (ejecución + reversión) se muestran vinculadas visualmente con una línea punteada
- Las recomendaciones AI rechazadas por el usuario muestran "Rechazó recomendación AI" con opción de feedback

---

## 12. Exportación del Audit Trail

### 12.1 Formatos de Exportación

| Formato | Uso | Contenido |
|---|---|---|
| **PDF** | Reportes formales, SUNAT, revisor fiscal | Timeline completo con filtros aplicados, formato A4, paginado, con membrete del RUC |
| **CSV** | Análisis en Excel/Google Sheets | Cada entrada es una fila, columnas planas (timestamp, actor, acción, target, etc.) |
| **JSON** | Integraciones API | Array de EventEntry completo con todos los campos |
| **HTML** | Vista web estática | Timeline renderizado como página autónoma sin necesidad de backend |

### 12.2 Configuración de Exportación

| Opción | Valores | Defecto |
|---|---|---|
| Rango de fechas | Date range | Último período fiscal |
| Incluir vistas | Sí / No | No |
| Incluir metadata técnica | Sí / No | No |
| Nivel de evidencia | L0 / L1 / L2 | L1 |
| Incluir aprobaciones | Sí / No | Sí |
| Incluir acciones AI | Sí / No | Sí |
| Resumen ejecutivo | Sí / No | No (primera página con conteo por tipo) |

### 12.3 PDF: Diseño de Página

```
┌────────────────────────────────────────────────────────┐
│  [Logo] Drenyra — Audit Trail                          │
│  RUC: 20123456789 — ESTUDIO CONTABLE REZAGOS S.A.C.    │
│  Reporte generado: 14/07/2026 16:30                    │
│  Periodo: Julio 2026                                   │
│  Filtros aplicados: Acciones de aprobación y envío     │
│                                                        │
│  ──────────────────────────────────────────────────    │
│                                                        │
│  Resumen ejecutivo:                                     │
│  Total entradas: 24 (13 humanas, 11 AI)                │
│  Aprobaciones: 5 (G4: 3, G3: 2)                       │
│  Envíos a SUNAT: 2                                     │
│  Reversiones: 1 (L3 auto-ejecutado)                    │
│                                                        │
│  ──────────────────────────────────────────────────    │
│                                                        │
│  14/07/2026                                            │
│  ────────────                                          │
│  14:23 | ✅ | rezagos@ | SE PRESENTÓ DET Marzo 2026    │
│         | Aprobado por revisor@ (G4)                   │
│                                                        │
│  13:45 | 🤖 | AI L3 | SE PRESENTÓ DET Febrero 2026     │
│         | Confianza: 94% | Evidencia: Ver (p.4)        │
│                                                        │
│  ...                                                   │
│                                                        │
│  ──────────────────────────────────────────────────    │
│  Página 1/4 — Generado por Drenyra v0.1.0              │
└────────────────────────────────────────────────────────┘
```

### 12.4 Nomenclatura de Archivos Exportados

```
[RUC]-[periodo]-[fecha]-[timestamp].ext
# Ejemplo:
20123456789-2026-07-20260714-163022.pdf
```

- El RUC siempre va primero (identificación clara)
- El periodo es opcional (si no hay filtro de periodo, se omite)
- Timestamp en formato ISO compacto (YYYYMMDD-HHMMSS)

---

## 13. Estados del Audit Trail

### 13.1 Estados del Timeline

| Estado | Cuándo ocurre | Visualización |
|---|---|---|
| **Cargando** | Primera carga o cambio de filtros | Skeleton de 5 entries con shimmer |
| **Vacío (sin eventos)** | Entidad nueva, sin acciones registradas | Mensaje: "No hay eventos registrados para este periodo" + icono |
| **Vacío (sin resultados de filtro)** | Filtros que no matchean nada | "Ninguna entrada coincide con los filtros actuales" + [Limpiar filtros] |
| **Error** | Fallo al cargar el timeline | "No pudimos cargar el audit trail" + [Reintentar] + [Soporte] |
| **Error parcial** | Algunas entradas no cargaron | Banner: "2 entradas no pudieron cargarse" + [Ver detalles] |
| **Carga incremental** | Scroll infinito (100 entradas por lote) | Spinner al final + "Cargando más entradas..." |
| **Actualización en tiempo real** | Nueva acción ocurre mientras se ve el timeline | Badge pulsante: "3 nuevas entradas" + [Mostrar] |
| **Sin conexión** | Offline, timeline cargado de caché | Banner: "Mostrando datos almacenados localmente. Conéctate para ver actualizaciones." |
| **Timeline de entidad vacío** | Entidad sin acciones propias | "Esta entidad no tiene acciones registradas" |

### 13.2 Actualización en Tiempo Real

- WebSocket push de nuevos eventos
- Badge "N nuevas entradas" aparece arriba del timeline
- Click en badge hace scroll al tope y muestra las nuevas
- No interrumpe la posición actual del scroll
- Desconexión: banner de "Tiempo real desconectado. Mostrando datos hasta [hora]"

---

## 14. Integración con el Sistema de Reversibilidad

Cada entrada del timeline que es reversible (SDD-008) tiene indicación visual:

```
● [🔁] Se PRESENTÓ DET Marzo 2026
├── por: rezagos@estudio.pe
├── aprobado por: revisor@estudio.pe (G4)
└── 🔄 Reversible hasta 14:28 (hace 2 min)
```

- **Icono de reversión**: presente en toda entrada que está dentro de su ventana de reversibilidad
- **Countdown**: timer que muestra tiempo restante (si ventana < 1h)
- **Acción**: click en "🔄 Revertir" inicia el wizard de reversión (SDD-008)
- **Entradas revertidas**: se muestran con badge 🔁 y línea conectada a la entrada de reversión
- **Entradas irreversibles**: no muestran icono (la ausencia del icono es informativa)
- **Agrupación reversible**: si una entrada fue revertida, ambas entradas aparecen agrupadas visualmente:

```
┌─ 🔁 Reversión ────────────────────────────────────────┐
│ ● [🤖] SE PRESENTÓ DET Marzo 2026 — 14:20             │
│ ··· revertido por ···                                  │
│ ● [🔁] Se REVIRTIÓ presentación DET Marzo 2026 — 14:23│
│ por: admin@estudio.pe, motivo: "Error en base imponible" │
└────────────────────────────────────────────────────────┘
```

---

## 15. Accesibilidad

### 15.1 WCAG 2.2 AA+

| Criterio | Cobertura en SDD-011 |
|---|---|
| **1.1.1 Non-text Content** | Todos los iconos del timeline tienen aria-label descriptivo |
| **1.3.1 Info and Relationships** | Timeline usa `<ol>` semántico con `<li>` para cada entrada |
| **1.4.1 Use of Color** | Estado del badge no depende solo del color; tiene icono + texto |
| **1.4.3 Contrast (AA)** | Texto del timeline: contraste ≥ 4.5:1 |
| **2.1.1 Keyboard** | Timeline navegable con flechas arriba/abajo. Enter expande. |
| **2.4.2 Page Titled** | Título de página indica RUC + periodo del audit trail |
| **2.4.3 Focus Order** | Orden de foco: filtros → timeline → paginación |
| **2.4.6 Headings/Labels** | Separadores de fecha son `<h3>`. Filtros tienen `<label>`. |
| **2.4.7 Focus Visible** | Foco visible en cards expandibles y botones de acción |
| **4.1.2 Name, Role, Value** | Cada entrada expone role="listitem" y aria-posinset |
| **4.1.3 Status Messages** | Live region para "N nuevas entradas" y cambios de filtro |

### 15.2 Atajos de Teclado

| Atajo | Acción |
|---|---|
| `↑` / `↓` | Navegar entre entradas del timeline |
| `Enter` / `Espacio` | Expandir/colapsar entrada |
| `Ctrl+F` | Foco en búsqueda |
| `Escape` | Cerrar panel expandido / limpiar búsqueda |
| `Ctrl+E` | Abrir exportación |
| `R` (con entrada seleccionada) | Iniciar reversión (si disponible) |
| `F` | Foco en filtro de tipo de acción |
| `P` | Cambiar período |

### 15.3 Live Regions

| Evento | ARIA Live Region |
|---|---|
| Nuevas entradas en tiempo real | `role="status" aria-live="polite"` — "3 nuevas entradas" |
| Cambio de filtros | `role="status" aria-live="polite"` — "Mostrando solo aprobaciones" |
| Error de carga | `role="alert"` — "No pudimos cargar el audit trail" |
| Exportación completada | `role="status" aria-live="polite"` — "PDF exportado: audit-trail-2026-07.pdf" |

---

## 16. Performance Budget

| Operación | Tiempo máximo objetivo | Condición |
|---|---|---|
| Carga inicial del timeline (30 entradas) | ≤ 1.5s | Conexión 4G, 1000 entradas totales en el RUC/periodo |
| Lote incremental (siguientes 30) | ≤ 500ms | Misma conexión |
| Aplicar filtro | ≤ 300ms | Respuesta del backend + re-render |
| Búsqueda full-text | ≤ 500ms | Sobre 1000 entradas |
| Expandir entrada con evidencia L1 | ≤ 200ms | Evidencia precargada |
| Exportar PDF (100 entradas) | ≤ 5s | Cliente-side rendering |
| Exportar CSV (1000 entradas) | ≤ 3s | Client-side |
| Scroll infinito (nuevo lote al 80%) | Sin jank | 60fps durante scroll |

**Virtualización:** El timeline usa virtual scrolling si hay más de 200 entradas en el DOM. Solo se renderizan las entradas visibles + 10 de buffer arriba/abajo.

---

## 17. Success Metrics

| Métrica | Target | Cómo se mide |
|---|---|---|
| Tiempo para encontrar acción específica | ≤ 10s | Telemetría (SDD-004) |
| Tiempo para reconstruir historia de entidad | ≤ 30s | Analytics |
| Tasa de uso de timeline por revisor fiscal | ≥ 90% de sesiones | Telemetría |
| Tasa de uso de exportación | ≥ 30% de revisores/mes | Analytics |
| Entradas promedio por acción fiscal | 1 entrada por acción | Sistema |
| Satisfacción con claridad del timeline | ≥ 80% | Encuesta trimestral |
| Tasa de errores de interpretación | ≤ 5% | Test de usabilidad |
| NPS "confianza en auditoría" | ≥ 80 | Encuesta trimestral |
| Tiempo medio para exportar PDF (< 100 entradas) | ≤ 3s | Analytics |
| Tasa de usuarios que usan filtros | ≥ 50% | Telemetría |



---

## 18. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Volumen excesivo de entradas degrada performance del timeline | Alta | Alto | Virtualización por defecto desde 200 entradas. Paginación + scroll infinito. Backend con cursor-based pagination. |
| Usuarios no entienden el timeline y lo ignoran | Media | Alto | Onboarding guiado en primera visita. Tooltips contextuales en cada tipo de entrada. |
| Acciones sin registro (eventos perdidos) | Baja | Crítico | Sistema de colas con retry + dead letter queue. Health check diario de integridad del audit trail. |
| Exportación PDF demasiado grande para descargar | Media | Bajo | Límite de 500 entradas por PDF. Opción de exportación por lotes. Compresión de imágenes en evidencia. |
| Diferencia de tiempo servidor/cliente confunde la cronología | Media | Medio | Todos los timestamps se muestran en UTC + zona horaria del usuario. Indicador claro de "hora local" vs "hora servidor". |
| Usuario malicioso intenta alterar el audit trail | Baja | Crítico | Append-only en backend. Firma hash por lote de entradas. Logs de acceso al audit trail. |
| Confusión entre timeline global y timeline de entidad | Media | Medio | Breadcrumb claro: "Audit Trail > RUC 20123456789 > DET Marzo 2026". Colores diferentes entre vistas. |

---

## 19. Dependencias

| SDD / Sistema | Tipo | Descripción |
|---|---|---|
| SDD-001 §6, §7, §8 | Input | Arquetipos de usuario, roles operacionales, JTBDs para diseño del timeline |
| SDD-002 §7.4 | Input | Contrato de Trazabilidad de Auditoría (invariante I5, estados, límites) |
| SDD-003 §4 | Input | Taxonomía de entidades fiscales para target.type |
| SDD-004 | Output | Eventos `audit.*` para telemetría de uso del timeline |
| SDD-005 §15.2 | Input | Atajos de teclado consistentes con el sistema de accesibilidad |
| SDD-006 | Input | EvidenceDepth (L0/L1/L2) y Confidence Score para acciones AI |
| SDD-007 | Input | Niveles L0-L3 para categorización de acciones AI en timeline |
| SDD-008 | Input | Estado de reversibilidad por entrada para indicación visual |
| SDD-009 | Input | RUC scoping: timeline filtrado por RUC activo |
| SDD-010 | Input | Gates de aprobación G1-G5 para mostrar en entradas de approval |
| Backend: Event Store | Input | Sistema de almacenamiento append-only con índice (ruc, periodo, timestamp) |
| Backend: WebSocket | Input | Push de nuevos eventos en tiempo real |
| Frontend: Virtual Scroll | Input | Biblioteca de virtual scrolling para listas largas |

---

## 20. DONE Criteria

- [ ] Timeline vertical implementado con entries, separadores de fecha y badges de estado
- [ ] Modelo EventEntry completo implementado en backend (append-only, inmutable)
- [ ] Timeline filtrable por: período, tipo de acción, actor, rol, fuente, target, fecha exacta, RUC
- [ ] Búsqueda full-text implementada con autocomplete y resaltado
- [ ] Timeline de entidad individual (vista detalle) implementado
- [ ] Agrupación de modificaciones con diff view (antes/después)
- [ ] Acciones AI distinguidas visualmente con badge L1/L2/L3 y confidence score
- [ ] Exportación a PDF, CSV, JSON y HTML implementada con configuración
- [ ] Estados del timeline: loading, empty, error, error parcial, carga incremental, tiempo real, offline
- [ ] Actualización en tiempo real vía WebSocket con badge "N nuevas entradas"
- [ ] Integración con reversibilidad (SDD-008): indicación visual, countdown, agrupación reversible
- [ ] Virtualización desde 200 entradas
- [ ] WCAG 2.2 AA+: timeline semántico, navegación teclado, live regions, contraste
- [ ] Atajos de teclado: flechas, Enter, Ctrl+F, Ctrl+E, R, F, P
- [ ] Performance budget validado: carga inicial ≤ 1.5s, filtros ≤ 300ms
- [ ] Tests: carga, filtros, exportación, tiempo real, reversión, virtual scroll
- [ ] Telemetría de eventos de timeline (vistas, uso de filtros, exportaciones)

---

## 21. Changelog

| Fecha | Cambio | Autor |
|---|---|---|
| 2026-07-14 | Versión inicial | SDD-011 |

---

> **Siguiente:** SDD-012 — Fiscal Notification System

