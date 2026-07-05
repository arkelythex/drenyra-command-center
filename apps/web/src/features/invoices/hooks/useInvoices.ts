import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import {
	type InvoiceItem as ApiInvoiceItem,
	type InvoiceStatus as ApiInvoiceStatus,
	type CreateInvoicePayload,
	type InvoiceListFilters,
	invoicingApi,
} from "../api/invoicing.api";
import { invoiceKeys } from "../api/query-keys";

export type InvoiceStatus = "draft" | "sent" | "overdue" | "paid";

export interface InvoiceCustomer {
	id?: string;
	name: string;
	logo?: string;
	initials: string;
	email?: string;
}

export interface Invoice {
	id: string;
	companyId?: string;
	customer: InvoiceCustomer;
	amount: number;
	totalAmount?: number;
	invoiceNumber: string;
	series?: string;
	issueDate?: string;
	dueDate: string;
	status: InvoiceStatus;
	sentDate?: string;
	paidDate?: string;
	notes?: string;
	items?: ApiInvoiceItem[];
	tags?: string[];
	sunatCdr?: string;
	sunatTicket?: string;
	sunatStatus?: string;
	sunatCode?: string;
	sunatMessage?: string;
	transactionId?: string;
	transactionStatus?: string;
	currency: "PEN" | "USD";
}

interface ApiInvoiceCustomer {
	legalName?: string;
	email?: string;
}

interface ApiInvoiceListItem {
	id: string;
	customerId: string;
	customer?: ApiInvoiceCustomer;
	invoiceNumber: string;
	companyId?: string;
	dueDate?: string;
	issueDate: string;
	status: ApiInvoiceStatus;
	currency: "PEN" | "USD" | "EUR";
	totalAmount: string;
	notes?: string;
	items?: ApiInvoiceItem[];
	sunatCdr?: string | null;
	sunatTicket?: string | null;
	sunatStatus?: string | null;
	sunatCode?: string | null;
	sunatMessage?: string | null;
	transactionId?: string | null;
	transactionStatus?: string | null;
}

type UseInvoicesFilters = Omit<InvoiceListFilters, "companyId">;

function mapApiInvoiceStatus(status: ApiInvoiceStatus): InvoiceStatus {
	if (status === "DRAFT") return "draft";
	if (status === "SENT") return "sent";
	if (status === "OVERDUE") return "overdue";
	return "paid";
}

function mapApiInvoiceToUiInvoice(invoice: ApiInvoiceListItem): Invoice {
	const customerName =
		invoice.customer?.legalName ||
		(invoice.customerId
			? `Cliente ${String(invoice.customerId).slice(0, 8).toUpperCase()}`
			: "Sin Cliente");
	const customerInitials = customerName.substring(0, 2).toUpperCase();

	return {
		id: invoice.id,
		companyId: invoice.companyId,
		customer: {
			id: invoice.customerId,
			name: customerName,
			initials: customerInitials,
			email: invoice.customer?.email,
		},
		amount: Number.parseFloat(invoice.totalAmount || "0"),
		totalAmount: Number.parseFloat(invoice.totalAmount || "0"),
		invoiceNumber: invoice.invoiceNumber,
		series: invoice.invoiceNumber.split("-")[0] || undefined,
		issueDate: invoice.issueDate,
		dueDate: invoice.dueDate || invoice.issueDate,
		status: mapApiInvoiceStatus(invoice.status),
		currency: invoice.currency === "EUR" ? "USD" : invoice.currency,
		notes: invoice.notes || undefined,
		items: invoice.items,
		tags: invoice.notes ? [invoice.notes] : [],
		sunatCdr: invoice.sunatCdr || undefined,
		sunatTicket: invoice.sunatTicket || undefined,
		sunatStatus: invoice.sunatStatus || undefined,
		sunatCode: invoice.sunatCode || undefined,
		sunatMessage: invoice.sunatMessage || undefined,
		transactionId: invoice.transactionId || undefined,
		transactionStatus: invoice.transactionStatus || undefined,
	};
}

export const useInvoices = (filters: UseInvoicesFilters = {}) => {
	const queryClient = useQueryClient();
	const [activeView, setActiveView] = useState<"summary" | "aging">("summary");
	const {
		companyContext: { companyId },
	} = useActiveCompanyContext();

	// --- Real API Query ---
	const { data: remoteInvoices = [], isLoading } = useQuery({
		queryKey: invoiceKeys.list({ ...filters, companyId }),
		queryFn: async () => {
			const result = await invoicingApi.list({
				companyId,
				...filters,
			});

			const invoices = Array.isArray(result) ? result : [];
			return invoices
				.filter(
					(invoice): invoice is ApiInvoiceListItem =>
						invoice.status !== "CANCELLED",
				)
				.map(mapApiInvoiceToUiInvoice);
		},
	});

	const invoicesByStatus = useMemo(() => {
		return {
			draft: remoteInvoices.filter((i: Invoice) => i.status === "draft"),
			sent: remoteInvoices.filter((i: Invoice) => i.status === "sent"),
			overdue: remoteInvoices.filter((i: Invoice) => i.status === "overdue"),
			paid: remoteInvoices.filter((i: Invoice) => i.status === "paid"),
		};
	}, [remoteInvoices]);

	const columnTotals = useMemo(
		() => ({
			sent: invoicesByStatus.sent.reduce(
				(acc: number, i: Invoice) => acc + i.amount,
				0,
			),
			overdue: invoicesByStatus.overdue.reduce(
				(acc: number, i: Invoice) => acc + i.amount,
				0,
			),
		}),
		[invoicesByStatus],
	);

	// --- Real API Mutations ---
	const createInvoice = useMutation({
		mutationFn: async (data: Omit<CreateInvoicePayload, "companyId">) => {
			return await invoicingApi.create({ ...data, companyId });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
			toast.success("✅ Factura creada correctamente en la base de datos");
		},
		onError: (error: Error) => {
			toast.error(`❌ Error al crear factura: ${error.message}`);
		},
	});

	const updateInvoiceStatus = useMutation({
		mutationFn: async ({
			id,
			status,
		}: {
			id: string;
			status: InvoiceStatus;
		}) => {
			return await invoicingApi.updateStatus(
				id,
				status.toUpperCase() as ApiInvoiceStatus,
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
		},
	});

	return {
		invoices: remoteInvoices,
		invoicesByStatus,
		columnTotals,
		activeView,
		setActiveView,
		isLoading,
		updateInvoiceStatus: updateInvoiceStatus.mutate,
		createInvoice: createInvoice.mutate,
	};
};
