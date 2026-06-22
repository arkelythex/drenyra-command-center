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
	})
	.get("/accounts/:id", bankingHandlers.getAccount, { params: IdParamSchema })
	.get("/accounts/:id/balance", bankingHandlers.getBalance, {
		params: IdParamSchema,
	})
	.post("/accounts", bankingHandlers.createAccount, {
		body: CreateAccountSchema,
	})
	.delete("/accounts/:id", bankingHandlers.deleteAccount, {
		params: IdParamSchema,
	})
	.get("/accounts/:id/transactions", bankingHandlers.listTransactions, {
		params: IdParamSchema,
		query: ListTransactionsQuerySchema,
	})
	.post("/transactions", bankingHandlers.createTransaction, {
		body: CreateTransactionSchema,
	})
	.post("/transactions/:id/reconcile", bankingHandlers.reconcileTransaction, {
		params: IdParamSchema,
		body: ReconcileTransactionSchema,
	})
	.get("/summary", bankingHandlers.getSummary, {
		query: ListAccountsQuerySchema,
	})
	.get("/reports/airline-tickets", bankingHandlers.getAirlineTicketReport, {
		query: AirlineTicketReportQuerySchema,
	})
	.post("/import", bankingHandlers.importTransactions, {
		body: ImportTransactionsSchema,
	})
	.post("/auto-reconcile", bankingHandlers.autoReconcile, {
		body: AutoReconcileSchema,
	})
	.get(
		"/reconciliation-shadow/metrics",
		bankingHandlers.getReconciliationShadowMetrics,
		{
			query: ReconciliationShadowMetricsQuerySchema,
		},
	)
	.get(
		"/reconciliation-shadow/cutover",
		bankingHandlers.getReconciliationShadowCutover,
		{
			query: ReconciliationShadowCutoverQuerySchema,
		},
	);

export default bankingRoutes;
