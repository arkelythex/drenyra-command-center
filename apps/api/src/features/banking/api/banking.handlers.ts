import type { z } from "zod";
import type { CompanyContext } from "../../../shared/plugins/company-scope-guard";
import { fail, ok } from "../../shared/api-response";
import { createAccount } from "../application/commands/create-account.command";
import { deleteAccount as deleteAccountCommand } from "../application/commands/delete-account.command";
import { getAccount } from "../application/queries/get-account.query";
import { getBalance } from "../application/queries/get-balance.query";
import { listAccounts } from "../application/queries/list-accounts.query";
import { AirlineTicketReportService } from "../application/services/airline-ticket-report.service";
import { BankingApplicationService } from "../application/services/banking.application-service";
import { ReconciliationService } from "../application/services/reconciliation.service";
import type {
	AirlineTicketReportQuerySchema,
	AutoReconcileSchema,
	CreateAccountSchema,
	CreateTransactionSchema,
	ImportTransactionsSchema,
	ListAccountsQuerySchema,
	ListTransactionsQuerySchema,
	ReconcileTransactionSchema,
	ReconciliationShadowCutoverQuerySchema,
	ReconciliationShadowMetricsQuerySchema,
} from "./banking.schemas";
import {
	loadScopedBankAccount,
	loadScopedBankTransaction,
} from "./handlers/load-scoped-banking-object";

const service = new BankingApplicationService();
const airlineReportService = new AirlineTicketReportService();

async function resolveBankingLegacyUserId(
	companyContext: CompanyContext | undefined,
): Promise<string | null> {
	return companyContext?.legacyUserId ?? null;
}

type IdParamsWithCompany = {
	params: { id: string };
	companyContext?: CompanyContext;
	set: { status?: number | string };
};
type ListAccountsCtx = { query: z.infer<typeof ListAccountsQuerySchema> };
type ListTransactionsCtx = {
	params: { id: string };
	query: z.infer<typeof ListTransactionsQuerySchema>;
	companyContext?: CompanyContext;
	set: { status?: number | string };
};
type CreateAccountCtx = { body: z.infer<typeof CreateAccountSchema> };
type CreateTransactionCtx = { body: z.infer<typeof CreateTransactionSchema> };
type ReconcileTransactionCtx = {
	params: { id: string };
	body: z.infer<typeof ReconcileTransactionSchema>;
	companyContext?: CompanyContext;
	set: { status?: number | string };
};
type SummaryCtx = { query: z.infer<typeof ListAccountsQuerySchema> };
type ImportTransactionsCtx = { body: z.infer<typeof ImportTransactionsSchema> };
type AutoReconcileCtx = { body: z.infer<typeof AutoReconcileSchema> };
type ReconciliationShadowMetricsCtx = {
	query: z.infer<typeof ReconciliationShadowMetricsQuerySchema>;
};
type ReconciliationShadowCutoverCtx = {
	query: z.infer<typeof ReconciliationShadowCutoverQuerySchema>;
};
type AirlineTicketReportCtx = {
	query: z.infer<typeof AirlineTicketReportQuerySchema>;
};

export const bankingHandlers = {
	listAccounts: async ({ query }: ListAccountsCtx) => {
		const accounts = await listAccounts(query.companyId);
		return ok(accounts);
	},
	getAccount: async ({ params, companyContext, set }: IdParamsWithCompany) => {
		if (!companyContext) {
			set.status = 401;
			return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");
		}
		const scopedAccount = await loadScopedBankAccount(
			params.id,
			companyContext.companyId,
		);
		if (!scopedAccount.ok) {
			set.status = scopedAccount.status;
			return fail(scopedAccount.error, scopedAccount.code);
		}
		const account = await getAccount(scopedAccount.account.id);
		return ok(account);
	},
	getBalance: async ({ params, companyContext, set }: IdParamsWithCompany) => {
		if (!companyContext) {
			set.status = 401;
			return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");
		}
		try {
			const scopedAccount = await loadScopedBankAccount(
				params.id,
				companyContext.companyId,
			);
			if (!scopedAccount.ok) {
				set.status = scopedAccount.status;
				return fail(scopedAccount.error, scopedAccount.code);
			}

			const balance = await getBalance(scopedAccount.account.id);
			return ok(balance);
		} catch (error) {
			if (error instanceof Error && error.message === "Account not found") {
				set.status = 404;
				return fail("Cuenta bancaria no encontrada", "ACCOUNT_NOT_FOUND");
			}
			set.status = 500;
			return fail(
				error instanceof Error ? error.message : "Error al obtener saldo",
				"BALANCE_ERROR",
			);
		}
	},
	createAccount: async ({ body }: CreateAccountCtx) => {
		const account = await createAccount(body.companyId, body);
		return ok(account);
	},
	deleteAccount: async ({
		params,
		companyContext,
		set,
	}: IdParamsWithCompany) => {
		if (!companyContext) {
			set.status = 401;
			return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");
		}
		const scopedAccount = await loadScopedBankAccount(
			params.id,
			companyContext.companyId,
		);
		if (!scopedAccount.ok) {
			set.status = scopedAccount.status;
			return fail(scopedAccount.error, scopedAccount.code);
		}

		await deleteAccountCommand(scopedAccount.account.id);
		return ok({ deleted: true });
	},
	listTransactions: async ({
		params,
		query,
		companyContext,
		set,
	}: ListTransactionsCtx) => {
		if (!companyContext) {
			set.status = 401;
			return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");
		}
		const scopedAccount = await loadScopedBankAccount(
			params.id,
			companyContext.companyId,
		);
		if (!scopedAccount.ok) {
			set.status = scopedAccount.status;
			return fail(scopedAccount.error, scopedAccount.code);
		}

		const transactions = await service.listTransactions(
			scopedAccount.account.id,
			query.startDate,
			query.endDate,
		);
		return ok(transactions);
	},
	createTransaction: async ({ body }: CreateTransactionCtx) => {
		const result = await service.createTransaction(body.companyId, body);
		return ok({
			id: result.id,
			accountId: body.accountId,
			transactionDate: body.transactionDate.toISOString().slice(0, 10),
			description: body.description,
			reference: body.reference ?? null,
			type: body.type,
			amount: body.amount.toFixed(4),
			category: body.category ?? null,
			tags: body.tags ?? null,
			balance: result.balance,
			isReconciled: false,
		});
	},
	reconcileTransaction: async ({
		params,
		body,
		companyContext,
		set,
	}: ReconcileTransactionCtx) => {
		if (!companyContext) {
			set.status = 401;
			return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");
		}
		const scopedTransaction = await loadScopedBankTransaction(
			params.id,
			companyContext.companyId,
		);
		if (!scopedTransaction.ok) {
			set.status = scopedTransaction.status;
			return fail(scopedTransaction.error, scopedTransaction.code);
		}

		const resolvedUserId =
			body.userId ?? (await resolveBankingLegacyUserId(companyContext));
		if (!resolvedUserId) {
			set.status = 401;
			return fail(
				"No se pudo resolver el usuario para conciliar la transaccion",
				"BANKING_AUTH_REQUIRED",
			);
		}

		await service.reconcileTransaction(
			scopedTransaction.transaction.id,
			resolvedUserId,
			body.documentId,
			body.documentType,
		);
		return ok({ reconciled: true });
	},
	getSummary: async ({ query }: SummaryCtx) => {
		const summary = await service.getSummary(query.companyId);
		return ok(summary);
	},
	importTransactions: async ({ body }: ImportTransactionsCtx) => {
		const imported = await service.importTransactions(
			body.companyId,
			body.accountId,
			body.transactions,
		);
		return ok(imported);
	},
	autoReconcile: async ({ body }: AutoReconcileCtx) => {
		const result = await service.autoReconcile(body.companyId, body.accountId);
		return ok(result);
	},
	getReconciliationShadowMetrics: async ({
		query,
	}: ReconciliationShadowMetricsCtx) => {
		return ok(await ReconciliationService.getShadowMetrics(query.companyId));
	},
	getReconciliationShadowCutover: async ({
		query,
	}: ReconciliationShadowCutoverCtx) => {
		return ok(
			await ReconciliationService.evaluateShadowCutover(
				query.companyId,
				query.windowRuns,
			),
		);
	},
	getAirlineTicketReport: async ({ query }: AirlineTicketReportCtx) => {
		const report = await airlineReportService.generate(query);
		return ok(report);
	},
};
