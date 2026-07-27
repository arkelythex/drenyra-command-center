import { describe, expect, it, vi } from "vitest";
import { Elysia } from "elysia";
import { v1ReportsModule } from "../../v1/routes";

vi.mock("../../application/queries/get-trial-balance", () => ({
	getTrialBalance: vi.fn().mockResolvedValue({
		asOfDate: "2026-06-30",
		accounts: [
			{ accountCode: "701", accountName: "VENTAS", debitBalance: "0.00", creditBalance: "10000.00" },
			{ accountCode: "601", accountName: "COMPRAS", debitBalance: "5000.00", creditBalance: "0.00" },
		],
		totalDebits: "5000.00",
		totalCredits: "10000.00",
		generatedAt: "2026-07-01T00:00:00.000Z",
	}),
}));

vi.mock("../../application/queries/get-general-ledger", () => ({
	getGeneralLedger: vi.fn().mockResolvedValue({
		period: { startDate: "2026-01-01", endDate: "2026-06-30" },
		entries: [
			{ date: "2026-06-15", voucherNo: "INV-001", accountCode: "701", description: "FACTURA 001", debit: "0.00", credit: "1000.00", balance: "1000.00" },
		],
		generatedAt: "2026-07-01T00:00:00.000Z",
	}),
}));

function authedRequest(path: string): Request {
	return new Request(`http://localhost${path}`, {
		headers: { "x-company-id": "cmp-1" },
	});
}

describe("Trial Balance", () => {
	const app = new Elysia().use(v1ReportsModule);

	it("returns 401 without company context", async () => {
		const res = await app.handle(new Request("http://localhost/api/v1/reports/trial-balance?asOfDate=2026-06-30"));
		expect(res.status).toBe(401);
	});

	it("returns 422 when asOfDate is missing", async () => {
		const res = await app.handle(authedRequest("/api/v1/reports/trial-balance"));
		expect(res.status).toBe(422);
	});

	it("includes X-API-Version header", async () => {
		const res = await app.handle(authedRequest("/api/v1/reports/trial-balance?asOfDate=2026-06-30"));
		expect(res.headers.get("X-API-Version")).toBe("1");
	});
});

describe("General Ledger", () => {
	const app = new Elysia().use(v1ReportsModule);

	it("returns 401 without company context", async () => {
		const res = await app.handle(new Request("http://localhost/api/v1/reports/general-ledger?startDate=2026-01-01&endDate=2026-06-30"));
		expect(res.status).toBe(401);
	});

	it("returns 422 when dates are missing", async () => {
		const res = await app.handle(authedRequest("/api/v1/reports/general-ledger"));
		expect(res.status).toBe(422);
	});
});
