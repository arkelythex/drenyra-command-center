import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import type { ReconciliationCandidate } from "../reconciliation.types";
import {
	confirmMatch,
	fetchBankTransactions,
	fetchMatches,
	summarize,
	toTransaction,
} from "../services/bank-reconciliation";

/**
 * Bank reconciliation workspace for the active company: movements from the
 * API, proposals for the selected one, and confirmation of a proposal.
 */
export function useReconciliationWorkspace() {
	const queryClient = useQueryClient();
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId ?? "";

	const listKey = ["bank-reconciliation", companyId] as const;
	const list = useQuery({
		queryKey: listKey,
		queryFn: () => fetchBankTransactions(companyId),
		enabled: Boolean(companyId),
	});
	const rows = list.data ?? [];

	const [selectedId, setSelectedTransactionId] = React.useState<string>();
	const [selectedCandidateId, setSelectedCandidateId] =
		React.useState<string>();

	const activeRow =
		rows.find((row) => row.id === selectedId) ??
		rows.find((row) => row.isReconciled !== true) ??
		rows[0];

	const matches = useQuery({
		queryKey: ["bank-reconciliation-matches", companyId, activeRow?.id],
		queryFn: () => fetchMatches(companyId, activeRow?.id ?? ""),
		enabled: Boolean(companyId && activeRow && activeRow.isReconciled !== true),
	});

	const transactions = rows.map((row) =>
		toTransaction(row, row.id === activeRow?.id ? matches.data : undefined),
	);
	const activeTransaction = transactions.find((tx) => tx.id === activeRow?.id);
	const activeCandidate =
		activeTransaction?.candidates.find((c) => c.id === selectedCandidateId) ??
		activeTransaction?.candidates[0];

	React.useEffect(() => {
		setSelectedCandidateId(undefined);
	}, [activeRow?.id]);

	const confirm = useMutation({
		mutationFn: (candidate: ReconciliationCandidate) =>
			confirmMatch(companyId, activeRow?.id ?? "", candidate),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
	});

	return {
		activeCandidate,
		activeTransaction,
		selectedTransactionId: activeRow?.id ?? "",
		setSelectedCandidateId,
		setSelectedTransactionId,
		transactions,
		summary: summarize(transactions),
		isLoading: list.isLoading,
		error: list.error ?? matches.error ?? null,
		hasCompany: Boolean(companyId),
		confirmCandidate: confirm.mutateAsync,
		isConfirming: confirm.isPending,
	};
}
