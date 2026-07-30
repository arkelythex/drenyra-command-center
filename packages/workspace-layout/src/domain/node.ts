import { LayoutValidationError } from "./errors";

// ─── Layout Node Types ──────────────────────────────────────────────────────

export type LayoutNode = SplitLayoutNode | TabGroupLayoutNode | ViewLayoutNode;

// ─── Split Direction ────────────────────────────────────────────────────────

export type SplitDirection = "horizontal" | "vertical";

// ─── SplitLayoutNode ────────────────────────────────────────────────────────

export interface SplitLayoutNode {
	readonly kind: "split";
	readonly splitId: string;
	readonly direction: SplitDirection;
	readonly first: LayoutNode;
	readonly second: LayoutNode;
	readonly ratio: number;
}

// ─── TabGroupLayoutNode ─────────────────────────────────────────────────────

export interface TabGroupLayoutNode {
	readonly kind: "tab-group";
	readonly groupId: string;
	readonly tabs: readonly ViewLayoutNode[];
	readonly activeTabIndex: number;
}

// ─── ViewLayoutNode ─────────────────────────────────────────────────────────

export interface ViewLayoutNode {
	readonly kind: "view";
	readonly viewId: string;
}

// ─── Ratio Bounds ───────────────────────────────────────────────────────────

const MIN_RATIO = 0.1;
const MAX_RATIO = 0.9;

function validateRatio(ratio: number): void {
	if (ratio < MIN_RATIO || ratio > MAX_RATIO) {
		throw new LayoutValidationError(
			`Ratio must be between ${MIN_RATIO} and ${MAX_RATIO}, got ${ratio}`,
		);
	}
}

function validateNonEmpty(value: string, field: string): void {
	if (!value || value.trim().length === 0) {
		throw new LayoutValidationError(`${field} must not be empty`);
	}
}

// ─── Factories ──────────────────────────────────────────────────────────────

export function createViewLayoutNode(viewId: string): ViewLayoutNode {
	validateNonEmpty(viewId, "viewId");
	return {
		kind: "view",
		viewId,
	};
}

export function createSplitLayoutNode(
	splitId: string,
	direction: SplitDirection,
	first: LayoutNode,
	second: LayoutNode,
	ratio: number,
): SplitLayoutNode {
	validateNonEmpty(splitId, "splitId");
	validateRatio(ratio);
	return {
		kind: "split",
		splitId,
		direction,
		first,
		second,
		ratio,
	};
}

export function createTabGroupLayoutNode(
	groupId: string,
	tabs: readonly ViewLayoutNode[],
	activeTabIndex: number,
): TabGroupLayoutNode {
	validateNonEmpty(groupId, "groupId");

	if (tabs.length === 0) {
		throw new LayoutValidationError("TabGroup must have at least 1 tab");
	}

	if (activeTabIndex < 0 || activeTabIndex >= tabs.length) {
		throw new LayoutValidationError(
			`activeTabIndex ${activeTabIndex} is out of bounds for ${tabs.length} tabs`,
		);
	}

	return {
		kind: "tab-group",
		groupId,
		tabs,
		activeTabIndex,
	};
}

// ─── Queries ────────────────────────────────────────────────────────────────

export function getAllViewIds(node: LayoutNode): string[] {
	const ids: string[] = [];

	function collect(n: LayoutNode): void {
		switch (n.kind) {
			case "view":
				ids.push(n.viewId);
				break;
			case "split":
				collect(n.first);
				collect(n.second);
				break;
			case "tab-group":
				for (const tab of n.tabs) {
					ids.push(tab.viewId);
				}
				break;
		}
	}

	collect(node);
	return ids;
}
