---
status: reference
normative: false
consumed_by: SDD-010
---

---
title: "SDD-009 — Tenant/RUC Scoping Visible"
description: "Sistema visual de alcance por RUC — selector, indicadores, modos multi-RUC y barreras de seguridad en la interfaz de Drenyra"
version: "0.1"
tags: [sdd, ux, fiscal-trust, ruc-scope, multi-tenancy]
audience: [ux-engineer, frontend-engineer, product-manager, fullstack-engineer]
status: borrador
last_updated: 2026-07-14
---

> **SDD-009** | Ola 2 — Fiscal Trust Core | **Previsto**: 4 días hábiles

---

## 1. Abstract

SDD-009 define el **sistema visual de alcance por RUC** — el conjunto de componentes, interacciones y reglas que hacen visible, operable y segura la delimitación por RUC en toda la interfaz de Drenyra. No se trata del modelo de datos multi-tenancy (eso es arquitectura de backend), sino de cómo el usuario percibe, controla y nunca viola el alcance de su operación fiscal.

Este SDD concreta el **Contrato de Alcance por RUC** definido en SDD-002 (§7.5) y extiende los modos multi-RUC de SDD-003 (§13) con especificaciones de UI listas para implementación.

---

## 2. North Star

> "Que un contador que atiende 15 RUCs sepa en qué RUC está operando en menos de 200ms, sin leer el número completo, y que nunca realice una operación en el RUC equivocado."

---

## 3. Problem Statement

Los sistemas multi-tenant tradicionales fallan en la experiencia de alcance visible por tres razones:

1. **RUC invisible o secundario.** El RUC activo está en una esquina, en una URL, o en un dropdown colapsado. El usuario opera minutos en el contexto equivocado sin darse cuenta.

2. **Cambio de contexto sin barrera.** Cambiar de RUC es tan fácil como cambiar de pestaña. No hay advertencia de operaciones en curso, borradores no guardados, ni sesiones activas. Un contador puede preparar una declaración de IGV para el RUC 20600000001 pensando que está en el RUC 20123456789.

3. **Mezcla accidental de datos.** Sin separación visual explícita, los datos de dos RUCs pueden aparecer en la misma vista sin que el usuario detecte la contaminación cruzada.

**El costo de un error de alcance es fiscal.** Una declaración presentada en el RUC equivocado genera reparos SUNAT, multas y pérdida de confianza del cliente.

---

## 4. User Research (links a SDD-001)

| Hallazgo SDD-001 | Implicación para SDD-009 |
|---|---|
| P1 (Contador solitario) atiende 5–20 RUCs diarios | Cambio de RUC debe ser ≤ 2 clics, pero con barrera de seguridad |
| P2 (Contador interno) opera 1–3 RUCs fijos | RUC activo debe ser obvio incluso en modo "piloto automático" |
| P3 (Outsourcing) procesa en lote 20+ RUCs | Modo batch multi-RUC requiere confirmación explícita por lote |
| P6 (CFO) revisa consolidado multi-RUC | Modo comparativo necesita cabeceras de RUC siempre visibles al hacer scroll |
| Ansiedad transversal: "operar en el RUC equivocado" | Toda acción crítica debe mostrar RUC destino en el botón de confirmación |

> Ver SDD-001: §5 (segmentación), §6 (arquetipos), §8 (JTBD: "J2: Cambiar de contexto entre RUCs sin perder el estado actual"), §11 (cadencia diaria/mensual).

---

## 5. Invariantes Afectados

| # | Invariante | Prioridad | Relación con SDD-009 |
|---|---|---|---|
| I1 | ✅ Alcance por RUC | **Crítico** | Este SDD es la implementación visible de I1 |
| I7 | ✅ Divulgación progresiva | Alta | El alcance se muestra con profundidad: badge → selector → detalle del RUC |
| I9 | ✅ Keyboard-first | Alta | Selector RUC y cambio de contexto completamente por teclado |
| I11 | ✅ Performance | Media | Cambio de RUC ≤ 500ms, batch multi-RUC ≤ 2s |
| I12 | ✅ WCAG 2.2 AA+ | Alta | RUC selector navegable, cambios anunciados por live region |
| I15 | ✅ Privacidad por defecto | Media | Batch multi-RUC no muestra datos sensibles de otros RUCs sin permiso |

---

## 6. Sistema de Identidad Visual por RUC

Cada RUC debe ser **identificable sin leer el número completo**. El sistema de identidad visual asigna una representación cromática y nemotécnica única por RUC en la sesión activa.

```
┌──────────────────────────────────────────────────────┐
│  [●] Mi Empresa S.A.C.          │ RUC activo        │
│  RUC: 20123456789               │ Badge + color      │
│  ─────────────────────           │                    │
│  [○] Otra Empresa S.R.L.        │ RUCs visitados     │
│  [○] Consultoría & Cía. S.A.C.  │ (recientes)        │
│  [○] + Agregar RUC              │                    │
└──────────────────────────────────────────────────────┘
```

### 6.1 Asignación de Color

- Se asigna un **color de acento** a cada RUC al inicio de la sesión, basado en un hash determinista del RUC (mismo RUC = mismo color siempre).
- La paleta de acentos usa 8 colores perceptualment distintos:
  - `#005CB8` (azul Drenyra), `#E86A17` (naranja), `#1B813E` (verde), `#8B3A8B` (púrpura)
  - `#C62828` (rojo oscuro), `#00695C` (teal), `#F9A825` (ámbar), `#4E342E` (marrón)
- El color se usa en:
  - Borde izquierdo del header del RUC
  - Indicador "●" en el selector
  - Tintado sutil de la cabecera de cada vista scoped a ese RUC
  - Etiquetas de RUC en tablas comparativas multi-RUC

### 6.2 Nemónico

- Cada RUC se muestra como **Razón Social + RUC** en el selector completo.
- En espacios reducidos (badge, table header, breadcrumb), se muestra el **nombre corto** (primeras 20 chars + "...") o el **alias configurable** por el usuario.
- El alias es local (no compartido) y se configura en preferencias del RUC.

### 6.3 Badge de RUC

```
┌──────────────────────────────────────────────────┐
│  ● MI EMPRESA S.A.C.  │  20-12345678-9           │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  ← color de acento
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
└──────────────────────────────────────────────────┘
```

**Reglas del badge:**
- Siempre visible en el header global (posición izquierda superior)
- Muestra: acento de color + nombre corto + RUC formateado (NN-NNNNNNNN-N)
- Al hacer clic: abre el selector completo de RUC
- Tooltip al hover: "RUC activo: {razón social completa} | Última operación: {fecha/hora}"
- En pantallas ≤ 768px: solo muestra el indicador de color + RUC (sin nombre)

---

## 7. Selector de RUC

Componente global para cambiar el contexto RUC activo.

### 7.1 Estados del Selector

| Estado | Visual | Comportamiento |
|---|---|---|
| **Single-RUC** | Badge con nombre + RUC | Selector cerrado, un solo RUC asignado |
| **Multi-RUC** | Badge + indicador "▼ N RUCs" | Al hacer clic: dropdown con lista de RUCs |
| **Loading** | Skeleton de badge (40x24px animado) | Selector no disponible |
| **Error** | Badge con icono ⚠️, RUC desconocido | "No se pudo cargar el contexto. [Reintentar]" |
| **Offline** | Badge normal + indicador "📡 Offline" | Selector solo muestra RUCs cacheados |

### 7.2 Dropdown Multi-RUC

```
┌─────────────────────────────────────────────┐
│  Seleccionar RUC activo                      │
│  ──────────────────────────────────────────── │
│  ● Mi Empresa S.A.C.              [✓]        │ ← RUC activo
│    20123456789 · Última visita: hoy 14:30    │
│  ○ Otra Empresa S.R.L.                       │
│    20456789012 · Pendiente: DET marzo ✱      │ ← notificación
│  ○ Consultoría & Cía. S.A.C.                 │
│    20567890123 · Sin actividad reciente       │
│  ──────────────────────────────────────────── │
│  [🔍 Buscar RUC...]                          │ ← filtro rápido
│  [+ Agregar RUC]                             │ ← onboarding
│  [📊 Vista consolidada]                      │ ← solo admin/global
└─────────────────────────────────────────────┘
```

**Reglas del dropdown:**
- Hasta 20 RUCs: lista completa con scroll nativo
- Más de 20: campo de búsqueda visible por defecto
- Orden: por última visita (más reciente arriba)
- Badge de notificación por RUC: muestra pendientes críticos (DET sin fecha, discrepancias)
- Tecla `Escape` cierra el dropdown sin cambiar
- Al seleccionar un RUC diferente: se activa el protocolo de cambio (§9)

### 7.3 Atajos de Teclado

| Atajo | Acción | Contexto |
|---|---|---|
| `Ctrl+Shift+R` | Abrir selector de RUC | Global |
| `Alt+1` a `Alt+9` | Cambiar a RUC #1–9 en orden de recientes | Global |
| `Ctrl+Period` | Siguiente RUC en orden de recientes | Global |
| `Ctrl+Comma` | RUC anterior en orden de recientes | Global |
| `Escape` | Cerrar selector sin cambiar | Selector abierto |

---

## 8. Modos Multi-RUC: Estados Visuales

Basado en SDD-003 §13. Cada modo tiene un indicador visual y reglas de UI específicas.

### 8.1 Single-RUC (default)

```
Header: [● Mi Empresa S.A.C. | 20123456789]  [📆 Marzo 2026]
──────────────────────────────────────────────────────────────
Toda la interfaz scoped a este RUC.
```

- Badge simple, sin indicador de modo
- Datos, búsqueda, acciones: todo al RUC activo
- Es el modo por defecto al iniciar sesión

### 8.2 Batch Multi-RUC

```
Header: [🎯 Batch: 3 RUCs seleccionados]  [● ● ○]  [📆 Marzo 2026]
────────────────────────────────────────────────────────────────────
Operación: [Generar DET] [Aplicar a: ▾ 3 RUCs]
```

- Selector cambia a modo multi-selección (checkboxes en dropdown)
- Header muestra contador: "Batch: N RUCs seleccionados"
- Indicador visual de progreso: "3/5 completados"
- Cada operación batch requiere confirmación explícita con lista de RUCs destino
- Resultado: reporte por RUC con check/error individual

### 8.3 Comparativo (side-by-side)

```
┌─────────────────────────┬─────────────────────────┐
│ ● Mi Empresa S.A.C.     │ ○ Otra Empresa S.R.L.  │
│ 20123456789             │ 20456789012             │
├─────────────────────────┼─────────────────────────┤
│ IGV: S/ 18,000          │ IGV: S/ 4,500           │
│ Ventas: S/ 100,000      │ Ventas: S/ 25,000       │
│ DET: [Aprobado]         │ DET: [Pendiente]        │
└─────────────────────────┴─────────────────────────┘
```

- Cada columna tiene cabecera RUC fija al hacer scroll (sticky)
- Columnas tintadas con el color de acento del RUC
- Hasta 4 RUCs comparables simultáneamente
- Más de 4: selector de RUCs a comparar + botón [+]
- Celda seleccionada en un RUC → misma celda seleccionada en todos (navegación sincrónica)

### 8.4 Global Admin / Consolidado

```
Header: [👑 Consolidado: 12 RUCs]  [📆 Q1 2026]
─────────────────────────────────────────────────
│ RUC           │ Ingresos    │ IGV      │ DET   │
│ 20123456789   │ S/ 500,000  │ 90,000   │ ✅     │
│ 20456789012   │ S/ 200,000  │ 36,000   │ ⚠️    │
│ ...           │             │          │       │
```

- Solo visible para rol admin/owner (SDD-001 §7)
- Badge global: "👑 Consolidado" en vez de badge de RUC
- Drill-down: clic en fila → cambia a Single-RUC para ese contribuyente
- Exportable completo con todos los RUCs

---

## 9. Protocolo de Cambio de RUC

El cambio de RUC nunca es instantáneo sin verificación.

### 9.1 Flujo de Cambio

```
┌─────────────────────────────────────────────────────┐
│  🔄 Cambiar de RUC                                   │
│  ─────────────────────────────────────────────────── │
│  De: Mi Empresa S.A.C. (20123456789)                 │
│  A:   Otra Empresa S.R.L. (20456789012)              │
│                                                      │
│  ⚠️ Se cerrarán:                                     │
│  • 2 vistas activas (DET, IGV Mensual)               │
│  • 1 borrador no guardado (DET Marzo) → [Guardar]   │
│  • 1 operación L3 en progreso (pausar)              │
│                                                      │
│  [Cancelar]  [Guardar y cambiar]  [Cambiar sin guardar]│
└─────────────────────────────────────────────────────┘
```

### 9.2 Reglas del Protocolo

| Situación | Comportamiento |
|---|---|
| Sin cambios sin guardar | Confirmación simple: "¿Cambiar a X?" [Sí] [No] |
| Con borradores sin guardar | Diálogo con opciones: [Guardar y cambiar] [Descartar] [Cancelar] |
| Con operación L3 en progreso | Operación se pausa (SDD-007). Diálogo: "La operación automática se pausará. Se reanudará al volver." |
| Con advertencias activas | Se preservan y se muestran al volver al RUC original |
| Cambio frecuente (modo batch) | Omitir confirmación si se cambia al mismo RUC dentro de 5 min (con checkbox "No preguntar por 5 min") |

### 9.3 Ventana de Reversión

- Después de cambiar de RUC, aparece un toast: **"Cambiaste a {RUC destino}. [Volver a {RUC origen}]"**
- La ventana de reversión dura **5 minutos**
- Al hacer clic en "Volver", se restaura el estado exacto (vistas abiertas, scroll position, borradores)

---

## 10. Barreras y Advertencias Cross-RUC

### 10.1 En Acciones Críticas

Toda acción fiscal crítica (enviar DET, presentar declaración, aprobar comprobante) debe mostrar el RUC destino **dentro del botón de confirmación**:

```
[✅ Confirmar y enviar DET para RUC 20123456789 — Mi Empresa S.A.C.]
```

No solo en el diálogo — en el botón. Esto crea un "último vistazo" obligatorio.

### 10.2 En Exportaciones

Los archivos exportados (PDF, XLSX, CSV) incluyen:
- En el nombre del archivo: `DET_20123456789_2026-03.pdf`
- En el encabezado del contenido: `RUC: 20123456789 — Mi Empresa S.A.C.`

### 10.3 En Búsqueda Cross-RUC

Cuando el usuario busca en modo Single-RUC y los resultados incluyen datos de otros RUCs:
- Se muestra una separación visual con línea y label "Cross-RUC:"
- Cada resultado cross-RUC lleva el badge de su RUC origen
- El usuario debe confirmar antes de navegar a un resultado de otro RUC

```
Resultados: 5 (2 cross-RUC)
─────────────────────────────────
  [● Mi Empresa] Factura F001-001     ← RUC activo
  [● Mi Empresa] Factura F001-002
───────────────────────────────── Cross-RUC ─
  [○ Otra Emp]  Factura F001-005      ← clic → confirmar cambio
  [○ Otra Emp]  Nota NC01-002
```

### 10.4 En URLs y Bookmarking

Las URLs de Drenyra incluyen el RUC como segmento explícito:

```
/app/{ruc}/tributos/igv
/app/{ruc}/periodo/2026-03/det
/app/batch/?rucs=20123456789,20456789012&operacion=det
```

Esto permite:
- Bookmarking por RUC
- Compartir enlaces con contexto fiscal explícito
- Validación al cargar: "Esta URL corresponde al RUC 20123456789. ¿Tienes acceso?"

---

## 11. RUC Onboarding Flow

### 11.1 Primera Carga sin RUCs Asignados

```
┌───────────────────────────────────────────────────┐
│  👋 Bienvenido a Drenyra                           │
│                                                     │
│  Para empezar, necesitamos saber qué RUCs           │
│  vas a gestionar.                                   │
│                                                     │
│  [➕ Agregar mi primer RUC]                          │
│  [🔗 Estoy invitado a un estudio]                   │
│                                                     │
│  Más adelante puedes agregar más RUCs desde         │
│  Configuración > Contribuyentes.                    │
└───────────────────────────────────────────────────┘
```

### 11.2 Agregar RUC

```
┌───────────────────────────────────────────────────┐
│  Agregar Contribuyente                             │
│  ───────────────────────────────────────────────── │
│  RUC: [________________]  [Buscar]                 │
│  Razón Social: ____________________________        │
│                                                     │
│  ℹ️ Datos que se cargarán automáticamente:          │
│  • Nombre/Razón Social (SUNAT)                     │
│  • Tipo de contribuyente (Persona Natural/Jurídica)│
│  • Régimen tributario                               │
│  • Estado (Activo/Baja de oficio/Suspendido)       │
│  • Domicilio fiscal                                 │
│                                                     │
│  El RUC se verificará contra SUNAT en tiempo real.  │
│  [Cancelar]  [Agregar y configurar]                │
└───────────────────────────────────────────────────┘
```

### 11.3 Multi-RUC por Invitación

El usuario puede ser añadido a RUCs existentes mediante invitación:
- Email de invitación con enlace directo al RUC
- Al aceptar: el RUC aparece en el selector del usuario
- Sin necesidad de credenciales adicionales (RBAC por RUC, SDD-001 §7)

---

## 12. Estados del Sistema RUC

| Estado | UI | Descripción | Acción |
|---|---|---|---|
| **Cargando** | Skeleton header (badge 40x24) + selector deshabilitado | Contexto inicial aún no disponible | Esperar ≤ 500ms |
| **Activo** | Badge normal + selector operativo | RUC válido, operaciones permitidas | Fluido |
| **Sin acceso** | Badge gris "🔒 Sin acceso" | RUC cargado pero sin permisos | Ver permisos con admin |
| **RUC suspendido** | Badge rojo "🚫 RUC suspendido — SUNAT" | RUC dado de baja o suspendido por SUNAT | Modo solo lectura, no operaciones |
| **RUC expirado** | Badge naranja "⚠️ RUC expirado — renovar registro" | Registro mercantil vencido | Notificación + acción de renovación |
| **Error de conexión** | Badge normal + indicador "📡 Offline" | Datos cacheados, sin conexión SUNAT | Operaciones limitadas a datos locales |
| **Sin RUCs** | Pantalla de onboarding | Usuario nuevo sin RUCs asignados | Flujo de onboarding (§11) |
| **Límite excedido** | Badge con contador "20/20 RUCs" | Se alcanzó el límite del plan | Upgrade plan o gestionar RUCs existentes |

---

## 13. RUC en Componentes Específicos

### 13.1 En Tablas

- Cada fila en tablas multi-RUC lleva badge de RUC (color + nombre corto)
- En modo Single-RUC: la cabecera de tabla especifica "Datos de: {RUC}"
- En tablas comparativas: cabeceras de columna con badge + nombre completo

### 13.2 En Formularios

- El RUC destino aparece como campo de solo lectura al inicio del formulario
- Si el formulario permite selección de RUC (modo batch): dropdown con checkboxes + badge de selección
- Al enviar: confirmación incluye RUC en el botón de submit

### 13.3 En Notificaciones y Toasts

```
┌──────────────────────────────────────────┐
│  [● Mi Empresa] 📄 DET Marzo aprobado    │
│  La declaración fue enviada a SUNAT      │
│                               [14:23]    │
└──────────────────────────────────────────┘
```

Toda notificación lleva el badge del RUC al que pertenece.

### 13.4 En Reportes e Impresión

- Header de reporte incluye RUC + razón social
- Cada página tiene footer con RUC
- Nombre de archivo: `{tipo}_{ruc}_{periodo}.pdf`
- Reporte multi-RUC: índice con lista de RUCs, cada sección separada con cabecera de RUC

### 13.5 En el Timeline de Auditoría (SDD-002 §8)

Cada entrada del timeline incluye el RUC como campo explícito:

```
[🕐 14:23:15] RUC: 20123456789 — admin@ → Actualizó DET
```

---

## 14. Accesibilidad

Basado en SDD-005. Requisitos específicos para el sistema RUC:

| Requisito | WCAG | Implementación |
|---|---|---|
| Selector RUC navegable por teclado | 2.1.1 | Dropdown con Tab + Arrow Keys + Enter/Escape |
| Anuncio de cambio de RUC | 4.1.3 | Live region `aria-live="polite"` anuncia: "Contexto cambiado a RUC 20123456789 — Mi Empresa S.A.C." |
| Badge de RUC con aria-label | 1.1.1 | `aria-label="RUC activo: 20123456789 — Mi Empresa S.A.C."` |
| Color no es el único indicador | 1.4.1 | Badge usa color + texto + icono. El color de acento es decorativo, no informativo |
| Contraste de acentos | 1.4.3 | Los colores de acento cumplen contraste 4.5:1 sobre fondo blanco |
| Focus visible en selector | 2.4.7 | Borde de 3px con outline de contraste en elemento seleccionado |
| Skip to content preserva RUC | 2.4.1 | El skip link lleva al contenido, el header con RUC queda fuera del salto |
| Atajo documentado | G001 | Lista de atajos disponible en ayuda: `Ctrl+Shift+R` para selector |

**Live region para cambio de RUC:**
```html
<div aria-live="polite" aria-atomic="true" class="sr-only">
  Contexto cambiado a RUC {ruc} — {razon_social}. Modo: {modo}.
</div>
```

---

## 15. Performance Budget

| Operación | Budget | Medición |
|---|---|---|
| Carga inicial del badge RUC | ≤ 200ms | Time to interactive del header |
| Apertura del selector (≤ 20 RUCs) | ≤ 100ms | Desde clic hasta dropdown visible |
| Apertura del selector (> 20 RUCs) | ≤ 300ms | Con búsqueda incluida |
| Cambio de RUC sin borradores | ≤ 500ms | Recarga de contexto + vistas |
| Cambio de RUC con borradores | ≤ 1s | Incluye diálogo de confirmación |
| Batch multi-RUC (10 RUCs) | ≤ 2s | Operación completa |
| Búsqueda de RUC en selector | ≤ 150ms | Filtro typeahead |
| Badge color hash (determinista) | ≤ 5ms | Sin llamada asíncrona |

---

## 16. Success Metrics

| Métrica | Objetivo | Medición |
|---|---|---|
| Tiempo en identificar RUC activo | ≤ 2s | Eye tracking o test de usuario |
| Cambios de RUC accidentales | ≤ 1/sesión | Telemetría SDD-004 evento `navigation.ruc-switch.accidental` |
| Tasa de confirmación batch multi-RUC | ≥ 95% aceptan sin error | Eventos: batch confirmado vs batch con error de alcance |
| Tiempo en selector (abierto → selección) | ≤ 4s | Analytics de interacción |
| Onboarding RUC completado | ≥ 80% en primer login | Evento de onboarding completado |
| Reversiones de cambio RUC | ≤ 5% de cambios | "Volver" usado dentro de ventana de 5 min |
| Error de alcance detectado por sistema | 100% | Ningún error de alcance llega al usuario |
| NPS "confianza en alcance" | ≥ 70 | Encuesta trimestral |

---

## 17. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Usuario ignora confirmación y opera en RUC equivocado | Alta | Alto | Auditoría detecta y bloquea. El error queda registrado para reversión. |
| Batch multi-RUC falla en un RUC y contamina otros | Media | Alto | Transacciones independientes por RUC. Fallo aísla el RUC específico. |
| Color hash determinista asigna dos RUCs colores similares | Baja | Medio | Paleta de 8 colores perceptualment distintos validada con daltonismo. |
| Usuario con 100+ RUCs tiene selector inmanejable | Media | Alto | Búsqueda visible por defecto en > 20 RUCs. Paginación o agrupación por cliente. |
| El badge de RUC ocupa espacio crítico en mobile | Alta | Medio | Modo responsive: badge → solo indicador de color + RUC, nombre en tooltip. |
| Offline + cambio de RUC: datos no disponibles | Media | Alto | Badge offline visible. Selector solo muestra RUCs cacheados con fecha. |

---

## 18. Dependencias

| SDD / Sistema | Tipo | Descripción |
|---|---|---|
| SDD-001 | Input | Roles, personas, segmentación multi-RUC |
| SDD-002 §7.5 | Input | Contrato de Alcance por RUC (invariante, estados, recuperación) |
| SDD-003 §13 | Input | Modos multi-RUC (Single/Batch/Comparativo/Global) |
| SDD-004 | Output | Evento `navigation.ruc-switch` para telemetría de cambios |
| SDD-005 | Output | Atajos de teclado para selector (sección 7.3), live region (sección 14) |
| SDD-007 | Output | RUC baja a L0 al cambiar de RUC |
| SDD-008 | Input | Ventana de reversión de 5 min para cambio de RUC |
| Backend: RUC API | Input | Endpoints para validar, buscar y asignar RUCs |
| Backend: Permisos RBAC | Input | Permisos por rol × RUC (SDD-001 §7) |

---

## 19. DONE Criteria

- [ ] Componente `<RucSelector>` implementado con los estados de §7.1
- [ ] Badge de RUC en header global, siempre visible
- [ ] Sistema de color hash determinista por RUC (paleta 8 colores)
- [ ] Dropdown multi-RUC con búsqueda, orden por última visita
- [ ] Protocolo de cambio de RUC con confirmación según §9.2
- [ ] Ventana de reversión de 5 min post-cambio
- [ ] Modos multi-RUC visuales: Single, Batch, Comparativo, Global
- [ ] RUC en botones de confirmación de acciones críticas (§10.1)
- [ ] Separación visual cross-RUC en búsqueda (§10.3)
- [ ] URLs con RUC explícito `/app/{ruc}/...`
- [ ] Onboarding para primer RUC y agregar RUC
- [ ] Live region ARIA para cambio de RUC
- [ ] Atajos de teclado `Ctrl+Shift+R`, `Alt+N`
- [ ] Tests: cambio de RUC, batch multi-RUC, barreras cross-RUC
- [ ] Telemetría de cambios accidentales (evento `navigation.ruc-switch`)
- [ ] Performance: cambio de RUC ≤ 500ms

---

## 20. Changelog

| Fecha | Cambio | Autor |
|---|---|---|
| 2026-07-14 | Versión inicial | SDD-009 |

---

> **Siguiente:** SDD-010 — Human Approval Gates
