import { ArrowRight, FileText, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDesignTokens } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

interface DrillDownPanelProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
}

export const DrillDownPanel = ({
	isOpen,
	onClose,
	title,
}: DrillDownPanelProps) => {
	const { zIndex } = useDesignTokens();

	return (
		<aside
			className={cn(
				"fixed inset-y-0 right-0 w-full sm:w-[500px] bg-background border-l border-border shadow-xl transition-transform duration-200 ease-out flex flex-col",
				isOpen ? "translate-x-0" : "translate-x-full",
			)}
			style={{ zIndex: zIndex.modal }}
		>
			<header className="p-8 border-b border-border bg-muted/5 flex items-center justify-between">
				<div>
					<h2 className="text-sm font-black uppercase tracking-widest text-foreground">
						Detalle de Partida
					</h2>
					<p className="text-xl font-black tracking-tighter text-foreground mt-1 uppercase">
						{title}
					</p>
				</div>
				<button
					onClick={onClose}
					className="p-2 hover:bg-muted rounded-full transition-colors duration-150"
				>
					<X size={20} />
				</button>
			</header>

			<div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
				<p className="text-2xs font-black text-muted-foreground uppercase tracking-[0.3em]">
					Composición de Saldo (Vouchers)
				</p>

				{/* Lista de transacciones que componen el saldo */}
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className="p-5 rounded-2xl border border-border bg-muted/10 hover:border-foreground/20 transition-[border-color,background-color] duration-150 cursor-default group"
					>
						<div className="flex justify-between items-start mb-4">
							<span className="text-2xs font-mono font-bold text-muted-foreground">
								ASIENTO 001-0004{i}
							</span>
							<span className="text-xs font-black font-mono">S/ 12,400.00</span>
						</div>
						<p className="text-[13px] font-bold uppercase tracking-tight text-foreground/80">
							Pago Factura Proveedor Tecnológico
						</p>
						<div className="mt-4 flex items-center justify-between">
							<div className="flex items-center gap-2 text-3xs font-black text-muted-foreground uppercase">
								<FileText size={12} /> FT F001-000231
							</div>
							<button className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1 text-3xs font-black uppercase tracking-widest">
								Ver Voucher <ArrowRight size={12} />
							</button>
						</div>
					</div>
				))}
			</div>

			<footer className="p-8 border-t border-border bg-muted/10">
				<Button size="lg" className="w-full">
					Exportar Detalle (Excel/PDF)
				</Button>
			</footer>
		</aside>
	);
};
