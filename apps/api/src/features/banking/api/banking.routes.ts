import { Elysia } from "elysia";
import { companyScopeGuard } from "../../../shared/plugins";
import { bankingHandlers } from "./banking.handlers";
import {
	AirlineTicketReportQuerySchema,
	AutoReconcileSchema,
	CreateAccountSchema,
	CreateTransactionSchema,
	IdParamSchema,
	ImportTransactionsSchema,
	ListAccountsQuerySchema,
	ListTransactionsQuerySchema,
	ReconcileTransactionSchema,
	ReconciliationShadowCutoverQuerySchema,
	ReconciliationShadowMetricsQuerySchema,
} from "./banking.schemas";

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
	.get("/accounts/:id/transactions", bankingHandlers.listTransactions, {
		params: IdParamSchema,
		query: ListTransactionsQuerySchema,
		detail: { tags: ["Banking"], summary: "List transactions" },
	})
	.post("/transactions", bankingHandlers.createTransaction, {
		body: CreateTransactionSchema,
		detail: { tags: ["Banking"], summary: "Create transaction" },
	})
	.post("/transactions/:id/reconcile", bankingHandlers.reconcileTransaction, {
		params: IdParamSchema,
		body: ReconcileTransactionSchema,
		detail: { tags: ["Banking"], summary: "Reconcile transaction" },
	})
	.get("/summary", bankingHandlers.getSummary, {
		query: ListAccountsQuerySchema,
		detail: { tags: ["Banking"], summary: "Banking summary" },
	})
	.get("/reports/airline-tickets", bankingHandlers.getAirlineTicketReport, {
		query: AirlineTicketReportQuerySchema,
		detail: { tags: ["Banking"], summary: "Airline ticket report" },
	})
	.post("/import", bankingHandlers.importTransactions, {
		body: ImportTransactionsSchema,
		detail: { tags: ["Banking"], summary: "Import transactions" },
	})
	.post("/auto-reconcile", bankingHandlers.autoReconcile, {
		body: AutoReconcileSchema,
		detail: { tags: ["Banking"], summary: "Auto-reconcile" },
	})
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
	);

export default bankingRoutes;
