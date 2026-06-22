/**
 * RoadmapMvpPanel — Main orchestrator for the Copilot HITL dashboard (S1–S4).
 *
 * Composition root: wires together the three SRP hooks and renders the
 * modular component tree. Does NOT contain business logic — only
 * dialog state and event coordination.
 *
 * Responsibilities:
 * - Loading / error boundary for the snapshot query.
 * - Dialog open/close state for HITL decisions and timeline.
 * - Delegates all data fetching to specialized hooks.
 */

import { Bot, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useHitlDecision } from "../../hooks/useHitlDecision";
import { useRoadmapMvp } from "../../hooks/useRoadmapMvp";
import { useTimeline } from "../../hooks/useTimeline";
import { HitlDecisionDialog } from "../HitlDecisionDialog";
import { PhaseMetricsCard } from "../PhaseMetricsCard";
import { RecommendedActionCard } from "../RecommendedActionCard";
import { formatMoney } from "../shared/formatting";
import type { RoadmapDecisionType, RoadmapMvpAction } from "../shared/types";
import { TimelineDialog } from "../TimelineDialog";

// ── Loading / error states ────────────────────────────────────────────────

function PanelSkeleton() {
	return (
		<Card className="border-[var(--border-subtle)] bg-[var(--surface-1)]">
			<CardContent className="p-5 sm:p-6">
				<div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
					<Loader2 className="h-4 w-4 animate-spin" />
					Cargando roadmap MVP...
				</div>
			</CardContent>
		</Card>
	);
}

function PanelError({ period }: { period: string }) {
	return (
		<Card className="border-[var(--border-subtle)] bg-[var(--surface-1)]">
			<CardContent className="p-5 sm:p-6 text-sm text-[var(--text-secondary)]">
				No se pudo cargar el panel roadmap MVP para {period}.
			</CardContent>
		</Card>
	);
}

// ── Phase metric helpers ──────────────────────────────────────────────────

function phase1Details(snapshot: ReturnType<typeof useRoadmapMvp>["snapshot"]) {
	if (!snapshot) return [];
	const p = snapshot.phase1;
	return [
		`SUNAT ${p.sunatStatus} · ${p.openIssues} issues · ${p.blockingIssues} blockers`,
		`Reproducibilidad: ${p.ledgerReproducible ? "OK" : "Con drift"} (${p.reproducibilityCoverage})`,
	];
}

function phase2Details(snapshot: ReturnType<typeof useRoadmapMvp>["snapshot"]) {
	if (!snapshot) return [];
	const p = snapshot.phase2;
	return [
		`Ingresos ${formatMoney(p.periodIncome)} · Gastos ${formatMoney(p.periodExpense)}`,
		`Brecha de caja ${formatMoney(p.cashflowGap)} · Overdue ${p.overdueInvoices}`,
	];
}

// ── Main component ────────────────────────────────────────────────────────

export function RoadmapMvpPanel() {
	// ── Hooks (each is single-responsibility) ──────────────────────────────
	const roadmap = useRoadmapMvp();
	const hitl = useHitlDecision();
	const timeline = useTimeline();

	// ── Local dialog state ─────────────────────────────────────────────────
	const [hitlDialogState, setHitlDialogState] = useState<{
		action: RoadmapMvpAction | null;
		decision: RoadmapDecisionType | null;
	}>({ action: null, decision: null });
	const [hitlDialogOpen, setHitlDialogOpen] = useState(false);
	const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);

	// ── Derived sets for button disabled state ──────────────────────────────
	const runningIds = new Set(
		roadmap.runningActionId ? [roadmap.runningActionId] : [],
	);
	const decidingIds = new Set(
		hitl.decidingActionId ? [hitl.decidingActionId] : [],
	);

	// ── Event handlers ─────────────────────────────────────────────────────
	const openHitlDialog = (
		action: RoadmapMvpAction,
		decision: RoadmapDecisionType,
	) => {
		setHitlDialogState({ action, decision });
		setHitlDialogOpen(true);
	};

	const handleDecide = async (
		action: RoadmapMvpAction,
		decision: RoadmapDecisionType,
		reason: string,
	) => {
		await hitl.decide({ action, decision, reason });
		setHitlDialogOpen(false);
		setHitlDialogState({ action: null, decision: null });
	};

	const handleOpenTimeline = (traceId: string) => {
		timeline.openTimeline(traceId);
		setTimelineDialogOpen(true);
	};

	// ── Loading / error ────────────────────────────────────────────────────
	if (roadmap.isLoading) return <PanelSkeleton />;
	if (!roadmap.snapshot || roadmap.isError)
		return <PanelError period={roadmap.period} />;

	const { snapshot } = roadmap;

	return (
		<>
			<Card className="border-[var(--border-subtle)] bg-[var(--surface-1)]">
				<CardHeader className="border-b border-[var(--border-subtle)] px-5 py-4 sm:px-6">
					<CardTitle>Roadmap MVP en ejecución</CardTitle>
					<CardDescription>
						Phase 1 (confiabilidad contable Perú) + Phase 2 (copilot accionable)
						para {snapshot.period}.
					</CardDescription>
				</CardHeader>

				<CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
					{/* Phase metrics */}
					<PhaseMetricsCard
						title="Phase 1 · Reliability"
						score={snapshot.phase1.reliabilityScore}
						icon={ShieldCheck}
						subtitle={snapshot.phase1.objective}
						details={phase1Details(snapshot)}
					/>
					<PhaseMetricsCard
						title="Phase 2 · Copilot"
						score={snapshot.phase2.insightScore}
						icon={Bot}
						subtitle={snapshot.phase2.objective}
						details={phase2Details(snapshot)}
					/>

					{/* Recommended actions */}
					<section className="space-y-3 lg:col-span-2">
						<p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
							Acciones recomendadas
						</p>

						{snapshot.phase2.recommendedActions.length === 0 && (
							<p className="py-4 text-center text-sm text-[var(--text-tertiary)]">
								No hay acciones recomendadas para este período.
							</p>
						)}

						{snapshot.phase2.recommendedActions.map((action) => (
							<RecommendedActionCard
								key={action.id}
								action={action}
								runningIds={runningIds}
								decidingIds={decidingIds}
								onRun={roadmap.runAction}
								onOpenHitlDialog={openHitlDialog}
								onOpenTimeline={handleOpenTimeline}
							/>
						))}

						{/* Last run result */}
						{roadmap.lastRunResult && (
							<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/70 px-3 py-2 text-sm text-[var(--text-secondary)]">
								{roadmap.lastRunResult.message}
								{roadmap.lastRunResult.runId
									? ` · Run ${roadmap.lastRunResult.runId} (${roadmap.lastRunResult.runStatus ?? "n/a"})`
									: ""}
							</div>
						)}

						{/* HITL decision error */}
						{hitl.error && (
							<div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
								Error al registrar decisión:{" "}
								{hitl.error instanceof Error
									? hitl.error.message
									: "Error desconocido"}
							</div>
						)}
					</section>
				</CardContent>
			</Card>

			{/* Dialogs — rendered at root level to avoid stacking context issues */}
			<HitlDecisionDialog
				action={hitlDialogState.action}
				decision={hitlDialogState.decision}
				open={hitlDialogOpen}
				onOpenChange={setHitlDialogOpen}
				onDecide={handleDecide}
				isDeciding={hitl.isDeciding}
			/>

			<TimelineDialog
				timeline={timeline.timeline}
				open={timelineDialogOpen}
				onOpenChange={setTimelineDialogOpen}
				isLoading={timeline.isLoading}
				isError={timeline.isError ?? false}
			/>
		</>
	);
}
