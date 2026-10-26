import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { lineTotalsCents } from "@/features/invoices/lib/invoice-totals";
import { TAX_TYPE, TAX_TYPE_LABELS } from "@/features/invoices/lib/tax-type";
import { n } from "@/lib/utils";
import type { InvoiceItem } from "./hooks/useInvoiceCalculations";
import { FIELD_INPUT, FIELD_LABEL } from "./invoice-field";

export interface InvoiceLineItemProps {
	item: InvoiceItem;
	index: number;
	currency: string;
	igvRatePercent: number;
	onUpdate: (
		id: string,
		field: keyof InvoiceItem,
		value: InvoiceItem[keyof InvoiceItem],
	) => void;
	onRemove: (id: string) => void;
	onFocusField: () => void;
}

/** One concept of the invoice: what, how many, at what price and tax. */
export function InvoiceLineItem({
	item,
	index,
	currency,
	igvRatePercent,
	onUpdate,
	onRemove,
	onFocusField,
}: InvoiceLineItemProps) {
	const cents = lineTotalsCents(item, igvRatePercent / 100);
	const money = (value: number) =>
		n(value / 100, currency as unknown as Parameters<typeof n>[1]);
	const id = (field: string) => `item-${item.id}-${field}`;

	return (
		<li className="rounded-lg border border-border bg-card p-4">
			<div className="grid gap-3 sm:grid-cols-12">
				<div className="sm:col-span-12">
					<Label htmlFor={id("description")} className={FIELD_LABEL}>
						Descripción del concepto {index + 1}
					</Label>
					<Input
						id={id("description")}
						placeholder="Servicio o bien facturado"
						value={item.description}
						onChange={(e) => onUpdate(item.id, "description", e.target.value)}
						onFocus={onFocusField}
						className={FIELD_INPUT}
					/>
				</div>
				<div className="sm:col-span-3">
					<Label htmlFor={id("quantity")} className={FIELD_LABEL}>
						Cantidad
					</Label>
					<Input
						id={id("quantity")}
						type="number"
						inputMode="decimal"
						value={item.quantity}
						onChange={(e) =>
							onUpdate(item.id, "quantity", Number(e.target.value))
						}
						onFocus={onFocusField}
						className={`${FIELD_INPUT} text-right tabular-nums`}
					/>
				</div>
				<div className="sm:col-span-5">
					<Label htmlFor={id("price")} className={FIELD_LABEL}>
						Precio unitario con IGV ({currency})
					</Label>
					<Input
						id={id("price")}
						type="number"
						inputMode="decimal"
						value={item.unitPrice}
						onChange={(e) =>
							onUpdate(item.id, "unitPrice", Number(e.target.value))
						}
						onFocus={onFocusField}
						className={`${FIELD_INPUT} text-right tabular-nums`}
					/>
				</div>
				<div className="sm:col-span-4">
					<Label htmlFor={id("tax")} className={FIELD_LABEL}>
						Impuesto
					</Label>
					<NativeSelect
						id={id("tax")}
						value={item.taxType}
						onChange={(e) => onUpdate(item.id, "taxType", e.target.value)}
						onFocus={onFocusField}
					>
						<option value={TAX_TYPE.GRAVADO}>
							{TAX_TYPE_LABELS.GRAVADO} ({igvRatePercent}%)
						</option>
						<option value={TAX_TYPE.EXONERADO}>
							{TAX_TYPE_LABELS.EXONERADO}
						</option>
						<option value={TAX_TYPE.INAFECTO}>
							{TAX_TYPE_LABELS.INAFECTO}
						</option>
					</NativeSelect>
				</div>
			</div>
			<div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-sm">
				<button
					type="button"
					onClick={() => onRemove(item.id)}
					className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
				>
					<Trash2 aria-hidden="true" className="size-4" />
					Quitar concepto {index + 1}
				</button>
				<p className="tabular-nums text-muted-foreground">
					Subtotal {money(cents.subtotalCents)} · IGV {money(cents.igvCents)} ·{" "}
					<span className="font-medium text-foreground">
						Total {money(cents.totalCents)}
					</span>
				</p>
			</div>
		</li>
	);
}
