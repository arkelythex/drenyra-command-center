import { extractOkDataOrPassthrough, unwrap } from "@/lib/api-helpers";
import { vendorTreatyClient } from "./vendor-treaty-client";

/**
 * Vendor payment method types
 */
export type VendorPaymentMethod = "TRANSFER" | "CASH" | "CHECK";

/**
 * Payload para crear proveedor
 *
 * Matches backend schema (apps/api/src/features/vendors/api/routes.ts:30-40)
 */
export interface CreateVendorPayload {
	companyId: string;
	taxId: string; // RUC: 11 digits
	legalName: string;
	email?: string;
	vendorRating?: number; // 0-100
	paymentTermDays?: number; // Days until payment due
	preferredPaymentMethod?: VendorPaymentMethod;
	bankAccount?: string;
	purchaseCategories?: string[]; // Max 50 items
}

/**
 * Payload para actualizar proveedor (todos los campos opcionales)
 *
 * Matches backend schema (apps/api/src/features/vendors/api/routes.ts:115-124)
 */
export interface UpdateVendorPayload {
	taxId?: string;
	legalName?: string;
	email?: string;
	vendorRating?: number;
	paymentTermDays?: number;
	preferredPaymentMethod?: VendorPaymentMethod;
	bankAccount?: string;
	purchaseCategories?: string[];
}

/**
 * Filtros para listar proveedores
 */
export interface VendorListFilters {
	companyId: string;
	includeInactive?: boolean;
	minRating?: number; // 0-100
	category?: string;
}

export interface VendorRecord {
	id: string;
	taxId: string;
	legalName?: string;
	name?: string;
	tradeName?: string;
	condition?: "HABIDO" | "NO HABIDO";
	totalSpend?: number;
	isRetentionAgent?: boolean;
	isGoodTaxpayer?: boolean;
	logo?: string;
	initials?: string;
	transactions?: VendorTransaction[];
	companyId?: string;
	email?: string;
	address?: string;
	phone?: string;
	status?: "active" | "inactive";
	isActive?: boolean;
}

interface VendorTransaction {
	id: string;
	date: string;
	description: string;
	category?: string;
	amount: number;
}

interface VendorListPayload {
	data?: VendorRecord[];
}

function normalizeVendorList(
	payload: VendorRecord[] | VendorListPayload | null | undefined,
): VendorRecord[] {
	if (Array.isArray(payload)) return payload;
	return Array.isArray(payload?.data) ? payload.data : [];
}

/**
 * Vendor API client (Type-safe)
 *
 * Leverages Eden Treaty + ok()/fail() pattern for full type inference.
 * Mirror pattern of customers.api.ts.
 */
export const vendorsApi = {
	/**
	 * Listar proveedores con filtros
	 */
	list: async (filters: VendorListFilters): Promise<VendorRecord[]> => {
		const body = await unwrap(
			vendorTreatyClient.get({
				query: filters,
			}),
		);
		const payload = extractOkDataOrPassthrough<
			VendorRecord[] | VendorListPayload
		>(body, "vendors.list");
		return normalizeVendorList(payload);
	},

	/**
	 * Crear nuevo proveedor con validación RUC (Backend side)
	 */
	create: async (payload: CreateVendorPayload) => {
		return unwrap(vendorTreatyClient.post(payload));
	},

	/**
	 * Obtener detalle de proveedor
	 */
	getById: async (id: string) => {
		return unwrap(vendorTreatyClient({ id }).get());
	},

	/**
	 * Actualizar datos del proveedor
	 */
	update: async (id: string, payload: UpdateVendorPayload) => {
		return unwrap(vendorTreatyClient({ id }).patch(payload));
	},

	/**
	 * Eliminar (Soft delete)
	 */
	delete: async (id: string) => {
		return unwrap(vendorTreatyClient({ id }).delete());
	},
};
