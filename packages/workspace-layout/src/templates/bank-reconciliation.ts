import { createLayout } from "../domain/layout-factory";
import { createSplitLayoutNode, createViewLayoutNode } from "../domain/node";
import type { WorkspaceLayout } from "../domain/layout";

/**
 * Bank Reconciliation layout:
 *
 * SplitLayout (horizontal, ratio: 0.33)
 * ├── View (bank movements)
 * ├── View (candidate matches)
 * └── View (accounting impact)
 *
 * Since SplitLayoutNode is binary, the 3-way split is encoded as:
 * root (0.33): movements | right
 * right (0.5): matches | impact
 */
export function bankReconciliationLayout(
	workspaceId: string,
	ownerId: string,
): WorkspaceLayout {
	const movements = createViewLayoutNode("bank-movements");
	const matches = createViewLayoutNode("bank-candidate-matches");
	const impact = createViewLayoutNode("bank-accounting-impact");

	const rightPanel = createSplitLayoutNode(
		"right-panel",
		"horizontal",
		matches,
		impact,
		0.5,
	);

	const root = createSplitLayoutNode(
		"root",
		"horizontal",
		movements,
		rightPanel,
		0.33,
	);

	return createLayout({
		workspaceId,
		ownerId,
		template: "bank-reconciliation",
		root,
	});
}
