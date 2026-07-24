---
status: reference
normative: false
consumed_by: SDD-057
---

---
title: "SDD-012 — Fiscal Notification System"
description: "Sistema de notificaciones fiscales contextuales — alertas con propósito, sin spam, integradas al flujo de trabajo del contador"
version: "0.1"
tags: [sdd, ux, fiscal-trust, notifications, alerts, real-time]
audience: [ux-engineer, frontend-engineer, product-manager, fiscal-architect, backend-engineer]
status: borrador
last_updated: 2026-07-14
---

# SDD-012 — Fiscal Notification System

**Last updated**: 2026-07-14
**Content type**: UX Specification
**Status**: Draft
**Priority**: P1 — Trust Core

---

## 1. Abstract

Los contadores reciben decenas de notificaciones diarias: SUNAT, clientes, bancos, sistemas internos. El ruido es constante. En Drenyra, las notificaciones fiscales compiten con ese ruido — y pierden. Hoy el sistema notifica todo: desde un cambio menor hasta una detracción por vencer. El resultado es fatiga de alertas, desactivación masiva, y contadores que se enteran de vencimientos críticos cuando ya es tarde.

Este SDD define un sistema de notificaciones fiscales que prioriza por urgencia fiscal, canaliza por contexto (in-app, push, email, SMS según criticidad), y respeta la atención del contador. No es un centro de notificaciones genérico. Es un sistema que entiende que "mañana vence el PDT" no es lo mismo que "se generó un comprobante".

## 2. North star

> Que un contador pueda trabajar 4 horas sin distracciones y al cerrar el día encuentre exactamente lo que requiere atención, ordenado por riesgo fiscal real.

El sistema no compite por atención. La gana cuando importa.

## 3. Problem statement

### 3.1 El problema actual

Drenyra hoy notifica sin jerarquía fiscal:
- Todo evento genera notificación
- No hay diferenciación entre informativo, urgente, y crítico
- No hay canales diferenciados por severidad
- No hay consolidación de eventos relacionados
- El contador se acostumbra al ruido y empieza a ignorar todo

### 3.2 Síntomas medibles

- Notificaciones ignoradas > 48h (target actual > 60%)
- Desactivación de notificaciones en primeros 7 días
- Falta de trazabilidad: "me llegó una notificación pero no la vi"
- Quejas de usuarios que no se enteraron de vencimientos
- Usuarios que prefieren usar calendario externo antes que el sistema

### 3.3 Por qué es un problema fiscal (no solo de UX)

Una notificación fiscal ignorada puede significar:
- Multa por PDT fuera de plazo
- Detracción no depositada
- Declaración rectificatoria fuera de ventana
- Intereses moratorios por pago tardío

El sistema de notificaciones NO es un feature opcional. Es un mecanismo de prevención de daño fiscal.

## 4. User research links

Este SDD se basa en hallazgos de:
- **SDD-001 — User Roles & Personas**: Segmentación por banda (P1-P8) que determina canal y frecuencia
- **SDD-002 — Fiscal Trust Contracts**: Contrato de Progressive Disclosure (I7) y Audit Trail (I5)
- **SDD-003 — Information Architecture**: Homes por rol, contexto de RUC en notificaciones
- **SDD-004 — UX Telemetry**: Señales de fricción (notifications ignored rate)
- **SDD-010 — Human Approval Gates**: Notificaciones de acciones pendientes de aprobación
- **SDD-011 — Audit Trail Visual**: Notificaciones como entrada al timeline

## 5. Invariantes afectados

| Invariante | Impacto | Cómo lo preserva |
|------------|---------|------------------|
| I1 — RUC scoping | Alto | Toda notificación lleva RUC asociado |
| I2 — Explicabilidad AI | Medio | Notificaciones generadas por AI muestran origen y confianza |
| I3 — Reversibilidad | Bajo | Notificaciones de reversión pendiente |
| I5 — Audit trail | Alto | Toda notificación enviada queda registrada con timestamp |
| I7 — Progressive disclosure | Alto | Canales y frecuencia escalonados por rol y preferencia |
| I8 — Offline resilience | Alto | Cola de notificaciones offline con replay al reconectar |
| I11 — Consistencia perceptual | Medio | Misma taxonomía de severidad en todos los canales |
| I13 — WCAG 2.2 AA+ | Alto | Notificaciones accesibles en todos los canales |
| I15 — Privacy by default | Alto | Datos fiscales no expuestos en notificaciones externas |

## 6. L0-L3 mapping

| Nivel | Notificaciones |
|-------|---------------|
| L0 | Explica por qué llegó la notificación (fuente, evento disparador) |
| L1 | Recomienda acción basada en la notificación con enlace directo |
| L2 | Prepara draft de respuesta a la notificación |
| L3 | Solo eventos críticos sin riesgo de interpretación |

Las notificaciones generadas por AI en L1-L2 siempre llevan el badge `🤖 Generado por AI` y el nivel de confianza del modelo que la generó.

## 7. User flow

### 7.1 Flujo primario: un contador recibe una notificación

```
Evento fiscal → Sistema evalúa severidad y canal → 
  ┌─ [In-app] → Badge en icono campana + toast si está activo
  ├─ [Push] → Notificación en dispositivo móvil
  ├─ [Email] → Correo con resumen y enlace
  └─ [SMS] → Solo críticos, texto plano

Usuario recibe → Abre/ignora → 
  ┌─ Abre: panel de detalle con contexto fiscal completo
  └─ Ignora: sistema registra, re-evalúa en próxima ventana
```

### 7.2 Flujo secundario: acciones post-notificación

```
Desde la notificación el usuario puede:
  ├── Ver detalle completo (L0)
  ├── Aceptar recomendación (L1)
  ├── Ver draft preparado (L2)
  ├── Marcar como revisada
  ├── Posponer (snooze con tiempo configurable)
  └── Silenciar tipo similar (mute conditional)
```

## 8. Taxonomy de notificaciones

### 8.1 Por severidad fiscal

| Severidad | Color | Tiempo de respuesta | Canales | Ejemplos |
|-----------|-------|---------------------|---------|----------|
| **Critical** | 🔴 Rojo | < 24h | In-app + Push + Email + SMS | PDT vence mañana, detracción no depositada, error en envío SUNAT |
| **Warning** | 🟡 Amarillo | < 72h | In-app + Push + Email | Vencimiento en 7 días, documento observado, conciliación pendiente |
| **Info** | 🔵 Azul | < 7d | In-app + Email (resumen) | Comprobante generado, declaración recibida, cambio en datos SUNAT |
| **Success** | 🟢 Verde | N/A | In-app (toast) | Documento aceptado por SUNAT, reversión completada, pago registrado |
| **System** | ⚪ Gris | Según tipo | In-app | Mantenimiento programado, actualización disponible, error de conexión |

### 8.2 Por tipo de evento fiscal

| Categoría | Tipos | Severidad típica |
|-----------|-------|------------------|
| **Vencimientos** | PDT, detracciones, rectificatorias, pagos | Critical / Warning |
| **SUNAT** | CDR recibido, observación, baja, comunicación | Warning / Info |
| **Documentos** | Comprobante emitido/recibido, guía, nota de crédito | Info / Success |
| **Conciliación** | Diferencia detectada, conciliación completada, pendiente | Warning / Info |
| **Aprobaciones** | Solicitud de aprobación (SDD-010), aprobado/rechazado/revocado | Warning / Info |
| **Reversiones** | Reversión solicitada, completada, fallida (SDD-008) | Warning / Critical |
| **AI** | Recomendación generada, draft listo, error en análisis (SDD-007) | Info |
| **Sistema** | Error de conexión, mantenimiento, actualización | System |
| **Multi-RUC** | Cambio de periodo, RUC suspendido, datos desactualizados (SDD-009) | Warning / Info |

### 8.3 Por prioridad de entrega

| Prioridad | Tiempo de entrega | Mecanismo | Comportamiento offline |
|-----------|-------------------|-----------|----------------------|
| **Inmediata** | < 30s | WebSocket + Push | Cola FIFO, replay al reconectar |
| **Diferida** | < 5min | Polling + Push batch | Cache local, consolidar al reconectar |
| **Resumen** | 1/día o 1/semana | Email digest | N/A |
| **Bajo demanda** | Cuando usuario abre | In-app badge | Actualizar al reconectar |

## 9. Componentes de UI

### 9.1 Icono de campana

```
[🔔 3] — Badge en toolbar global
  └── Indicador de severidad máxima presente (punto rojo si hay criticals)
  └── Acceso por teclado: Ctrl+Shift+N
```

### 9.2 Panel de notificaciones (flyout)

```
┌─────────────────────────────────┐
│ 🔔 Notificaciones    [⚙] [✓All] │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 🔴 PDT RUC 20123456789     │ │
│ │   Vence: mañana 23:59      │ │
│ │   Hace 2h · [Ver] [✓] [🔔]  │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 🟡 Detracción pendiente     │ │
│ │   RUC 20123456789 ·         │ │
│ │   MC 345-2026               │ │
│ │   Hace 5h · [Ver] [✓] [🔔]  │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 🔵 CDR recibido             │ │
│ │   FC001-12345 aceptado      │ │
│ │   Hace 1d · [Ver] [✓]       │ │
│ └─────────────────────────────┘ │
│           [Ver todas →]         │
└─────────────────────────────────┘
```

### 9.3 Centro de notificaciones (página completa)

Página `/notificaciones` con:
- **Filtros**: Por severidad, tipo, RUC, periodo, fecha, leído/no leído
- **Búsqueda**: Texto libre sobre contenido de notificaciones
- **Acciones batch**: Marcar todas como leídas, archivar, posponer
- **Configuración**: Preferencias por tipo y canal (recurso compartido con 9.4)
- **Exportar**: Historial de notificaciones en CSV/PDF para auditoría
- **URL state**: Filtros en URL para compartir/enlazar vista filtrada

### 9.4 Configuración de notificaciones

Página `/configuracion/notificaciones` con matriz:

| Tipo de evento | Severidad | In-app | Push | Email | SMS | Snooze default |
|----------------|-----------|--------|------|-------|-----|----------------|
| Vencimiento PDT | Critical | ✓ | ✓ | ✓ | ✓ | 1h |
| Detracción por vencer | Warning | ✓ | ✓ | ✓ | ✗ | 4h |
| CDR recibido | Info | ✓ | ✗ | ✗ | ✗ | - |
| ... | ... | ... | ... | ... | ... | ... |

**Reglas**:
- Canales se auto-deshabilitan por severidad (SMS solo Critical)
- Snooze default configurable por tipo
- Horario silencioso configurable (no notificar entre X e Y horas)
- Días no laborables: las notificaciones critical sí pasan, las demás se difieren

### 9.5 Toast de notificación (in-app)

```
┌───────────────────────┐
│ 🔴 PDT vence mañana   │
│ RUC 20123456789       │
│          [Ver] [✗]    │
└───────────────────────┘
```

- Aparece en esquina inferior derecha
- Auto-dismiss: 8s para Info/Success, 30s para Warning, persistente para Critical
- Stack máximo: 3 toasts visibles simultáneamente
- Accesible: ARIA live region polite/assertive según severidad
- Keyboard: Tab para navegar acciones, Esc para cerrar

## 10. Estados

| Estado | Descripción | Visual |
|--------|-------------|--------|
| **Loading** | Cargando lista de notificaciones | Skeleton de 3 items en panel |
| **Empty** | No hay notificaciones | Icono + "Todo al día. No hay notificaciones pendientes." |
| **Error** | No se pudieron cargar | Mensaje + botón Reintentar |
| **Unread** | No leída | Badge azul + bold en título |
| **Read** | Leída | Normal weight, sin badge |
| **Snoozed** | Pospuesta hasta fecha X | Ocultada del panel principal, visible en "Pospuestas" |
| **Archived** | Archivada por usuario | No visible, recuperable por búsqueda |
| **Expired** | Ventana de acción vencida | Texto tachado + "Vencida" badge gris |
| **Critical overdue** | No leída > ventana crítica | Badge 🔴 + "Requiere atención urgente" |
| **Offline queue** | En cola offline | Indicador en toolbar "3 notif. pendientes" |
| **Batch processing** | Consolidando múltiples eventos | "5 eventos similares agrupados" |

## 11. Reglas de negocio

### 11.1 Thresholds de consolidación

| Condición | Acción |
|-----------|--------|
| 3+ eventos del mismo tipo en 5min | Agrupar en 1 notificación con contador |
| 5+ eventos del mismo RUC en 15min | Agrupar por RUC con detalle expandible |
| Mismo evento re-notificado 3+ veces | Elevar severidad y escalar a canal superior |

### 11.2 Reglas de severidad automática

| Condición | Severidad resultante |
|-----------|---------------------|
| Deadline fiscal < 24h | Critical |
| Deadline fiscal < 7d | Warning |
| Error en comunicación SUNAT | Warning (escala a Critical si persiste > 1h) |
| Acción de L3 ejecutada por AI | Info (Warning si requiere revisión) |
| Reversión fallida | Critical |
| Múltiples reversiones en mismo RUC | Warning (escala si > 3 en 1h) |

### 11.3 Horario de entrega

| Día | Ventana normal | Silent hours |
|-----|---------------|--------------|
| Lunes a viernes | 7:00 - 20:00 | 20:00 - 7:00 |
| Sábado | 8:00 - 14:00 | 14:00 - 8:00 |
| Domingo / feriado | Solo Critical | Todo el día |

En silent hours: Critical sí notifica. Warning e Info se difieren a próxima ventana. Success no se envía.

## 12. Especificaciones técnicas

### 12.1 Modelo de datos (Notification)

```typescript
interface FiscalNotification {
  id: string;                    // UUID v7
  type: NotificationType;        // Vencimiento | SUNAT | Documento | ...
  severity: NotificationSeverity; // Critical | Warning | Info | Success | System
  title: string;                 // Título corto (< 80 chars)
  body: string;                  // Cuerpo (< 280 chars para push)
  ruc: RUC;                      // RUC asociado (I1)
  entityType?: FiscalEntityType; // Tipo de entidad fiscal (SDD-003)
  entityId?: string;             // ID de la entidad
  actionUrl: string;             // Enlace profundo en la app
  source: NotificationSource;    // Sistema | AI | User | SUNAT
  aiConfidence?: number;         // Solo si source = AI (0.0 - 1.0)
  metadata: Record<string, unknown>; // Datos contextuales adicionales

  // Tracking
  status: NotificationStatus;    // unread | read | snoozed | archived | expired
  sentAt: string;                // ISO 8601
  readAt?: string;               // ISO 8601
  snoozedUntil?: string;         // ISO 8601
  deliveredChannels: Channel[];  // [in-app, push, email]

  // Agrupación
  groupKey?: string;             // Clave de consolidación
  groupCount?: number;           // Eventos agrupados

  // Offline
  offlineQueued: boolean;        // Encolada offline
}
```

### 12.2 Pipeline de entrega

```
Evento disparador
    ↓
Evaluación de severidad (reglas + contexto)
    ↓
Determinación de canales (configuración usuario + severidad)
    ↓
Consolidación (ventana de 30s para agrupar eventos similares)
    ↓
Entrega por canal:
  ├── In-app: WebSocket → store → badge + toast
  ├── Push: FCM/APNs → dispositivo
  ├── Email: Resend/SES → inbox
  └── SMS: Twilio → teléfono (solo Critical)
    ↓
Registro en audit trail (SDD-011)
    ↓
Tracking: delivered → read/ignored → action taken
```

### 12.3 Cola offline

```
Evento generado en offline → localStorage Queue (IndexedDB)
    ↓
Conexión restaurada → Replay FIFO:
  ├── Critical: replay inmediato al reconectar
  ├── Warning: replay con batch cada 30s
  └── Info: consolidar y mostrar resumen al abrir app
```

### 12.4 Integración WebSocket

```
Conexión: wss://api.drenyra.com/ws/notifications
Payload entrante: FiscalNotification
Heartbeat: cada 30s
Reconexión: exponential backoff (1s, 2s, 4s, 8s, max 30s)
```

## 13. Rendimiento

| Métrica | Objetivo | Condición |
|---------|----------|-----------|
| Time to first notification | < 500ms | Desde conexión WebSocket |
| Panel de notificaciones | < 200ms | Carga de 50 items |
| Búsqueda en centro | < 300ms | Sobre 10k notificaciones |
| Toast appears | < 100ms | Desde recepción WebSocket |
| Batch consolidation window | < 30s | Antes de entregar |
| Offline queue limit | 500 eventos | Antes de compresión |

## 14. Accesibilidad (WCAG 2.2 AA+)

| Requisito | Criterio WCAG | Implementación |
|-----------|---------------|----------------|
| Toast notificación | 4.1.3 (status messages) | role="status", aria-live="polite" / "assertive" según severidad |
| Panel notificaciones | 2.4.3 (focus order) | Focus management al abrir/cerrar |
| Badge de campana | 1.1.1 (non-text content) | aria-label con conteo |
| Centro notificaciones | 2.1.1 (keyboard) | Tab, Shift+Tab, Enter, Escape |
| Mensajes críticos | 2.2.2 (pause/stop) | No auto-dismiss en Critical |
| Contraste severidad | 1.4.1 (use of color) | Color + icono + texto (triple codificación) |
| Notificaciones push | 4.1.3 | A11y en notificaciones del sistema operativo |

### Atajos de teclado

| Atajo | Acción |
|-------|--------|
| Ctrl+Shift+N | Abrir panel de notificaciones |
| Escape | Cerrar panel |
| Tab / Shift+Tab | Navegar entre notificaciones |
| Enter | Abrir detalle de notificación seleccionada |
| M | Marcar seleccionada como leída |
| S | Snooze (con diálogo de tiempo) |

### Live regions

| Contexto | ARIA live | Comportamiento |
|----------|-----------|----------------|
| Toast informativo | polite | Anunciar cuando el usuario esté inactivo |
| Toast warning | assertive | Interrumpir anuncio actual |
| Toast critical | assertive | Interrumpir inmediato |
| Badge actualiza conteo | polite | "3 notificaciones sin leer" |
| Nuevo lote offline | polite | "5 notificaciones pendientes de sincronizar" |

## 15. Rendimiento técnico

| Requisito | Especificación |
|-----------|----------------|
| Virtual scroll en centro | react-virtuoso para 1000+ notificaciones |
| IndexedDB offline | Hasta 500 eventos antes de comprimir |
| Bundle size (notifications) | < 30KB gzip |
| WebSocket reconnect | Backoff exponencial, max 30s |
| Push registration | Lazy: solo si el usuario habilita push |
| Email batch | Máximo 1 email/5min por usuario en modo resumen |
| SMS throttle | Máximo 3 SMS/día por usuario |

## 16. Integraciones

| SDD/System | Integración |
|------------|-------------|
| SDD-004 — Telemetría | Evento "notification_delivered", "notification_read", "notification_action" |
| SDD-007 — L0-L3 | Notificaciones AI llevan badge de nivel y confianza |
| SDD-008 — Reversibilidad | Notificación cuando reversión expira o falla |
| SDD-009 — RUC Scope | Toda notificación tiene RUC; filtros multi-RUC en centro |
| SDD-010 — Approval Gates | Notificaciones para solicitar, recordar y escalar aprobaciones |
| SDD-011 — Audit Trail | Toda notificación enviada genera entrada en timeline |
| Web push | FCM (Firebase Cloud Messaging) para push browser |
| Email | Resend o SES con templates HTML |
| SMS | Twilio (solo Critical) |

## 17. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Fatiga de alertas temprana | Alta | Alto | Consolidación agresiva, default conservador |
| Push notification permiso denegado | Alta | Medio | Educar valor en onboarding, in-app como fallback |
| Email marcado como spam | Media | Alto | Reputación de dominio, personalización de remitente |
| SMS bloqueado por operador | Baja | Alto | Confirmar entrega, fallback a push/email |
| Offline queue overflow | Baja | Medio | Comprimir después de 500, descartar los más viejos |
| Horario silencioso mal configurado | Media | Bajo | Default sensato, notificación de bienvenida explica |
| Notificación duplicada (race condition) | Baja | Alto | Idempotencia por eventId + dedup en 30s |
| Datos fiscales en notificación externa | Media | Alto | Política de contenido: solo RUC + tipo, nunca montos |

## 18. Dependencias

| Dependencia | Tipo | Para qué |
|-------------|------|----------|
| SDD-001 | Foundation | Segmentación determina canal y frecuencia |
| SDD-003 | Foundation | Taxonomy de entidades fiscales en metadata |
| SDD-004 | Platform | Eventos de telemetría para notificaciones |
| SDD-007 | Trust Core | Badge de AI en notificaciones generadas por modelo |
| SDD-008 | Trust Core | Eventos de reversión como fuente de notificaciones |
| SDD-010 | Trust Core | Eventos de aprobación como fuente de notificaciones |
| SDD-011 | Trust Core | Audit trail como consumidor de eventos |
| WebSocket infra | Infrastructure | Canal in-app en tiempo real |
| Push service (FCM) | Infrastructure | Notificaciones push browser |
| Email service (Resend/SES) | Infrastructure | Canal email |
| SMS service (Twilio) | Infrastructure | Canal SMS (solo Critical) |

## 19. Success metrics

| Métrica | Target | Cómo se mide |
|---------|--------|-------------|
| Notification read rate | > 80% | Lectura dentro de ventana de severidad |
| Action rate from notification | > 40% | Clic en "Ver" o acción directa desde notif. |
| Critical notification response time | < 1h | Tiempo entre envío y primera acción |
| Offline queue replay success | > 99% | Entregas exitosas vs total encoladas |
| Notification opt-out rate | < 5% | Usuarios que desactivan todo |

### Señales de fricción (SDD-004)

| Señal | Lo que indica |
|-------|--------------|
| NOTIFICATION_IGNORED | Canal incorrecto o severidad mal calibrada |
| NOTIFICATIONS_READ_RATE_DROP | Fatiga de alertas |
| NOTIFICATION_DISABLE_ALL | Fracaso del sistema de notificaciones |
| NOTIFICATION_SNOOZE_RATE_HIGH | Usuario posponiendo sistemáticamente |

## 20. DONE criteria

- [ ] 1. Taxonomía de notificaciones implementada con 9 categorías y 5 severidades
- [ ] 2. Panel de notificaciones (flyout) con badge, agrupación, y acciones inline
- [ ] 3. Centro de notificaciones con filtros, búsqueda, y exportación
- [ ] 4. Configuración de notificaciones por tipo y canal por usuario
- [ ] 5. Consolidación automática de eventos similares en ventana de 30s
- [ ] 6. Pipeline de entrega multi-canal (in-app + push + email + SMS)
- [ ] 7. Cola offline con replay FIFO al reconectar
- [ ] 8. WebSocket integration con heartbeat y backoff exponencial
- [ ] 9. Horario silencioso configurable con override para Critical
- [ ] 10. WCAG 2.2 AA+ en todos los componentes de notificaciones
- [ ] 11. Atajos de teclado para panel y acciones principales
- [ ] 12. Live regions para todos los estados de notificación
- [ ] 13. Idempotencia y dedup de notificaciones (ventana 30s)
- [ ] 14. Política de contenido: nunca exponer montos en notificaciones externas
- [ ] 15. Límite de SMS (3/día) y throttle de email (1/5min)
- [ ] 16. Tracking completo: delivered, read, ignored, action taken
- [ ] 17. Integración con audit trail (SDD-011) para toda notificación enviada
- [ ] 18. Badge de AI en notificaciones generadas por modelo (SDD-007)
- [ ] 19. Filtros multi-RUC en centro de notificaciones (SDD-009)
- [ ] 20. Métricas de éxito visibles en dashboard de telemetría (SDD-004)

## 21. Changelog

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-07-14 | Versión inicial | SDD-012 |

---

> **Siguiente:** SDD-013 — Error Recovery Patterns
