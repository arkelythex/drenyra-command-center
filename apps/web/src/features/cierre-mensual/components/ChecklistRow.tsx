import { CheckCircle2, AlertTriangle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CierreMensualChecklistItem } from "@drenyra/domain";

interface ChecklistRowProps {
	item: CierreMensualChecklistItem;
	icon: LucideIcon;
	isNext: boolean;
}

export function ChecklistRow({ item, icon: Icon, isNext }: ChecklistRowProps) {
	return (
		<div
			className={cn(
				"flex items-start gap-3 rounded-xl border p-3.5 transition-all",
				item.completado
					? "border-[var(--color-success)]/20 bg-[var(--color-success)]/4"
					: isNext
						? "border-[var(--color-info)]/20 bg-[var(--color-info)]/4 ring-1 ring-[var(--color-info)]/10"
						: "border-[var(--border-subtle)] bg-[var(--surface-1)]",
			)}
		>
			<div
				className={cn(
					"mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
					item.completado
						? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
						: isNext
							? "bg-[var(--color-info)]/10 text-[var(--color-info)]"
							: "bg-[var(--surface-2)] text-[var(--text-tertiary)]",
				)}
			>
				{item.completado ? (
					<CheckCircle2 size={16} />
				) : isNext ? (
					<AlertTriangle size={16} />
				) : (
					<Icon size={16} />
				)}
			</div>

			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className="text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
						Paso {item.orden}
					</span>
					{isNext && !item.completado && (
						<span className="rounded-full border border-[var(--color-info)]/20 bg-[var(--color-info)]/8 px-1.5 py-0.5 text-3xs font-bold text-[var(--color-info)]">
							SIGUIENTE
						</span>
					)}
				</div>
				<p
					className={cn(
						"mt-0.5 text-xs font-bold",
						item.completado
							? "text-[var(--text-secondary)]"
							: "text-[var(--text-primary)]",
					)}
				>
					{item.label}
				</p>
				<p className="text-2xs text-[var(--text-tertiary)] leading-relaxed mt-0.5">
					{item.descripcion}
				</p>
				{item.requiereEvidencia && !item.completado && (
					<p className="mt-1.5 text-3xs text-[var(--color-warning)]">
						Requiere evidencia adjunta
					</p>
				)}
			</div>
		</div>
	);
}
