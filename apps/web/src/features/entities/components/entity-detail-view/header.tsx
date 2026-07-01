import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LEGIBILITY } from "@/lib/legibility";
import { cn } from "@/lib/utils";
import type { Entity } from "../../types/entity.types";

interface EntityDetailHeaderProps {
	entity: Entity;
	onBack: () => void;
	onExportReport: () => void;
	onRefreshSunat: () => void;
}

export function EntityDetailHeader({
	entity,
	onBack,
	onExportReport,
	onRefreshSunat,
}: EntityDetailHeaderProps) {
	return (
		<div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-background/80 px-8 py-6 ">
			<div className="flex items-center gap-6">
				<Button
					variant="ghost"
					size="icon"
					aria-label="Volver"
					onClick={onBack}
					className="h-12 w-12 rounded-2xl transition-[background-color,border-color,box-shadow,transform] duration-200 hover:bg-muted active:scale-90"
				>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<div>
					<div className="flex items-center gap-3">
						<h2
							className={cn(
								"text-2xl font-black text-foreground uppercase tracking-tight",
								LEGIBILITY.textShadow.light,
							)}
						>
							{entity.legalName}
						</h2>
						<span className="px-3 py-1 text-xs font-black rounded-full uppercase tracking-widest border bg-muted/60 border-border text-secondary">
							{entity.type}
						</span>
					</div>
					<p className="text-label font-bold text-muted-foreground uppercase tracking-widest mt-1.5 flex items-center gap-2">
						<span className="font-mono bg-muted/70 px-1.5 py-0.5 rounded border border-border/60">
							RUC: {entity.taxId}
						</span>
						<span className="h-1 w-1 rounded-full bg-border" />
						<span>{entity.condition}</span>
						<span className="h-1 w-1 rounded-full bg-border" />
						<span>{entity.status}</span>
					</p>
				</div>
			</div>

			<div className="flex items-center gap-3">
				<Button
					variant="outline"
					onClick={onExportReport}
					className="h-11 rounded-xl border-border/60 px-6 text-label font-black uppercase tracking-widest transition-[background-color,border-color,box-shadow,transform] duration-200 hover:bg-muted"
				>
					<Download className="mr-2 h-4 w-4" /> Reporte Auditoria
				</Button>
				<Button
					onClick={onRefreshSunat}
					className="h-11 rounded-xl bg-foreground px-6 text-label font-black uppercase tracking-widest text-background shadow-xl shadow-black/20 transition-[background-color,border-color,box-shadow,transform,opacity] duration-200 hover:-translate-y-0.5 hover:bg-foreground/90 active:scale-95"
				>
					Actualizar SUNAT
				</Button>
			</div>
		</div>
	);
}
