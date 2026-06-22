import { entranceVariants, MotionDiv } from "@/components/ui/motion-primitives";
import { cn, n } from "@/lib/utils";
import type { TaxLiquidationSummaryProps, TaxStatProps } from "../types";

const TaxStat = ({ label, value, highlight }: TaxStatProps) => (
	<MotionDiv
		variants={entranceVariants}
		className={cn(
			"group relative overflow-hidden rounded-3xl border p-8 transition-[background-color,border-color,box-shadow,transform] duration-300",
			highlight
				? "border-transparent bg-foreground text-background shadow-xl shadow-black/15"
				: "bg-card border-border/50 shadow-sm hover:shadow-lg hover:border-[rgba(var(--premium-info-rgb),0.20)]",
		)}
	>
		{highlight && (
			<div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
		)}
		<p
			className={cn(
				"text-xs font-black uppercase tracking-[0.22em] mb-4 transition-colors",
				highlight
					? "text-background/70"
					: "text-muted-foreground group-hover:text-[var(--premium-action-cyan)]",
			)}
		>
			{label}
		</p>
		<p
			className={cn(
				"text-3xl font-black font-mono tracking-tighter tabular-nums",
				!highlight && "text-foreground",
			)}
		>
			{value}
		</p>
	</MotionDiv>
);

export function TaxLiquidationSummary({
	igvPagar,
	rentaPagar,
	totalImpuestos,
}: TaxLiquidationSummaryProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
			<TaxStat label="IGV Estimado" value={n(igvPagar)} delay={0.1} />
			<TaxStat label="Renta (Pago Cuenta)" value={n(rentaPagar)} delay={0.2} />
			<TaxStat label="Total del periodo" value={n(totalImpuestos)} highlight delay={0.3} />
		</div>
	);
}
