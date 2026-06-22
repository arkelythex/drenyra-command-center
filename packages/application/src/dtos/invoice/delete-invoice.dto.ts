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
	reason?: string; // Optional reason for audit trail
}
