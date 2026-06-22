import { Calculator } from "lucide-react";
import { entranceVariants, MotionDiv } from "@/components/ui/motion-primitives";
import { cn, n } from "@/lib/utils";
import type { TaxLiquidationTableProps, TaxRowProps } from "../types";

const TaxRow = ({ label, value, isNegative, code }: TaxRowProps) => (
	<div className="px-8 py-6 flex justify-between items-center hover:bg-muted/30 transition-colors group">
		<div className="flex flex-col gap-1">
			<span className="text-sm font-bold text-foreground/80 uppercase tracking-widest">
				{label}
			</span>
			<span className="text-2xs font-mono font-bold text-muted-foreground/50 border border-border/50 rounded px-1 w-fit group-hover:border-[rgba(var(--premium-info-rgb),0.30)] group-hover:text-[var(--premium-action-cyan)] transition-colors">
				CASILLA {code}
			</span>
		</div>
		<span
			className={cn(
				"font-black font-mono text-base tracking-tight tabular-nums px-3 py-1 rounded-lg transition-colors",
				isNegative
					? "text-red-500 bg-red-500/5 group-hover:bg-red-500/10"
					: "text-foreground group-hover:bg-background",
			)}
		>
			{n(value)}
		</span>
	</div>
);

export function TaxLiquidationTable({
	debito,
	credito,
	totalImpuestos,
}: TaxLiquidationTableProps) {
	return (
		<MotionDiv
			variants={entranceVariants}
			className="rounded-3xl border border-border/50 bg-card shadow-xl overflow-hidden group cursor-default hover:border-[rgba(var(--premium-info-rgb),0.30)] transition-colors duration-500"
		>
			<div className="px-8 py-6 border-b border-border/50 bg-muted/20 flex justify-between items-center">
				<h3 className="text-label font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-3">
					<div className="p-1.5 rounded-md bg-background border border-border">
						<Calculator size={14} className="text-muted-foreground" />
					</div>
					Determinación de la Deuda
				</h3>
			</div>
			<div className="divide-y divide-border/30">
				<TaxRow label="Ventas Netas" value={debito} code="100" />
				<TaxRow label="Compras Netas" value={credito} isNegative code="107" />

				<div className="px-8 py-8 flex justify-between items-center bg-foreground text-background relative overflow-hidden">
					<div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20" />
					<div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[var(--premium-action-cyan)] to-transparent" />

					<span className="relative z-10 text-label font-black uppercase tracking-[0.25em] flex items-center gap-2">
						Total Impuestos del Mes
					</span>
					<span className="relative z-10 text-3xl font-black font-mono tracking-tighter tabular-nums text-background drop-shadow-md">
						{n(totalImpuestos)}
					</span>
				</div>
			</div>
		</MotionDiv>
	);
}
