import { Elysia } from "elysia";
import {
	companyScopeGuard,
	rejectForeignCompanyId,
} from "../../../shared/plugins";
import { bankingHandlers } from "./banking.handlers";
import {
	AirlineTicketReportQuerySchema,
	CreateAccountSchema,
	CreateTransactionSchema,
	IdParamSchema,
	ImportTransactionsSchema,
	ListAccountsQuerySchema,
	ListTransactionsQuerySchema,
	ReconciliationShadowCutoverQuerySchema,
	ReconciliationShadowMetricsQuerySchema,
} from "./banking.schemas";
import {
	CloseReconciliationBatchSchema,
	CreateBatchMatchSchema,
	CreateReconciliationBatchSchema,
	CreateReconciliationRuleSchema,
	ListBatchesQuerySchema,
	UpdateReconciliationRuleSchema,
} from "./banking-reconciliation.schemas";
import { reconciliationBatchHandlers } from "./reconciliation-batch.handlers";
import { reconciliationRuleHandlers } from "./reconciliation-rule.handlers";

/**
 * Banking API routes (Elysia plugin) mounted under `/api/banking`.
 *
 * @example
 * ```ts
 * import { Elysia } from 'elysia';
 * import { bankingRoutes } from './banking.routes';
 *
 * const app = new Elysia().use(bankingRoutes);
 * ```
 */
export const bankingRoutes = new Elysia({ prefix: "/api/banking" })
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	// companyId in the query or body must be the session's company.
	.onBeforeHandle(rejectForeignCompanyId)
	// ── Accounts ──────────────────────────────────────────────────────────────
	.get("/accounts", bankingHandlers.listAccounts, {
		query: ListAccountsQuerySchema,
		detail: { tags: ["Banking"], summary: "List bank accounts" },
	})
	.get("/accounts/:id", bankingHandlers.getAccount, {
		params: IdParamSchema,
		detail: { tags: ["Banking"], summary: "Get bank account" },
	})
	.get("/accounts/:id/balance", bankingHandlers.getBalance, {
		params: IdParamSchema,
		detail: { tags: ["Banking"], summary: "Get account balance" },
	})
	.post("/accounts", bankingHandlers.createAccount, {
		body: CreateAccountSchema,
		detail: { tags: ["Banking"], summary: "Create bank account" },
	})
	.delete("/accounts/:id", bankingHandlers.deleteAccount, {
		params: IdParamSchema,
		detail: { tags: ["Banking"], summary: "Delete bank account" },
	})
	// ── Transactions ───────────────────────────────────────────────────────────
	.get("/accounts/:id/transactions", bankingHandlers.listTransactions, {
		params: IdParamSchema,
		query: ListTransactionsQuerySchema,
		detail: { tags: ["Banking"], summary: "List transactions" },
	})
	.post("/transactions", bankingHandlers.createTransaction, {
		body: CreateTransactionSchema,
		detail: { tags: ["Banking"], summary: "Create transaction" },
	})
	// Linking a movement to an invoice or bill is confirmed through
	// /api/reconciliations, which checks the document belongs to the company.
	.post("/import", bankingHandlers.importTransactions, {
		body: ImportTransactionsSchema,
		detail: { tags: ["Banking"], summary: "Import transactions" },
	})
	// ── Summary ────────────────────────────────────────────────────────────────
	.get("/summary", bankingHandlers.getSummary, {
		query: ListAccountsQuerySchema,
		detail: { tags: ["Banking"], summary: "Banking summary" },
	})
	// ── Reports ────────────────────────────────────────────────────────────────
	.get("/reports/airline-tickets", bankingHandlers.getAirlineTicketReport, {
		query: AirlineTicketReportQuerySchema,
		detail: { tags: ["Banking"], summary: "Airline ticket report" },
	})
	// ── Reconciliation shadow (read-only metrics) ─────────────────────────────
	// Linking movements to documents goes only through /api/reconciliations.
	.get(
		"/reconciliation-shadow/metrics",
		bankingHandlers.getReconciliationShadowMetrics,
		{
			query: ReconciliationShadowMetricsQuerySchema,
			detail: { tags: ["Banking"], summary: "Shadow metrics" },
		},
	)
	.get(
		"/reconciliation-shadow/cutover",
		bankingHandlers.getReconciliationShadowCutover,
		{
			query: ReconciliationShadowCutoverQuerySchema,
			detail: { tags: ["Banking"], summary: "Shadow cutover" },
		},
	)
	// ── Reconciliation Batches ─────────────────────────────────────────────────
	.post("/reconciliation/batches", reconciliationBatchHandlers.createBatch, {
		body: CreateReconciliationBatchSchema,
		detail: { tags: ["Banking"], summary: "Create reconciliation batch" },
	})
	.get("/reconciliation/batches", reconciliationBatchHandlers.listBatches, {
		query: ListBatchesQuerySchema,
		detail: { tags: ["Banking"], summary: "List reconciliation batches" },
	})
	.get("/reconciliation/batches/:id", reconciliationBatchHandlers.getBatch, {
		params: IdParamSchema,
		detail: { tags: ["Banking"], summary: "Get reconciliation batch" },
	})
	.post(
		"/reconciliation/batches/:id/close",
		reconciliationBatchHandlers.closeBatch,
		{
			params: IdParamSchema,
			body: CloseReconciliationBatchSchema,
			detail: { tags: ["Banking"], summary: "Close reconciliation batch" },
		},
	)
	.post(
		"/reconciliation/batches/:id/matches",
		reconciliationBatchHandlers.createMatch,
		{
			params: IdParamSchema,
			body: CreateBatchMatchSchema,
			detail: { tags: ["Banking"], summary: "Create batch match" },
		},
	)
	.get(
		"/reconciliation/batches/:id/matches",
		reconciliationBatchHandlers.getBatchMatches,
		{
			params: IdParamSchema,
			detail: { tags: ["Banking"], summary: "Get batch matches" },
		},
	)
	// ── Reconciliation Rules ───────────────────────────────────────────────────
	.post("/reconciliation/rules", reconciliationRuleHandlers.createRule, {
		body: CreateReconciliationRuleSchema,
		detail: { tags: ["Banking"], summary: "Create reconciliation rule" },
	})
	.get("/reconciliation/rules", reconciliationRuleHandlers.listRules, {
		detail: { tags: ["Banking"], summary: "List reconciliation rules" },
	})
	.get("/reconciliation/rules/:id", reconciliationRuleHandlers.getRule, {
		params: IdParamSchema,
		detail: { tags: ["Banking"], summary: "Get reconciliation rule" },
	})
	.patch("/reconciliation/rules/:id", reconciliationRuleHandlers.updateRule, {
		params: IdParamSchema,
		body: UpdateReconciliationRuleSchema,
		detail: { tags: ["Banking"], summary: "Update reconciliation rule" },
	})
	.delete("/reconciliation/rules/:id", reconciliationRuleHandlers.deleteRule, {
		params: IdParamSchema,
		detail: { tags: ["Banking"], summary: "Delete reconciliation rule" },
	});

export default bankingRoutes;
