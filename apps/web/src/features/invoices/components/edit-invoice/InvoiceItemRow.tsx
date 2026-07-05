import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface InvoiceItem {
	id: string;
	productId?: string;
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
	return (
		<div className="bg-background border border-border rounded-lg p-4 space-y-3">
			<div className="grid grid-cols-12 gap-3">
				<div className="col-span-5">
					<Input
						placeholder="Descripción del producto/servicio"
						value={item.description}
						onChange={(e) => onUpdate(index, "description", e.target.value)}
						className="h-9 bg-surface-soft border-border font-mono text-xs"
					/>
				</div>

				<div className="col-span-2">
					<Input
						type="number"
						placeholder="Cantidad"
						value={item.quantity}
						onChange={(e) => onUpdate(index, "quantity", e.target.value)}
						className="h-9 bg-surface-soft border-border font-mono text-xs"
					/>
				</div>

				<div className="col-span-2">
					<Input
						type="number"
						step="0.01"
						placeholder="Precio Unit."
						value={item.unitPrice}
						onChange={(e) => onUpdate(index, "unitPrice", e.target.value)}
						className="h-9 bg-surface-soft border-border font-mono text-xs"
					/>
				</div>

				<div className="col-span-2">
					<select
						aria-label="Tipo de impuesto"
						value={item.taxType}
						onChange={(e) =>
							onUpdate(
								index,
								"taxType",
								e.target.value as InvoiceItem["taxType"],
							)
						}
						className="w-full h-9 bg-surface-soft border border-border rounded-lg px-2 font-mono text-label text-foreground"
					>
						<option value="GRAVADO">Gravado</option>
						<option value="EXONERADO">Exonerado</option>
						<option value="INAFECTO">Inafecto</option>
					</select>
				</div>

				<div className="col-span-1 flex items-center justify-end">
					{canRemove && (
						<button
							onClick={() => onRemove(index)}
							className="h-9 w-9 flex items-center justify-center rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
						>
							<X size={14} />
						</button>
					)}
				</div>
			</div>

			<div className="flex justify-end gap-4 text-label font-mono">
				<span className="text-muted-foreground">
					Subtotal:{" "}
					<span className="text-foreground font-bold">
						{currency} {item.subtotal.toFixed(2)}
					</span>
				</span>
				<span className="text-muted-foreground">
					IGV:{" "}
					<span className="text-foreground font-bold">
						{currency} {item.igv.toFixed(2)}
					</span>
				</span>
				<span className="text-muted-foreground">
					Total:{" "}
					<span className="text-foreground font-bold">
						{currency} {item.total.toFixed(2)}
					</span>
				</span>
			</div>
		</div>
	);
};
