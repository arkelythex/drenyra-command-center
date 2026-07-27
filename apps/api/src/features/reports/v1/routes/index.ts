/**
 * v1 Reports Routes Assembly
 *
 * Mounts all v1 report routes under /api/v1/reports:
 * - Financial: profit-loss, balance-sheet, cash-flow, sales-by-customer
 * - New: trial-balance, general-ledger
 */

import { Elysia } from "elysia";
import { companyScopeGuard } from "../../../../shared/plugins";
import { injectVersionHeader } from "../../_internal/api-version-header";
import { reportError, ErrorCodes } from "../../_internal/error-shapes";
import { getProfitLoss } from "../../application/queries/get-profit-loss";
import { getBalanceSheet } from "../../application/queries/get-balance-sheet";
import { getCashFlow } from "../../application/queries/get-cash-flow";
import { getSalesByCustomer } from "../../application/queries/get-sales-by-customer";
import { getTrialBalance } from "../../application/queries/get-trial-balance";
import { getGeneralLedger } from "../../application/queries/get-general-ledger";
import {
	ReportsDateRangeQuerySchema,
	ReportsDateRangeBaseSchema,
	ReportsAsOfDateQuerySchema,
	AccountCodeQuerySchema,
	ProfitLossReportSchema,
	BalanceSheetReportSchema,
	CashFlowReportSchema,
	SalesByCustomerReportSchema,
	TrialBalanceReportSchema,
	GeneralLedgerReportSchema,
} from "../schemas/reports.schemas";

function withCompany(ctx: any, set: any): string | null {
	if (!ctx.companyContext?.companyId) {
		set.status = 401;
		return null;
	}
	return ctx.companyContext.companyId;
}

function handleError(error: any, set: any) {
	set.status = 500;
	return reportError(ErrorCodes.INTERNAL_ERROR, error?.message ?? "Internal error");
}

export const v1ReportsModule = new Elysia({ prefix: "/api/v1/reports" })
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.use(injectVersionHeader)

	.get("/profit-loss", async ({ query, companyContext, set }: any) => {
		const parsed = ReportsDateRangeQuerySchema.safeParse(query);
		if (!parsed.success) { set.status = 422; return reportError(ErrorCodes.VALIDATION_ERROR, "Invalid query", parsed.error); }
		const cid = withCompany({ companyContext }, set); if (!cid) return reportError(ErrorCodes.COMPANY_CONTEXT_REQUIRED, "Company context required");
		try {
			const result = await getProfitLoss(cid, parsed.data.startDate, parsed.data.endDate);
			const contract = ProfitLossReportSchema.safeParse(result);
			if (!contract.success) { set.status = 500; return reportError(ErrorCodes.REPORT_CONTRACT_ERROR, "Response contract violation", contract.error); }
			return { success: true, data: contract.data };
		} catch (e: any) { return handleError(e, set); }
	}, { query: ReportsDateRangeQuerySchema, detail: { tags: ["Reports"], summary: "Profit & Loss" } })

	.get("/balance-sheet", async ({ query, companyContext, set }: any) => {
		const parsed = ReportsAsOfDateQuerySchema.safeParse(query);
		if (!parsed.success) { set.status = 422; return reportError(ErrorCodes.VALIDATION_ERROR, "Invalid query", parsed.error); }
		const cid = withCompany({ companyContext }, set); if (!cid) return reportError(ErrorCodes.COMPANY_CONTEXT_REQUIRED, "Company context required");
		try {
			const result = await getBalanceSheet(cid, parsed.data.asOfDate);
			const contract = BalanceSheetReportSchema.safeParse(result);
			if (!contract.success) { set.status = 500; return reportError(ErrorCodes.REPORT_CONTRACT_ERROR, "Response contract violation", contract.error); }
			return { success: true, data: contract.data };
		} catch (e: any) { return handleError(e, set); }
	}, { query: ReportsAsOfDateQuerySchema, detail: { tags: ["Reports"], summary: "Balance Sheet" } })

	.get("/cash-flow", async ({ query, companyContext, set }: any) => {
		const parsed = ReportsDateRangeQuerySchema.safeParse(query);
		if (!parsed.success) { set.status = 422; return reportError(ErrorCodes.VALIDATION_ERROR, "Invalid query", parsed.error); }
		const cid = withCompany({ companyContext }, set); if (!cid) return reportError(ErrorCodes.COMPANY_CONTEXT_REQUIRED, "Company context required");
		try {
			const result = await getCashFlow(cid, parsed.data.startDate, parsed.data.endDate);
			const contract = CashFlowReportSchema.safeParse(result);
			if (!contract.success) { set.status = 500; return reportError(ErrorCodes.REPORT_CONTRACT_ERROR, "Response contract violation", contract.error); }
			return { success: true, data: contract.data };
		} catch (e: any) { return handleError(e, set); }
	}, { query: ReportsDateRangeQuerySchema, detail: { tags: ["Reports"], summary: "Cash Flow" } })

	.get("/sales-by-customer", async ({ query, companyContext, set }: any) => {
		const parsed = ReportsDateRangeQuerySchema.safeParse(query);
		if (!parsed.success) { set.status = 422; return reportError(ErrorCodes.VALIDATION_ERROR, "Invalid query", parsed.error); }
		const cid = withCompany({ companyContext }, set); if (!cid) return reportError(ErrorCodes.COMPANY_CONTEXT_REQUIRED, "Company context required");
		try {
			const result = await getSalesByCustomer(cid, parsed.data.startDate, parsed.data.endDate);
			const contract = SalesByCustomerReportSchema.safeParse(result);
			if (!contract.success) { set.status = 500; return reportError(ErrorCodes.REPORT_CONTRACT_ERROR, "Response contract violation", contract.error); }
			return { success: true, data: contract.data };
		} catch (e: any) { return handleError(e, set); }
	}, { query: ReportsDateRangeQuerySchema, detail: { tags: ["Reports"], summary: "Sales by Customer" } })

	// ── Trial Balance (NEW) ─────────────────────────────────────────────────
	.get("/trial-balance", async ({ query, companyContext, set }: any) => {
		const parsed = ReportsAsOfDateQuerySchema.safeParse(query);
		if (!parsed.success) { set.status = 422; return reportError(ErrorCodes.VALIDATION_ERROR, "Invalid query", parsed.error); }
		const cid = withCompany({ companyContext }, set); if (!cid) return reportError(ErrorCodes.COMPANY_CONTEXT_REQUIRED, "Company context required");
		try {
			const result = await getTrialBalance(cid, parsed.data.asOfDate);
			const contract = TrialBalanceReportSchema.safeParse(result);
			if (!contract.success) { set.status = 500; return reportError(ErrorCodes.REPORT_CONTRACT_ERROR, "Response contract violation", contract.error); }
			return { success: true, data: contract.data };
		} catch (e: any) { return handleError(e, set); }
	}, { query: ReportsAsOfDateQuerySchema, detail: { tags: ["Reports"], summary: "Trial Balance" } })

	// ── General Ledger (NEW) ────────────────────────────────────────────────
	.get("/general-ledger", async ({ query, companyContext, set }: any) => {
		const parsed = ReportsDateRangeBaseSchema.merge(AccountCodeQuerySchema).safeParse(query);
		if (!parsed.success) { set.status = 422; return reportError(ErrorCodes.VALIDATION_ERROR, "Invalid query", parsed.error); }
		const cid = withCompany({ companyContext }, set); if (!cid) return reportError(ErrorCodes.COMPANY_CONTEXT_REQUIRED, "Company context required");
		try {
			const result = await getGeneralLedger(cid, parsed.data.startDate, parsed.data.endDate, parsed.data.accountCode);
			const contract = GeneralLedgerReportSchema.safeParse(result);
			if (!contract.success) { set.status = 500; return reportError(ErrorCodes.REPORT_CONTRACT_ERROR, "Response contract violation", contract.error); }
			return { success: true, data: contract.data };
		} catch (e: any) { return handleError(e, set); }
	}, { detail: { tags: ["Reports"], summary: "General Ledger" } });
