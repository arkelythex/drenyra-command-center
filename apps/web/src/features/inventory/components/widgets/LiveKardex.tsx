import { History } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Movement } from "../../types/inventory.types";

interface Props {
	movements: Movement[];
}

export const LiveKardex = ({ movements }: Props) => {
	return (
		<div className="flex-1 flex flex-col h-full bg-card/10">
			<div className="flex-1 overflow-auto custom-scrollbar p-0">
				<table className="w-full text-left border-collapse">
					<thead className="sticky top-0 bg-secondary/30  z-10 border-b border-border/40">
						<tr>
							<th className="px-3 sm:px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest bg-transparent">
								Mov.
							</th>
							<th className="px-3 sm:px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest bg-transparent">
								Item
							</th>
							<th className="px-3 sm:px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest bg-transparent text-right">
								Cant.
							</th>
							<th className="hidden sm:table-cell px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest bg-transparent text-right">
								Costo
							</th>
							<th className="px-3 sm:px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest bg-transparent text-right">
								Total
							</th>
							<th className="hidden lg:table-cell px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest bg-transparent text-right">
								Tiempo
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border/10">
						{movements.map((mov) => (
							<tr
								key={mov.id}
								className="group hover:bg-muted/30 dark:hover:bg-white/[0.03] transition-colors duration-200"
							>
								<td className="px-3 sm:px-6 py-4">
									<div className="flex items-center gap-2 sm:gap-3">
										<span
											className={cn(
												"px-2 py-1 rounded-md text-2xs font-black border uppercase tracking-widest min-w-[28px] text-center",
												mov.type === "IN"
													? "bg-info-muted text-info border-info-subtle"
													: "bg-warning-muted text-warning border-warning-subtle",
											)}
										>
											{mov.type}
										</span>
										<span className="hidden md:inline text-label font-mono font-medium text-muted-foreground/60">
											{mov.id}
										</span>
									</div>
								</td>
								<td className="px-3 sm:px-6 py-4 text-sm font-bold text-foreground truncate max-w-[120px] sm:max-w-none group-hover:text-primary transition-colors">
									{mov.item}
								</td>
								<td
									className={cn(
										"px-3 sm:px-6 py-4 text-label font-black font-mono text-right tabular-nums",
										mov.type === "IN" ? "text-info" : "text-warning",
									)}
								>
									{mov.type === "IN" ? "+" : "-"}
									{mov.qty}
								</td>
								<td className="hidden sm:table-cell px-6 py-4 text-sm font-mono font-bold text-muted-foreground text-right tabular-nums">
									{mov.cost}
								</td>
								<td className="px-3 sm:px-6 py-4 text-sm font-black font-mono text-foreground text-right tabular-nums tracking-tight">
									{mov.total}
								</td>
								<td className="hidden lg:table-cell px-6 py-4 text-xs font-bold text-muted-foreground/50 text-right uppercase tracking-wider">
									{mov.date}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};
