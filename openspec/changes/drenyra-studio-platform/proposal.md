# SDD Proposal: Drenyra Studio, Skills & Automation Platform

**Última actualización:** 2026-07-23
**Estado:** Propuesta
**Plan SDD:** Nuevo — CAP-STUD-01 a CAP-STUD-06
**Depende de:** drenyra-skills-automations (proposal existente, se absorbe), drenyra-s1-ai-consolidation (propuesta existente, alineación)

---

## Executive Summary

Formalizar la plataforma de agentes, skills, automatizaciones y políticas de Drenyra en cuatro fases: (1) documentar y reestructurar el runtime de agentes (`ai-swarm`, 144 archivos, 56 tests), (2) construir el builder visual de automatizaciones para contadores y panel de control para administradores, (3) crear el editor de skills personalizadas y el policy studio visual, y (4) completar el panel de administración con analytics, auditoría y gestión de usuarios. Todo sobre roles duales: superficie amigable para el contador, panel de control con permisos elevados para el admin Drenyra.

---

## Current State

### Inventario de capacidades existentes

| Capability                             | Código                                                                                                                | Estado                                            | Archivos                  | Tests           | Feature Flag |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------- | --------------- | ------------ |
| CAP-STUD-01: CLI                       | `apps/cli/`                                                                                                           | ✅ Archivado (SDD completado)                     | Go CLI + TUI              | —               | —            |
| CAP-STUD-02: API Developer Platform    | —                                                                                                                     | ○ Borrador (SDD separado: `drenyra-api-platform`) | —                         | —               | —            |
| CAP-STUD-03: Custom Skills & Workflows | `apps/api/src/features/skills/`, `apps/api/src/features/ai-swarm/skills/`, `apps/api/src/features/automation-studio/` | ◌ Parcial — API CRUD existe, no hay editor visual | API 5 + 5, WEB 6          | API 0, Swarm 56 | `AI_SWARM`   |
| CAP-STUD-04: Model Routing             | `packages/ai/`                                                                                                        | ✅ Aplicado (SDD: `x3-provider-architecture`)     | —                         | —               | —            |
| CAP-STUD-05: Policy Studio             | `apps/api/src/features/ai-swarm/control-plane/`, `apps/web/src/features/`                                             | ◌ Runtime gate existe, no hay studio visual       | API varios, WEB artifacts | —               | —            |
| CAP-STUD-06: Drenyra Studio Admin      | `apps/api/src/features/agents/`, `apps/web/src/features/`                                                             | ◌ Fragmentos — API 6, WEB 22                      | API 6 + WEB 22            | 1 + 2           | `MULTI_RUC`  |

### Detalle por área

#### AI Swarm (`apps/api/src/features/ai-swarm/`) — 144 archivos, 56 tests

El runtime principal de agentes. Creció ad-hoc como feature vertical dentro de la API. Contiene:

- **Agents**: `ocr.agent.ts`, `pcge.agent.ts`, `sunat.agent.ts`, `reconciliation.agent.ts`, `evidence.agent.ts`
- **Orchestrator**: `orchestrator.service.ts` — coordina multi-agente, workflows, consensus
- **Control Plane**: `context-control-plane/` — registro de superficies, evaluación, políticas, auditoría
- **API Routes**: `api/routes.ts`, `api/agent-stream.route.ts`, `api/cognitive-stream-endpoint.route.ts`, `api/sire-audit.route.ts`, `api/budget.route.ts`, `api/sire.route.ts`
- **Workers**: `workers/` — ejecución background de accounting jobs
- **Observability**: `observability/` — métricas, eventos, sesiones
- **Skills Runtime**: `skills/` — skill registry con 3 skills SUNAT (sire-readiness, adversarial-audit, knowledge-retrieval)
- **Governance**: `governance/autonomy-policy.service.ts` — kill switch y políticas de autonomía

**Problemas detectados**:

- Sin documentación arquitectónica de alto nivel
- Límites difusos entre ai-swarm y drenyra-orchestrator (`packages/drenyra-orchestrator/`)
- Sin contratos formales entre módulos (agents ↔ orchestrator, control-plane ↔ workers)
- Sin auditabilidad granular en decisiones de agentes (solo logging reactivo)
- Feature flag `AI_SWARM` existe pero no hay granularidad por tenant/superficie

#### Automation Studio (`apps/api/src/features/automation-studio/`) — API 5 archivos, 1 test

CRUD de workflows y steps existe. Schema en `packages/persistence/src/schema/automation-studio.schema.ts` con tablas: `automation_studio_workflows`, `automation_studio_steps`, `automation_studio_executions`, `automation_studio_logs`.

**Problemas detectados**:

- Sin builder visual — el contador no puede crear workflows sin tocar API
- Sin separación de roles — misma superficie para contador y admin
- Sin integración con skill registry del ai-swarm
- El SDD `drenyra-skills-automations` (propuesta existente) propone la UI pero no el studio completo

#### Skills (`apps/api/src/features/skills/`) — API 5 archivos, 0 tests

Catálogo de skills con install/uninstall/config por company. API REST completa (list, detail, install, uninstall, config).

**Problemas detectados**:

- Sin editor visual de skills — crear un skill requiere código
- Sin conexión entre el catálogo (`features/skills/`) y el runtime (`features/ai-swarm/skills/`)
- 0 tests en la API de skills
- Sin versionado de skills

#### Policy (`apps/api/src/features/ai-swarm/control-plane/` + web artifacts)

Runtime gate de políticas existe en el control-plane: `context-policy.service.ts`, endpoint `/policy/preview`. Web tiene artefactos en `features/security/route-protection/`.

**Problemas detectados**:

- Sin studio visual para configurar políticas
- Políticas están en código, no en base de datos configurable
- Sin diferenciación por rol (contador vs admin)

#### Agents (`apps/api/src/features/agents/`) — API 6 archivos, 1 test; WEB 22 archivos, 2 tests

Gestión de agentes con API routes y superficie web.

**Problemas detectados**:

- WEB pesado (22 archivos) pero solo 2 tests
- Sin panel de administración unificado
- Sin analytics de uso de agentes por tenant

#### CLI (`apps/cli/`) — Go CLI archivado

✅ Completado. El Gentleman Fiscal Terminal funciona. No está en scope de este SDD.

---

## Scope

### Phase 1: Agent Runtime Formalization

**Objetivo**: Documentar, establecer contratos y refactorizar el ai-swarm antes de construir superficies que dependan de él.

**Entregables**:

1. **Architecture Document** — Documento de arquitectura del ai-swarm: módulos, boundaries, flujo de datos, decisiones de diseño. Formato ADR + diagramas.
2. **Module Contracts** — Contratos formales (TypeScript interfaces + Zod schemas) entre:
   - Agent runtime ↔ Orchestrator (`packages/drenyra-orchestrator/`)
   - Control plane ↔ Workers
   - Skill registry ↔ Agent executor
   - Governance ↔ API routes
3. **Orchestrator Boundary Audit** — Separación clara entre `ai-swarm` (runtime de agentes fiscal) y `drenyra-orchestrator` (orquestación SDD general). Definir qué pertenece a cada uno.
4. **Agent Decision Audit Trail** — Trazabilidad granular de decisiones de agentes: qué agente decidió qué, con qué evidencia, bajo qué política.
5. **Refactors** — Correcciones puntuales donde los límites estén cruzados:
   - Mover lógica de orquestación SDD fuera del ai-swarm (si aplica)
   - Centralizar tipos compartidos en `packages/domain/` o `packages/shared/`
   - Eliminar acoplamientos directos ai-swarm → features fiscales específicas

**No incluye**: Cambios de comportamiento en agentes. Solo estructura, contratos y trazabilidad.

### Phase 2: Automation Studio Builder

**Objetivo**: Builder visual de workflows para contadores + panel de control para administradores.

**Entregables**:

1. **Visual Workflow Builder** — UI drag & drop para crear/editar workflows de automatización:
   - Componente `<WorkflowCanvas>` con nodos (triggers, skills, condiciones, acciones)
   - Biblioteca de steps predefinidos (SUNAT check, bank reconciliation, invoice processing, etc.)
   - Vista previa de ejecución (simulación sin ejecutar)
2. **Contador Surface** — Vista simplificada:
   - Templates de automatizaciones predefinidas
   - Activación/desactivación con un click
   - Cola de revisión (resultados pendientes de aprobación)
3. **Admin Panel** — Vista avanzada:
   - Editor de workflows completo (raw JSON/YAML + visual)
   - API access para integraciones externas
   - Configuración de políticas por workflow
4. **Integración con ai-swarm** — Conectar el builder con el runtime formalizado en Phase 1

**Reusa**: API CRUD de `automation-studio` existente. Esquemas de `automation-studio.schema.ts`.

### Phase 3: Skills Editor + Policy Studio

**Objetivo**: Superficies visuales para crear skills personalizadas y configurar políticas.

**Entregables**:

1. **Skills Editor** — UI para crear/editar skills sin código:
   - Definición de capabilities, inputs/outputs, herramientas requeridas
   - Configuración de parámetros por tenant
   - Versionado y publicación de skills
   - Conexión con el skill registry runtime del ai-swarm
2. **Policy Studio** — Configuración visual de políticas:
   - Editor de reglas (condición → acción) con builder visual
   - Plantillas de políticas predefinidas (autonomía, aprobación, auditoría)
   - Preview de impacto (qué workflows/agentes serían afectados)
3. **Role-Based Surfaces**:
   - Contador: habilidades predefinidas, políticas simplificadas (activar/desactivar)
   - Admin: editor completo de skills, políticas avanzadas, reglas custom

### Phase 4: Studio Admin Panel

**Objetivo**: Panel de administración completo para gestión de tenants y analytics.

**Entregables**:

1. **Tenant Configuration** — Configuración por tenant: features habilitados, skills instalados, políticas activas
2. **Usage Analytics** — Dashboards de uso: agent runs, workflow executions, skill invocations, costos por tenant
3. **Audit Logs** — Logs centralizados de todas las operaciones del studio (quién hizo qué, cuándo, con qué resultado)
4. **User Management** — Gestión de usuarios y roles (contador, admin, supervisor) por tenant
5. **Feature Flag Management** — UI para gestionar feature flags existentes (`AI_SWARM`, `MULTI_RUC`, etc.)

---

## Non-Goals

- **API Developer Platform** (CAP-STUD-02): Es un SDD separado (`drenyra-api-platform`). Este SDD consume la API, no la crea.
- **Model Routing** (CAP-STUD-04): Ya tiene SDD aplicado (`x3-provider-architecture`). No se modifica.
- **CLI** (CAP-STUD-01): Archivado. El CLI sigue funcionando como está. No se integra con el Studio en este SDD.
- **Marketplace público de skills**: Solo skills internos de ARKELYTHEX. No third-party skills.
- **Cambios en el comportamiento de agentes fiscal**: Los agentes (SUNAT, SIRE, OCR, etc.) mantienen su lógica actual. Solo se formaliza su estructura.
- **Sistema de scheduling/queues**: Se reutiliza el engine existente de `automation-studio`. No se construye uno nuevo.
- **Multi-country**: Solo Perú en este SDD. La arquitectura debe permitir extensión futura.

---

## Architecture Impact

### Áreas afectadas

| Área                                       | Tipo de cambio                                                                  | Fase          |
| ------------------------------------------ | ------------------------------------------------------------------------------- | ------------- |
| `apps/api/src/features/ai-swarm/`          | Documentación + contratos + refactors                                           | Phase 1       |
| `packages/drenyra-orchestrator/`           | Boundary audit + posibles refactors                                             | Phase 1       |
| `apps/api/src/features/automation-studio/` | Nueva UI web consume API existente                                              | Phase 2       |
| `apps/api/src/features/skills/`            | Nueva UI + integración con runtime                                              | Phase 3       |
| `apps/api/src/features/agents/`            | Panel admin unificado                                                           | Phase 4       |
| `apps/web/src/features/`                   | Nuevas superficies: workflow builder, skills editor, policy studio, admin panel | Phase 2-4     |
| `packages/domain/`                         | Posibles nuevas entidades: SkillDefinition, Policy, AuditEvent                  | Phase 1, 3    |
| `packages/persistence/`                    | Schemas para policies, audit trail, feature flags                               | Phase 1, 3, 4 |
| `packages/shared/`                         | Tipos compartidos para contracts                                                | Phase 1       |

### Principios arquitectónicos

1. **Vertical slices**: Cada feature del studio (workflows, skills, policies, admin) es un slice independiente en `apps/web/src/features/`.
2. **Clean architecture**: UI → Application (use cases) → Domain (entities) → Infrastructure (adapters). El ai-swarm es infrastructure desde la perspectiva del studio.
3. **Role-based surfaces**: Misma API, diferentes vistas según rol (contador vs admin). No duplicar lógica.
4. **Tenant isolation**: Toda configuración (skills, políticas, workflows) está scoped por tenant/RUC.
5. **Feature flags**: Usar el sistema existente en `packages/shared/src/feature-flags.ts` para rollout gradual.

---

## Dependencies

### Dependencias internas

| Dependencia                                  | Estado    | Relación                                                                                                                    |
| -------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| `drenyra-skills-automations` (SDD existente) | Propuesta | Se absorbe en este SDD. Su propuesta de UI para Skills + Automations se convierte en Phase 2-3.                             |
| `drenyra-s1-ai-consolidation`                | Propuesta | Alineación necesaria. S1 propone consolidar el ecosistema AI. Phase 1 de este SDD formaliza el ai-swarm. Deben coordinarse. |
| `x3-provider-architecture` (CAP-STUD-04)     | Aplicado  | Sin cambios. El model routing existente se consume tal cual.                                                                |
| `drenyra-api-platform` (CAP-STUD-02)         | Borrador  | SDD separado. Este SDD asume que la API existe.                                                                             |

### Dependencias técnicas

- **React 19 + TanStack Router + Tailwind 4**: Stack frontend existente. El workflow builder usará `@xyflow/react` (reactflow) para el canvas drag & drop.
- **ElysiaJS + Zod 4**: API backend existente. Las nuevas rutas siguen el patrón vertical slice.
- **Drizzle ORM**: Schemas existentes en `automation-studio.schema.ts`. Se extienden para policies y audit trail.
- **Better Auth**: Roles y permisos existentes. Se extienden para admin vs contador.
- **Glass & Steel**: Design system existente. Todos los componentes nuevos usan tokens del design system.

---

## Delivery

### Estrategia

**auto-chain** — 4 PRs, uno por fase. Cada PR es un milestone independiente y testeable.

| PR  | Fase                                   | Scope                                         | Archivos est. | Líneas est. |
| --- | -------------------------------------- | --------------------------------------------- | ------------- | ----------- |
| PR1 | Phase 1: Agent Runtime Formalization   | Docs + contratos + refactors                  | 15-20         | ~500        |
| PR2 | Phase 2: Automation Studio Builder     | Workflow canvas + contador view + admin panel | 25-30         | ~800        |
| PR3 | Phase 3: Skills Editor + Policy Studio | Skills editor + policy studio + role surfaces | 20-25         | ~700        |
| PR4 | Phase 4: Studio Admin Panel            | Analytics + audit + users + feature flags     | 15-20         | ~500        |

**Total estimado**: 75-95 archivos, ~2500 líneas.

### Chained PR Strategy

**stacked-to-main**: Cada PR mergea a main en orden. PR1 → PR2 → PR3 → PR4. Permite iteración rápida y fixes sobre la marcha.

### Review Budget Risk

- PR1: Bajo (docs + contratos, sin cambios de comportamiento)
- PR2: Medio (nueva UI, integración con API existente)
- PR3: Medio (nueva UI + integración con runtime)
- PR4: Bajo (UI sobre datos existentes)
- **Total**: 2500 líneas → requiere auto-chain (excede 400 líneas). PR1 es habilitante, debe completarse primero.

---

## Risks

| Riesgo                                                       | Impacto                                                        | Mitigación                                                                                                 |
| ------------------------------------------------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **ai-swarm boundary audit descubre acoplamientos profundos** | Alto — podría requerir refactors grandes en Phase 1            | Scope de Phase 1 limitado a documentar + contratos. Refactors solo donde el boundary crossing sea crítico. |
| **Workflow canvas complejidad UX**                           | Medio — drag & drop para contadores no técnicos es ambicioso   | Templates predefinidos cubren 80% de casos. El canvas avanzado es para admin.                              |
| **Skill registry dual (catálogo vs runtime)**                | Medio — dos sistemas de skills que deben unificarse            | Phase 3 unifica el catálogo (`features/skills/`) con el runtime (`ai-swarm/skills/`).                      |
| **Coordinación con drenyra-s1-ai-consolidation**             | Bajo — S1 está en proposal, puede alinearse                    | Phase 1 produce contratos que S1 debe respetar. Coordinar antes de implementar.                            |
| **0 tests en skills API**                                    | Medio — sin cobertura, los cambios pueden romper integraciones | Phase 3 incluye tests para skills API antes de construir el editor.                                        |
| **Feature flag granularity**                                 | Bajo — el sistema actual es binario por tier                   | Phase 4 extiende feature flags para granularidad por tenant/superficie.                                    |

---

## Success Criteria

### Phase 1

- [ ] Documento de arquitectura ai-swarm revisado y aprobado
- [ ] Contratos de módulos definidos como tipos TypeScript exportables
- [ ] Boundary audit completo: cada archivo en ai-swarm tiene un "owner module" documentado
- [ ] Agent decision audit trail: toda decisión de agente tiene trace ID, policy reference, y evidence hash
- [ ] Refactors completados sin cambios de comportamiento (tests existentes siguen pasando)

### Phase 2

- [ ] Contador puede crear un workflow simple (3-5 steps) en < 5 minutos sin tocar código
- [ ] Admin puede editar workflows en modo avanzado (raw JSON + visual)
- [ ] Workflows creados en el builder se ejecutan correctamente en el runtime ai-swarm
- [ ] Cola de revisión muestra resultados pendientes con acciones (aprobar, rechazar, re-ejecutar)

### Phase 3

- [ ] Admin puede crear un skill nuevo desde la UI (sin código) y aparece en el runtime
- [ ] Contador puede activar/desactivar skills predefinidos desde su vista
- [ ] Policy studio permite crear reglas visualmente y se reflejan en el runtime gate
- [ ] Skills API tiene ≥ 80% test coverage

### Phase 4

- [ ] Admin dashboard muestra analytics de uso por tenant (agente runs, costos, errores)
- [ ] Audit logs capturan toda operación del studio con trazabilidad completa
- [ ] User management permite crear/editar/desactivar usuarios con roles
- [ ] Feature flags son gestionables desde UI

---

## Relationship to Existing SDDs

| SDD                                     | Acción                                                                                              |
| --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `drenyra-skills-automations`            | **Absorbido**. Su scope (Skills Library UI + Automations UI) se convierte en Phase 2-3 de este SDD. |
| `drenyra-s1-ai-consolidation`           | **Coordinado**. Phase 1 de este SDD define los contratos que S1 debe consolidar.                    |
| `drenyra-api-platform`                  | **Independiente**. CAP-STUD-02 es un SDD separado. Este SDD no lo modifica.                         |
| `x3-provider-architecture`              | **Consumido**. CAP-STUD-04 ya está aplicado. Este SDD lo usa sin cambios.                           |
| `drenyra-frontend-command-center-reset` | **Coordinado**. Las nuevas superficies del studio deben seguir el layout del command center.        |

---

## Open Questions (para resolver en spec/design)

1. ¿El workflow canvas usa `@xyflow/react` o una librería más ligera tipo `react-flow-builder`?
2. ¿Las políticas se almacenan en DB (Drizzle) o en archivos de configuración versionables?
3. ¿El audit trail de agentes usa el sistema de evidencia fiscal existente o es un subsistema separado?
4. ¿Los roles (contador, admin, supervisor) son roles de Better Auth o un sistema de roles interno del studio?
5. ¿El versionado de skills sigue semver? ¿Cómo se maneja la compatibilidad hacia atrás?
6. ¿El feature flag management de Phase 4 requiere migrar el sistema actual de `feature-flags.ts` a DB?
