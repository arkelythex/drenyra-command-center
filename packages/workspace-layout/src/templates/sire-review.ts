import { createLayout } from "../domain/layout-factory";
import { createSplitLayoutNode, createViewLayoutNode } from "../domain/node";
import type { WorkspaceLayout } from "../domain/layout";

/**
 * SIRE Review layout:
 *
 * SplitLayout (horizontal, ratio: 0.33)
 * ├── View (RCE/RVIE differences)
 * ├── SplitLayout (horizontal, ratio: 0.5)
 * │   ├── View (local ledger)
 * │   └── View (evidence and impact)
 */
export function sireReviewLayout(
	workspaceId: string,
	ownerId: string,
): WorkspaceLayout {
	const differences = createViewLayoutNode("sire-differences");
	const localLedger = createViewLayoutNode("sire-local-ledger");
	const evidence = createViewLayoutNode("sire-evidence-impact");

	// SIRE Review uses a 3-way horizontal split: differences | (ledger | evidence)
	// But our SplitLayoutNode only supports binary splits, so we nest:
	// root split (0.33): differences | right
	// right split (0.5): local-ledger | evidence-impact
	const rightPanel = createSplitLayoutNode(
		"right-panel",
		"horizontal",
		localLedger,
		evidence,
		0.5,
	);

	const root = createSplitLayoutNode(
		"root",
		"horizontal",
		differences,
		rightPanel,
		0.33,
	);

	return createLayout({
		workspaceId,
		ownerId,
		template: "sire-review",
		root,
	});
}
