---
status: reference
normative: false
consumed_by: SDD-007
---

---
title: "SDD-013 — Patrones de Recuperación de Errores"
status: draft
ola: 2 — Fiscal Trust Core
invariants: [I1, I2, I4, I6, I7, I8, I9, I11, I14]
---

# SDD-013 — Patrones de Recuperación de Errores

**Última actualización**: 2026-07-14

**Estado**: Draft | **Prioridad**: Alta | **Audiencia**: UX, Frontend, API, QA

---

## 1. Abstract

Hoy, cuando algo sale mal en un sistema fiscal —un envío a SUNAT falla, un cálculo de IGV no cuadra, un periodo se cierra incorrectamente— el usuario recibe un mensaje de error genérico y se queda sin saber qué hacer. En Drenyra, los errores fiscales tienen consecuencias reales: multas, intereses, tickets abiertos. No podemos tratarlos como "algo salió mal, intente de nuevo".

Este SDD define un sistema de recuperación de errores diseñado específicamente para el dominio fiscal: errores que *deben* entenderse, resolverse y demostrarse. Cada error tiene una ruta de recuperación, y cada ruta deja evidencia.

---

## 2. North Star

> "Que un contador encuentre un error, entienda por qué pasó, y sepa exactamente qué hacer —en menos de 30 segundos— con la confianza de que la acción correctiva queda registrada."

---

## 3. Problem Statement

### 3.1 El costo de los errores fiscales invisibles

| Problema | Costo |
|---|---|
| Error de envío SUNAT ignorado | Multa por declaración fuera de plazo |
| Cálculo incorrecto no detectado | Intereses moratorios + rectificatoria |
| Acción ejecutada dos veces por confusión | Duplicidad de comprobantes |
| Error sin rastro de resolución | Auditoría externa descubre inconsistencia sin explicación |
| Sistema dice "Error 500" | Contador bloqueado sin saber next step |

### 3.2 Estado actual en sistemas fiscales

- Mensajes de error técnicos expuestos al usuario
- Sin diferenciación entre error recuperable vs irreversible
- Sin rutas de acción sugeridas
- Sin integración con audit trail
- Sin estado de resolución: resuelto vs pendiente vs ignorado

### 3.3 Por qué es diferente en Drenyra

Un error no es un bug. Es un **evento fiscal** que puede requerir:
- Reintento con backoff (ej: SUNAT timeout)
- Acción correctiva manual (ej: correlativo saltado)
- Compensación (ej: nota de crédito)
- Reversión (ej: asiento contable erróneo)
- Aprobación antes de corregir (SDD-010)
- Evidencia de resolución (SDD-006)

---

## 4. User Research Links

- **SDD-001**: P2-P5 arquetipos mencionan frustración con errores opacos
- **SDD-002**: Contrato de Evidencia exige que errores y resoluciones sean demostrables
- **SDD-002**: Contrato de Reversibilidad distingue errores reversibles vs irreversibles
- **SDD-006**: Sistema de Evidencia debe capturar datos del error y de la resolución
- **SDD-008**: Reversibilidad define ventanas de corrección
- **SDD-010**: Approval Gates pueden requerir aprobación para ciertas correcciones
- **SDD-011**: Audit Trail debe registrar errores y resoluciones

---

## 5. Invariantes Afectados

| ID | Invariante | Relación |
|---|---|---|
| I1 | RUC Scoping | Error siempre asociado a RUC+periodo |
| I2 | Explicabilidad | Error debe explicar causa y qué significa para el usuario |
| I4 | Audit Trail | Error + resolución quedan registrados |
| I6 | Evidence-first | Cada resolución de error produce evidencia |
| I7 | Progressive Disclosure | Error se muestra primero como indicador, luego detalle bajo demanda |
| I8 | Offline Resilience | Errores offline se encolan y reintentan |
| I9 | Keyboard-first | Navegación de errores sin mouse |
| I11 | Performance | Error banner no debe bloquear render |
| I14 | Bundle Discipline | Error recovery patterns no deben duplicar lógica de estado |

---

## 6. L0-L3 Mapping

| Nivel | Errores |
|---|---|
| **L0 Explain** | Error detectado, explicado en lenguaje natural, con causa probable |
| **L1 Recommend** | Error + 1-3 sugerencias de acción ordenadas por probabilidad |
| **L2 Prepare** | Error + acción correctiva pre-llenada lista para revisar |
| **L3 Execute** | Error corregido automáticamente con notificación + evidencia (solo recuperables) |

Regla: L3 solo aplica a errores de tipo `recoverable` con confianza > 0.9 y ventana de reversión activa.

---

## 7. Catálogo de Errores Fiscales

### 7.1 Taxonomía

```
Error
├── RECOVERABLE
│   ├── RETRYABLE      → reintento automático o manual
│   ├── CORRECTABLE    → acción correctiva específica
│   └── COMPENSABLE    → requiere acción compensatoria (NC, ND)
├── IRREVERSIBLE
│   ├── DATA_LOSS       → información perdida sin recuperación
│   ├── DEADLINE_PASSED → plazo fiscal vencido
│   └── INVALID_STATE   → estado fiscal inconsistente sin corrección
└── UNKNOWN
    ├── TRANSIENT       → error temporal (timeout, conexión)
    └── PERMANENT       → error permanente sin clasificar
```

### 7.2 Catálogo completo de errores fiscales

| # | Código | Tipo | Categoría | Ejemplo |
|---|---|---|---|---|
| E01 | `SUNAT_TIMEOUT` | RETRYABLE | SUNAT Conexión | Timeout al enviar CDR |
| E02 | `SUNAT_REJECTED` | CORRECTABLE | SUNAT Validación | CDR rechazado por observación |
| E03 | `SUNAT_INVALID_RUC` | CORRECTABLE | SUNAT Datos | RUC de destinatario no existe |
| E04 | `SUNAT_DUPLICATE` | CORRECTABLE | SUNAT Documento | Serie+correlativo ya registrado |
| E05 | `IGV_MISMATCH` | CORRECTABLE | Cálculo | Base imponible no coincide con IGV |
| E06 | `DETRACTION_MISSING` | COMPENSABLE | Detracción | Operación sujeta sin detracción |
| E07 | `RETENTION_MISMATCH` | CORRECTABLE | Retención | Tasa de retención incorrecta |
| E08 | `PERIOD_CLOSED` | DEADLINE_PASSED | Periodo | Periodo contable ya cerrado |
| E09 | `CORRELATIVE_GAP` | CORRECTABLE | Documentos | Salto en correlativo de serie |
| E10 | `DUPLICATE_ENTRY` | CORRECTABLE | Documentos | Mismo comprobante ingresado dos veces |
| E11 | `BALANCE_MISMATCH` | INVALID_STATE | Conciliación | Saldo contable vs fiscal no cuadran |
| E12 | `APPROVAL_EXPIRED` | DEADLINE_PASSED | Aprobaciones | Gate de aprobación venció |
| E13 | `SESSION_EXPIRED` | RETRYABLE | Sesión | Sesión expiró durante operación |
| E14 | `NETWORK_OFFLINE` | RETRYABLE | Conectividad | Sin conexión a internet |
| E15 | `RATE_LIMITED` | RETRYABLE | API | Demasiadas solicitudes |
| E16 | `DATA_INTEGRITY` | IRREVERSIBLE | Sistema | Inconsistencia en base de datos |
| E17 | `CONCURRENT_MODIFICATION` | CORRECTABLE | Concurrencia | Dos usuarios modificaron el mismo recurso |
| E18 | `INVALID_TRANSITION` | CORRECTABLE | Estado | Acción no permitida en estado actual |
| E19 | `THRESHOLD_EXCEEDED` | CORRECTABLE | Reglas | Monto supera umbral de aprobación |
| E20 | `RECONCILIATION_GAP` | COMPENSABLE | Conciliación | Diferencia no explicada entre libros |

### 7.3 Propiedades por error

Cada error del catálogo tiene:

| Propiedad | Descripción |
|---|---|
| `code` | Código único (E01-E20) |
| `type` | recoverable / irreversible / unknown |
| `category` | Subcategoría de recuperación |
| `domain` | Área fiscal afectada |
| `severity_default` | critical / warning / info |
| `auto_retry` | true / false |
| `recovery_paths` | Array de RecoveryPath disponibles |
| `needs_approval` | Gate requerido (G1-G5, null si none) |
| `evidence_required` | Nivel L0-L2 de evidencia necesario |
| `reversal_window` | Ventana de reversión (si aplica, formato ISO 8601 duration) |
| `user_message_template` | Plantilla de mensaje para usuario |
| `action_template` | Plantilla de acción sugerida |

---

## 8. UI Patterns de Recuperación

### 8.1 Componentes

#### 8.1.1 Error Banner (Inline)

- Background rojo/ámbar según severidad (Critical rojo, Warning ámbar)
- Icono: ⚠️ (warning) o 🚫 (irreversible)
- Mensaje: "No se pudo enviar la factura F001-123 a SUNAT"
- Badge de tipo: `RECUPERABLE` / `IRRECUPERABLE` / `REINTENTABLE`
- Botones: Reintentar corregir / Ver detalle / Ignorar
- En L1+: "Sugerencia: Verifica que el RUC 20123456789 existe en SUNAT"

#### 8.1.2 Error Toast (Temporal)

- Severidad: crítico 30s / warning 15s / info 8s
- Botón "Ver detalle" mantiene toast abierto
- Toast no se cierra sobre error crítica hasta que usuario acciona
- En L3: "Error corregido automáticamente — Revisar evidencia"

#### 8.1.3 Error Detail Panel (Flyout/Bottom Sheet)

- Abre desde banner o toast
- Muestra: código de error (E01), timestamp, RUC+periodo
- Causa probable: texto en lenguaje natural
- Recovery path: lista de pasos ordenados
- Evidence snapshot: payload en el momento del error
- Botón "Iniciar recuperación" (si recoverable)
- Enlace a audit trail (SDD-011)

#### 8.1.4 Error List (Centro de Errores)

- Ruta: `/errors` o acceso desde sidebar
- Tabla de errores con filtros por:
  - Tipo (recoverable/irreversible/unknown)
  - Severidad (critical/warning/info)
  - Categoría (SUNAT/cálculo/documentos/etc.)
  - Estado (pending/resolved/ignored/escalated)
  - RUC, Periodo, Fecha
- Acciones por fila: Resolver, Ignorar, Ver detalle, Exportar
- Vista de detalle expandible inline
- URL state persistente (filtros + paginación)
- Export CSV con datos del error + resolución

### 8.2 Flujo de Recuperación

```
Error detectado
    │
    ▼
Banner/Toast aparece
    │
    ├── Recuperable ──► Panel detalle ──► Recovery Path ──► Ejecutar ──► Evidencia
    │                       │                │                  │
    │                       │                ├── Automático     │
    │                       │                └── Manual paso    │
    │                       │                      a paso       │
    │                       └── Ignorar ──► Error marcado       │
    │                                             como ignorado  │
    │                                                             │
    ├── Irreversible ──► Panel detalle ──► Acción compensatoria
    │                                          │
    │                                          └── Evidencia de
    │                                              compensación
    │
    └── Descartar ──► Error archivado
```

### 8.3 Estados de Error

| Estado | Descripción | Acción esperada |
|---|---|---|
| `pending` | Error no atendido | Recovery path disponible |
| `in_progress` | Recuperación iniciada | Continuar/cancelar |
| `resolved` | Error corregido | Ver evidencia |
| `compensated` | Error compensado | Ver evidencia de compensación |
| `ignored` | Usuario ignoró | Puede reabrirse |
| `escalated` | Escalado a soporte | Ticket de referencia |
| `expired` | Ventana de reversión venció | Sin acción posible |
| `automatically_resolved` | L3 resolvió sin intervención | Ver evidencia |

---

## 9. Recovery Paths

### 9.1 Recovery Path model

```typescript
interface RecoveryPath {
  id: string
  errorCode: string
  label: string
  steps: RecoveryStep[]
  risk: 'none' | 'low' | 'medium' | 'high'
  requiresApproval: boolean
  approvalGate?: GateLevel
  estimatedTime: string // "30s", "2min", etc.
}

interface RecoveryStep {
  order: number
  instruction: string // "Verifica que el RUC existe en SUNAT"
  action?: {
    type: 'redirect' | 'open_panel' | 'execute' | 'confirm'
    target?: string // ruta o comando
  }
  autoResolve?: boolean // L2+: puede resolverse automáticamente
}
```

### 9.2 Catálogo de Recovery Paths

| Path | Errores aplicables | Pasos | Riesgo |
|---|---|---|---|
| `RETRY_CDR` | E01 | 1. Verificar conectividad 2. Reintentar envío 3. Verificar CDR recibido | none |
| `FIX_SUNAT_DATA` | E02, E03, E04 | 1. Revisar observación SUNAT 2. Corregir datos 3. Reenviar | low |
| `RECALCULATE_IGV` | E05 | 1. Verificar base imponible 2. Recalcular IGV 3. Validar resultado | low |
| `ADD_DETRACTION` | E06 | 1. Calcular detracción 2. Registrar depósito 3. Vincular a operación | medium |
| `FIX_RETENTION` | E07 | 1. Verificar tasa aplicable 2. Corregir retención 3. Recalcular | low |
| `REOPEN_PERIOD` | E08 | 1. Solicitar reapertura 2. Aprobación (G4) 3. Realizar corrección 4. Cerrar periodo | high |
| `FILL_CORRELATIVE` | E09 | 1. Identificar correlativo faltante 2. Emitir documento 3. Vincular | medium |
| `DEDUPLICATE` | E10 | 1. Identificar duplicado 2. Anular/eliminar 3. Confirmar | low |
| `RECONCILE_BALANCE` | E11 | 1. Comparar saldos 2. Identificar diferencias 3. Ajustar 4. Validar | medium |
| `REAPPROVE` | E12 | 1. Reenviar para aprobación 2. Notificar a aprobador | low |
| `REAUTHENTICATE` | E13 | 1. Iniciar sesión 2. Retomar operación | none |
| `QUEUE_OFFLINE` | E14 | 1. Operación en cola offline 2. Reintentar al reconectar | none |
| `BACKOFF_RETRY` | E15 | 1. Esperar N segundos 2. Reintentar automático | none |
| `RESOLVE_CONFLICT` | E17 | 1. Recargar datos 2. Revisar cambios concurrentes 3. Elegir versión a mantener 4. Reaplicar | medium |
| `ESCALATE` | E16 | 1. Contactar soporte 2. Proporcionar ID de error 3. Ticket de referencia | high |
| `COMPENSATE_NC` | E06, E11, E20 | 1. Emitir nota de crédito 2. Vincular a operación original 3. Sustentar | high |

---

## 10. Technical Design

### 10.1 Error Registry

```typescript
interface FiscalError {
  id: string
  code: ErrorCode
  severity: 'critical' | 'warning' | 'info'
  status: ErrorStatus
  message: string
  detail: string
  causeLabel: string // "Causa probable: Conexión a SUNAT interrumpida"
  ruc: RUC
  periodo: Periodo
  timestamp: DateTime
  resolvedAt?: DateTime
  resolution?: ErrorResolution
  recoveryPath?: RecoveryPath
  evidenceId?: string
  sessionId: string
  source: 'api' | 'sync' | 'agent' | 'user'
  metadata: Record<string, unknown>
}

interface ErrorResolution {
  pathId: string
  steps: {
    step: number
    action: string
    result: 'success' | 'failure' | 'skipped'
    timestamp: DateTime
  }[]
  approvedBy?: string
  evidenceSnapshot: string // URL o ID
}
```

### 10.2 Error Pipeline

```
Source (API/Sync/Agent/User)
    │
    ▼
Error Detection Layer
    │
    ├── Classify (type, severity, category)
    ├── Match (to catalog + recovery paths)
    ├── Enrich (RUC, periodo, session, metadata)
    │
    ▼
Error Store (IndexedDB + Server)
    │
    ▼
UI Dispatch
    │
    ├── Global State (Zustand store)
    ├── Badge count (header)
    ├── Banner (inline for active errors)
    ├── Toast (for transient errors)
    └── Error List (/errors)
```

### 10.3 Auto-Retry Strategy

| Tipo | Estrategia | Máximo |
|---|---|---|
| SUNAT_TIMEOUT | Exponential backoff: 5s, 15s, 45s | 3 intentos |
| NETWORK_OFFLINE | Reintento al reconectar | Ilimitado |
| RATE_LIMITED | Retry-After header | 1 intento |
| SESSION_EXPIRED | Re-autenticar + replay | 1 intento |

### 10.4 Offline Queue

- Errores offline se almacenan en IndexedDB (máx 200)
- Al reconectar: replay FIFO con 1s de intervalo
- Cada replay registra resultado en audit trail
- Si replay falla, error sube a `pending` para acción manual

### 10.5 Error Deduplication

- Misma combinación `code + RUC + periodo + metadata_hash` en ventana de 5min = mismo error
- Se actualiza `lastOccurred` y `count` en lugar de crear nuevo
- Si count > 3 en 15min, escalar severidad a critical

---

## 11. States Matrix

| Estado \ Condición | Visual | Acción |
|---|---|---|
| **Loading** | Skeleton de 3 líneas | - |
| **Empty** | "Sin errores en este periodo" con icono ✅ | Botón "Revisar todo" |
| **Error (fetch falló)** | "No pudimos cargar los errores" | Botón reintentar |
| **Pending** | Banner rojo/ámbar con icono ⚠️ | Ver detalle / Ignorar |
| **In Progress** | Banner azul con spinner | Continuar / Cancelar |
| **Resolved** | Banner verde con icono ✅ | Ver evidencia |
| **Ignored** | Banner gris, minimizado | Reabrir / Confirmar |
| **Escalated** | Banner naranja con ID de ticket | Ver ticket |
| **Expired** | Banner gris oscuro con icono 🚫 | Acción compensatoria (si aplica) |
| **Auto-resolved** | Banner verde con icono 🤖 | Ver evidencia |

---

## 12. Integration Points

| Integración | SDD | Propósito |
|---|---|---|
| Audit Trail | SDD-011 | Registrar error + resolución |
| Reversibilidad | SDD-008 | Ventanas de reversión por error |
| Evidencia | SDD-006 | Snapshot de evidencia al resolver |
| Approval Gates | SDD-010 | Aprobación requerida para ciertas correcciones |
| Notification System | SDD-012 | Notificar errores críticos |
| RUC Scoping | SDD-009 | Error siempre scoped a RUC+periodo |
| Telemetría | SDD-004 | Contar tipos de error, tiempo de resolución |
| Audit Trail Visual | SDD-011 | Timeline de error + resolución |

---

## 13. Accessibility Requirements

| WCAG Criterio | Cómo se cumple |
|---|---|
| 2.2.1 Timing adjustable | Auto-retry no bloquea al usuario, puede cancelar |
| 2.4.3 Focus Order | Error banner recibe focus automático |
| 3.3.1 Error Identification | Mensaje describe error en texto |
| 3.3.3 Error Suggestion | Sugerencia de acción concreta |
| 4.1.3 Status Messages | `role="alert"` en banner crítico, `role="status"` en info |
| 2.1.1 Keyboard | Shortcut `Ctrl+E` abre centro de errores |
| 1.4.1 Use of Color | Icono + texto + color (no solo color) |

---

## 14. Performance Budget

| Métrica | Target |
|---|---|
| Error banner renders in | < 50ms |
| Error list loads | < 200ms (100 errores) |
| Recovery path suggestion | < 100ms |
| Auto-retry decision | < 10ms |
| Offline queue replay | < 500ms/error |
| Error dedup check | < 5ms |

---

## 15. Success Metrics

| Métrica | Target | Cómo se mide (SDD-004) |
|---|---|---|
| Tiempo promedio para entender error | < 15s desde que aparece el banner | User action timing |
| Tasa de resolución sin escalar | > 80% de errores recoverable | Error status tracking |
| Tiempo promedio de resolución | < 2min para errores recoverable | Error → Resolved |
| Recurrencia de mismo error | < 10% semanal | Dedup count |
| Errores ignorados con impacto fiscal | < 1% | Severity tracking |
| Usuarios que usan recovery path sugerido | > 70% | Path click rate |
| Satisfacción con mensaje de error | > 4/5 en encuesta in-app | User feedback |

---

## 16. Risks and Mitigations

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Recovery path incorrecto sugerido | Baja | Medio | Mostrar como sugerencia, nunca como acción forzada |
| Error se vuelve irreparable mientras usuario veía recovery | Media | Alto | Re-evaluar estado del error antes de cada paso |
| Usuario ignora error crítico y olvida | Media | Alto | Re-notificar (SDD-012) + escalar severidad con tiempo |
| Auto-retry causa duplicados | Baja | Alto | Idempotencia en API + verificación antes de reintentar |
| Offline queue overflow | Baja | Medio | Límite FIFO de 200 + notificar al usuario |
| Error falso positivo detectado | Media | Medio | Confianza < 0.9 mostrar como "posible error" |
| Conflicto entre recovery paths | Baja | Alto | Solo un path activo por error, cancelar path inicia nuevo |

---

## 17. Dependencies

| Dependencia | Tipo | Para qué |
|---|---|---|
| SDD-002 — Trust Contracts | Invariante | Evidence, reversibility, progressive disclosure |
| SDD-006 — Evidence System | API | Evidencia de error y resolución |
| SDD-008 — Reversibility | API | Ventanas de reversión por error |
| SDD-010 — Approval Gates | API/Permissions | Aprobación para recovery paths críticos |
| SDD-011 — Audit Trail | API | Registro de error y resolución |
| SDD-012 — Notification System | API | Notificar errores críticos |
| SDD-004 — Telemetry | API | Métricas de error |
| Error classification API | Backend | Catálogo de errores con server-side rules |
| State management store | Frontend | Zustand store para error state |

---

## 18. Non-Goals

- No reemplazar validación de formularios inline (campos individuales)
- No definir el sistema de logging interno (error logging server-side)
- No implementar el escalamiento a soporte humano (solo placeholder)
- No definir el formato de exportación de errores (hereda de SDD-011)
- No cubrir errores de UI widget-level (botón, input, etc.)

---

## 19. DONE Criteria

1. [ ] Catálogo de 20 errores fiscales implementado con properties
2. [ ] Error Banner inline con mensaje + recovery path disponible
3. [ ] Error Toast para errores temporales con auto-dismiss por severidad
4. [ ] Error Detail Panel con causa probable + recovery path
5. [ ] Centro de Errores (`/errors`) con tabla, filtros, URL state
6. [ ] Recovery paths implementados para errores recoverable
7. [ ] Auto-retry con exponential backoff para RETRYABLE errors
8. [ ] Offline queue con replay FIFO
9. [ ] Deduplication de errores (mismo code + RUC + periodo en 5min)
10. [ ] Error state store (Zustand) con badge en header
11. [ ] Estados visuales: pending, resolved, ignored, escalated, expired
12. [ ] L0-L3 mapping functional (Explain/Recommend/Prepare/Execute)
13. [ ] Error + resolución registrados en Audit Trail (SDD-011)
14. [ ] Evidencia generada al resolver cada error (SDD-006)
15. [ ] WCAG: `role="alert"`, `role="status"`, keyboard shortcut
16. [ ] Performance budget: banner < 50ms, list < 200ms
17. [ ] Success metrics instrumentadas (SDD-004)
18. [ ] Tests: unit (catalog, dedup, recovery path match) + integration (pipeline, offline queue)
19. [ ] E2E: error detection → banner → recovery → resolution → evidence

---

## 20. Changelog

| Fecha | Cambio | Autor |
|---|---|---|
| 2026-07-14 | Creación inicial del documento | — |

---

**Próximo SDD**: SDD-014 — Evidence-first content strategy (Ola 2, Fiscal Trust Core).
