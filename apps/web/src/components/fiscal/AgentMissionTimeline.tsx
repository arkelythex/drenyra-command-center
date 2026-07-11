import { createElement } from "react";
import {
	AlertTriangle,
	CheckCircle2,
	ChevronDown,
	Clock,
	Loader2,
	XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────────────

export type MissionPhaseStatus =
	| "pending"
	| "in-progress"
	| "review"
	| "completed"
	| "error"
	| "blocked";

export interface MissionPhase {
	id: string;
	label: string;
	description?: string;
	status: MissionPhaseStatus;
	progress?: number; // 0-100, only relevant for in-progress
	detail?: string;
	errorMessage?: string;
}

export interface AgentMissionTimelineProps {
	/** Title of the mission */
	title: string;
	/** Current overall progress (0-100) */
	overallProgress: number;
	/** Mission phases in order */
	phases: MissionPhase[];
	/** Whether to show phase details (compact = only status dots + labels) */
	expanded?: boolean;
	/** Callback when a phase is clicked */
	onPhaseClick?: (phaseId: string) => void;
	/** Optional summary text */
	summary?: string;
}

// ── Status display config ──────────────────────────────────────────────────────

const PHASE_CONFIG: Record<
	MissionPhaseStatus,
	{
		icon: typeof CheckCircle2;
		color: string;
		dotColor: string;
		bgColor: string;
		label: string;
	}
> = {
	pending: {
		icon: Clock,
		color: "text-[var(--text-muted)]",
		dotColor: "bg-[var(--surface-3)]",
		bgColor: "bg-[var(--surface-2)]",
		label: "Pendiente",
	},
	"in-progress": {
		icon: Loader2,
		color: "text-[var(--color-info)]",
		dotColor: "bg-[var(--color-info)]",
		bgColor: "bg-[var(--color-info)]/5",
		label: "En progreso",
	},
	review: {
		icon: AlertTriangle,
		color: "text-[var(--color-warning)]",
		dotColor: "bg-[var(--color-warning)]",
		bgColor: "bg-[var(--color-warning)]/5",
		label: "Requiere revisión",
	},
	completed: {
		icon: CheckCircle2,
		color: "text-[var(--color-success)]",
		dotColor: "bg-[var(--color-success)]",
		bgColor: "bg-[var(--color-success)]/5",
		label: "Completado",
	},
	error: {
		icon: XCircle,
		color: "text-[var(--color-danger)]",
		dotColor: "bg-[var(--color-danger)]",
		bgColor: "bg-[var(--color-danger)]/5",
		label: "Error",
	},
	blocked: {
		icon: XCircle,
		color: "text-[var(--color-danger)]",
		dotColor: "bg-[var(--color-danger)]",
		bgColor: "bg-[var(--color-danger)]/5",
		label: "Bloqueado",
	},
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function PhaseRow({
	phase,
	expanded,
	onClick,
}: {
	phase: MissionPhase;
	expanded: boolean;
	onClick?: ((id: string) => void) | undefined;
}) {
	const config = PHASE_CONFIG[phase.status];
	const Icon = config.icon;
	const isActive = phase.status === "in-progress";

	return (
		<button
			type="button"
			disabled={!onClick}
			onClick={() => onClick?.(phase.id)}
			className={cn(
				"flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all",
				"border-[var(--border-subtle)]",
				config.bgColor,
				isActive && "border-[var(--color-info)]/30",
				phase.status === "error" && "border-[var(--color-danger)]/30",
				phase.status === "review" && "border-[var(--color-warning)]/30",
				onClick && "cursor-pointer hover:opacity-80",
			)}
		>
			{/* Status icon */}
			<div
				className={cn(
					"flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
					isActive && "bg-[var(--color-info)]/10",
					phase.status === "completed" && "bg-[var(--color-success)]/10",
					phase.status === "error" && "bg-[var(--color-danger)]/10",
					phase.status === "review" && "bg-[var(--color-warning)]/10",
					phase.status === "pending" && "bg-[var(--surface-3)]",
				)}
			>
				{createElement(Icon, {
					size: 14,
					className: cn(config.color, isActive && "animate-spin"),
				})}
			</div>

			{/* Content */}
			<div className="min-w-0 flex-1">
				<div className="flex items-center justify-between gap-2">
					<p className="text-xs font-semibold text-[var(--text-primary)]">
						{phase.label}
					</p>
					<span
						className={cn("shrink-0 text-[10px] font-medium", config.color)}
					>
						{config.label}
					</span>
				</div>

				{expanded && phase.description && (
					<p className="mt-0.5 text-2xs text-[var(--text-tertiary)]">
						{phase.description}
					</p>
				)}

				{/* Progress bar for active phases */}
				{phase.status === "in-progress" &&
					typeof phase.progress === "number" && (
						<div className="mt-2">
							<div className="flex items-center justify-between text-2xs text-[var(--text-tertiary)] mb-1">
								<span>Progreso</span>
								<span className="font-medium text-[var(--color-info)]">
									{phase.progress}%
								</span>
							</div>
							<div className="h-1.5 w-full rounded-full bg-[var(--surface-3)] overflow-hidden">
								<div
									className="h-full rounded-full bg-[var(--color-info)] transition-all duration-700 ease-out"
									style={{ width: `${phase.progress}%` }}
								/>
							</div>
						</div>
					)}

				{/* Detail / error message */}
				{expanded && phase.detail && (
					<p className="mt-1 text-2xs text-[var(--text-tertiary)] font-mono">
						{phase.detail}
					</p>
				)}
				{phase.status === "error" && phase.errorMessage && (
					<p className="mt-1 flex items-center gap-1 text-2xs font-medium text-[var(--color-danger)]">
						{phase.errorMessage}
					</p>
				)}
			</div>

			{/* Expand indicator */}
			{expanded && onClick && (
				<ChevronDown size={12} className="mt-1 text-[var(--text-muted)]" />
			)}
		</button>
	);
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AgentMissionTimeline({
	title,
	overallProgress,
	phases,
	expanded = true,
	onPhaseClick,
	summary,
}: AgentMissionTimelineProps) {
	const completedCount = phases.filter((p) => p.status === "completed").length;
	const errorCount = phases.filter(
		(p) => p.status === "error" || p.status === "blocked",
	).length;
	const reviewCount = phases.filter((p) => p.status === "review").length;

	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] overflow-hidden">
			{/* ── Header ── */}
			<div className="border-b border-[var(--border-subtle)] px-4 py-3">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-bold text-[var(--text-primary)]">
						{title}
					</h3>
					<div className="flex items-center gap-2 text-2xs text-[var(--text-tertiary)]">
						{reviewCount > 0 && (
							<span className="font-medium text-[var(--color-warning)]">
								{reviewCount} revisión
								{reviewCount !== 1 ? "es" : ""}
							</span>
						)}
						{errorCount > 0 && (
							<span className="font-medium text-[var(--color-danger)]">
								{errorCount} error
								{errorCount !== 1 ? "es" : ""}
							</span>
						)}
						<span>
							{completedCount}/{phases.length} fases
						</span>
					</div>
				</div>

				{/* Overall progress bar */}
				<div className="mt-2 flex items-center gap-3">
					<div className="flex-1 h-2 rounded-full bg-[var(--surface-3)] overflow-hidden">
						<div
							className={cn(
								"h-full rounded-full transition-all duration-700 ease-out",
								overallProgress >= 80 && "bg-[var(--color-success)]",
								overallProgress >= 40 &&
									overallProgress < 80 &&
									"bg-[var(--color-warning)]",
								overallProgress < 40 && "bg-[var(--color-info)]",
							)}
							style={{ width: `${overallProgress}%` }}
						/>
					</div>
					<span className="shrink-0 text-xs font-bold tabular-nums text-[var(--text-primary)]">
						{overallProgress}%
					</span>
				</div>

				{summary && (
					<p className="mt-1.5 text-2xs text-[var(--text-tertiary)]">
						{summary}
					</p>
				)}
			</div>

			{/* ── Phases ── */}
			<div className={cn("p-4 space-y-2", !expanded && "p-3 space-y-1.5")}>
				{phases.map((phase) => (
					<PhaseRow
						key={phase.id}
						phase={phase}
						expanded={expanded}
						onClick={onPhaseClick}
					/>
				))}
			</div>
		</div>
	);
}
