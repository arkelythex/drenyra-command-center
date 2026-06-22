# 🎨 Guía de Design Tokens - Arkelythex UI

## 📚 Índice

1. [Introducción](#introducción)
2. [Categorías de Tokens](#categorías-de-tokens)
3. [Patrones de Migración](#patrones-de-migración)
4. [Ejemplos por Componente](#ejemplos-por-componente)
5. [FAQ](#faq)

---

## Introducción

El sistema de Design Tokens centraliza **todas las configuraciones visuales hardcodeadas** en un único lugar: `apps/web/src/lib/design-tokens.ts`.

### ✅ Ventajas

- **Consistencia visual** garantizada
- **Mantenimiento centralizado** (cambiar un token actualiza toda la UI)
- **Type safety** completo con TypeScript
- **Mejores nombres semánticos** (`GLASS_EFFECTS.card` vs `bg-card/60 backdrop-blur-xl...`)

### 🎯 ¿Cuándo usar tokens?

- ✅ **Siempre** para border-radius, sombras, z-index, gradientes
- ✅ Para animaciones y efectos de glass morphism
- ✅ Para motion variants de Framer Motion
- ⚠️ Para spacing (usa Tailwind si es más simple)

---

## Categorías de Tokens

### 1. BORDER_RADIUS

```typescript
import { BORDER_RADIUS } from '@/lib/design-tokens';

// ❌ ANTES
<div className="rounded-[2rem]" />

// ✅ AHORA
<div style={{ borderRadius: BORDER_RADIUS.card }} />
```

**Tokens disponibles:**
- `card`: 2rem (tarjetas principales)
- `modal`: 2.5rem (modales y overlays)
- `button`: 0.75rem (botones)
- `input`: 0.5rem (inputs, textareas)
- `icon`: 0.5rem (contenedores de iconos)

---

### 2. GRADIENTS 🆕

Elimina los gradientes hardcodeados que están en **129 archivos**.

```typescript
import { GRADIENTS } from '@/lib/design-tokens';

// ❌ ANTES
<div className="bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5" />

// ✅ AHORA
<div className={GRADIENTS.ambient} />
```

**Tokens disponibles:**

#### Ambient backgrounds
- `ambient`: Header horizontal (blue/purple)
- `ambientVertical`: Header vertical

#### Icon backgrounds
- `iconBlue`: from-blue-600/10 to-purple-600/10
- `iconEmerald`: from-emerald-500/20 to-emerald-900/20
- `iconAmber`: Ámbar/dorado
- `iconRed`: Rojo/rosa

#### Hover effects
- `hoverBlue`: Gradiente sólido azul → índigo
- `hoverEmerald`: Emerald → teal
- `hoverOverlay`: Para `group-hover` en cards

#### Premium
- `premiumGlass`: Superficie destacada
- `radialBlue`: Spotlight radial

---

### 3. BACKDROP_BLUR 🆕

Usado en **103 archivos**. Separa el blur decorativo (`BLUR`) del blur funcional para glass morphism.

```typescript
import { BACKDROP_BLUR } from '@/lib/design-tokens';

// ❌ ANTES
<div className="backdrop-blur-xl" />

// ✅ AHORA
<div className={BACKDROP_BLUR.glass} />
```

**Tokens semánticos:**
- `glass`: backdrop-blur-xl (cards, componentes)
- `modal`: backdrop-blur-2xl (modales)
- `header`: backdrop-blur-xl (headers sticky)
- `panel`: backdrop-blur-3xl (paneles grandes)

---

### 4. GLASS_EFFECTS 🆕

**La combinación completa** de backdrop-blur + opacidad + border. Elimina código repetitivo.

```typescript
import { GLASS_EFFECTS } from '@/lib/design-tokens';

// ❌ ANTES (18 caracteres de código repetido)
<div className="bg-card/60 dark:bg-card/40 backdrop-blur-xl border border-border/50 shadow-lg dark:shadow-2xl" />

// ✅ AHORA (1 token semántico)
<div className={GLASS_EFFECTS.card} />
```

**Tokens disponibles:**
- `card`: Tarjeta glass estándar
- `cardPremium`: Tarjeta destacada
- `panel`: Panel grande (sidebars)
- `header`: Header/navbar sticky
- `button`: Botón glass translúcido
- `input`: Input con glass effect

---

### 5. ANIMATIONS 🆕

Unifica las animaciones custom (index.css) con clases reutilizables.

```typescript
import { ANIMATIONS } from '@/lib/design-tokens';

// ❌ ANTES
<div className="animate-entrance" />

// ✅ AHORA
<div className={ANIMATIONS.entrance} />
```

**Tokens disponibles:**
- `entrance`: Fade + translateY (aparición suave)
- `zoom`: Scale up
- `spin`, `spinSlow`: Rotación
- `pulse`: Pulso de opacidad

---

### 6. MOTION_VARIANTS 🆕

Para **Framer Motion**. Reemplaza los objetos de configuración hardcodeados.

```typescript
import { MOTION_VARIANTS } from '@/lib/design-tokens';

// ❌ ANTES
const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 20
}

<motion.div transition={springTransition} />

// ✅ AHORA
import { MOTION_VARIANTS } from '@/lib/design-tokens';

<motion.div transition={MOTION_VARIANTS.spring} />
```

**Variants disponibles:**
- `spring`: iOS-like (300 stiffness, 20 damping)
- `springGentle`: Más suave
- `springBouncy`: Más rebote
- `smooth`: Tween suave (300ms)
- `quick`: Tween rápido (150ms)

---

## Patrones de Migración

### Patrón 1: Header con Ambient Glow

```tsx
// ❌ ANTES (35 archivos con este código)
<header className="px-6 py-5 border-b border-border">
  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
    <Settings size={20} />
  </div>
</header>

// ✅ AHORA
import { GRADIENTS, BORDER_RADIUS, SHADOWS } from '@/lib/design-tokens';

<header className="px-6 py-5 border-b border-border">
  <div className={`absolute inset-0 ${GRADIENTS.ambient} pointer-events-none`} />
  <div
    className={`h-12 w-12 ${GRADIENTS.iconBlue} border border-blue-500/20`}
    style={{
      borderRadius: BORDER_RADIUS.icon,
      boxShadow: SHADOWS.blue
    }}
  >
    <Settings size={20} />
  </div>
</header>
```

---

### Patrón 2: Card con Glass Effect

```tsx
// ❌ ANTES (50+ archivos)
<div className="bg-card/60 dark:bg-card/40 backdrop-blur-xl border border-border/50 shadow-lg rounded-[2rem]">
  Contenido
</div>

// ✅ AHORA
import { GLASS_EFFECTS, BORDER_RADIUS } from '@/lib/design-tokens';

<div
  className={GLASS_EFFECTS.card}
  style={{ borderRadius: BORDER_RADIUS.card }}
>
  Contenido
</div>

// 🚀 MEJOR: Usar el componente <Card>
import { Card } from '@/components/ui/card';

<Card variant="glass">
  Contenido
</Card>
```

---

### Patrón 3: Modal con Z-Index

```tsx
// ❌ ANTES (10+ archivos)
<div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md">
  <div className="z-[110] bg-card rounded-[2.5rem]">
    Contenido modal
  </div>
</div>

// ✅ AHORA
import { Z_INDEX, BORDER_RADIUS, BACKDROP_BLUR } from '@/lib/design-tokens';

<div
  className={`fixed inset-0 bg-background/80 ${BACKDROP_BLUR.modal}`}
  style={{ zIndex: Z_INDEX.modalBackdrop }}
>
  <div
    className="bg-card"
    style={{
      zIndex: Z_INDEX.modal,
      borderRadius: BORDER_RADIUS.modal
    }}
  >
    Contenido modal
  </div>
</div>
```

---

### Patrón 4: Framer Motion Card

```tsx
// ❌ ANTES (Card.tsx original)
import { motion } from "framer-motion"

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 20
}

<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={springTransition}
  className="rounded-[1.5rem] bg-card/60 backdrop-blur-xl"
/>

// ✅ AHORA
import { motion } from "framer-motion"
import { MOTION_VARIANTS, GLASS_EFFECTS, BORDER_RADIUS } from '@/lib/design-tokens';

<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={MOTION_VARIANTS.spring}
  className={GLASS_EFFECTS.card}
  style={{ borderRadius: BORDER_RADIUS.card }}
/>
```

---

## Ejemplos por Componente

### Header/Navbar

```tsx
import { GRADIENTS, BACKDROP_BLUR } from '@/lib/design-tokens';

export const DashboardHeader = () => (
  <header className={`px-6 py-5 border-b border-border ${BACKDROP_BLUR.header}`}>
    {/* Ambient glow */}
    <div className={`absolute inset-0 ${GRADIENTS.ambient} pointer-events-none`} />

    {/* Contenido */}
    <div className="relative z-10">
      {/* ... */}
    </div>
  </header>
);
```

---

### Icon Container

```tsx
import { GRADIENTS, BORDER_RADIUS, SHADOWS } from '@/lib/design-tokens';

export const StatusIcon = ({ type, children }) => {
  const gradients = {
    success: GRADIENTS.iconEmerald,
    warning: GRADIENTS.iconAmber,
    error: GRADIENTS.iconRed,
    info: GRADIENTS.iconBlue,
  };

  return (
    <div
      className={`h-12 w-12 ${gradients[type]} border border-current/20 flex items-center justify-center`}
      style={{
        borderRadius: BORDER_RADIUS.icon,
        boxShadow: SHADOWS.blue
      }}
    >
      {children}
    </div>
  );
};
```

---

### Animated Button

```tsx
import { motion } from "framer-motion";
import { MOTION_VARIANTS, BORDER_RADIUS } from '@/lib/design-tokens';

export const AnimatedButton = ({ children }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    transition={MOTION_VARIANTS.springGentle}
    className="px-4 py-2 bg-primary text-primary-foreground"
    style={{ borderRadius: BORDER_RADIUS.button }}
  >
    {children}
  </motion.button>
);
```

---

### Glass Input

```tsx
import { GLASS_EFFECTS, BORDER_RADIUS } from '@/lib/design-tokens';

export const GlassInput = (props) => (
  <input
    {...props}
    className={`px-4 py-2 ${GLASS_EFFECTS.input} focus:outline-none`}
    style={{ borderRadius: BORDER_RADIUS.input }}
  />
);
```

---

## Hook: useDesignTokens()

Para componentes complejos, usa el hook:

```tsx
import { useDesignTokens } from '@/lib/design-tokens';

export const ComplexComponent = () => {
  const {
    borderRadius,
    shadows,
    zIndex,
    gradients,
    glassEffects,
    motionVariants
  } = useDesignTokens();

  return (
    <motion.div
      transition={motionVariants.spring}
      className={`${gradients.ambient} ${glassEffects.card}`}
      style={{
        borderRadius: borderRadius.card,
        boxShadow: shadows.elevated,
        zIndex: zIndex.floating
      }}
    >
      {/* ... */}
    </motion.div>
  );
};
```

---

## FAQ

### ¿Cuándo usar tokens vs Tailwind directo?

- **Tokens**: Border radius, sombras, z-index, gradientes, glass effects, animaciones custom
- **Tailwind**: Padding, margin, colores (que vienen de CSS variables), text sizes

### ¿Puedo mezclar tokens con Tailwind?

Sí, es la práctica recomendada:

```tsx
<div
  className={`p-6 ${GRADIENTS.ambient} ${BACKDROP_BLUR.glass}`}
  style={{ borderRadius: BORDER_RADIUS.card }}
/>
```

### ¿Cómo busco valores hardcodeados?

```bash
# Buscar border-radius hardcodeados
grep -r "rounded-\[" apps/web/src/

# Buscar sombras hardcodeadas
grep -r "shadow-\[0_0_" apps/web/src/

# Buscar gradientes
grep -r "from-blue-\d\+/\d\+" apps/web/src/
```

### ¿Y si necesito un valor nuevo?

1. Verifica si ya existe un token similar
2. Si no, agrégalo a `design-tokens.ts`
3. Actualiza los tipos y el hook `useDesignTokens()`
4. Documenta el uso aquí

---

## 🎯 Checklist de Migración

Para cada componente:

- [ ] Reemplazar clases ad-hoc de `rounded-*` con `BORDER_RADIUS.*`
- [ ] Reemplazar clases ad-hoc de `shadow-*` con `SHADOWS.*`
- [ ] Reemplazar clases ad-hoc de `z-*` con `Z_INDEX.*`
- [ ] Reemplazar gradientes hardcodeados con `GRADIENTS.*`
- [ ] Reemplazar `backdrop-blur-X` con `BACKDROP_BLUR.*`
- [ ] Considerar usar `GLASS_EFFECTS.*` para combinaciones completas
- [ ] Reemplazar Framer Motion configs con `MOTION_VARIANTS.*`

---

## 🎨 Temas y Paletas

ARKELYTHEX tiene dos temas base más 8 presets de acento y 3 densidades.

### Temas Base

| Tema | Base | Acento | Ámbito |
|------|------|--------|--------|
| **Dreamcoder Ember Noir** | Espresso `#100f0d` | Ember `#d99555` | Default (`.theme-oled`) |
| **Dreamcoder Light** | Warm parchment `#f3eadc` | Cocoa `#824f16` | `:root` (light mode) |

### Presets de Acento

Ember (default), cocoa, terracotta, teal, steel, sage, lavender, maple.

### Densidad

compact, normal, spacious.

> Las variables CSS en `apps/landing/app/globals.css` son la fuente de verdad para tokens de tema. Los tokens de utilería en `design-tokens.ts` se consumen desde componentes React.

---

## 📊 Estado de Adopción

**Última actualización**: 2026-01-19

| Categoría | Archivos Afectados | Migrados | Pendientes |
|-----------|-------------------|----------|------------|
| Border Radius | 50+ | 2 | 48+ |
| Shadows | 48 | 2 | 46 |
| Z-Index | 10 | 2 | 8 |
| Gradients | 129 | 1 | 128 |
| Backdrop Blur | 103 | 1 | 102 |
| **TOTAL** | **340+** | **8** | **332+** |

**Meta**: Migrar 10 componentes críticos por sprint.

---

## 🚀 Componentes Prioritarios

Migrar primero (alto impacto):

1. ✅ `Card.tsx` - Base component (ya migrado)
2. `DashboardHeader.tsx` - Usado en 30+ vistas
3. `EntitiesTable.tsx` - Patrón repetido
4. `CustomReportsView.tsx` - Muchos gradientes
5. `InvoicesBoard.tsx` - Glass effects repetidos

---

**¿Dudas?** Contacta al equipo de UI o revisa `design-tokens.ts` directamente.
