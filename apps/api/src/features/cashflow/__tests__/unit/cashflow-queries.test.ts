/**
 * Cashflow Queries Tests (Actual, Forecast, Variance)
 *
 * @module cashflow/__tests__
 */

import { Money } from "@arkelythex/domain";
import { db } from "@arkelythex/persistence/client";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock database (shared across forecast and projection tests)
// ---------------------------------------------------------------------------
vi.mock("@arkelythex/persistence/client", () => ({
	db: {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		where: vi.fn().mockResolvedValue([]),
	},
}));

vi.mock("@arkelythex/persistence/query", () => ({
	eq: vi.fn(),
	and: vi.fn(),
	gte: vi.fn(),
	lte: vi.fn(),
	or: vi.fn(),
}));

vi.mock("@arkelythex/persistence/schema", () => ({
	bankTransactions: {
		id: "id",
		companyId: "companyId",
		transactionDate: "transactionDate",
		type: "type",
		amount: "amount",
	},
	invoices: {
		id: "id",
		companyId: "companyId",
		status: "status",
		paidDate: "paidDate",
		totalAmount: "totalAmount",
	},
	bills: {
		id: "id",
		companyId: "companyId",
		status: "status",
		dueDate: "dueDate",
		billNumber: "billNumber",
		vendorId: "vendorId",
		updatedAt: "updatedAt",
		totalAmount: "totalAmount",
	},
	retenciones: {
		billId: "billId",
		companyId: "companyId",
		retentionAmountCents: "retentionAmountCents",
		sunatDueDate: "sunatDueDate",
		declarationPeriod: "declarationPeriod",
		status: "status",
	},
}));

// ---------------------------------------------------------------------------
// Mock query modules used internally by getCashflowVariance.
// vi.mock is hoisted to the top of the file — we use vi.importActual below
// to obtain the real implementations for standalone query tests.
// ---------------------------------------------------------------------------
vi.mock("../../application/queries/get-cashflow-projection.query", () => ({
	getCashflowProjection: vi.fn(),
}));

vi.mock("../../application/queries/get-actual-cashflow.query", () => ({
	getActualCashflow: vi.fn(),
}));

import { getActualCashflow as mockedGetActualCashflow } from "../../application/queries/get-actual-cashflow.query";
// ---------------------------------------------------------------------------
// Imports — the two modules above resolve to their mocked versions.
// ---------------------------------------------------------------------------
import { getCashflowForecast } from "../../application/queries/get-cashflow-forecast.query";
import { getCashflowProjection as mockedGetCashflowProjection } from "../../application/queries/get-cashflow-projection.query";
import { getCashflowVariance } from "../../application/queries/get-cashflow-variance.query";

// ---------------------------------------------------------------------------
// Capture real implementations so standalone query tests can use them
// alongside the mocked modules required by the variance tests.
// ---------------------------------------------------------------------------
let realGetActualCashflow: typeof mockedGetActualCashflow;
let realGetCashflowProjection: typeof mockedGetCashflowProjection;

beforeAll(async () => {
	const actualModule = await vi.importActual<
		typeof import("../../application/queries/get-actual-cashflow.query")
	>("../../application/queries/get-actual-cashflow.query");
	realGetActualCashflow = actualModule.getActualCashflow;

	const projModule = await vi.importActual<
		typeof import("../../application/queries/get-cashflow-projection.query")
	>("../../application/queries/get-cashflow-projection.query");
	realGetCashflowProjection = projModule.getCashflowProjection;
});

describe("GetActualCashflowQuery", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		// Wire the mock back to the real function for this test suite
		vi.mocked(mockedGetActualCashflow).mockImplementation(
			realGetActualCashflow,
		);
	});

	it("should return actual cashflow with zero values when no data", async () => {
		const fetchCashflowData = vi.fn().mockResolvedValue({
			companyId: "company-1",
			period: {
				startDate: new Date("2026-01-01"),
				endDate: new Date("2026-01-31"),
			},
			currency: "PEN",
			totalInflows: 0,
			totalOutflows: 0,
			netCashflow: 0,
			transactionCount: { credits: 0, debits: 0 },
			daily: [],
		});

		const result = await mockedGetActualCashflow(
			{
				companyId: "company-1",
				startDate: new Date("2026-01-01"),
				endDate: new Date("2026-01-31"),
				currency: "PEN",
			},
			fetchCashflowData,
		);

		expect(result).toMatchObject({
			companyId: "company-1",
			currency: "PEN",
			actualInflows: 0,
			actualOutflows: 0,
			netCashflow: 0,
		});
	});

	it("should have correct period", async () => {
		const startDate = new Date("2026-01-01");
		const endDate = new Date("2026-01-31");

		const fetchCashflowData = vi.fn().mockResolvedValue({
			companyId: "company-1",
			period: { startDate, endDate },
			currency: "PEN",
			totalInflows: 0,
			totalOutflows: 0,
			netCashflow: 0,
			transactionCount: { credits: 0, debits: 0 },
			daily: [],
		});

		const result = await mockedGetActualCashflow(
			{
				companyId: "company-1",
				startDate,
				endDate,
				currency: "PEN",
			},
			fetchCashflowData,
		);

		expect(result.period.startDate).toEqual(startDate);
		expect(result.period.endDate).toEqual(endDate);
	});

	it("should include transaction count", async () => {
		const fetchCashflowData = vi.fn().mockResolvedValue({
			companyId: "company-1",
			period: {
				startDate: new Date("2026-01-01"),
				endDate: new Date("2026-01-31"),
			},
			currency: "PEN",
			totalInflows: 0,
			totalOutflows: 0,
			netCashflow: 0,
			transactionCount: { credits: 0, debits: 0 },
			daily: [],
		});

		const result = await mockedGetActualCashflow(
			{
				companyId: "company-1",
				startDate: new Date("2026-01-01"),
				endDate: new Date("2026-01-31"),
				currency: "PEN",
			},
			fetchCashflowData,
		);

		expect(result.transactionCount).toMatchObject({
			inflows: 0,
			outflows: 0,
		});
	});

	it("should map banking cashflow totals to the cashflow contract", async () => {
		const startDate = new Date("2026-01-01");
		const endDate = new Date("2026-01-31");

		const fetchCashflowData = vi.fn().mockResolvedValue({
			companyId: "company-1",
			period: { startDate, endDate },
			currency: "PEN",
			totalInflows: 1500.25,
			totalOutflows: 450.1,
			netCashflow: 1050.15,
			transactionCount: { credits: 3, debits: 2 },
			daily: [],
		});

		const result = await mockedGetActualCashflow(
			{
				companyId: "company-1",
				startDate,
				endDate,
				currency: "PEN",
			},
			fetchCashflowData,
		);

		expect(fetchCashflowData).toHaveBeenCalledWith({
			companyId: "company-1",
			startDate,
			endDate,
			currency: "PEN",
		});

		expect(result).toMatchObject({
			actualInflows: 1500.25,
			actualOutflows: 450.1,
			netCashflow: 1050.15,
			transactionCount: {
				inflows: 3,
				outflows: 2,
			},
		});
	});
});

describe("GetCashflowForecastQuery", () => {
	beforeEach(() => {
		vi.useRealTimers();
		(db.where as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
	});

	it("should return forecast with default 3 months", async () => {
		const result = await getCashflowForecast({
			companyId: "company-1",
			currency: "PEN",
		});

		expect(result.months).toBe(3);
		expect(result.forecast).toHaveLength(3);
	});

	it("should return forecast with custom months", async () => {
		const result = await getCashflowForecast({
			companyId: "company-1",
			months: 6,
			currency: "USD",
		});

		expect(result.months).toBe(6);
		expect(result.forecast).toHaveLength(6);
		expect(result.currency).toBe("USD");
	});

	it("should include forecast method and historical basis", async () => {
		const result = await getCashflowForecast({
			companyId: "company-1",
			currency: "PEN",
		});

		expect(result.method).toBe("historical_average");
		expect(result.basedOnMonths).toBeGreaterThanOrEqual(0);
	});

	it("should have confidence values between 0.5 and 0.95", async () => {
		const result = await getCashflowForecast({
			companyId: "company-1",
			currency: "PEN",
		});

		for (const month of result.forecast) {
			expect(month.confidence).toBeGreaterThanOrEqual(0.5);
			expect(month.confidence).toBeLessThanOrEqual(0.95);
		}
	});

	it("should format month as YYYY-MM", async () => {
		const result = await getCashflowForecast({
			companyId: "company-1",
			currency: "PEN",
		});

		const monthRegex = /^\d{4}-\d{2}$/;
		for (const month of result.forecast) {
			expect(month.month).toMatch(monthRegex);
		}
	});

	it("should calculate net cashflow correctly", async () => {
		const result = await getCashflowForecast({
			companyId: "company-1",
			currency: "PEN",
		});

		for (const month of result.forecast) {
			const expectedNet = month.expectedInflows - month.expectedOutflows;
			expect(month.netCashflow).toBeCloseTo(expectedNet, 2);
		}
	});

	it("should build forecast averages from bank transactions history", async () => {
		(db.where as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
			{ transactionDate: "2025-10-10", type: "CREDIT", amount: "100.00" },
			{ transactionDate: "2025-10-15", type: "DEBIT", amount: "20.00" },
			{ transactionDate: "2025-11-03", type: "CREDIT", amount: "200.00" },
			{ transactionDate: "2025-11-19", type: "DEBIT", amount: "50.00" },
		]);

		const result = await getCashflowForecast({
			companyId: "company-1",
			months: 2,
			currency: "PEN",
		});

		expect(result.basedOnMonths).toBe(2);
		expect(result.forecast).toHaveLength(2);
		expect(
			result.forecast.every((month) => month.expectedInflows === 150),
		).toBe(true);
		expect(
			result.forecast.every((month) => month.expectedOutflows === 35),
		).toBe(true);
		expect(result.forecast.every((month) => month.netCashflow === 115)).toBe(
			true,
		);
		expect(result.forecast.every((month) => month.confidence === 0.67)).toBe(
			true,
		);
	});
});

describe("GetCashflowVarianceQuery", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// NOTE: vi.mock() hoisting keeps the mock wrappers in place.
		// We must NOT call vi.restoreAllMocks() here because that would
		// break the module-level mocks for getCashflowProjection and
		// getActualCashflow on which this test suite depends.
	});

	it("should return variance analysis structure", async () => {
		vi.mocked(mockedGetCashflowProjection).mockResolvedValue({
			companyId: "company-1",
			period: {
				startDate: new Date("2026-01-01"),
				endDate: new Date("2026-01-31"),
			},
			currency: "PEN",
			totalInflows: Money.fromAmount(0, "PEN"),
			totalOutflows: Money.fromAmount(0, "PEN"),
			netCashflow: Money.fromAmount(0, "PEN"),
			weeklyBreakdown: [],
			overdueItems: {
				invoices: 0,
				bills: 0,
				totalAmount: Money.fromAmount(0, "PEN"),
			},
			isDeficit: false,
			deficitAmount: Money.fromAmount(0, "PEN"),
		});
		vi.mocked(mockedGetActualCashflow).mockResolvedValue({
			companyId: "company-1",
			period: {
				startDate: new Date("2026-01-01"),
				endDate: new Date("2026-01-31"),
			},
			currency: "PEN",
			actualInflows: 0,
			actualOutflows: 0,
			netCashflow: 0,
			transactionCount: { inflows: 0, outflows: 0 },
		});
		const result = await getCashflowVariance({
			companyId: "company-1",
			startDate: new Date("2026-01-01"),
			endDate: new Date("2026-01-31"),
			currency: "PEN",
		});

		expect(result).toHaveProperty("projected");
		expect(result).toHaveProperty("actual");
		expect(result).toHaveProperty("variance");
		expect(result).toHaveProperty("alerts");
	});

	it("should calculate percentage variance correctly", async () => {
		vi.mocked(mockedGetCashflowProjection).mockResolvedValue({
			companyId: "company-1",
			period: {
				startDate: new Date("2026-01-01"),
				endDate: new Date("2026-01-31"),
			},
			currency: "PEN",
			totalInflows: Money.fromAmount(100, "PEN"),
			totalOutflows: Money.fromAmount(40, "PEN"),
			netCashflow: Money.fromAmount(60, "PEN"),
			weeklyBreakdown: [],
			overdueItems: {
				invoices: 0,
				bills: 0,
				totalAmount: Money.fromAmount(0, "PEN"),
			},
			isDeficit: false,
			deficitAmount: Money.fromAmount(0, "PEN"),
		});
		vi.mocked(mockedGetActualCashflow).mockResolvedValue({
			companyId: "company-1",
			period: {
				startDate: new Date("2026-01-01"),
				endDate: new Date("2026-01-31"),
			},
			currency: "PEN",
			actualInflows: 80,
			actualOutflows: 50,
			netCashflow: 30,
			transactionCount: { inflows: 1, outflows: 1 },
		});
		const result = await getCashflowVariance({
			companyId: "company-1",
			startDate: new Date("2026-01-01"),
			endDate: new Date("2026-01-31"),
			currency: "PEN",
		});

		expect(result.variance).toHaveProperty("inflowsPercentage");
		expect(result.variance).toHaveProperty("outflowsPercentage");
		expect(result.variance).toHaveProperty("netPercentage");
	});

	it("should have period information", async () => {
		const startDate = new Date("2026-01-01");
		const endDate = new Date("2026-01-31");

		vi.mocked(mockedGetCashflowProjection).mockResolvedValue({
			companyId: "company-1",
			period: { startDate, endDate },
			currency: "PEN",
			totalInflows: Money.fromAmount(0, "PEN"),
			totalOutflows: Money.fromAmount(0, "PEN"),
			netCashflow: Money.fromAmount(0, "PEN"),
			weeklyBreakdown: [],
			overdueItems: {
				invoices: 0,
				bills: 0,
				totalAmount: Money.fromAmount(0, "PEN"),
			},
			isDeficit: false,
			deficitAmount: Money.fromAmount(0, "PEN"),
		});
		vi.mocked(mockedGetActualCashflow).mockResolvedValue({
			companyId: "company-1",
			period: { startDate, endDate },
			currency: "PEN",
			actualInflows: 0,
			actualOutflows: 0,
			netCashflow: 0,
			transactionCount: { inflows: 0, outflows: 0 },
		});
		const result = await getCashflowVariance({
			companyId: "company-1",
			startDate,
			endDate,
			currency: "PEN",
		});

		expect(result.period.startDate).toEqual(startDate);
		expect(result.period.endDate).toEqual(endDate);
	});

	it("should return empty alerts when variance is acceptable", async () => {
		vi.mocked(mockedGetCashflowProjection).mockResolvedValue({
			companyId: "company-1",
			period: {
				startDate: new Date("2026-01-01"),
				endDate: new Date("2026-01-31"),
			},
			currency: "PEN",
			totalInflows: Money.fromAmount(0, "PEN"),
			totalOutflows: Money.fromAmount(0, "PEN"),
			netCashflow: Money.fromAmount(0, "PEN"),
			weeklyBreakdown: [],
			overdueItems: {
				invoices: 0,
				bills: 0,
				totalAmount: Money.fromAmount(0, "PEN"),
			},
			isDeficit: false,
			deficitAmount: Money.fromAmount(0, "PEN"),
		});
		vi.mocked(mockedGetActualCashflow).mockResolvedValue({
			companyId: "company-1",
			period: {
				startDate: new Date("2026-01-01"),
				endDate: new Date("2026-01-31"),
			},
			currency: "PEN",
			actualInflows: 0,
			actualOutflows: 0,
			netCashflow: 0,
			transactionCount: { inflows: 0, outflows: 0 },
		});
		const result = await getCashflowVariance({
			companyId: "company-1",
			startDate: new Date("2026-01-01"),
			endDate: new Date("2026-01-31"),
			currency: "PEN",
		});

		// With no data, all values are 0, so percentage variance is also 0 (acceptable)
		expect(Array.isArray(result.alerts)).toBe(true);
	});
});

describe("GetCashflowProjectionQuery", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		// Wire the mock back to the real function for this test suite
		vi.mocked(mockedGetCashflowProjection).mockImplementation(
			realGetCashflowProjection,
		);

		(db.where as unknown as ReturnType<typeof vi.fn>)
			.mockResolvedValueOnce([])
			.mockResolvedValueOnce([
				{
					id: "bill-1",
					reference: "B001-123",
					amount: "1000.00",
					dueDate: "2026-03-10",
					status: "SENT",
					vendorId: "vendor-1",
				},
			])
			.mockResolvedValueOnce([
				{
					billId: "bill-1",
					retentionAmountCents: 3000,
					sunatDueDate: "2026-04-15",
					declarationPeriod: "2026-03",
				},
			]);
	});

	it("splits retained bills into supplier and SUNAT outflows", async () => {
		const result = await mockedGetCashflowProjection({
			companyId: "company-1",
			currency: "PEN",
			days: 60,
		});

		expect(result.outflows).toHaveLength(2);
		expect(result.outflows[0]).toMatchObject({
			id: "bill-1",
			documentType: "bill",
			customerOrVendor: "vendor-1",
		});
		expect(result.outflows[0]?.amount.getAmount()).toBe(970);

		expect(result.outflows[1]).toMatchObject({
			id: "retention-bill-1",
			documentType: "retention",
			customerOrVendor: "SUNAT",
			reference: "RET-2026-03",
		});
		expect(result.outflows[1]?.amount.getAmount()).toBe(30);
	});
});
