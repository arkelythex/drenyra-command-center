---
status: reference
normative: false
consumed_by: SDD-093
---

---
title: "SDD-004 — Plataforma de Telemetría de UX"
description: "Sistema de métricas, dashboards y detección de fricción para validar contratos de confianza fiscal"
version: "1.0"
status: "draft"
priority: "P0 — Fundacional"
wave: "1 — Program & Discovery"
depends_on:
  - SDD-001 (Personas y roles)
  - SDD-002 (Contratos de confianza fiscal)
  - SDD-003 (Arquitectura de Información Fiscal)
---

**Última actualización**: 2026-07-14
**Content type**: Specification
**Status**: Draft
**Priority**: P0 — Fundacional

---

## 1. Abstract

Drenyra está definiendo contratos de confianza fiscal (SDD-002) y una arquitectura de información (SDD-003). Pero sin telemetría, son hipótesis. No sabemos si los usuarios confían más, si encuentran la información que buscan, o si los approval gates generan fricción o seguridad.

Este SDD define la plataforma de telemetría de UX de Drenyra: qué medir, cómo instrumentar, cómo presentar los datos. No es un sistema de analytics genérico — es un sistema de **medición de confianza fiscal**. Cada métrica responde a la pregunta: "¿El sistema está generando la confianza que promete?"

## 2. North star

> ¿Cómo sabemos que Drenyra es fiscalmente confiable? Medimos lo que los usuarios hacen, no lo que dicen.

Cada contrato de SDD-002 tiene una métrica asociada. Cada jornada de SDD-001 tiene un tiempo esperado. Cada modo de navegación de SDD-003 tiene una tasa de éxito. Si no está instrumentado, no está definido.

## 3. Problem statement

Actualmente Drenyra no tiene telemetría de UX. Esto significa:

- **No sabemos si los usuarios completan tareas.** Un contador que abre una conciliación y nunca la termina es invisible.
- **No sabemos si confían en las recomendaciones AI.** Una recomendación que nadie acepta es peor que ninguna.
- **No sabemos dónde hay fricción.** Una pantalla que tarda 8 segundos en cargar, un approval gate que nadie entiende, un search que nunca encuentra — todo invisible.
- **No sabemos si los contratos de confianza funcionan.** Declaramos "evidencia primero" pero no medimos si los usuarios abren las fuentes.

Sin telemetría, todo SDD posterior itera a ciegas.

## 4. Research context

### 4.1 Vínculo con SDD-001

Las personas y JTBD de SDD-001 definen **qué** medir:

| Persona | Trabajo principal | Métrica primaria |
|---------|-------------------|------------------|
| P1 — Contador ind. multi-RUC | Abrir empresa y ver dashboard | Time-to-dashboard, task success rate |
| P2 — Contador small firm | Procesar comprobantes diarios | Throughput por hora, error rate |
| P3 — Supervisor contable | Revisar y aprobar | Approval time, reversal rate |
| P4 — CFO/CEO empresa | Ver estado fiscal consolidado | Time-to-insight, drill-down usage |
| P5 — Contador SIRE/Customs | Preparar declaraciones periódicas | Submission success rate, audit trail review |
| P6 — Contador de transición | Aprender la plataforma | Onboarding completion, support ticket rate |
| P7 — Administrador firm | Gestionar equipo y RUCs | Delegation usage, permission error rate |
| P8 — Auditor externo | Revisar historial | Search success rate, evidence view rate |

### 4.2 Vínculo con SDD-002 (Contratos de confianza)

Cada contrato se traduce en una señal medible:

| Contrato | Métrica de verificación | Señal de violación |
|----------|------------------------|---------------------|
| Evidence | % de acciones donde el usuario abrió la fuente | Acción ejecutada sin ver evidencia |
| Reversibilidad | % de reversiones exitosas dentro de ventana | Reversión solicitada fuera de ventana |
| Human Approval | Tiempo medio de aprobación | Aprobación en <1s (auto-click) |
| Audit Trail | % de acciones con trail completo consultable | Acción sin registro visible |
| RUC Scope | Cambios de contexto explícitos vs implícitos | Operación realizada en RUC incorrecto |
| Progressive Disclosure | Tiempo hasta primera acción significativa por rol | Clicks antes de entender qué hacer |

### 4.3 Vínculo con SDD-003 (IA)

Las rutas de navegación definidas en SDD-003 se convierten en **funnels de navegación**:

- Fiscal Home → Search → Entity Detail → Action = funnel esperado
- Operational Home → Inbox → Review → Approve = funnel esperado
- Exploratory → Multi-entity → Compare → Export = funnel esperado

Cada desviación del funnel esperado es una señal de fricción.

## 5. Invariantes afectados

1. **Privacy by default**: Los datos de telemetría nunca incluyen datos fiscales crudos. IDs de sesión y acción, no RUCs ni montos.
2. **Performance fiscal**: La instrumentación nunca bloquea el rendering. Fire-and-forget con batching.
3. **Consistencia perceptual**: Todos los eventos siguen un taxonomy unificada. No hay eventos ad-hoc.
4. **Keyboard-first**: La telemetría mide también navegación por teclado vs mouse.
5. **WCAG 2.2 AA+**: Los dashboards de telemetría son accesibles. No hay reporting solo-visual.

## 6. Framework de métricas

### 6.1 Cuatro categorías de métricas

| Categoría | Propósito | Ejemplos |
|-----------|-----------|----------|
| **Adoption** | ¿Los usuarios usan las features? | DAU/MAU por rol, feature adoption rate, onboarding completion |
| **Professional** | ¿Completan su trabajo fiscal? | Task success rate, time-on-task, throughput, error rate |
| **Trust** | ¿Confían en el sistema? | Evidence view rate, approval time distribution, reversal rate, confidence score acceptance |
| **Health** | ¿El sistema rinde? | TTI, FCP, INP, bundle size, API latency, error rate |

### 6.2 Métricas de confianza (Trust) — detalle

Las métricas de confianza son las más importantes. Validan SDD-002.

**Evidence Trust Score (ETS)**
```
ETS = (# acciones con fuente consultada) / (# acciones totales)
```
Target: >70% en L2-L3, >40% en L0-L1

**Approval Gate Efficiency (AGE)**
```
AGE = (# aprobaciones en <5min) / (# aprobaciones totales)
```
Target: >80%. Si es <50%, el gate está mal diseñado.
Señal de alerta: approvals en <1s = auto-click = riesgo.

**Trust Velocity (TV)**
Mide cómo cambia el comportamiento a lo largo del tiempo:
- Semana 1-2: usuario mira evidencia antes de aceptar
- Semana 3-4: acepta sin mirar (confianza adquirida)
- Si nunca acepta sin mirar: puede ser desconfianza crónica o UI que no comunica bien

**Reversal Rate (RR)**
```
RR = (# acciones revertidas en ventana) / (# acciones ejecutadas)
```
Target: <5%. Si >15%, las recomendaciones tienen baja calidad o el usuario no entiende las consecuencias.

### 6.3 Métricas de fricción — señales automáticas

| Señal | Detección | Severidad |
|-------|-----------|-----------|
| Rage clicks | 3+ clicks en 2s en elemento no-clickeable | Alta |
| Dead clicks | Click sin respuesta (error silencioso) | Alta |
| Thrashing | Abrir/cerrar modal 3+ veces sin completar | Alta |
| Page reload | Recarga manual después de acción | Media |
| Idle abandon | 5min+ inactivo en wizard sin completar | Media |
| Error repeat | Mismo error 2+ veces en sesión | Media |
| Null search | Búsqueda sin resultados + búsqueda alternativa | Baja |

## 7. Taxonomía de eventos

Cada evento tiene esta estructura canónica:

```typescript
interface TelemetryEvent {
  event: string;            // "navigation.fiscal-home.search"
  timestamp: string;        // ISO 8601 UTC
  session_id: string;       // UUID por sesión
  user_role: string;        // Del SDD-001 role taxonomy
  user_tier: string;        // v0: "contador-ind-multi-ruc"
  
  // Contexto fiscal (anonymized)
  fiscal_context: {
    ruc_count: number;      // Cuántos RUCs tiene el tenant (no los RUCs)
    action_type: string;    // "view" | "edit" | "approve" | "reverse" | "export"
    risk_level: string;     // "low" | "medium" | "high" (si aplica)
  };
  
  // Métricas de performance (automáticas)
  performance: {
    tti?: number;           // Time to interactive (ms)
    fcp?: number;           // First contentful paint (ms)
    api_latency?: number;   // ms
    bundle_size?: number;   // KB
  };
  
  // Metadata de privacidad
  metadata: {
    anonymized: boolean;     // Siempre true
    source: string;          // "web" | "web-keyboard" | "cli"
  };
}
```

### 7.1 Categorías de eventos

| Categoría | Prefijo | Ejemplos |
|-----------|---------|----------|
| Navigation | `navigation.*` | `fiscal-home`, `search`, `entity-detail`, `inbox` |
| Action | `action.*` | `view-source`, `execute`, `approve`, `reject`, `reverse` |
| AI Interaction | `ai.*` | `recommendation-shown`, `recommendation-accepted`, `recommendation-rejected` |
| Trust | `trust.*` | `evidence-opened`, `audit-trail-viewed`, `ruc-switch` |
| Error | `error.*` | `api-error`, `validation-error`, `permission-error` |
| Performance | `perf.*` | `page-load`, `api-latency`, `bundle-chunk` |

### 7.2 Eventos específicos por contrato de SDD-002

| Contrato | Evento trigger | Evento de verificación |
|----------|---------------|----------------------|
| Evidence | `action.execute` con nivel L2+ | `trust.evidence-opened` antes de `action.execute` |
| Reversibilidad | `action.execute` con riesgo >low | `action.reverse` dentro de ventana |
| Human Approval | `action.approve-requested` | `action.approve` o `action.reject` |
| Audit Trail | Cualquier `action.*` | `trust.audit-trail-viewed` en misma sesión |
| RUC Scope | `navigation.ruc-switch` | `action.*` con ruc_count confirmado |
| Progressive Disclosure | `navigation.first-visit` a cada sección | Tiempo hasta primera `action.*` significativa |

## 8. Arquitectura de implementación

### 8.1 Principios

1. **Fire-and-forget**: La instrumentación nunca bloquea el thread principal. PostMessage o requestIdleCallback.
2. **Batching**: Eventos se acumulan en buffer de 5s o 10 eventos, lo que ocurra primero. Batch POST.
3. **Offline queue**: Si no hay red, los eventos se almacenan en IndexedDB (máximo 1000 eventos, FIFO).
4. **Anonymized by default**: No se envía RUC, monto, o datos personales. Solo IDs de sesión y tipo de acción.
5. **Sampling**: 100% para errores y señales de fricción. 10% para navegación pasiva.

### 8.2 Pipeline

```
Browser (SDK) → Batch POST → API Gateway → Kafka/Redis Stream → Analytics DB → Dashboard API → Dashboards
```

El SDK se implementa como un paquete compartido en `packages/telemetry/` que cualquier app de Drenyra importa.

### 8.3 Almacenamiento

- **Session store**: Eventos raw en Redis con TTL de 30 días para debugging
- **Analytics store**: Datos agregados por hora/día en PostgreSQL (tablas de métricas)
- **Retention**: Eventos raw 30 días, agregados 13 meses (por ciclo fiscal peruano)
- **Exportable**: El usuario puede exportar sus propios datos de telemetría (GDPR compliance)

## 9. Dashboards por rol

### 9.1 Dashboard del equipo de producto (interno)

No visible para clientes. Responde: "¿Drenyra está generando confianza?"

- **Trust Health**: ETS, AGE, RR por versión y por tenant
- **Friction Map**: Señales de fricción agregadas por ruta (heatmap de navegación)
- **Funnel Analysis**: Embudos de conversión por JTBD
- **Performance Overview**: TTI, FCP, INP por ruta y por dispositivo
- **Top Errors**: Errores más frecuentes por severidad

### 9.2 Dashboard del administrador del tenant (visible)

Visible en configuración del tenant. Responde: "¿Mi equipo está usando Drenyra efectivamente?"

- **Team Activity**: DAU por miembro del equipo
- **Action Summary**: # de acciones ejecutadas, aprobadas, revertidas
- **Error Rate**: % de operaciones con error por miembro
- **Trust Signals**: Evidence view rate del equipo

### 9.3 Dashboard del contador individual (mínimo)

Solo si hay señales relevantes. Responde: "¿Estoy al día?"

- Operaciones realizadas hoy
- Aprobaciones pendientes
- Errores que requieren atención

## 10. Detección automática de fricción

### 10.1 Algoritmo de fricción

El sistema calcula un **Friction Score (FS)** por sesión:

```
FS = Σ (rage_clicks × 3) + (dead_clicks × 2) + (thrashing × 3) + 
     (idle_abandon × 2) + (error_repeat × 2) + (null_search × 1)
```

**Thresholds**:
- FS < 5: Sesión limpia
- FS 5-15: Fricción moderada — revisar
- FS > 15: Fricción alta — alerta

### 10.2 Alertas automáticas

| Condición | Acción |
|-----------|--------|
| FS > 15 en 5+ sesiones consecutivas de mismo rol | Notificar a equipo de producto + segmentar por feature |
| ETS < 40% en release nueva | Bloquear rollout progresivo |
| RR > 15% en feature específica | Flag-off automático de L3 para esa feature |
| AGE < 50% en approval gate | Revisar diseño del gate |

## 11. Performance budgets (instrumentados)

Las métricas de performance se miden automáticamente y se comparan contra budgets:

| Ruta (de SDD-003) | TTI budget | FCP budget | Bundle budget |
|--------------------|-----------|-----------|--------------|
| Fiscal Home (single RUC) | 2s | 1.2s | 150KB |
| Fiscal Home (multi-RUC) | 2.5s | 1.5s | 200KB |
| Search Results | 1.5s | 1s | 100KB |
| Entity Detail (comprobante) | 2s | 1.2s | 180KB |
| Entity Detail (declaración) | 3s | 1.5s | 250KB |
| Compare View | 3s | 1.5s | 200KB |
| Inbox / Review | 2s | 1.2s | 120KB |
| Audit Trail | 2s | 1s | 100KB |
| Settings / Config | 1.5s | 0.8s | 80KB |

Cada violación de budget genera un evento `perf.budget-violation` que alimenta un dashboard de regresión de performance.

## 12. Privacidad y compliance

### 12.1 Datos que NUNCA se envían a telemetría

- RUCs del tenant
- Nombres, emails, o identificadores de usuarios
- Montos de transacciones
- Detalles de comprobantes (serie, número, tipo)
- Consultas SQL o parámetros de API

### 12.2 Datos que SÍ se envían (anonymized)

- Tipo de acción sin contexto de datos
- Rol del usuario (no identidad)
- Duración de sesiones
- Patrones de navegación (ruta, no contenido)
- Métricas de performance
- Señales de fricción

### 12.3 Consentimiento

- La telemetría de producto requiere opt-in explícito del administrador del tenant
- La telemetría de rendimiento (perf.*) siempre activa pero anonymized
- El usuario puede descargar sus datos de telemetría en cualquier momento

## 13. Estrategia de implementación

### 13.1 Fases

| Fase | Alcance | Eventos | Dashboard | Dependencia |
|------|---------|---------|-----------|-------------|
| **Fase 1 — Core** | Performance + errores | `perf.*`, `error.*` | Performance dashboard | SDK package |
| **Fase 2 — Navigation** | Rutas de SDD-003 | `navigation.*` | Funnel analysis | SDD-003 |
| **Fase 3 — Trust** | Contratos de SDD-002 | `action.*`, `trust.*` | Trust dashboard | SDD-002 |
| **Fase 4 — Friction** | Señales de fricción | Todas + algoritmos | Friction map | Fases 1-3 |

### 13.2 Integración con CI/CD

Cada PR que toca una ruta definida en SDD-003 debe:
1. No romper eventos existentes (breaking change detection en taxonomy)
2. Reportar impacto en performance budgets
3. Incluir identificación del nuevo evento en el changelog de telemetría

## 14. Métricas de éxito del SDD-004

| Métrica | Target | Cómo se mide |
|---------|--------|--------------|
| Cobertura de eventos | >90% de acciones fiscales instrumentadas | Auditoría de taxonomy vs eventos emitidos |
| Latencia de SDK | <5ms overhead por evento | Performance measurement en CI |
| Batch success rate | >99.5% | Eventos recibidos / eventos emitidos |
| Friction detection accuracy | >80% de señales confirmadas por usuario | Feedback loop con equipo de producto |
| Dashboard adoption (equipo) | >80% del equipo revisa dashboards semanalmente | Login a dashboard |
| Time-to-alert | <1 hora desde señal de fricción hasta alerta | Latencia pipeline |

## 15. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| SDK overhead afecta performance percibida | Baja | Alto | Fire-and-forget + batching, medir overhead en CI |
| Datos sensibles filtrados por error en telemetría | Baja | Crítico | Anonymized por defecto, code review obligatorio de eventos |
| Baja adopción de dashboards | Media | Medio | Integrar dashboards en herramientas existentes (Slack, email semanal) |
| Taxonomy se vuelve inconsistente entre equipos | Media | Alto | Schema registry + CI validation de eventos |
| Friction detection genera falsos positivos | Alta | Bajo | Umbrales configurables, feedback loop de verificación |

## 16. Dependencias

| SDD | Relación | Riesgo |
|-----|----------|--------|
| SDD-001 (Personas/roles) | Taxonomía de roles para segmentación de métricas | Sin SDD-001, dashboards no tienen segmentación |
| SDD-002 (Contratos) | Eventos de trust validan contratos | Sin SDD-002, no sabemos qué medir |
| SDD-003 (IA) | Rutas para funnels de navegación | Sin SDD-003, no tenemos árbol de navegación |
| Paquete `packages/telemetry/` | SDK compartido | No existe aún — crear en paralelo |

SDD-004 no bloquea implementación de UI, pero sin SDD-004 no podemos **validar** que la UI funciona.

## 17. Acceptance criteria

- [ ] Taxonomía de eventos definida y documentada
- [ ] SDK de telemetría implementado en package compartido
- [ ] Cobertura de >90% de acciones fiscales instrumentadas
- [ ] Performance dashboard funcional con TTI, FCP, INP por ruta
- [ ] Trust dashboard funcional con ETS, AGE, RR
- [ ] Señales de fricción detectándose automáticamente
- [ ] Privacy review completado: sin datos fiscales en telemetría
- [ ] Budgets de performance definidos y monitoreados en CI
- [ ] Dashboard de equipo de producto accesible
- [ ] Dashboard de administrador de tenant funcional (opt-in)

## 18. DONE criteria (gate G2)

Para considerar SDD-004 completado:

1. **Taxonomía documentada** y accesible para todos los equipos
2. **SDK implementado** en un package compartido con API estable
3. **Pipeline de datos** operativo (eventos → almacenamiento → dashboard)
4. **3+ dashboards funcionales** con datos reales de sesiones de desarrollo
5. **Alertas automáticas** configuradas para ETS, AGE, RR, y Friction Score
6. **Privacy review aprobado** por el equipo de programa
7. **Pruebas de performance del SDK** documentadas con overhead <5ms
8. **Documentación de onboarding** para que otros SDDs puedan instrumentar sus eventos

---

**Siguiente**: SDD-005 — Estrategia de Accesibilidad Fiscal
