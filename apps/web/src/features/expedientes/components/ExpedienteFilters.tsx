import { Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ExpedienteKind } from "@arkelythex/domain";
import { EXPEDIENTE_KIND_LABELS } from "@arkelythex/domain";

export interface ExpedienteFiltersProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	selectedKind: ExpedienteKind | "ALL";
	onKindChange: (kind: ExpedienteKind | "ALL") => void;
}

const FILTER_KINDS: Array<ExpedienteKind | "ALL"> = [
	"ALL",
	"CIERRE_MENSUAL",
	"SIRE_COMPRAS",
	"SIRE_VENTAS",
	"CONCILIACION_BANCARIA",
	"AUDITORIA_FISCAL",
];

export function ExpedienteFilters({
	searchQuery,
	onSearchChange,
	selectedKind,
	onKindChange,
}: ExpedienteFiltersProps) {
	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex items-center gap-1.5 flex-wrap">
				{FILTER_KINDS.map((k) => (
					<button
						key={k}
						onClick={() => onKindChange(k)}
						type="button"
						className={cn(
							"rounded-lg px-3 py-1.5 text-2xs font-bold transition-all",
							selectedKind === k
								? "bg-[var(--surface-2)] text-[var(--text-primary)] ring-1 ring-[var(--border-default)]"
								: "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
						)}
					>
						{k === "ALL" ? "Todos" : EXPEDIENTE_KIND_LABELS[k]}
					</button>
				))}
			</div>

			<div className="flex items-center gap-2">
				<div className="relative w-full sm:w-64">
					<Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary)]" />
					<input
						aria-label="Buscar expediente"
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder="Buscar expediente..."
						className="w-full h-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] pl-9 pr-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none transition-colors focus:border-[var(--color-info)]/40"
					/>
				</div>
				<Button size="sm" className="h-9 px-3 text-2xs font-bold">
					<Plus size={14} className="mr-1" />
					Nuevo
				</Button>
			</div>
		</div>
	);
}
