import { useState, useTransition } from "react";
import { captureError } from "@/lib/monitoring";
import type {
	CreateInvoicePayload,
	InvoiceCurrency,
	InvoiceCustomerOption,
} from "../types";
import type { InvoiceItem } from "./useInvoiceCalculations";

interface UseInvoiceFormProps {
	onSubmit: (data: CreateInvoicePayload) => Promise<void>;
	onSuccess: () => void;
	companyId: string;
}

const FISCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function padFiscalDatePart(value: number): string {
	return value.toString().padStart(2, "0");
}

export function formatFiscalDateInput(date: Date): string {
	return [
		date.getFullYear(),
		padFiscalDatePart(date.getMonth() + 1),
		padFiscalDatePart(date.getDate()),
	].join("-");
}

export function addFiscalDays(date: Date, days: number): Date {
	const nextDate = new Date(date);
	nextDate.setDate(nextDate.getDate() + days);
	return nextDate;
}

function isValidFiscalDate(date: string): boolean {
	if (!FISCAL_DATE_PATTERN.test(date)) return false;

	const [year, month, day] = date.split("-").map(Number);
	if (year === undefined || month === undefined || day === undefined) {
		return false;
	}

	const parsed = new Date(Date.UTC(year, month - 1, day));
	return (
		parsed.getUTCFullYear() === year &&
		parsed.getUTCMonth() === month - 1 &&
		parsed.getUTCDate() === day
	);
}

export const useInvoiceForm = ({
	onSubmit,
	onSuccess,
	companyId,
}: UseInvoiceFormProps) => {
	const [isPending, startTransition] = useTransition();
	const [selectedCustomer, setSelectedCustomer] =
		useState<InvoiceCustomerOption | null>(null);

	// Form State
	const [series, setSeries] = useState("F001");
	const [issueDate, setIssueDate] = useState(() =>
		formatFiscalDateInput(new Date()),
	);
	const [dueDate, setDueDate] = useState(() => {
		return formatFiscalDateInput(addFiscalDays(new Date(), 30));
	});
	const [currency, setCurrency] = useState<InvoiceCurrency>("PEN");
	const [notes, setNotes] = useState("");

	const [items, setItems] = useState<InvoiceItem[]>([
		{
			id: crypto.randomUUID(),
			description: "",
			quantity: 1,
			unitPrice: 0,
			taxType: "GRAVADO",
		},
	]);

	// Actions
	const addItem = () => {
		setItems((prev) => [
			...prev,
			{
				id: crypto.randomUUID(),
				description: "",
				quantity: 1,
				unitPrice: 0,
				taxType: "GRAVADO",
			},
		]);
	};

	const updateItem = (
		id: string,
		field: keyof InvoiceItem,
		value: InvoiceItem[keyof InvoiceItem],
	) => {
		setItems((prev) =>
			prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
		);
	};

	const removeItem = (id: string) => {
		if (items.length <= 1) return;
		setItems((prev) => prev.filter((item) => item.id !== id));
	};

	const handleSubmit = async () => {
		if (!selectedCustomer) return alert("Seleccione un cliente");
		if (!isValidFiscalDate(issueDate))
			return alert("Ingrese una fecha de emisión válida");
		if (!isValidFiscalDate(dueDate))
			return alert("Ingrese una fecha de vencimiento válida");
		if (dueDate < issueDate)
			return alert(
				"La fecha de vencimiento no puede ser anterior a la emisión",
			);
		if (items.some((i) => !i.description))
			return alert("Complete las descripciones");

		startTransition(async () => {
			try {
				await onSubmit({
					companyId,
					customerId: selectedCustomer.id,
					series,
					issueDate,
					dueDate,
					currency,
					notes,
					items: items.map((item) => ({
						productId: item.productId,
						description: item.description,
						quantity: item.quantity.toString(),
						unitPrice: item.unitPrice.toString(),
						taxType: item.taxType,
					})),
				});
				onSuccess();
			} catch (error) {
				captureError(
					error instanceof Error ? error : new Error("Error al crear factura"),
					{
						source: "create-invoice.form.submit",
						companyId,
					},
				);
				alert("Error al crear factura");
			}
		});
	};

	return {
		formState: {
			selectedCustomer,
			series,
			issueDate,
			dueDate,
			currency,
			notes,
			items,
			isPending,
		},
		actions: {
			setSelectedCustomer,
			setSeries,
			setIssueDate,
			setDueDate,
			setCurrency,
			setNotes,
			addItem,
			updateItem,
			removeItem,
			handleSubmit,
		},
	};
};
