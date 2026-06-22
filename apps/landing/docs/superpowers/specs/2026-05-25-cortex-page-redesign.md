# Cortex Page Redesign — Design Spec

**Approach A: Signal Intelligence** — amber/warm accents, signal pipeline visual, SOC/monitoring aesthetic.

## Sections

### 1. Hero — Cinematic with amber signal aesthetic
- CSS dot-grid background (same as Seguridad) but with amber glow (`#F59E0B`/amber tones)
- 3 decorative "signal bars" (CSS-only: horizontal bars with staggered opacity animation)
- Same copy (tagline, headline, subhead, CTAs)
- ProductPanel keeps same structure but with amber/border styling
- Layout: full-width, `max-w-6xl`

### 2. Signal Flow — Replaces ProductCapabilitiesGrid
- Inline SVG diagram: 3 horizontal nodes connected by arrow paths
- Node 1: Detectar (Target icon) — "Riesgo priorizado"
- Node 2: Analizar (GitBranch icon) — "Reglas versionadas"
- Node 3: Actuar (ListChecks icon) — "Action queue"
- SVG `<path>` connectors with arrow markers (similar to SeguridadArchDiagram pattern)
- Responsive: horizontal on md+, vertical on mobile (stack with connectors)
- Subtle amber accent on active nodes

### 3. Requirements — Same checklist, amber theme
- Keep ProductCheckpoints pattern but use amber `text-amber-400` for check icons
- Same copy

### 4. Command View — Enhanced with amber glow
- 2x2 grid on md+ (currently 1-column)
- Larger cards with amber border glow on hover
- Keep icon + label pattern but more prominent
- Same copy

### 5. Ecosystem — Unchanged
- Keep `ProductEcosystem` as-is

## Visual identity
- **Accent color**: Amber/warm (`#F59E0B`, `text-amber-400`, `border-amber-500/20`)
- **Background**: `bg-black` (already), amber ambient glow in hero
- **Fonts**: Same (Inter + Cinzel)
- **No images**: CSS-only effects + inline SVG diagrams

## Changes from current page
- Hero: add dot-grid + glow + signal bars (remove generic gradient)
- Capabilities section: replaced by `CortexSignalFlow` diagram
- Checkpoints: amber icons instead of generic `text-product-accent`
- Command view: 2x2 grid on desktop + amber glow on hover
- Ecosystem: unchanged

## Files
- New: `components/cortex/cortex-signal-flow.tsx` (inline SVG diagram)
- Modified: `app/cortex/cortex-page.tsx` (complete rewrite)
- Modified: `app/cortex/page.tsx` (keep same, add amber theme class)

## Non-goals
- No new copy — reuse existing `CORTEX_COPY`
- No images or SVGs from external files
- No changes to shared `Product*` components
