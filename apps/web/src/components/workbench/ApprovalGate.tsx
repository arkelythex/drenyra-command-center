import {
	CheckCircle,
	Eye,
	FileWarning,
	ShieldAlert,
	Undo2,
	XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApprovalRequest } from "../../types/approval-gate";
import { APPROVAL_LEVELS } from "../../types/approval-gate";

// ─── Sub-components ──────────────────────────────────────────────────────────

function ImpactPreview({
	impact,
}: {
	impact: NonNullable<ApprovalRequest["impact"]>;
}) {
	const fmt = (val: number) =>
		`${val >= 0 ? "+" : ""}S/ ${Math.abs(val).toLocaleString()}`;

	return (
		<div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
			<p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
				Impacto financiero
			</p>
			<div className="mt-1.5 space-y-1">
				{impact.ebitda !== undefined && (
					<div className="flex justify-between text-xs">
						<span className="text-[var(--text-secondary)]">Impacto EBITDA</span>
						<span
							className={cn(
								"font-semibold tabular-nums",
								impact.ebitda >= 0 ? "text-green-600" : "text-red-600",
							)}
						>
							{fmt(impact.ebitda)}
						</span>
					</div>
				)}
				{impact.assets !== undefined && (
					<div className="flex justify-between text-xs">
						<span className="text-[var(--text-secondary)]">
							Impacto activos
						</span>
						<span
							className={cn(
								"font-semibold tabular-nums",
								impact.assets >= 0 ? "text-green-600" : "text-red-600",
							)}
						>
							{fmt(impact.assets)}
						</span>
					</div>
				)}
				{impact.taxImpact !== undefined && (
					<div className="flex justify-between text-xs">
						<span className="text-[var(--text-secondary)]">
							Impacto tributario
						</span>
						<span className="font-semibold tabular-nums text-amber-600">
							Revisión requerida
						</span>
					</div>
				)}
			</div>
		</div>
	);
}

function R3ExecutionSection({ request }: { request: ApprovalRequest }) {
	return (
		<div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
			<div className="flex items-center gap-2">
				<ShieldAlert size={14} className="text-red-500" />
				<p className="text-xs font-semibold text-red-600">
					Ejecución externa — requiere autenticación adicional
				</p>
			</div>
			<div className="mt-2 space-y-1 text-[10px] text-[var(--text-secondary)]">
				{request.authority && <p>Autoridad: {request.authority}</p>}
				{request.action && <p>Acción: {request.action}</p>}
				{request.documentCount && <p>Documentos: {request.documentCount}</p>}
				{request.materiality && <p>Materialidad: {request.materiality}</p>}
			</div>
			{request.receiptId && (
				<div className="mt-2 rounded bg-blue-500/10 p-2 text-[10px] text-blue-600">
					Receipt: {request.receiptId}
					{request.statusAfterExecution === "confirmed" && " ✅ Confirmado"}
					{request.statusAfterExecution === "failed" && " ❌ Falló"}
					{request.statusAfterExecution === "unknown" &&
						" ⚪ Estado desconocido"}
				</div>
			)}
		</div>
	);
}

function ApprovalActions({
	request,
	onApprove,
	onReject,
}: {
	request: ApprovalRequest;
	onApprove: ((id: string) => void) | undefined;
	onReject: ((id: string, reason?: string) => void) | undefined;
}) {
	return (
		<div className="flex items-center justify-end gap-2 border-t border-[var(--border-subtle)] px-4 py-3">
			<button
				type="button"
				onClick={() => onReject?.(request.id)}
				className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-red-500/10 hover:text-red-600"
			>
				<XCircle size={14} /> Rechazar
			</button>
			{request.level === "R3" ? (
				<div className="flex gap-2">
					<button
						type="button"
						className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
					>
						Preparar
					</button>
					<button
						type="button"
						onClick={() => onApprove?.(request.id)}
						className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
					>
						<ShieldAlert size={14} /> Autorizar y ejecutar
					</button>
				</div>
			) : (
				<button
					type="button"
					onClick={() => onApprove?.(request.id)}
					className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]"
				>
					<CheckCircle size={14} /> Aprobar
				</button>
			)}
		</div>
	);
}

function DecisionResult({ request }: { request: ApprovalRequest }) {
	return (
		<div
			className={cn(
				"flex items-center gap-2 border-t px-4 py-2.5 text-xs font-medium",
				request.decision === "approved"
					? "border-green-500/20 bg-green-500/5 text-green-600"
					: "border-red-500/20 bg-red-500/5 text-red-600",
			)}
		>
			{request.decision === "approved" ? (
				<CheckCircle size={14} />
			) : (
				<XCircle size={14} />
			)}
			<span>
				{request.decision === "approved" ? "Aprobado" : "Rechazado"}
				{request.decidedBy && ` por ${request.decidedBy}`}
				{request.rejectionReason && `: ${request.rejectionReason}`}
			</span>
		</div>
	);
}

// ─── Main component ──────────────────────────────────────────────────────────

interface ApprovalGateProps {
	request: ApprovalRequest;
	onApprove?: (id: string) => void;
	onReject?: (id: string, reason?: string) => void;
	compact?: boolean;
}

const iconMap: Record<string, typeof Eye> = {
	Eye,
	Undo2,
	FileWarning,
	ShieldAlert,
};
const levelColors: Record<string, string> = {
	R0: "border-blue-500/20 bg-blue-500/5",
	R1: "border-green-500/20 bg-green-500/5",
	R2: "border-amber-500/20 bg-amber-500/5",
	R3: "border-red-500/20 bg-red-500/5",
};
const headerColors: Record<string, string> = {
	R0: "text-blue-600 bg-blue-500/10",
	R1: "text-green-600 bg-green-500/10",
	R2: "text-amber-600 bg-amber-500/10",
	R3: "text-red-600 bg-red-500/10",
};

export function ApprovalGate({
	request,
	onApprove,
	onReject,
	compact = false,
}: ApprovalGateProps) {
	const levelInfo = APPROVAL_LEVELS[request.level];
	const LevelIcon = iconMap[levelInfo.icon] ?? Eye;

	if (compact) {
		return (
			<div
				className={cn(
					"flex items-center gap-2 rounded-lg border p-2",
					levelColors[request.level],
				)}
			>
				<LevelIcon
					size={14}
					className="shrink-0 text-[var(--text-secondary)]"
				/>
				<div className="min-w-0 flex-1">
					<div className="truncate text-xs font-medium text-[var(--text-primary)]">
						{request.title}
					</div>
					<div className="text-[10px] text-[var(--text-muted)]">
						{request.companyName} · {levelInfo.label}
					</div>
				</div>
				{request.decision === "approved" && (
					<CheckCircle size={14} className="shrink-0 text-green-500" />
				)}
				{request.decision === "rejected" && (
					<XCircle size={14} className="shrink-0 text-red-500" />
				)}
			</div>
		);
	}

	return (
		<div className={cn("rounded-xl border", levelColors[request.level])}>
			<div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-4 py-2.5">
				<div
					className={cn(
						"flex h-6 w-6 items-center justify-center rounded-md",
						headerColors[request.level],
					)}
				>
					<LevelIcon size={14} />
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span className="text-sm font-semibold text-[var(--text-primary)]">
							{request.title}
						</span>
						<span
							className={cn(
								"rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
								headerColors[request.level],
							)}
						>
							{request.level}
						</span>
					</div>
					<p className="text-xs text-[var(--text-secondary)]">
						{levelInfo.description}
					</p>
				</div>
			</div>

			<div className="space-y-2 p-4">
				<div className="flex flex-wrap gap-2 text-[10px] font-medium">
					<span className="rounded-md bg-[var(--surface-2)] px-2 py-1 text-[var(--text-secondary)]">
						{request.companyName} · RUC {request.companyRuc}
					</span>
					<span className="rounded-md bg-[var(--surface-2)] px-2 py-1 text-[var(--text-secondary)]">
						{request.period}
					</span>
					<span className="rounded-md bg-[var(--surface-2)] px-2 py-1 text-[var(--text-secondary)]">
						{request.requestedBy}
					</span>
				</div>

				<p className="text-xs text-[var(--text-secondary)]">
					{request.description}
				</p>

				{request.impact &&
					(request.level === "R2" || request.level === "R3") && (
						<ImpactPreview impact={request.impact} />
					)}

				{(request.level === "R2" || request.level === "R3") && (
					<div className="flex flex-wrap gap-2 text-[10px] text-[var(--text-muted)]">
						{request.evidenceCount !== undefined && (
							<span className="rounded bg-[var(--surface-2)] px-2 py-1">
								{request.evidenceCount} evidencias
							</span>
						)}
						{request.policyVersion && (
							<span className="rounded bg-[var(--surface-2)] px-2 py-1">
								{request.policyVersion}
							</span>
						)}
						{request.rollbackMethod && (
							<span className="rounded bg-[var(--surface-2)] px-2 py-1">
								Rollback: {request.rollbackMethod}
							</span>
						)}
					</div>
				)}

				{request.level === "R3" && <R3ExecutionSection request={request} />}
			</div>

			{request.decision === "pending" && (
				<ApprovalActions
					request={request}
					onApprove={onApprove}
					onReject={onReject}
				/>
			)}
			{request.decision !== "pending" && <DecisionResult request={request} />}
		</div>
	);
}
