import { AlertCircle, Filter, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, n } from "@/lib/utils";

const MOCK_AGING_DATA = [
	{
		customer: "TECH SOLUTIONS INC",
		total: 1200.0,
		current: 1200.0,
		d30: 0,
		d60: 0,
		d90: 0,
		status: "ok",
	},
	{
		customer: "EMILY JOHNSON",
		total: 5000.0,
		current: 5000.0,
		d30: 0,
		d60: 0,
		d90: 0,
		status: "ok",
	},
	{
		customer: "GLOBAL CORP",
		total: 2500.0,
		current: 2500.0,
		d30: 0,
		d60: 0,
		d90: 0,
		status: "ok",
	},
	{
		customer: "DIGITS",
		total: 15000.0,
		current: 0,
		d30: 0,
		d60: 0,
		d90: 15000.0,
		status: "critical",
	},
	{
		customer: "ACME CORP",
		total: 12500.0,
		current: 0,
		d30: 12500.0,
		d60: 0,
		d90: 0,
		status: "warning",
	},
];

export const InvoicesAgingTab = () => {
	return (
		<div className="max-w-[1600px] 2xl:max-w-[1920px] mx-auto space-y-10 pb-32 animate-entrance">
			{/* KPIs Monochrome */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6 2xl:gap-8">
				<AgingKPI
					label="Cuentas x Cobrar"
					value={n(36200)}
					sub="Cartera Total"
					highlight
				/>
				<AgingKPI label="Vigente" value={n(8700)} sub="0-30 días" />
				<AgingKPI label="En Riesgo" value={n(27500)} sub="31+ días" alert />
				<AgingKPI label="DSO" value="28" sub="Días Prom." />
			</div>

			{/* Matrix Table */}
			<Card className="shadow-lg">
				<div className="p-8 border-b border-border/50 bg-muted/5 flex items-center justify-between">
					<div>
						<h3 className="text-sm font-black uppercase tracking-widest text-foreground">
							Antigüedad de Cobranzas
						</h3>
						<p className="text-label font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1.5">
							Análisis de recuperación de capital
						</p>
					</div>
					<button className="flex items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2 text-label font-black uppercase tracking-widest transition-[background-color,color,transform] duration-200 hover:bg-foreground hover:text-background active:scale-95">
						<Filter size={14} /> Segmentación
					</button>
				</div>

				<CardContent className="p-0 overflow-x-auto custom-scrollbar">
					<table className="w-full text-left border-separate border-spacing-0 min-w-[1000px]">
						<thead className="bg-muted/30">
							<tr>
								<th className="px-8 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border/50">
									Cliente
								</th>
								<th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border/50 text-right">
									Saldo
								</th>
								<th className="px-6 py-4 text-xs font-black text-foreground uppercase tracking-widest border-b border-border/50 text-right bg-foreground/[0.02]">
									Vigente
								</th>
								<th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border/50 text-right">
									1-30 D
								</th>
								<th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border/50 text-right">
									31-60 D
								</th>
								<th className="px-8 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border/50 text-right">
									61+ D
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border/20">
							{MOCK_AGING_DATA.map((row, i) => (
								<tr
									key={i}
									className="group cursor-default transition-colors duration-200 hover:bg-muted/20"
								>
									<td className="px-8 py-6">
										<div className="flex items-center gap-4">
											<div
												className={cn(
													"h-1.5 w-1.5 rounded-full shrink-0",
													row.status === "ok"
														? "bg-muted-foreground/30"
														: "bg-foreground shadow-[0_0_8px_rgba(0,0,0,0.25)]",
												)}
											/>
											<span className="font-black text-xs text-foreground uppercase tracking-tight">
												{row.customer}
											</span>
										</div>
									</td>
									<td className="px-6 py-6 text-right font-mono font-black text-xs text-foreground tabular-nums tracking-tighter">
										{n(row.total)}
									</td>
									<td className="px-6 py-6 text-right font-mono text-xs text-foreground tabular-nums bg-foreground/[0.01]">
										{row.current > 0 ? n(row.current) : "—"}
									</td>
									<td className="px-6 py-6 text-right font-mono text-xs text-muted-foreground tabular-nums">
										{row.d30 > 0 ? n(row.d30) : "—"}
									</td>
									<td className="px-6 py-6 text-right font-mono text-xs text-muted-foreground tabular-nums">
										{row.d60 > 0 ? n(row.d60) : "—"}
									</td>
									<td className="px-8 py-6 text-right font-mono font-black text-xs text-foreground tabular-nums">
										{row.d90 > 0 ? n(row.d90) : "—"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardContent>
			</Card>

			{/* Action Center Monochrome (Dark Mode Corrected & Monochrome Depth) */}
			<div className="flex items-start gap-6 rounded-xl border border-border/20 bg-muted/10 p-8 shadow-lg backdrop-blur-sm">
				<Mail
					size={28}
					strokeWidth={2.5}
					className="shrink-0 mt-1 text-foreground"
				/>
				<div className="space-y-2">
					<h4 className="text-base font-black uppercase tracking-tight text-foreground">
						Estrategia de Recuperación
					</h4>
					<p className="text-sm font-medium leading-relaxed max-w-3xl opacity-60 text-muted-foreground">
						Se detectaron{" "}
						<strong className="font-black text-foreground">S/ 15,000.00</strong>{" "}
						en deudas críticas (+90 días). El sistema recomienda enviar
						recordatorios formales o iniciar gestión de cobranza prejudicial.
					</p>
				</div>
				<button className="ml-auto h-12 rounded-xl border border-foreground/20 bg-foreground/10 px-8 text-label font-black uppercase tracking-widest text-foreground shadow-sm transition-[background-color,transform,box-shadow] duration-200 hover:bg-foreground/20 hover:shadow-md active:scale-95">
					Enviar Recordatorios
				</button>
			</div>
		</div>
	);
};

interface AgingKpiProps {
	label: string;
	value: string;
	sub: string;
	highlight?: boolean;
	alert?: boolean;
}

const AgingKPI = ({ label, value, sub, highlight, alert }: AgingKpiProps) => (
	<Card
		className={cn(
			"border-border/10 shadow-lg",
			highlight &&
				"relative overflow-hidden border-border/20 bg-muted/20 shadow-xl ring-1 ring-border/10",
			alert && "border-red-500/20 bg-red-500/5",
		)}
	>
		{highlight && (
			<div className="absolute top-0 right-0 p-3">
				<div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
			</div>
		)}
		<CardContent className="p-8">
			<p
				className={cn(
					"text-3xs font-black uppercase tracking-[0.3em] mb-4 opacity-40 text-muted-foreground",
				)}
			>
				{label}
			</p>
			<div className="flex items-baseline justify-between">
				<p
					className={cn(
						"text-2xl font-black font-mono tracking-tighter tabular-nums text-foreground",
						alert && "text-red-500",
					)}
				>
					{value}
				</p>
				<span className="text-label font-bold uppercase tracking-widest opacity-20 text-muted-foreground">
					{sub}
				</span>
			</div>
		</CardContent>
	</Card>
);
