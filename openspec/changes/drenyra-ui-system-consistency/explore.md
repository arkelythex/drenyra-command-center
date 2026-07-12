# Explore: UI System Consistency

**Change**: `drenyra-ui-system-consistency`
**Date**: 2026-07-12
**Scope**: apps/web (entire frontend shell + pages)

## Executive Summary

El web app de Drenyra tiene una base sólida — el shell (FiscalEditorialShell), el sidebar, el composer inferior y las páginas operativas comparten un sistema visual reconocible con tokens CSS, paleta warm-neutral, y layout de tres paneles. Sin embargo, la consistencia entre pantallas es deficiente: cada vista fue diseñada con criterios distintos, aunque todas heredan el mismo shell. Esto produce una app visualmente unificada pero cognitivamente fragmentada.

## Estructura actual

### Shell global (src/components/layout/MainLayout/)

- **FiscalEditorialShell**: wrapper base con modos `operational` (h-[100dvh]) y `command-center` (h-full)
- **MainLayout.tsx**: router que decide entre `MainLayoutShell` (operativo) y `MainLayoutSettingsView` (configuración)
- **MainLayoutShell**: sidebar (left) + MainLayoutContent (center + right inspector) + NotificationSidebar
- **MainLayoutContent**: main content + ArtifactRegistry (420px right panel) + FiscalInspector (unified right panel)

### Sidebar (src/components/layout/Sidebar/)

- Sidebar.tsx: contenedor con toggle, search, cases list, nav items, footer
- SidebarNavItems: renderiza SIDEBAR_NAV_ITEMS desde Sidebar.data.ts (5 items: Herramientas, Automatizaciones, Skills, Observabilidad, Control Tower)
- SidebarCaseList: lista de casos fiscales agrupados (Hoy / Esta semana / Este mes) con status colors
- SidebarFooter: empresa + período + ajustes + perfil

### Page wrapper (src/components/ui/PageShell.tsx)

- Variants: `default` (max-w-7xl), `narrow` (max-w-3xl), `board` (w-full), `fullHeight`
- Paddings: none/sm/md/lg
- No hay un mecanismo central que asegure que todas las páginas usen el variant correcto

### Composer (src/components/agentic/Composer.tsx)

- Componente complejo con: textarea, ComposerControls (mode selector + skill chips), Manual/Auto toggle, send button, suggested actions, slash command menu, inline autocomplete
- **Siempre visible**: en el shell operativo, el composer es parte del layout. Las páginas que no son agentic (ej. facturas, dashboard) igual heredan el composer.
- ComposerControls muestra: modes "Consultar"/"Periodo" + chips "Fiscal", "PCGE", "Datos" — persistente en todas las pantallas

### Pantallas analizadas

#### Inbox Inteligente (features/inbox/InboxPage.tsx)

- Estado vacío: dropzone enorme (min-h-[180px] real, 2xl border-dashed, p-12 en la page version, p-10 en upload zone), botón "Seleccionar archivos" con borde duro
- Estado processing: agent progress cards con simulated mock
- Estado results: grid 3-column results + suggested action buttons
- Layout: max-w[800px] centrado
- **Problema**: demasiado espacio vacío en estado empty, "Sin archivos cargados" texto, botón con alto contraste

#### Control Tower (features/control-tower/ControlTowerPage.tsx)

- Header con título "Control Tower" + icono
- AgentSessionsSection (puede estar vacía)
- Buzón SOL card con warning técnico (data.buzonSol.message — expone `SIRE_SUBMISSION_MODE is not api` o similar)
- Grid de company cards con health score, pending docs, riesgo
- Layout: max-w[1400px]
- **Problemas**: naming exagerado (no es Control Tower real), warning técnico visible, grid de 1 card cuando hay pocas empresas, AgentSessionsSection vacía

#### Dashboard principal (src/routes/dashboard.tsx)

- **Problemas**: simetría de tarjeta excesiva, estado del cierre demasiado alto, panel derecho desconectado

#### Facturas (features/invoices/components/InvoicesSummaryBoard.tsx)

- **Problemas**: bordes duros, tipografía pesada, métricas grandes, botón Nueva factura enorme — estética distinta al resto del sistema

#### Expedientes Fiscales (features/expedientes/)

- **Problemas**: contenedor izquierdo con error, panel derecho vacío, "Nuevo" ambiguo

### Sistema de diseño

- Tokens DTCG en `src/lib/design-tokens/`
- PageShell con 4 variants pero sin enforcement
- No hay sistema de radios declarado (cada view usa sus propios valores)
- Border colors definidos como CSS variables pero con valores inconsistentes entre vistas

## Problemas clave identificados

1. **Composer no-contextual**: siempre visible con el mismo modo/chips en todas las pantallas
2. **Sidebar denso**: casos, nav items, footer compiten; collapse no resuelve la jerarquía
3. **3 layouts no oficiales**: cada página usa su propio max-width (760px, 800px, 1400px, full)
4. **Radios/bordes sin sistema**: radius-sm/md/lg/xl no existen como tokens aplicados
5. **Estados vacíos sin continuidad**: inbox no tiene actividad reciente, control tower no muestra nada útil en empty
6. **Facturas rompe el sistema visual**: bordes negros, uppercase, métricas grandes
7. **Control Tower naming > capability**: promete multi-empresa/risk/priorización pero apenas carga una card
8. **Variables técnicas expuestas**: SIRE_SUBMISSION_MODE visible al usuario

## Archivos clave tocados

| Archivo                                                           | Rol                   |
| ----------------------------------------------------------------- | --------------------- |
| src/components/layout/MainLayout/MainLayout.tsx                   | Shell decision        |
| src/components/layout/MainLayout/components/MainLayoutShell.tsx   | Shell layout completo |
| src/components/layout/MainLayout/components/MainLayoutContent.tsx | Content + right panel |
| src/components/layout/FiscalEditorialShell.tsx                    | Base wrapper          |
| src/components/layout/Sidebar/Sidebar.tsx                         | Sidebar container     |
| src/components/layout/Sidebar/Sidebar.data.ts                     | Nav items config      |
| src/components/layout/Sidebar/components/SidebarNavItems.tsx      | Nav items render      |
| src/components/layout/Sidebar/components/SidebarCaseList.tsx      | Casos list            |
| src/components/layout/Sidebar/components/SidebarFooter.tsx        | User footer           |
| src/components/ui/PageShell.tsx                                   | Page wrapper          |
| src/components/agentic/Composer.tsx                               | Bottom composer       |
| src/components/agentic/ComposerControls.tsx                       | Mode + chips          |
| src/features/inbox/InboxPage.tsx                                  | Inbox page            |
| src/features/inbox/components/InboxUploadZone.tsx                 | Upload zone component |
| src/features/control-tower/ControlTowerPage.tsx                   | Control Tower         |
| src/features/invoices/components/InvoicesSummaryBoard.tsx         | Invoices board        |
| src/lib/design-tokens/                                            | Design token system   |
