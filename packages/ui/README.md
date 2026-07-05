---
last-verified: 2026-06-20
source-of-truth: packages/ui/package.json
auto-generated: false
---

# @drenyra/ui — Drenyra Design System

**Última actualización**: 2026-06-20 · [Filosofía Gentleman](../../docs/meta/gentleman-philosophy.md)

**Shared UI component library** para el monorepo ARKELYTHEX. Proporciona componentes consistentes, accesibles y temáticos con la identidad de marca.

> **Relacionado:** [Sistema de Color 2026](../docs/design/color-system-2026.md) | [Identidad Visual](../docs/design/visual-identity-2026.md) | [Reglas ESLint](../docs/05-development/linting-configuration.md)

---

## De un vistazo

Centralizamos los componentes UI reutilizables para evitar duplicación entre `apps/web`, `apps/landing` y futuras aplicaciones. Todos los componentes usan **CSS custom properties** (`var(--color-primary)`) en lugar de colores hardcodeados — un cambio global de marca se hace desde un solo archivo.

| Si necesitás... | Usá... |
|----------------|--------|
| Un botón con variantes | `<Button variant="primary">` |
| Una tarjeta de contenido | `<Card><CardHeader>...` |
| Una etiqueta de estado | `<Badge variant="success">` |
| Un tooltip contextual | `<Tooltip content="...">` |
| Mergear clases Tailwind | `cn("px-4", isActive && "bg-[...]")` |

---

## Stack

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| React | 19.x | Componentes funcionales |
| TypeScript | 5.7 | Tipado estricto |
| Tailwind CSS | 4.x | Utility classes |
| Radix UI | ^1.1 | Primitivas accesibles (Tooltip) |
| clsx + tailwind-merge | latest | `cn()` utility |

---

## Instalación

```bash
# Desde otro paquete del monorepo
import { Button, Card, Badge, cn } from "@drenyra/ui";
```

**Peer dependencies** requeridas:
- `react ^19.0.0`
- `react-dom ^19.0.0`
- `tailwindcss ^4.0.0`

---

## Tokens CSS

Importá los tokens en tu aplicación:

```tsx
// En tu entry point (ej: apps/web/src/main.tsx)
import "@drenyra/ui/styles";
```

### Paleta de Marca

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-primary` | `#B97A45` | Copper — CTAs, acciones principales |
| `--color-accent` | `#E7C97A` | Lúcuma/amber — highlights, estados activos |
| `--color-accent-secondary` | `#EFE4D7` | Warm sand — fondos suaves |

### Superficies (Dark Theme)

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-surface-1` | `#0E0A08` | Fondo principal |
| `--color-surface-2` | `#1A1410` | Tarjetas, paneles |
| `--color-surface-3` | `#2A2018` | Elevación media |
| `--color-surface-4` | `#3A3028` | Hover states |

### Semánticos

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-success` | `#7F9A74` | Éxito, completado |
| `--color-info` | `#C59442` | Info, notas |
| `--color-warning` | `#C59442` | Advertencia |
| `--color-danger` | `#B76353` | Error, peligro |

### Texto

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-text-primary` | `#F7F1E8` | Headings, body |
| `--color-text-secondary` | `#D4C4B0` | Subtítulos |
| `--color-text-muted` | `#8A7D6B` | Placeholders |
| `--color-text-disabled` | `#5A4D3B` | Deshabilitado |

---

## Componentes

### Button

```tsx
import { Button } from "@drenyra/ui";

<Button variant="primary" size="md" onClick={handleClick}>
  Guardar Factura
</Button>
```

**Variants:** `primary` | `secondary` | `ghost` | `danger`
**Sizes:** `sm` | `md` | `lg`

### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@drenyra/ui";

<Card>
  <CardHeader>
    <CardTitle>Resumen Fiscal</CardTitle>
  </CardHeader>
  <CardContent>
    <p>IGV del mes: S/ 12,450</p>
  </CardContent>
</Card>
```

### Badge

```tsx
import { Badge } from "@drenyra/ui";

<Badge variant="success">Pagado</Badge>
<Badge variant="warning">Pendiente</Badge>
<Badge variant="danger">Vencido</Badge>
```

### Tooltip

```tsx
import { Tooltip, TooltipProvider } from "@drenyra/ui";

<TooltipProvider>
  <Tooltip content="Este campo es obligatorio para SUNAT">
    <span>?</span>
  </Tooltip>
</TooltipProvider>
```

---

## Utility: `cn()`

Merge de clases Tailwind con resolución de conflictos:

```tsx
import { cn } from "@drenyra/ui";

const className = cn(
  "px-4 py-2 rounded-md",
  isActive && "bg-[var(--color-primary)]",
  "text-[var(--color-text-primary)]"
);
```

Combina `clsx` (condicionales) + `tailwind-merge` (resolución de conflictos).

---

## Convenciones

### ❌ No uses colores hardcodeados

```tsx
// MAL — rompe la coherencia de marca
className="bg-blue-500 text-white"

// BIEN — usa tokens CSS
className="bg-[var(--color-primary)] text-[var(--color-text-primary)]"
```

### ✅ Usá la regla ESLint

El plugin `eslint-plugin-design-tokens` detecta colores off-brand:

```bash
bun run lint
# design-tokens/no-off-brand-colors — error si usás blue, indigo, violet, etc.
```

Colores prohibidos: `blue`, `indigo`, `violet`, `purple`, `cyan`, `rose`, `pink`, `fuchsia`, `emerald`, `sky`, `teal`.

Colores permitidos: usa tokens CSS (`--color-primary`, `--color-accent`, etc.) o los semánticos (`--color-success`, `--color-danger`).

---

## Estructura

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── Button.tsx      # CTAs, acciones
│   │   ├── Card.tsx        # Contenedores de contenido
│   │   ├── Badge.tsx       # Etiquetas de estado
│   │   └── Tooltip.tsx     # Ayuda contextual
│   ├── styles/
│   │   └── tokens.css      # Variables CSS de marca
│   ├── lib/
│   │   └── utils.ts        # cn() helper
│   └── index.ts            # Barrel exports
├── package.json
└── tsconfig.json
```

---

## Agregar un nuevo componente

1. Crear `src/components/MiComponente.tsx`
2. Exportar en `src/index.ts`
3. Documentar en este README (tabla de componentes)
4. Actualizar `last-verified` en el frontmatter de este archivo

---

## Dependencias

| Tipo | Paquete |
|------|---------|
| Peer | `react ^19.0.0`, `react-dom ^19.0.0`, `tailwindcss ^4.0.0` |
| Runtime | `@radix-ui/react-tooltip`, `clsx`, `tailwind-merge` |
| Dev | `typescript ^5.7.3`, `@types/react` |

---

## Scripts

| Script | Comando | Descripción |
|--------|---------|-------------|
| `typecheck` | `tsc --noEmit` | Verifica tipos sin emitir |
| `build` | `tsc --outDir dist` | Build para publicación |

> No hay test suite en este paquete. Los componentes se testean en su contexto de uso (`apps/web`, `apps/landing`).
