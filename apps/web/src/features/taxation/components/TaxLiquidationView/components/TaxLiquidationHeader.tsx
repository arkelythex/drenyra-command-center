import { Download, Menu, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BORDER_RADIUS, Z_INDEX } from "@/lib/design-tokens";
import type { TaxLiquidationHeaderProps } from "../types";

export function TaxLiquidationHeader({ period, onMenuClick }: TaxLiquidationHeaderProps) {
	return (
		<header
			className="hidden sm:flex px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-1)] flex-col md:flex-row items-center justify-between gap-6 shrink-0 sticky top-0"
			style={{ zIndex: Z_INDEX.sticky }}
		>
			<div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
				<Button
					onClick={onMenuClick}
					variant="outline"
					size="icon"
					aria-label="Menú"
					className="h-10 w-10 shrink-0 rounded-xl border-[var(--border-subtle)] bg-[var(--surface-1)] hover:bg-black/5 dark:hover:bg-white/5 lg:hidden"
				>
					<Menu className="h-5 w-5 text-muted-foreground" />
				</Button>
				<div
					className="flex h-12 w-12 items-center justify-center border border-border bg-card shadow-sm"
					style={{ borderRadius: BORDER_RADIUS.icon }}
				>
					<ShieldCheck
						size={22}
						className="text-primary"
						strokeWidth={1.75}
					/>
				</div>
				<div className="flex-1 min-w-0">
					<h1 className="text-xl font-black uppercase tracking-tight text-foreground leading-none">
						Liquidación tributaria
					</h1>
					<div className="flex items-center gap-3 mt-1.5">
						<span className="text-label font-bold text-primary uppercase tracking-widest flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
							<span className="h-1.5 w-1.5 rounded-full bg-primary" />
							PDT 621
						</span>
						<span className="hidden xs:inline text-muted-foreground/30 font-light text-label">
							|
						</span>
						<span className="hidden xs:inline text-label text-muted-foreground font-medium flex items-center gap-1.5">
							Periodo {period}
						</span>
					</div>
				</div>
			</div>

			<div className="flex flex-row items-center gap-3 w-full md:w-auto relative z-10 justify-end">
				<Button
					variant="outline"
					className="h-10 rounded-xl border-[var(--border-subtle)] bg-[var(--surface-1)] px-5 text-label font-bold uppercase tracking-widest text-muted-foreground transition-[background-color,border-color,color,box-shadow] hover:border-primary/20 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
				>
					<RefreshCw size={14} className="mr-2" /> Recalcular
				</Button>
				<Button className="group relative h-10 overflow-hidden rounded-xl border border-border/40 bg-foreground px-6 text-label font-black uppercase tracking-widest text-background shadow-lg shadow-black/5 transition-[background-color,box-shadow,transform] hover:-translate-y-px hover:bg-foreground/90 hover:shadow-xl">
					<span className="relative z-10 flex items-center gap-2">
						<Download size={14} strokeWidth={3} /> Exportar
					</span>
				</Button>
			</div>
		</header>
	);
}
