import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AssetsInsightBanner() {
	return (
		<div className="px-4 sm:px-8 mb-6 shrink-0">
			<div className="relative flex items-center gap-5 overflow-hidden rounded-2xl border border-primary/15 bg-card p-4 shadow-sm">
				<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/8 text-primary">
					<TriangleAlert size={20} />
				</div>
				<div>
					<p className="mb-1 text-label font-semibold tracking-wide text-primary">
						Alerta operativa
					</p>
					<p className="text-sm leading-relaxed text-foreground/80">
						Se detectó desgaste acelerado en la flota de{" "}
						<span className="font-semibold text-foreground">vehículos</span>.
						Conviene programar mantenimiento preventivo para evitar una pérdida
						estimada de{" "}
						<span className="font-semibold text-destructive">15%</span> en el
						valor de reventa.
					</p>
				</div>
				<Button
					size="sm"
					className="ml-auto text-label font-semibold tracking-wide"
				>
					Ver detalle
				</Button>
			</div>
		</div>
	);
}
