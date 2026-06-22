import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BankingMobileToolbarProps {
	searchQuery: string;
	onSearchQueryChange: (value: string) => void;
}

export function BankingMobileToolbar({
	searchQuery,
	onSearchQueryChange,
}: BankingMobileToolbarProps) {
	return (
		<div className="relative z-40 mt-14 flex flex-col gap-4 border-b border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4 shadow-sm sm:hidden">
			<div className="flex gap-3 w-full items-center">
				<div className="relative group flex-1">
					<Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]/60 transition-colors group-focus-within:text-[var(--accent)]" />
					<input
						aria-label="Buscar movimiento"
						value={searchQuery}
						onChange={(event) => onSearchQueryChange(event.target.value)}
						placeholder="Rastreo de Operación..."
						className="ui-search-input h-12 w-full rounded-2xl pl-12 text-sm font-semibold uppercase tracking-tight"
					/>
				</div>

				<Button
					variant="outline"
					size="icon"
					aria-label="Descargar"
					className="h-12 w-12 rounded-2xl border-[var(--border-subtle)] shadow-sm hover:bg-[var(--surface-hover)]"
				>
					<Download size={18} />
				</Button>
			</div>
		</div>
	);
}
