import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { FIELD_INPUT, FIELD_LABEL } from "../create-invoice/invoice-field";

export interface InvoiceItem {
	id: string;
	productId?: string | undefined;
	description: string;
	quantity: string;
	unitPrice: string;
	taxType: "GRAVADO" | "EXONERADO" | "INAFECTO";
	subtotal: number;
	igv: number;
	total: number;
}

export type InvoiceItemUpdate = <K extends keyof InvoiceItem>(
	index: number,
	field: K,
	value: InvoiceItem[K],
) => void;

interface InvoiceItemRowProps {
	item: InvoiceItem;
	index: number;
	currency: "PEN" | "USD";
	onUpdate: InvoiceItemUpdate;
	onRemove: (index: number) => void;
	canRemove: boolean;
}

export const InvoiceItemRow = ({
	item,
	index,
	currency,
	onUpdate,
	onRemove,
	canRemove,
}: InvoiceItemRowProps) => {
	const id = (field: string) => `edit-item-${item.id}-${field}`;
	const money = (value: number) => `${currency} ${value.toFixed(2)}`;

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
						onChange={(e) => onUpdate(index, "description", e.target.value)}
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
						onChange={(e) => onUpdate(index, "quantity", e.target.value)}
						className={`${FIELD_INPUT} text-right tabular-nums`}
					/>
				</div>
				<div className="sm:col-span-5">
					<Label htmlFor={id("price")} className={FIELD_LABEL}>
						Precio unitario con IGV
					</Label>
					<Input
						id={id("price")}
						type="number"
						step="0.01"
						inputMode="decimal"
						value={item.unitPrice}
						onChange={(e) => onUpdate(index, "unitPrice", e.target.value)}
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
						onChange={(e) =>
							onUpdate(
								index,
								"taxType",
								e.target.value as InvoiceItem["taxType"],
							)
						}
					>
						<option value="GRAVADO">Gravado</option>
						<option value="EXONERADO">Exonerado</option>
						<option value="INAFECTO">Inafecto</option>
					</NativeSelect>
				</div>
			</div>
			<div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-sm">
				{canRemove ? (
					<button
						type="button"
						onClick={() => onRemove(index)}
						className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
					>
						<Trash2 aria-hidden="true" className="size-4" />
						Quitar concepto {index + 1}
					</button>
				) : (
					<span />
				)}
				<p className="tabular-nums text-muted-foreground">
					Subtotal {money(item.subtotal)} · IGV {money(item.igv)} ·{" "}
					<span className="font-medium text-foreground">
						Total {money(item.total)}
					</span>
				</p>
			</div>
		</li>
	);
};
