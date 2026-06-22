import { Building, ChevronRight, ShieldAlert, ShieldCheck, Users } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Entity } from "../../types/entity.types";
import { itemVariants, listVariants } from "./constants";

interface EntitiesListProps {
	entities: Entity[];
	onSelect: (id: string) => void;
}

export function EntitiesList({ entities, onSelect }: EntitiesListProps) {
	return (
		<motion.div
			variants={listVariants}
			initial="hidden"
			animate="visible"
			className="max-w-[1600px] mx-auto space-y-4"
		>
			<AnimatePresence mode="popLayout">
				{entities.length > 0 ? (
					entities.map((entity) => (
						<motion.div
							key={entity.id}
							variants={itemVariants}
							layoutId={entity.id}
							onClick={() => onSelect(entity.id)}
							className="group"
						>
							<div className="relative flex cursor-pointer flex-col items-start gap-8 overflow-hidden rounded-3xl border border-border bg-card/80 p-6 shadow-xl backdrop-blur-md transition-[background-color,border-color,box-shadow,transform] duration-300 hover:border-primary/20 hover:bg-card hover:shadow-lg active:scale-[0.99] md:flex-row md:items-center sm:p-8">
								<div className="flex items-center gap-6 w-full md:w-[35%] shrink-0">
									<div
										className={cn(
											"h-14 w-14 shrink-0 rounded-2xl border flex items-center justify-center shadow-xl transition-[background-color,border-color,box-shadow,transform,color] duration-300 group-hover:scale-105 group-hover:rotate-2",
											"bg-muted/60 border-border text-muted-foreground shadow-glow",
										)}
									>
										{entity.type === "CUSTOMER" ? (
											<Users size={24} strokeWidth={2.5} />
										) : (
											<Building size={24} strokeWidth={2.5} />
										)}
									</div>

									<div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
										<div className="flex items-center gap-3">
											<h3 className="font-black text-foreground truncate text-lg tracking-tighter uppercase leading-none group-hover:text-primary transition-colors">
												{entity.legalName}
											</h3>
											<Badge variant={entity.status === "ACTIVO" ? "success" : "danger"}>
												{entity.status}
											</Badge>
										</div>
										<div className="flex items-center gap-3 text-xs">
											<div className="flex items-center gap-2 px-2 py-0.5 rounded-md bg-muted/60 border border-border shadow-inner">
												<span className="text-3xs font-black text-muted-foreground uppercase opacity-40">RUC</span>
												<span className="font-mono text-foreground font-black tracking-widest tabular-nums">
													{entity.taxId}
												</span>
											</div>
											<span className="text-2xs font-black text-muted-foreground/40 uppercase tracking-widest">
												{entity.condition}
											</span>
										</div>
									</div>
								</div>

								<div className="grid grid-cols-2 md:grid-cols-12 md:flex-1 items-center gap-8 w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 border-border/60">
									<div className="col-span-1 md:col-span-4 lg:col-span-5 md:px-6">
										<div className="flex justify-between items-end mb-2.5">
											<span className="text-3xs font-black text-muted-foreground uppercase tracking-[0.25em] opacity-60">
												Compliance Rating
											</span>
											<span
												className={cn(
													"text-sm font-mono font-black tracking-tighter tabular-nums",
													entity.complianceScore > 90
														? "text-info"
														: entity.complianceScore > 70
															? "text-warning"
															: "text-danger",
												)}
											>
												{entity.complianceScore}%
											</span>
										</div>
										<div className="h-2 bg-muted/50 rounded-full overflow-hidden border border-border shadow-inner p-[1px]">
											<motion.div
												initial={{ width: 0 }}
												animate={{ width: `${entity.complianceScore}%` }}
												transition={{ duration: 1.5, ease: "circOut" }}
												className={cn(
													"h-full rounded-full shadow-glow",
													entity.complianceScore > 90
														? "bg-info"
														: entity.complianceScore > 70
															? "bg-warning"
															: "bg-danger",
												)}
											/>
										</div>
									</div>

									<div className="col-span-1 md:col-span-3 lg:col-span-3 md:text-center">
										<div className="inline-flex flex-col items-start md:items-center gap-2">
											<span className="text-3xs font-black text-muted-foreground uppercase tracking-[0.25em] opacity-60">
												Perfil de Riesgo
											</span>
											<Badge
												variant={
													entity.riskLevel === "LOW"
														? "success"
														: entity.riskLevel === "MEDIUM"
															? "warning"
															: "danger"
												}
												className="h-7 gap-2 shadow-lg"
											>
												{entity.riskLevel === "LOW" ? (
													<ShieldCheck size={12} strokeWidth={3} />
												) : (
													<ShieldAlert size={12} strokeWidth={3} />
												)}
												{entity.riskLevel}
											</Badge>
										</div>
									</div>

									<div className="col-span-2 md:col-span-3 lg:col-span-3 md:text-right flex flex-col items-end justify-center md:pr-6">
										<span className="text-3xs font-black text-muted-foreground uppercase tracking-[0.25em] mb-1 opacity-60">
											Operatividad
										</span>
										<div className="flex items-baseline gap-2">
											<span className="text-2xl font-mono font-black text-foreground tracking-tighter tabular-nums">
												{entity.txCount}
											</span>
											<span className="text-2xs font-black text-primary uppercase tracking-widest">
												Registros
											</span>
										</div>
									</div>

									<div className="hidden md:flex col-span-2 md:col-span-2 lg:col-span-1 justify-end">
										<div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground/60 shadow-inner transition-[background-color,border-color,box-shadow,transform,color] duration-300 group-hover:border-transparent group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg">
											<ChevronRight size={20} strokeWidth={3} />
										</div>
									</div>
								</div>
							</div>
						</motion.div>
					))
				) : (
					<div className="flex flex-col items-center justify-center rounded-4xl border-2 border-dashed border-border bg-card/60 py-48 shadow-inner transition-[background-color,border-color,box-shadow] duration-200 hover:bg-card/80">
						<div className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-muted/20 text-muted-foreground shadow-xl">
							<Users size={48} strokeWidth={1} />
						</div>
						<h2 className="text-xl font-black uppercase tracking-tighter text-foreground mb-3">
							Sin Entidades
						</h2>
						<p className="text-label font-bold text-muted-foreground/60 uppercase tracking-widest max-w-xs text-center leading-relaxed px-8">
							No se detectaron registros en el directorio central bajo los parametros de filtrado actuales.
						</p>
					</div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
