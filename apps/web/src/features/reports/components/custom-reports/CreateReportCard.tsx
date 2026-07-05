import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreateReportCardProps {
	onCreate: () => void;
}

export const CreateReportCard = ({ onCreate }: CreateReportCardProps) => {
	return (
		<div className="group relative h-[460px]">
			<div
				onClick={onCreate}
				className="relative flex h-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-border bg-card/40 p-10 text-center shadow-inner transition-[background-color,border-color,box-shadow,transform] duration-500 hover:border-primary/40 hover:bg-card/60 active:scale-[0.98]"
			>
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--color-primary-rgb),0.05),transparent_70%)] opacity-0 transition-opacity duration-1000 group-hover:opacity-100" />

				<div className="relative z-10 mb-8 flex h-24 w-24 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 shadow-xl ring-4 ring-primary/5 transition-[background-color,border-color,box-shadow,transform] duration-500 group-hover:scale-105 group-hover:border-primary/40 group-hover:bg-primary/10">
					<Plus className="h-10 w-10 text-primary" strokeWidth={1.5} />
				</div>

				<h3 className="z-10 mb-4 text-xs font-black uppercase tracking-[0.3em] text-foreground/70 transition-colors group-hover:text-primary">
					Iniciar Consolidacion
				</h3>

				<p className="z-10 mx-auto mb-10 max-w-[220px] text-label font-black uppercase leading-relaxed tracking-[0.2em] text-muted-foreground/80">
					Cruzar estados financieros NIIF con transaccionalidad bancaria.
				</p>

				<Button className="z-10 h-12 translate-y-6 rounded-2xl bg-primary px-10 text-2xs font-black uppercase tracking-[0.2em] text-primary-foreground opacity-0 shadow-lg shadow-primary/15 transition-[background-color,box-shadow,transform,opacity] duration-300 group-hover:translate-y-0 group-hover:opacity-100">
					Explorar Fuentes de Datos
				</Button>
			</div>
		</div>
	);
};
