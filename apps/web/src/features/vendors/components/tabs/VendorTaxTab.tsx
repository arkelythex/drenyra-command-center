import { BadgePercent, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, n } from "@/lib/utils";
import type { Vendor } from "../../hooks/useVendors";

interface VendorTaxTabProps {
	vendors: Vendor[];
}

export const VendorTaxTab = ({ vendors }: VendorTaxTabProps) => {
	return (
		<div className="max-w-[1600px] 2xl:max-w-[1920px] mx-auto space-y-8 animate-entrance pb-20">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 2xl:gap-8">
				<TaxKPI
					label="IGV Proyectado"
					value="S/ 92,012"
					sub="Crédito Fiscal"
					highlight
				/>
				<TaxKPI label="Retenciones" value="S/ 3,450" sub="Por Aplicar" />
				<TaxKPI label="Alertas RUC" value="2" sub="Estado Crítico" alert />
			</div>

			<Card className="shadow-xl">
				<div className="p-8 border-b border-border/50 bg-muted/5 flex items-center justify-between">
					<h3 className="text-sm font-black uppercase tracking-widest text-foreground">
						Análisis de Cumplimiento
					</h3>
					<span className="text-label font-bold text-muted-foreground uppercase tracking-widest bg-muted px-3 py-1 rounded border border-border">
						Protocolo SUNAT v4.2
					</span>
				</div>

				<CardContent className="p-0 overflow-x-auto custom-scrollbar">
					<table className="w-full text-left border-separate border-spacing-0 min-w-[1000px]">
						<thead className="bg-muted/30">
							<tr>
								<th className="px-10 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border/50">
									Proveedor
								</th>
								<th className="px-4 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border/50 text-center">
									Condición
								</th>
								<th className="px-4 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border/50 text-center">
									Retención
								</th>
								<th className="px-4 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border/50 text-center">
									Auditado
								</th>
								<th className="px-10 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border/50 text-right">
									IGV Acum.
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border/20">
							{vendors.map((v, i) => (
								<tr
									key={i}
									className="cursor-default transition-colors duration-200 hover:bg-muted/20 group"
								>
									<td className="px-10 py-6">
										<p className="text-xs font-black text-foreground uppercase tracking-tight">
											{v.name}
										</p>
										<p className="text-label font-mono font-bold text-muted-foreground mt-1">
											RUC: {v.taxId}
										</p>
									</td>
									<td className="px-4 py-6 text-center">
										<span
											className={cn(
												"rounded-lg border px-3 py-1 text-xs font-black uppercase tracking-widest transition-[background-color,border-color,color,box-shadow] duration-200",
												v.condition === "HABIDO"
													? "bg-muted text-muted-foreground border-border"
													: "bg-foreground text-background border-foreground shadow-lg",
											)}
										>
											{v.condition}
										</span>
									</td>
									<td className="px-4 py-6 text-center">
										{v.isRetentionAgent ? (
											<BadgePercent
												size={18}
												className="mx-auto text-foreground"
												strokeWidth={2.5}
											/>
										) : (
											<span className="opacity-10">—</span>
										)}
									</td>
									<td className="px-4 py-6 text-center">
										<CheckCircle2
											size={18}
											className="mx-auto text-foreground opacity-40 group-hover:opacity-100 transition-opacity"
										/>
									</td>
									<td className="px-10 py-6 text-right font-mono font-black text-sm text-foreground tabular-nums tracking-tighter">
										{n(v.totalSpend * 0.18)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardContent>
			</Card>
		</div>
	);
};

interface TaxKpiProps {
	label: string;
	value: string;
	sub: string;
	highlight?: boolean;
	alert?: boolean;
}

const TaxKPI = ({ label, value, sub, highlight, alert }: TaxKpiProps) => (
	<Card
		className={cn(
			highlight
				? "border-foreground bg-foreground text-background shadow-xl"
				: alert
					? "border-foreground/50 ring-1 ring-foreground/5"
					: "bg-muted/30 border-border/50",
		)}
	>
		<CardContent className="p-8">
			<p
				className={cn(
					"text-3xs font-black uppercase tracking-[0.3em] mb-4 opacity-60",
				)}
			>
				{label}
			</p>
			<div className="flex items-baseline justify-between mt-2">
				<p className="text-2xl font-black font-mono tracking-tighter tabular-nums">
					{value}
				</p>
				<span className="text-label font-bold uppercase tracking-widest opacity-40">
					{sub}
				</span>
			</div>
		</CardContent>
	</Card>
);
