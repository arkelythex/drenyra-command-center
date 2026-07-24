---
status: reference
normative: false
consumed_by: SDD-015
---

---
title: "SDD-010 — Human Approval Gates"
description: "Workflows de aprobación humana escalonados por nivel de riesgo, rol y acción fiscal — desde L1 hasta L3 con segregación de funciones"
version: "0.1"
tags: [sdd, ux, fiscal-trust, approval, governance, l3]
audience: [ux-engineer, frontend-engineer, product-manager, fiscal-architect, compliance]
status: borrador
last_updated: 2026-07-14
---

> **SDD-010** | Ola 2 — Fiscal Trust Core | **Previsto**: 4 días hábiles

---

## 1. Abstract

SDD-010 define el **sistema de aprobación humana escalonada** de Drenyra — gates, workflows, componentes UI y reglas de negocio que garantizan que ninguna acción fiscal crítica se ejecute sin la revisión explícita de un rol autorizado. Es la implementación concreta del **Contrato de Aprobación Humana (I4)** de SDD-002 (§7.3), integrado con el modelo L0-L3 de SDD-007 y los roles operacionales de SDD-001 (§7).

Este sistema distingue 5 gates de aprobación (G1–G5) por nivel de riesgo, con workflows que van desde auto-aprobación silenciosa hasta aprobación multi-rol con segregación de funciones.

---

## 2. North Star

> "Que un revisor fiscal pueda aprobar o rechazar 20 operaciones en lote en menos de 5 minutos, con suficiente contexto para decidir, y que ninguna acción de alto riesgo se ejecute sin su firma explícita."

---

## 3. Problem Statement

Los sistemas contables tradicionales fallan en aprobación humana por cuatro razones:

1. **Sin escalonamiento.** Toda aprobación es igual (binaria: sí/no). No hay distinción entre aprobar un borrador de DET y aprobar una declaración jurada presentada a SUNAT.

2. **Sin segregación de funciones.** Quien prepara puede aprobar. Esto viola principios básicos de control interno y permite fraudes o errores no detectados.

3. **Sin contexto suficiente.** El aprobador ve "Aprobar DET" sin ver el detalle, la evidencia, o las discrepancias detectadas por el sistema.

4. **Sin trazabilidad.** Las aprobaciones son acciones humanas no registradas. Cuando algo sale mal, no hay registro de quién aprobó, cuándo, ni con qué información.

Con la llegada de L3 (ejecución autónoma AI, SDD-007), estos problemas se agravan: un agente que ejecuta sin gates de aprobación explícitos es un riesgo fiscal inaceptable.

---

## 4. User Research (links a SDD-001)

| Hallazgo SDD-001 | Implicación para SDD-010 |
|---|---|
| P4 (Socio firma grande) exige segregación de funciones | Quien prepara ≠ quien aprueba. Obligatorio para acciones de alto riesgo. |
| P5 (Auxiliar contable) prepara, no aprueba | Rol "preparador" no tiene botón de aprobar |
| P7 (Revisor fiscal) existe específicamente para aprobar | Workflow de aprobación como tarea principal del rol |
| P3 (Outsourcing) procesa en lote | Aprobación batch: revisar 20 ítems en una vista, aprobar en grupo |
| J7: "Aprobar una declaración confiando en que está correcta" | Necesita evidencia suficiente en la pantalla de aprobación |
| Cadencia mensual con picos de cierre | Aprobaciones expiran si no se revisan a tiempo (deadline fiscal) |

> Ver SDD-001: §6 (arquetipos P4, P5, P7), §7 (roles), §8 (JTBD J7, J8), §10 (cadencia)

---

## 5. Invariantes Afectados

| # | Invariante | Prioridad | Relación con SDD-010 |
|---|---|---|---|
| I4 | ✅ Aprobación humana | **Crítico** | Este SDD es la implementación de I4 |
| I5 | ✅ Trazabilidad de auditoría | Alta | Cada aprobación/ rechazo queda en el audit trail |
| I6 | ✅ Evidencia primero | Alta | La pantalla de aprobación muestra evidencia antes de decidir |
| I3 | ✅ Reversibilidad | Media | Aprobaciones erróneas pueden revocarse (SDD-008) |
| I1 | ✅ Alcance por RUC | Media | Aprobaciones scoped al RUC activo (SDD-009) |
| I12 | ✅ WCAG 2.2 AA+ | Media | Paneles de aprobación navegables por teclado |

---

## 6. Modelo de Gates por Riesgo

5 gates de aprobación (G1–G5) basados en el nivel de riesgo fiscal de la acción.

| Gate | Riesgo | Ejemplos | ¿Quién aprueba? | Autenticación |
|---|---|---|---|---|
| **G1** | Ninguno | Ver datos, exportar reportes, cambiar preferencias personales | Nadie (auto-aprobado) | — |
| **G2** | Bajo | Crear borrador, importar datos, guardar configuración básica | Mismo usuario | Sesión activa |
| **G3** | Medio | Enviar DET, registrar comprobante, modificar datos maestros | Mismo usuario + confirmación explícita | Confirmación + captcha o 2FA suave |
| **G4** | Alto | Presentar declaración, aprobar asientos contables, ejecutar L2 | Rol separado (revisor ≠ preparador) | 2FA (TOTP o código SMS) |
| **G5** | Crítico | Ejecutar L3, reversiones de L3, modificar configuración fiscal del tenant | Dos roles separados (preparador → revisor → owner) | 2FA + justificación escrita |

**Regla de escalamiento:** Toda acción del sistema se clasifica en G1–G5 por un mapa fijo (configurable por tenant). Si una acción no tiene clasificación explícita, hereda G3 por defecto.

---

## 7. Workflow de Aprobación

### 7.1 Estructura General

```
Preparar → Someter → Revisar → [Aprobar | Rechazar | Devolver] → Ejecutar
```

| Paso | Rol | Acción UI | Registro |
|---|---|---|---|
| **Preparar** | Quien inicia la acción | Llena formulario, carga datos, genera borrador | Audit trail: "Preparado por {user}" |
| **Someter** | Mismo o revisor | Click "Someter a aprobación" | Estado → Pendiente de aprobación |
| **Revisar** | Aprobador asignado | Abre panel de aprobación con evidencia | Audit trail: "Revisado por {user} a las {time}" |
| **Aprobar** | Aprobador | Click "Aprobar" + autenticación según gate | Estado → Aprobado. Audit trail completo. |
| **Rechazar** | Aprobador | Click "Rechazar" + motivo obligatorio | Estado → Rechazado. Vuelve a preparador con comentario. |
| **Devolver** | Aprobador | Click "Devolver con comentarios" | Estado → En revisión. Preparador recibe notificación. |
| **Ejecutar** | Sistema (si L3) o usuario (si L2) | Se ejecuta la acción fiscal | Audit trail: "Ejecutado por {user/sistema}" |

### 7.2 Estados de una Acción Pendiente de Aprobación

| Estado | Visual | Descripción |
|---|---|---|
| **Pendiente** | `🔄` Amarillo | Sometido, esperando revisor |
| **En revisión** | `👁️` Azul | Alguien está revisando |
| **Aprobado** | `✅` Verde | Aprobado, esperando ejecución |
| **Rechazado** | `❌` Rojo | Rechazado por revisor |
| **Devuelto** | `📝` Naranja | Devuelto con comentarios |
| **Expirado** | `⏰` Gris | Pasó la ventana de aprobación |
| **Revocado** | `🚫` Rojo oscuro | Aprobación revocada por autoridad superior |

---

## 8. Componentes UI

### 8.1 Badge de Estado de Aprobación

Cada acción fiscal tiene un badge de estado visible en:
- Lista de acciones
- Timeline de auditoría
- Card de la entidad

```
┌──────────────────────────┐
│  DET Marzo 2026          │
│  Estado: [🔄 Pendiente]  │  ← G4
│  Solicitado: admin@      │
│  [Ver detalle] [Aprobar] │
└──────────────────────────┘
```

### 8.2 Panel de Aprobación (colapsable)

El panel se abre al hacer clic en "Aprobar" o "Revisar":

```
┌──────────────────────────────────────────────────┐
│  Aprobar DET — Marzo 2026                         │
│  ──────────────────────────────────────────────── │
│  Solicitante: admin@drenyra.com                   │
│  RUC: [●] 20123456789 — Mi Empresa S.A.C.        │
│  Gate: G4 — Riesgo Alto                          │
│                                                    │
│  📋 Resumen:                                       │
│  • IGV: S/ 18,000                                 │
│  • Ventas: S/ 100,000                             │
│  • Discrepancias detectadas: 0                    │
│                                                    │
│  🔍 Revisar evidencia:                            │
│  [📄 Ver borrador completo]                       │
│  [📊 Ver cálculos]                                │
│  [🔗 Ver auditoría de cambios]                    │
│                                                    │
│  ──────────────────────────────────────────────── │
│  Motivo (obligatorio si rechazo):                  │
│  [______________________________________________] │
│                                                    │
│  [Rechazar]  [Devolver]  [✅ Aprobar]              │
│                                                    │
│  ⚠️ Al aprobar se requerirá 2FA                    │
└──────────────────────────────────────────────────┘
```

### 8.3 Diálogo de Confirmación (G4–G5)

Para G4 y G5, después de click "Aprobar", se abre un diálogo de autenticación:

```
┌──────────────────────────────────┐
│  Verificación requerida           │
│                                  │
│  Acción: Aprobar DET Marzo 2026  │
│  Gate: G4 — Riesgo Alto          │
│                                  │
│  Ingresa tu código 2FA:          │
│  [____]  [Verificar]             │
│                                  │
│  O usa tu token físico:          │
│  [🔐 Usar WebAuthn]              │
│                                  │
│  Esta acción quedará registrada  │
│  en el audit trail.              │
│                                  │
│  [Cancelar]                      │
└──────────────────────────────────┘
```

### 8.4 Aprobación Batch (G3, G4 en lote)

Para el usuario P3 (outsourcing) que procesa 20+ acciones:

```
┌────────────────────────────────────────────────────┐
│  Aprobación Batch — 8 acciones pendientes          │
│  ──────────────────────────────────────────────── │
│  □  Todo                                         │
│  ──────────────────────────────────────────────── │
│  ☑  [● Emp A] DET Marzo     G4  [Ver]            │
│  ☑  [● Emp A] IGV Febrero   G3  [Ver]            │
│  ☐  [○ Emp B] DET Marzo     G4  [Ver]  ⚠️ Disc.  │  ← discrepancia
│  ☑  [○ Emp B] Planilla      G3  [Ver]            │
│  ☐  [△ Emp C] DET Marzo     G4  [Ver]            │
│                                                    │
│  [Ver evidencia seleccionados]  [Aprobar N]        │
└────────────────────────────────────────────────────┘
```

- Cada ítem con ⚠️ discrepancia resalta en amarillo
- El aprobador puede expandir cada ítem inline sin abrir una nueva vista
- Al aprobar batch: cada acción se procesa independientemente (éxito/fallo individual)

---

## 9. Segregación de Funciones (SoD)

### 9.1 Reglas de SoD

| Si el usuario es | Puede preparar | Puede aprobar G3 | Puede aprobar G4 | Puede aprobar G5 |
|---|---|---|---|---|
| Owner (O) | ✅ | ✅ | ✅ | ✅ |
| Admin (A) | ✅ | ✅ | ✅ | — |
| Contador senior (CS) | ✅ | ✅ | ✅ | — |
| Contador junior (CJ) | ✅ | ✅ | — | — |
| Auxiliar (AUX) | ✅ | — | — | — |
| Revisor fiscal (RF) | — | ✅ | ✅ | — |
| Viewer (V) | — | — | — | — |

**Regla fija:** El preparador de una acción NO puede ser su aprobador para G4 y G5. El sistema asigna un aprobador automáticamente del rol correspondiente.

### 9.2 Asignación de Aprobador

- **Por defecto:** el siguiente humano disponible en el rol de aprobación requerido
- **Por RUC:** el aprobador designado para ese RUC en particular (configuración del tenant)
- **Por tipo de acción:** ciertas acciones (ej: declaraciones juradas) requieren aprobador específico
- **Por escalamiento:** si no hay aprobador disponible en ≤ 1 hora, escala al rol superior

### 9.3 Revocación de Aprobación

Una aprobación de G5 puede ser revocada por:
- El owner del tenant
- Un administrador fiscal designado
- Sistema, si se detecta una discrepancia después de la aprobación (automático)

La revocación requiere G4 authentication y deja el audit trail correspondiente.

---

## 10. Aprobación en el Modelo L0–L3

Inserción en el modelo de SDD-007:

| Nivel | Gates activos | Comportamiento |
|---|---|---|
| **L0** | G1 | Sin aprobación |
| **L1** | G2 | Recomendación se muestra, el usuario decide si ejecuta. Sin barrera de aprobación. |
| **L2** | G3 | El sistema prepara el borrador. El usuario revisa y ejecuta. Confirmación G3 requerida. |
| **L3** | G4+ | El sistema prepara. El sistema puede ejecutar **solo si** un humano aprobó G4+ antes. Sin aprobación, L3 está en pausa. |
| **L3 - crítico** | G5 | Acciones críticas requieren dos aprobaciones humanas antes de que L3 ejecute. |

**Para L3 en particular:**
- El agente prepara una bandeja de "acciones pendientes de aprobación"
- El humano revisa el lote y aprueba selectivamente
- Solo las acciones aprobadas se ejecutan automáticamente
- El humano puede configurar "aprobar siempre esta acción para este RUC" (con G5 temporal)

---

## 11. Aprobación por Tipo de Acción Fiscal

| Acción | Gate por Defecto | Configurable por Tenant |
|---|---|---|
| Ver datos, exportar reportes | G1 | No |
| Cambiar preferencias personales | G1 | No |
| Crear borrador de DET | G2 | Sí |
| Importar comprobantes (CSV/XML) | G2 | Sí |
| Modificar datos maestros | G3 | Sí |
| Enviar DET a SUNAT | G3 | Sí |
| Registrar comprobante de venta | G3 | Sí |
| Registrar comprobante de compra | G3 | Sí |
| Presentar declaración mensual | G4 | Sí (mínimo G4) |
| Aprobar asiento contable | G4 | Sí |
| Ejecutar reversión de acción (SDD-008) | G4 | Sí |
| Ejecutar L3 autónoma | G4 | Sí (mínimo G4) |
| Reversión de L3 ejecutada | G5 | Parcial (mínimo G5) |
| Modificar configuración fiscal del tenant | G5 | No |
| Modificar mapa de gates por acción | G5 | Solo owner |
| Eliminar datos fiscales | G5 | No |

---

## 12. Caducidad de Aprobaciones

| Gate | Ventana de Aprobación | Post-Aprobación (vigencia) |
|---|---|---|
| G2 | 24 horas | 1 hora para ejecutar |
| G3 | 12 horas | 30 minutos para ejecutar |
| G4 | 4 horas | 15 minutos para ejecutar |
| G5 | 2 horas | 5 minutos para ejecutar |

- Si la ventana expira: la acción vuelve a "Pendiente" y se notifica al solicitante
- Si la vigencia post-aprobación expira: la aprobación caduca y debe renovarse
- En periodo de cierre fiscal (última semana del mes): las ventanas se reducen a la mitad y se añaden recordatorios cada 30 minutos
- El deadline fiscal (fecha límite SUNAT) overridea las ventanas si está próximo (el sistema marca urgencia)

---

## 13. Aprobación en Contexto Multi-RUC

Siguiendo SDD-009:

| Modo | Comportamiento de Aprobación |
|---|---|
| **Single-RUC** | Aprobación scoped al RUC activo. Badge de RUC en toda acción. |
| **Batch multi-RUC** | Cada RUC se procesa independientemente. Aprobación por RUC o batch si el aprobador tiene permisos en todos los RUCs. |
| **Comparativo** | La aprobación es por RUC individual. No existe "aprobar ambos" sin revisar cada uno. |
| **Global admin** | El admin puede aprobar en cualquier RUC donde tenga permisos. El audit trail registra el RUC específico. |

---

## 14. Notificaciones

| Evento | Canal | Contenido |
|---|---|---|
| Acción sometida a aprobación | In-app + email | "{User} solicita aprobación para {acción} en RUC {ruc}" |
| Aprobación requerida urgente | In-app + email + push | "⏰ Quedan 2h para aprobar {acción} — fecha límite SUNAT: {fecha}" |
| Acción aprobada | In-app | "{Acción} aprobada por {user}. Lista para ejecutar." |
| Acción rechazada | In-app + email | "{Acción} rechazada por {user}. Motivo: {motivo}" |
| Acción devuelta | In-app | "{Acción} devuelta por {user}. Comentario: {comentario}" |
| Aprobación a punto de expirar | In-app | "⏳ {Acción} expira en 30 min. Revisa antes de que caduque." |
| Revocación de aprobación | In-app + email | "La aprobación de {acción} fue revocada por {user}. Motivo: {motivo}" |

---

## 15. Accesibilidad

| Requisito | WCAG | Implementación |
|---|---|---|
| Panel de aprobación navegable por teclado | 2.1.1 | Tab entre campos, Enter para aprobar/rechazar, Escape para cerrar |
| Batch approval focus management | 2.4.3 | Foco secuencial: checkboxes → ver detalle → aprobar lote |
| Live region en cambio de estado | 4.1.3 | "Acción aprobada", "Acción rechazada", etc. |
| Contraste en estados de badge | 1.4.3 | Badge de aprobación usa color + icono + texto |
| Aprobación por 2FA accesible | 2.1.1, 1.1.1 | Código TOTP input con label, WebAuthn con descripción |
| Motivo de rechazo obligatorio | 3.3.1 | Error si se intenta rechazar sin motivo |
| Batch approval resumen mínimo | 2.4.6 | Encabezado claro: "8 acciones, 1 con discrepancia" |

---

## 16. Performance Budget

| Operación | Budget |
|---|---|
| Carga de panel de aprobación | ≤ 500ms |
| Aprobar acción individual | ≤ 1s (incluye 2FA) |
| Aprobar batch (20 acciones) | ≤ 3s |
| Búsqueda de acciones pendientes | ≤ 200ms |
| Notificación de cambio de estado | ≤ 2s (in-app) |
| Carga de evidencia en panel | ≤ 500ms por documento |

---

## 17. Success Metrics

| Métrica | Objetivo | Medición |
|---|---|---|
| Tiempo medio para aprobar una acción (G3) | ≤ 30s | Analytics |
| Tiempo medio para aprobar batch (20 items) | ≤ 5 min | Analytics |
| Tasa de acciones rechazadas | ≤ 10% | Telemetría |
| Tasa de acciones expiradas | ≤ 5% | Telemetría |
| Tiempo entre someter y aprobar (G4) | ≤ 2h | Analytics |
| Errores post-aprobación detectados | 100% | Sistema + auditoría |
| Satisfacción del revisor con contexto | ≥ 80% | Encuesta trimestral |
| NPS "confianza en aprobaciones" | ≥ 75 | Encuesta trimestral |

---

## 18. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Aprobador no disponible (vacaciones, enfermedad) | Alta | Alto | Escalamiento automático al rol superior en ≤ 1h |
| Deadline fiscal pasa sin aprobación | Media | Crítico | Notificaciones urgentes 48h/24h/4h antes. Modo emergencia: owner puede override con G5. |
| Colusión preparador + aprobador | Baja | Crítico | Auditoría cruzada aleatoria. Límite de aprobaciones por par. |
| Falso positivo: acción correcta rechazada | Media | Medio | Rechazo se devuelve con comentarios. Preparador corrige y re-somete. |
| Batch approval sin revisar cada ítem | Alta | Alto | Ítems con discrepancia requieren expansión manual antes de aprobar batch |
| 2FA bloquea aprobación urgente | Media | Alto | Segundo factor alternativo (WebAuthn, TOTP, SMS). Override owner con G5. |

---

## 19. Dependencias

| SDD / Sistema | Tipo | Descripción |
|---|---|---|
| SDD-001 §7 | Input | Roles y permisos por RUC para asignación de aprobadores |
| SDD-002 §7.3 | Input | Contrato de Aprobación Humana (invariante, estados, límites) |
| SDD-004 | Output | Evento `approval.*` para telemetría de aprobaciones |
| SDD-005 | Input | Atajos de teclado para aprobación rápida |
| SDD-007 | Input | L0-L3 model: en qué nivel se activa cada gate |
| SDD-008 | Output | Reversiones de L3 requieren aprobación G5 |
| SDD-009 | Input | Aprobación scoped al RUC activo |
| Backend: Auth | Input | 2FA (TOTP, WebAuthn, SMS) |
| Backend: Notifications | Input | Email + push para eventos de aprobación |
| Backend: RBAC | Input | Permisos por rol × RUC (de SDD-001) |

---

## 20. DONE Criteria

- [ ] 5 gates de aprobación (G1–G5) implementados con mapa configurable por tenant
- [ ] Workflow completo: Preparar → Someter → Revisar → Aprobar/Rechazar/Devolver → Ejecutar
- [ ] Segregación de funciones: preparador ≠ aprobador para G4 y G5
- [ ] Panel de aprobación con evidencia expandible
- [ ] Badge de estado en toda acción fiscal
- [ ] Aprobación batch con detección de discrepancias
- [ ] 2FA para G4+, con alternativas accesibles
- [ ] Caducidad de aprobaciones por gate con notificaciones
- [ ] Revocación de aprobación por owner o admin
- [ ] Integración con L0-L3: L3 pausado sin aprobación
- [ ] Audit trail completo: quién, cuándo, qué, desde qué contexto
- [ ] Live region ARIA para cambios de estado
- [ ] Escalamiento automático si aprobador no disponible
- [ ] Tests: workflow completo, batch, caducidad, revocación
- [ ] Telemetría de eventos `approval.*`
- [ ] Performance: panel de aprobación ≤ 500ms

---

## 21. Changelog

| Fecha | Cambio | Autor |
|---|---|---|
| 2026-07-14 | Versión inicial | SDD-010 |

---

> **Siguiente:** SDD-011 — Fiscal Core Wireframes
