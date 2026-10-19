import { useCallback, useMemo } from "react";

export type HapticKind =
	| "light"
	| "medium"
	| "heavy"
	| "success"
	| "warning"
	| "error";

/** Vibration patterns in ms; a single number is one pulse, an array alternates pulse/pause. */
export const HAPTIC_PATTERNS: Record<HapticKind, number | number[]> = {
	light: 10,
	medium: 20,
	heavy: 35,
	success: [10, 40, 10],
	warning: [30, 50, 30],
	error: [40, 60, 40, 60, 40],
};

function prefersReducedMotion(): boolean {
	return (
		typeof window !== "undefined" &&
		typeof window.matchMedia === "function" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches
	);
}

/**
 * Fires a vibration pattern when the device supports it and the user has not
 * asked for reduced motion. Never throws; returns whether it vibrated.
 */
export function triggerHaptic(kind: HapticKind): boolean {
	if (typeof navigator === "undefined" || !("vibrate" in navigator)) {
		return false;
	}
	if (prefersReducedMotion()) return false;
	try {
		return navigator.vibrate(HAPTIC_PATTERNS[kind]);
	} catch {
		return false;
	}
}

export function useHaptics() {
	const trigger = useCallback((kind: HapticKind): void => {
		triggerHaptic(kind);
	}, []);
	return { trigger };
}

/** Semantic feedback for money-moving actions. */
export function useFinancialHaptics() {
	return useMemo(
		() => ({
			success: () => void triggerHaptic("success"),
			warning: () => void triggerHaptic("warning"),
			error: () => void triggerHaptic("error"),
			/** An entry or document was approved. */
			approval: () => void triggerHaptic("medium"),
			/** A record was saved. */
			onSave: () => void triggerHaptic("success"),
		}),
		[],
	);
}
