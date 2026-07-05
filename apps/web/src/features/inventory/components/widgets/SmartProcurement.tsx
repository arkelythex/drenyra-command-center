import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const SmartProcurement = () => {
	return (
		<div
			className="flex-1 bg-card border border-border/40 shadow-sm p-8 relative overflow-hidden group"
			style={{ borderRadius: "2rem" }}
		>
			{/* Background Ambience */}
			<div className="absolute inset-0 bg-gradient-to-br from-white/8 to-zinc-300/6 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
			<div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(to_bottom,transparent,black)] opacity-0 dark:opacity-20 pointer-events-none" />

			<div className="relative z-10 h-full flex flex-col">
				<div className="h-14 w-14 rounded-2xl bg-foreground text-background flex items-center justify-center mb-6 shadow-xl shadow-foreground/10 group-hover:scale-110 transition-transform duration-500">
					<ShoppingCart size={28} />
				</div>

				<h3 className="text-xl font-black uppercase tracking-tight mb-3 text-foreground">
					Sugerencia de Compra
				</h3>

				<p className="text-sm font-medium text-muted-foreground leading-relaxed mb-8 flex-1">
					Basado en tu rotación histórica y tiempos de entrega, deberías reponer{" "}
					<span className="text-foreground font-black border-b-2 border-primary/30 pb-0.5">
						Cableado Estructurado
					</span>{" "}
					antes del viernes.
				</p>

				<Button className="w-full rounded-xl bg-foreground py-6 text-label font-black uppercase tracking-widest text-background shadow-lg shadow-foreground/10 transition-[background-color,box-shadow,transform] hover:scale-[1.01] hover:bg-foreground/90 hover:shadow-xl active:scale-[0.99]">
					Generar Orden de Compra
				</Button>
			</div>
		</div>
	);
};
