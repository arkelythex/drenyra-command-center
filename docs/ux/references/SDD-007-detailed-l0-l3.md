---
status: reference
normative: false
consumed_by: SDD-019
---

---
title: "SDD-007 — Modelo L0-L3 de Asistencia AI"
status: "draft"
version: "0.1"
date: "2026-07-14"
tags:
  - sdd
  - ola-2
  - ai-model
  - trust-core
  - l0-l3
audience: "UX, Engineering, Product"
next: "SDD-008 — Reversibilidad de Acciones Fiscales"
---

**Última actualización**: 2026-07-14
**Contenido**: Especificación de diseño detallado (SDD)

---

## 1. Abstract

Drenyra tiene un modelo conceptual de 4 niveles de asistencia AI — Explain (L0), Recommend (L1), Prepare (L2), Execute (L3) — definido en SDD-000 y referenciado por SDD-002 (contratos de confianza), SDD-003 (arquitectura de información) y SDD-006 (evidencia). Cada SDD aplica el modelo a su dominio, pero no existe una especificación canónica que defina cómo se ve, se siente y se comporta cada nivel a través de toda la plataforma.

Este SDD-007 cierra esa brecha. Define el modelo L0-L3 como un sistema de comportamiento transversal: qué ve el usuario en cada nivel, cómo se transiciona entre niveles, cómo se configura por tenant y por tipo de acción fiscal, y qué invariantes protegen cada transición.

## 2. North star

> El usuario nunca duda qué va a hacer Drenyra ni por qué. Cada acción tiene un nivel de asistencia visible, comprensible y configurable.

## 3. Problema

1. **Niveles inconsistentes entre dominios**: SDD-002 define L0-L3 para contratos de confianza, SDD-003 para navegación, SDD-006 para evidencia — pero no hay un modelo único que unifique el comportamiento visual y las reglas de transición.
2. **Confianza depende de predictibilidad**: Si L3 se ve igual que L1 en la UI, el usuario no sabe cuándo Drenyra va a ejecutar autónomamente.
3. **Configuración fragmentada**: Cada feature implementa su propio "nivel de AI" sin un modelo central de configuración por tenant y por tipo de acción.
4. **Sin señal visual de nivel activo**: Hoy no hay manera de saber, al mirar una pantalla, en qué nivel de asistencia está operando Drenyra.

## 4. Research y referencias

- **SDD-002**: Mapeo L0-L3 por contrato de confianza (sección 6)
- **SDD-003**: Mapeo L0-L3 para navegación (sección 6)
- **SDD-006**: Mapeo L0-L3 por tipo de evidencia (sección 8)
- **SDD-001**: Personas P1-P8, necesidades por nivel de sofisticación
- **SDD-004**: Métricas de confianza por nivel de asistencia
- **Referencia externa**: Modelo de niveles de autonomía en aviación (NASA TLX para carga cognitiva), asistencia progresiva en herramientas profesionales (Adobe, Figma, VS Code)

## 5. Decisiones ejecutivas

| Decisión | Opción | Justificación |
|----------|--------|---------------|
| L0-L3 como sistema transversal vs. por feature | **Transversal** | Consistencia, predictibilidad, mantenibilidad |
| Visualización de nivel activo | **Indicator permanente + contexto** | El usuario necesita saber el nivel actual sin buscar |
| Configuración por tenant y tipo de acción | **Matriz tenant × acción × nivel máximo** | Un contador pequeño usa L3; una sociedad de auditoría usa solo L0-L1 |
| Default global | **L1 (Recommend)** | Suficiente asistencia sin riesgo de acciones no deseadas |

## 6. Contratos de confianza aplicables (SDD-002)

| Contrato | Relevancia para L0-L3 |
|----------|----------------------|
| Evidencia | L0-L2 requieren evidencia visible. L3 requiere evidencia en audit trail |
| Reversibilidad | L2-L3 requieren undo. L3 requiere reversibilidad completa |
| Aprobación humana | L2 requiere confirmación. L3 requiere aprobación (configurable por acción) |
| Audit trail | Toda acción L1+ se registra. L3 incluye AI reasoning completo |
| RUC scope | Cada nivel opera dentro del RUC activo. Cambio de RUC baja a L0 |
| Progressive disclosure | La UI revela más controles según aumenta el nivel |

## 7. Definición canónica de niveles

### 7.1 L0 — Explain

**Qué hace**: Drenyra muestra información fiscal, detecta anomalías, explica datos existentes. No sugiere ni ejecuta acciones.

**Responsabilidad del usuario**: Interpreta la información, decide qué hacer, ejecuta manualmente.

**UI pattern**:
- Data displays estándar (tablas, gráficos, indicadores)
- Evidence tags (SDD-006) en toda cifra mostrada
- Tooltips explicativos con fuente y razonamiento
- Sin botones de "Aplicar", "Ejecutar" o "Confirmar" generados por AI
- Acciones disponibles son 100% manuales (filtros, navegación, export)

**Ejemplos**:
- Dashboard de libros electrónicos con detección de inconsistencia
- Timeline de comprobantes con indicador "Falta factura del 15/05"
- Vista de detalle de CSV con celda resaltada "IGV calculado vs. declarado: -S/230"

**Percepción para el usuario**: "Drenyra me muestra los datos y me señala lo que está mal. Yo decido qué hacer."

### 7.2 L1 — Recommend

**Qué hace**: Drenyra sugiere acciones basadas en evidencia. El usuario revisa y decide si acepta o rechaza.

**Responsabilidad del usuario**: Revisa la recomendación, acepta o rechaza explícitamente.

**UI pattern**:
- Evidence tag con indicador "Recomendación" (L1)
- Tarjeta de recomendación: título, descripción, impacto fiscal, evidencia expandible
- Botones "Aplicar" y "Descartar" — ambos requieren clic explícito
- Recomendaciones agrupables por lote con revisión individual
- Historial de recomendaciones aceptadas/rechazadas

**Ejemplos**:
- "Detectamos 3 facturas duplicadas en el período. ¿Desea revisarlas y marcar las incorrectas?"
- "El IGV declarado en PLAME no coincide con el calculado de boletas. ¿Desea reconciliar?"

**Percepción para el usuario**: "Drenyra me sugiere qué hacer. Yo elijo si seguirlo."

### 7.3 L2 — Prepare

**Qué hace**: Drenyra prepara la acción completa (draft, formulario rellenado, configuración lista). El usuario revisa, modifica si es necesario, y ejecuta.

**Responsabilidad del usuario**: Revisa el draft completo, modifica lo que necesite, confirma explícitamente.

**UI pattern**:
- Indicador "Preparado por Drenyra" visible en el draft
- Draft completo e interactivo (el usuario puede editar cualquier campo)
- Diff view: muestra qué preparó Drenyra vs. lo que había antes
- Checklist de revisión antes de ejecutar
- Botón "Ejecutar" inhabilitado hasta que el usuario marque "Revisado"
- Evidence panel (SDD-006 L1) abierto por defecto

**Ejemplos**:
- "Preparamos la declaración mensual basada en tus comprobantes. Revisa los montos antes de enviar."
- "Generamos las retenciones del período y preparamos el archivo TXT para SUNAT. Revisa y confirma."

**Percepción para el usuario**: "Drenyra hace el trabajo pesado. Yo reviso y decido si está bien."

### 7.4 L3 — Execute

**Qué hace**: Drenyra ejecuta acciones programadas dentro de límites definidos (riesgo bajo, undo disponible, tenant configurado para L3).

**Responsabilidad del usuario**: Supervisa resultados, revierte si es necesario. No requiere aprobación previa para acciones de bajo riesgo.

**UI pattern**:
- Indicador permanente "Drenyra ejecuta: nivel 3"
- Notificación de ejecución: qué se hizo, cuándo, con qué evidencia
- Botón "Revertir" disponible por tiempo configurable (SDD-008)
- Audit trail completo con AI reasoning capturado
- Dashboard de actividad autónoma con resumen diario
- Flag-off automático si la tasa de reversal excede el umbral (SDD-004)

**Ejemplos**:
- "Clasificamos automáticamente 45 comprobantes como 'Gasto operativo' según reglas configuradas. ¿Deseas revisar?"
- "Descargamos los PDT del período y actualizamos tu bandeja de pendientes."

**Percepción para el usuario**: "Drenyra hace las tareas rutinarias. Yo superviso y actúo si algo no está bien."

---

## 8. Matriz de transiciones

### 8.1 Transiciones verticales (nivel por feature)

| Transición | Quién inicia | Condiciones | UI |
|-----------|-------------|-------------|-----|
| L0 → L1 | Sistema | Feature detecta patrón recurrente | Badge "Recomendación disponible" |
| L1 → L2 | Usuario | Usuario acepta recomendación que requiere preparación | Botón "Ver detalle preparado" |
| L0 → L2 | Usuario | Usuario solicita "Prepárame esto" | Botón "Preparar" en toolbar |
| L2 → L3 | Tenant config | Feature en nivel máximo L3 + riesgo bajo | Automático después de N usos L2 sin modificaciones |
| L3 → L2 | Sistema | Usuario revierte acción L3 | Reversión ejecutada, feature baja un nivel |
| L3 → L1 | Sistema | Tasa de reversal excede umbral (SDD-004) | Notificación: "Asistencia reducida por actividad" |
| Cualquiera → L0 | Sistema | Cambio de RUC, período, o tenant | Navegación completa, todas las sugerencias se limpian |

### 8.2 Configuración por tenant

Cada tenant define su nivel máximo global y por categoría de acción:

```yaml
tenant:
  nivel_maximo_global: L2
  acciones:
    clasificacion_comprobantes: L3
    deteccion_duplicados: L3
    declaracion_mensual: L1
    envio_sunat: L0
    recomendacion_asientos: L2
```

**Reglas**:
- Ninguna acción puede operar por encima de su nivel máximo configurado
- El nivel máximo global es el techo; acciones individuales pueden tener techos más bajos
- Cambiar el nivel máximo global baja todas las acciones activas al nuevo techo
- Las transiciones L1→L2 y L2→L3 pueden tener approval gates adicionales por rol

### 8.3 Transiciones horizontales (nivel de evidencia)

Las transiciones de evidencia (SDD-006 sección 7) son independientes del nivel de asistencia:

| Evidence | L0 (Explain) | L1 (Recommend) | L2 (Prepare) | L3 (Execute) |
|----------|-------------|----------------|--------------|--------------|
| Tag (L0_E) | Siempre visible | Siempre visible | Siempre visible | En audit trail |
| Panel (L1_E) | Click en cifra | Abierto por defecto | Abierto por defecto | En notificación |
| Viewer (L2_E) | Dos clics | Enlace en tarjeta | Panel lateral | En audit trail |

---

## 9. Indicador de nivel activo

Cada espacio de trabajo muestra el nivel activo actual:

```
[RUC: 20100066650 | Período: 2026-07 | Asistencia: ●●●○ L1 Recommend]
```

**Diseño**:
- 4 puntos: llenos = activo, vacíos = no disponible, gris = disponible pero no activo
- Color del nivel activo: L0 neutral, L1 azul, L2 ámbar, L3 verde
- Click en el indicador abre panel de configuración rápida de nivel
- El indicador es persistente en todas las vistas (nunca se oculta)

**Excepciones**:
- Pantalla de login/onboarding: no muestra indicador
- Modo offline: el indicador muestra "Offline — solo L0"
- Error catastrófico: el indicador muestra "⚠️ Asistencia reducida — L0"

---

## 10. Patrones de UI por nivel

### 10.1 Bandeja de recomendaciones (L1)

Panel lateral derecho, colapsable, con lista de recomendaciones activas:

```
┌─────────────────────────────┐
│ Recomendaciones (3)    [×]  │
├─────────────────────────────┤
│ 🔍 3 facturas duplicadas    │
│    Impacto: S/ 1,240 IGV    │
│    [Revisar] [Descartar]    │
├─────────────────────────────┤
│ ⚠️ IGV PLAME no coincide    │
│    Diferencia: S/ 890       │
│    [Revisar] [Descartar]    │
├─────────────────────────────┤
│ 📋 Clasificar 45 comprob.   │
│    [Ver propuesta]          │
└─────────────────────────────┘
```

### 10.2 Draft preparado (L2)

Vista principal con overlay de estado:

```
┌──────────────────────────────────────────────┐
│ 🛠️ Preparado por Drenyra — Revisa antes de  │
│    ejecutar                              [×] │
├──────────────────────────────────────────────┤
│ [Resumen de lo que se preparó]               │
│                                              │
│ [Campos editables con diff]                   │
│   - Monto base:   S/ 45,000  ← calculado     │
│   - IGV:          S/ 8,550   ← calculado     │
│   - Total:        S/ 53,550  ← calculado     │
│                                              │
│ [✓] He revisado los montos                    │
│                                              │
│        [Modificar]    [Ejecutar]              │
└──────────────────────────────────────────────┘
```

### 10.3 Ejecución autónoma (L3)

Notificación no obstructiva + timeline de actividad:

```
┌──────────────────────────────────────────────┐
│ 🤖 Drenyra ejecutó: Clasificación automática  │
│                                                │
│ 45 comprobantes → "Gasto operativo" (S/23,450) │
│ 2 comprobantes → "No clasificados" (revisar)   │
│                                                │
│ [Ver detalle] [Revertir todo] [Configurar]     │
└──────────────────────────────────────────────┘
```

---

## 11. Estados y comportamientos

### 11.1 Estados del nivel de asistencia

| Estado | Significado | Display |
|--------|-------------|---------|
| `available` | Nivel configurado y operativo | Punto lleno en indicador |
| `idle` | Nivel no usado en la sesión actual | Punto hueco |
| `unavailable` | No configurado para este tenant/acción | Punto gris |
| `degraded` | Nivel operativo pero con limitaciones | Punto con warning (SDD-002) |
| `forced-off` | Desactivado por umbral de reversal | Punto tachado |

### 11.2 Transiciones de estado

- `available` → `idle`: Sin actividad en el nivel por >30 minutos
- `available` → `degraded`: Evidencia insuficiente, o reversión reciente
- `degraded` → `available`: Condiciones resueltas
- `available` → `forced-off`: Reversal rate > umbral (SDD-004)
- `forced-off` → `available`: Admin re-activa, o nuevo período fiscal

### 11.3 Edge cases

| Caso | Comportamiento |
|------|---------------|
| Cambio de RUC durante L3 activo | La operación L3 se completa (o se reversa), luego todo baja a L0 |
| Offline durante L2 | El draft permanece editable. Al reconectar, se valida el nivel |
| Sesión expirada con L3 activo | L3 se pausa. Al re-ingresar, notificación de acciones pendientes |
| Feature nueva sin configuración L0-L3 | Default: L0 hasta que el tenant configure |

---

## 12. Consideraciones de accesibilidad (SDD-005)

- El indicador de nivel activo no depende solo de color (puntos llenos/vacíos/grises)
- Las transiciones de nivel se anuncian con live region (role="status")
- Las notificaciones L3 tienen enfoque programático manejable
- Los botones "Aceptar recomendación" tienen aria-label descriptivo
- El diff view en L2 es navegable por teclado (Tab entre cambios)

---

## 13. Telemetría (SDD-004)

| Métrica | Evento | Propósito |
|---------|--------|-----------|
| Adoption rate por nivel | `assistance.level_active` | ¿Qué niveles usa cada tenant? |
| Transition rate | `assistance.level_transition` | ¿Cada cuánto suben/bajan de nivel? |
| L1 acceptance rate | `assistance.recommendation_decision` | ¿Confían en recomendaciones? |
| L2 modification rate | `assistance.draft_modified` | ¿Qué tan seguido editan drafts? |
| L3 reversal rate | `assistance.execute_reversal` | ¿Las ejecuciones autónomas son correctas? |
| Downgrade rate | `assistance.level_downgrade` | ¿Sistema está reduciendo niveles por desconfianza? |
| Level indicator visibility | `ui.level_indicator_hover` | ¿Usuarios miran el indicador? |

Targets:
- L1 acceptance rate: >70% (tenant maduro), >40% (tenant nuevo)
- L2 modification rate: <30% (draft preciso)
- L3 reversal rate: <5% (ejecuciones confiables)

---

## 14. Performance budget

| Operación | Target | Medición |
|-----------|--------|----------|
| Render de recomendaciones L1 | <200ms | Core Web Vitals (INP) |
| Apertura de draft L2 | <500ms | Percepción del usuario |
| Notificación L3 | <100ms | Tiempo de toast/notification |
| Transición de nivel | <300ms | De clic a nuevo estado visible |
| Indicador de nivel activo | <50ms | Actualización en toolbar |
| Diff view en L2 | <800ms | Para draft de hasta 50 campos |

---

## 15. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Usuarios confunden L2 con L3 (ejecutan sin revisar) | Media | Alto | L2 requiere checklist explícito antes de ejecutar. El botón "Ejecutar" se habilita solo después de marcar "Revisado" |
| Transiciones automáticas L2→L3 reducen confianza | Media | Alto | Notificación clara de la transición, opción de "Volver a L2" permanente |
| Configuración por tenant demasiado compleja | Alta | Medio | Default L1 global. Panel de configuración simplificado: "Básico", "Avanzado", "Experimental" |
| Indicador de nivel se vuelve ruido visual | Alta | Bajo | Diseño minimalista, 4 puntos. Click rápido para silenciar |
| L3 en feature sin undo completo daña datos fiscales | Baja | Crítico | L3 solo disponible en features con reversibilidad probada (SDD-008). Checklist de safety por feature |

---

## 16. Implementación por fases

### Fase 1 — Fundacional
- Implementar indicador de nivel activo persistente
- L0-L1 funcional en todas las features existentes
- Evidence tags (SDD-006) en toda cifra mostrada
- Bandeja de recomendaciones L1 básica

### Fase 2 — Preparación
- Draft preparado L2 en features principales (clasificación, conciliación)
- Diff view en drafts preparados
- Configuración por tenant: nivel máximo global
- Checklist de revisión L2 antes de ejecutar

### Fase 3 — Autonomía
- L3 en features de bajo riesgo (clasificación, detección de duplicados)
- Ejecución programada (cron jobs con nivel L3)
- Dashboard de actividad autónoma
- Flag-off automático por reversal rate

### Fase 4 — Madurez
- Configuración granular por tipo de acción
- Transiciones automáticas L1→L2→L3 basadas en patrones de uso
- Recomendaciones batch con revisión diferida
- Export de configuración L0-L3 para auditoría

---

## 17. Dependencias

| Dependencia | Tipo | Estado |
|------------|------|--------|
| SDD-002 (Fiscal Trust Contracts) | Contiene | Completado |
| SDD-003 (Fiscal Information Architecture) | Referencia | Completado |
| SDD-004 (UX Telemetry Platform) | Provee métricas | Completado |
| SDD-005 (Accessibility Strategy) | Guía accesibilidad | Completado |
| SDD-006 (Evidence System) | Provee evidencia por nivel | Completado |
| SDD-008 (Reversibilidad) | Requiere undo para L2-L3 | Pendiente |
| SDD-010 (Approval Gates) | Requiere aprobación para L3 | Pendiente |
| SDD-015 (Fiscal Onboarding) | Consume modelo L0-L3 | Pendiente |

---

## 18. Criterios de aceptación (DONE)

Esta sección define las condiciones que este SDD debe cumplir para considerar el trabajo completado. No son criterios de implementación — son criterios de especificación.

- [ ] El modelo L0-L3 está definido canónicamente con UI patterns, ejemplos y percepción del usuario para cada nivel
- [ ] La matriz de transiciones verticales y horizontales está completa
- [ ] El indicador de nivel activo tiene especificación visual y de comportamiento
- [ ] Los patrones de UI para cada nivel están documentados con ejemplos concretos
- [ ] Los estados y edge cases están cubiertos
- [ ] La configuración por tenant y por tipo de acción está modelada
- [ ] Las métricas de telemetría están definidas con targets
- [ ] El performance budget está establecido
- [ ] Dependencias identificadas y priorizadas
- [ ] Fases de implementación definidas
- [ ] Riesgos documentados con mitigaciones

---

**Siguiente**: SDD-008 — Reversibilidad de Acciones Fiscales
