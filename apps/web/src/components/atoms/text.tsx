/**
 * Text Atom — Unified Typography Primitive
 *
 * Merges atoms/text.tsx (flexible) and ui/typography.tsx (specialized) into
 * a single canonical component at the atoms layer.
 *
 * Supports:
 * - 13 semantic variants (hero → meta)
 * - Polymorphic `as` prop
 * - Weight override via `weight`
 * - `muted` / `truncate` utilities
 * - `scrim` legibility effect (LEGIBILITY.textShadow)
 * - React 19 ref as regular prop
 *
 * @phase 2.3 — Unified Text component
 * @see /docs/05-development/design-system/text-component.md
 */

import type { Ref } from "react";
import { LEGIBILITY } from "@/lib/legibility";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TextVariant =
	| "hero"
	| "display"
	| "h1"
	| "h2"
	| "h3"
	| "h4"
	| "body"
	| "bodySm"
	| "data"
	| "caption"
	| "overline"
	| "label"
	| "meta";

export type TextWeight = "regular" | "medium" | "semibold" | "bold";

type TextAs =
	| "p"
	| "span"
	| "div"
	| "h1"
	| "h2"
	| "h3"
	| "h4"
	| "h5"
	| "h6"
	| "label"
	| "small";

// ─── Style Maps ──────────────────────────────────────────────────────────────

const variantStyles: Record<TextVariant, string> = {
	hero: "text-4xl sm:text-5xl font-bold tracking-tight leading-tight",
	display: "text-3xl font-bold tracking-tight leading-tight",
	h1: "text-2xl font-bold tracking-tight leading-tight",
	h2: "text-xl font-semibold tracking-tight leading-snug",
	h3: "text-lg font-semibold leading-snug",
	h4: "text-base font-semibold leading-snug",
	body: "text-base leading-normal",
	bodySm: "text-sm leading-normal",
	data: "font-mono tabular-nums text-sm font-semibold tracking-tight",
	caption: "text-xs leading-normal",
	overline: "text-2xs font-semibold uppercase tracking-widest",
	label: "text-sm font-medium leading-normal",
	meta: "text-xs leading-normal",
};

const weightStyles: Record<TextWeight, string> = {
	regular: "font-normal",
	medium: "font-medium",
	semibold: "font-semibold",
	bold: "font-bold",
};

// ─── Props ───────────────────────────────────────────────────────────────────

export interface TextProps {
	/** Semantic variant (default: body) */
	variant?: TextVariant;
	/** Override the variant's default font weight */
	weight?: TextWeight;
	/** Polymorphic root element (default: p) */
	as?: TextAs;
	/** Truncate with ellipsis on overflow */
	truncate?: boolean;
	/** Render in muted/tertiary color */
	muted?: boolean;
	/**
	 * Legibility scrim (drop-shadow) for text over complex backgrounds.
	 * - `true` applies the medium scrim
	 * - Pass a key from LEGIBILITY.textShadow for custom intensity
	 */
	scrim?: boolean | keyof typeof LEGIBILITY.textShadow;
	className?: string;
	children?: React.ReactNode;
	/** React 19 — ref is a regular prop, no forwardRef needed */
	ref?: Ref<HTMLElement>;
	id?: string;
	style?: React.CSSProperties;
}

// ─── Component ───────────────────────────────────────────────────────────────

function Text({
	variant = "body",
	weight,
	as: Component = "p",
	truncate,
	muted,
	scrim,
	className,
	children,
	ref,
	...props
}: TextProps & Omit<React.HTMLAttributes<HTMLElement>, keyof TextProps>) {
	return (
		<Component
			ref={ref as never}
			className={cn(
				variantStyles[variant],
				weight && weightStyles[weight],
				truncate && "truncate",
				muted ? "text-[var(--text-tertiary)]" : "text-[var(--text-primary)]",
				scrim === true && LEGIBILITY.textShadow.medium,
				typeof scrim === "string" && LEGIBILITY.textShadow[scrim],
				className,
			)}
			{...props}
		>
			{children}
		</Component>
	);
}

export { Text };
