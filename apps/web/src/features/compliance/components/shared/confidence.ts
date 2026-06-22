/**
 * Confidence level utilities for roadmap action recommendations.
 */

export type ConfidenceLevel = "high" | "medium" | "low";

/**
 * Returns a CSS color class for confidence level display.
 */
export function confidenceColor(confidence: number): string {
	if (confidence >= 0.9) return "text-[var(--color-success)]";
	if (confidence >= 0.75) return "text-amber-500";
	return "text-red-500";
}

/**
 * Returns a human-readable label for confidence level.
 */
export function confidenceLabel(confidence: number): ConfidenceLevel {
	if (confidence >= 0.9) return "high";
	if (confidence >= 0.75) return "medium";
	return "low";
}

/**
 * Returns Tailwind badge classes for confidence level.
 */
export function confidenceBadgeClasses(
	confidence: number,
	base = "border-current/30",
): string {
	const color = confidenceColor(confidence);
	return `rounded-full border px-2 py-0.5 text-[11px] font-medium ${color} ${base}`;
}
