/**
 * UpdateInvoiceDTO interface.
 *
 * @example
 * ```ts
 * const value: UpdateInvoiceDTO = {} as UpdateInvoiceDTO;
 * console.log(value);
 * ```
 */
export interface UpdateInvoiceDTO {
	id: string;
	organizationId?: number;
	companyId?: string;
	series?: string;
	number?: number;
	dueDate?: Date;
	clientName?: string;
	clientRUC?: string;
	clientDNI?: string;
	clientAddress?: string;
	items?: UpdateInvoiceItemDTO[];
	status?: "DRAFT" | "PENDING" | "SENT" | "ACCEPTED" | "REJECTED";
}

/**
 * UpdateInvoiceItemDTO interface.
 *
 * @example
 * ```ts
 * const value: UpdateInvoiceItemDTO = {} as UpdateInvoiceItemDTO;
 * console.log(value);
 * ```
 */
export interface UpdateInvoiceItemDTO {
	id?: string;
	description: string;
	quantity: number;
	unitPrice: number;
}
