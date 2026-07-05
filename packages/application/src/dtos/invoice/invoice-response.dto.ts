import type { Invoice, InvoiceStatus } from "@drenyra/domain/entities/Invoice";
import type { Currency } from "@drenyra/domain/types/currency";

/**
 * InvoiceResponseDTO interface.
 *
 * @example
 * ```ts
 * const value: InvoiceResponseDTO = {} as InvoiceResponseDTO;
 * console.log(value);
 * ```
 */
export interface InvoiceResponseDTO {
	id: string;
	series: string;
	number: number;
	issueDate: Date;
	dueDate?: Date;
	clientName: string;
	clientRUC?: string;
	clientDNI?: string;
	clientAddress?: string;
	baseAmount: number;
	igvAmount: number;
	totalAmount: number;
	currency: Currency;
	status: InvoiceStatus;
	items: InvoiceItemResponseDTO[];
	createdAt: Date;
	updatedAt: Date;
}

/**
 * InvoiceItemResponseDTO interface.
 *
 * @example
 * ```ts
 * const value: InvoiceItemResponseDTO = {} as InvoiceItemResponseDTO;
 * console.log(value);
 * ```
 */
export interface InvoiceItemResponseDTO {
	id: string;
	description: string;
	quantity: number;
	unitPrice: number;
	subtotal: number;
	igv: number;
	total: number;
}

/**
 * Maps a domain Invoice entity to a response DTO
 * @param invoice - Input for invoice.
 * @returns Result of toInvoiceResponseDTO.
 * @example
 * ```ts
 * const result = toInvoiceResponseDTO({} as Invoice);
 * console.log(result);
 * ```
 */

export function toInvoiceResponseDTO(invoice: Invoice): InvoiceResponseDTO {
	return {
		id: invoice.id,
		series: invoice.series.toString(),
		number: invoice.number,
		issueDate: invoice.issueDate,
		dueDate: invoice.dueDate,
		clientName: invoice.clientName,
		clientRUC: invoice.clientRUC?.toString(),
		clientDNI: invoice.clientDNI?.toString(),
		clientAddress: invoice.clientAddress,
		baseAmount: invoice.baseAmount.getAmount(),
		igvAmount: invoice.igvAmount.getAmount(),
		totalAmount: invoice.totalAmount.getAmount(),
		currency: invoice.baseAmount.getCurrency(),
		status: invoice.status,
		items: invoice.items.map((item) => ({
			id: item.id,
			description: item.description,
			quantity: item.quantity,
			unitPrice: item.unitPrice.getAmount(),
			subtotal: item.subtotal.getAmount(),
			igv: item.igv.getAmount(),
			total: item.total.getAmount(),
		})),
		createdAt: invoice.createdAt,
		updatedAt: invoice.updatedAt,
	};
}
