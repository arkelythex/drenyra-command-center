import type { Invoice } from "../entities/Invoice";

/**
 * Filtros disponibles para la búsqueda de facturas.
 *
 * @example
 * ```ts
 * const filters: InvoiceFilters = {
 *   status: "ACCEPTED",
 *   dateFrom: new Date("2026-01-01"),
 *   dateTo: new Date("2026-01-31"),
 *   limit: 50,
 *   offset: 0,
 * };
 * ```
 */
export interface InvoiceFilters {
	status?: "DRAFT" | "PENDING" | "SENT" | "ACCEPTED" | "REJECTED" | "CANCELLED";
	clientName?: string;
	clientRUC?: string;
	clientSearch?: string; // Search across name, RUC, or DNI
	series?: string;
	dateFrom?: Date;
	dateTo?: Date;
	startDate?: Date; // Alias for dateFrom
	endDate?: Date; // Alias for dateTo
	minAmount?: number;
	maxAmount?: number;
	limit?: number; // Pagination
	offset?: number; // Pagination
}

/**
 * Interfaz del Repositorio de Facturas.
 * Define los métodos necesarios para la persistencia y recuperación de facturas.
 *
 * @example
 * ```ts
 * const repo: InvoiceRepository = getInvoiceRepository();
 * const invoices = await repo.findAll({ status: "PENDING", limit: 20 });
 * ```
 */
export interface InvoiceRepository {
	/**
	 * Guarda una nueva factura en el repositorio.
	 * @param invoice - La entidad factura a guardar.
	 */
	save(invoice: Invoice): Promise<void>;

	/**
	 * Tenant-aware write path for repositories backed by multi-tenant storage.
	 *
	 * This is additive and optional so legacy implementations can coexist while
	 * newer adapters migrate to explicit tenant context.
	 */
	saveForOrganization?(invoice: Invoice, organizationId: number): Promise<void>;

	/**
	 * Actualiza una factura existente en el repositorio.
	 * @param invoice - La entidad factura con los datos actualizados.
	 */
	update(invoice: Invoice): Promise<void>;

	/**
	 * Tenant-aware update path for repositories backed by multi-tenant storage.
	 */
	updateForOrganization?(
		invoice: Invoice,
		organizationId: number,
	): Promise<void>;

	/**
	 * Elimina una factura por su ID.
	 * @param id - El ID de la factura a eliminar.
	 */
	delete(id: string): Promise<void>;

	/**
	 * Busca una factura por su ID.
	 * @param id - El ID de la factura.
	 * @returns La entidad factura si existe, o null si no.
	 */
	findById(id: string): Promise<Invoice | null>;

	/**
	 * Busca todas las facturas que coincidan con los filtros proporcionados.
	 * @param filters - Filtros de búsqueda opcionales.
	 * @returns Una lista de facturas que cumplen los criterios.
	 */
	findAll(filters?: InvoiceFilters): Promise<Invoice[]>;

	/**
	 * Cuenta el número total de facturas que coinciden con los filtros.
	 * @param filters - Filtros de conteo opcionales.
	 * @returns El número de facturas encontradas.
	 */
	count(filters?: InvoiceFilters): Promise<number>;
}
