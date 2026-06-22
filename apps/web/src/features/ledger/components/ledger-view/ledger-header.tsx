import { Database, Download, Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LedgerHeaderProps {
	/** Periodo del libro (mes calendario actual), mostrado en el encabezado. */
	periodLabel: string;
	stickyZIndex: number;
	iconBorderRadius: string;
	onOpenMobileSidebar: () => void;
	onExport: () => void;
	onCreateEntry: () => void;
}

export function LedgerHeader({
	periodLabel,
	stickyZIndex,
	iconBorderRadius,
	onOpenMobileSidebar,
	onExport,
	onCreateEntry,
}: LedgerHeaderProps) {
	return (
		<header
			className="px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-1)] flex flex-col md:flex-row items-center justify-between gap-6 shrink-0 sticky top-0"
			style={{ zIndex: stickyZIndex }}
		>
			<div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
				<Button
					onClick={onOpenMobileSidebar}
					variant="outline"
					size="icon"
					aria-label="Menú"
					className="h-10 w-10 shrink-0 rounded-xl border-[var(--border-subtle)] bg-[var(--surface-1)] hover:bg-black/5 dark:hover:bg-white/5 lg:hidden"
				>
					<Menu className="h-5 w-5 text-muted-foreground" />
				</Button>
				<div
					className="flex h-12 w-12 items-center justify-center border border-border bg-card shadow-sm"
					style={{ borderRadius: iconBorderRadius }}
				>
					<Database size={22} className="text-primary" strokeWidth={1.75} />
				</div>
				<div className="flex-1 min-w-0">
					<h1 className="flex items-center gap-3 text-xl font-black tracking-tight text-foreground leading-none">
						Libro Mayor{" "}
						<span className="text-label font-mono text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-md border border-border/50">
							{periodLabel}
						</span>
					</h1>
					<div className="flex items-center gap-3 mt-1.5">
						<span className="text-label font-bold text-primary uppercase tracking-widest flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
							<span className="h-1.5 w-1.5 rounded-full bg-primary" />
							Cierre normativo
						</span>
						<span className="text-label text-muted-foreground font-medium flex items-center gap-1.5">
							<span className="w-px h-3 bg-border" />
							Actualizado hace 5 min
						</span>
					</div>
				</div>
			</div>

			<div className="flex items-center gap-3 w-full md:w-auto relative z-10 justify-end">
				<Button
					variant="outline"
					onClick={onExport}
					className="h-10 rounded-xl border-[var(--border-subtle)] bg-[var(--surface-1)] px-5 text-label font-bold uppercase tracking-widest text-muted-foreground transition-[background-color,border-color,box-shadow,color,transform] duration-200 hover:border-info-subtle hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
				>
					<Download size={14} className="mr-2" /> Exportar
				</Button>
				<Button
					onClick={onCreateEntry}
					className="group relative h-10 overflow-hidden rounded-xl border border-border/40 bg-foreground px-6 text-label font-black uppercase tracking-widest text-background shadow-xl shadow-black/5 transition-[background-color,border-color,box-shadow,transform,opacity] duration-200 hover:-translate-y-px hover:bg-foreground/90"
				>
					<span className="relative z-10 flex items-center gap-2">
						<Plus size={14} strokeWidth={3} /> Nuevo asiento
					</span>
					<div className="absolute inset-0 bg-foreground/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
				</Button>
			</div>
		</header>
	);
}
