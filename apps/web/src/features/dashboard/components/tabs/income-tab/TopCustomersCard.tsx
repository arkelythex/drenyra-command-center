import { Card } from "@/components/ui/card";
import { formatPEN, formatPercent } from "@/lib/utils";
import type { DashboardIncomeResponse } from "../../../api/dashboard.api";

interface TopCustomersCardProps {
	topCustomers: DashboardIncomeResponse["topCustomers"];
	totalBilled: number;
}

export function TopCustomersCard({
	topCustomers,
	totalBilled,
}: TopCustomersCardProps) {
	const maxCustomerTotal = Math.max(
		...topCustomers.map((customer) => customer.total),
		1,
	);

	return (
		<Card className="xl:col-span-4 rounded-2xl border border-border/40 bg-white p-6 shadow-sm">
			<div className="mb-4 flex items-center justify-between">
				<h3 className="text-sm font-semibold text-foreground">
					Clientes principales
				</h3>
				<p className="text-xs text-muted-foreground">Por facturación</p>
			</div>
			<div className="space-y-3">
				{topCustomers.length === 0 ? (
					<p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
						No hay clientes con facturación registrada en este periodo.
					</p>
				) : (
					topCustomers.map((customer, index) => {
						const share =
							totalBilled > 0 ? (customer.total / totalBilled) * 100 : 0;
						const relativeWidth = Math.max(
							8,
							(customer.total / maxCustomerTotal) * 100,
						);

						return (
							<div
								key={customer.customerId}
								className="rounded-xl border border-border/30 bg-muted/10 p-4 transition-colors hover:bg-muted/20"
							>
								<div className="flex items-start justify-between gap-3">
									<div>
										<p className="text-sm font-medium text-foreground">
											{customer.customerName}
										</p>
										<p className="text-xs text-muted-foreground">
											{customer.invoiceCount} comprobantes
										</p>
									</div>
									<p className="text-sm font-semibold text-foreground">
										{formatPEN(customer.total)}
									</p>
								</div>

								<div className="mt-3">
									<div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
										<span>Participación</span>
										<span>{formatPercent(share)}</span>
									</div>
									<div className="h-1.5 w-full rounded-full bg-muted/40">
										<div
											className="h-1.5 rounded-full"
											style={{
												width: `${relativeWidth}%`,
												backgroundColor:
													index === 0
														? "hsl(var(--primary))"
														: "hsl(var(--muted-foreground))",
											}}
										/>
									</div>
								</div>
							</div>
						);
					})
				)}
			</div>
		</Card>
	);
}
