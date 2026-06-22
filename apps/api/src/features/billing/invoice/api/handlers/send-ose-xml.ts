import {
	InvoiceItem,
	InvoiceNumber,
	MonetaryAmount,
	RUC,
	ublInvoiceGenerator,
} from "../../../../../services/sunat";

type CurrencyCode = "PEN" | "USD";

type SendOseInvoiceItem = {
	description: string;
	quantity: number;
	unitPrice: { toString(): string };
};

type SendOseInvoiceSnapshot = {
	customerId: string;
	series: string;
	correlative: number;
	issueDate: Date;
	dueDate: Date;
	currency: string;
	items: SendOseInvoiceItem[];
	notes?: string;
};

/**
 * buildSendOseInvoiceXml operation.
 *
 * @param invoice - Input for invoice.
 * @returns Result of buildSendOseInvoiceXml.
 * @example
 * ```ts
 * const result = buildSendOseInvoiceXml({} as SendOseInvoiceSnapshot);
 * console.log(result);
 * ```
 */
export function buildSendOseInvoiceXml(
	invoice: SendOseInvoiceSnapshot,
): string {
	const currency = resolveCurrency(invoice.currency);

	return ublInvoiceGenerator.generate({
		issuer: {
			ruc: RUC.create(process.env.COMPANY_RUC || "12345678901"),
			name: process.env.COMPANY_NAME || "Empresa Emisora S.A.C.",
			address: process.env.COMPANY_ADDRESS || "Av. Principal 123",
			district: process.env.COMPANY_DISTRICT || "Miraflores",
			province: process.env.COMPANY_PROVINCE || "Lima",
			department: process.env.COMPANY_DEPARTMENT || "Lima",
		},
		customer: {
			documentType: "RUC",
			documentNumber: invoice.customerId,
			name: invoice.customerId,
		},
		invoiceNumber: InvoiceNumber.create(invoice.series, invoice.correlative),
		issueDate: invoice.issueDate,
		dueDate: invoice.dueDate,
		currency,
		items: invoice.items.map(
			(item, idx) =>
				new InvoiceItem(
					idx + 1,
					item.description,
					item.quantity,
					MonetaryAmount.create(
						parseFloat(item.unitPrice.toString()),
						currency,
					),
				),
		),
		notes: invoice.notes,
	});
}

function resolveCurrency(currency: string): CurrencyCode {
	if (currency === "PEN" || currency === "USD") {
		return currency;
	}

	throw new Error(
		`Electronic invoicing only supports PEN or USD. Received ${currency}.`,
	);
}
