import { ChevronDown, ChevronRight, CreditCard, History } from "lucide-react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { AnimatedNumber } from "../../../../components/ui/motion-primitives";
import { cn, n } from "../../../../lib/utils";
import type { Customer } from "../../hooks/useCustomers";

interface CustomerCardProps {
	customer: Customer;
	isExpanded: boolean;
	onToggle: () => void;
}

const PEN_FORMATTER = (v: number) => n(v);

export const CustomerCard = ({
	customer,
	isExpanded,
	onToggle,
}: CustomerCardProps) => {
	return (
		<div
			className={cn(
				"group overflow-hidden rounded-3xl border border-border bg-card shadow-xl transition-[background-color,border-color,box-shadow,transform] duration-200",
				isExpanded
					? "ring-2 ring-primary/20 shadow-primary/5"
					: "hover:-translate-y-0.5 hover:border-primary/20 hover:bg-card",
			)}
		>
			<div
				onClick={onToggle}
				className="flex flex-col sm:flex-row sm:items-center justify-between p-8 cursor-pointer gap-8 select-none relative"
			>
				<div className="flex items-center gap-6 relative z-10">
					<div
						className={cn(
							"flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] border border-border bg-muted/60 shadow-inner transition-[border-color,box-shadow,transform] duration-200 group-hover:scale-[1.02]",
							isExpanded && "border-primary/30 ring-4 ring-primary/5",
						)}
					>
						{customer.logo ? (
							<img
								src={customer.logo}
								alt={customer.name}
								className="h-full w-full object-cover transition-[transform,filter,opacity] duration-200"
							/>
						) : (
							<div className="flex items-center justify-center h-full w-full bg-primary/10 text-primary">
								<span className="font-black text-sm uppercase">
									{customer.initials}
								</span>
							</div>
						)}
					</div>
					<div className="min-w-0">
						<h3 className="font-black text-lg flex items-center gap-3 truncate text-foreground uppercase tracking-tighter leading-none mb-2">
							{customer.name}
							{customer.pendingBalance > 0 && (
								<Badge variant="danger" className="animate-pulse">
									Pendiente
								</Badge>
							)}
						</h3>
						<div className="flex flex-wrap items-center gap-3">
							<div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/60 border border-border shadow-inner">
								<span className="text-3xs font-black text-muted-foreground uppercase opacity-50">
									RUC
								</span>
								<p className="text-2xs font-mono font-black text-foreground tracking-widest tabular-nums">
									{customer.taxId}
								</p>
							</div>
							{customer.hasRetention && (
								<Badge variant="info" className="h-6">
									Agente Retención
								</Badge>
							)}
						</div>
					</div>
				</div>
				<div className="flex items-center justify-between sm:justify-end gap-12 border-t sm:border-none border-border pt-6 sm:pt-0 relative z-10">
					<div className="text-left sm:text-right space-y-1">
						<p className="text-3xs font-black text-muted-foreground uppercase tracking-[0.25em] opacity-60 group-hover:text-primary transition-colors">
							Ventas Consolidadas
						</p>
						<AnimatedNumber
							value={customer.totalRevenue}
							formatter={PEN_FORMATTER}
							className="font-black font-mono text-2xl tracking-tighter text-foreground tabular-nums leading-none"
						/>
					</div>
					<div
						className={cn(
							"flex h-10 w-10 items-center justify-center rounded-full transition-[background-color,color,box-shadow,transform] duration-200",
							isExpanded
								? "bg-primary text-primary-foreground rotate-180 shadow-primary/20"
								: "bg-muted/60 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg",
						)}
					>
						<ChevronDown size={20} strokeWidth={3} />
					</div>
				</div>
			</div>

			{isExpanded && (
				<div className="border-t border-border bg-muted/40 animate-in slide-in-from-top-4 duration-500 overflow-hidden">
					<div className="px-10 py-6 flex items-center gap-3 border-b border-border/70">
						<History size={16} className="text-primary" />
						<h4 className="text-2xs font-black uppercase tracking-[0.3em] text-foreground/70">
							Historial Reciente de Operaciones
						</h4>
					</div>
					<div className="overflow-x-auto custom-scrollbar px-2">
						<table className="w-full text-left border-separate border-spacing-0">
							<thead className="sticky top-0 z-20">
								<tr className="bg-card">
									<th className="py-5 px-8 text-3xs font-black uppercase text-muted-foreground/60 tracking-widest border-b border-border">
										Fecha Registro
									</th>
									<th className="py-5 px-6 text-3xs font-black uppercase text-muted-foreground/60 tracking-widest border-b border-border">
										Concepto / Glosa
									</th>
									<th className="py-5 px-6 text-3xs font-black uppercase text-muted-foreground/60 tracking-widest border-b border-border text-center">
										Estado Fiscal
									</th>
									<th className="py-5 px-8 text-right text-3xs font-black uppercase text-muted-foreground/60 tracking-widest border-b border-border">
										Importe Neto
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border/40">
								{customer.transactions.map((tx) => (
									<tr
										key={tx.id}
										className="transition-colors duration-200 hover:bg-muted/40 group/row"
									>
										<td className="py-6 px-8 text-muted-foreground/80 font-mono text-2xs font-black uppercase tabular-nums">
											{new Date(tx.date)
												.toLocaleDateString("es-PE", {
													day: "2-digit",
													month: "short",
												})
												.toUpperCase()}
										</td>
										<td className="py-6 px-6">
											<div className="flex items-center gap-3 transition-transform duration-200 group-hover/row:translate-x-0.5">
												<div className="h-8 w-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-muted-foreground/60 group-hover/row:text-primary group-hover/row:border-primary/20">
													<CreditCard size={14} />
												</div>
												<span className="font-black text-foreground text-label uppercase tracking-tight">
													{tx.description}
												</span>
											</div>
										</td>
										<td className="py-6 px-6 text-center">
											<Badge
												variant={
													tx.status === "COBRADO" ? "success" : "outline"
												}
											>
												{tx.status}
											</Badge>
										</td>
										<td className="py-6 px-8 text-right font-mono font-black text-sm text-foreground tabular-nums tracking-tighter">
											{PEN_FORMATTER(tx.amount)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className="p-8 border-t border-border/70 bg-muted/40 flex justify-end">
						<Button
							variant="ghost"
							size="sm"
							className="h-10 px-6 rounded-xl text-3xs font-black uppercase tracking-widest text-primary hover:bg-primary/10"
						>
							Ver Auditoría Completa <ChevronRight size={14} className="ml-2" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
};
