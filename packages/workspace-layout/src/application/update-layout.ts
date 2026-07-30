import { updateLayout as updateLayoutFactory } from "../domain/layout-factory";
import type { WorkspaceLayout, UpdateLayoutInput } from "../domain/layout";

/**
 * Apply immutable updates to an existing layout.
 * Validates the resulting layout and increments revision.
 */
export function updateWorkspaceLayout(
	layout: WorkspaceLayout,
	updates: UpdateLayoutInput,
): WorkspaceLayout {
	return updateLayoutFactory(layout, updates);
}
