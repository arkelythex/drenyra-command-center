import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useEditInvoice } from "../hooks/useEditInvoice";
import type { Invoice } from "../hooks/useInvoices";
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
	taxType?: "GRAVADO" | "EXONERADO" | "INAFECTO";
}

const DEFAULT_COMPANY_ID = "00000000-0000-0000-0000-000000000001";

function toInputDate(value: string): string {
	return new Date(value).toISOString().split("T")[0];
}

function createEmptyInvoiceItem(id: string): InvoiceItem {
	return {
		id,
		description: "",
		quantity: "1",
		unitPrice: "0",
		taxType: "GRAVADO",
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
	const taxType = item.taxType || "GRAVADO";
	const qty = parseFloat(quantity) || 0;
	const price = parseFloat(unitPrice) || 0;
	const subtotal = qty * price;
	const igv = taxType === "GRAVADO" ? subtotal * 0.18 : 0;
	const total = subtotal + igv;

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
		taxType: "GRAVADO" | "EXONERADO" | "INAFECTO",
	) => {
		const qty = parseFloat(quantity) || 0;
		const price = parseFloat(unitPrice) || 0;
		const subtotal = qty * price;
		const igv = taxType === "GRAVADO" ? subtotal * 0.18 : 0;
		const total = subtotal + igv;
		return { subtotal, igv, total };
	};

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
		const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
		const igv = items.reduce((sum, item) => sum + item.igv, 0);
		const total = items.reduce((sum, item) => sum + item.total, 0);
		return { subtotal, igv, total };
	};

	const handleSubmit = async () => {
		if (!invoice) return;

		if (items.some((item) => !item.description)) {
			alert("Por favor completa la descripción de todos los items");
			return;
		}

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
			<DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-surface-soft border-border">
				<DialogHeader>
					<DialogTitle className="text-2xl font-black text-foreground tracking-tight">
						EDITAR FACTURA {invoice.invoiceNumber}
					</DialogTitle>
					<p className="text-xs text-muted-foreground font-mono mt-1">
						Cliente: {invoice.customer.name}
					</p>
				</DialogHeader>

				<div className="space-y-6 mt-4">
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

					{/* Notes */}
					<div className="space-y-2">
						<label className="text-label font-black uppercase tracking-widest text-muted-foreground">
							Notas / Observaciones
						</label>
						<Textarea
							placeholder="Agrega notas adicionales..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							className="min-h-[80px] bg-background border-border font-mono text-xs resize-none"
						/>
					</div>

					<InvoiceTotals totals={totals} currency={currency} />
				</div>

				<DialogFooter className="mt-6">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isEditing}
						className="font-black text-xs"
					>
						CANCELAR
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={isEditing}
						className="font-black text-xs bg-primary hover:bg-primary/90"
					>
						{isEditing ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
