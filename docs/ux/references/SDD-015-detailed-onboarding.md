---
status: reference
normative: false
consumed_by: SDD-070
---

---
title: "SDD-015 — Fiscal Onboarding Progresivo"
description: "Sistema de incorporación progresiva para contadores multi-RUC — guía contextual, checklists funcionales y descubrimiento gradual de capacidades"
version: 1.0
tags: [onboarding, progressive-disclosure, activation, feature-discovery, guidance]
audience: [ux-engineer, frontend-engineer, product-manager]
status: draft
ola: "3 — Experience Platform"
dependencies: [SDD-001, SDD-002, SDD-003, SDD-007, SDD-009, SDD-014]
---

# SDD-015 — Fiscal Onboarding Progresivo

**Última actualización**: 2026-07-14

---

## 1. Abstract

El contador llega a Drenyra y el sistema está vacío. No hay comprobantes, no hay conciliaciones, no hay historia. La primera experiencia define si vuelve o abandona. Este SDD define un sistema de incorporación progresiva que transforma el vacío inicial en una secuencia guiada de descubrimiento: conectar el primer RUC, ver el primer insight fiscal, ejecutar la primera acción con confianza. Cada etapa revela solo lo necesario para el siguiente paso, aplicando progressive disclosure (I7) sobre la base de los trust contracts (SDD-002) y la evidencia-first content (SDD-014). El objetivo es que un contador llegue a su primer "aha moment" en <10 minutos sin sentirse abrumado.

---

## 2. North Star

> "Que un contador que abre Drenyra por primera vez complete su primera revisión fiscal en menos de 10 minutos, sin leer un manual, sin llamar a soporte, y con suficiente confianza para traer su segundo RUC al día siguiente."

---

## 3. Problem Statement

### 3.1 El vacío inicial

Un sistema fiscal sin datos es un desierto. El contador enfrenta:

- **Pantallas vacías**: tablas sin filas, dashboards sin métricas, gráficos sin datos
- **Parálisis de decisión**: "¿por dónde empiezo?" sin guía
- **Fricción de setup**: conectar SUNAT, cargar comprobantes, configurar período fiscal
- **Miedo al error**: sin historia, cada primera acción se siente irreversible
- **Abandono prematuro**: el 40-60% de usuarios SAAS abandonan en la primera semana si no ven valor inmediato

### 3.2 Costos fiscales del mal onboarding

- Rezago en detección de inconsistencias
- Configuración incorrecta de período fiscal
- Multi-RUC mal vinculado
- Omisión de datos críticos por desconocimiento

### 3.3 Por qué progressive y no un tour

Los tours tradicionales (10 pasos modales "click next") fallan porque:
- No respetan el contexto real del usuario
- Son unidireccionales (no se adaptan al segmento)
- Se saltan o se ignoran
- No miden activación real

Un onboarding progresivo secuencia capacidades por valor, no por orden de features.

---

## 4. User Research Links

- **SDD-001**: Segmentos S1-S6, arquetipos P1-P8 — onboarding distinto por banda de clientes y sofisticación técnica
- **SDD-001 §13**: Preguntas de activación validadas con 18 entrevistas
- **SDD-003**: Homes por rol — onboarding debe terminar en home relevante
- **SDD-014**: Evidence-first content — primer insight fiscal debe mostrar evidencia desde el día 1

---

## 5. Invariants Affected

| Invariant | Relation | Cómo lo aplica |
|-----------|----------|----------------|
| I7 — Progressive Disclosure | Primario | Cada etapa revela solo lo necesario para el siguiente paso |
| I8 — Offline Resilience | Secundario | Algunas etapas de onboarding deben funcionar offline (exploración post-setup) |
| I15 — Privacy by Default | Primario | No compartir datos del onboarding con terceros; datos de uso anonimizados |
| I1 — RUC Scoping | Primario | Onboarding multi-RUC: cada RUC tiene su propio progreso |
| I2 — Explainability | Secundario | Cada paso explica POR QUÉ es necesario, no solo QUÉ hacer |

---

## 6. L0-L3 Mapping for Onboarding

| Level | Role | Descripción |
|-------|------|-------------|
| L0 | Explain | "Tu RUC 20123456789 no tiene comprobantes cargados. Así puedes importarlos desde SUNAT." |
| L1 | Recommend | "Te recomendamos empezar importando los comprobantes de Enero 2026 — es el mes que vence primero." |
| L2 | Prepare | "He preparado la importación de tus últimos 3 meses de comprobantes. Revisa y confirma." |
| L3 | Execute | Auto-import de comprobantes al conectar SUNAT por primera vez (solo si usuario activó L3) |

El onboarding progresa naturalmente de L0 a L2: el usuario empieza en L0 (explicación), recibe recomendaciones L1, y al familiarizarse puede aceptar acciones preparadas L2. L3 en onboarding es opt-in explícito.

---

## 7. Onboarding Stages

El onboarding se divide en 5 etapas secuenciales pero no bloqueantes (el usuario puede saltar etapas si ya tiene contexto).

### Stage 1: Welcome — First Value in <2 min

**Objetivo**: El usuario entiende QUÉ es Drenyra y ve valor inmediato sin datos.

**Pasos**:
1. Landing post-login: "Bienvenido, [nombre]. Drenyra es tu centro de inteligencia fiscal."
2. Value prop contextual: según rol (SDD-001), muestra el caso de uso principal
3. Llamado a acción único: "Conectar mi primer RUC" (botón grande, primary)
4. Opcional: "Explorar sin datos" (sandbox mode con datos de demostración)

**UI**: Pantalla completa tipo hero, no modal. Progreso general abajo (1/5).

**Mínimo para completar**: Click en "Conectar mi primer RUC" o "Explorar sin datos".

### Stage 2: RUC Connection — First Data in <5 min

**Objetivo**: El usuario conecta su primer RUC y el sistema comienza a obtener datos.

**Pasos**:
1. Formulario de RUC con validación de dígito verificador y búsqueda automática en SUNAT
2. Selección de período fiscal inicial (default: último mes cerrado)
3. Conexión SUNAT Clave SOL (o modo manual para datos en Excel/CSV)
4. Feedback visual: "Conectando con SUNAT..." con progreso real
5. Confirmación: "RUC 20123456789 conectado. Estamos obteniendo tus comprobantes."
6. Transición suave a Stage 3 con datos parciales

**UI**: Wizard en 3 pasos (RUC → Período → Conexión), no modal, en página dedicada. Cada paso tiene validación inline.

**Edge cases**:
- RUC ya existe en el sistema → "Este RUC ya está registrado. ¿Deseas unirte al equipo existente?" (invitación SSO)
- Clave SOL incorrecta → Error claro, recuperable, sin penalización
- SUNAT caída → Onboarding continúa en modo manual

### Stage 3: First Fiscal Insight — Aha Moment in <10 min

**Objetivo**: El usuario ve su primer insight fiscal con evidencia (SDD-014).

**Pasos**:
1. Dashboard minimalista con datos reales del RUC conectado
2. Insight principal: "Tienes 3 comprobantes por vencer este mes." o "Tu IGV mensual es S/ 12,450."
3. Evidence badge (SDD-006): cada número muestra su fuente (SUNAT, derivado, etc.)
4. Trust indicator (SDD-002): "Datos actualizados hace 2 min desde SUNAT."
5. Call-to-action suave: "Revisar comprobantes" o "Ver detalle de IGV"

**UI**: Dashboard reducido a 3 cards (Resumen, Próximos vencimientos, Últimos comprobantes). Cada card es clickeable y lleva a la home de ese dominio (SDD-003).

**Estados**:
- Con datos SUNAT: insights reales
- Sin datos SUNAT: "Conecta tu RUC para ver tus primeros insights" (Stage 2 pendiente)
- Datos parciales: insights con placeholder + indicador "cargando más datos"

### Stage 4: First Action — Trust Building

**Objetivo**: El usuario ejecuta su primera acción fiscal con confianza.

**Opciones de primera acción** (según perfil):
- Perfil contador: Revisar y aceptar un comprobante
- Perfil admin: Invitar a un colega al equipo
- Perfil reviewer: Aprobar una conciliación simple
- Perfil nuevo en fiscal: Explorar el reporte de resumen mensual

**UI**: 
- La acción elegida se presenta con safety cues (SDD-002): reversibilidad visible, evidencia expandible
- Pre-action confirmation: "¿Estás seguro de aceptar este comprobante? Puedes revertirlo en los próximos 5 minutos."
- Post-action celebration: "¡Listo! Has completado tu primera acción fiscal en Drenyra."

**Progreso**: Stage 1-4 se marcan como completadas permanentemente.

### Stage 5: Capability Discovery — Progressive Feature Reveal

**Objetivo**: El usuario descubre capacidades gradualmente sin abrumarse.

**Mecanismo**: Feature flags progresivos por tiempo de uso y acciones completadas.

| Disparador | Feature que se revela |
|------------|----------------------|
| 1er RUC conectado | Dashboard básico + Comprobantes |
| 1a acción completada | Conciliación simple |
| 3 días de uso | Reportes + Exportación PDF |
| 2do RUC conectado | Vista comparativa multi-RUC |
| 1a semana | L1 Recomendaciones AI activadas |
| 1a conciliación completada | L2 Acciones preparadas |
| 5 acciones completadas | Atajos de teclado + Export batch |
| Onboarding completado | Configuración avanzada + Notificaciones |

**UI Pattern**: Badge "NUEVO" en nav items durante 3 días post-revelación. Coach mark sutil (1 sola vez) señalando la ubicación. No más de 1 feature revelada por sesión.

---

## 8. UI Components

### 8.1 Onboarding Shell

Contenedor que envuelve las etapas 1-4. Elementos:
- Header con logo + progress bar (etapa actual / total)
- Contenido central con call-to-action principal
- Footer con "Saltar onboarding" (link pequeño, navega a home)
- Skip permanece como opción "Volver al onboarding" en help menu

### 8.2 Progress Bar de Onboarding

- 5 dots con labels cortos: "Bienvenida" → "RUC" → "Insight" → "Acción" → "Descubrir"
- Dot actual = filled + animación pulse
- Dot completado = filled + checkmark
- Dot pendiente = outline
- Click en dot completado permite revisitar (solo lectura)

### 8.3 RUC Connection Wizard

- Step 1: RUC input con autocomplete y validación (11 dígitos, dígito verificador)
- Step 2: Selector de período fiscal (mes + año) con default inteligente
- Step 3: Conexión SUNAT (Clave SOL) o Upload manual
- Summary step: "Vas a conectar RUC X para el período Y"

### 8.4 First Insight Card Grid

```typescript
interface InsightCard {
  title: string          // "Comprobantes por vencer"
  value: string          // "3"
  unit: string           // "comprobantes"
  evidence: EvidenceBadge // SDD-006
  trend?: 'up' | 'down' | 'stable'
  action: {              // CTA opcional
    label: string        // "Revisar"
    href: string         // Ruta a home correspondiente
  }
  state: 'loading' | 'empty' | 'partial' | 'ready' | 'error'
}
```

Máximo 3 cards visibles simultáneamente. Diseño responsive (1 col móvil, 3 col desktop).

### 8.5 Post-Action Celebration

Componente transitorio (auto-dismiss 5s, permanece 30s si no hay interacción):

- Checkmark animado + "¡Primera acción completada!"
- Resumen de lo que pasó (evidence-first)
- Siguiente paso sugerido: "¿Listo para tu segunda acción? [Conciliar comprobantes]"
- Opción "Ver mi progreso" → abre checklist de onboarding

### 8.6 Feature Badge NUEVO

```typescript
interface FeatureBadge {
  feature: string        // ID del feature revelado
  label: string          // "NUEVO"
  expiresAt: Date        // 3 días post-revelación
  dismissable: boolean   // true — puede descartarse
  coachMark?: string     // Texto opcional de coach mark
}
```

### 8.7 Onboarding Checklist

Accesible desde el menú de ayuda o atajo Ctrl+Shift+O:

- Lista de todas las etapas y sub-pasos
- Estado: pending / in_progress / completed / skipped
- Progreso general: "63% completado"
- Sección "Descubierto": features revelados y por explorar

---

## 9. States & Edge Cases

### 9.1 First-time user (nunca ha usado Drenyra)

Flujo completo: Stage 1 → 2 → 3 → 4 → 5 progresivo.

### 9.2 Returning user (onboarding incompleto)

- Si dejó en Stage 2 (RUC connection): retoma desde Stage 2
- Si dejó en Stage 3 (insight): retoma desde Stage 3, pero actualiza datos si pasaron >24h
- Si dejó en Stage 4 (first action): retoma desde Stage 4, ofreciendo acción pre-completada

### 9.3 Expert user (contador con 15+ años, que ya usó herramientas fiscales)

- Skip onboarding button visible desde Stage 1
- Opción "Modo experto" al login: onboarding comprimido a 2 pasos (RUC → Dashboard)
- Pre-selección inteligente de período basado en mes fiscal peruano (Marzo)

### 9.4 Multi-RUC user

- Stage 2 se repite por cada RUC nuevo
- Stage 3 muestra insight consolidado multi-RUC si tiene 2+ RUC conectados
- Progreso individual por RUC + progreso general de onboarding

### 9.5 Power user que migra desde otro sistema

- Onboarding extendido con "Importar desde [sistema anterior]" (SDD-015 v2)
- Mapeo de data histórica
- Comparativa "Así se veía en [sistema] vs Drenyra"

### 9.6 Offline during onboarding

- Stages 1 y 2 requieren conexión (validación RUC, SUNAT)
- Stage 3 puede funcionar offline si ya hay datos cacheados
- Stage 4 y 5 funcionan offline
- Indicador claro cuando una etapa requiere conexión

### 9.7 Error states

- SUNAT timeout: "No pudimos conectar con SUNAT. Puedes continuar en modo manual."
- RUC inválido: validación inline inmediata, ejemplo de RUC válido visible
- Datos vacíos después de conexión: "Tu RUC no tiene comprobantes en este período. ¿Quieres probar con otro mes?"

---

## 10. Progressive Disclosure Logic

El core del onboarding es decidir QUÉ mostrar y CUÁNDO. Reglas:

```
Rule 1: No mostrar un feature hasta que el usuario haya completado la etapa que lo precede
Rule 2: No mostrar más de 1 feature nuevo por sesión
Rule 3: No mostrar coach marks durante una acción fiscal activa
Rule 4: Si el usuario descarta un feature badge 3 veces, ocultarlo permanentemente
Rule 5: Si el usuario completa la misma acción 3 veces, considerar que el feature está "aprendido"
```

### Feature Registry

```typescript
interface OnboardingFeature {
  id: string
  stage: 1 | 2 | 3 | 4 | 5
  trigger: 'time' | 'action' | 'ruc_count' | 'days_active' | 'manual'
  triggerValue: number | string
  navPath: string                    // Ruta donde aparece
  badgeText: string                  // "NUEVO" o custom
  coachMark?: string                 // Texto del tooltip
  prerequisite?: string[]            // Feature IDs que deben estar completados
}
```

---

## 11. Accessibility

### 11.1 WCAG 2.2 AA Compliance

| Componente | Criterio | Implementación |
|------------|----------|----------------|
| Onboarding Shell | 2.4.3 Focus Order | Tab sequence natural: progress → content → CTA → skip |
| RUC Connection Wizard | 3.3.2 Labels | Cada input tiene label asociado vía `for`/`aria-labelledby` |
| Insight Cards | 1.1.1 Non-text Content | Valores numéricos con `aria-label` descriptivo |
| Post-Action Celebration | 4.1.3 Status Messages | `role="status"` con `aria-live="polite"` |
| Feature Badge NUEVO | 2.4.7 Focus Visible | Badge recibe foco con outline visible |
| Onboarding Checklist | 2.4.6 Headings | Jerarquía h2/h3 consistente |
| Coach Marks | 2.4.12 Focus Not Obscured | Coach mark no oculta el elemento señalado |

### 11.2 Keyboard Navigation

| Atajo | Acción | Contexto |
|-------|--------|----------|
| `Ctrl+Shift+O` | Abrir Onboarding Checklist | Global |
| `Ctrl+Shift+N` | Saltar al siguiente stage | Durante onboarding activo |
| `Esc` | Cerrar coach mark / badge | Coach mark visible |
| `Tab` | Navegar entre opciones de wizard | Wizard RUC |
| `Enter` | Confirmar paso de wizard | Wizard RUC |

### 11.3 Live Regions

- Cambio de stage en progress bar: `aria-live="polite"` con texto "Etapa 2 de 5: Conexión de RUC"
- Error en conexión SUNAT: `role="alert"`
- Post-action celebration: `role="status"`
- Nuevo feature revelado: `aria-live="polite"` con "Nueva funcionalidad disponible: Conciliación"

### 11.4 Screen Reader Optimization

- Progress bar: `role="progressbar"` con `aria-valuenow`/`aria-valuemin`/`aria-valuemax`
- Wizard steps: `role="tablist"` + `role="tab"` + `role="tabpanel"`
- Insight cards: `article` con `aria-labelledby` en el título
- Saltar onboarding: link visible siempre (no skip-to-content oculto)

---

## 12. Performance Budget

| Ruta | Target | Peor caso |
|------|--------|-----------|
| Stage 1 (Welcome) | <1s LCP | 1.5s |
| Stage 2 (RUC Wizard) | <2s interactividad | 3s (incluye validación API) |
| Stage 3 (Insights) | <1.5s LCP | 2.5s (con datos parciales) |
| Stage 4 (First Action) | <1s TTI | 2s |
| Stage 5 (Feature Badge) | <500ms revelado | 1s |
| Onboarding Checklist | <800ms TTI | 1.5s |

Bundle budget:
- Onboarding chunk: <50KB JS (gzip) + <10KB CSS
- RUC Wizard chunk: <30KB JS (lazy-loaded, solo en Stage 2)
- Insight cards: shared component library (no duplicación)
- No librerías third-party de onboarding (cero dependencias externas)

---

## 13. Success Metrics

### 13.1 Activation Metrics

| Métrica | Target | Cómo se mide (SDD-004) |
|---------|--------|------------------------|
| Tiempo hasta Stage 3 completo | <10 min | Evento `onboarding_stage_completed` con timestamp |
| Tasa de finalización de onboarding | >70% | Usuarios que llegan a Stage 5 / total signups |
| Tasa de skip | <15% | Click en "Saltar onboarding" en Stage 1-2 |
| Tasa de retorno día 2 | >60% | Login dentro de 24-48h post-onboarding |
| Tasa de conexión de 2do RUC | >30% en 7 días | Segundo RUC conectado / total completaron Stage 2 |

### 13.2 Professional Metrics

| Métrica | Target |
|---------|--------|
| Tiempo hasta primera acción fiscal | <15 min desde signup |
| Acciones en primera semana | >5 acciones |
| Features distintos usados en primera semana | >3 features |
| Tasa de error en primera acción | <5% |

### 13.3 Trust Metrics

| Métrica | Target |
|---------|--------|
| Confidence Score en primera acción (SDD-006) | >0.8 |
| Tasa de reversión en primeras 10 acciones | <5% |
| NPS post-onboarding | >40 |

---

## 14. Risks

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|--------|-------------|---------|------------|
| R1 | Usuario abandona en Stage 1 porque "no tengo tiempo para onboarding" | Alta | Alto | Skip visible + modo experto comprimido |
| R2 | Clave SOL incorrecta → usuario frustrado y abandona | Media | Alto | Error recovery claro + modo manual como alternativa |
| R3 | SUNAT caída durante Stage 2 → onboarding bloqueado | Media | Medio | Continuar con modo manual + notificar cuando SUNAT vuelva |
| R4 | Usuario salta onboarding y luego se siente perdido | Alta | Medio | "Volver al onboarding" en menú ayuda + checklist accesible |
| R5 | Feature badges se vuelven ruido → usuario los ignora | Media | Medio | Máximo 1 por sesión + 3 descartes = ocultar permanente |
| R6 | Usuario multi-RUC se aburre de repetir Stage 2 por cada RUC | Media | Alto | Batch RUC connection (conectar varios a la vez en v2) |
| R7 | Experto siente que onboarding lo trata como principiante | Alta | Alto | Detección de expertise por tiempo de setup + modo experto |

---

## 15. Dependencies

| SDD | Dependencia | Impacto si falta |
|-----|-------------|------------------|
| SDD-001 | Segmentos, arquetipos, roles | Onboarding genérico sin personalización por perfil |
| SDD-002 | Trust contracts | Primeras acciones sin safety cues → riesgo de confianza |
| SDD-003 | Information architecture, homes | Onboarding no sabe a dónde llevar al usuario después |
| SDD-007 | L0-L3 model | Imposible escalar el guidance del onboarding |
| SDD-009 | RUC scoping visible | Stage 2 no puede mostrar multi-RUC correctamente |
| SDD-014 | Evidence-first content | Insights sin badges de evidencia → trust no se construye |
| Auth system | Login, sesión, RUC session | Stage 1 no puede personalizar bienvenida |
| SUNAT API | Conexión Clave SOL, validación RUC | Stage 2 no puede verificar RUC automáticamente |
| Feature flags system | Feature registry, toggle remoto | Stage 5 no puede revelar features programáticamente |

---

## 16. DONE Criteria

Un Stage se considera DONE cuando:

- [ ] Todos los componentes UI del stage están implementados según §8
- [ ] Todos los estados del stage están cubiertos (§9)
- [ ] Accessibility compliance verificada (§11)
- [ ] Performance budget cumplido (§12)
- [ ] Keyboard navigation functional
- [ ] Screen reader tested
- [ ] Test de usabilidad con 3 usuarios del segmento target
- [ ] Error recovery paths probados
- [ ] Offline behavior verificado

El SDD-015 completo se considera DONE cuando:

- [ ] Stages 1-4 implementados y probados con usuarios reales
- [ ] Stage 5 (Feature Badge) implementado con al menos 8 features en el registry
- [ ] Modo experto implementado y testeado con contadores senior
- [ ] Onboarding Checklist accesible desde menú de ayuda
- [ ] Métricas de activación en dashboard de telemetría (SDD-004)
- [ ] Tasa de finalización de onboarding >70% en pruebas controladas
- [ ] Tiempo hasta Stage 3 <10 min en pruebas controladas
- [ ] Skip rate <15% en pruebas controladas
- [ ] Multi-RUC flow probado con 2+ RUCs
- [ ] Documentación de onboarding para equipo de soporte

---

## 17. Changelog

| Fecha | Versión | Cambio |
|-------|---------|--------|
| 2026-07-14 | 1.0 | Versión inicial — 5 stages, progressive disclosure, feature registry |

---

**Siguiente**: SDD-016 — Sistema de Layout y Navegación Global
