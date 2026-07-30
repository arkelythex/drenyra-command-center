import { describe, it, expect } from "vitest";
import { restoreLayoutCheck } from "../application/restore-layout";
import { createLayout } from "../domain/layout-factory";
import { createSplitLayoutNode, createViewLayoutNode } from "../domain/node";

function makeValidLayout() {
	return createLayout({
		workspaceId: "ws-1",
		ownerId: "owner-1",
		template: "monthly-close",
		root: createSplitLayoutNode(
			"root",
			"horizontal",
			createViewLayoutNode("v1"),
			createViewLayoutNode("v2"),
			0.5,
		),
	});
}

describe("restoreLayoutCheck", () => {
	it("should return valid=true with no warnings for a valid layout", () => {
		const layout = makeValidLayout();
		const result = restoreLayoutCheck(layout);
		expect(result.valid).toBe(true);
		expect(result.warnings).toHaveLength(0);
	});

	it("should warn on unknown template", () => {
		const layout = createLayout({
			workspaceId: "ws-1",
			ownerId: "owner-1",
			template: "unknown-template" as never,
			root: createViewLayoutNode("v1"),
		});

		const result = restoreLayoutCheck(layout);
		expect(result.warnings.some((w) => w.kind === "unknown-template")).toBe(
			true,
		);
	});

	it("should warn on duplicate viewIds", () => {
		// Create a layout where we directly construct a tree with duplicates
		const layout = createLayout({
			workspaceId: "ws-1",
			ownerId: "owner-1",
			template: "monthly-close",
			root: createSplitLayoutNode(
				"root",
				"horizontal",
				createViewLayoutNode("same-id"),
				createViewLayoutNode("same-id"),
				0.5,
			),
		});

		const result = restoreLayoutCheck(layout);
		expect(result.warnings.some((w) => w.kind === "duplicate-view")).toBe(true);
	});

	it("should warn on corrupt ratio", () => {
		const layout = {
			...makeValidLayout(),
			root: {
				kind: "split" as const,
				splitId: "bad-root",
				direction: "horizontal" as const,
				first: createViewLayoutNode("v1"),
				second: createViewLayoutNode("v2"),
				ratio: 0.05,
			},
		};

		const result = restoreLayoutCheck(layout);
		expect(result.warnings.some((w) => w.kind === "corrupt-ratio")).toBe(true);
	});

	it("should detect corrupt ratio in nested splits", () => {
		const layout = {
			...makeValidLayout(),
			root: {
				kind: "split" as const,
				splitId: "root",
				direction: "horizontal" as const,
				first: {
					kind: "split" as const,
					splitId: "inner",
					direction: "vertical" as const,
					first: createViewLayoutNode("v1"),
					second: createViewLayoutNode("v2"),
					ratio: 0.95, // valid boundary but let's use 0.99
				},
				second: createViewLayoutNode("v3"),
				ratio: 0.5,
			},
		};

		// Fix: 0.95 is valid. Use out-of-range.
		const badLayout = {
			...layout,
			root: {
				...layout.root,
				first: {
					...(layout.root.first as Record<string, unknown>),
					ratio: 0.99,
				},
			},
		};

		const result = restoreLayoutCheck(badLayout as never);
		expect(result.warnings.some((w) => w.kind === "corrupt-ratio")).toBe(true);
	});

	it("should handle empty tree gracefully", () => {
		const layout = {
			...makeValidLayout(),
			root: createViewLayoutNode("only-view"),
		};

		const result = restoreLayoutCheck(layout);
		// A single view with no violations is valid
		expect(result.valid).toBe(true);
	});
});
