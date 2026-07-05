import { queryOptions } from "@tanstack/react-query";
import { bankingApi } from "./banking.api";
import { bankingKeys } from "./query-keys";

interface TransactionFiltersInput {
	startDate?: string;
	endDate?: string;
}

export function bankingAccountsQueryOptions(companyId: string) {
	return queryOptions({
		queryKey: bankingKeys.accounts(companyId),
		queryFn: async () => {
			const result = await bankingApi.getAccounts();
			if (!result.ok) throw new Error(result.error);
			return result.data;
		},
		staleTime: 60_000,
	});
}

export function bankingTransactionsQueryOptions(
	accountId: string,
	filters?: TransactionFiltersInput,
) {
	return queryOptions({
		queryKey: bankingKeys.transactions(accountId, filters),
		queryFn: async () => {
			const result = await bankingApi.getTransactions(accountId, filters);
			if (!result.ok) throw new Error(result.error);
			return result.data;
		},
		staleTime: 60_000,
	});
}
