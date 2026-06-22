import type { Invoice, InvoiceItem, InvoiceStatus } from "@arkelythex/domain/entities/Invoice";

type ModularInvoiceStatus = "DRAFT" | "SENT" | "CANCELLED";
type ModularSunatStatus =
	| "DRAFT"
	| "SUBMITTED"
	| "ACCEPTED"
	| "REJECTED"
	| "ANNULLED";
type ModularTaxType = "GRAVADO" | "EXONERADO";
type ModularInvoiceReadStatus = "DRAFT" | "SENT" | "CANCELLED";
type ModularSunatReadStatus =
	| "DRAFT"
	| "SUBMITTED"
	| "ACCEPTED"
	| "REJECTED"
	| "ANNULLED"
	| null;

const formatDecimal = (value: number): string => value.toFixed(2);

/**
 * mapInvoiceStatusToModularStatus operation.
 *
 * @param status - Input for status.
 * @returns Result of mapInvoiceStatusToModularStatus.
 * @example
 * ```ts
 * const result = mapInvoiceStatusToModularStatus({} as InvoiceStatus);
 * console.log(result);
 * ```
 */
export const mapInvoiceStatusToModularStatus = (
	status: InvoiceStatus,
): ModularInvoiceStatus => {
	switch (status) {
		case "SENT":
		case "ACCEPTED":
		case "REJECTED":
			return "SENT";
		case "CANCELLED":
			return "CANCELLED";
		default:
			return "DRAFT";
	}
};

/**
 * mapInvoiceStatusToSunatStatus operation.
 *
 * @param status - Input for status.
 * @returns Result of mapInvoiceStatusToSunatStatus.
 * @example
 * ```ts
 * const result = mapInvoiceStatusToSunatStatus({} as InvoiceStatus);
 * console.log(result);
 * ```
 */
export const mapInvoiceStatusToSunatStatus = (
	status: InvoiceStatus,
): ModularSunatStatus => {
	switch (status) {
		case "SENT":
			return "SUBMITTED";
		case "ACCEPTED":
			return "ACCEPTED";
		case "REJECTED":
			return "REJECTED";
		case "CANCELLED":
			return "ANNULLED";
		default:
			return "DRAFT";
	}
};

/**
 * mapModularStatusToInvoiceStatus operation.
 *
 * @param status - Input for status.
 * @param sunatStatus - Input for sunatStatus.
 * @returns Result of mapModularStatusToInvoiceStatus.
 * @example
 * ```ts
 * const result = mapModularStatusToInvoiceStatus({} as ModularInvoiceReadStatus, {} as ModularSunatReadStatus);
 * console.log(result);
 * ```
 */
export const mapModularStatusToInvoiceStatus = (
	status: ModularInvoiceReadStatus,
	sunatStatus: ModularSunatReadStatus,
): InvoiceStatus => {
	if (status === "CANCELLED" || sunatStatus === "ANNULLED") {
		return "CANCELLED";
	}

	if (sunatStatus === "ACCEPTED") {
		return "ACCEPTED";
	}

	if (sunatStatus === "REJECTED") {
		return "REJECTED";
	}

	if (status === "SENT" || sunatStatus === "SUBMITTED") {
		return "SENT";
	}

	return "DRAFT";
};

/**
 * resolveInvoicePartnerIdentity operation.
 *
 * @param invoice - Input for invoice.
 * @param normalizedInvoiceId - Input for normalizedInvoiceId.
 * @returns Result of resolveInvoicePartnerIdentity.
 * @example
 * ```ts
 * const result = resolveInvoicePartnerIdentity({} as Invoice, "");
 * console.log(result);
 * ```
 */
export const resolveInvoicePartnerIdentity = (
	invoice: Invoice,
	normalizedInvoiceId: string,
): {
	taxId: string;
	partnerDocumentType: string;
} => {
	const clientRuc = invoice.clientRUC?.toString();
	if (clientRuc) {
		return {
			taxId: clientRuc,
			partnerDocumentType: "RUC",
		};
	}

	const clientDni = invoice.clientDNI?.toString();
	if (clientDni) {
		return {
			taxId: clientDni,
			partnerDocumentType: "DNI",
		};
	}

	return {
		taxId: `ANON-${normalizedInvoiceId.slice(0, 15)}`,
		partnerDocumentType: "ANON",
	};
};

/**
 * mapInvoiceItemToModularInsert operation.
 *
 * @param invoiceId - Input for invoiceId.
 * @param item - Input for item.
 * @returns Result of mapInvoiceItemToModularInsert.
 * @example
 * ```ts
 * const result = mapInvoiceItemToModularInsert("", {} as InvoiceItem);
 * console.log(result);
 * ```
 */
export const mapInvoiceItemToModularInsert = (
	invoiceId: string,
	item: InvoiceItem,
) => {
	const itemSubtotal = item.subtotal.getAmount();
	const itemIgv = item.igv.getAmount();
	const taxType: ModularTaxType = item.igv.isZero() ? "EXONERADO" : "GRAVADO";
	const igvRate =
		itemSubtotal > 0 ? formatDecimal((itemIgv / itemSubtotal) * 100) : "0.00";

	return {
		id: item.id,
		invoiceId,
		description: item.description,
		quantity: formatDecimal(item.quantity),
		unitPrice: formatDecimal(item.unitPrice.getAmount()),
		taxType,
		igvRate,
		subtotal: formatDecimal(item.subtotal.getAmount()),
		igvAmount: formatDecimal(item.igv.getAmount()),
		totalAmount: formatDecimal(item.total.getAmount()),
		createdAt: new Date(),
	};
};

/**
 * formatInvoiceAmount operation.
 *
 * @param amount - Input for amount.
 * @returns Result of formatInvoiceAmount.
 * @example
 * ```ts
 * const result = formatInvoiceAmount(0);
 * console.log(result);
 * ```
 */
export const formatInvoiceAmount = (amount: number): string => formatDecimal(amount);
