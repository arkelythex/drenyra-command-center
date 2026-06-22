import { Elysia } from "elysia";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LedgerService, ledgerModule } from "../../index";

const COMPANY_ID = "cmp-header";

function ledgerRequest(path: string): Request {
	return new Request(`http://localhost${path}`, {
		headers: { "x-company-id": COMPANY_ID },
	});
}

describe("ledgerModule (smoke)", () => {
	const app = new Elysia().use(ledgerModule);

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should export an Elysia module", () => {
		expect(ledgerModule).toBeDefined();
	});

	it("returns 401 when company context is missing for /ledger/accounts", async () => {
		const getChartOfAccountsSpy = vi.spyOn(LedgerService, "getChartOfAccounts");

		const response = await app.handle(
			new Request("http://localhost/api/ledger/accounts?companyId=cmp-query"),
		);

		expect(response.status).toBe(401);
		expect(getChartOfAccountsSpy).not.toHaveBeenCalled();
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "COMPANY_CONTEXT_REQUIRED",
		});
	});

	it("returns 401 when company context is missing for /ledger/general", async () => {
		const getGeneralLedgerSpy = vi.spyOn(LedgerService, "getGeneralLedger");

		const response = await app.handle(
			new Request(
				"http://localhost/api/ledger/general?companyId=cmp-query&startDate=2026-03-01&endDate=2026-03-31",
			),
		);

		expect(response.status).toBe(401);
		expect(getGeneralLedgerSpy).not.toHaveBeenCalled();
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "COMPANY_CONTEXT_REQUIRED",
		});
	});

	it("returns 401 when company context is missing for /ledger/trial-balance", async () => {
		const getTrialBalanceSpy = vi.spyOn(LedgerService, "getTrialBalance");

		const response = await app.handle(
			ledgerRequest(
				"/api/ledger/trial-balance?companyId=cmp-query&asOfDate=2026-03-31",
			),
		);

		expect(response.status).toBe(401);
		expect(getTrialBalanceSpy).not.toHaveBeenCalled();
	});
});
