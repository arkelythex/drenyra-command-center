import { Elysia } from "elysia";
import { z } from "zod";
import { companyScopeGuard } from "../../shared/plugins";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import { getChartOfAccounts } from "./application/queries/get-chart-of-accounts.query";
import { getGeneralLedger } from "./application/queries/get-general-ledger.query";
import { getTrialBalance } from "./application/queries/get-trial-balance.query";

const parseIsoDateOrNull = (value: string): Date | null => {
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * ledgerModule const.
 *
 * @example
 * ```ts
 * console.log(ledgerModule);
 * ```
 */
export const ledgerModule = new Elysia({ prefix: "/api/ledger" })
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.get("/accounts", async ({ companyContext, set }) => {
		if (!companyContext) {
			set.status = 401;
			return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");
		}
		try {
			const result = await getChartOfAccounts(companyContext.companyId);
			return ok(result);
		} catch (error: unknown) {
			set.status = 500;
			return fail(getErrorMessage(error), "INTERNAL_ERROR");
		}
	})
	.get(
		"/general",
		async ({ query, companyContext, set }) => {
			if (!companyContext) {
				set.status = 401;
				return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");
			}
			try {
				const startDate = parseIsoDateOrNull(query.startDate);
				const endDate = parseIsoDateOrNull(query.endDate);
				if (!startDate || !endDate) {
					set.status = 400;
					return fail(
						"startDate/endDate invalid format. Use ISO date.",
						"INVALID_DATE",
					);
				}
				if (startDate.getTime() > endDate.getTime()) {
					set.status = 400;
					return fail(
						"startDate must be less than or equal to endDate.",
						"INVALID_DATE_RANGE",
					);
				}

				const result = await getGeneralLedger(
					companyContext.companyId,
					startDate,
					endDate,
				);
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: z.object({
				startDate: z.string().min(1),
				endDate: z.string().min(1),
			}),
		},
	)
	.get(
		"/trial-balance",
		async ({ query, companyContext, set }) => {
			if (!companyContext) {
				set.status = 401;
				return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");
			}
			try {
				const asOfDate = parseIsoDateOrNull(query.asOfDate);
				if (!asOfDate) {
					set.status = 400;
					return fail("asOfDate invalid format. Use ISO date.", "INVALID_DATE");
				}

				const result = await getTrialBalance(
					companyContext.companyId,
					asOfDate,
				);
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: z.object({
				asOfDate: z.string().min(1),
			}),
		},
	);
