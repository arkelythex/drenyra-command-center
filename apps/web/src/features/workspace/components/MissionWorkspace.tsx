import { useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useAccountingMission } from "../hooks/useAccountingMission";
import { WorkspaceTopBar } from "@/components/workbench/WorkspaceTopBar";
import {
	CheckCircle,
	Loader2,
	AlertTriangle,
	ThumbsUp,
	ThumbsDown,
	XCircle,
	Play,
	RotateCcw,
	AlertOctagon,
} from "lucide-react";
import { lazy, Suspense } from "react";

const CierreMensualPage = lazy(() =>
	import("@/features/cierre-mensual/CierreMensualPage").then((m) => ({
		default: m.CierreMensualPage,
	})),
);

/**
 * MissionWorkspace — workspace that runs accounting missions via @drenyra/pi.
 *
 * NEVER auto-executes on mount. User must explicitly click "Iniciar misión".
 * Mission state follows canonical AccountingMissionStatus transitions.
 *
 * @drenyra/pi is a standalone agent runtime, separate from gentle-pi.
 */
export function MissionWorkspace() {
	const params = useParams({
		from: "/workspace/$companyId/$year/$month/$intent",
	});
	const mission = useAccountingMission();
	const [rejectReason, setRejectReason] = useState("");

	const handleStartMission = () => {
		mission.run({
			commandId: crypto.randomUUID(),
			missionId: `close-${params.companyId}-${params.year}-${params.month}`,
			organizationId: "org-1",
			companyId: params.companyId,
			companyName: params.companyId === "1" ? "Arkelythex SAC" : "Demo Company",
			companyRuc: "20123456789",
			fiscalPeriodId: `${params.year}-${params.month}`,
			intent: "monthly-close",
			input: { instruction: `Cierre mensual ${params.month}/${params.year}` },
			idempotencyKey: `${params.companyId}-${params.year}-${params.month}`,
			expectedMissionVersion: mission.version,
		});
	};

	const handleReject = () => {
		mission.reject(rejectReason || "Sin motivo especificado");
	};

	return (
		<div className="flex h-full flex-col">
			<WorkspaceTopBar />
			<div className="flex flex-1 overflow-hidden">
				{/* DRAFT state — show mission intent + start button */}
				{mission.status === "DRAFT" && (
					<div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
						{/* Show CierreMensualPage as context, and the start button as overlay/section */}
						<div className="w-full flex-1 overflow-auto">
							<Suspense
								fallback={
									<div className="flex items-center justify-center h-full">
										<div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
									</div>
								}
							>
								<CierreMensualPage />
							</Suspense>
						</div>
						<div className="sticky bottom-0 flex w-full max-w-lg flex-col items-center gap-3 border-t border-[var(--border-subtle)] bg-[var(--surface-1)] p-4">
							<p className="text-xs text-[var(--text-muted)] text-center">
								Revisa el estado del cierre arriba. Cuando estés listo, inicia
								la misión para ejecutar operaciones contables con @drenyra/pi.
							</p>
							<button
								type="button"
								onClick={handleStartMission}
								className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
							>
								<Play size={16} />
								Iniciar misión de cierre
							</button>
						</div>
					</div>
				)}

				{/* Error state */}
				{mission.error && (
					<div className="flex flex-1 items-center justify-center p-6">
						<div className="max-w-md space-y-4 text-center">
							<XCircle size={32} className="mx-auto text-red-500" />
							<h3 className="text-sm font-semibold text-[var(--text-primary)]">
								Error al ejecutar la misión
							</h3>
							<p className="text-xs text-[var(--text-muted)]">
								{mission.error}
							</p>
							{mission.status === "UNKNOWN" && (
								<p className="text-xs text-amber-500">
									No se pudo confirmar si la operación se completó en el
									backend. Verifica el estado antes de reintentar.
								</p>
							)}
							<button
								type="button"
								onClick={handleStartMission}
								className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
							>
								Reintentar
							</button>
						</div>
					</div>
				)}

				{/* Running / Queueing / Blocked states */}
				{(mission.status === "QUEUED" ||
					mission.status === "RUNNING" ||
					mission.status === "BLOCKED") && (
					<div className="flex flex-1 flex-col gap-4 p-6 overflow-auto">
						{MissionStatusBar(mission)}
						{MissionProgressContent(mission)}
					</div>
				)}

				{/* AWAITING_APPROVAL — show proposal + approve/reject */}
				{mission.status === "AWAITING_APPROVAL" && (
					<div className="flex flex-1 flex-col gap-4 p-6 overflow-auto">
						{MissionStatusBar(mission)}
						{MissionProgressContent(mission)}

						{mission.proposal && (
							<div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
								<div className="flex items-center gap-2">
									<AlertTriangle size={16} className="text-amber-500" />
									<h3 className="text-sm font-semibold text-[var(--text-primary)]">
										Aprobación requerida (R2)
									</h3>
									<span className="text-[10px] text-[var(--text-muted)]">
										v{mission.proposal.version}
									</span>
								</div>
								<p className="text-xs text-[var(--text-secondary)]">
									{mission.proposal.summary}
								</p>

								{/* Evidence list */}
								{mission.proposal.evidence.length > 0 && (
									<div className="space-y-1">
										<p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
											Evidencia
										</p>
										{mission.proposal.evidence.map((ev) => (
											<div
												key={ev.id}
												className="flex items-center gap-2 rounded border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-1"
											>
												<CheckCircle
													size={12}
													className="text-green-500 shrink-0"
												/>
												<span className="text-[11px] text-[var(--text-primary)]">
													{ev.label}
												</span>
											</div>
										))}
									</div>
								)}

								{/* Risk level */}
								<div className="flex items-center gap-2 text-xs">
									<AlertOctagon size={12} className="text-amber-500" />
									<span className="text-[var(--text-muted)]">
										Riesgo: {mission.proposal.riskLevel}
									</span>
								</div>

								{/* Actions */}
								<div className="flex flex-col gap-2">
									<textarea
										value={rejectReason}
										onChange={(e) => setRejectReason(e.target.value)}
										placeholder="Motivo de rechazo (opcional para aprobar, requerido para rechazar)"
										className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none resize-none"
										rows={2}
									/>
									<div className="flex gap-2 justify-end">
										<button
											type="button"
											onClick={() => mission.approve()}
											className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
										>
											<ThumbsUp size={14} /> Aprobar
										</button>
										<button
											type="button"
											onClick={handleReject}
											className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10"
										>
											<ThumbsDown size={14} /> Rechazar
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				)}

				{/* REJECTED state — show rejection info + revise option */}
				{mission.status === "REJECTED" && (
					<div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
						<div className="max-w-md space-y-4 text-center">
							<ThumbsDown size={32} className="mx-auto text-red-500" />
							<h3 className="text-sm font-semibold text-[var(--text-primary)]">
								Propuesta rechazada
							</h3>
							{mission.rejection && (
								<div className="space-y-2 text-xs text-[var(--text-muted)]">
									<p>{mission.rejection.reason}</p>
									<p className="text-[10px]">
										{mission.rejection.rejectedBy} ·{" "}
										{new Date(mission.rejection.rejectedAt).toLocaleString(
											"es-PE",
										)}
										{mission.rejection.proposalVersion > 0 &&
											` · v${mission.rejection.proposalVersion}`}
									</p>
								</div>
							)}
							<button
								type="button"
								onClick={mission.requestRevision}
								className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
							>
								<RotateCcw size={16} />
								Solicitar revisión
							</button>
						</div>
					</div>
				)}

				{/* COMPLETED state */}
				{mission.status === "COMPLETED" && (
					<div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
						<div className="max-w-md space-y-4 text-center">
							<CheckCircle size={32} className="mx-auto text-green-500" />
							<h3 className="text-sm font-semibold text-[var(--text-primary)]">
								Misión completada
							</h3>
							<p className="text-xs text-[var(--text-muted)]">
								El cierre mensual se ha procesado exitosamente.
							</p>
							<button
								type="button"
								onClick={mission.reset}
								className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
							>
								Nueva misión
							</button>
						</div>
					</div>
				)}

				{/* REVISION_REQUESTED — back to draft-like state */}
				{mission.status === "REVISION_REQUESTED" && (
					<div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
						<button
							type="button"
							onClick={handleStartMission}
							className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
						>
							<Play size={16} />
							Re-ejecutar misión con revisión
						</button>
					</div>
				)}

				{/* Failed state */}
				{mission.status === "FAILED" && (
					<div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
						<div className="max-w-md space-y-4 text-center">
							<XCircle size={32} className="mx-auto text-red-500" />
							<h3 className="text-sm font-semibold text-[var(--text-primary)]">
								Misión fallida
							</h3>
							{mission.error && (
								<p className="text-xs text-[var(--text-muted)]">
									{mission.error}
								</p>
							)}
							<button
								type="button"
								onClick={handleStartMission}
								className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
							>
								<RotateCcw size={16} />
								Reintentar
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

// ─── Shared sub-components ──────────────────────────────────────────────────

function MissionStatusBar(mission: ReturnType<typeof useAccountingMission>) {
	const phaseLabel: Record<string, string> = {
		QUEUED: "En cola",
		RUNNING: "Ejecutando misión…",
		BLOCKED: "Misión bloqueada",
		AWAITING_APPROVAL: "Esperando aprobación",
	};

	return (
		<div className="flex items-center gap-2">
			{mission.status === "RUNNING" && (
				<Loader2 size={16} className="animate-spin text-[var(--accent)]" />
			)}
			{mission.status === "BLOCKED" && (
				<AlertTriangle size={16} className="text-amber-500" />
			)}
			{mission.status === "AWAITING_APPROVAL" && (
				<AlertTriangle size={16} className="text-amber-500" />
			)}
			{mission.isMockMode && (
				<span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-500">
					SIMULACIÓN
				</span>
			)}
			<span className="text-sm font-medium text-[var(--text-primary)]">
				{phaseLabel[mission.status] ?? mission.status}
			</span>
		</div>
	);
}

function MissionProgressContent(
	mission: ReturnType<typeof useAccountingMission>,
) {
	return (
		<div className="space-y-4">
			{/* Progress bar */}
			<div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
				<div
					className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
					style={{ width: `${Math.round(mission.progress * 100)}%` }}
				/>
			</div>

			{/* Steps */}
			<div className="space-y-2">
				{mission.steps.map(
					(step: {
						id: string;
						label: string;
						status: string;
						evidence?: Array<{
							id: string;
							label: string;
							type: string;
							verified: boolean;
						}>;
					}) => (
						<div
							key={step.id}
							className="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] p-3"
						>
							{step.status === "completed" && (
								<CheckCircle size={16} className="text-green-500 shrink-0" />
							)}
							{step.status === "active" && (
								<Loader2
									size={16}
									className="animate-spin text-[var(--accent)] shrink-0"
								/>
							)}
							{step.status === "blocked" && (
								<AlertTriangle size={16} className="text-amber-500 shrink-0" />
							)}
							{step.status === "pending" && (
								<div className="h-4 w-4 rounded-full border-2 border-[var(--border-subtle)] shrink-0" />
							)}
							<span className="text-xs text-[var(--text-primary)]">
								{step.label}
							</span>
						</div>
					),
				)}
			</div>

			{/* Blockers */}
			{mission.blockers.length > 0 && (
				<div className="space-y-2">
					<h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
						Bloqueos
					</h3>
					{mission.blockers.map(
						(blocker: { id: string; reason: string; severity: string }) => (
							<div
								key={blocker.id}
								className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2"
							>
								<AlertTriangle size={14} className="text-amber-500 shrink-0" />
								<span className="text-xs text-[var(--text-primary)]">
									{blocker.reason}
								</span>
							</div>
						),
					)}
				</div>
			)}
		</div>
	);
}
