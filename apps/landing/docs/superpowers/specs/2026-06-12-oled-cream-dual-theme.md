# Dual-Theme Design System — OLED Black + Cream

**Date**: 2026-06-12
**Status**: Approved
**Scope**: `apps/landing/` — globals.css, section components, navbar, footer

## Decision

Implement a dual-theme system using CSS class scoping:

- `.theme-oled` → Homepage (`/`) — Negro OLED, copper accent, inspired by OpenAI/Anduril
- `.theme-cream` → Drenyra + all verticals — Crema institutional, copper accent

## Token Map

### OLED Theme (Home)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#000000` | Page background |
| `--foreground` | `#FAFAFA` | Primary text |
| `--muted` | `#111111` | Subtle backgrounds |
| `--muted-foreground` | `#888888` | Secondary text |
| `--border` | `#1A1A1A` | Borders, dividers |
| `--accent` | `#C4793A` | Copper highlights |
| `--accent-foreground` | `#FFFFFF` | Text on accent |
| `--card` | `#0A0A0A` | Card backgrounds |
| `--card-foreground` | `#FAFAFA` | Card text |

### Cream Theme (Verticals)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#FAFAF8` | Page background |
| `--foreground` | `#1A1A17` | Primary text |
| `--muted` | `#F5F5F0` | Subtle backgrounds |
| `--muted-foreground` | `#6B6B66` | Secondary text |
| `--border` | `#D4D4D0` | Borders, dividers |
| `--accent` | `#8B4E1C` | Copper (WCAG AA on cream) |
| `--accent-foreground` | `#FFFFFF` | Text on accent |
| `--card` | `#FFFFFF` | Card backgrounds |
| `--card-foreground` | `#1A1A17` | Card text |

## Implementation

### CSS Architecture

```
globals.css
├── :root                    → Shared tokens (spacing, typography, copper HSL)
├── .theme-oled              → OLED color overrides
├── .theme-cream             → Cream color overrides
├── @theme inline            → Maps CSS vars to Tailwind
├── .hybrid-page             → Cream override for product pages (backward compat)
├── .drenyra-*               → Product-specific styles (unchanged)
└── Component classes        → Use semantic tokens, not hardcoded colors
```

### Component Mapping

| Component | OLED (Home) | Cream (Verticals) |
|-----------|-------------|-------------------|
| Navbar | Dark glass (`rgba(0,0,0,0.85)`) | Light glass (`rgba(250,250,248,0.85)`) |
| Hero grid | White lines on black | Charcoal lines on cream |
| Buttons (primary) | White fill, black text | Charcoal fill, white text |
| Cards | `#0A0A0A` bg, `#1A1A1A` border | `#FFFFFF` bg, `#D4D4D0` border |
| Section alternation | `#0A0A0A` / `#111111` | `#FAFAF8` / `#F5F5F0` |
| Copper accent | `#C4793A` (on black) | `#8B4E1C` (on cream, AA) |
| Footer | Dark | Dark (both themes) |

### Files to Modify

1. `apps/landing/app/globals.css` — Add `.theme-oled` and `.theme-cream` scopes
2. `apps/landing/app/layout.tsx` — Wrap home in `.theme-oled`, verticals in `.theme-cream`
3. `apps/landing/components/landing/landing-page.tsx` — No changes (uses CSS vars)
4. `apps/landing/app/page.tsx` — Ensure `.theme-oled` class on wrapper
5. `apps/landing/app/drenyra/page.tsx` — Ensure `.theme-cream` class (via `hybrid-page`)
6. All vertical pages — Already use `hybrid-page` → inherits `.theme-cream`

### What Stays the Same

- Product-specific CSS classes (`.drenyra-*`, `.ledger-*`, etc.)
- `.drenyra-terminal-intelligence` dark terminal theme
- Section component logic (no TS changes needed)
- Copy content (brand-home.ts)
- framer-motion animations
