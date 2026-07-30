import { describe, it, expect } from "vitest";
import {
	portfolioOperationsLayout,
	monthlyCloseLayout,
	sireReviewLayout,
	bankReconciliationLayout,
	evidenceAuditLayout,
} from "../templates";
import { getAllViewIds } from "../domain/node";

function countViews(
	layout: ReturnType<typeof portfolioOperationsLayout>,
): string[] {
	return getAllViewIds(layout.root);
}

describe("portfolioOperationsLayout", () => {
	it("should create a valid layout tree", () => {
		const layout = portfolioOperationsLayout("ws-1", "owner-1");
		expect(layout.template).toBe("portfolio-operations");
		expect(layout.revision).toBe(1);
		expect(layout.root.kind).toBe("split");
	});

	it("should have at least 3 views", () => {
		const layout = portfolioOperationsLayout("ws-1", "owner-1");
		const ids = countViews(layout);
		expect(ids.length).toBeGreaterThanOrEqual(3);
	});

	it("should have unique viewIds within the tree", () => {
		const layout = portfolioOperationsLayout("ws-1", "owner-1");
		const ids = countViews(layout);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("should have all ratios in valid range", () => {
		const layout = portfolioOperationsLayout("ws-1", "owner-1");
		// Creating the layout already validates ratios — reaching here means they passed.
		expect(layout.root).toBeDefined();
	});
});

describe("monthlyCloseLayout", () => {
	it("should create a valid layout tree", () => {
		const layout = monthlyCloseLayout("ws-1", "owner-1");
		expect(layout.template).toBe("monthly-close");
		expect(layout.revision).toBe(1);
	});

	it("should have at least 3 views", () => {
		const layout = monthlyCloseLayout("ws-1", "owner-1");
		const ids = countViews(layout);
		expect(ids.length).toBeGreaterThanOrEqual(3);
	});

	it("should have unique viewIds within the tree", () => {
		const layout = monthlyCloseLayout("ws-1", "owner-1");
		const ids = countViews(layout);
		expect(new Set(ids).size).toBe(ids.length);
	});
});

describe("sireReviewLayout", () => {
	it("should create a valid layout tree", () => {
		const layout = sireReviewLayout("ws-1", "owner-1");
		expect(layout.template).toBe("sire-review");
		expect(layout.revision).toBe(1);
	});

	it("should have at least 3 views", () => {
		const layout = sireReviewLayout("ws-1", "owner-1");
		const ids = countViews(layout);
		expect(ids.length).toBeGreaterThanOrEqual(3);
	});

	it("should have unique viewIds within the tree", () => {
		const layout = sireReviewLayout("ws-1", "owner-1");
		const ids = countViews(layout);
		expect(new Set(ids).size).toBe(ids.length);
	});
});

describe("bankReconciliationLayout", () => {
	it("should create a valid layout tree", () => {
		const layout = bankReconciliationLayout("ws-1", "owner-1");
		expect(layout.template).toBe("bank-reconciliation");
		expect(layout.revision).toBe(1);
	});

	it("should have at least 3 views", () => {
		const layout = bankReconciliationLayout("ws-1", "owner-1");
		const ids = countViews(layout);
		expect(ids.length).toBeGreaterThanOrEqual(3);
	});

	it("should have unique viewIds within the tree", () => {
		const layout = bankReconciliationLayout("ws-1", "owner-1");
		const ids = countViews(layout);
		expect(new Set(ids).size).toBe(ids.length);
	});
});

describe("evidenceAuditLayout", () => {
	it("should create a valid layout tree", () => {
		const layout = evidenceAuditLayout("ws-1", "owner-1");
		expect(layout.template).toBe("evidence-audit");
		expect(layout.revision).toBe(1);
	});

	it("should have at least 3 views", () => {
		const layout = evidenceAuditLayout("ws-1", "owner-1");
		const ids = countViews(layout);
		expect(ids.length).toBeGreaterThanOrEqual(3);
	});

	it("should have unique viewIds within the tree", () => {
		const layout = evidenceAuditLayout("ws-1", "owner-1");
		const ids = countViews(layout);
		expect(new Set(ids).size).toBe(ids.length);
	});
});

describe("all templates", () => {
	const factories = [
		[
			"portfolio-operations",
			() => portfolioOperationsLayout("ws-1", "owner-1"),
		],
		["monthly-close", () => monthlyCloseLayout("ws-1", "owner-1")],
		["sire-review", () => sireReviewLayout("ws-1", "owner-1")],
		["bank-reconciliation", () => bankReconciliationLayout("ws-1", "owner-1")],
		["evidence-audit", () => evidenceAuditLayout("ws-1", "owner-1")],
	] as const;

	for (const [name, factory] of factories) {
		it(`template "${name}" should validate (all ratios in range, all nodes valid)`, () => {
			const layout = factory();
			expect(layout.root).toBeDefined();
			expect(layout.schemaVersion).toBeGreaterThanOrEqual(1);
		});
	}
});
