import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	invoiceTotalsCents,
	lineTotalsCents,
} from "@/features/invoices/lib/invoice-totals";
import { TAX_TYPE, type TaxType } from "@/features/invoices/lib/tax-type";
import { getActiveTaxRate } from "@/lib/latam-country-packs";
import { useEditInvoice } from "../hooks/useEditInvoice";
import type { Invoice } from "../hooks/useInvoices";
import { FIELD_LABEL } from "./create-invoice/invoice-field";
import { InvoiceHeaderFields } from "./edit-invoice/InvoiceHeaderFields";
import type {
	InvoiceItem,
	InvoiceItemUpdate,
} from "./edit-invoice/InvoiceItemRow";
import { InvoiceItemsList } from "./edit-invoice/InvoiceItemsList";
import { InvoiceTotals } from "./edit-invoice/InvoiceTotals";

interface EditInvoiceModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	invoice: Invoice | null;
}

interface EditableInvoiceItem {
	id?: string;
	productId?: string;
	description: string;
	quantity: string;
	unitPrice: string;
	taxType?: TaxType;
}

/**
 * Resolves PE's current IGV rate as a fraction (e.g. `0.18`).
 *
 * `getActiveTaxRate` returns a whole-number percentage (18, not 0.18); PE's
 * IGV rule is always populated (`PERU_TAX_RULES`), but a static fallback
 * keeps callers total-safe if that ever changed. Resolved fresh on every
 * call rather than cached, so a future rate change (e.g. 18% → 19%) is
 * picked up without a stale module-level value.
 */
function getIgvRateFraction(): number {
	return (getActiveTaxRate("pe", "IGV") ?? 18) / 100;
}

/** Line preview with the API's rule (price includes IGV), in currency units. */
function itemTotals(quantity: string, unitPrice: string, taxType: TaxType) {
	const cents = lineTotalsCents(
		{ quantity, unitPrice, taxType },
		getIgvRateFraction(),
	);
	return {
		subtotal: cents.subtotalCents / 100,
		igv: cents.igvCents / 100,
		total: cents.totalCents / 100,
	};
}

function toInputDate(value: string): string {
	return new Date(value).toISOString().split("T")[0];
}

function createEmptyInvoiceItem(id: string): InvoiceItem {
	return {
		id,
		description: "",
		quantity: "1",
		unitPrice: "0",
		taxType: TAX_TYPE.GRAVADO,
		subtotal: 0,
		igv: 0,
		total: 0,
	};
}

function mapEditableItemToInvoiceItem(
	item: EditableInvoiceItem,
	fallbackId: string,
): InvoiceItem {
	const quantity = item.quantity || "0";
	const unitPrice = item.unitPrice || "0";
	const taxType = item.taxType || TAX_TYPE.GRAVADO;
	const { subtotal, igv, total } = itemTotals(quantity, unitPrice, taxType);

	return {
		id: item.id || fallbackId,
		productId: item.productId,
		description: item.description,
		quantity,
		unitPrice,
		taxType,
		subtotal,
		igv,
		total,
	};
}

export const EditInvoiceModal = ({
	open,
	onOpenChange,
	invoice,
}: EditInvoiceModalProps) => {
	const { editInvoice, isEditing } = useEditInvoice();

	// Form fields
	const [series, setSeries] = useState("F001");
	const [issueDate, setIssueDate] = useState("");
	const [dueDate, setDueDate] = useState("");
	const [currency, setCurrency] = useState<"PEN" | "USD">("PEN");
	const [notes, setNotes] = useState("");
	const [items, setItems] = useState<InvoiceItem[]>([]);
	const [formError, setFormError] = useState<string | null>(null);

	// Load invoice data when modal opens
	useEffect(() => {
		if (open && invoice) {
			setSeries(invoice.series || "F001");
			setIssueDate(toInputDate(invoice.issueDate || invoice.dueDate));
			setDueDate(toInputDate(invoice.dueDate));
			setCurrency(invoice.currency);
			setNotes(invoice.notes || "");

			if (invoice.items && invoice.items.length > 0) {
				setItems(
					invoice.items.map((item, index) =>
						mapEditableItemToInvoiceItem(item, String(index)),
					),
				);
			} else {
				setItems([createEmptyInvoiceItem("1")]);
			}
		}
	}, [open, invoice]);

	const calculateItemTotals = (
		quantity: string,
		unitPrice: string,
		taxType: TaxType,
	) => itemTotals(quantity, unitPrice, taxType);

	const updateItem: InvoiceItemUpdate = (index, field, value) => {
		const newItems = [...items];
		newItems[index] = { ...newItems[index], [field]: value };

		// Recalculate totals if quantity, unitPrice, or taxType changed
		if (field === "quantity" || field === "unitPrice" || field === "taxType") {
			const { subtotal, igv, total } = calculateItemTotals(
				newItems[index].quantity,
				newItems[index].unitPrice,
				newItems[index].taxType,
			);
			newItems[index].subtotal = subtotal;
			newItems[index].igv = igv;
			newItems[index].total = total;
		}

		setItems(newItems);
	};

	const addItem = () => {
		setItems([...items, createEmptyInvoiceItem(String(Date.now()))]);
	};

	const removeItem = (index: number) => {
		if (items.length > 1) {
			setItems(items.filter((_, i) => i !== index));
		}
	};

	const calculateTotals = () => {
		const cents = invoiceTotalsCents(items, getIgvRateFraction());
		return {
			subtotal: cents.subtotalCents / 100,
			igv: cents.igvCents / 100,
			total: cents.totalCents / 100,
		};
	};

	const handleSubmit = async () => {
		if (!invoice) return;

		if (items.some((item) => !item.description)) {
			setFormError("Completa la descripción de todos los conceptos");
			return;
		}
		setFormError(null);

		editInvoice(
			{
				id: invoice.id,
				data: {
					customerId: invoice.customer.id || invoice.id,
					issueDate,
					dueDate,
					currency,
					notes,
					items: items.map((item) => ({
						productId: item.productId,
						description: item.description,
						quantity: item.quantity,
						unitPrice: item.unitPrice,
						taxType: item.taxType,
					})),
				},
			},
			{
				onSuccess: () => {
					onOpenChange(false);
				},
			},
		);
	};

	const totals = calculateTotals();

	if (!invoice) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90dvh] max-w-3xl gap-0 overflow-y-auto border-border bg-background p-0">
				<DialogHeader className="sticky top-0 z-10 border-b border-border bg-background px-4 py-4 text-left sm:px-6">
					<DialogTitle className="text-lg font-semibold">
						Editar factura {invoice.invoiceNumber}
					</DialogTitle>
					<DialogDescription className="text-sm text-muted-foreground">
						Cliente: {invoice.customer.name}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 px-4 py-5 sm:px-6">
					<InvoiceHeaderFields
						series={series}
						setSeries={setSeries}
						issueDate={issueDate}
						setIssueDate={setIssueDate}
						dueDate={dueDate}
						setDueDate={setDueDate}
						currency={currency}
						setCurrency={setCurrency}
					/>

					<InvoiceItemsList
						items={items}
						currency={currency}
						onUpdate={updateItem}
						onAddItem={addItem}
						onRemoveItem={removeItem}
					/>

					<div>
						<Label htmlFor="edit-invoice-notes" className={FIELD_LABEL}>
							Notas
						</Label>
						<Textarea
							id="edit-invoice-notes"
							placeholder="Información adicional para el comprobante"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							className="min-h-24 resize-none rounded-lg border-border bg-card p-3 text-sm"
						/>
					</div>

					<InvoiceTotals totals={totals} currency={currency} />
				</div>

				<DialogFooter className="sticky bottom-0 flex-col-reverse gap-3 border-t border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6">
					{formError && (
						<p role="alert" className="text-sm text-destructive sm:mr-auto">
							{formError}
						</p>
					)}
					<Button
						type="button"
						variant="ghost"
						onClick={() => onOpenChange(false)}
						disabled={isEditing}
						className="h-11 px-5"
					>
						Cancelar
					</Button>
					<Button
						variant="brand"
						type="button"
						onClick={handleSubmit}
						disabled={isEditing}
						className="h-11 px-5"
					>
						{isEditing ? "Guardando…" : "Guardar cambios"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
