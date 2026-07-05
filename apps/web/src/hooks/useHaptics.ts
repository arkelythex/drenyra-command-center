import { useCallback } from "react";

export type HapticType =
	| "light"
	| "medium"
	| "heavy"
	| "success"
	| "warning"
	| "error";

let lastHapticAt = 0;

/**
 * useHaptics Hook
 * Proporciona feedback táctil sutil para interacciones críticas.
 * Basado en los patrones de iOS 2026.
 */
export function useHaptics() {
	const trigger = useCallback((type: HapticType) => {
		if (typeof navigator !== "undefined" && "vibrate" in navigator) {
			if (
				typeof window !== "undefined" &&
				window.matchMedia("(prefers-reduced-motion: reduce)").matches
			) {
				return;
			}

			const now = Date.now();
			if (type === "light" && now - lastHapticAt < 60) return;
			lastHapticAt = now;

			const patterns = {
				light: [10],
				medium: [20],
				heavy: [40],
				success: [10, 50, 10],
				warning: [20, 100, 20],
				error: [50, 50, 50, 50, 50],
			};

			try {
				navigator.vibrate(patterns[type]);
			} catch {
				// Silently fail if vibration is not supported or blocked
			}
		}
	}, []);

	const confirm = useCallback(() => trigger("medium"), [trigger]);
	const select = useCallback(() => trigger("light"), [trigger]);

	return { trigger, confirm, select };
}

/**
 * useFinancialHaptics Hook
 * Proporciona feedback específico para operaciones financieras.
 */
export function useFinancialHaptics() {
	const { trigger } = useHaptics();

	const success = useCallback(() => trigger("success"), [trigger]);
	const warning = useCallback(() => trigger("warning"), [trigger]);
	const error = useCallback(() => trigger("error"), [trigger]);
	const approval = useCallback(() => trigger("heavy"), [trigger]);
	const consensus = useCallback(() => trigger("medium"), [trigger]);
	const onSubmit = useCallback(() => approval(), [approval]);
	const onSave = useCallback(() => success(), [success]);
	const onImportComplete = useCallback(() => success(), [success]);

	return {
		success,
		warning,
		error,
		approval,
		consensus,
		onSubmit,
		onSave,
		onImportComplete,
	};
}
