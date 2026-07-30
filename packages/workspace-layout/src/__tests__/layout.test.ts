import { describe, it, expect } from "vitest";
import { createLayout, updateLayout } from "../domain/layout-factory";
import { createViewLayoutNode, createSplitLayoutNode } from "../domain/node";
import { CURRENT_LAYOUT_SCHEMA_VERSION } from "../domain/layout";

function makeRoot() {
	return createSplitLayoutNode(
		"root",
		"horizontal",
		createViewLayoutNode("view-1"),
		createViewLayoutNode("view-2"),
		0.5,
	);
}

describe("createLayout", () => {
	it("should create a layout with all fields set and revision=1", () => {
		const layout = createLayout({
			workspaceId: "ws-1",
			ownerId: "owner-1",
			template: "portfolio-operations",
			root: makeRoot(),
		});

		expect(layout.schemaVersion).toBe(CURRENT_LAYOUT_SCHEMA_VERSION);
		expect(layout.revision).toBe(1);
		expect(layout.layoutId).toBeDefined();
		expect(typeof layout.layoutId).toBe("string");
		expect(layout.layoutId.length).toBeGreaterThan(0);
		expect(layout.workspaceId).toBe("ws-1");
		expect(layout.ownerId).toBe("owner-1");
		expect(layout.template).toBe("portfolio-operations");
		expect(layout.root).toBeDefined();
		expect(layout.createdAt).toBeDefined();
		expect(layout.updatedAt).toBeDefined();
	});

	it("should set schemaVersion to current", () => {
		const layout = createLayout({
			workspaceId: "ws-1",
			ownerId: "owner-1",
			template: "monthly-close",
			root: makeRoot(),
		});

		expect(layout.schemaVersion).toBe(CURRENT_LAYOUT_SCHEMA_VERSION);
	});

	it("should generate unique layoutIds", () => {
		const l1 = createLayout({
			workspaceId: "ws-1",
			ownerId: "owner-1",
			template: "monthly-close",
			root: makeRoot(),
		});
		const l2 = createLayout({
			workspaceId: "ws-1",
			ownerId: "owner-1",
			template: "monthly-close",
			root: makeRoot(),
		});

		expect(l1.layoutId).not.toBe(l2.layoutId);
	});

	it("should set createdAt and updatedAt to the same initial value", () => {
		const layout = createLayout({
			workspaceId: "ws-1",
			ownerId: "owner-1",
			template: "monthly-close",
			root: makeRoot(),
		});

		expect(layout.createdAt).toBe(layout.updatedAt);
	});
});

describe("updateLayout", () => {
	const base = createLayout({
		workspaceId: "ws-1",
		ownerId: "owner-1",
		template: "portfolio-operations",
		root: makeRoot(),
	});

	it("should increment revision", () => {
		const updated = updateLayout(base, {});
		expect(updated.revision).toBe(base.revision + 1);
	});

	it("should change updatedAt", () => {
		const updated = updateLayout(base, {});
		expect(updated.updatedAt).not.toBe(base.updatedAt);
	});

	it("should not mutate the original layout", () => {
		const originalRev = base.revision;
		updateLayout(base, {});
		expect(base.revision).toBe(originalRev);
	});

	it("should preserve layout identity", () => {
		const updated = updateLayout(base, {});
		expect(updated.layoutId).toBe(base.layoutId);
		expect(updated.workspaceId).toBe(base.workspaceId);
		expect(updated.ownerId).toBe(base.ownerId);
		expect(updated.template).toBe(base.template);
	});

	it("should update root when provided", () => {
		const newRoot = createSplitLayoutNode(
			"new-root",
			"vertical",
			createViewLayoutNode("v-a"),
			createViewLayoutNode("v-b"),
			0.3,
		);
		const updated = updateLayout(base, { root: newRoot });
		expect(updated.root).toBe(newRoot);
	});

	it("should update focusedViewId when provided", () => {
		const updated = updateLayout(base, { focusedViewId: "view-1" });
		expect(updated.focusedViewId).toBe("view-1");
	});

	it("should update activeWorkstreamId when provided", () => {
		const updated = updateLayout(base, { activeWorkstreamId: "stream-1" });
		expect(updated.activeWorkstreamId).toBe("stream-1");
	});

	it("should not change unprovided optional fields", () => {
		const withFocused = updateLayout(base, { focusedViewId: "x" });
		const nextUpdate = updateLayout(withFocused, {});
		expect(nextUpdate.focusedViewId).toBe("x");
	});

	it("should return a new reference", () => {
		const updated = updateLayout(base, {});
		expect(updated).not.toBe(base);
	});
});
