import {
	AlertCircle,
	BookOpen,
	CheckCircle2,
	FileText,
	HelpCircle,
	Loader,
	ScrollText,
	Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
	AgentActivityEvent,
	AgentSemanticState,
} from "../../types/agent-activity";
import { AgentStateBadge } from "./AgentStateBadge";

interface AgentActivityFeedProps {
	agentName: string;
	state: AgentSemanticState;
	events: AgentActivityEvent[];
	elapsedMs: number;
	/** If true, show only the most recent events (default: 50) */
	maxEvents?: number;
	onPause?: () => void;
	onCancel?: () => void;
	onResume?: () => void;
	className?: string;
}

const eventIcons: Record<string, typeof Search> = {
	tool_executed: ScrollText,
	source_consulted: Search,
	document_read: FileText,
	rule_applied: BookOpen,
	result_produced: CheckCircle2,
	decision_pending: HelpCircle,
	error: AlertCircle,
};

const eventColors: Record<string, string> = {
	tool_executed: "text-blue-500",
	source_consulted: "text-cyan-500",
	document_read: "text-violet-500",
	rule_applied: "text-amber-500",
	result_produced: "text-green-500",
	decision_pending: "text-purple-500",
	error: "text-red-500",
};

function formatElapsed(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${minutes}m ${secs}s`;
}

function formatTime(iso: string): string {
	try {
		const date = new Date(iso);
		return date.toLocaleTimeString("es-PE", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	} catch {
		return iso;
	}
}

/**
 * AgentActivityFeed — real-time activity feed for a running agent.
 *
 * Shows tools executed, sources consulted, documents read, rules applied.
 * Does NOT show internal reasoning chains — only concrete actions.
 * Action buttons (pause/cancel/resume) shown when agent is active.
 */
export function AgentActivityFeed({
	agentName,
	state,
	events,
	elapsedMs,
	maxEvents = 50,
	onPause,
	onCancel,
	onResume,
	className,
}: AgentActivityFeedProps) {
	const isActive = state === "working" || state === "verifying";
	const isBlocked =
		state === "blocked" ||
		state === "waiting_for_input" ||
		state === "waiting_for_approval";

	const displayed = events.slice(-maxEvents);

	return (
		<div className={cn("flex flex-col", className)}>
			{/* Header */}
			<div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2">
				<div className="flex items-center gap-2 min-w-0">
					<AgentStateBadge state={state} compact />
					<span className="truncate text-xs font-medium text-[var(--text-primary)]">
						{agentName}
					</span>
					<span className="shrink-0 text-[10px] text-[var(--text-muted)]">
						{formatElapsed(elapsedMs)}
					</span>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-1">
					{isActive && onPause && (
						<button
							type="button"
							onClick={onPause}
							className="flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
							title="Pausar agente"
						>
							⏸ Pausar
						</button>
					)}
					{isBlocked && onResume && (
						<button
							type="button"
							onClick={onResume}
							className="flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]"
							title="Reanudar agente"
						>
							▶ Reanudar
						</button>
					)}
					{(isActive || isBlocked) && onCancel && (
						<button
							type="button"
							onClick={onCancel}
							className="flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-medium text-red-500 transition-colors hover:bg-red-500/10"
							title="Cancelar agente"
						>
							✕ Cancelar
						</button>
					)}
				</div>
			</div>

			{/* Activity list */}
			<div className="flex-1 overflow-y-auto">
				{displayed.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12">
						<Loader
							size={20}
							className="animate-spin text-[var(--text-muted)]"
						/>
						<p className="mt-2 text-xs text-[var(--text-muted)]">
							Esperando actividad del agente...
						</p>
					</div>
				) : (
					<div className="space-y-0">
						{displayed.map((event) => {
							const EventIcon = eventIcons[event.type] ?? Search;
							const colorClass = eventColors[event.type] ?? "text-gray-500";

							return (
								<div
									key={event.id}
									className="flex items-start gap-2 border-b border-[var(--border-subtle)] px-3 py-2 last:border-0"
								>
									<div
										className={cn(
											"mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded",
											colorClass,
										)}
									>
										<EventIcon size={12} />
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span className="truncate text-xs font-medium text-[var(--text-primary)]">
												{event.label}
											</span>
											{event.riskLevel && event.riskLevel !== "R0" && (
												<span
													className={cn(
														"shrink-0 rounded px-1 py-0.5 text-[8px] font-bold uppercase",
														event.riskLevel === "R1"
															? "bg-blue-500/10 text-blue-500"
															: event.riskLevel === "R2"
																? "bg-amber-500/10 text-amber-500"
																: "bg-red-500/10 text-red-500",
													)}
												>
													{event.riskLevel}
												</span>
											)}
										</div>
										<p className="truncate text-[10px] text-[var(--text-muted)]">
											{event.description}
										</p>
										<div className="mt-0.5 flex items-center gap-2">
											{event.source && (
												<span className="rounded bg-[var(--surface-2)] px-1 py-0.5 text-[9px] text-[var(--text-secondary)]">
													{event.source}
												</span>
											)}
											<span className="text-[9px] text-[var(--text-muted)]">
												{formatTime(event.timestamp)}
											</span>
											{event.duration && (
												<span className="text-[9px] text-[var(--text-muted)]">
													{event.duration}ms
												</span>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Footer with event count */}
			{events.length > 0 && (
				<div className="border-t border-[var(--border-subtle)] px-3 py-1.5 text-[10px] text-[var(--text-muted)]">
					{events.length} eventos
					{events.length > maxEvents ? ` (mostrando últimos ${maxEvents})` : ""}
				</div>
			)}
		</div>
	);
}
