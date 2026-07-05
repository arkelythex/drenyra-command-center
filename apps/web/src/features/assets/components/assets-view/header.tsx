import { Filter, Menu, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AssetsHeaderProps {
	onOpenSidebar: () => void;
}

export function AssetsHeader({ onOpenSidebar }: AssetsHeaderProps) {
	return (
		<div className="z-20 flex shrink-0 flex-col items-center justify-between gap-4 border-b border-border bg-background/90 px-4 py-4 sm:gap-5 sm:px-8 md:flex-row">
			<Button
				onClick={onOpenSidebar}
				variant="outline"
				size="icon"
				aria-label="Menú"
				className="h-9 w-9 shrink-0 rounded-xl border-border/50 bg-card hover:bg-card/80 lg:hidden mr-4"
			>
				<Menu className="h-4 w-4 text-muted-foreground" />
			</Button>
			<div>
				<h1 className="text-xl font-semibold tracking-tight text-foreground">
					Control de activos
				</h1>
				<div className="mt-1 flex items-center gap-3 text-xs font-medium text-muted-foreground">
					<span className="text-primary">Depreciación LIR</span>
					<span className="opacity-30">|</span>
					<span>Auditoría física</span>
				</div>
			</div>
			<div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
				<Button
					variant="outline"
					size="sm"
					className="h-9 w-full rounded-lg border-border px-4 text-label font-semibold tracking-wide text-muted-foreground transition-[background-color,border-color,box-shadow,transform] duration-200 hover:bg-muted/50 sm:w-auto"
				>
					<Filter size={14} className="mr-2" /> Filtros
				</Button>
				<Button className="h-9 w-full rounded-lg border-none bg-primary px-6 text-label font-semibold tracking-wide text-primary-foreground shadow-sm transition-[background-color,box-shadow,transform,opacity] duration-200 hover:bg-primary/90 sm:w-auto">
					<QrCode size={14} className="mr-2" /> Nuevo activo
				</Button>
			</div>
		</div>
	);
}
