/**
 * ActivePipelinePanel — Panel de cambios normativos activos en el pipeline.
 *
 * Muestra:
 * - Timeline de fases para cada cambio activo
 * - Estado actual de cada fase
 * - Alertas de aprobación pendiente
 * - Indicadores de riesgo (ReviewGuard)
 *
 * @example
 * ```tsx
 * <ActivePipelinePanel
 *   changes={[
 *     {
 *       changeId: "cambio-igv-001",
 *       title: "IGV Rate Change 18% → 19%",
 *       regulationRef: "Ley N° 12345",
 *       currentFase: "migracion",
 *       status: "AWAITING_APPROVAL",
 *       needsApproval: true,
 *       approvalFase: "migracion",
 *       companyRuc: "20123456786",
 *       period: "2026-08",
 *       startedAt: "2026-07-09T10:00:00Z",
 *       updatedAt: "2026-07-09T10:30:00Z",
 *       artifactCount: 4,
 *     },
 *   ]}
 * />
 * ```
 */

import {
	AlertTriangle,
	CheckCircle2,
	Clock,
	FileText,
	Loader2,
	RefreshCw,
	ShieldAlert,
} from "lucide-react";

import type { ActiveChange } from "./types";

// ============================================================================
// Props
// ============================================================================

interface ActivePipelinePanelProps {
	/** Cambios activos en el pipeline. */
	changes: ActiveChange[];
	/** Callback para navegar al detalle de un cambio. */
	onViewDetail?: (changeId: string) => void;
	/** Callback para refrescar la lista. */
	onRefresh?: () => void;
	/** Si está cargando. */
	loading?: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

/** Labels en español para cada fase. */
const FASE_LABELS: Record<string, string> = {
	solicitud: "Solicitud",
	analisis: "Análisis",
	diseno: "Diseño",
	plan: "Plan",
	migracion: "Migración",
	auditoria: "Auditoría",
};

/** Labels en español para cada estado. */
const STATUS_LABELS: Record<string, string> = {
	COMPLETED: "Completado",
	PREFLIGHT_BLOCKED: "Bloqueado (preflight)",
	AWAITING_APPROVAL: "Espera aprobación",
	FAILED: "Falló",
	BLOCKED: "Bloqueado",
	REVIEW_NEEDED: "Requiere revisión",
	RUNNING: "En ejecución",
};

/** Colores para cada estado. */
const STATUS_COLORS: Record<string, string> = {
	COMPLETED: "var(--color-success)",
	PREFLIGHT_BLOCKED: "var(--color-danger)",
	AWAITING_APPROVAL: "var(--color-warning)",
	FAILED: "var(--color-danger)",
	BLOCKED: "var(--color-danger)",
	REVIEW_NEEDED: "var(--color-warning)",
	RUNNING: "var(--color-info)",
};

/** Orden de fases para la barra de progreso. */
const FASE_ORDER = [
	"solicitud",
	"analisis",
	"diseno",
	"plan",
	"migracion",
	"auditoria",
];

/** Determina el icono según el estado. */
function StatusIcon({ status }: { status: string }) {
	switch (status) {
		case "COMPLETED":
			return <CheckCircle2 className="h-4 w-4" />;
		case "AWAITING_APPROVAL":
		case "REVIEW_NEEDED":
			return <AlertTriangle className="h-4 w-4" />;
		case "FAILED":
		case "BLOCKED":
		case "PREFLIGHT_BLOCKED":
			return <ShieldAlert className="h-4 w-4" />;
		case "RUNNING":
			return <Loader2 className="h-4 w-4 animate-spin" />;
		default:
			return <Clock className="h-4 w-4" />;
	}
}

/** Formatea fecha ISO a formato legible. */
function formatDate(iso: string): string {
	try {
		const date = new Date(iso);
		return date.toLocaleDateString("es-PE", {
			day: "2-digit",
			month: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return iso;
	}
}

// ============================================================================
// PhaseProgressBar
// ============================================================================

/** Barra de progreso que muestra en qué fase está el pipeline. */
function PhaseProgressBar({
	currentFase,
	status,
}: {
	currentFase: string;
	status: string;
}) {
	const currentIdx = FASE_ORDER.indexOf(currentFase);
	const isComplete = status === "COMPLETED";

	return (
		<div className="flex items-center gap-1">
			{FASE_ORDER.map((fase, i) => {
				const isActive = i === currentIdx && !isComplete;
				const isDone = i < currentIdx || isComplete;
				const isBlocked =
					status === "BLOCKED" ||
					status === "FAILED" ||
					status === "PREFLIGHT_BLOCKED";

				return (
					<div key={fase} className="flex items-center gap-1">
						<div
							className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
								isDone
									? "bg-[var(--color-success)] text-white"
									: isActive
										? "border-2 border-[var(--color-info)] bg-[var(--color-info)]/10 text-[var(--color-info)]"
										: isBlocked && i === currentIdx
											? "border-2 border-[var(--color-danger)] bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
											: "border border-[var(--border-subtle)] text-[var(--text-tertiary)]"
							}`}
							title={FASE_LABELS[fase] ?? fase}
						>
							{i + 1}
						</div>
						{i < FASE_ORDER.length - 1 && (
							<div
								className={`h-px w-3 ${
									isDone
										? "bg-[var(--color-success)]"
										: "bg-[var(--border-subtle)]"
								}`}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}

// ============================================================================
// ActivePipelineCard
// ============================================================================

/** Tarjeta individual de un cambio activo. */
function ActivePipelineCard({
	change,
	onViewDetail,
}: {
	change: ActiveChange;
	onViewDetail?: (changeId: string) => void;
}) {
	const statusColor = STATUS_COLORS[change.status] ?? "var(--text-tertiary)";

	return (
		<article className="space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/70 p-4 transition-colors hover:border-[var(--border-hover)]">
			{/* Header */}
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0 flex-1">
					<h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">
						{change.title}
					</h3>
					{change.regulationRef && (
						<p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
							{change.regulationRef}
						</p>
					)}
				</div>
				<div
					className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
					style={{
						backgroundColor: `${statusColor}15`,
						color: statusColor,
					}}
				>
					<StatusIcon status={change.status} />
					{STATUS_LABELS[change.status] ?? change.status}
				</div>
			</div>

			{/* Fase actual */}
			<PhaseProgressBar
				currentFase={change.currentFase}
				status={change.status}
			/>

			{/* Metadata */}
			<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--text-tertiary)]">
				<span>RUC: {change.companyRuc}</span>
				<span>Período: {change.period}</span>
				<span>Actualizado: {formatDate(change.updatedAt)}</span>
				<span className="flex items-center gap-1">
					<FileText className="h-3 w-3" />
					{change.artifactCount} artefactos
				</span>
			</div>

			{/* Alerta de aprobación */}
			{change.needsApproval && change.approvalFase && (
				<div className="flex items-center gap-2 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 px-3 py-2 text-xs text-[var(--color-warning)]">
					<AlertTriangle className="h-3.5 w-3.5 shrink-0" />
					<span>
						Aprobación requerida: fase "
						{FASE_LABELS[change.approvalFase] ?? change.approvalFase}"
					</span>
				</div>
			)}

			{/* Actions */}
			{onViewDetail && (
				<button
					type="button"
					onClick={() => onViewDetail(change.changeId)}
					className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
				>
					Ver detalle
				</button>
			)}
		</article>
	);
}

// ============================================================================
// ActivePipelinePanel
// ============================================================================

/**
 * Panel principal que lista todos los cambios normativos activos.
 */
export function ActivePipelinePanel({
	changes,
	onViewDetail,
	onRefresh,
	loading,
}: ActivePipelinePanelProps) {
	const activeChanges = changes.filter((c) => c.status !== "COMPLETED");
	const recentCompleted = changes.filter((c) => c.status === "COMPLETED");

	if (loading) {
		return (
			<section className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
						Pipeline de Cumplimiento
					</h2>
				</div>
				<div className="flex items-center justify-center py-12 text-[var(--text-tertiary)]">
					<Loader2 className="mr-2 h-5 w-5 animate-spin" />
					<span className="text-sm">Cargando cambios activos...</span>
				</div>
			</section>
		);
	}

	return (
		<section className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
					Pipeline de Cumplimiento
					{activeChanges.length > 0 && (
						<span className="ml-2 rounded-full bg-[var(--color-info)]/10 px-2 py-0.5 text-[10px] text-[var(--color-info)]">
							{activeChanges.length} activos
						</span>
					)}
				</h2>
				{onRefresh && (
					<button
						type="button"
						onClick={onRefresh}
						className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
					>
						<RefreshCw className="h-3.5 w-3.5" />
						Refrescar
					</button>
				)}
			</div>

			{/* Empty state */}
			{changes.length === 0 && (
				<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-2)]/30 py-12">
					<CheckCircle2 className="mb-3 h-8 w-8 text-[var(--color-success)]/50" />
					<p className="text-sm font-medium text-[var(--text-secondary)]">
						No hay cambios normativos activos
					</p>
					<p className="mt-1 text-xs text-[var(--text-tertiary)]">
						Usa la API o el CLI para iniciar un pipeline de compliance
					</p>
				</div>
			)}

			{/* Active changes */}
			{activeChanges.length > 0 && (
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{activeChanges.map((change) => (
						<ActivePipelineCard
							key={change.changeId}
							change={change}
							onViewDetail={onViewDetail}
						/>
					))}
				</div>
			)}

			{/* Recently completed */}
			{recentCompleted.length > 0 && (
				<div>
					<h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
						Completados recientemente
					</h3>
					<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
						{recentCompleted.slice(0, 3).map((change) => (
							<ActivePipelineCard
								key={change.changeId}
								change={change}
								onViewDetail={onViewDetail}
							/>
						))}
					</div>
				</div>
			)}
		</section>
	);
}
