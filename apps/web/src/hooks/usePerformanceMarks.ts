import { useEffect } from "react";

/**
 * Performance mark names used across the Workbench.
 * Measure with performance.mark() / performance.measure().
 */
export const PERF_MARKS = {
	COMMAND_PALETTE_OPEN: "wb:command-palette-open",
	LAYOUT_RESTORE: "wb:layout-restore",
	WORKSPACE_SWITCH: "wb:workspace-switch",
	SIDEBAR_TOGGLE: "wb:sidebar-toggle",
	DENSITY_SWITCH: "wb:density-switch",
} as const;

/**
 * Mark the start of an operation.
 */
export function markStart(name: string): void {
	if (typeof performance === "undefined" || !performance.mark) return;
	performance.mark(`${name}:start`);
}

/**
 * Mark the end of an operation and measure the duration.
 * Logs to console if performance budget is exceeded.
 */
export function markEnd(name: string, budgetMs?: number): void {
	if (typeof performance === "undefined" || !performance.mark) return;
	performance.mark(`${name}:end`);
	performance.measure(name, `${name}:start`, `${name}:end`);

	if (budgetMs !== undefined) {
		const entries = performance.getEntriesByName(name);
		const last = entries[entries.length - 1];
		if (last && last.duration > budgetMs) {
			console.warn(
				`[Performance] ${name} exceeded budget: ${last.duration.toFixed(1)}ms > ${budgetMs}ms`,
			);
		}
	}
}

/**
 * usePerformanceMarks — instruments key UX interactions.
 * Places performance marks around workspace switches, layout restores, etc.
 */
export function usePerformanceMarks() {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Command palette open time
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				markStart(PERF_MARKS.COMMAND_PALETTE_OPEN);
				// End will be measured when the palette opens
				requestAnimationFrame(() => {
					markEnd(PERF_MARKS.COMMAND_PALETTE_OPEN, 100);
				});
			}
		};

		document.addEventListener("keydown", handleKeyDown);

		// Layout restore timing
		if (document.readyState === "complete") {
			markStart(PERF_MARKS.LAYOUT_RESTORE);
			requestAnimationFrame(() => {
				markEnd(PERF_MARKS.LAYOUT_RESTORE, 300);
			});
		}

		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);
}
