import { BadgePercent, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { AnimatedNumber } from "../../../../components/ui/motion-primitives";
import { cn, n } from "../../../../lib/utils";

interface CustomerAuditSidebarProps {
	stats: { totalRevenue: number; totalPending: number; retentionTotal: number };
}

interface AuditKPIProps {
	label: string;
	value: number;
	sub: string;
	icon: ReactNode;
	alert?: boolean;
	formatter: (value: number) => string;
}

const PEN_FORMATTER = (v: number) => n(v);

export const CustomerAuditSidebar = ({ stats }: CustomerAuditSidebarProps) => {
	return (
		<div className="p-10 space-y-10 h-full flex flex-col bg-transparent">
			<div className="flex flex-col gap-2 mb-4">
				<h2 className="text-2xs font-black text-primary uppercase tracking-[0.32em] leading-none">
					Cartera comercial
				</h2>
				<p className="text-xl font-black tracking-tight text-foreground">
					Análisis de cartera
				</p>
				<div className="mt-2 w-fit bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full text-3xs font-black uppercase tracking-widest">
					Periodo Fiscal 2026
				</div>
			</div>

			<div className="space-y-6">
				<AuditKPI
					label="Facturación Bruta"
					value={stats.totalRevenue}
					sub="Ingresos Netos Devengados"
					icon={<TrendingUp size={18} strokeWidth={2.5} />}
					formatter={PEN_FORMATTER}
				/>
				<AuditKPI
					label="Exposición operativa"
					value={stats.totalPending}
					sub="Pendiente de Liquidación"
					icon={<Wallet size={18} strokeWidth={2.5} />}
					alert={stats.totalPending > 0}
					formatter={PEN_FORMATTER}
				/>
				<AuditKPI
					label="Retenciones Aplicadas"
					value={stats.retentionTotal}
					sub="Crédito Fiscal Acumulado"
					icon={<BadgePercent size={18} strokeWidth={2.5} />}
					formatter={PEN_FORMATTER}
				/>
			</div>

			<div className="mt-auto pt-10 border-t border-border">
				<div className="group relative overflow-hidden rounded-3xl border border-primary/10 bg-primary/5 p-6">
					<div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
						<ShieldCheck size={48} />
					</div>
					<p className="text-3xs font-black uppercase tracking-widest text-primary mb-2">
						Lectura recomendada
					</p>
					<p className="text-xs font-medium text-muted-foreground leading-relaxed">
						El índice de salud de su cartera es del{" "}
						<span className="text-primary font-black">94.2%</span>. Se
						recomienda priorizar la liquidación de retenciones.
					</p>
				</div>
			</div>
		</div>
	);
};

const AuditKPI = ({
	label,
	value,
	sub,
	icon,
	alert,
	formatter,
}: AuditKPIProps) => (
	<div
		className={cn(
			"group relative overflow-hidden rounded-2xl border p-6 transition-[background-color,border-color,box-shadow,transform] duration-200",
			alert
				? "bg-red-500/5 border-red-500/20 shadow-xl shadow-red-500/5 ring-1 ring-red-500/10"
				: "border-border bg-card shadow-lg hover:bg-muted/70",
		)}
	>
		<div className="relative z-10">
			<div className="flex justify-between items-start mb-5">
				<p
					className={cn(
						"text-3xs font-black uppercase tracking-[0.2em]",
						alert
							? "text-red-500"
							: "text-muted-foreground/60 group-hover:text-primary transition-colors",
					)}
				>
					{label}
				</p>
				<div
					className={cn(
						"rounded-xl border p-2 shadow-inner transition-[background-color,border-color,color,transform] duration-200 group-hover:scale-105",
						alert
							? "bg-red-500/10 text-red-500 border-red-500/20"
							: "bg-muted/60 border-border text-muted-foreground/60 group-hover:text-primary group-hover:border-primary/30",
					)}
				>
					{icon}
				</div>
			</div>
			<div className="flex items-baseline gap-1">
				<AnimatedNumber
					value={value}
					formatter={formatter}
					className={cn(
						"text-2xl font-black font-mono tracking-tighter tabular-nums leading-none",
						alert ? "text-red-500" : "text-foreground",
					)}
				/>
			</div>
			<p
				className={cn(
					"text-3xs font-black uppercase mt-3 tracking-widest",
					alert ? "text-red-400/90" : "text-muted-foreground/80",
				)}
			>
				{sub}
			</p>
		</div>
	</div>
);
