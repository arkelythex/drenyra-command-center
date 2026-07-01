import {
	BrainCircuit,
	CheckCircle2,
	MapPin,
	MoreVertical,
	Search,
} from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { cn, n } from "@/lib/utils";
import type { AssetItem } from "./assets-data";

interface AssetsTableProps {
	assets: AssetItem[];
}

function StatusBadge({ status }: { status: AssetItem["status"] }) {
	const styles = {
		active: "status-badge-success",
		maintenance: "status-badge-warning",
		disposed: "status-badge-neutral",
	}[status];

	return (
		<span
			className={cn(
				"status-badge px-2 py-0.5 text-3xs font-black uppercase",
				styles,
			)}
		>
			{status === "active"
				? "Operativo"
				: status === "maintenance"
					? "En Taller"
					: status}
		</span>
	);
}

function Th({
	children,
	className,
}: {
	children?: React.ReactNode;
	className?: string;
}) {
	return (
		<th
			className={cn(
				"px-4 py-3 text-3xs font-black text-muted-foreground uppercase tracking-widest bg-muted/30 border-b border-border/50 ",
				className,
			)}
		>
			{children}
		</th>
	);
}

export function AssetsTable({ assets }: AssetsTableProps) {
	return (
		<div className="flex-1 px-4 sm:px-8 pb-8 overflow-hidden flex flex-col">
			<div className="rounded-2xl border border-border/50 bg-card/50  flex-1 flex flex-col shadow-sm overflow-hidden">
				<div className="p-4 border-b border-border/50 flex flex-col sm:flex-row items-center gap-4 bg-muted/20">
					<div className="relative flex-1 w-full max-w-sm group">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground group-focus-within:text-foreground transition-colors" />
						<input
							type="text"
							placeholder="Buscar por Codigo, Nombre o Serie..."
							aria-label="Buscar activo"
							className="ui-search-input w-full rounded-lg py-2 pl-9 pr-4 text-xs font-medium transition-[background-color,border-color,box-shadow,color] duration-200"
						/>
					</div>
					<div className="flex-1" />
					<span className="text-label font-black text-muted-foreground uppercase tracking-widest">
						Mostrando 5 de 142 Activos
					</span>
				</div>

				<div className="flex-1 overflow-auto custom-scrollbar">
					<table className="w-full text-left border-collapse">
						<thead className="sticky top-0 bg-card z-10 shadow-sm">
							<tr>
								<Th>Activo / Codigo</Th>
								<Th>Clasificacion LIR</Th>
								<Th>Centro de Costo</Th>
								<Th className="text-right">Valor en Libros</Th>
								<Th>Depreciacion Acum.</Th>
								<Th>Estado & Salud AI</Th>
								<Th className="w-10" />
							</tr>
						</thead>
						<tbody className="divide-y divide-border/30">
							{assets.map((asset) => (
								<tr
									key={asset.id}
									className="group hover:bg-muted/30 transition-colors"
								>
									<td className="p-4">
										<div className="flex items-center gap-3">
											<div className="h-10 w-10 rounded-lg bg-foreground/10 text-foreground flex items-center justify-center font-black text-xs border border-foreground/20">
												AK
											</div>
											<div>
												<p className="text-sm font-bold text-foreground">
													{asset.name}
												</p>
												<p className="text-label font-mono text-muted-foreground tracking-wider">
													{asset.id}
												</p>
											</div>
										</div>
									</td>
									<td className="p-4">
										<span className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-label font-bold uppercase tracking-wider border border-border/50">
											{asset.cat}
										</span>
									</td>
									<td className="p-4 text-xs font-medium text-muted-foreground">
										<div className="flex items-center gap-1.5">
											<MapPin size={12} className="text-primary" />
											{asset.loc}
										</div>
									</td>
									<td className="p-4 text-right">
										<p className="text-sm font-black font-mono text-foreground tabular-nums tracking-tight">
											{n(asset.value)}
										</p>
									</td>
									<td className="p-4">
										<div className="w-full max-w-[140px]">
											<div className="flex justify-between text-xs font-bold uppercase text-muted-foreground mb-1">
												<span>Uso</span>
												<span>{100 - asset.life}% Restante</span>
											</div>
											<div className="h-2 w-full bg-muted rounded-full overflow-hidden">
												<div
													className={cn(
														"h-full rounded-full transition-[width,background-color,box-shadow,opacity] duration-700",
														asset.life > 70
															? "bg-success"
															: asset.life > 30
																? "bg-warning"
																: "bg-destructive",
													)}
													style={{ width: `${asset.life}%` }}
												/>
											</div>
										</div>
									</td>
									<td className="p-4">
										<div className="flex flex-col gap-1.5">
											<div className="flex items-center gap-2">
												<StatusBadge status={asset.status} />
												{asset.status === "active" ? (
													<CheckCircle2 size={12} className="text-success" />
												) : null}
											</div>
											<div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-tight">
												<BrainCircuit
													size={10}
													className={cn(
														asset.health < 80
															? "text-destructive animate-pulse"
															: "text-success",
													)}
												/>
												<span
													className={cn(
														asset.health < 80
															? "text-destructive"
															: "text-muted-foreground",
													)}
												>
													{asset.prediction}
												</span>
											</div>
										</div>
									</td>
									<td className="p-4 text-right">
										<Button
											variant="ghost"
											size="icon"
											aria-label="Más opciones"
											className="h-8 w-8 hover:bg-background/80"
										>
											<MoreVertical
												size={14}
												className="text-muted-foreground"
											/>
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
