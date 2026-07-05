/**
 * ROI Engine — API integration tests
 *
 * @group integration
 */

import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { roiRoutes } from "../api/routes";

function createTestApp() {
	return new Elysia().use(roiRoutes);
}

// ── Shared test helpers ────────────────────────────────────────────

async function post(app: Elysia, path: string, body: unknown) {
	return app.handle(
		new Request(`http://test.com/api/fiscal/roi${path}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		}),
	);
}

// ── /calculate ─────────────────────────────────────────────────────

describe("POST /api/fiscal/roi/calculate", () => {
	it("should calculate ROI with profit", async () => {
		const app = createTestApp();
		const res = await post(app, "/calculate", {
			investment: { amount: 1000, currency: "PEN" },
			currentValue: { amount: 1500, currency: "PEN" },
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.roiPercentage).toBe(50);
		expect(body.interpretation).toBeTruthy();
	});

	it("should calculate ROI with loss", async () => {
		const app = createTestApp();
		const res = await post(app, "/calculate", {
			investment: { amount: 1000, currency: "PEN" },
			currentValue: { amount: 500, currency: "PEN" },
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.roiPercentage).toBeLessThan(0);
	});

	it("should reject invalid input", async () => {
		const app = createTestApp();
		const res = await post(app, "/calculate", {
			investment: { amount: -1, currency: "PEN" },
			currentValue: { amount: 100, currency: "PEN" },
		});
		expect(res.status).toBe(422);
	});

	it("should reject GET method", async () => {
		const app = createTestApp();
		const res = await app.handle(
			new Request("http://test.com/api/fiscal/roi/calculate"),
		);
		expect(res.status).toBe(404);
	});
});

// ── /payback ───────────────────────────────────────────────────────

describe("POST /api/fiscal/roi/payback", () => {
	it("should calculate payback period", async () => {
		const app = createTestApp();
		const res = await post(app, "/payback", {
			initialInvestment: { amount: 120000, currency: "PEN" },
			annualCashFlow: { amount: 40000, currency: "PEN" },
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.months).toBe(36);
		expect(body.isInfinite).toBe(false);
	});

	it("should return infinite for zero cash flow", async () => {
		const app = createTestApp();
		const res = await post(app, "/payback", {
			initialInvestment: { amount: 10000, currency: "PEN" },
			annualCashFlow: { amount: 0, currency: "PEN" },
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.isInfinite).toBe(true);
	});

	it("should reject invalid input", async () => {
		const app = createTestApp();
		const res = await post(app, "/payback", {
			initialInvestment: "invalid",
			annualCashFlow: { amount: 0, currency: "PEN" },
		});
		expect(res.status).toBe(422);
	});
});

// ── /npv ───────────────────────────────────────────────────────────

describe("POST /api/fiscal/roi/npv", () => {
	it("should calculate NPV for profitable investment", async () => {
		const app = createTestApp();
		const res = await post(app, "/npv", {
			initialInvestment: { amount: 100000, currency: "PEN" },
			cashFlows: [
				{ amount: 45000, currency: "PEN" },
				{ amount: 45000, currency: "PEN" },
				{ amount: 45000, currency: "PEN" },
			],
			discountRate: 10,
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.isViable).toBe(true);
		expect(body.npvCents).toBeGreaterThan(0);
	});

	it("should calculate negative NPV", async () => {
		const app = createTestApp();
		const res = await post(app, "/npv", {
			initialInvestment: { amount: 100000, currency: "PEN" },
			cashFlows: [
				{ amount: 10000, currency: "PEN" },
				{ amount: 10000, currency: "PEN" },
				{ amount: 10000, currency: "PEN" },
			],
			discountRate: 10,
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.isViable).toBe(false);
		expect(body.npvCents).toBeLessThan(0);
	});

	it("should reject empty cash flows", async () => {
		const app = createTestApp();
		const res = await post(app, "/npv", {
			initialInvestment: { amount: 1000, currency: "PEN" },
			cashFlows: [],
			discountRate: 10,
		});
		expect(res.status).toBe(422);
	});
});

// ── /irr ───────────────────────────────────────────────────────────

describe("POST /api/fiscal/roi/irr", () => {
	it("should calculate IRR", async () => {
		const app = createTestApp();
		const res = await post(app, "/irr", {
			initialInvestment: { amount: 100000, currency: "PEN" },
			cashFlows: [
				{ amount: 40000, currency: "PEN" },
				{ amount: 40000, currency: "PEN" },
				{ amount: 40000, currency: "PEN" },
			],
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(typeof body.irr).toBe("number");
		expect(typeof body.converged).toBe("boolean");
	});

	it("should reject empty cash flows", async () => {
		const app = createTestApp();
		const res = await post(app, "/irr", {
			initialInvestment: { amount: 1000, currency: "PEN" },
			cashFlows: [],
		});
		expect(res.status).toBe(422);
	});
});

// ── /scenario ──────────────────────────────────────────────────────

describe("POST /api/fiscal/roi/scenario", () => {
	it("should compare multiple scenarios", async () => {
		const app = createTestApp();
		const res = await post(app, "/scenario", {
			scenarios: [
				{
					name: "Conservative",
					investment: { amount: 50000, currency: "PEN" },
					annualCashFlow: { amount: 15000, currency: "PEN" },
					projectDurationYears: 5,
					discountRate: 15,
				},
				{
					name: "Aggressive",
					investment: { amount: 100000, currency: "PEN" },
					annualCashFlow: { amount: 35000, currency: "PEN" },
					projectDurationYears: 5,
					discountRate: 15,
				},
			],
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.scenarios).toHaveLength(2);
		expect(body.recommended).toBeTruthy();
	});

	it("should reject single scenario", async () => {
		const app = createTestApp();
		const res = await post(app, "/scenario", {
			scenarios: [
				{
					name: "Only",
					investment: { amount: 50000, currency: "PEN" },
					annualCashFlow: { amount: 15000, currency: "PEN" },
					projectDurationYears: 5,
					discountRate: 15,
				},
			],
		});
		expect(res.status).toBe(422);
	});

	it("should recommend the best scenario", async () => {
		const app = createTestApp();
		const res = await post(app, "/scenario", {
			scenarios: [
				{
					name: "Good",
					investment: { amount: 50000, currency: "PEN" },
					annualCashFlow: { amount: 50000, currency: "PEN" },
					projectDurationYears: 3,
					discountRate: 10,
				},
				{
					name: "Bad",
					investment: { amount: 100000, currency: "PEN" },
					annualCashFlow: { amount: 1000, currency: "PEN" },
					projectDurationYears: 5,
					discountRate: 10,
				},
			],
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.recommended).toBe("Good");
	});
});
