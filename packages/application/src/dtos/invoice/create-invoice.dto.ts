/**
 * CreateInvoiceItemDTO interface.
 *
 * @example
 * ```ts
 * const value: CreateInvoiceItemDTO = {} as CreateInvoiceItemDTO;
 * console.log(value);
 * ```
 */
export interface CreateInvoiceItemDTO {
	description: string;
	quantity: number;
	unitPrice: number;
}

/**
 * CreateInvoiceDTO interface.
 *
 * @example
 * ```ts
 * const value: CreateInvoiceDTO = {} as CreateInvoiceDTO;
 * console.log(value);
 * ```
 */
export interface CreateInvoiceDTO {
	organizationId?: number;
	series: string;
	number: number;
	issueDate: Date;
	dueDate?: Date;
	clientName: string;
	clientRUC?: string;
	clientDNI?: string;
	clientAddress?: string;
	currency: "PEN" | "USD";
	items: CreateInvoiceItemDTO[];
}
