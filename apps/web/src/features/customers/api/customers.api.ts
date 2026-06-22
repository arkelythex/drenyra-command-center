import { extractOkDataOrPassthrough, unwrap } from "../../../lib/api-helpers";
import { customerTreatyClient } from "./customer-treaty-client";

/**
 * Customer segment classification
 */
export type CustomerSegment = "RETAIL" | "WHOLESALE" | "GOVERNMENT";

/**
 * Payload para crear cliente
 *
 * Matches backend schema (apps/api/src/features/customers/api/routes.ts:35-45)
 */
export interface CreateCustomerPayload {
	companyId: string;
	taxId: string; // RUC: 11 digits
	legalName: string;
	email?: string;
	address?: string;
	phone?: string;
	creditLimit?: number;
	creditDays?: number;
	customerSegment?: CustomerSegment;
}

/**
 * Payload para actualizar cliente (todos los campos opcionales)
 *
 * Matches backend schema (apps/api/src/features/customers/api/routes.ts:166-175)
 */
export interface UpdateCustomerPayload {
	taxId?: string;
	legalName?: string;
	email?: string;
	address?: string;
	phone?: string;
	creditLimit?: number;
	creditDays?: number;
	customerSegment?: CustomerSegment;
}

/**
 * Filtros para listar clientes
 */
export interface CustomerListFilters {
	companyId: string;
	includeInactive?: boolean;
	minPaymentScore?: number;
	segment?: CustomerSegment;
}

export interface CustomerRecord {
	id: string;
	companyId?: string;
	taxId: string;
	legalName?: string;
	tradeName?: string;
	address?: string;
	email?: string;
	phone?: string;
	creditLimit?: number | null;
	creditDays?: number | null;
	status?: "active" | "inactive";
	isActive?: boolean;
	currentBalance?: string | number | null;
	name?: string;
	initials?: string;
	logo?: string;
	pendingBalance?: number | null;
	hasRetention?: boolean | null;
	totalRevenue?: number | null;
}

interface CustomerListPayload {
	data?: CustomerRecord[];
}

function normalizeCustomerList(
	payload: CustomerRecord[] | CustomerListPayload | null | undefined,
): CustomerRecord[] {
	if (Array.isArray(payload)) return payload;
	return Array.isArray(payload?.data) ? payload.data : [];
}

/**
 * Customer API client (Type-safe)
 *
 * Leverages Eden Treaty + ok()/fail() pattern for full type inference
 */
export const customersApi = {
	/**
	 * Listar clientes con filtros
	 */
	list: async (filters: CustomerListFilters): Promise<CustomerRecord[]> => {
		const body = await unwrap(
			customerTreatyClient.get({
				query: filters,
			}),
		);
		const payload = extractOkDataOrPassthrough<
			CustomerRecord[] | CustomerListPayload
		>(body, "customers.list");
		return normalizeCustomerList(payload);
	},

	/**
	 * Crear nuevo cliente con validación RUC (Backend side)
	 */
	create: async (payload: CreateCustomerPayload) => {
		return unwrap(customerTreatyClient.post(payload));
	},

	/**
	 * Obtener detalle con historial
	 */
	getById: async (
		id: string,
		options?: { includeInvoices?: boolean; invoiceLimit?: number },
	) => {
		return unwrap(
			customerTreatyClient({ id }).get({
				query: options || {},
			}),
		);
	},

	/**
	 * Actualizar datos del cliente
	 */
	update: async (id: string, payload: UpdateCustomerPayload) => {
		return unwrap(customerTreatyClient({ id }).patch(payload));
	},

	/**
	 * Eliminar (Soft delete)
	 */
	delete: async (id: string) => {
		return unwrap(customerTreatyClient({ id }).delete());
	},
};
