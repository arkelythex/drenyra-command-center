import { Elysia, t } from "elysia";
import type { z } from "zod";
import { companyScopeGuard } from "../../shared/plugins";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import { getBalanceSheet } from "./application/queries/get-balance-sheet";
import { getCashFlow } from "./application/queries/get-cash-flow";
import { getProfitLoss } from "./application/queries/get-profit-loss";
import { getSalesByCustomer } from "./application/queries/get-sales-by-customer";
import {
	BalanceSheetReportSchema,
	CashFlowReportSchema,
	ProfitLossReportSchema,
	ReportsAsOfDateQuerySchema,
	ReportsDateRangeQuerySchema,
	SalesByCustomerReportSchema,
} from "./reports.schemas";

function validationErrorResponse(error: z.ZodError<unknown>) {
	return fail("Invalid report query parameters", "VALIDATION_ERROR", {
		details: {
			issues: error.issues.map((issue) => ({
				path: issue.path,
				message: issue.message,
			})),
		},
	});
}

function responseContractErrorResponse(error: z.ZodError<unknown>) {
	return fail(
		JSON.stringify({
			message: "Report response violated its contract",
			issues: error.issues.map((issue) => ({
				path: issue.path,
				message: issue.message,
			})),
		}),
		"REPORT_CONTRACT_ERROR",
	);
}

export const reportsModule = new Elysia({ prefix: "/api/reports" })
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.get(
		"/profit-loss",
		async ({ query, companyContext, set }) => {
			const parsed = ReportsDateRangeQuerySchema.safeParse(query);
			if (!parsed.success) {
				set.status = 422;
				return validationErrorResponse(parsed.error);
			}

			try {
				const result = await getProfitLoss(
					companyContext!.companyId,
					parsed.data.startDate,
					parsed.data.endDate,
				);
				const contract = ProfitLossReportSchema.safeParse(result);
				if (!contract.success) {
					set.status = 500;
					return responseContractErrorResponse(contract.error);
				}
				return ok(contract.data);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: t.Object({
				startDate: t.String(),
				endDate: t.String(),
			}),
			detail: { tags: ["Reports"], summary: "Profit & loss statement" },
		},
	)
	.get(
		"/balance-sheet",
		async ({ query, companyContext, set }) => {
			const parsed = ReportsAsOfDateQuerySchema.safeParse(query);
			if (!parsed.success) {
				set.status = 422;
				return validationErrorResponse(parsed.error);
			}

			try {
				const result = await getBalanceSheet(
					companyContext!.companyId,
					parsed.data.asOfDate,
				);
				const contract = BalanceSheetReportSchema.safeParse(result);
				if (!contract.success) {
					set.status = 500;
					return responseContractErrorResponse(contract.error);
				}
				return ok(contract.data);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: t.Object({
				asOfDate: t.String(),
			}),
			detail: { tags: ["Reports"], summary: "Balance sheet" },
		},
	)
	.get(
		"/cash-flow",
		async ({ query, companyContext, set }) => {
			const parsed = ReportsDateRangeQuerySchema.safeParse(query);
			if (!parsed.success) {
				set.status = 422;
				return validationErrorResponse(parsed.error);
			}

			try {
				const result = await getCashFlow(
					companyContext!.companyId,
					parsed.data.startDate,
					parsed.data.endDate,
				);
				const contract = CashFlowReportSchema.safeParse(result);
				if (!contract.success) {
					set.status = 500;
					return responseContractErrorResponse(contract.error);
				}
				return ok(contract.data);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: t.Object({
				startDate: t.String(),
				endDate: t.String(),
			}),
			detail: { tags: ["Reports"], summary: "Cash flow statement" },
		},
	)
	.get(
		"/sales-by-customer",
		async ({ query, companyContext, set }) => {
			const parsed = ReportsDateRangeQuerySchema.safeParse(query);
			if (!parsed.success) {
				set.status = 422;
				return validationErrorResponse(parsed.error);
			}

			try {
				const result = await getSalesByCustomer(
					companyContext!.companyId,
					parsed.data.startDate,
					parsed.data.endDate,
				);
				const contract = SalesByCustomerReportSchema.safeParse(result);
				if (!contract.success) {
					set.status = 500;
					return responseContractErrorResponse(contract.error);
				}
				return ok(contract.data);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: t.Object({
				startDate: t.String(),
				endDate: t.String(),
			}),
			detail: { tags: ["Reports"], summary: "Sales by customer" },
		},
	);
