import { Check, AlertTriangle, X, ShieldAlert, ArrowRight } from "lucide-react";
import { useEffect, useState, useActionState } from "react";
import { cn } from "@/lib/utils";
import type { AccountingJobRunView } from "../hooks/useAccountingJobRuns";
import type { PendingToolApproval } from "../hooks/useCognitiveStream";

interface ToolApprovalCardProps {
	approval: PendingToolApproval;
	supervisedRun?: AccountingJobRunView | null;
	onApprove: (options?: {
		pairingCode?: string;
		reason?: string;
	}) => Promise<void>;
	onDeny: (reason?: string) => Promise<void>;
}

export function ToolApprovalCard({
	approval,
	supervisedRun,
	onApprove,
	onDeny,
}: ToolApprovalCardProps) {
	const [pairingCode, setPairingCode] = useState(approval.pairingCode ?? "");
	const [reason, setReason] = useState("");

	const [approveError, submitApprove, isApproving] = useActionState(
		async (_prev: string | null) => {
			if (!canApprove) return null;
			try {
				await onApprove({ pairingCode, reason });
				return null;
			} catch (error) {
				return error instanceof Error ? error.message : "No se pudo aprobar la acción";
			}
		},
		null as string | null,
	);

	const [denyError, submitDeny, isDenying] = useActionState(
		async (_prev: string | null) => {
			try {
				await onDeny(reason);
				return null;
			} catch (error) {
				return error instanceof Error ? error.message : "No se pudo rechazar la acción";
			}
		},
		null as string | null,
	);

	const isSubmitting = isApproving || isDenying;
	const errorMessage = approveError ?? denyError;

	useEffect(() => {
		setPairingCode(approval.pairingCode ?? "");
		setReason("");
	}, [approval.toolCallId, approval.pairingCode]);

	const requiresPairing = approval.pairingRequired === true;
	const canApprove = !requiresPairing || pairingCode.trim().length > 0;

	const controlPlane = supervisedRun?.controlPlane ?? null;
	const surfaceTitle =
		controlPlane?.surface?.title ?? supervisedRun?.jobTitle ?? null;
	const documentarySourceCount = controlPlane?.documentarySources?.length ?? 0;
	const policyLabel =
		controlPlane?.surface?.deterministicFallback?.description ??
		"Requiere revisión humana antes de ejecutar cambios contables o fiscales";

	return (
		<div className="mb-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-sm">
			<div className="border-b border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3">
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
						<ShieldAlert size={16} strokeWidth={2.5} />
					</div>
					<div>
						<h4 className="text-[13px] font-bold text-[var(--text-primary)]">
							Revisión de Impacto Requerida
						</h4>
						<p className="text-label font-medium text-[var(--text-secondary)]">
							El agente propone una acción que afecta saldos fiscales.
						</p>
					</div>
				</div>
			</div>

			<div className="p-4">
				{/* The review summary intentionally avoids simulated amounts. */}
				<div className="mb-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
					<div className="mb-2 flex items-center justify-between">
						<span className="text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
							Propuesta: {approval.name}
						</span>
						<span className="rounded-md bg-info/10 px-2 py-0.5 text-2xs font-bold text-info">
							Alto Impacto
						</span>
					</div>
					
					<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-md bg-[var(--surface-1)] p-3">
						<div className="text-center">
							<span className="block text-2xs font-medium text-[var(--text-tertiary)]">Estado Actual</span>
							<span className="mt-1 block text-[13px] font-medium text-[var(--text-secondary)]">Sin ejecutar</span>
						</div>
						<div className="text-[var(--text-tertiary)]">
							<ArrowRight size={14} />
						</div>
						<div className="text-center">
							<span className="block text-2xs font-medium text-[var(--text-tertiary)]">Decisión requerida</span>
							<span className="mt-1 block text-[13px] font-bold text-[var(--color-success)]">Aprobar o rechazar</span>
						</div>
					</div>
					
					<div className="mt-3 flex items-start gap-2 rounded-md bg-amber-500/5 px-3 py-2">
						<AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
						<p className="text-label font-medium text-[var(--text-secondary)]">
							<span className="font-bold text-[var(--text-primary)]">Política aplicada: </span>
							{policyLabel}
						</p>
					</div>
				</div>

				{controlPlane ? (
					<div className="mb-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-label text-[var(--text-secondary)]">
						{surfaceTitle ? (
							<p className="font-bold text-[var(--text-primary)]">
								{surfaceTitle}
							</p>
						) : null}
						<p>Modo de evidencia: {controlPlane.retrievalMode}</p>
						<p>
							Evidencia documental visible: {documentarySourceCount}{" "}
							{documentarySourceCount === 1 ? "fuente" : "fuentes"}
						</p>
					</div>
				) : null}

				{/* Pairing / Auth section */}
				{requiresPairing ? (
					<div className="mb-4 space-y-2 rounded-lg border border-warning/20 bg-warning/5 p-3">
						<p className="text-xs font-medium text-[var(--text-primary)]">
							{approval.pairingChallenge || "Se requiere código de autorización para aprobar esta transacción."}
						</p>
						<p className="text-2xs font-medium text-[var(--text-secondary)]">
							Hint: <span className="font-mono">{approval.pairingHint || "--"}</span>
						</p>
						<input
							value={pairingCode}
							onChange={(event) => setPairingCode(event.target.value)}
							placeholder="Ingresa código..."
							className="h-9 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-warning focus:outline-none focus:ring-1 focus:ring-warning/50"
							aria-label="Código de pareo"
						/>
					</div>
				) : null}

				<textarea
					value={reason}
					onChange={(event) => setReason(event.target.value)}
					placeholder="Añadir nota de auditoría (opcional)"
					rows={2}
					className="w-full resize-none rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-info focus:outline-none focus:ring-1 focus:ring-info/50"
				/>

				<div className="mt-4 flex gap-3">
					<button
						onClick={() => submitApprove()}
						disabled={!canApprove || isSubmitting}
						className={cn(
							"flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--color-success)] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[var(--color-success)]/80 focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]/50 disabled:opacity-50",
							(!canApprove || isSubmitting) && "cursor-not-allowed"
						)}
					>
						{isSubmitting ? (
							<div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
						) : (
							<Check size={14} strokeWidth={3} />
						)}
						Aprobar Impacto
					</button>
					<button
						onClick={() => submitDeny()}
						disabled={isSubmitting}
						className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-danger/20 bg-danger/10 px-4 py-2 text-[13px] font-bold text-danger transition-colors hover:bg-danger/20 focus:outline-none focus:ring-2 focus:ring-danger/50 disabled:opacity-50"
					>
						<X size={14} strokeWidth={3} />
						Rechazar
					</button>
				</div>
				
				{errorMessage ? (
					<p role="alert" className="mt-3 text-center text-xs font-medium text-danger">
						{errorMessage}
					</p>
				) : null}
				
				{controlPlane ? (
					<div className="mt-4 flex justify-between border-t border-[var(--border-subtle)] pt-3 text-2xs font-medium text-[var(--text-tertiary)]">
						<span className="font-mono">id: {approval.runId.slice(0, 8)}</span>
						<span>Trace: {controlPlane.traceId.slice(0, 8)}</span>
					</div>
				) : null}
			</div>
		</div>
	);
}
