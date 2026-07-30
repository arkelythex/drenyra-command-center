import { createLayout } from "../domain/layout-factory";
import { createSplitLayoutNode, createViewLayoutNode } from "../domain/node";
import type { WorkspaceLayout } from "../domain/layout";

/**
 * Evidence Audit layout:
 *
 * SplitLayout (horizontal, ratio: 0.25)
 * ├── View (evidence explorer)
 * ├── View (document viewer)
 * └── View (provenance/policy)
 *
 * Since SplitLayoutNode is binary, the 3-way split is encoded as:
 * root (0.25): explorer | right
 * right (0.5): viewer | provenance
 */
export function evidenceAuditLayout(
	workspaceId: string,
	ownerId: string,
): WorkspaceLayout {
	const explorer = createViewLayoutNode("evidence-explorer");
	const viewer = createViewLayoutNode("evidence-document-viewer");
	const provenance = createViewLayoutNode("evidence-provenance-policy");

	const rightPanel = createSplitLayoutNode(
		"right-panel",
		"horizontal",
		viewer,
		provenance,
		0.5,
	);

	const root = createSplitLayoutNode(
		"root",
		"horizontal",
		explorer,
		rightPanel,
		0.25,
	);

	return createLayout({
		workspaceId,
		ownerId,
		template: "evidence-audit",
		root,
	});
}
