import { createLayout } from "../domain/layout-factory";
import {
	createSplitLayoutNode,
	createTabGroupLayoutNode,
	createViewLayoutNode,
} from "../domain/node";
import type { WorkspaceLayout } from "../domain/layout";

/**
 * Portfolio Operations layout:
 *
 * SplitLayout (horizontal, ratio: 0.25)
 * ├── TabGroup (left panel)
 * │   └── View (companies list)
 * └── SplitLayout (vertical, ratio: 0.6)
 *     ├── SplitLayout (horizontal, ratio: 0.5)
 *     │   ├── View (portfolio workspace / attention)
 *     │   └── View (inspector / detail)
 *     └── View (activity feed)
 */
export function portfolioOperationsLayout(
	workspaceId: string,
	ownerId: string,
): WorkspaceLayout {
	const companiesList = createViewLayoutNode("portfolio-companies-list");
	const leftPanel = createTabGroupLayoutNode("left-panel", [companiesList], 0);

	const portfolioView = createViewLayoutNode("portfolio-attention");
	const inspectorView = createViewLayoutNode("portfolio-inspector");
	const topRight = createSplitLayoutNode(
		"top-right",
		"horizontal",
		portfolioView,
		inspectorView,
		0.5,
	);

	const activityFeed = createViewLayoutNode("portfolio-activity-feed");
	const rightColumn = createSplitLayoutNode(
		"right-column",
		"vertical",
		topRight,
		activityFeed,
		0.6,
	);

	const root = createSplitLayoutNode(
		"root",
		"horizontal",
		leftPanel,
		rightColumn,
		0.25,
	);

	return createLayout({
		workspaceId,
		ownerId,
		template: "portfolio-operations",
		root,
	});
}
