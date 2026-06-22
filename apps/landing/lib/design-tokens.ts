/**
 * Arkelythex Design Tokens for apps/landing
 *
 * Centralized design tokens to ensure consistency and compliance with ESLint rules.
 * Values are mapped to the core design system.
 */

export const TYPOGRAPHY = {
	/** 9px - Micro text, very small labels */
	xs: "0.5625rem",
	/** 10px - Small labels, secondary metadata */
	"2xs": "0.625rem",
	/** 11px - Standard labels, captions */
	label: "0.6875rem",
	/** 13px - UI text, small body */
	sm: "0.8125rem",
	/** 16px - Base body text */
	base: "1rem",
	/** Fluid editorial display, OpenAI-style section titles */
	display: "clamp(2.5rem, 7vw + 0.25rem, 5.5rem)",
	/** Fluid hero headline, equivalent to Tailwind 7xl–8xl on large viewports */
	hero: "clamp(4.5rem, 11vw, 8rem)",
	/** Maximum-impact hero headline, equivalent to Tailwind 8xl–9xl */
	heroMega: "clamp(5.5rem, 14vw, 9rem)",
} as const;

export const BORDER_RADIUS = {
	/** 10px - Base controls */
	base: "0.625rem",
	/** 14px - Cards */
	card: "0.875rem",
	/** 32px - Large section cards (2rem) */
	cardLg: "2rem",
} as const;

export const BLUR = {
	/** 60px - Subtle accent glow */
	accent: "60px",
	/** 100px - Standard overlay glow */
	overlay: "100px",
	/** 120px - Background ambient glow */
	background: "120px",
} as const;

export const SHADOWS = {
	/** Subtle monochrome elevation */
	glow: "0_0_80px_rgba(255,255,255,0.06)",
	/** Card depth */
	cardGlow: "0_0_30px_rgba(0,0,0,0.35)",
} as const;
