import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTenantContext } from "@/lib/api";
import type {
	BankCsvFormat,
	CreateBankAccountPayload,
	DocumentType,
} from "../api/banking.api";
import { bankingApi } from "../api/banking.api";
import { bankingKeys } from "../api/query-keys";
import {
	bankingAccountsQueryOptions,
	bankingTransactionsQueryOptions,
} from "../api/query-options";
import type { ReconciliationMatch } from "../stores/banking.store.types";

export interface TransactionFiltersInput {
	startDate?: string;
	endDate?: string;
}

export interface ImportTransactionsResult {
	imported: number;
	duplicates?: number;
	warnings?: string[];
	errors: number;
}

export interface AutoReconcileResult {
	reconciledCount: number;
	matches: ReconciliationMatch[];
}

interface ImportTransactionsResponse {
	imported?: number;
	skipped?: number;
	duplicates?: number;
	warnings?: string[];
	errors?: Array<{ row: number; error: string }>;
}

function getObjectData<T extends object>(result: unknown): T | null {
	if (!result || typeof result !== "object") return null;
	const wrapped = result as { data?: unknown };
	if (wrapped.data && typeof wrapped.data === "object") {
		return wrapped.data as T;
	}
	return result as T;
}

function normalizeImportResult(result: unknown): ImportTransactionsResult {
	const data = getObjectData<ImportTransactionsResponse>(result);
	const duplicates = data?.duplicates ?? data?.skipped;
	const warnings = Array.isArray(data?.warnings) ? data.warnings : undefined;
	const errorCount = Array.isArray(data?.errors) ? data.errors.length : 0;

	return {
		imported: data?.imported ?? 0,
		duplicates,
		warnings,
		errors: errorCount,
	};
}

function normalizeAutoReconcileResult(result: unknown): AutoReconcileResult {
	const data = getObjectData<AutoReconcileResult>(result);
	return {
		reconciledCount: data?.reconciledCount ?? 0,
		matches: Array.isArray(data?.matches) ? data.matches : [],
	};
}

export function useBankingAccountsQuery(companyId: string) {
	return useQuery(bankingAccountsQueryOptions(companyId));
}

export function useBankingTransactionsQuery(
	accountId: string | null,
	filters?: TransactionFiltersInput,
) {
	return useQuery({
		...bankingTransactionsQueryOptions(accountId ?? "unselected", filters),
		enabled: Boolean(accountId),
	});
}

export function useCreateAccountMutation() {
	const queryClient = useQueryClient();
	const { companyId } = getTenantContext();

	return useMutation({
		mutationFn: async (payload: CreateBankAccountPayload) =>
			bankingApi.createAccount(payload),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: bankingKeys.accounts(companyId),
			});
			await queryClient.invalidateQueries({
				queryKey: bankingKeys.summary(companyId),
			});
		},
	});
}

export function useDeleteAccountMutation() {
	const queryClient = useQueryClient();
	const { companyId } = getTenantContext();

	return useMutation({
		mutationFn: async (accountId: string) =>
			bankingApi.deleteAccount(accountId),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: bankingKeys.accounts(companyId),
			});
			await queryClient.invalidateQueries({
				queryKey: bankingKeys.summary(companyId),
			});
		},
	});
}

export function useImportTransactionsMutation(accountId: string | null) {
	const queryClient = useQueryClient();
	const { companyId } = getTenantContext();

	return useMutation({
		mutationFn: async ({
			file,
			format,
		}: {
			file: File;
			format?: BankCsvFormat;
		}) => {
			if (!accountId) {
				throw new Error("No hay una cuenta bancaria seleccionada");
			}

			const result = await bankingApi.importTransactions(
				accountId,
				file,
				format,
			);
			return normalizeImportResult(result);
		},
		onSuccess: async () => {
			if (!accountId) return;
			await queryClient.invalidateQueries({
				queryKey: bankingKeys.transactionsRoot(accountId),
			});
			await queryClient.invalidateQueries({
				queryKey: bankingKeys.summary(companyId),
			});
		},
	});
}

export function useReconcileTransactionMutation(accountId: string | null) {
	const queryClient = useQueryClient();
	const { companyId } = getTenantContext();

	return useMutation({
		mutationFn: async ({
			txId,
			documentId,
			documentType,
		}: {
			txId: string;
			documentId?: string;
			documentType?: DocumentType;
		}) => bankingApi.reconcileTransaction(txId, documentId, documentType),
		onSuccess: async () => {
			if (!accountId) return;
			await queryClient.invalidateQueries({
				queryKey: bankingKeys.transactionsRoot(accountId),
			});
			await queryClient.invalidateQueries({
				queryKey: bankingKeys.summary(companyId),
			});
		},
	});
}

export function useAutoReconcileMutation(accountId: string | null) {
	const queryClient = useQueryClient();
	const { companyId } = getTenantContext();

	return useMutation({
		mutationFn: async () => {
			if (!accountId) {
				return {
					reconciledCount: 0,
					matches: [] satisfies ReconciliationMatch[],
				};
			}

			const result = await bankingApi.autoReconcile(accountId);
			return normalizeAutoReconcileResult(result);
		},
		onSuccess: async () => {
			if (!accountId) return;
			await queryClient.invalidateQueries({
				queryKey: bankingKeys.transactionsRoot(accountId),
			});
			await queryClient.invalidateQueries({
				queryKey: bankingKeys.summary(companyId),
			});
		},
	});
}
