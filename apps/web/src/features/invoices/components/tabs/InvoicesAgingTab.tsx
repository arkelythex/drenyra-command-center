import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Invoice } from "../../hooks/useInvoices";
import { type AgingBuckets, buildAging } from "../../lib/invoice-aging";

interface InvoicesAgingTabProps {
	invoices: Invoice[];
	formatMoney: (amount: number) => string;
	/** Injectable for tests; defaults to now. */
	today?: Date;
}

const COLUMNS: Array<{ key: keyof AgingBuckets; label: string }> = [
	{ key: "current", label: "Vigente" },
	{ key: "d1to30", label: "1 a 30 días" },
	{ key: "d31to60", label: "31 a 60 días" },
	{ key: "d61plus", label: "Más de 60 días" },
	{ key: "total", label: "Saldo" },
];

export const InvoicesAgingTab = ({
	invoices,
	formatMoney,
	today,
}: InvoicesAgingTabProps) => {
	const { rows, totals, excludedForeignCurrency } = buildAging(invoices, today);

	if (rows.length === 0) {
		return (
			<Card className="p-8 text-center">
				<h2 className="text-base font-semibold">Sin saldos por cobrar</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					No tienes saldos por cobrar. Cuando envíes facturas aparecerán aquí
					según su antigüedad.
				</p>
				<ForeignNote count={excludedForeignCurrency} />
			</Card>
		);
	}

	const overdue = totals.d1to30 + totals.d31to60 + totals.d61plus;

	return (
		<div className="mx-auto max-w-5xl space-y-6">
			<dl className="grid gap-3 sm:grid-cols-3">
				<Kpi label="Por cobrar" value={formatMoney(totals.total)} />
				<Kpi label="Vigente" value={formatMoney(totals.current)} />
				<Kpi
					label="Vencido"
					value={formatMoney(overdue)}
					warn={overdue > 0}
					note={
						totals.d61plus > 0
							? `${formatMoney(totals.d61plus)} con más de 60 días vencido`
							: undefined
					}
				/>
			</dl>

			<Card className="overflow-x-auto">
				<table
					aria-label="Antigüedad de saldos"
					className="w-full min-w-[640px] text-left text-sm"
				>
					<thead>
						<tr className="border-b border-border text-muted-foreground">
							<th scope="col" className="px-4 py-3 font-medium">
								Cliente
							</th>
							{COLUMNS.map((column) => (
								<th
									key={column.key}
									scope="col"
									className="px-4 py-3 text-right font-medium"
								>
									{column.label}
								</th>
							))}
						</tr>
					</thead>
					<tbody className="divide-y divide-border tabular-nums">
						{rows.map((row) => (
							<tr key={row.customer}>
								<th scope="row" className="px-4 py-3 font-medium">
									{row.customer}
								</th>
								{COLUMNS.map((column) => (
									<td
										key={column.key}
										className={cn(
											"px-4 py-3 text-right",
											column.key === "total" && "font-medium",
											row[column.key] === 0 && "text-muted-foreground",
										)}
									>
										{row[column.key] > 0 ? formatMoney(row[column.key]) : "—"}
									</td>
								))}
							</tr>
						))}
					</tbody>
					<tfoot>
						<tr className="border-t border-border font-medium tabular-nums">
							<th scope="row" className="px-4 py-3">
								Total
							</th>
							{COLUMNS.map((column) => (
								<td key={column.key} className="px-4 py-3 text-right">
									{formatMoney(totals[column.key])}
								</td>
							))}
						</tr>
					</tfoot>
				</table>
			</Card>
			<ForeignNote count={excludedForeignCurrency} />
		</div>
	);
};

function ForeignNote({ count }: { count: number }) {
	if (count === 0) return null;
	return (
		<p className="text-sm text-muted-foreground">
			{count}{" "}
			{count === 1
				? "factura en otra moneda no está"
				: "facturas en otra moneda no están"}{" "}
			incluida{count === 1 ? "" : "s"} en estos saldos en soles.
		</p>
	);
}

function Kpi({
	label,
	value,
	note,
	warn,
}: {
	label: string;
	value: string;
	note?: string | undefined;
	warn?: boolean | undefined;
}) {
	return (
		<Card className="p-4">
			<dt className="text-sm text-muted-foreground">{label}</dt>
			<dd
				className={cn(
					"mt-1 text-xl font-semibold tabular-nums",
					warn && "text-destructive",
				)}
			>
				{value}
			</dd>
			{note && <p className="mt-1 text-sm text-destructive">{note}</p>}
		</Card>
	);
}
