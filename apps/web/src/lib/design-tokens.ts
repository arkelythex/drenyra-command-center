/**
 * Design tokens — typed handles to the CSS custom properties defined in
 * `src/index.css`. CSS is the single source of values; nothing is duplicated
 * here, so changing a theme never requires touching TypeScript.
 */

/** Stacking layers; mirrors `--z-*` in index.css. */
export const Z_INDEX = {
	base: "var(--z-base)",
	sticky: "var(--z-sticky)",
	dropdown: "var(--z-dropdown)",
	overlay: "var(--z-overlay)",
	fixed: "var(--z-fixed)",
	modalBackdrop: "var(--z-modal-backdrop)",
	modal: "var(--z-modal)",
	popover: "var(--z-popover)",
	tooltip: "var(--z-tooltip)",
	toast: "var(--z-toast)",
} as const;

/** Corner radii by role; mirrors `--radius-*`. */
export const BORDER_RADIUS = {
	icon: "var(--radius-md)",
	card: "var(--radius-xl)",
	modal: "var(--radius-2xl)",
	pill: "var(--radius-pill)",
} as const;

/** Tailwind classes for backdrop blur by layer. */
export const BACKDROP_BLUR = {
	glass: "backdrop-blur-[var(--glass-blur)]",
	modal: "backdrop-blur-[var(--glass-blur-heavy)]",
} as const;

/** Spring physics for framer-motion. Pure numbers: they cannot live in CSS. */
export const MOTION_VARIANTS = {
	hidden: { opacity: 0, y: 10 },
	visible: { opacity: 1, y: 0 },
	spring: { stiffness: 260, damping: 30, mass: 1 },
	springGentle: { stiffness: 180, damping: 26, mass: 1 },
} as const;

type RadiusRole = keyof typeof BORDER_RADIUS;

/**
 * Literal class names so Tailwind's scanner can see them; never build these
 * with template strings.
 */
const RADIUS_CLASSES: Record<RadiusRole, string> = {
	icon: "rounded-[var(--radius-md)]",
	card: "rounded-[var(--radius-xl)]",
	modal: "rounded-[var(--radius-2xl)]",
	pill: "rounded-[var(--radius-pill)]",
};

/** Tailwind class helpers for the same tokens. */
export const tokensToClasses = {
	borderRadius: (role: RadiusRole): string => RADIUS_CLASSES[role],
} as const;

export function useDesignTokens() {
	return {
		zIndex: Z_INDEX,
		borderRadius: BORDER_RADIUS,
		backdropBlur: BACKDROP_BLUR,
	} as const;
}
