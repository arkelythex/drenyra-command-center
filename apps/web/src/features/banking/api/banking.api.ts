import { api, getTenantContext } from "@/lib/api";
import { safeApiCall } from "@/lib/api-factory";
import {
	extractOkData,
	extractOkDataOrPassthrough,
	unwrap,
} from "@/lib/api-helpers";
import type {
	BankAccount,
	BankTransaction,
} from "@/features/banking/stores/banking.store.types";
import type {
	BankCsvFormat,
	CreateBankAccountPayload,
	CreateTransactionPayload,
	DocumentType,
	TransactionFilters,
} from "./banking.api.types";
import { parseTransactionsCsv } from "./banking-csv-parser";

export type {
	BankAccountType,
	BankCsvFormat,
	CreateBankAccountPayload,
	CreateTransactionPayload,
	Currency,
	DocumentType,
	TransactionFilters,
	TransactionType,
} from "./banking.api.types";

interface BankSummary {
	totalAccounts: number;
	totalBalancePEN: string;
	totalBalanceUSD: string;
	totalBalance: string;
	unreconciledTransactions: number;
}

export const bankingApi = {
	getAccounts: async () => {
		const { companyId } = getTenantContext();
		return safeApiCall(async () => {
			const body = await unwrap(
				api.api.banking.accounts.get({ query: { companyId } }),
			);
			return extractOkData<BankAccount[]>(body, "No se pudieron cargar las cuentas bancarias");
		});
	},

	getAccount: async (accountId: string) => {
		return safeApiCall(async () => {
			const body = await unwrap(api.api.banking.accounts({ id: accountId }).get());
			return extractOkData<BankAccount>(body, "No se pudo cargar la cuenta bancaria");
		});
	},

	createAccount: async (payload: CreateBankAccountPayload) => {
		const { companyId } = getTenantContext();
		return safeApiCall(async () => {
			const body = await unwrap(
				api.api.banking.accounts.post({ companyId, ...payload }),
			);
			return extractOkData<BankAccount>(body, "No se pudo crear la cuenta bancaria");
		});
	},

	deleteAccount: async (accountId: string) => {
		return safeApiCall(async () => {
			const body = await unwrap(api.api.banking.accounts({ id: accountId }).delete());
			return extractOkData<{ success: boolean }>(body, "No se pudo eliminar la cuenta bancaria");
		});
	},

	getTransactions: async (accountId: string, filters?: TransactionFilters) => {
		return safeApiCall(async () => {
			const query = {
				...(filters?.startDate && { startDate: filters.startDate }),
				...(filters?.endDate && { endDate: filters.endDate }),
			};

			const body = await unwrap(
				api.api.banking
					.accounts({ id: accountId })
					.transactions.get(Object.keys(query).length ? { query } : undefined),
			);
			return extractOkData<BankTransaction[]>(body, "No se pudieron cargar las transacciones");
		});
	},

	createTransaction: async (transaction: CreateTransactionPayload) => {
		const { companyId } = getTenantContext();
		return safeApiCall(async () => {
			const body = await unwrap(
				api.api.banking.transactions.post({
					companyId,
					...transaction,
					transactionDate:
						transaction.transactionDate instanceof Date
							? transaction.transactionDate
							: new Date(transaction.transactionDate),
				}),
			);
			return extractOkData<BankTransaction>(body, "No se pudo crear la transacción");
		});
	},

	reconcileTransaction: async (
		transactionId: string,
		documentId?: string,
		documentType?: DocumentType,
	) => {
		return safeApiCall(async () => {
			const body = await unwrap(
				api.api.banking
					.transactions({ id: transactionId })
					.reconcile.post({ documentId, documentType }),
			);
			return extractOkData<{ success: boolean }>(body, "No se pudo conciliar la transacción");
		});
	},

	autoReconcile: async (accountId: string) => {
		const { companyId } = getTenantContext();
		return safeApiCall(async () => {
			const body = await unwrap(
				api.api.banking["auto-reconcile"].post({ companyId, accountId }),
			);
			return extractOkData<{ matched: number; unmatched: number }>(body, "No se pudo ejecutar la conciliación automática");
		});
	},

	importTransactions: async (
		accountId: string,
		file: File,
		format: BankCsvFormat = "GENERIC",
	) => {
		return safeApiCall(async () => {
			const { companyId } = getTenantContext();

			try {
				const csvText = await file.text();
				const body = await unwrap(
					api.api["agentic-ledger"].ingest.bank.post({
						companyId,
						accountId,
						connector: "csv",
						format,
						csvText,
					}),
				);
				return extractOkDataOrPassthrough<{ imported: number }>(
					body,
					"No se pudieron importar las transacciones desde el CSV",
				);
			} catch {
				const transactions = await parseTransactionsCsv(file);
				if (transactions.length === 0) {
					throw new Error("No se encontraron transacciones válidas en el CSV.");
				}

				const body = await unwrap(
					api.api.banking.import.post({
						companyId,
						accountId,
						transactions,
					}),
				);
				return extractOkData<{ imported: number }>(
					body,
					"No se pudieron importar las transacciones (fallback)",
				);
			}
		});
	},

	getSummary: async () => {
		const { companyId } = getTenantContext();
		return safeApiCall(async () => {
			const body = await unwrap(api.api.banking.summary.get({ query: { companyId } }));
			return extractOkData<BankSummary>(body, "No se pudo cargar el resumen bancario");
		});
	},
};
