import { Building2, Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EntitiesTableHeaderProps {
	search: string;
	onSearch: (value: string) => void;
}

export function EntitiesTableHeader({
	search,
	onSearch,
}: EntitiesTableHeaderProps) {
	return (
		<header className="sticky top-0 z-[40] flex shrink-0 flex-col items-center justify-between gap-5 border-b border-border bg-card/90 px-6 py-5 shadow-sm md:flex-row">
			<div className="flex items-center gap-6 w-full md:w-auto group">
				<div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-card text-primary transition-[transform,box-shadow,background-color] duration-200 group-hover:border-primary/20">
					<Building2 size={22} strokeWidth={2} />
				</div>
				<div className="flex-1 min-w-0">
					<h1 className="mb-1 text-xl font-semibold tracking-tight text-foreground leading-none">
						Empresas y terceros
					</h1>
					<div className="flex items-center gap-3">
						<Badge variant="info" className="h-6 gap-2 border-primary/20 bg-primary/10 text-primary">
							<div className="w-1.5 h-1.5 rounded-full bg-current" />
							Directorio activo
						</Badge>
						<span className="text-2xs font-medium text-muted-foreground/80 tracking-[0.08em]">
							Padrón verificado
						</span>
					</div>
				</div>
			</div>

			<div className="flex items-center gap-4 w-full md:w-auto">
				<div className="relative flex-1 md:w-80 group">
					<Search className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground/60 transition-colors duration-300 group-focus-within:text-primary" />
					<input
						aria-label="Buscar entidad"
						value={search}
						onChange={(event) => onSearch(event.target.value)}
						placeholder="Buscar por RUC o razón social..."
						className="h-11 w-full rounded-2xl border border-border bg-card/70 pl-12 pr-6 text-sm font-medium tracking-tight shadow-inner transition-[background-color,border-color,box-shadow] duration-200 placeholder:text-muted-foreground/70 focus:outline-none focus-visible:border-primary/40 focus:ring-4 focus:ring-primary/10"
					/>
				</div>
				<Button
					variant="outline"
					className="h-11 rounded-2xl border-border px-5 text-label font-medium tracking-wide text-foreground transition-[background-color,border-color,box-shadow,transform] duration-200 hover:bg-muted/70 active:scale-95"
				>
					<Filter size={16} strokeWidth={2.25} className="sm:mr-2" />
					<span className="hidden sm:inline">Filtros</span>
				</Button>
			</div>
		</header>
	);
}
