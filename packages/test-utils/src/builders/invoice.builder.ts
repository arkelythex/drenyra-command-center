/**
 * Builder pattern for Invoice test data.
 *
 * Creates valid Invoice domain entities with sensible defaults
 * for Peruvian SUNAT compliance testing.
 *
 * @example
 * ```ts
 * const invoice = new InvoiceBuilder()
 *   .withClientRUC('20123456789')
 *   .withStatus('PENDING')
 *   .build();
 * ```
 */
import { Invoice, type InvoiceProps } from "@arkelythex/domain/entities/Invoice";
import { Money, type Currency } from "@arkelythex/domain/value-objects/Money";
import { RUC } from "@arkelythex/domain/value-objects/RUC";
import { DNI } from "@arkelythex/domain/value-objects/DNI";
import { DocumentSeries } from "@arkelythex/domain/value-objects/DocumentSeries";
import { BaseBuilder } from "./base.builder";

const DEFAULT_INVOICE_ID = "inv_test_001";
const DEFAULT_CLIENT_NAME = "Cliente Test SAC";
const DEFAULT_RUC = "20546296564";
const DEFAULT_SERIES = "F001";
const DEFAULT_NUMBER = 1;
const DEFAULT_CURRENCY: Currency = "PEN";

export class InvoiceBuilder extends BaseBuilder<InvoiceProps, Invoice> {
	private itemCount = 0;

	constructor() {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);

		const baseAmount = Money.fromAmount(1000, DEFAULT_CURRENCY);
		const igvAmount = baseAmount.multiply(0.18);
		const totalAmount = baseAmount.add(igvAmount);

		super({
			id: DEFAULT_INVOICE_ID,
			series: DocumentSeries.create(DEFAULT_SERIES),
			number: DEFAULT_NUMBER,
			issueDate: yesterday,
			clientName: DEFAULT_CLIENT_NAME,
			clientRUC: RUC.create(DEFAULT_RUC),
			baseAmount,
			igvAmount,
			totalAmount,
			status: "DRAFT",
			items: [],
			createdAt: yesterday,
			updatedAt: yesterday,
		});
	}

	/**
	 * Set a custom invoice ID.
	 */
	withId(id: string): this {
		return this.set({ id });
	}

	/**
	 * Set the client RUC. For facturas (series F), this is mandatory.
	 */
	withClientRUC(ruc: string): this {
		return this.set({ clientRUC: RUC.create(ruc) });
	}

	/**
	 * Set the client DNI.
	 */
	withClientDNI(dni: string): this {
		return this.set({ clientDNI: DNI.create(dni) });
	}

	/**
	 * Set the client name.
	 */
	withClientName(name: string): this {
		return this.set({ clientName: name });
	}

	/**
	 * Set the document series (e.g., "F001" for facturas, "B001" for boletas).
	 */
	withSeries(series: string): this {
		return this.set({ series: DocumentSeries.create(series) });
	}

	/**
	 * Set the invoice number.
	 */
	withNumber(number: number): this {
		return this.set({ number });
	}

	/**
	 * Set the issue date.
	 */
	withIssueDate(date: Date): this {
		return this.set({ issueDate: date });
	}

	/**
	 * Set the due date.
	 */
	withDueDate(date: Date): this {
		return this.set({ dueDate: date });
	}

	/**
	 * Set the invoice status.
	 */
	withStatus(status: InvoiceProps["status"]): this {
		return this.set({ status });
	}

	/**
	 * Set the base amount (subtotal before IGV).
	 * Automatically recalculates IGV and total.
	 */
	withBaseAmount(amount: number, currency: Currency = DEFAULT_CURRENCY): this {
		const baseAmount = Money.fromAmount(amount, currency);
		const igvAmount = baseAmount.multiply(0.18);
		const totalAmount = baseAmount.add(igvAmount);
		return this.set({ baseAmount, igvAmount, totalAmount });
	}

	/**
	 * Set the currency.
	 */
	withCurrency(currency: Currency): this {
		return this.withBaseAmount(
			this.data.baseAmount?.getAmount() ?? 1000,
			currency,
		);
	}

	/**
	 * Add a single line item to the invoice.
	 */
	withItem(item: {
		description: string;
		quantity: number;
		unitPrice: number;
		currency?: "PEN" | "USD";
	}): this {
		const currency = item.currency ?? DEFAULT_CURRENCY;
		const unitPrice = Money.fromAmount(item.unitPrice, currency);
		const subtotal = unitPrice.multiply(item.quantity);
		const igv = subtotal.multiply(0.18);
		const total = subtotal.add(igv);

		this.itemCount++;
		const newItem = {
			id: `item_test_${this.itemCount}`,
			description: item.description,
			quantity: item.quantity,
			unitPrice,
			subtotal,
			igv,
			total,
		};

		const currentItems = this.data.items ?? [];
		return this.set({ items: [...currentItems, newItem] });
	}

	/**
	 * Set items directly (replaces all existing items).
	 */
	withItems(
		items: Array<{
			id: string;
			description: string;
			quantity: number;
			unitPrice: Money;
			subtotal: Money;
			igv: Money;
			total: Money;
		}>,
	): this {
		return this.set({ items });
	}

	/**
	 * Set notes on the invoice.
	 */
	withNotes(notes: string): this {
		return this.set({ notes });
	}

	/**
	 * Set SUNAT response code.
	 */
	withSunatResponseCode(code: string): this {
		return this.set({ sunatResponseCode: code });
	}

	/**
	 * Set sent to SUNAT timestamp.
	 */
	withSentToSunatAt(date: Date): this {
		return this.set({ sentToSunatAt: date });
	}

	/**
	 * Build the Invoice domain entity.
	 * Ensures at least one item exists if none were added.
	 */
	build(): Invoice {
		const items = this.data.items ?? [];
		if (items.length === 0) {
			this.withItem({
				description: "Servicio de prueba",
				quantity: 1,
				unitPrice: 1000,
			});
		}

		const now = new Date();
		const props = {
			...this.data,
			createdAt: this.data.createdAt ?? now,
			updatedAt: this.data.updatedAt ?? now,
		} as InvoiceProps;

		return Invoice.create(props);
	}
}
