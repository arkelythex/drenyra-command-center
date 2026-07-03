import {
	Clock3,
	Play,
	Pause,
	CheckCircle2,
	XCircle,
	RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AutomationDTO } from "../automations.api";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Play }> = {
	active: {
		label: "Activo",
		color: "text-[var(--color-success)]",
		bg: "bg-[var(--color-success)]/10",
		icon: Play,
	},
	paused: {
		label: "Pausado",
		color: "text-[var(--color-warning)]",
		bg: "bg-[var(--color-warning)]/10",
		icon: Pause,
	},
	draft: {
		label: "Borrador",
		color: "text-[var(--text-muted)]",
		bg: "bg-[var(--surface-2)]",
		icon: RefreshCw,
	},
	error: {
		label: "Error",
		color: "text-red-600",
		bg: "bg-red-50",
		icon: XCircle,
	},
};

const TRIGGER_LABELS: Record<string, string> = {
	schedule: "Programado",
	event: "Por evento",
	manual: "Manual",
};

const AUTONOMY_LABELS: Record<string, string> = {
	suggest: "Sugerir",
	"auto-approve": "Auto-aprobar",
	execute: "Ejecutar",
};

export interface AutomationCardProps {
	automation: AutomationDTO;
	onToggle: (id: string, active: boolean) => void;
	onRun?: (id: string) => void;
	onSelect: (automation: AutomationDTO) => void;
	isLoading?: boolean;
}

export function AutomationCard({
	automation,
	onToggle,
	onRun,
	onSelect,
	isLoading,
}: AutomationCardProps) {
	const statusCfg = STATUS_CONFIG[automation.status] ?? STATUS_CONFIG.draft;
	const StatusIcon = statusCfg.icon;
	const isActive = automation.status === "active";

	return (
		<div className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 hover:border-[var(--border-default)] transition-all duration-200">
			<div className="flex items-start justify-between mb-4">
				<div className="flex items-center gap-3">
					<div
						className={cn("rounded-xl p-2.5 transition-colors", statusCfg.bg)}
					>
						<StatusIcon
							size={18}
							strokeWidth={2.5}
							className={statusCfg.color}
						/>
					</div>
					<div>
						<button
							type="button"
							onClick={() => onSelect(automation)}
							className="text-sm font-bold text-[var(--text-primary)] hover:text-[var(--color-primary)] transition-colors"
						>
							{automation.name}
						</button>
						{automation.description && (
							<p className="text-xs text-[var(--text-secondary)] mt-0.5">
								{automation.description}
							</p>
						)}
					</div>
				</div>

				<button
					type="button"
					onClick={() => onToggle(automation.id, !isActive)}
					disabled={isLoading}
					className={cn(
						"flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
						isActive
							? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
							: "bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:opacity-80",
					)}
				>
					{isActive ? <Pause size={12} /> : <Play size={12} />}
					{isActive ? "Pausar" : "Activar"}
				</button>
			</div>

			{/* Meta */}
			<div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
				<span
					className={cn(
						"rounded-md px-1.5 py-0.5 font-medium",
						statusCfg.bg,
						statusCfg.color,
					)}
				>
					{statusCfg.label}
				</span>
				<span className="flex items-center gap-1">
					<Clock3 size={11} /> {TRIGGER_LABELS[automation.triggerType] ?? automation.triggerType}
				</span>
				<span>{AUTONOMY_LABELS[automation.autonomy] ?? automation.autonomy}</span>
			</div>

			{/* Skills */}
			{automation.skills.length > 0 && (
				<div className="mt-3 flex flex-wrap gap-1.5">
					{automation.skills.map((skill) => (
						<span
							key={skill.id}
							className="rounded-md bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]"
						>
							{skill.name}
						</span>
					))}
				</div>
			)}

			{/* Stats */}
			<div className="mt-4 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 text-xs text-[var(--text-muted)]">
				<div className="flex items-center gap-3">
					<span>{automation.runCount} ejecuciones</span>
					{automation.lastRunAt && (
						<span>
							Última:{" "}
							{automation.lastRunStatus === "success" ? (
								<CheckCircle2 size={10} className="inline text-[var(--color-success)]" />
							) : automation.lastRunStatus === "failed" ? (
								<XCircle size={10} className="inline text-red-500" />
							) : null}
							{new Date(automation.lastRunAt).toLocaleDateString()}
						</span>
					)}
				</div>

				{automation.status !== "draft" && (
					<button
						type="button"
						onClick={() => onRun?.(automation.id)}
						className="flex items-center gap-1 text-[var(--color-primary)] hover:underline"
					>
						<RefreshCw size={11} />
						Ejecutar
					</button>
				)}
			</div>
		</div>
	);
}
