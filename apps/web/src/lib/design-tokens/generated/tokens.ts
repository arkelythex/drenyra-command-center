// =============================================================
// ARKELYTHEX COLOR PALETTE — GENERATED FILE
// Source: apps/web/src/lib/design-tokens/tokens.dtcg.json
// DO NOT EDIT — run: bun tokens:generate
// Generated: 2026-06-20
// =============================================================

/**
 * Palette constants for use in JS/TS contexts where CSS vars are unavailable:
 * - Recharts / Victory / Nivo chart colors
 * - SVG gradient stops
 * - Inline styles that can't use CSS variables
 * - Tests / Storybook
 *
 * For everything else, use CSS variables or Tailwind semantic classes.
 */
export const PALETTE = {
  // Accent — blue
  blue: {
    light:  "oklch(0.78 0.14 55)",
    base:   "#d99555",
    hover:  "oklch(0.70 0.16 50)",
    active: "oklch(0.50 0.18 45)",
  },

  // Accent — green (success / positive metrics)
  green: {
    base:   "oklch(0.65 0.22 150)",
    hover:  "oklch(0.75 0.20 150)",
    active: "oklch(0.55 0.22 150)",
  },

  // State
  state: {
    success: "oklch(0.65 0.22 150)",
    warning: "oklch(0.75 0.22 80)",
    danger:  "oklch(0.55 0.25 25)",
    info:    "#d99555",
  },

  // Component: Score Ring (SVG gradient)
  scoreRing: {
    from: "oklch(0.85 0.20 80)",
    mid:  "oklch(0.75 0.22 80)",
    to:   "#d99555",
  },

  // CSS variable references (for chart libraries that accept style strings)
  cssVar: {
    success:    "var(--color-success)",
    warning:    "var(--color-warning)",
    danger:     "var(--color-danger)",
    info:       "var(--color-info)",
    textPrimary: "var(--color-text-primary)",
    border:     "var(--color-stroke-2)",
  },
} as const

export type PaletteColor = typeof PALETTE
