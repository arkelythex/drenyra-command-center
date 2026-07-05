/**
 * SUNAT credit note types.
 *
 * - ANULACION: Full invoice cancellation (amount = invoice total)
 * - DESCUENTO: Partial discount on the invoice
 * - DEVOLUCION: Product return
 * - OTROS: Other reasons
 */
export type CreditNoteType = "ANULACION" | "DESCUENTO" | "DEVOLUCION" | "OTROS";

/**
 * Credit note lifecycle status.
 *
 * - DRAFT: Initial state, editable
 * - SENT: Sent to SUNAT
 * - ACCEPTED: Accepted by SUNAT
 * - REJECTED: Rejected by SUNAT
 */
export type CreditNoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";

import type { Currency } from "../../types/currency";
import type { DocumentSeries } from "../../value-objects/DocumentSeries";
import type { Money } from "../../value-objects/Money";

/**
 * Properties for creating a CreditNote entity.
 */
export interface CreditNoteProps {
	id: string;
	referenceInvoiceId: string;
	referenceInvoiceTotal?: number;
	creditNoteType: CreditNoteType;
	reason: string;
	series: DocumentSeries;
	number: number;
	totalAmount: Money;
	baseAmount: Money;
	igvAmount: Money;
	currency: Currency;
	status: CreditNoteStatus;
	sunatResponseCode?: string;
	sentToSunatAt?: Date;
	issueDate: Date;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Primitive data representation for reconstructing CreditNote from DB/API.
 */
export interface CreditNotePrimitiveData {
	id: string;
	referenceInvoiceId: string;
	referenceInvoiceTotal?: number;
	creditNoteType: string;
	reason: string;
	series: string;
	number: number;
	totalAmount: number;
	baseAmount: number;
	igvAmount: number;
	currency: string;
	status: string;
	sunatResponseCode?: string;
	sentToSunatAt?: string | Date;
	issueDate: string | Date;
	createdAt?: string | Date;
	updatedAt?: string | Date;
}
