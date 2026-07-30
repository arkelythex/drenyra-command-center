import { describe, it, expect } from "vitest";
import {
	createSplitLayoutNode,
	createTabGroupLayoutNode,
	createViewLayoutNode,
	getAllViewIds,
	type LayoutNode,
	type SplitLayoutNode,
	type TabGroupLayoutNode,
	type ViewLayoutNode,
} from "../domain/node";

describe("ViewLayoutNode", () => {
	it("should create a ViewLayoutNode with all fields set", () => {
		const node = createViewLayoutNode("view-1");
		expect(node.kind).toBe("view");
		expect(node.viewId).toBe("view-1");
	});

	it("should reject empty viewId", () => {
		expect(() => createViewLayoutNode("")).toThrow();
	});

	it("should reject whitespace-only viewId", () => {
		expect(() => createViewLayoutNode("   ")).toThrow();
	});
});

describe("SplitLayoutNode", () => {
	it("should create a valid SplitLayoutNode with all fields set", () => {
		const first = createViewLayoutNode("view-1");
		const second = createViewLayoutNode("view-2");
		const node = createSplitLayoutNode("s1", "horizontal", first, second, 0.5);

		expect(node.kind).toBe("split");
		expect(node.splitId).toBe("s1");
		expect(node.direction).toBe("horizontal");
		expect(node.first).toBe(first);
		expect(node.second).toBe(second);
		expect(node.ratio).toBe(0.5);
	});

	it("should create a vertical split", () => {
		const first = createViewLayoutNode("view-1");
		const second = createViewLayoutNode("view-2");
		const node = createSplitLayoutNode("s1", "vertical", first, second, 0.3);

		expect(node.direction).toBe("vertical");
	});

	it("should reject ratio below 0.1", () => {
		const first = createViewLayoutNode("view-1");
		const second = createViewLayoutNode("view-2");
		expect(() =>
			createSplitLayoutNode("s1", "horizontal", first, second, 0.05),
		).toThrow();
	});

	it("should reject ratio above 0.9", () => {
		const first = createViewLayoutNode("view-1");
		const second = createViewLayoutNode("view-2");
		expect(() =>
			createSplitLayoutNode("s1", "horizontal", first, second, 0.95),
		).toThrow();
	});

	it("should accept ratio at boundary 0.1", () => {
		const first = createViewLayoutNode("view-1");
		const second = createViewLayoutNode("view-2");
		const node = createSplitLayoutNode("s1", "horizontal", first, second, 0.1);
		expect(node.ratio).toBe(0.1);
	});

	it("should accept ratio at boundary 0.9", () => {
		const first = createViewLayoutNode("view-1");
		const second = createViewLayoutNode("view-2");
		const node = createSplitLayoutNode("s1", "horizontal", first, second, 0.9);
		expect(node.ratio).toBe(0.9);
	});
});

describe("TabGroupLayoutNode", () => {
	it("should create a TabGroupLayoutNode with 1 tab", () => {
		const tab = createViewLayoutNode("view-1");
		const node = createTabGroupLayoutNode("g1", [tab], 0);

		expect(node.kind).toBe("tab-group");
		expect(node.groupId).toBe("g1");
		expect(node.tabs).toHaveLength(1);
		expect(node.tabs[0]!.viewId).toBe("view-1");
		expect(node.activeTabIndex).toBe(0);
	});

	it("should create a TabGroupLayoutNode with multiple tabs", () => {
		const tabs = [
			createViewLayoutNode("view-1"),
			createViewLayoutNode("view-2"),
			createViewLayoutNode("view-3"),
		];
		const node = createTabGroupLayoutNode("g1", tabs, 1);

		expect(node.tabs).toHaveLength(3);
		expect(node.activeTabIndex).toBe(1);
	});

	it("should reject 0 tabs", () => {
		expect(() => createTabGroupLayoutNode("g1", [], 0)).toThrow();
	});

	it("should reject negative activeTabIndex", () => {
		const tab = createViewLayoutNode("view-1");
		expect(() => createTabGroupLayoutNode("g1", [tab], -1)).toThrow();
	});

	it("should reject activeTabIndex out of bounds", () => {
		const tab = createViewLayoutNode("view-1");
		expect(() => createTabGroupLayoutNode("g1", [tab], 1)).toThrow();
	});

	it("should reject activeTabIndex greater than tabs length", () => {
		const tabs = [
			createViewLayoutNode("view-1"),
			createViewLayoutNode("view-2"),
		];
		expect(() => createTabGroupLayoutNode("g1", tabs, 2)).toThrow();
	});
});

describe("getAllViewIds", () => {
	it("should collect viewIds from a flat split tree", () => {
		const first = createViewLayoutNode("view-1");
		const second = createViewLayoutNode("view-2");
		const root = createSplitLayoutNode("s1", "horizontal", first, second, 0.5);

		const ids = getAllViewIds(root);
		expect(ids).toEqual(["view-1", "view-2"]);
	});

	it("should collect viewIds from a nested tree", () => {
		const innerFirst = createViewLayoutNode("view-1");
		const innerSecond = createViewLayoutNode("view-2");
		const inner = createSplitLayoutNode(
			"s2",
			"vertical",
			innerFirst,
			innerSecond,
			0.3,
		);
		const outer = createSplitLayoutNode(
			"s1",
			"horizontal",
			inner,
			createViewLayoutNode("view-3"),
			0.4,
		);

		const ids = getAllViewIds(outer);
		expect(ids).toEqual(["view-1", "view-2", "view-3"]);
	});

	it("should collect viewIds from a tab group", () => {
		const tabs = [
			createViewLayoutNode("view-1"),
			createViewLayoutNode("view-2"),
		];
		const group = createTabGroupLayoutNode("g1", tabs, 0);

		const ids = getAllViewIds(group);
		expect(ids).toEqual(["view-1", "view-2"]);
	});
});

describe("LayoutNode type guards", () => {
	it("should distinguish node kinds at runtime", () => {
		const view = createViewLayoutNode("v1");
		const split = createSplitLayoutNode(
			"s1",
			"horizontal",
			createViewLayoutNode("a"),
			createViewLayoutNode("b"),
			0.5,
		);
		const group = createTabGroupLayoutNode(
			"g1",
			[createViewLayoutNode("x")],
			0,
		);

		expect(view.kind).toBe("view");
		expect(split.kind).toBe("split");
		expect(group.kind).toBe("tab-group");
	});
});
