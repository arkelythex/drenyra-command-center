/**
 * Invoice Repository Interface - Domain Layer
 * Defines the contract for invoice persistence
 *
 * 2026 Best Practices:
 * - Interface Segregation: Repository per aggregate root
 * - Dependency Inversion: Domain defines contract, infrastructure implements
 * - No framework types in interface (pure TypeScript)
 */

import type { Invoice, InvoiceStatus } from "./invoice.entity";

/**
 * Filters for listing invoices with pagination.
 *
 * @example
 * ```ts
 * const filters: InvoiceListFilters = { companyId: 'cmp_123', limit: 20, offset: 0 };
 * ```
 */
export interface InvoiceListFilters {
	companyId: string;
	status?: InvoiceStatus;
	customerId?: string;
	startDate?: Date;
	endDate?: Date;
	minAmount?: number;
	maxAmount?: number;
	search?: string;
	limit?: number;
	offset?: number;
}

/**
 * Invoice list result with pagination metadata.
 *
 * @example
 * ```ts
 * const result = { invoices: [], total: 0, limit: 20, offset: 0 } as InvoiceListResult;
 * ```
 */
export interface InvoiceListResult {
	invoices: Invoice[];
	total: number;
	limit: number;
	offset: number;
}

/**
 * Repository contract for invoice persistence (domain-owned interface).
 *
 * @example
 * ```ts
 * async function load(repo: IInvoiceRepository, id: string) {
 *   return repo.findById(id);
 * }
 * ```
 */
export interface IInvoiceRepository {
	/**
	 * Persist a new invoice with its line items.
	 *
	 * @param invoice - Invoice aggregate to persist
	 * @returns Saved invoice with generated timestamps
	 * @throws Error if invoice with same number already exists
	 * @example
	 * ```ts
	 * const invoice = Invoice.create({ ... });
	 * const saved = await repository.create(invoice);
	 * ```
	 */
	create(invoice: Invoice): Promise<Invoice>;

	/**
	 * Retrieve an invoice by its unique identifier.
	 *
	 * @param id - Invoice ID (UUID format)
	 * @returns Invoice if found, null otherwise
	 * @example
	 * ```ts
	 * const invoice = await repository.findById('inv_123');
	 * if (invoice) console.log(invoice.invoiceNumber);
	 * ```
	 */
	findById(id: string): Promise<Invoice | null>;

	/**
	 * Retrieve an invoice by its SUNAT-formatted number.
	 *
	 * @param invoiceNumber - Invoice number (e.g., "F001-00000001")
	 * @param companyId - Company ID for multi-tenancy
	 * @returns Invoice if found, null otherwise
	 * @example
	 * ```ts
	 * const invoice = await repository.findByNumber('F001-00000001', 'cmp_123');
	 * ```
	 */
	findByNumber(
		invoiceNumber: string,
		companyId: string,
	): Promise<Invoice | null>;

	/**
	 * List invoices with optional filters and pagination.
	 *
	 * @param filters - Query filters (status, date range, customer, etc.)
	 * @returns Paginated invoice list with total count
	 * @example
	 * ```ts
	 * const result = await repository.list({
	 *   companyId: 'cmp_123',
	 *   status: 'SENT',
	 *   limit: 20,
	 *   offset: 0,
	 * });
	 * console.log(result.total); // Total count across all pages
	 * ```
	 */
	list(filters: InvoiceListFilters): Promise<InvoiceListResult>;

	/**
	 * Update an existing invoice.
	 *
	 * Only DRAFT invoices can be updated. For SENT invoices, use Credit Notes.
	 *
	 * @param invoice - Updated invoice entity
	 * @returns Updated invoice with new timestamp
	 * @throws Error if invoice is not in DRAFT status
	 * @example
	 * ```ts
	 * const updated = await repository.update(invoice);
	 * ```
	 */
	update(invoice: Invoice): Promise<Invoice>;

	/**
	 * Update invoice status only (lightweight operation).
	 *
	 * @param id - Invoice ID
	 * @param status - New status
	 * @example
	 * ```ts
	 * await repository.updateStatus('inv_123', 'CANCELLED');
	 * ```
	 */
	updateStatus(
		id: string,
		status: InvoiceStatus,
		legacyUserId?: string,
	): Promise<void>;

	/**
	 * Apply a payment to reduce the invoice balance.
	 *
	 * Automatically updates status to PAID when balance reaches zero.
	 *
	 * @param id - Invoice ID
	 * @param amount - Payment amount as decimal string (e.g., "150.00")
	 * @throws Error if invoice not found or amount exceeds balance
	 * @example
	 * ```ts
	 * await repository.applyPayment('inv_123', '150.00');
	 * ```
	 */
	applyPayment(id: string, amount: string): Promise<void>;

	/**
	 * Store SUNAT response artifacts (CDR and ticket).
	 *
	 * Called after successful submission to SUNAT.
	 *
	 * @param id - Invoice ID
	 * @param cdr - CDR URL or XML content
	 * @param ticket - SUNAT ticket number
	 * @example
	 * ```ts
	 * await repository.updateSunatResponse(
	 *   'inv_123',
	 *   'https://sunat.gob.pe/cdr/F001-00000001.xml',
	 *   'TKT-2026-000123'
	 * );
	 * ```
	 */
	updateSunatResponse(id: string, cdr: string, ticket: string): Promise<void>;

	/**
	 * Delete an invoice (DRAFT only).
	 *
	 * Performs hard delete in database. SENT invoices cannot be deleted (use Credit Notes).
	 *
	 * @param id - Invoice ID
	 * @throws Error if invoice is not DRAFT
	 * @example
	 * ```ts
	 * await repository.delete('inv_123');
	 * ```
	 */
	delete(id: string): Promise<void>;

	/**
	 * Check if an invoice number already exists for a company.
	 *
	 * Used to prevent duplicate invoice numbers (SUNAT requirement).
	 *
	 * @param invoiceNumber - Invoice number to check
	 * @param companyId - Company ID
	 * @returns True if invoice number exists
	 * @example
	 * ```ts
	 * if (await repository.exists('F001-00000001', 'cmp_123')) {
	 *   throw new Error('Invoice number already exists');
	 * }
	 * ```
	 */
	exists(invoiceNumber: string, companyId: string): Promise<boolean>;

	/**
	 * Get the next available correlative number for a series.
	 *
	 * Used when creating new invoices to ensure sequential numbering (SUNAT requirement).
	 *
	 * @param companyId - Company ID
	 * @param series - Invoice series (e.g., "F001", "B001")
	 * @returns Next correlative number (e.g., 1, 2, 3...)
	 * @example
	 * ```ts
	 * const next = await repository.getNextCorrelative('cmp_123', 'F001');
	 * console.log(next); // 42 (if last invoice was 41)
	 * ```
	 */
	getNextCorrelative(companyId: string, series: string): Promise<number>;
}
