import { ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { n } from "@/lib/utils";
import type { Vendor } from "../../hooks/useVendors";

interface VendorCardProps {
	vendor: Vendor;
	isExpanded: boolean;
	onToggle: () => void;
}

export const VendorCard = ({
	vendor,
	isExpanded,
	onToggle,
}: VendorCardProps) => {
	return (
		<Card className="group border-border/60 transition-[background-color,border-color,box-shadow,transform] duration-200 hover:border-primary/20">
			<div
				onClick={onToggle}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onToggle();
					}
				}}
				className="flex cursor-pointer flex-col justify-between gap-6 p-5 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:p-6"
			>
				<div className="flex items-center gap-6">
					<div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted transition-[background-color,border-color,color,box-shadow,transform] duration-200 group-hover:border-primary/20 group-hover:bg-card">
						{vendor.logo ? (
							<img
								src={vendor.logo}
								alt={vendor.name}
								className="h-full w-full object-cover opacity-70 transition-[opacity,transform] duration-200 group-hover:opacity-100"
							/>
						) : (
							<span className="text-sm font-semibold uppercase text-muted-foreground">
								{vendor.initials}
							</span>
						)}
					</div>
					<div className="min-w-0">
						<h3 className="flex items-center gap-3 truncate text-[15px] font-semibold tracking-tight text-foreground leading-none">
							{vendor.name}
							{vendor.condition === "NO HABIDO" && (
								<span className="rounded-full border border-warning/30 bg-warning/12 px-2 py-0.5 text-2xs font-medium tracking-wide text-warning">
									No habido
								</span>
							)}
						</h3>
						<div className="flex items-center gap-2 mt-2">
							<p className="rounded-md border border-border bg-muted px-1.5 text-label font-mono font-medium tracking-wide text-muted-foreground">
								RUC: {vendor.taxId}
							</p>
							<div className="flex gap-1.5">
								{vendor.isRetentionAgent && (
									<span className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-2xs font-medium tracking-wide text-foreground">
										Retención
									</span>
								)}
								{vendor.isGoodTaxpayer && (
									<span className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-2xs font-medium tracking-wide text-foreground">
										Buen contribuyente
									</span>
								)}
							</div>
						</div>
					</div>
				</div>
				<div className="flex items-center justify-between sm:justify-end gap-12 border-t sm:border-none border-border/50 pt-4 sm:pt-0">
					<div className="text-left sm:text-right">
						<p className="font-mono text-xl font-semibold tracking-tight text-foreground tabular-nums leading-none">
							{n(vendor.totalSpend)}
						</p>
						<p className="mt-1.5 text-label font-medium tracking-wide text-muted-foreground">
							Gasto acumulado
						</p>
					</div>
					{isExpanded ? (
						<ChevronDown size={20} className="text-muted-foreground" />
					) : (
						<ChevronRight size={20} className="text-muted-foreground" />
					)}
				</div>
			</div>

			{isExpanded && (
				<div className="border-t border-border/50 bg-muted/5 animate-in slide-in-from-top-1 overflow-x-auto">
					<table className="w-full text-left border-separate border-spacing-0">
						<thead className="bg-muted/20">
							<tr>
								<th className="border-b border-border/50 px-8 py-4 text-xs font-semibold tracking-wide text-muted-foreground">
									Fecha
								</th>
								<th className="border-b border-border/50 px-6 py-4 text-xs font-semibold tracking-wide text-muted-foreground">
									Detalle operativo
								</th>
								<th className="border-b border-border/50 px-6 py-4 text-xs font-semibold tracking-wide text-muted-foreground">
									Cuenta PCGE
								</th>
								<th className="border-b border-border/50 px-8 py-4 text-right text-xs font-semibold tracking-wide text-muted-foreground">
									Monto neto
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border/20">
							{vendor.transactions.map((tx) => (
								<tr
									key={tx.id}
									className="hover:bg-muted/30 transition-colors group/row"
								>
									<td className="px-8 py-5 text-label font-mono font-medium tabular-nums text-muted-foreground">
										{new Date(tx.date)
											.toLocaleDateString("es-PE", {
												day: "2-digit",
												month: "short",
											})
											.toUpperCase()}
									</td>
									<td className="px-6 py-5 text-xs font-medium tracking-tight text-foreground transition-transform duration-200 group-hover/row:translate-x-0.5">
										{tx.description}
									</td>
									<td className="py-5 px-6">
										<div className="flex flex-col">
											<span className="text-label font-medium text-foreground">
												{tx.category}
											</span>
											<span className="mt-0.5 text-2xs font-medium tracking-wide text-muted-foreground">
												Registro validado
											</span>
										</div>
									</td>
									<td className="px-8 py-5 text-right font-mono text-sm font-semibold tabular-nums tracking-tight text-foreground">
										{n(tx.amount)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</Card>
	);
};
