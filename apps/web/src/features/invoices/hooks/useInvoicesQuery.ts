import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	type CustomerRecord,
	customersApi,
} from "@/features/customers/api/customers.api";
import { captureError } from "@/lib/monitoring";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import {
	type InvoiceStatus as ApiInvoiceStatus,
	type CreateInvoicePayload,
	invoicingApi,
} from "../api/invoicing.api";
import { invoiceKeys } from "../api/query-keys";
import type { Invoice, InvoiceStatus } from "./useInvoices";

// Local type definitions to avoid circular dependencies
interface ApiInvoice {
	id: string;
	customerId: string;
	invoiceNumber: string;
	dueDate: string;
	status: ApiInvoiceStatus;
	currency: string;
	totalAmount: string;
	notes?: string;
	sunatCdr?: string | null;
	sunatTicket?: string | null;
	sunatStatus?: string | null;
	sunatCode?: string | null;
	sunatMessage?: string | null;
	transactionId?: string | null;
	transactionStatus?: string | null;
}

interface Customer {
	id: string;
	legalName: string;
	email?: string;
}

function mapCurrency(currency: string): Invoice["currency"] {
	return currency === "USD" ? "USD" : "PEN";
}

function mapStatus(status: ApiInvoiceStatus): InvoiceStatus {
	if (status === "DRAFT") return "draft";
	if (status === "SENT") return "sent";
	if (status === "OVERDUE") return "overdue";
	return "paid";
}

function getCustomerLabel(customerId: string): string {
	if (!customerId || customerId.length < 8) return "Cliente";
	return `Cliente ${customerId.slice(0, 8).toUpperCase()}`;
}

function toUiInvoice(
	invoice: ApiInvoice,
	customersById: Map<string, Customer>,
): Invoice {
	const customer = customersById.get(invoice.customerId);
	const customerName =
		customer?.legalName ?? getCustomerLabel(invoice.customerId);
	const amount = Number.parseFloat(invoice.totalAmount || "0");

	return {
		id: invoice.id,
		customer: {
			name: customerName,
			initials: customerName.slice(0, 2).toUpperCase(),
			email: customer?.email,
		},
		amount,
		totalAmount: amount,
		invoiceNumber: invoice.invoiceNumber,
		dueDate: invoice.dueDate,
		status: mapStatus(invoice.status),
		currency: mapCurrency(invoice.currency),
		tags: invoice.notes ? [invoice.notes] : [],
		sunatCdr: invoice.sunatCdr ?? undefined,
		sunatTicket: invoice.sunatTicket ?? undefined,
		sunatStatus: invoice.sunatStatus ?? undefined,
		sunatCode: invoice.sunatCode ?? undefined,
		sunatMessage: invoice.sunatMessage ?? undefined,
		transactionId: invoice.transactionId ?? undefined,
		transactionStatus: invoice.transactionStatus ?? undefined,
	};
}

export const useInvoicesQuery = (filters: Record<string, unknown> = {}) => {
	const queryClient = useQueryClient();
	const {
		companyContext: { companyId },
	} = useActiveCompanyContext();

	// Use query keys factory for consistency
	const queryKey = invoiceKeys.list({ ...filters, companyId });

	// 1. QUERY: Fetch Invoices (Real Data)
	const {
		data: invoices,
		isLoading,
		error,
	} = useQuery({
		queryKey,
		queryFn: async () => {
			try {
				const [result, customers] = await Promise.all([
					invoicingApi.list({
						...filters,
						companyId,
					}),
					// Uses Eden Treaty with api.api.customers pattern
					customersApi.list({ companyId }).catch(() => [] as CustomerRecord[]),
				]);

				const customersList = Array.isArray(customers) ? customers : [];
				const customersById = new Map<string, Customer>(
					customersList.map((customer) => [
						customer.id,
						{
							id: customer.id,
							legalName:
								customer.legalName ??
								customer.tradeName ??
								customer.name ??
								getCustomerLabel(customer.id),
							email: customer.email,
						},
					]),
				);

				return Array.isArray(result)
					? result
							.filter((invoice) => invoice.status !== "CANCELLED")
							.map((invoice) =>
								toUiInvoice(invoice as ApiInvoice, customersById),
							)
					: [];
			} catch (err) {
				captureError(
					err instanceof Error ? err : new Error("Failed to fetch invoices"),
					{
						source: "invoice-query",
						companyId,
					},
				);
				return [];
			}
		},
		staleTime: 1000 * 60,
	});

	// 2. MUTATION: Create Invoice
	const createMutation = useMutation({
		mutationFn: async (newInvoice: CreateInvoicePayload) => {
			const payload = {
				...newInvoice,
				companyId,
				items: newInvoice.items ?? [],
			};
			return await invoicingApi.create(payload);
		},
		onSuccess: () => {
			toast.success("Factura creada exitosamente");
			// Use query keys factory for invalidation
			queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
		},
		onError: (err: Error) => {
			toast.error(`Error al crear factura: ${err.message}`);
		},
	});

	// 3. MUTATION: Update Status (Optimistic UI)
	const statusMutation = useMutation({
		mutationFn: async ({ id, status }: { id: string; status: string }) => {
			const apiStatus = status.toUpperCase() as ApiInvoiceStatus;
			return await invoicingApi.updateStatus(id, apiStatus);
		},
		onMutate: async ({ id, status }) => {
			await queryClient.cancelQueries({ queryKey: invoiceKeys.all });
			const previousInvoices = queryClient.getQueryData(queryKey);

			queryClient.setQueryData(queryKey, (old: Invoice[] | undefined) => {
				if (!old) return [];
				return old.map((inv) =>
					inv.id === id
						? { ...inv, status: status.toLowerCase() as InvoiceStatus }
						: inv,
				);
			});

			return { previousInvoices };
		},
		onError: (_err, _variables, context) => {
			if (context?.previousInvoices) {
				queryClient.setQueryData(queryKey, context.previousInvoices);
			}
			toast.error("No se pudo actualizar el estado");
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
		},
	});

	return {
		invoices: invoices || [],
		isLoading,
		error,
		createInvoice: async (payload: CreateInvoicePayload): Promise<void> => {
			await createMutation.mutateAsync(payload);
		},
		updateStatus: statusMutation.mutateAsync,
		isCreating: createMutation.isPending,
	};
};
