import { describe, it, expect } from "vitest";
import {
	createView,
	moveView,
	VIEW_KIND,
	type CreateViewInput,
	type LayoutPlacement,
} from "../view";

describe("createView", () => {
	const placement: LayoutPlacement = {
		row: 0,
		column: 0,
		width: 400,
		height: 600,
	};
	const validInput: CreateViewInput = {
		workspaceId: "ws-1",
		kind: VIEW_KIND.LEDGER,
		label: "General Ledger",
		placement,
		query: {},
	};

	it("should create a WorkspaceView with all required fields", () => {
		const view = createView(validInput);

		expect(view.viewId).toBeDefined();
		expect(typeof view.viewId).toBe("string");
		expect(view.viewId.length).toBeGreaterThan(0);
		expect(view.workspaceId).toBe("ws-1");
		expect(view.kind).toBe("ledger");
		expect(view.label).toBe("General Ledger");
		expect(view.placement).toEqual(placement);
		expect(view.query).toEqual({});
		expect(view.createdAt).toBeInstanceOf(Date);
	});

	it("should generate unique ViewIds", () => {
		const v1 = createView(validInput);
		const v2 = createView(validInput);
		expect(v1.viewId).not.toBe(v2.viewId);
	});

	it("should accept all view kinds", () => {
		const kinds = Object.values(VIEW_KIND).filter(
			(k): k is (typeof VIEW_KIND)[keyof typeof VIEW_KIND] =>
				typeof k === "string",
		);
		for (const kind of kinds) {
			const view = createView({ ...validInput, kind });
			expect(view.kind).toBe(kind);
		}
	});

	it("should accept a SavedFinancialQuery as query", () => {
		const query = { accountRange: { from: "1000", to: "1999" }, filters: {} };
		const view = createView({ ...validInput, query });
		expect(view.query).toEqual(query);
	});

	it("should reject empty label", () => {
		expect(() => createView({ ...validInput, label: "" })).toThrow(Error);
	});

	it("should reject empty workspaceId", () => {
		expect(() => createView({ ...validInput, workspaceId: "" })).toThrow(Error);
	});
});

describe("moveView", () => {
	const originalPlacement: LayoutPlacement = {
		row: 0,
		column: 0,
		width: 400,
		height: 600,
	};
	const newPlacement: LayoutPlacement = {
		row: 1,
		column: 2,
		width: 800,
		height: 400,
	};
	const baseView = createView({
		workspaceId: "ws-1",
		kind: VIEW_KIND.LEDGER,
		label: "General Ledger",
		placement: originalPlacement,
		query: {},
	});

	it("should move a view to a new placement", () => {
		const moved = moveView(baseView, newPlacement);
		expect(moved.placement).toEqual(newPlacement);
	});

	it("should not mutate the original view", () => {
		moveView(baseView, newPlacement);
		expect(baseView.placement).toEqual(originalPlacement);
	});

	it("should preserve view identity after move", () => {
		const moved = moveView(baseView, newPlacement);
		expect(moved.viewId).toBe(baseView.viewId);
		expect(moved.workspaceId).toBe(baseView.workspaceId);
		expect(moved.kind).toBe(baseView.kind);
		expect(moved.label).toBe(baseView.label);
		expect(moved.createdAt).toBe(baseView.createdAt);
	});

	it("should return a new view reference", () => {
		const moved = moveView(baseView, newPlacement);
		expect(moved).not.toBe(baseView);
	});
});
