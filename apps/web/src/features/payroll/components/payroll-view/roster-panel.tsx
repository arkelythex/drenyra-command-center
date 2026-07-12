import { BrainCircuit, MoreVertical, Search, TrendingUp } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { cn, n } from "@/lib/utils";
import type { StaffMember } from "./staff-data";

interface PayrollRosterPanelProps {
	backdropClassName: string;
	cardRadius: string;
	staff: StaffMember[];
}

const Th = ({
	children,
	className,
}: {
	children?: React.ReactNode;
	className?: string;
}) => (
	<th
		className={cn(
			"px-6 py-4 text-3xs font-black text-muted-foreground uppercase tracking-[0.2em] bg-transparent border-none",
			className,
		)}
	>
		{children}
	</th>
);

export function PayrollRosterPanel({
	backdropClassName,
	cardRadius,
	staff,
}: PayrollRosterPanelProps) {
	return (
		<div className="flex-[2] flex flex-col gap-8 overflow-hidden">
			<div
				className={`bg-card border border-border/50 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 relative overflow-hidden group shadow-lg ${backdropClassName}`}
				style={{ borderRadius: cardRadius }}
			>
				<div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(to_right,transparent,black,transparent)] opacity-20" />
				<div className="h-12 w-12 rounded-2xl bg-foreground/10 text-foreground border border-foreground/20 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
					<BrainCircuit size={24} />
				</div>
				<div className="relative z-10">
					<p className="text-label font-black text-foreground uppercase tracking-widest mb-1.5 flex items-center gap-2">
						Alerta de Retencion{" "}
						<span className="h-1.5 w-1.5 rounded-full bg-foreground animate-pulse" />
					</p>
					<p className="text-sm font-medium text-muted-foreground leading-relaxed">
						El colaborador{" "}
						<span className="font-bold text-foreground border-b border-foreground/40">
							Diego Armando Lostaunau
						</span>{" "}
						muestra un riesgo de salida Alto basado en el mercado IT local.
					</p>
				</div>
			</div>

			<div
				className={`flex-1 bg-card border border-border/50 shadow-xl flex flex-col overflow-hidden ${backdropClassName}`}
				style={{ borderRadius: cardRadius }}
			>
				<div className="p-4 sm:p-6 border-b border-border/30 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-card/50">
					<div className="relative flex-1 max-w-sm group">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground group-focus-within:text-foreground transition-colors" />
						<input
							type="text"
							placeholder="Buscar colaborador..."
							aria-label="Buscar empleado"
							className="w-full bg-card border border-border/50 rounded-xl pl-11 pr-4 py-2.5 text-xs font-bold uppercase focus:outline-none focus-visible:border-primary focus:bg-card/80 transition-all placeholder:text-muted-foreground/60 text-foreground"
						/>
					</div>
					<div className="flex-1" />
					<div className="flex items-center gap-2">
						<div className="px-4 py-1.5 rounded-full bg-card border border-border/50 flex items-center gap-2 shadow-sm">
							<span className="h-2 w-2 rounded-full bg-foreground animate-pulse" />
							<span className="text-xs font-black text-foreground uppercase tracking-widest">
								Planilla Activa: Feb 2026
							</span>
						</div>
					</div>
				</div>

				<div className="flex-1 overflow-auto custom-scrollbar p-0">
					<table className="w-full text-left border-collapse">
						<thead
							className={`sticky top-0 bg-card border-b border-border shadow-sm z-20 ${backdropClassName}`}
						>
							<tr>
								<Th>Colaborador Key</Th>
								<Th>Rol / Estrategia</Th>
								<Th className="text-right">Salario Mensual</Th>
								<Th className="text-right">5ta Cat. (Proy.)</Th>
								<Th className="text-center">Performance</Th>
								<Th className="text-center">Riesgo Fuga</Th>
								<Th className="w-16" />
							</tr>
						</thead>
						<tbody className="divide-y divide-border/5">
							{staff.map((employee) => (
								<tr
									key={employee.id}
									className="group hover:bg-card/50 transition-colors relative"
								>
									<td className="px-6 py-4">
										<div className="flex items-center gap-4">
											<div className="h-10 w-10 rounded-2xl bg-card border border-border/50 flex items-center justify-center text-foreground font-black text-xs shadow-lg group-hover:scale-110 transition-transform">
												{employee.name.charAt(0)}
											</div>
											<div>
												<p className="text-sm font-bold text-foreground group-hover:text-[var(--premium-action-cyan)] transition-colors">
													{employee.name}
												</p>
												<div className="flex items-center gap-2 mt-0.5">
													<p className="text-xs font-mono text-muted-foreground/60 tracking-wider uppercase bg-muted/30 px-1.5 py-0.5 rounded">
														{employee.id}
													</p>
													<span
														className={cn(
															"h-1.5 w-1.5 rounded-full",
															employee.status === "Activo"
																? "bg-[var(--premium-success)]"
																: "bg-amber-500",
														)}
													/>
												</div>
											</div>
										</div>
									</td>
									<td className="px-6 py-4 text-sm font-bold text-muted-foreground uppercase tracking-wide">
										{employee.role}
									</td>
									<td className="px-6 py-4 text-right">
										<p className="text-sm font-black font-mono text-foreground tracking-tight tabular-nums">
											{n(employee.salary)}
										</p>
									</td>
									<td className="px-6 py-4 text-right">
										<p className="text-xs font-bold font-mono text-muted-foreground tabular-nums opacity-70">
											{n(employee.tax)}
										</p>
									</td>
									<td className="px-6 py-4 text-center">
										<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(var(--premium-success-rgb),0.05)] text-[var(--premium-success)] border border-[rgba(var(--premium-success-rgb),0.10)] text-label font-black shadow-sm group-hover:bg-[rgba(var(--premium-success-rgb),0.10)] transition-colors">
											<TrendingUp size={12} /> {employee.performance}%
										</div>
									</td>
									<td className="px-6 py-4 text-center">
										<span
											className={cn(
												"px-3 py-1 rounded-lg text-xs font-black border uppercase tracking-widest shadow-sm",
												employee.risk === "Alto" || employee.risk === "High"
													? "bg-red-500/10 text-red-500 border-red-500/20"
													: employee.risk === "Medio" ||
															employee.risk === "Medium"
														? "bg-amber-500/10 text-amber-500 border-amber-500/20"
														: "bg-[rgba(var(--premium-info-rgb),0.05)] text-[var(--premium-action-cyan)] border-[rgba(var(--premium-info-rgb),0.10)]",
											)}
										>
											{employee.risk}
										</span>
									</td>
									<td className="px-6 py-4 text-right">
										<Button
											variant="ghost"
											size="icon"
											aria-label="Más opciones"
											className="h-8 w-8 rounded-lg hover:bg-foreground hover:text-background transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
										>
											<MoreVertical size={14} />
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
