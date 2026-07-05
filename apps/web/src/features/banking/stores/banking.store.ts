import { create } from "zustand";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import type { DocumentType } from "../api/banking.api";
import {
	useAutoReconcileMutation,
	useReconcileTransactionMutation,
} from "../hooks/useBankingQueries";
import type {
	BankAccount,
	BankingActions,
	BankingState,
	BankTransaction,
	ReconciliationMatch,
	ReconciliationResult,
} from "./banking.store.types";
import { initialState } from "./banking.store.types";

export type {
	BankAccount,
	BankingState,
	BankTransaction,
	ReconciliationMatch,
	ReconciliationResult,
} from "./banking.store.types";

export const useBankingStore = create<BankingState & BankingActions>()(
	(set) => ({
		...initialState,

		selectAccount: (id: string) => {
			set({ selectedAccountId: id });
		},

		clearSelectedAccount: () => {
			set({ selectedAccountId: null });
		},

		setLastReconciliationResult: (lastReconciliationResult) => {
			set({ lastReconciliationResult });
		},

		clearLastReconciliationResult: () => {
			set({ lastReconciliationResult: null });
		},

		reset: () => set(initialState),
	}),
);

export const useBankingSelection = () =>
	useBankingStore((state) => ({
		selectedAccountId: state.selectedAccountId,
		selectAccount: state.selectAccount,
		clearSelectedAccount: state.clearSelectedAccount,
	}));

export const useBankingReconciliationState = () =>
	useBankingStore((state) => ({
		lastReconciliationResult: state.lastReconciliationResult,
		setLastReconciliationResult: state.setLastReconciliationResult,
		clearLastReconciliationResult: state.clearLastReconciliationResult,
	}));

export function useBankingReconciliation(accountId?: string | null) {
	const {
		companyContext: { companyId },
	} = useActiveCompanyContext();
	const selectedAccountId = useBankingStore((state) => state.selectedAccountId);
	const {
		lastReconciliationResult,
		setLastReconciliationResult,
		clearLastReconciliationResult,
	} = useBankingReconciliationState();
	const resolvedAccountId = accountId ?? selectedAccountId;
	const scopedLastReconciliationResult =
		lastReconciliationResult &&
		lastReconciliationResult.companyId === companyId &&
		lastReconciliationResult.accountId === resolvedAccountId
			? {
					reconciledCount: lastReconciliationResult.reconciledCount,
					matches: lastReconciliationResult.matches,
				}
			: null;
	const reconcileMutation = useReconcileTransactionMutation(resolvedAccountId);
	const autoReconcileMutation = useAutoReconcileMutation(resolvedAccountId);

	return {
		reconcileTransaction: async (
			txId: string,
			documentId?: string,
			documentType?: DocumentType,
		) => {
			await reconcileMutation.mutateAsync({ txId, documentId, documentType });
		},
		autoReconcile: async () => {
			const { reconciledCount, matches } =
				await autoReconcileMutation.mutateAsync();

			if (!resolvedAccountId) {
				clearLastReconciliationResult();
				return reconciledCount;
			}

			const scopedResult: ReconciliationResult = {
				companyId,
				accountId: resolvedAccountId,
				reconciledCount,
				matches,
			};
			setLastReconciliationResult(scopedResult);
			return scopedResult.reconciledCount;
		},
		lastReconciliationResult: scopedLastReconciliationResult,
		clearLastReconciliationResult,
		isLoading: reconcileMutation.isPending || autoReconcileMutation.isPending,
	};
}
