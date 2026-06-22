/**
 * Semantic Design Tokens - Arkelythex 2026
 *
 * Unified semantic token system that maps primitive tokens to meaningful UI concepts.
 * Reduces cognitive load by providing intent-based naming.
 *
 * @example
 * ```tsx
 * import { semanticTokens } from '@/lib/design-tokens/semantic-tokens';
 *
 * const styles = semanticTokens.status.success.bg;
 * ```
 */

export const semanticTokens = {
	status: {
		success: {
			bg: "bg-success-soft",
			bgMuted: "bg-success-muted",
			bgSubtle: "bg-success-subtle",
			text: "text-[var(--success)]",
			textMuted: "text-success-muted",
			border: "border-success-subtle",
			borderMuted: "border-success-muted",
			shadow: "shadow-success-glow",
			chip: "chip-success",
		},
		warning: {
			bg: "bg-warning-soft",
			bgMuted: "bg-warning-muted",
			bgSubtle: "bg-warning-subtle",
			text: "text-[var(--warning)]",
			textMuted: "text-warning-muted",
			border: "border-warning-subtle",
			borderMuted: "border-warning-muted",
			shadow: "shadow-warning-glow",
			chip: "chip-warning",
		},
		danger: {
			bg: "bg-danger-soft",
			bgMuted: "bg-danger-muted",
			bgSubtle: "bg-danger-subtle",
			text: "text-[var(--danger)]",
			textMuted: "text-danger-muted",
			border: "border-danger-subtle",
			borderMuted: "border-danger-muted",
			shadow: "shadow-danger-glow",
			chip: "chip-danger",
		},
		info: {
			bg: "bg-info-soft",
			bgMuted: "bg-info-muted",
			bgSubtle: "bg-info-subtle",
			text: "text-[var(--info)]",
			textMuted: "text-info-muted",
			border: "border-info-subtle",
			borderMuted: "border-info-muted",
			shadow: "shadow-info-glow",
			chip: "chip-info",
		},
		neutral: {
			bg: "bg-surface-3",
			bgMuted: "bg-surface-2",
			bgSubtle: "bg-surface-1",
			text: "text-primary",
			textMuted: "text-secondary",
			border: "stroke-1",
			borderMuted: "stroke-2",
			shadow: "",
			chip: "chip",
		},
	},

	ai: {
		thinking: {
			bg: "bg-[var(--info)]/12",
			border: "border-[var(--info)]/25",
			text: "text-[var(--accent)]",
			halo: "halo-ai-subtle",
			pulse: "animate-ai-thinking",
		},
		confident: {
			bg: "bg-success-subtle",
			border: "border-success-subtle",
			text: "text-[var(--success)]",
			halo: "shadow-success-glow",
			pulse: "",
		},
		uncertain: {
			bg: "bg-warning-subtle",
			border: "border-warning-subtle",
			text: "text-[var(--warning)]",
			halo: "shadow-warning-glow",
			pulse: "",
		},
		error: {
			bg: "bg-danger-subtle",
			border: "border-danger-subtle",
			text: "text-[var(--danger)]",
			halo: "shadow-danger-glow",
			pulse: "",
		},
	},

	surface: {
		base: "bg-bg-0",
		elevated: "bg-surface-1",
		overlay: "bg-surface-2",
		modal: "bg-surface-3",
		glass: "glass-card",
		glassPanel: "glass-panel",
	},

	text: {
		primary: "text-primary",
		secondary: "text-secondary",
		muted: "text-muted",
		disabled: "text-disabled",
		inverse: "text-text-inverse",
		accent: "text-[var(--accent)]",
	},

	border: {
		subtle: "border-[var(--color-stroke-1)]",
		default: "border-[var(--color-stroke-2)]",
		strong: "border-[var(--color-stroke-3)]",
		glass: "border-white/10",
		accent: "border-[var(--info)]/35",
	},

	interactive: {
		hover: {
			lift: "hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)]",
			glow: "hover:shadow-[var(--info)]/25",
			scale: "hover:scale-[1.02]",
			bg: "hover:bg-surface-3",
			border: "hover:border-[var(--color-stroke-3)]",
		},
		active: {
			press: "active:scale-95",
			pressSubtle: "active:scale-[0.98]",
		},
		focus: {
			ring: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--info)]/55",
			ringOffset:
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--info)]/55",
		},
	},
} as const;

export type StatusVariant =
	| "success"
	| "warning"
	| "danger"
	| "info"
	| "neutral";
export type AIState = "thinking" | "confident" | "uncertain" | "error";
export type SurfaceVariant =
	| "base"
	| "elevated"
	| "overlay"
	| "modal"
	| "glass"
	| "glassPanel";

export const getStatusTokens = (variant: StatusVariant) =>
	semanticTokens.status[variant];
export const getAITokens = (state: AIState) => semanticTokens.ai[state];
export const getSurfaceTokens = (variant: SurfaceVariant) =>
	semanticTokens.surface[variant];

export const confidenceToStatus = (score: number): StatusVariant => {
	if (score >= 85) return "success";
	if (score >= 70) return "info";
	if (score >= 50) return "warning";
	return "danger";
};

export const confidenceToAIState = (score: number): AIState => {
	if (score >= 85) return "confident";
	if (score >= 70) return "thinking";
	if (score >= 50) return "uncertain";
	return "error";
};

export const confidenceThresholds = {
	high: { min: 85, label: "Alta confianza", color: "success" },
	medium: { min: 70, label: "Confianza moderada", color: "info" },
	low: { min: 50, label: "Requiere revisión", color: "warning" },
	critical: { min: 0, label: "Aprobación manual", color: "danger" },
} as const;

export const getConfidenceLevel = (score: number) => {
	if (score >= confidenceThresholds.high.min) return confidenceThresholds.high;
	if (score >= confidenceThresholds.medium.min)
		return confidenceThresholds.medium;
	if (score >= confidenceThresholds.low.min) return confidenceThresholds.low;
	return confidenceThresholds.critical;
};
