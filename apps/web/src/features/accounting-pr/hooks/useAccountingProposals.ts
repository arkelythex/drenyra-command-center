import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { extractOkData } from "@/lib/api-helpers";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";

export interface JournalProposal {
	id: string;
	entryNumber: string;
	gloss: string;
	status: string;
	date: string;
	lines: Array<{
		accountId: string;
		description?: string;
		debit: number;
		credit: number;
	}>;
}

async function fetchProposals(companyId: string): Promise<JournalProposal[]> {
	const response = await fetch("/api/journal-entries?status=borrador", {
		credentials: "include",
		headers: { "X-Company-Id": companyId },
	});
	return extractOkData(await response.json(), "Failed to load proposals");
}

async function approveProposal(companyId: string, id: string) {
	const response = await fetch(`/api/journal-entries/${id}/approve`, {
		method: "POST",
		credentials: "include",
		headers: { "X-Company-Id": companyId },
	});
	return extractOkData(await response.json(), "Failed to approve proposal");
}

async function rejectProposal(companyId: string, id: string) {
	const response = await fetch(`/api/journal-entries/${id}/reject`, {
		method: "POST",
		credentials: "include",
		headers: { "X-Company-Id": companyId },
	});
	return extractOkData(await response.json(), "Failed to reject proposal");
}

export function useAccountingProposals() {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId ?? "";
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: ["accounting-pr", companyId],
		queryFn: () => fetchProposals(companyId),
		enabled: Boolean(companyId),
	});

	const approve = useMutation({
		mutationFn: (id: string) => approveProposal(companyId, id),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["accounting-pr", companyId] }),
	});

	const reject = useMutation({
		mutationFn: (id: string) => rejectProposal(companyId, id),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["accounting-pr", companyId] }),
	});

	return { ...query, approve, reject };
}
