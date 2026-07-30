import { createLayout } from "../domain/layout-factory";
import { createSplitLayoutNode, createViewLayoutNode } from "../domain/node";
import type { WorkspaceLayout } from "../domain/layout";

/**
 * Monthly Close layout:
 *
 * SplitLayout (horizontal, ratio: 0.2)
 * ├── View (close checklist)
 * └── SplitLayout (horizontal, ratio: 0.5)
 *     ├── View (reconciliation/ledger)
 *     └── View (evidence/status)
 */
export function monthlyCloseLayout(
	workspaceId: string,
	ownerId: string,
): WorkspaceLayout {
	const checklist = createViewLayoutNode("monthly-close-checklist");
	const reconciliation = createViewLayoutNode("monthly-close-reconciliation");
	const evidence = createViewLayoutNode("monthly-close-evidence");

	const rightPanel = createSplitLayoutNode(
		"right-panel",
		"horizontal",
		reconciliation,
		evidence,
		0.5,
	);

	const root = createSplitLayoutNode(
		"root",
		"horizontal",
		checklist,
		rightPanel,
		0.2,
	);

	return createLayout({
		workspaceId,
		ownerId,
		template: "monthly-close",
		root,
	});
}
