// =============================================================
// DRENYRA CYAN/VIOLET PALETTE — GENERATED FILE
// Source: apps/web/src/lib/design-tokens/tokens.dtcg.json
// DO NOT EDIT — run: bun tokens:generate
// Generated: 2026-07-05
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
	// Accent — cyan (primary brand)
	cyan: {
		base: "#3CE6D8",
		hover: "#6AEFE4",
		active: "#2ECFC2",
		dim: "#1F8A80",
	},

	// Accent — violet (secondary brand)
	violet: {
		base: "#9B7FE8",
		hover: "#B8A2F0",
		active: "#6B54A8",
		dim: "#7B66C0",
	},

	// State
	state: {
		success: "#4ADE94",
		warning: "#F5B84A",
		error: "#F0665E",
		pending: "#6B9FE8",
	},

	// CSS variable references (for chart libraries that accept style strings)
	cssVar: {
		success: "var(--color-success)",
		warning: "var(--color-warning)",
		error: "var(--color-danger)",
		info: "var(--color-info)",
		textPrimary: "var(--color-text-primary)",
		border: "var(--color-stroke-2)",
	},
} as const;

export type PaletteColor = typeof PALETTE;
