/**
 * Workbench Layout Utilities
 *
 * Pure functions for WorkspaceLayout serialization, deserialization,
 * merging, and validation. No framework dependencies.
 *
 * @module @drenyra/domain/workbench
 */

import type { WorkspaceLayout } from "./types";
import { DENSITY_MODE, validatePaneConfig } from "./types";

// ─── Serialization ─────────────────────────────────────────────────────────

/**
 * Serializes a WorkspaceLayout to a JSON string for localStorage persistence.
 */
export function serializeLayout(layout: WorkspaceLayout): string {
	return JSON.stringify(layout);
}

/**
 * Deserializes a JSON string back to a WorkspaceLayout.
 * Returns null if the string is not valid JSON or does not represent a valid layout.
 */
export function deserializeLayout(data: string): WorkspaceLayout | null {
	if (!data || data.trim().length === 0) return null;

	let parsed: unknown;
	try {
		parsed = JSON.parse(data);
	} catch {
		return null;
	}

	if (!isValidLayout(parsed)) return null;
	return parsed;
}

// ─── Merging ───────────────────────────────────────────────────────────────

/**
 * Merges a partial layout override into a base layout.
 * Panes from the override replace the base panes entirely (no deep merge).
 * Scalar fields (sidebarCollapsed, rightPanelOpen, densityMode) are overridden
 * only when present in the override.
 */
export function mergeLayouts(
	base: WorkspaceLayout,
	override: Partial<WorkspaceLayout>,
): WorkspaceLayout {
	return {
		panes: override.panes ?? base.panes,
		sidebarCollapsed: override.sidebarCollapsed ?? base.sidebarCollapsed,
		rightPanelOpen: override.rightPanelOpen ?? base.rightPanelOpen,
		densityMode: override.densityMode ?? base.densityMode,
	};
}

// ─── Type Guard ────────────────────────────────────────────────────────────

const VALID_DENSITY_MODES = new Set<string>(Object.values(DENSITY_MODE));

/**
 * Type guard: checks whether an unknown value is a valid WorkspaceLayout.
 *
 * Validates:
 * - Is an object (not null)
 * - Has `panes` array where each element passes `validatePaneConfig`
 * - `sidebarCollapsed` is boolean
 * - `rightPanelOpen` is boolean
 * - `densityMode` is a valid DensityMode
 */
export function isValidLayout(value: unknown): value is WorkspaceLayout {
	if (typeof value !== "object" || value === null) return false;

	const candidate = value as Record<string, unknown>;

	if (!Array.isArray(candidate["panes"])) return false;
	for (const pane of candidate["panes"]) {
		if (!validatePaneConfig(pane)) return false;
	}

	if (typeof candidate["sidebarCollapsed"] !== "boolean") return false;
	if (typeof candidate["rightPanelOpen"] !== "boolean") return false;
	if (!VALID_DENSITY_MODES.has(candidate["densityMode"] as string)) return false;

	return true;
}
