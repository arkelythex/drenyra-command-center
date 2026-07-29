import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EvidenceLineagePanel } from "../evidence/components/EvidenceLineagePanel";
import { AgentCostDisplay } from "./AgentCostDisplay";
import { AgentProgressBar } from "./AgentProgressBar";
import { AgentRiskBadge } from "./AgentRiskBadge";
import type { AgentSessionStatusDTO } from "./agents.types";

export interface AgentTabPanelProps {
	session?: AgentSessionStatusDTO | null;
	isLoading?: boolean;
	error?: string | null;
	onRetry?: () => void;
}

function AgentTabPanelSkeleton() {
	return (
		<div className="animate-pulse space-y-6 p-6">
			<div className="flex items-center gap-3">
				<div className="h-5 w-32 rounded bg-[var(--surface-3)]" />
				<div className="h-6 w-20 rounded-full bg-[var(--surface-3)]" />
			</div>
			<div className="space-y-2">
				<div className="h-3 w-48 rounded bg-[var(--surface-3)]" />
				<div className="h-1.5 rounded-full bg-[var(--surface-3)]" />
			</div>
			<div className="space-y-3">
				{[1, 2, 3].map((i) => (
					<div key={i} className="flex items-center gap-3">
						<div className="h-4 w-4 rounded-full bg-[var(--surface-3)]" />
						<div className="h-3 flex-1 rounded bg-[var(--surface-3)]" />
					</div>
				))}
			</div>
		</div>
	);
}

export function AgentTabPanel({
	session,
	isLoading,
	error,
	onRetry,
}: AgentTabPanelProps) {
	// No selection
	if (!session && !isLoading && !error) {
		return (
			<div className="flex items-center justify-center rounded-2xl border border-[var(--border-subtle)] p-12">
				<div className="text-center">
					<Loader2
						size={24}
						className="mx-auto mb-2 text-[var(--text-tertiary)]"
					/>
					<p className="text-sm text-[var(--text-tertiary)]">
						Selecciona un agente para ver los detalles
					</p>
				</div>
			</div>
		);
	}

	// Loading
	if (isLoading) {
		return <AgentTabPanelSkeleton />;
	}

	// Error
	if (error) {
		return (
			<div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)]0/5 p-8 text-center">
				<AlertCircle size={24} className="text-[var(--color-danger)]" />
				<p className="text-sm text-[var(--text-secondary)]">{error}</p>
				{onRetry && (
					<Button variant="secondary" size="sm" onClick={onRetry}>
						<RefreshCw size={14} className="mr-1.5" />
						Reintentar
					</Button>
				)}
			</div>
		);
	}

	if (!session) return null;

	// Data
	return (
		<div className="space-y-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6">
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="text-lg font-semibold text-[var(--text-primary)]">
						{session.agentName}
					</h2>
					<p className="text-xs text-[var(--text-tertiary)]">
						{session.clientName} · {session.period}
					</p>
				</div>
				<AgentRiskBadge risk={session.risk} />
			</div>

			{/* Progress */}
			<AgentProgressBar
				progress={session.progress}
				status={session.status}
				phase={session.phase}
			/>

			{/* Stats */}
			<div className="grid grid-cols-3 gap-4">
				<div className="rounded-xl bg-[var(--surface-2)] p-3">
					<p className="text-2xs text-[var(--text-tertiary)]">Cambios</p>
					<p className="text-sm font-semibold text-[var(--text-primary)]">
						{session.changesProposed}
					</p>
				</div>
				<div className="rounded-xl bg-[var(--surface-2)] p-3">
					<p className="text-2xs text-[var(--text-tertiary)]">Evidencia</p>
					<p className="text-sm font-semibold text-[var(--text-primary)]">
						{session.evidenceCollected}
					</p>
				</div>
				<div className="rounded-xl bg-[var(--surface-2)] p-3">
					<p className="text-2xs text-[var(--text-tertiary)]">Costo</p>
					<AgentCostDisplay
						elapsedMs={session.elapsedMs}
						tokensUsed={session.tokensUsed}
					/>
				</div>
			</div>

			{/* Evidence lineage */}
			<EvidenceLineagePanel entityType="agent_run" entityId={session.id} />

			{/* Steps / Timeline */}
			{session.steps.length > 0 && (
				<div>
					<h3 className="mb-3 text-xs font-semibold text-[var(--text-primary)]">
						Pasos
					</h3>
					<div className="space-y-0">
						{session.steps.map((step, idx) => {
							const isLast = idx === session.steps.length - 1;
							const isCurrent = step.status === "running";
							const isDone = step.status === "completed";
							const isFailed = step.status === "failed";

							return (
								<div key={step.id} className="relative flex gap-3">
									{/* Connector line */}
									<div className="flex flex-col items-center">
										<div
											className={`z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
												isCurrent
													? "border-[var(--color-primary)]"
													: isDone
														? "border-[var(--color-success)] bg-[var(--color-success)]"
														: isFailed
															? "border-[var(--color-danger)] bg-[var(--color-danger-soft)]0"
															: "border-[var(--border-subtle)] bg-[var(--surface-2)]"
											}`}
										>
											{isDone && (
												<span className="text-2xs text-[var(--text-inverse)]">
													✓
												</span>
											)}
											{isFailed && (
												<span className="text-2xs text-[var(--text-inverse)]">
													✕
												</span>
											)}
											{isCurrent && (
												<span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-primary)]" />
											)}
										</div>
										{!isLast && (
											<div className="h-full w-px bg-[var(--border-subtle)]" />
										)}
									</div>

									{/* Step content */}
									<div className="pb-6 pt-0.5">
										<p
											className={`text-xs font-medium ${
												isCurrent
													? "text-[var(--color-primary)]"
													: isDone
														? "text-[var(--text-primary)]"
														: isFailed
															? "text-[var(--color-danger)]"
															: "text-[var(--text-tertiary)]"
											}`}
										>
											{step.label}
										</p>
										{step.duration !== undefined && (
											<p className="text-2xs text-[var(--text-tertiary)]">
												{step.duration > 0
													? `${Math.round(step.duration / 1000)}s`
													: "en progreso"}
											</p>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
