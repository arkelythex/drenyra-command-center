import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDesignTokens } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

interface AuditFiltersProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	selectedPeriod: string;
	onPeriodChange: (period: string) => void;
}

const periods = [
	{ id: "day", label: "Hoy" },
	{ id: "week", label: "Semana" },
	{ id: "month", label: "Mes" },
];

export function AuditFilters({
	searchQuery,
	onSearchChange,
	selectedPeriod,
	onPeriodChange,
}: AuditFiltersProps) {
	const { backdropBlur } = useDesignTokens();

	return (
		<div
			className={`px-6 py-4 border-b border-border/50 bg-background/40 ${backdropBlur.sm} flex flex-col sm:flex-row items-center gap-6 z-40 relative`}
		>
			<div className="relative group flex-1 max-w-sm w-full">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground group-focus-within:text-foreground transition-colors" />
				<Input
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder="BUSCAR EVENTO..."
					className="h-10 w-full rounded-xl border-border/50 bg-muted/30 pl-10 text-label font-bold uppercase tracking-wider transition-[background-color,border-color,box-shadow,color] duration-200 placeholder:text-muted-foreground/50 focus:bg-background focus:outline-none focus-visible:border-primary"
				/>
			</div>

			<div className="flex gap-1 bg-muted/30 p-1 rounded-xl border border-border/50 w-full sm:w-auto justify-center">
				{periods.map((period) => (
					<button
						key={period.id}
						onClick={() => onPeriodChange(period.id)}
						className={cn(
							"relative h-8 overflow-hidden rounded-lg px-5 text-xs font-black uppercase tracking-widest transition-[background-color,border-color,color,box-shadow,transform] duration-200",
							selectedPeriod === period.id
								? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
								: "text-muted-foreground hover:text-foreground hover:bg-background/50",
						)}
					>
						{period.label}
					</button>
				))}
			</div>
		</div>
	);
}
