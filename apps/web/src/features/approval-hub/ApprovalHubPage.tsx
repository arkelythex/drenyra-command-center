import { useMemo, useState } from "react";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { useDrenyraApprovals } from "@/features/drenyra-workspace";
import { mapToApprovalItem } from "./ApprovalHubPage.data";
import { ApprovalHubHeader } from "./components/ApprovalHubHeader";
import { ApprovalHubList } from "./components/ApprovalHubList";

export function ApprovalHubPage() {
	const [filter, setFilter] = useState<
		"ALL" | "PENDING" | "APPROVED" | "REJECTED"
	>("PENDING");
	const [selectedModule, setSelectedModule] = useState<string | "ALL">("ALL");
	const userId = useMemo(
		() => useAuthStore.getState().user?.id ?? "current-user",
		[],
	);
	const { approvals, isLoading, approve, reject } = useDrenyraApprovals();

	const items = (approvals ?? []).map(mapToApprovalItem);

	const filtered = items.filter((a) => {
		const matchesStatus = filter === "ALL" || a.status === filter;
		const matchesModule =
			selectedModule === "ALL" || a.module === selectedModule;
		return matchesStatus && matchesModule;
	});

	const modules = ["ALL", ...new Set(items.map((a) => a.module))];
	const pendingCount = items.filter((a) => a.status === "PENDING").length;
	const urgentCount = items.filter((a) => a.urgency === "URGENT").length;
	const highRiskCount = items.filter(
		(a) => a.riskLevel === "HIGH" || a.riskLevel === "CRITICAL",
	).length;

	return (
		<div className="flex-1 overflow-auto custom-scrollbar bg-[var(--surface-1)]">
			<div className="mx-auto w-full max-w-[1200px] p-4 sm:p-6 lg:p-10">
				<div className="min-w-0 space-y-8">
					<ApprovalHubHeader
						isLoading={isLoading}
						pendingCount={pendingCount}
						highRiskCount={highRiskCount}
						urgentCount={urgentCount}
						filter={filter}
						onFilterChange={setFilter}
						selectedModule={selectedModule}
						onModuleChange={setSelectedModule}
						modules={modules}
					/>
					<ApprovalHubList
						items={filtered}
						isLoading={isLoading}
						onApprove={(id) => approve(id, userId, "reviewer")}
						onReject={(id) => reject(id, userId, "Rechazado por usuario")}
					/>
				</div>
			</div>
		</div>
	);
}
