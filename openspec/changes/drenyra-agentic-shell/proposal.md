# SDD Proposal: Drenyra Agentic Shell — Navegación Agentic-First

**Última actualización:** 2026-07-02
**Estado:** Propuesta
**Plan SDD:** 1 de 6

---

## Executive Summary

Transformar la shell completa de Drenyra de una navegación tipo SaaS tradicional (Dashboard, Invoices, Banking, Reports) a una experiencia **agentic-first** inspirada en Codex App y Cursor 3. La sidebar, el layout principal, la paleta de comandos, y la estructura de rutas se rediseñan para que el usuario **supervise trabajos delegados** en vez de navegar módulos.

**UX target:** "Drenyra debe sentirse como Codex para contadores, no como QuickBooks bonito."

---

## Problem

La navegación actual es vertical por módulo funcional:

```
Dashboard | Invoices | Banking | Reports | Compliance | Settings
```

Esto es **ERP clásico**. El usuario piensa "a qué módulo voy", no "qué trabajo tengo pendiente". Para una app agentic-first, la navegación debe reflejar el **modelo mental del contador supervisando agentes**:

```
New Thread | Review Queue | Agents | Automations | Skills | Evidence Vault
```

---

## Solution

### Nueva jerarquía de navegación

La sidebar se reorganiza en 3 zonas:

```
─── WORKSPACE ───
  ◆ New Thread           ← Entry point principal. Crea un thread contable.
  ◆ Review Queue         ← Cola de aprobación. Lo más importante.
  ◆ Agents               ← Agents Window (Plan 3)

─── PLATFORM ───
  ◆ Automations          ← Rutinas automáticas (Plan 5)
  ◆ Skills               ← Librería de skills contables (Plan 5)
  ◆ Evidence Vault       ← Vault de evidencia (Plan 6)

─── ORGANIZATION ───
  ◆ Clientes             ← Gestión de firmas/clientes (ex Control Tower)
  ◆ Settings             ← Configuración general
```

### Cambios concretos

| Actual                                    | Nueva                                                        |
| ----------------------------------------- | ------------------------------------------------------------ |
| Sidebar con 15+ items de módulos          | Sidebar minimalista con 8 items agrupados                    |
| Dashboard como landing                    | New Thread / command bar como landing                        |
| Navegación por función (Invoice, Banking) | Navegación por intención (Thread, Review, Agents)            |
| Sin comando global                        | Command Palette (⌘K) + Command Bar siempre visible           |
| Layout fijo                               | Layout dinámico: sidebar minimal + content + right inspector |
| Tema claro/oscuro estándar                | Tema premium: cocoa/graphite con acentos copper/sage/amber   |

### Componentes nuevos a crear

1. **AgenticSidebar** — Reemplaza Sidebar actual. Items: New Thread, Review Queue, Agents, Automations, Skills, Evidence Vault, Clientes, Settings. Badges de notificaciones en Review Queue y Agents.

2. **AgenticCommandBar** — Barra inferior tipo Codex: "Ask Drenyra anything, @facturas @banco /sire /close /audit". Siempre visible en la base de la pantalla.

3. **CommandPaletteV2** — ⌘K mejorado. No solo busca rutas, también ejecuta comandos: "Crear thread para Andrés SAC", "Revisar cola de aprobación", "Agente SIRE para Jun 2026".

4. **WorkspaceSelector** — Selector de cliente/empresa en el header. Muestra RUC, periodo activo, estado.

5. **AgenticTopBar** — TopBar simplificada: selector de workspace + periodo + botones de acción rápida.

6. **RightInspector** — Panel derecho contextual. Cuando hay un thread/agente/diff activo, muestra evidencia, riesgo, explicación, logs, acciones de aprobación.

7. **AgenticLayout** — Nuevo layout principal que reemplaza MainLayout. 3 columnas: sidebar minimal | content | right inspector (opcional).

### Rutas a modificar

- `/` → redirige a `/threads/new` (no a `/dashboard`)
- `/dashboard` → existe pero no es landing; accesible desde command palette
- `/review-queue` → nueva ruta principal
- `/agents` → nueva ruta (Agents Window)
- `/automations` → nueva ruta
- `/skills` → nueva ruta
- `/threads/` → namespace para threads
- `/evidence` → refinamiento de ruta existente

### Migración

Se elimina la sidebar tradicional. Los módulos antiguos (Invoices, Banking, Reports, etc.) siguen existiendo como rutas pero NO aparecen en la navegación principal. Se acceden via command palette, enlaces contextuales dentro de threads, o desde `/tools` (ruta oculta de compatibilidad).

---

## Architecture

```tsx
// Estructura del nuevo layout
<AgenticLayout>
  <AgenticSidebar /> // Minimal, 8 items
  <main>
    <Outlet /> // Router content
  </main>
  <RightInspector /> // Opcional, contextual
  <AgenticCommandBar /> // Siemvisible al fondo
</AgenticLayout>
```

```tsx
// Routing tree esperado
__root.tsx → AgenticLayout
  index.tsx → redirect /threads/new
  /threads/ → ThreadLayout
    /new → NewThreadPage (Plan 2)
    /:id → ThreadDetailPage
  /review → ReviewQueuePage (Plan 4)
  /agents → AgentsWindowPage (Plan 3)
  /automations → AutomationsPage
  /skills → SkillsLibraryPage
  /evidence → EvidenceVaultPage
  /clients → ClientListPage
  /settings → SettingsPage
  // Rutas legacy (solo command palette)
  /invoices
  /banking
  /reports
  /compliance
```

---

## Dependencies

| Plan                          | Dependencia                                    |
| ----------------------------- | ---------------------------------------------- |
| Plan 2 (Thread System)        | **Bloqueado por**: Shell + CommandBar + layout |
| Plan 3 (Agents Window)        | **Bloqueado por**: Shell + layout + inspector  |
| Plan 4 (Accounting Diff)      | **Bloqueado por**: Shell + inspector + palette |
| Plan 5 (Skills + Automations) | Independiente (solo necesita sidebar)          |
| Plan 6 (Evidence Vault 2)     | Independiente (solo necesita sidebar)          |

---

## Delivery

**Estrategia:** auto-chain — 3 PRs encadenados

| PR  | Scope                                                   | Archivos estimados | Líneas |
| --- | ------------------------------------------------------- | ------------------ | ------ |
| PR1 | AgenticLayout + AgenticSidebar + routing tree           | 8-12               | ~350   |
| PR2 | AgenticCommandBar + CommandPaletteV2 + RightInspector   | 10-15              | ~400   |
| PR3 | Token passes + tema premium + migración de rutas legacy | 6-8                | ~200   |

**Riesgos:**

- Sidebar actual tiene muchas referencias. Migrar sin romper requiere coverage de tests.
- El right inspector reemplaza al FiscalInspector actual — verificar compatibilidad.
- Temas premium pueden chocar con design tokens existentes.

---

## Non-goals

- No se implementa la funcionalidad de threads (Plan 2)
- No se implementa Agents Window (Plan 3)
- No se toca la lógica de negocios
- No se migran los módulos legacy funcionalmente, solo su visibilidad en navegación
