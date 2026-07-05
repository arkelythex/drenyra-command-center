import { api, getGovernanceAuditHeaders } from "@/lib/api";
import { unwrap } from "@/lib/api-helpers";
import { isRecord, toNumericString } from "./helpers";
import type {
	CreateInvoicePayload,
	Currency,
	InvoiceListFilters,
	InvoiceStatus,
	UpdateInvoicePayload,
} from "./types";

/**
 * Crear factura
 */
export async function invoicingCreate(payload: CreateInvoicePayload) {
	const normalized = {
		...payload,
		exchangeRate: payload.exchangeRate,
		items: payload.items.map((item) => ({
			...item,
			quantity: toNumericString(item.quantity),
			unitPrice: toNumericString(item.unitPrice),
		})),
	};

	return unwrap(api.api.invoices.post(normalized));
}

/**
 * Listar facturas con filtros y paginación
 */
export async function invoicingList(filters: InvoiceListFilters) {
	const rawResult: unknown = await unwrap(
		api.api.invoices.get({
			query: {
				companyId: filters.companyId,
				...(filters.status && { status: filters.status }),
				...(filters.customerId && { customerId: filters.customerId }),
				...(filters.startDate && { startDate: filters.startDate }),
				...(filters.endDate && { endDate: filters.endDate }),
				...(filters.minAmount && { minAmount: filters.minAmount }),
				...(filters.maxAmount && { maxAmount: filters.maxAmount }),
				...(filters.search && { search: filters.search }),
				...(filters.limit !== undefined && {
					limit: filters.limit.toString(),
				}),
				...(filters.offset !== undefined && {
					offset: filters.offset.toString(),
				}),
			},
		}),
	);

	if (isRecord(rawResult) && Array.isArray(rawResult.invoices)) {
		return rawResult.invoices;
	}

	return [];
}

/**
 * Obtener factura por ID
 */
export async function invoicingGetById(id: string) {
	return unwrap(api.api.invoices({ id }).get());
}

/**
 * Actualizar factura DRAFT
 *
 * IMPORTANT: Only DRAFT invoices can be updated
 */
export async function invoicingUpdate(
	id: string,
	payload: UpdateInvoicePayload,
) {
	const normalized = {
		...payload,
		items: payload.items.map((item) => ({
			...item,
			quantity: toNumericString(item.quantity),
			unitPrice: toNumericString(item.unitPrice),
		})),
	};

	return unwrap(api.api.invoices({ id }).patch(normalized));
}

/**
 * Actualizar estado de factura
 */
export async function invoicingUpdateStatus(id: string, status: InvoiceStatus) {
	return unwrap(
		api.api.invoices({ id }).status.patch(
			{ status },
			{
				headers: getGovernanceAuditHeaders(),
			},
		),
	);
}

/**
 * Eliminar factura (solo DRAFT)
 */
export async function invoicingDelete(id: string) {
	return unwrap(api.api.invoices({ id }).delete());
}

/**
 * Aplicar pago a factura
 */
export async function invoicingPay(
	id: string,
	amount: number,
	currency: Currency,
) {
	return unwrap(
		api.api.invoices({ id }).pay.post(
			{
				amount: amount.toFixed(2),
				currency,
			},
			{
				headers: getGovernanceAuditHeaders(),
			},
		),
	);
}
