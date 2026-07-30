import { createLayout as createLayoutFactory } from "../domain/layout-factory";
import type { WorkspaceLayout, CreateLayoutInput } from "../domain/layout";

/**
 * Create a new workspace layout.
 * Validates input and wraps the template-provided root with the layout envelope.
 */
export function createWorkspaceLayout(
	input: CreateLayoutInput,
): WorkspaceLayout {
	return createLayoutFactory(input);
}
