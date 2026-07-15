# Design: UI System Consistency

**Change**: `drenyra-ui-system-consistency`
**Date**: 2026-07-12
**Based on**: spec.md

## Architecture decisions

### AD1: Composer mode resuelto por TanStack Router beforeLoad

**Context**: El composer necesita saber en qué tipo de vista está para elegir expandido/compacto/oculto.

**Decision**: Agregar un campo `composerMode: ComposerMode` al `Route.meta` o al loader context de TanStack Router. Cada ruta declara su modo.

```typescript
// En cada ruta:
export const Route = createFileRoute('/inbox')({
  component: InboxPage,
  // @ts-expect-error - custom meta
  meta: { composerMode: 'expanded' as const },
})

// En MainLayoutShell, leer router state:
function useComposerMode(): ComposerMode {
  const matches = useRouterState({ select: (s) => s.matches })
  const deepest = matches[matches.length - 1]
  return (deepest?.route.meta as any)?.composerMode ?? 'compact'
}
```

**Tradeoff**: No hay tipo estricto en meta de TanStack Router v1. Usar `as const` y un type guard.

### AD2: Sidebar sections como data-driven config

**Context**: Las secciones del sidebar cambian su colapsabilidad y contenido.

**Decision**: Refactorizar `SIDEBAR_NAV_ITEMS` a `SIDEBAR_SECTIONS`:

```typescript
const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    id: 'tools',
    label: 'TRABAJO',
    collapsible: false,
    items: [
      { to: '/inbox', icon: Inbox, label: 'Bandeja' },
      { to: '/review-queue', icon: Search, label: 'Revisiones' },
      { to: '/approvals', icon: CheckCircle, label: 'Aprobaciones' },
      { to: '/evidence', icon: FileText, label: 'Evidencia' },
    ],
  },
  // ...
]
```

### AD3: Design tokens extendidos con radius

**Context**: No hay sistema de radios declarado.

**Decision**: Agregar radius tokens al sistema DTCG existente (src/lib/design-tokens/). No crear un nuevo sistema — extender el actual.

```json
{
  "radius": {
    "sm": { "value": "8px" },
    "md": { "value": "10px" },
    "lg": { "value": "12px" },
    "xl": { "value": "16px" },
    "2xl": { "value": "20px" }
  }
}
```

### AD4: PageShell reemplaza variants antiguas

**Context**: Actualmente PageShell tiene 4 variants (default, narrow, board, fullHeight) y cada página elige la suya.

**Decision**: Reemplazar con 3 variants exactas:

```typescript
type PageShellVariant = 'focal' | 'operativo' | 'data-heavy'
```

Mapeo:

- `default` → `data-heavy` (el más usado)
- `narrow` → `focal`
- `board` → `data-heavy` (mismo comportamiento)
- `fullHeight` → `operativo` (el más cercano)

## Component tree

### Modified

```
src/components/layout/MainLayout/MainLayout.tsx
  → lee composerMode de la ruta activa

src/components/layout/MainLayout/components/MainLayoutShell.tsx
  → pasa composerMode al Composer
  → sidebar usa SIDEBAR_SECTIONS (data-driven)

src/components/layout/Sidebar/Sidebar.tsx
  → refactor a secciones colapsables

src/components/layout/Sidebar/Sidebar.data.ts
  → SIDEBAR_NAV_ITEMS → SIDEBAR_SECTIONS

src/components/layout/Sidebar/components/SidebarFooter.tsx
  → versión compacta con agentes

src/components/ui/PageShell.tsx
  → 3 variants: focal / operativo / data-heavy

src/components/agentic/Composer.tsx
  → accept composerMode prop, render contextual

src/components/agentic/ComposerControls.tsx
  → solo render en mode="expanded"

src/lib/design-tokens/tokens.dtcg.json
  → agregar radius tokens

src/features/inbox/InboxPage.tsx
  → dropzone reducido, actividad reciente

src/features/control-tower/ControlTowerPage.tsx
  → rename, buzón SOL, grid

src/features/invoices/components/InvoicesSummaryBoard.tsx
  → border, typography, metrics reduction
```

### New files

```
src/components/layout/Sidebar/components/SidebarSection.tsx
  → componente de sección colapsable con disclosure
```

### Deleted files

```
src/components/layout/Sidebar/components/SidebarNavItems.tsx
  → reemplazado por SidebarSection
```

## Data flow

### Composer mode

```
Route definition
    ↓ (meta.composerMode)
TanStack Router state
    ↓ (useRouterState)
MainLayoutShell
    ↓ (prop)
Composer
    ↓
textarea visible / compact / hidden
```

### Sidebar sections

```
SIDEBAR_SECTIONS (data.ts)
    ↓ (import)
Sidebar.tsx
    ↓ (map)
SidebarSection[]
    ↓
Section colapsable / fixed
```

## Fiscal compliance

Este cambio no toca lógica fiscal. Solo presentación. Sin embargo:

- No modificar archivos en `packages/fiscal/`, `packages/domain/` o `apps/api/`
- No cambiar schemas de datos existentes
- No afectar queries de TanStack Query o mutaciones

## Migration path

1. PR1: Design tokens + PageShell → base del sistema
2. PR2: Sidebar refactor + composer contextual
3. PR3: Inbox (dropzone, actividad reciente)
4. PR4: Control Tower + Facturas
5. PR5: Pipeline compacto + naming + ajustes finos

Cada PR es independientemente desplegable. No hay breaking changes entre PRs.
