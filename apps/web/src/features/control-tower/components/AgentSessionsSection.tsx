import { useQuery } from "@tanstack/react-query";
import { Bot } from "lucide-react";
import { AgentTabBar } from "@/features/agents/AgentTabBar";
import { AgentTabPanel } from "@/features/agents/AgentTabPanel";
import { useAgentsWindowStore } from "@/features/agents/agents.store";
import { agentsListQueryOptions } from "@/features/agents/query-options";

export function AgentSessionsSection() {
	const { data, isLoading } = useQuery(agentsListQueryOptions({}));
	const sessions = data?.data ?? [];
	const selectedSessionId = useAgentsWindowStore((s) => s.selectedSessionId);
	const selectedSession =
		sessions.find((s) => s.id === selectedSessionId) ?? null;

	return (
		<section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 space-y-4">
			<div className="flex items-center gap-2">
				<Bot size={18} className="text-[var(--color-info)]" />
				<h2 className="text-sm font-bold text-[var(--text-primary)]">
					Actividad de Agentes
				</h2>
			</div>

			{isLoading ? (
				<p className="text-xs text-[var(--text-tertiary)]">
					Cargando sesiones...
				</p>
			) : sessions.length === 0 ? (
				<p className="text-xs text-[var(--text-tertiary)]">
					Sin sesiones activas
				</p>
			) : (
				<div className="space-y-2">
					<AgentTabBar sessions={sessions} />
					{selectedSession && (
						<div className="pt-2">
							<AgentTabPanel session={selectedSession} />
						</div>
					)}
				</div>
			)}
		</section>
	);
}
