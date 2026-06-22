import type { FiscalCase } from "../api/drenyra-command-center.api";
import { cn } from "@/lib/utils";
import { FiscalRiskBadge } from "./fiscal-risk-badge";

export function FiscalCaseList({
	cases,
	selectedCaseId,
	isLoading,
	onSelect,
}: {
	cases: FiscalCase[];
	selectedCaseId: string | null;
	isLoading: boolean;
	onSelect: (id: string) => void;
}) {
	if (isLoading)
		return (
			<div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4 text-sm text-[var(--text-tertiary)]">
				Cargando casos fiscales…
			</div>
		);
	return (
		<section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
			<div className="mb-3 flex items-center justify-between px-1">
				<h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
					Casos fiscales
				</h3>
				<span className="text-2xs text-[var(--text-tertiary)]">
					{cases.length}
				</span>
			</div>
			<div className="space-y-2">
				{cases.length === 0 && (
					<p className="rounded-xl border border-dashed border-[var(--border-subtle)] p-4 text-xs text-[var(--text-tertiary)]">
						No hay casos todavía. Creá un caso mock para iniciar el command
						center.
					</p>
				)}
				{cases.map((item) => (
					<button
						key={item.id}
						onClick={() => onSelect(item.id)}
						className={cn(
							"w-full rounded-xl border p-3 text-left transition",
							item.id === selectedCaseId
								? "border-[var(--color-info)] bg-[var(--color-info)]/10"
								: "border-[var(--border-subtle)] bg-[var(--surface-1)] hover:border-[var(--border-strong)]",
						)}
					>
						<div className="flex items-start justify-between gap-2">
							<p className="text-sm font-bold">{item.title}</p>
							<FiscalRiskBadge riskLevel={item.riskLevel} compact />
						</div>
						<p className="mt-1 line-clamp-2 text-xs text-[var(--text-tertiary)]">
							{item.description}
						</p>
						<p className="mt-2 text-2xs font-semibold text-[var(--text-secondary)]">
							{item.type} · {item.status}
						</p>
					</button>
				))}
			</div>
		</section>
	);
}
