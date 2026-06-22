import { Loader2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODULE_LABELS, STATUS_BADGE } from "../ApprovalHubPage.data";

interface ApprovalHubHeaderProps {
	isLoading: boolean;
	pendingCount: number;
	highRiskCount: number;
	urgentCount: number;
	filter: "ALL" | "PENDING" | "APPROVED" | "REJECTED";
	onFilterChange: (filter: "ALL" | "PENDING" | "APPROVED" | "REJECTED") => void;
	selectedModule: string | "ALL";
	onModuleChange: (module: string) => void;
	modules: string[];
}

export function ApprovalHubHeader({
	isLoading,
	pendingCount,
	highRiskCount,
	urgentCount,
	filter,
	onFilterChange,
	selectedModule,
	onModuleChange,
	modules,
}: ApprovalHubHeaderProps) {
	return (
		<header className="space-y-4">
			{/* Title row */}
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
					Centro de Aprobaciones
				</h1>
				{isLoading && (
					<Loader2
						size={16}
						className="animate-spin text-[var(--text-tertiary)]"
					/>
				)}
			</div>

			{/* Stats */}
			<div className="grid grid-cols-3 gap-3">
				<StatBadge
					label="Pendientes"
					value={String(pendingCount)}
					color="var(--color-warning)"
				/>
				<StatBadge
					label="Alto Riesgo"
					value={String(highRiskCount)}
					color="var(--color-danger)"
				/>
				<StatBadge
					label="Urgentes"
					value={String(urgentCount)}
					color="var(--color-danger)"
				/>
			</div>

			{/* Filters */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-1.5">
					{(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((f) => (
						<button
							key={f}
							onClick={() => onFilterChange(f)}
							className={cn(
								"rounded-lg px-3 py-1.5 text-2xs font-bold transition-all",
								filter === f
									? "bg-[var(--surface-2)] text-[var(--text-primary)] ring-1 ring-[var(--border-default)]"
									: "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
							)}
						>
							{f === "ALL" ? "Todos" : STATUS_BADGE[f].label}
						</button>
					))}
				</div>

				<div className="flex items-center gap-2">
					<Filter size={12} className="text-[var(--text-tertiary)]" />
					<select
						aria-label="Filtrar por módulo"
						value={selectedModule}
						onChange={(e) => onModuleChange(e.target.value)}
						className="h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 text-2xs font-bold text-[var(--text-primary)] outline-none"
					>
						{modules.map((m) => (
							<option key={m} value={m}>
								{m === "ALL"
									? "Todos los módulos"
									: (MODULE_LABELS[m] ?? m)}
							</option>
						))}
					</select>
				</div>
			</div>
		</header>
	);
}

function StatBadge({
	label,
	value,
	color,
}: {
	label: string;
	value: string;
	color: string;
}) {
	return (
		<div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 text-center">
			<p className="text-lg font-bold" style={{ color }}>
				{value}
			</p>
			<p className="text-3xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
				{label}
			</p>
		</div>
	);
}
