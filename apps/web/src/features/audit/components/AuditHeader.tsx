import { Calendar, Download, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDesignTokens } from "@/lib/design-tokens";

export function AuditHeader() {
	const { zIndex, gradients, backdropBlur } = useDesignTokens();

	return (
		<header
			className={`px-6 py-4 border-b border-border/60 bg-background/80 ${backdropBlur.header} flex flex-col md:flex-row items-center justify-between gap-6 shrink-0 relative`}
			style={{ zIndex: zIndex.sticky }}
		>
			<div
				className={`absolute inset-0 ${gradients.ambient} pointer-events-none`}
			/>
			<div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
				<div className="h-12 w-12 rounded-2xl bg-info-subtle flex items-center justify-center border border-info-subtle shadow-lg shadow-info-glow">
					<History size={24} className="text-info" strokeWidth={1.5} />
				</div>
				<div className="flex-1 min-w-0">
					<h1 className="text-xl font-black uppercase tracking-tight text-foreground leading-none">
						Auditoría Interna
					</h1>
					<div className="flex items-center gap-3 mt-1.5">
						<span className="text-label font-bold text-info uppercase tracking-widest flex items-center gap-1.5 bg-info-subtle px-2 py-0.5 rounded border border-info-subtle">
							<span className="h-1.5 w-1.5 rounded-full bg-info animate-pulse" />
							TRACKING ACTIVO
						</span>
						<span className="hidden xs:inline text-muted-foreground/30 font-light text-label">
							|
						</span>
						<span className="hidden xs:inline text-label text-muted-foreground font-medium">
							Historial inmutable de operaciones
						</span>
					</div>
				</div>
			</div>

			<div className="flex flex-row items-center gap-3 w-full md:w-auto relative z-10 justify-end">
				<Button
					variant="outline"
					className="h-10 rounded-xl border-border/50 bg-background/50 px-5 text-label font-bold uppercase tracking-widest text-muted-foreground transition-[background-color,border-color,color,box-shadow,transform] duration-200 hover:border-info-subtle hover:bg-muted/50 hover:text-foreground"
				>
					<Calendar size={14} className="mr-2" /> Rango Fechas
				</Button>
				<Button className="group relative h-10 overflow-hidden rounded-xl border border-border/40 bg-foreground px-6 text-label font-black uppercase tracking-widest text-background shadow-xl shadow-black/5 transition-[background-color,border-color,box-shadow,transform,opacity] duration-200 hover:bg-foreground/90 hover:translate-y-[-1px]">
					<span className="relative z-10 flex items-center gap-2">
						<Download size={14} strokeWidth={3} /> Exportar Data
					</span>
				</Button>
			</div>
		</header>
	);
}
