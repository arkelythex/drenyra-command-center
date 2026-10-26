import { lazy, Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useInvoiceCalculations } from "./hooks/useInvoiceCalculations";
import { useInvoiceForm } from "./hooks/useInvoiceForm";
import { FIELD_LABEL } from "./invoice-field";
import type { CreateInvoicePayload, InvoiceCurrency } from "./types";

const CustomerSelector = lazy(async () => {
	const mod = await import("./CustomerSelector");
	return { default: mod.CustomerSelector };
});

const InvoiceDateFields = lazy(async () => {
	const mod = await import("./InvoiceDateFields");
	return { default: mod.InvoiceDateFields };
});

const InvoiceLineItems = lazy(async () => {
	const mod = await import("./InvoiceLineItems");
	return { default: mod.InvoiceLineItems };
});

const InvoiceTotals = lazy(async () => {
	const mod = await import("./InvoiceTotals");
	return { default: mod.InvoiceTotals };
});

interface Props {
	onSubmit: (data: CreateInvoicePayload) => Promise<void>;
	onCancel: () => void;
	companyId: string;
}

export const InvoiceForm = ({ onSubmit, onCancel, companyId }: Props) => {
	const { formState, actions } = useInvoiceForm({
		onSubmit,
		onSuccess: onCancel,
		companyId,
	});

	const totals = useInvoiceCalculations(formState.items);

	return (
		<div className="space-y-6">
			<div className="grid gap-4 sm:grid-cols-3">
				<div className="sm:col-span-2">
					<Suspense fallback={<InvoiceFormSectionSkeleton className="h-16" />}>
						<CustomerSelector
							selectedCustomer={formState.selectedCustomer}
							onSelect={actions.setSelectedCustomer}
							companyId={companyId}
						/>
					</Suspense>
				</div>
				<div>
					<Label htmlFor="invoice-series" className={FIELD_LABEL}>
						Tipo y serie
					</Label>
					<NativeSelect
						id="invoice-series"
						value={formState.series}
						onChange={(e) => actions.setSeries(e.target.value)}
					>
						<option value="F001">F001 · Factura</option>
						<option value="B001">B001 · Boleta de venta</option>
					</NativeSelect>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				<Suspense fallback={<InvoiceFormSectionSkeleton className="h-16" />}>
					<InvoiceDateFields
						dueDate={formState.dueDate}
						issueDate={formState.issueDate}
						onDueDateChange={actions.setDueDate}
						onIssueDateChange={actions.setIssueDate}
					/>
				</Suspense>
				<div>
					<Label htmlFor="invoice-currency" className={FIELD_LABEL}>
						Moneda
					</Label>
					<NativeSelect
						id="invoice-currency"
						value={formState.currency}
						onChange={(e) =>
							actions.setCurrency(e.target.value as InvoiceCurrency)
						}
					>
						<option value="PEN">PEN · Soles</option>
						<option value="USD">USD · Dólares</option>
					</NativeSelect>
				</div>
			</div>

			<Suspense fallback={<InvoiceFormSectionSkeleton className="h-40" />}>
				<InvoiceLineItems
					items={formState.items}
					onAdd={actions.addItem}
					onRemove={actions.removeItem}
					onUpdate={actions.updateItem}
					currency={formState.currency}
				/>
			</Suspense>

			<div className="grid gap-6 border-t border-border pt-6 lg:grid-cols-2">
				<div>
					<Label htmlFor="invoice-notes" className={FIELD_LABEL}>
						Notas
					</Label>
					<Textarea
						id="invoice-notes"
						placeholder="Información adicional para el comprobante"
						value={formState.notes}
						onChange={(e) => actions.setNotes(e.target.value)}
						className="min-h-28 resize-none rounded-lg border-border bg-card p-3 text-sm"
					/>
				</div>
				<Suspense fallback={<InvoiceFormSectionSkeleton className="h-40" />}>
					<InvoiceTotals totals={totals} currency={formState.currency} />
				</Suspense>
			</div>

			<div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-3 border-t border-border bg-background px-4 py-3 sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
				<Button
					type="button"
					variant="ghost"
					onClick={onCancel}
					disabled={formState.isPending}
					className="h-11 px-5"
				>
					Cancelar
				</Button>
				<Button
					variant="brand"
					type="button"
					onClick={actions.handleSubmit}
					disabled={formState.isPending}
					className="h-11 px-5"
				>
					{formState.isPending ? "Emitiendo…" : "Emitir factura"}
				</Button>
			</div>
		</div>
	);
};

function InvoiceFormSectionSkeleton({ className }: { className: string }) {
	return (
		<div
			aria-label="Cargando sección de factura"
			className={`rounded-lg bg-muted ${className}`}
			role="status"
		>
			<span className="sr-only">Cargando sección de factura</span>
		</div>
	);
}
