import { useQuery } from "@tanstack/react-query";
import { extractOkData } from "@/lib/api-helpers";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";

export interface InboxDashboard {
	companyName: string;
	companyRuc: string;
	period: string;
	closeStatus: string;
	closeDeadline: string;
	phaseProgress: Array<{
		name: string;
		state: "completed" | "active" | "blocked" | "pending";
		evidenceCount: number;
	}>;
	primaryDecision: {
		id: string;
		title: string;
		cause: string;
		impact: string;
		evidenceSummary: string;
		deadline: string;
		priority: string;
		module: string;
		actionTo: string;
	};
	secondaryDecisions: Array<{
		id: string;
		title: string;
		impact: string;
		priority: string;
		deadline: string;
		module: string;
		actionTo: string;
	}>;
	approvals: Array<{
		id: string;
		title: string;
		type: string;
		confidence: string;
		evidence: string;
	}>;
	agents: Array<{
		id: string;
		name: string;
		status: "running" | "waiting" | "completed";
		operation: string;
		evidence: string;
		finding: string;
		nextStep: string;
	}>;
	recommendations: Array<{
		id: string;
		title: string;
		confidence: string;
		reason: string;
		scope: string;
		closeImpact: string;
	}>;
	recentActivity: Array<{
		id: string;
		time: string;
		description: string;
		evidence: string;
	}>;
	companiesAttention: Array<{
		id: string;
		name: string;
		ruc: string;
		riskCause: string;
		blockers: number;
		approvals: number;
	}>;
	blockerCount: number;
	approvalCount: number;
}

export function useInboxDashboard() {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId ?? "";

	return useQuery({
		queryKey: ["inbox-dashboard", companyId],
		queryFn: async (): Promise<InboxDashboard> => {
			const params = new URLSearchParams({ companyId });
			const res = await fetch(`/api/dashboard/inbox?${params.toString()}`, {
				credentials: "include",
			});
			return extractOkData(await res.json(), "Failed to load inbox");
		},
		enabled: Boolean(companyId),
	});
}
