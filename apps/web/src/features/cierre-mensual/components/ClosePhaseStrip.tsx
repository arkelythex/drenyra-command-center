import { CheckCircle2, CircleAlert, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ClosePhaseState = "completed" | "active" | "blocked" | "pending";

interface ClosePhase {
	name: string;
	state: ClosePhaseState;
	evidenceCount: number;
	blocker?: string;
	nextAction?: string;
}

interface ClosePhaseStripProps {
	phases: ClosePhase[];
	activeIndex: number;
}

const STATE_ICON = {
	completed: CheckCircle2,
	active: Loader2,
	blocked: CircleAlert,
	pending: Clock,
} as const;

const STATE_COLOR = {
	completed: "text-[var(--color-success)] border-[var(--color-success)]/30",
	active: "text-[var(--color-info)] border-[var(--color-info)]/30",
	blocked: "text-[var(--color-danger)] border-[var(--color-danger)]/30",
	pending: "text-[var(--text-tertiary)] border-[var(--border-subtle)]",
} as const;

const STATE_BG = {
	completed: "bg-[var(--color-success)]/5",
	active: "bg-[var(--color-info)]/5",
	blocked: "bg-[var(--color-danger)]/5",
	pending: "bg-[var(--surface-2)]",
} as const;

const STATE_LABEL = {
	completed: "Completada",
	active: "En curso",
	blocked: "Bloqueada",
	pending: "Pendiente",
} as const;

function PhaseCard({ phase, index }: { phase: ClosePhase; index: number }) {
	const Icon = STATE_ICON[phase.state];
	const color = STATE_COLOR[phase.state];
	const bg = STATE_BG[phase.state];

	return (
		<div
			className={cn(
				"flex flex-col gap-1.5 rounded-xl border p-3 transition-all",
				color,
				bg,
			)}
		>
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 min-w-0">
					<Icon
						size={14}
						className={cn(
							"shrink-0",
							phase.state === "active" && "animate-spin",
						)}
					/>
					<span className="text-xs font-semibold text-[var(--text-primary)] truncate">
						{index + 1}. {phase.name}
					</span>
				</div>
				<span className="shrink-0 text-[10px] font-medium text-[var(--text-secondary)]">
					{phase.evidenceCount} ev.
				</span>
			</div>

			<span className="text-[10px] font-medium text-[var(--text-tertiary)]">
				{STATE_LABEL[phase.state]}
			</span>

			{phase.blocker && (
				<p className="text-[10px] leading-relaxed text-[var(--color-danger)]">
					{phase.blocker}
				</p>
			)}
			{phase.nextAction && (
				<p className="text-[10px] leading-relaxed text-[var(--color-primary)]">
					Siguiente: {phase.nextAction}
				</p>
			)}
		</div>
	);
}

export function ClosePhaseStrip({ phases, activeIndex }: ClosePhaseStripProps) {
	if (phases.length === 0) {
		return (
			<div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 text-center">
				<p className="text-sm text-[var(--text-tertiary)]">
					No hay fases de cierre definidas para este período.
				</p>
			</div>
		);
	}

	return (
		<div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-5">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
					Fases del cierre
				</h2>
				<span className="text-[10px] font-medium text-[var(--text-secondary)]">
					Fase activa: {phases[activeIndex]?.name ?? "—"}
				</span>
			</div>
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{phases.map((phase, index) => (
					<PhaseCard key={phase.name} phase={phase} index={index} />
				))}
			</div>
		</div>
	);
}
