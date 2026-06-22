import { AlertCircle, Mail } from "lucide-react";
import { Card, CardContent } from "../../../../components/ui/card";
import { cn, n } from "../../../../lib/utils";
import type { Customer } from "../../hooks/useCustomers";

interface CustomerCobranzaTabProps {
	customers: Customer[];
}

export const CustomerCobranzaTab = ({
	customers,
}: CustomerCobranzaTabProps) => {
	const debtors = customers.filter((customer) => customer.pendingBalance > 0);

	return (
		<div className="max-w-[1600px] 2xl:max-w-[1920px] mx-auto space-y-8 animate-entrance pb-20">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 2xl:gap-8">
				<CobranzaKPI
					label="Recuperación de Cartera"
					value="94.2%"
					sub="Ratio Mensual"
					highlight
				/>
				<AgingKPI
					label="Vencido Crítico"
					value="S/ 15,000"
					sub="+30 días"
					alert
				/>
				<AgingKPI label="Eficiencia Cobro" value="28" sub="Días Prom." />
			</div>

			<Card className="shadow-xl">
				<div className="p-8 border-b border-border/50 bg-muted/5 flex items-center justify-between">
					<h3 className="text-sm font-black uppercase tracking-widest text-foreground">
						Monitor de Cobranza Proactiva
					</h3>
					<span className="text-label font-bold text-muted-foreground uppercase tracking-widest bg-muted px-3 py-1 rounded border border-border">
						Periodo: Enero 2025
					</span>
				</div>

				<CardContent className="p-0 overflow-x-auto custom-scrollbar">
					<table className="w-full text-left border-separate border-spacing-0 min-w-[1000px]">
						<thead className="bg-muted/30">
							<tr>
								<th className="px-10 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border/50">
									Cliente / RUC
								</th>
								<th className="px-4 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border/50 text-right">
									Saldo Pendiente
								</th>
								<th className="px-4 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border/50 text-center">
									Días Atraso
								</th>
								<th className="px-10 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border/50 text-right">
									Acciones
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border/20">
							{debtors.length > 0 ? (
								debtors.map((customer) => (
									<tr
										key={customer.id}
										className="cursor-default transition-colors duration-200 hover:bg-muted/20 group"
									>
										<td className="px-10 py-6">
											<p className="text-xs font-black text-foreground uppercase tracking-tight">
												{customer.name}
											</p>
											<p className="text-label font-mono font-bold text-muted-foreground mt-1">
												RUC: {customer.taxId}
											</p>
										</td>
										<td className="px-4 py-6 text-right font-mono font-black text-sm text-foreground tabular-nums tracking-tighter">
											{n(customer.pendingBalance)}
										</td>
										<td className="px-4 py-6 text-center">
											<span
												className={cn(
													"rounded-lg border px-2.5 py-1 text-label font-black uppercase tracking-widest transition-[background-color,border-color,color,box-shadow] duration-200",
													customer.pendingBalance > 10000
														? "bg-foreground text-background border-foreground shadow-lg"
														: "bg-muted text-muted-foreground border-border",
												)}
											>
												{customer.pendingBalance > 10000
													? "92 DÍAS"
													: "14 DÍAS"}
											</span>
										</td>
										<td className="px-10 py-6 text-right">
											<button className="btn-soft inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2 text-label font-black uppercase tracking-widest transition-[background-color,color,transform] duration-200 hover:bg-foreground hover:text-background">
												<Mail size={12} /> Recordatorio
											</button>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td
										colSpan={4}
										className="py-20 text-center text-muted-foreground/30 text-xs font-black uppercase tracking-[0.3em]"
									>
										Cartera Limpia
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</CardContent>
			</Card>

			{/* Action Center Monochrome */}
			<div className="flex items-start gap-6 rounded-xl bg-foreground p-8 text-background shadow-xl">
				<AlertCircle size={28} strokeWidth={2.5} className="shrink-0 mt-1" />
				<div className="space-y-2">
					<h4 className="text-base font-black uppercase tracking-tight">
						Riesgo de Liquidez
					</h4>
					<p className="text-sm font-medium leading-relaxed max-w-3xl opacity-80">
						Se recomienda activar la gestión de cobranza automatizada para{" "}
						<strong className="font-black">Digits</strong> debido a la
						antigüedad de su deuda.
					</p>
				</div>
				<button className="btn-soft ml-auto h-12 rounded-xl bg-background px-8 text-label font-black uppercase tracking-widest text-foreground transition-[background-color,box-shadow,transform,opacity] duration-200 hover:opacity-90">
					Configurar Alertas
				</button>
			</div>
		</div>
	);
};

interface CobranzaKpiProps {
	label: string;
	value: string;
	sub: string;
	highlight?: boolean;
}

interface AgingKpiProps {
	label: string;
	value: string;
	sub: string;
	alert?: boolean;
}

const CobranzaKPI = ({ label, value, sub, highlight }: CobranzaKpiProps) => (
	<Card
		className={cn(
			highlight && "border-foreground bg-foreground text-background shadow-xl",
		)}
	>
		<CardContent className="p-8">
			<p
				className={cn(
					"text-3xs font-black uppercase tracking-[0.3em] mb-4",
					highlight ? "opacity-60" : "text-muted-foreground",
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

const AgingKPI = ({ label, value, sub, alert }: AgingKpiProps) => (
	<Card
		className={cn(
			alert && "border-foreground/50 ring-1 ring-foreground/5 shadow-xl",
		)}
	>
		<CardContent className="p-8 text-foreground">
			<p className="text-xs font-black uppercase tracking-[0.3em] mb-4 text-muted-foreground">
				{label}
			</p>
			<div className="flex items-baseline justify-between mt-2">
				<p className="text-2xl font-black font-mono tracking-tighter tabular-nums">
					{value}
				</p>
				<span
					className={cn(
						"text-2xs font-bold uppercase tracking-widest",
						alert ? "text-foreground" : "opacity-40",
					)}
				>
					{sub}
				</span>
			</div>
		</CardContent>
	</Card>
);
