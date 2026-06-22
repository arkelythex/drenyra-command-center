# Seguridad page redesign — Visual Security Architecture

**Date**: 2026-05-25
**Type**: Design spec
**Status**: Draft

## Goal

Redesign `/seguridad` to have a distinctive visual identity — replacing the current
all-text, monotonous-card-grid layout with a cinematic hero, an SVG architecture
diagram, and varied section layouts. The page should feel like a security page:
layered, visual, technical.

## Problems addressed

1. **No visual identity** — zero images, diagrams, or illustrations. All text.
2. **Monotonous pattern** — `SectionContainer` → `SectionHeader` → 4× `FeatureCard`
   repeated 3 times identically.
3. **Hero is flat** — only a gradient background, no visual impact.
4. **Same as every other product page** — no differentiation from Ledger, Studio,
   Cortex, etc.
5. **Architecture isn't shown** — security concepts like layered defense (encryption → RLS
   → audit → hash chain) are inherently visual but described only as cards.

## Design DNA

| Influence | How it applies |
|-----------|----------------|
| **Anduril** | Dark cinematic hero, subtle grid/hex backgrounds, industrial feel |
| **Palantir** | Data narrative, layered architecture visualization, operational gravity |
| **Security industry** | Layered visual (defense in depth), trust badges, technical diagrams |

## Section flow

```
Hero (cinematic visual + text)
  ↓
Pillars (4-card grid, polished)
  ↓
Architecture diagram (SVG layered visual — centerpiece)
  ↓
Certifications (improved badges)
  ↓
Trust CTA (refined)
```

---

### 1. Hero — "Tu información fiscal, protegida por diseño."

**Keep** same copy (tagline, headline, subhead).

**Add** a visual background:
- CSS radial-gradient dot grid pattern (subtle, `rgba(255,255,255,0.03)`)
- Ambient glow via `bg-gradient-to-b from-foreground/[0.04] to-transparent`
- Keep the pill badge (`Sparkles` + `hero.tagline`)
- Keep `GradientText` emphasis on `hero.headlineEmphasis`

The hero stays text-centric but the background gives it visual texture and depth.
No images needed — pure CSS.

### 2. Compliance Pillars — enhanced 4-card grid

**Keep** same copy (`pillars` items).

**Change**: Replace `FeatureCard` with a custom card that shows a visual flow:
- Slightly larger icon (`IconBox` size `lg` instead of `md`)
- Subtle progress/connector feel between cards (optional visual hint that these
  are a pipeline: RUC → IGV → UBL → CDR)
- Use `variant="muted"` section background (already done)

Actually, the current FeatureCard is already solid. The main improvement here is
removing the redundant `SectionHeader` description and making the icon larger.

### 3. Architecture diagram — SVG layered visual (CENTERPIECE)

**Replace** the 4-card `FeatureCard` grid with a **visual layered diagram**.

Design: 4 horizontal layers stacked vertically, connected by arrow/flow lines:

```
  ┌─────────────────────────────────────────────────────┐
  │ 🔗  Cadena de Hash                                  │
  │     Cada bloque conecta con el anterior mediante     │
  │     hash criptográfico. Integridad verificable.      │
  │     [Block #1] ──▶ [Block #2] ──▶ [Block #3]        │
  ├─────────────────────────────────────────────────────┤
  │ 📜  Trazabilidad de decisiones                      │
  │     Hash + timestamp + regla aplicada por cada       │
  │     decisión operativa. Evidencia inmutable.         │
  │     [Decisión] ──▶ [Hash] ──▶ [Timestamp] ──▶ [Regla]│
  ├─────────────────────────────────────────────────────┤
  │ 👥  Row Level Security                               │
  │     Políticas de acceso a nivel de fila. Cada        │
  │     usuario ve exactamente lo que le corresponde.    │
  │     [User] ──▶ [Role] ──▶ [Policy] ──▶ [Scoped Data] │
  ├─────────────────────────────────────────────────────┤
  │ 🔒  Cifrado AES-256                                  │
  │     Datos cifrados en tránsito (TLS 1.3) y en        │
  │     reposo (AES-256-GCM). Ningún dato sin cifrar.    │
  │     [TLS 1.3] ·········· [AES-256-GCM]               │
  └─────────────────────────────────────────────────────┘
```

Implementation: A single React component (`SeguridadArchDiagram`) that renders
inline SVG for the connector arrows + HTML for the layer content. Each layer
has fixed height, consistent padding, and the SVG arrows flow between layers.

The diagram uses:
- Same border/background tokens as the rest of the page
- Subtle arrow connectors between layers (SVG `<path>` with arrowhead markers)
- Small inline flow representation per layer (simple text-based, not actual SVG boxes)
- Icon on each layer matching the architecture concepts

### 4. Certifications — improved badges

**Keep** same copy.

**Improve**:
- Larger visual treatment: increase icon size from `w-14 h-14` to `w-16 h-16`
- Add a subtle glow/shadow behind the icon
- Slightly more spacing
- `variant="borderY"` section background (already correct)

### 5. Trust CTA — refined

**Keep** same copy and structure.

**Improve**:
- Use `btn-primary` (already correct)
- Ensure consistent spacing with the rest of the page

## What to create

| File | Purpose |
|------|---------|
| `components/seguridad/seguridad-arch-diagram.tsx` | SVG layered architecture diagram |
| Updated `app/seguridad/seguridad-page.tsx` | New composition with diagram, varied sections |

## What to keep unchanged

- All copy in `lib/landing/copy/v2/seguridad.ts`
- `SectionContainer`, `ScrollReveal`, `GradientText` components
- Metadata in `app/seguridad/page.tsx`
- `Navbar` and `Footer`

## Visual guardrails

- Keep dark theme (`bg-black` or `#0A0A0A`)
- No carousels, tab switchers, or accordions
- Animations: only `ScrollReveal` (fade + translateY), respect reduced motion
- No external dependencies — all visuals via inline SVG + CSS
- The architecture diagram is the centerpiece, everything else supports it
