# SDD Proposal: Skills Library + Automations

**Última actualización:** 2026-07-02
**Estado:** Propuesta
**Plan SDD:** 5 de 6
**Paralelo:** Plan 1 (necesita sidebar + routing) y Plans 2-4 (puede diseñarse en paralelo)

---

## Executive Summary

Crear dos superficies complementarias: **Skills Library** — un marketplace/registry de skills contables extensibles, y **Automations** — un sistema de rutinas automáticas que ejecutan skills en background y dejan resultados en Review Queue. Inspirado en los skills de Codex App y los plugins de Cursor.

---

## Problem

Actualmente las capacidades de los agentes están acopladas al código. No hay forma de ver qué skills están disponibles, instalarlos por cliente, o configurar rutinas automáticas. El contador no puede decir "quiero que todos los días a las 7 AM revises nuevos comprobantes SUNAT y me dejes una cola de revisión" sin tocar código.

---

## Solution

### Pantalla: Skills Library

```txt
Skills Library — Andrés Capital SAC

Accounting Skills
────────────────────────────────────────────────────────
SIRE Skill                                 [Installed]
  Validar RUC · Consultar comprobantes
  Comparar SIRE · Preparar declaraciones

Tax Risk Skill                              [Installed]
  Detracciones · Percepciones · Retenciones
  Crédito fiscal · Gastos no deducibles

Close Skill                                 [Available]
  Devengos · Provisiones · Diferencia de cambio
  Depreciación · Cierre mensual

Audit Skill                                 [Available]
  Evidencia · Trazabilidad · Cambios
  Reporte para auditoría

─────────────── Available for install ───────────────
Bank Reconciliation Skill                    [Install]
  BCP · BBVA · Interbank · Scotiabank
  Yape / Plin empresarial

Payroll Skill                                [Install]
  Planillas · CTS · Gratificaciones
  Essalud · ONP · AFP
```

### Skill Detail View

```txt
SIRE Skill
────────────────────────────────────────
Versión: 2.1.0 · Autor: ARKELYTHEX
Requiere: API SUNAT, acceso a SIRE

Capacidades:
◉ Validar RUC — consulta estado, condición, domicilio
◉ Consultar comprobantes — obtiene XML/CDR de SUNAT
◉ Comparar SIRE — cruza libros electrónicos con SUNAT
◎ Preparar declaraciones — genera DJ IGV, DJ Renta

Configuración por cliente:
☑ Activar para Andrés Capital SAC
☑ Ejecutar automáticamente al crear thread SIRE
☐ Notificar solo si hay diferencias

[ Configure ] [ Disable ] [ Uninstall ]
```

### Pantalla: Automations

```txt
Automations

Cada día a las 7:00 AM                            [Active]
  → Revisar nuevos comprobantes SUNAT
  → Cruzar con documentos del cliente
  → Detectar faltantes
  → Generar cola de revisión
  Skills: SIRE Skill

Cada viernes a las 6:00 PM                        [Active]
  → Conciliar bancos
  → Detectar pagos sin factura
  → Preparar mensaje al cliente
  Skills: Bank Reconciliation Skill

Cada fin de mes                                   [Paused]
  → Preparar cierre
  → Proponer asientos
  → Calcular IGV
  → Empaquetar evidencia
  Skills: SIRE + Bank + Close + Audit
  Autonomía: Proponer, no publicar

[ + New Automation ]
```

### Componentes nuevos

**Skills:**

1. **SkillsLibraryPage** — Página principal con grid de skills instalados/disponibles.
2. **SkillCard** — Card de skill: nombre, capacidades, estado, versión.
3. **SkillDetailPage** — Vista detallada de skill: capacidades, configuración, dependencias.
4. **SkillInstallButton** — Botón de instalación con confirmación.
5. **SkillConfigPanel** — Panel de configuración por cliente.
6. **SkillSearchBar** — Búsqueda y filtro de skills.

**Automations:**

1. **AutomationsPage** — Página principal de rutinas automáticas.
2. **AutomationCard** — Card de automation: trigger, acciones, skills, estado.
3. **AutomationCreateWizard** — Wizard multi-paso para crear automation.
4. **AutomationTriggerConfig** — Configuración de trigger (schedule, evento).
5. **AutomationActionList** — Lista de acciones (skills a ejecutar, orden, parámetros).
6. **AutomationLogTimeline** — Timeline de ejecuciones pasadas.
7. **AutomationToggle** — Toggle on/off para cada automation.

### API endpoints nuevos

| Endpoint                      | Método | Propósito                       |
| ----------------------------- | ------ | ------------------------------- |
| `/api/skills`                 | GET    | Listar skills disponibles       |
| `/api/skills/:id`             | GET    | Detalle de skill                |
| `/api/skills/:id/install`     | POST   | Instalar skill en cliente       |
| `/api/skills/:id/uninstall`   | POST   | Desinstalar skill de cliente    |
| `/api/skills/:id/config`      | PATCH  | Configurar skill por cliente    |
| `/api/automations`            | GET    | Listar automations              |
| `/api/automations`            | POST   | Crear automation                |
| `/api/automations/:id`        | PATCH  | Actualizar automation           |
| `/api/automations/:id/toggle` | POST   | Activar/desactivar              |
| `/api/automations/:id/logs`   | GET    | Logs de ejecución               |
| `/api/automations/run`        | POST   | Ejecutar automation manualmente |

### Dominio nuevo

```
packages/domain/src/
  skill/
    skill.ts              → Skill entity
    skill-id.ts           → SkillId (branded)
    skill-capability.ts   → SkillCapability value object
    skill-installation.ts → SkillInstallation entity (per client)

  automation/
    automation.ts         → Automation entity
    automation-id.ts      → AutomationId
    automation-trigger.ts → AutomationTrigger value object
    automation-action.ts  → AutomationAction value object
    automation-log.ts     → AutomationLog entity
```

---

## Architecture

```tsx
// Skills Library
<AgenticLayout>
  <AgenticSidebar />
  <main>
    <SkillsLibraryPage>
      <SkillSearchBar />
      <div className="skills-grid">
        <SkillCard installed />
        <SkillCard installed />
        <SkillCard available />
        <SkillCard available />
      </div>
    </SkillsLibraryPage>
  </main>
  <RightInspector />    {/* Skill detail cuando se selecciona */}
</AgenticLayout>

// Automations
<AgenticLayout>
  <main>
    <AutomationsPage>
      <div className="automations-list">
        <AutomationCard active />
        <AutomationCard active />
        <AutomationCard paused />
      </div>
      <AutomationCreateWizard />  {/* Dialog/modal */}
    </AutomationsPage>
  </main>
</AgenticLayout>
```

**Estado:** Zustand stores para skills y automations con TanStack Query para datos del servidor.

---

## Dependencies

- **Paralelo con**: Plans 1-4 (no tiene dependencias funcionales fuertes; necesita sidebar y routing de Plan 1)
- **Independiente de**: Plans 2, 3, 4, 6 (puede diseñarse e implementarse en paralelo)
- **Dependencia técnica**: drenyra-orchestrator debe poder ejecutar skills configurados externamente

---

## Delivery

**Estrategia:** auto-chain — 4 PRs

| PR  | Scope                                                        | Archivos | Líneas |
| --- | ------------------------------------------------------------ | -------- | ------ |
| PR1 | Domain entities (skill + automation) + persistence schemas   | 10-12    | ~350   |
| PR2 | Skills API + Automations API                                 | 8-10     | ~350   |
| PR3 | Skills UI (LibraryPage, SkillCard, SkillDetail, config)      | 10-12    | ~400   |
| PR4 | Automations UI (AutomationsPage, CreateWizard, logs, toggle) | 12-14    | ~400   |

**Riesgos:**

- Skills requieren que drenyra-orchestrator exponga un contrato de capacidades — verificar.
- Automations schedule engine puede requerir integración con sistema de colas (Bull/Bun queues).
- La configuración por cliente de skills puede complejizar el modelo de datos.

---

## Non-goals

- No se implementa un marketplace público de skills (solo interno ARKELYTHEX)
- No se implementan skills de terceros
- No se implementa el sistema de evidencia (Plan 6)
- No se implementa diff contable (Plan 4)
