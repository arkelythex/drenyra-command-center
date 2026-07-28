import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	FiscalPeriodValidationError,
	resolveFiscalPeriodId,
	type FiscalPeriodDbQuery,
} from "../../services/fiscal-period.service";

describe("resolveFiscalPeriodId", () => {
	let queryDb: ReturnType<typeof vi.fn<Parameters<FiscalPeriodDbQuery>, ReturnType<FiscalPeriodDbQuery>>>;

	beforeEach(() => {
		vi.clearAllMocks();
		queryDb = vi.fn();
	});

	describe("valid period", () => {
		it("returns fiscalPeriodId string when period exists in fiscal calendar", async () => {
			const companyId = "company-uuid-1";
			const period = "2026-03";
			const fiscalPeriodId = "fp-uuid-abc-123";

			queryDb.mockResolvedValue([{ id: fiscalPeriodId }]);

			const result = await resolveFiscalPeriodId(companyId, period, {
				queryDb,
			});

			expect(result).toBe(fiscalPeriodId);
			expect(typeof result).toBe("string");
			expect(result.length).toBeGreaterThan(0);
		});

		it("queries DB with correct year and month parsed from period", async () => {
			const companyId = "company-uuid-1";
			const period = "2026-03";
			const fiscalPeriodId = "fp-uuid-abc-123";

			queryDb.mockResolvedValue([{ id: fiscalPeriodId }]);

			await resolveFiscalPeriodId(companyId, period, { queryDb });

			expect(queryDb).toHaveBeenCalledWith({
				companyId,
				year: 2026,
				month: 3,
			});
		});
	});

	describe("invalid period", () => {
		it("throws FiscalPeriodValidationError when period not in fiscal calendar", async () => {
			const companyId = "company-uuid-1";
			const period = "2099-12";

			queryDb.mockResolvedValue([]);

			await expect(
				resolveFiscalPeriodId(companyId, period, { queryDb }),
			).rejects.toThrow(FiscalPeriodValidationError);

			await expect(
				resolveFiscalPeriodId(companyId, period, { queryDb }),
			).rejects.toMatchObject({
				code: "FISCAL_PERIOD_INVALID",
				companyId,
				period,
			});
		});
	});

	describe("period format handling", () => {
		it("parses YYYY-MM period into year and month integers", async () => {
			const companyId = "company-uuid-1";
			const period = "2026-03";
			const fiscalPeriodId = "fp-uuid-1";

			queryDb.mockResolvedValue([{ id: fiscalPeriodId }]);

			const result = await resolveFiscalPeriodId(companyId, period, {
				queryDb,
			});
			expect(result).toBe(fiscalPeriodId);
		});

		it("handles single-digit months with leading zero", async () => {
			const companyId = "company-uuid-1";
			const period = "2026-01";
			const fiscalPeriodId = "fp-uuid-jan";

			queryDb.mockResolvedValue([{ id: fiscalPeriodId }]);

			const result = await resolveFiscalPeriodId(companyId, period, {
				queryDb,
			});
			expect(result).toBe(fiscalPeriodId);
		});

		it("handles two-digit months", async () => {
			const companyId = "company-uuid-1";
			const period = "2026-12";
			const fiscalPeriodId = "fp-uuid-dec";

			queryDb.mockResolvedValue([{ id: fiscalPeriodId }]);

			const result = await resolveFiscalPeriodId(companyId, period, {
				queryDb,
			});
			expect(result).toBe(fiscalPeriodId);
		});
	});

	describe("cross-company isolation", () => {
		it("rejects period that exists for company A but not company B", async () => {
			const companyB = "company-uuid-b";

			// Company B has no fiscal period for "2026-03"
			queryDb.mockResolvedValue([]);

			await expect(
				resolveFiscalPeriodId(companyB, "2026-03", { queryDb }),
			).rejects.toThrow(FiscalPeriodValidationError);
		});
	});

	describe("malformed period input", () => {
		it("throws on period string that cannot be parsed", async () => {
			await expect(
				resolveFiscalPeriodId("company-1", "not-a-date", { queryDb }),
			).rejects.toThrow(FiscalPeriodValidationError);
		});

		it("throws on month outside 1-12 range", async () => {
			await expect(
				resolveFiscalPeriodId("company-1", "2026-13", { queryDb }),
			).rejects.toThrow(FiscalPeriodValidationError);
		});

		it("throws on month zero", async () => {
			await expect(
				resolveFiscalPeriodId("company-1", "2026-00", { queryDb }),
			).rejects.toThrow(FiscalPeriodValidationError);
		});
	});
});
