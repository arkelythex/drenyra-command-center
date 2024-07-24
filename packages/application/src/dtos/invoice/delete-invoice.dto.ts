/**
 * DeleteInvoiceDTO interface.
 *
 * @example
 * ```ts
 * const value: DeleteInvoiceDTO = {} as DeleteInvoiceDTO;
 * console.log(value);
 * ```
 */
export interface DeleteInvoiceDTO {
	id: string;
	organizationId?: string;
	companyId?: string;
	reason?: string; // Optional reason for audit trail
}
