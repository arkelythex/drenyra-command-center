import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/workspace-context";
import { CompanySwitcher } from "./CompanySwitcher";
import { PeriodSwitcher } from "./PeriodSwitcher";
import { WorkspaceIntentSwitcher } from "./WorkspaceIntentSwitcher";

const MOCK_COMPANIES = [
	{
		id: "1",
		name: "Arkelythex SAC",
		ruc: "20123456789",
		organizationId: "org-1",
	},
	{
		id: "2",
		name: "Otra Empresa SRL",
		ruc: "20987654321",
		organizationId: "org-1",
	},
];

/**
 * WorkspaceTopBar — top bar with company/period/intent switchers.
 *
 * Shown in workspace routes. Responsive: collapses on mobile.
 * Uses the workspace context for state and actions.
 */
export function WorkspaceTopBar() {
	const { workspace, switchCompany, switchPeriod, switchIntent } =
		useWorkspace();

	return (
		<div
			className={cn(
				"flex items-center gap-1 border-b border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-1.5",
				"overflow-x-auto scrollbar-none",
			)}
		>
			{/* Company switcher */}
			<CompanySwitcher
				companies={MOCK_COMPANIES}
				activeCompany={workspace?.company ?? null}
				onSelect={switchCompany}
			/>

			{/* Separator */}
			<div className="mx-2 h-5 w-px bg-[var(--border-subtle)] shrink-0" />

			{/* Period switcher */}
			<PeriodSwitcher
				activePeriod={workspace?.period ?? null}
				onSelect={switchPeriod}
			/>

			{/* Separator */}
			<div className="mx-2 h-5 w-px bg-[var(--border-subtle)] shrink-0 max-sm:hidden" />

			{/* Intent switcher */}
			<div className="max-sm:hidden">
				<WorkspaceIntentSwitcher
					activeIntent={workspace?.intent ?? null}
					onSelect={switchIntent}
				/>
			</div>
		</div>
	);
}
