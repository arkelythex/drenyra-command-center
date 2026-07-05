import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useFinancialHaptics, useHaptics } from "@/hooks/useHaptics";
import { presentError } from "@/lib/error-messages";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { n } from "@/lib/utils";
import type { BankingTab } from "../components/banking-view/constants";
import type { TransactionFiltersValue } from "../components/transactions";
import {
	useBankingReconciliation,
	useBankingSelection,
} from "../stores/banking.store";
import {
	useBankingAccountsQuery,
	useBankingTransactionsQuery,
} from "./useBankingQueries";

export function useBankingViewController() {
	const {
		companyContext: { companyId },
	} = useActiveCompanyContext();
	const { selectedAccountId, selectAccount, clearSelectedAccount } =
		useBankingSelection();
	const { trigger } = useHaptics();
	const financialHaptics = useFinancialHaptics();

	const [activeTab, setActiveTab] = useState<BankingTab>("movimientos");
	const [searchQuery, setSearchQuery] = useState("");
	const [filters, setFilters] = useState<TransactionFiltersValue>({});
	const [appliedFilters, setAppliedFilters] = useState<TransactionFiltersValue>(
		{},
	);

	const { data: accounts = [], isLoading: accountsLoading } =
		useBankingAccountsQuery(companyId);
	const isSelectedAccountValid = selectedAccountId
		? accounts.some((account) => account.id === selectedAccountId)
		: false;
	const fallbackAccountId =
		accounts.find((account) => account.isDefault)?.id ??
		accounts[0]?.id ??
		null;
	const effectiveSelectedAccountId = isSelectedAccountValid
		? selectedAccountId
		: fallbackAccountId;

	useEffect(() => {
		if (accountsLoading) return;

		if (accounts.length === 0) {
			if (selectedAccountId) {
				clearSelectedAccount();
			}
			return;
		}

		if (
			effectiveSelectedAccountId &&
			selectedAccountId !== effectiveSelectedAccountId
		) {
			selectAccount(effectiveSelectedAccountId);
		}
	}, [
		accounts.length,
		accountsLoading,
		clearSelectedAccount,
		effectiveSelectedAccountId,
		selectAccount,
		selectedAccountId,
	]);
	const { reconcileTransaction, isLoading: mutationLoading } =
		useBankingReconciliation(effectiveSelectedAccountId);
	const { data: transactions = [], isLoading: transactionsLoading } =
		useBankingTransactionsQuery(effectiveSelectedAccountId, appliedFilters);
	const unreconciledCount = transactions.filter(
		(transaction) => !transaction.isReconciled,
	).length;

	const selectedAccount =
		accounts.find((account) => account.id === effectiveSelectedAccountId) ??
		accounts[0] ??
		null;

	const balanceValue = parseFloat(selectedAccount?.currentBalance ?? "0");
	const balanceFormatter = (value: number) =>
		n(value, selectedAccount?.currency);

	const manualReviewRequired = unreconciledCount > 0;
	const evidenceHash = `BNK-${effectiveSelectedAccountId ?? "NA"}-${transactions.length}-${unreconciledCount}`;
	const isLoading = accountsLoading || transactionsLoading || mutationLoading;

	const handleTabChange = (id: string) => {
		trigger("light");
		if (id === "movimientos" || id === "cuentas" || id === "tasas") {
			setActiveTab(id);
		}
	};

	const handleAccountSelect = (id: string) => {
		trigger("medium");
		selectAccount(id);
	};

	const handleApplyFilters = () => {
		setAppliedFilters(filters);
	};

	const handleManualReconcile = async (txId: string) => {
		try {
			await reconcileTransaction(txId);
			toast.success("Transacción conciliada");
		} catch (error) {
			const presentation = presentError(error, "No se pudo conciliar");
			toast.error(presentation.title, {
				description: presentation.description,
			});
		}
	};

	const handleRegisterFunds = () => financialHaptics.approval();

	return {
		activeTab,
		searchQuery,
		filters,
		trigger,
		accounts,
		selectedAccountId: effectiveSelectedAccountId,
		transactions,
		unreconciledCount,
		isLoading,
		balanceValue,
		balanceFormatter,
		manualReviewRequired,
		evidenceHash,
		handleTabChange,
		handleAccountSelect,
		handleApplyFilters,
		handleManualReconcile,
		handleRegisterFunds,
		setSearchQuery,
		setFilters,
	};
}
