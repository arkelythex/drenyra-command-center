import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAgentsWindowStore } from "./agents.store";
import { agentsListQueryOptions } from "./query-options";
import { agentKeys } from "./query-keys";
import { AgentGrid } from "./AgentGrid";
import { AgentFilterBar } from "./AgentFilterBar";
import { AgentTabBar } from "./AgentTabBar";
import { AgentTabPanel } from "./AgentTabPanel";
import { LayoutGrid, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export function AgentsWindowPage() {
	const queryClient = useQueryClient();
	const filters = useAgentsWindowStore((s) => s.filters);
	const gridMode = useAgentsWindowStore((s) => s.gridMode);
	const selectedSessionId = useAgentsWindowStore((s) => s.selectedSessionId);
	const selectSession = useAgentsWindowStore((s) => s.selectSession);
	const setGridMode = useAgentsWindowStore((s) => s.setGridMode);
	const resetFilters = useAgentsWindowStore((s) => s.resetFilters);

	const { data, isLoading, isError, error, refetch } = useQuery(
		agentsListQueryOptions(filters),
	);

	const sessions = data?.data ?? [];
	const selectedSession =
		sessions.find((s) => s.id === selectedSessionId) ?? null;
	const hasActiveFilters = Object.values(filters).some(Boolean);

	return (
		<div className="flex h-full flex-1 flex-col overflow-hidden bg-[var(--surface-1)]">
			<div className="flex flex-1 flex-col gap-4 overflow-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
				{/* Header */}
				<div className="flex items-center justify-between gap-4">
					<div>
						<h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
							Agentes
						</h1>
						<p className="text-xs text-[var(--text-tertiary)]">
							Sesiones activas de agentes fiscales
						</p>
					</div>

					{/* Grid/Tab toggle */}
					<div className="flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-0.5">
						<button
							type="button"
							onClick={() => setGridMode("grid")}
							className={cn(
								"flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-2xs font-medium transition-colors",
								gridMode === "grid"
									? "bg-[var(--surface-1)] text-[var(--text-primary)] shadow-sm"
									: "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
							)}
						>
							<LayoutGrid size={12} />
							Grid
						</button>
						<button
							type="button"
							onClick={() => setGridMode("tabs")}
							className={cn(
								"flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-2xs font-medium transition-colors",
								gridMode === "tabs"
									? "bg-[var(--surface-1)] text-[var(--text-primary)] shadow-sm"
									: "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
							)}
						>
							<FolderOpen size={12} />
							Tabs
						</button>
					</div>
				</div>

				{/* Filters */}
				<AgentFilterBar />

				{/* Content */}
				{gridMode === "tabs" ? (
					<div className="flex flex-1 flex-col">
						<AgentTabBar sessions={sessions} />
						<div className="flex-1 overflow-auto">
							<AgentTabPanel
								session={selectedSession}
								isLoading={isLoading}
								error={error instanceof Error ? error.message : null}
								onRetry={() => refetch()}
							/>
						</div>
					</div>
				) : (
					<div className="flex-1 overflow-auto">
						<AgentGrid
							sessions={sessions}
							isLoading={isLoading}
							error={error instanceof Error ? error : null}
							onSelectSession={(id: string) => {
								selectSession(selectedSessionId === id ? null : id);
							}}
							selectedId={selectedSessionId}
							onRetry={() => {
								queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
								refetch();
							}}
							isEmptyFiltered={
								!isLoading &&
								!isError &&
								sessions.length === 0 &&
								hasActiveFilters
							}
							onClearFilters={resetFilters}
						/>

						{/* Detail panel when session selected in grid mode */}
						{selectedSession && (
							<div className="mt-4">
								<AgentTabPanel session={selectedSession} />
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
