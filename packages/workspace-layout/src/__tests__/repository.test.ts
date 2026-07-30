import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryLayoutRepository } from "../adapters/memory-layout-repository";
import { createLayout } from "../domain/layout-factory";
import { createSplitLayoutNode, createViewLayoutNode } from "../domain/node";
import type { LayoutRepository } from "../ports/layout-repository";

function makeLayout(workspaceId: string) {
	return createLayout({
		workspaceId,
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

describe("InMemoryLayoutRepository", () => {
	let repo: LayoutRepository;

	beforeEach(() => {
		repo = new InMemoryLayoutRepository();
	});

	describe("load", () => {
		it("should return null for non-existent layout", async () => {
			const result = await repo.load("no-such-id");
			expect(result).toBeNull();
		});
	});

	describe("save and load", () => {
		it("should save and load the same layout", async () => {
			const layout = makeLayout("ws-1");
			const result = await repo.save(layout, 0);
			expect(result.kind).toBe("saved");

			const loaded = await repo.load(layout.layoutId);
			expect(loaded).not.toBeNull();
			expect(loaded!.layoutId).toBe(layout.layoutId);
			expect(loaded!.workspaceId).toBe("ws-1");
		});

		it("should save with correct revision", async () => {
			const layout = makeLayout("ws-1");
			const result = await repo.save(layout, 0);
			expect(result.kind).toBe("saved");
			if (result.kind === "saved") {
				expect(result.revision).toBe(1);
			}
		});

		it("should return conflict when revision mismatch on update", async () => {
			const layout = makeLayout("ws-1");
			await repo.save(layout, 0);

			// Try saving with expectedRevision that doesn't match stored revision
			const result = await repo.save(layout, 999);

			expect(result.kind).toBe("conflict");
			if (result.kind === "conflict") {
				expect(result.current.layoutId).toBe(layout.layoutId);
			}
		});

		it("should return conflict with current layout", async () => {
			const layout = makeLayout("ws-1");
			await repo.save(layout, 0);

			const result = await repo.save(layout, 999);

			expect(result.kind).toBe("conflict");
			if (result.kind === "conflict") {
				expect(result.current).toBeDefined();
				expect(result.current.layoutId).toBe(layout.layoutId);
			}
		});
	});

	describe("loadByWorkspace", () => {
		it("should return null for unknown workspace", async () => {
			const result = await repo.loadByWorkspace("unknown-ws");
			expect(result).toBeNull();
		});

		it("should return saved layout by workspaceId", async () => {
			const layout = makeLayout("ws-1");
			await repo.save(layout, 0);

			const loaded = await repo.loadByWorkspace("ws-1");
			expect(loaded).not.toBeNull();
			expect(loaded!.workspaceId).toBe("ws-1");
		});
	});

	describe("multiple layouts", () => {
		it("should isolate multiple layouts", async () => {
			const l1 = makeLayout("ws-1");
			const l2 = makeLayout("ws-2");

			await repo.save(l1, 0);
			await repo.save(l2, 0);

			const loaded1 = await repo.load(l1.layoutId);
			const loaded2 = await repo.load(l2.layoutId);

			expect(loaded1!.workspaceId).toBe("ws-1");
			expect(loaded2!.workspaceId).toBe("ws-2");
			expect(loaded1!.layoutId).not.toBe(loaded2!.layoutId);
		});
	});

	describe("delete", () => {
		it("should delete a saved layout", async () => {
			const layout = makeLayout("ws-1");
			await repo.save(layout, 0);

			await repo.delete(layout.layoutId);

			const loaded = await repo.load(layout.layoutId);
			expect(loaded).toBeNull();
		});

		it("should not throw when deleting non-existent layout", async () => {
			await expect(repo.delete("no-such-id")).resolves.toBeUndefined();
		});

		it("should also remove from workspace index on delete", async () => {
			const layout = makeLayout("ws-1");
			await repo.save(layout, 0);
			await repo.delete(layout.layoutId);

			const byWorkspace = await repo.loadByWorkspace("ws-1");
			expect(byWorkspace).toBeNull();
		});
	});
});
