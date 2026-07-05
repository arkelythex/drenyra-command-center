/**
 * Invoice Entity - Domain Layer
 *
 * Rich domain model representing a SUNAT-compliant invoice (Factura/Boleta).
 * Enforces business rules and maintains invoice lifecycle integrity.
 *
 * 2026 Best Practices:
 * - Rich domain models (not just data bags)
 * - Immutable value objects
 * - Business rules enforced in domain
 * - No framework dependencies
 *
 * @layer Domain
 * @pattern Aggregate Root (DDD)
 */

import { Money } from "@drenyra/domain";

/**
 * Invoice status lifecycle.
 *
 * @example
 * ```ts
 * const status: InvoiceStatus = 'DRAFT';
 * ```
 */
export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";

/**
 * Supported invoice currencies (ISO 4217 subset).
 *
 * @example
 * ```ts
 * const currency: Currency = 'PEN';
 * ```
 */
export type Currency = import("@drenyra/domain").Currency;

/**
 * Invoice line item representing a product or service.
 *
 * Supports SUNAT tax classifications (GRAVADO, EXONERADO, INAFECTO).
 * All monetary amounts are stored as immutable Money value objects.
 *
 * @example
 * ```ts
 * const item: InvoiceItem = {
 *   id: 'item_1',
 *   description: 'Servicio de consultoría',
 *   quantity: 2,
 *   unitPrice: new Money('100.00', 'PEN'),
 *   taxType: 'GRAVADO',
 *   igvRate: 18.0,
 *   subtotal: new Money('169.49', 'PEN'),
 *   igvAmount: new Money('30.51', 'PEN'),
 *   totalAmount: new Money('200.00', 'PEN'),
 * };
 * ```
 */
export interface InvoiceItem {
	/** Unique item identifier */
	readonly id: string;
	/** Optional product reference from catalog */
	readonly productId?: string;
	/** Item description (min 3 characters, SUNAT requirement) */
	readonly description: string;
	/** Quantity sold (must be positive) */
	readonly quantity: number;
	/** Unit price before taxes */
	readonly unitPrice: Money;
	/** SUNAT tax classification */
	readonly taxType: "GRAVADO" | "EXONERADO" | "INAFECTO";
	/** IGV percentage (18.00 for GRAVADO, 0 otherwise) */
	readonly igvRate: number;
	/** Subtotal without IGV */
	readonly subtotal: Money;
	/** Calculated IGV amount */
	readonly igvAmount: Money;
	/** Final total (subtotal + igvAmount) */
	readonly totalAmount: Money;
}

/**
 * Invoice aggregate root.
 *
 * Represents a SUNAT-compliant invoice with full lifecycle management.
 * Enforces business rules such as draft-only edits, payment tracking, and SUNAT submission status.
 *
 * @example
 * ```ts
 * const invoice = Invoice.create({
 *   id: 'inv_123',
 *   companyId: 'cmp_123',
 *   customerId: 'cus_123',
 *   series: 'F001',
 *   correlative: 1,
 *   invoiceNumber: 'F001-00000001',
 *   issueDate: new Date('2026-01-15'),
 *   dueDate: new Date('2026-02-15'),
 *   currency: 'PEN',
 *   exchangeRate: 1,
 *   items: [{
 *     id: 'item_1',
 *     description: 'Servicio',
 *     quantity: 1,
 *     unitPrice: new Money('100.00', 'PEN'),
 *     taxType: 'GRAVADO',
 *     igvRate: 18.0,
 *     subtotal: new Money('84.75', 'PEN'),
 *     igvAmount: new Money('15.25', 'PEN'),
 *     totalAmount: new Money('100.00', 'PEN'),
 *   }],
 * });
 * console.log(invoice.invoiceNumber); // "F001-00000001"
 * ```
 */
export class Invoice {
	constructor(
		public readonly id: string,
		public readonly companyId: string,
		public readonly customerId: string,
		public readonly series: string,
		public readonly correlative: number,
		public readonly invoiceNumber: string,
		public readonly issueDate: Date,
		public readonly dueDate: Date,
		public readonly currency: Currency,
		public readonly exchangeRate: number,
		public readonly items: InvoiceItem[],
		public readonly subtotal: Money,
		public readonly igvAmount: Money,
		public readonly totalAmount: Money,
		public readonly balanceDue: Money,
		public readonly status: InvoiceStatus,
		public readonly notes?: string,
		public readonly createdAt: Date = new Date(),
		public readonly updatedAt: Date = new Date(),
		public readonly sunatCdr?: string, // SUNAT CDR response
		public readonly sunatTicket?: string, // SUNAT ticket number
		public readonly sunatStatus?: string, // ACCEPTED, REJECTED, SUBMITTED, etc.
	) {}

	/**
	 * Check if the invoice can be edited.
	 *
	 * Business Rule: Only DRAFT invoices can be modified.
	 * Once sent to SUNAT, invoices become immutable (requires Credit Note for changes).
	 *
	 * @returns True if invoice is in DRAFT status
	 * @example
	 * ```ts
	 * if (invoice.canEdit()) {
	 *   // Allow modifications
	 * }
	 * ```
	 */
	canEdit(): boolean {
		return this.status === "DRAFT";
	}

	/**
	 * Check if the invoice payment is overdue.
	 *
	 * Business Rule: An invoice is overdue if it's SENT (accepted by SUNAT) but unpaid past due date.
	 *
	 * @returns True if invoice is SENT and current date exceeds dueDate
	 * @example
	 * ```ts
	 * if (invoice.isOverdue()) {
	 *   // Send payment reminder
	 * }
	 * ```
	 */
	isOverdue(): boolean {
		return this.status === "SENT" && new Date() > this.dueDate;
	}

	/**
	 * Get the remaining unpaid balance.
	 *
	 * @returns The outstanding balance as Money value object
	 * @example
	 * ```ts
	 * const balance = invoice.getRemainingBalance();
	 * console.log(balance.toString()); // "150.00"
	 * ```
	 */
	getRemainingBalance(): Money {
		return this.balanceDue;
	}

	/**
	 * Check if the invoice has been fully paid.
	 *
	 * @returns True if balanceDue is zero
	 * @example
	 * ```ts
	 * if (invoice.isFullyPaid()) {
	 *   invoice.updateStatus('PAID');
	 * }
	 * ```
	 */
	isFullyPaid(): boolean {
		return this.balanceDue.toString() === "0.00";
	}

	/**
	 * Apply a payment to the invoice.
	 *
	 * Business Rule: Reduces balanceDue by payment amount.
	 * Automatically marks invoice as PAID when fully paid.
	 * Returns a new immutable instance (no mutation).
	 *
	 * @param amount - Payment amount (must use same currency as invoice)
	 * @returns New Invoice instance with updated balance
	 * @throws Error if amount exceeds balanceDue
	 * @example
	 * ```ts
	 * const payment = new Money('50.00', 'PEN');
	 * const updatedInvoice = invoice.applyPayment(payment);
	 * console.log(updatedInvoice.balanceDue.toString()); // "100.00" (was 150.00)
	 * ```
	 */
	applyPayment(amount: Money): Invoice {
		const newBalance = this.balanceDue.subtract(amount);
		const newStatus = newBalance.toString() === "0.00" ? "PAID" : this.status;

		return new Invoice(
			this.id,
			this.companyId,
			this.customerId,
			this.series,
			this.correlative,
			this.invoiceNumber,
			this.issueDate,
			this.dueDate,
			this.currency,
			this.exchangeRate,
			this.items,
			this.subtotal,
			this.igvAmount,
			this.totalAmount,
			newBalance,
			newStatus,
			this.notes,
			this.createdAt,
			new Date(), // updatedAt
			this.sunatCdr,
			this.sunatTicket,
			this.sunatStatus,
		);
	}

	/**
	 * Mark the invoice as sent to SUNAT.
	 *
	 * Business Rule: Updates status to SENT and stores SUNAT response artifacts.
	 * Once sent, the invoice becomes immutable (edits require Credit Note).
	 *
	 * @param cdr - SUNAT CDR (Constancia de Recepción) URL or XML
	 * @param ticket - SUNAT ticket number for tracking
	 * @returns New Invoice instance with SENT status
	 * @example
	 * ```ts
	 * const sentInvoice = invoice.markAsSent(
	 *   'https://sunat.gob.pe/cdr/F001-00000001.xml',
	 *   'TKT-2026-000123'
	 * );
	 * console.log(sentInvoice.status); // "SENT"
	 * ```
	 */
	markAsSent(cdr: string, ticket: string): Invoice {
		return new Invoice(
			this.id,
			this.companyId,
			this.customerId,
			this.series,
			this.correlative,
			this.invoiceNumber,
			this.issueDate,
			this.dueDate,
			this.currency,
			this.exchangeRate,
			this.items,
			this.subtotal,
			this.igvAmount,
			this.totalAmount,
			this.balanceDue,
			"SENT",
			this.notes,
			this.createdAt,
			new Date(),
			cdr,
			ticket,
			"ACCEPTED",
		);
	}

	/**
	 * Factory method to create a new invoice with automatic total calculation.
	 *
	 * Validates input and calculates subtotal, IGV, and total amounts from line items.
	 * Always creates invoices in DRAFT status with balanceDue equal to totalAmount.
	 *
	 * @param props - Invoice creation properties
	 * @returns New Invoice instance in DRAFT status
	 * @throws Error if items array is empty or validation fails
	 * @example
	 * ```ts
	 * const invoice = Invoice.create({
	 *   id: 'inv_123',
	 *   companyId: 'cmp_123',
	 *   customerId: 'cus_456',
	 *   series: 'F001',
	 *   correlative: 1,
	 *   invoiceNumber: 'F001-00000001',
	 *   issueDate: new Date('2026-01-15'),
	 *   dueDate: new Date('2026-02-15'),
	 *   currency: 'PEN',
	 *   exchangeRate: 1,
	 *   items: [
	 *     {
	 *       id: 'item_1',
	 *       description: 'Servicio de consultoría',
	 *       quantity: 1,
	 *       unitPrice: new Money('100.00', 'PEN'),
	 *       taxType: 'GRAVADO',
	 *       igvRate: 18.0,
	 *       subtotal: new Money('84.75', 'PEN'),
	 *       igvAmount: new Money('15.25', 'PEN'),
	 *       totalAmount: new Money('100.00', 'PEN'),
	 *     }
	 *   ],
	 *   notes: 'Pago a 30 días',
	 * });
	 * ```
	 */
	static create(props: {
		id: string;
		companyId: string;
		customerId: string;
		series: string;
		correlative: number;
		invoiceNumber: string;
		issueDate: Date;
		dueDate: Date;
		currency: Currency;
		exchangeRate: number;
		items: InvoiceItem[];
		notes?: string;
	}): Invoice {
		// Calculate totals
		const subtotal = props.items.reduce(
			(sum, item) => sum.add(item.subtotal),
			Money.zero(props.currency),
		);

		const igvAmount = props.items.reduce(
			(sum, item) => sum.add(item.igvAmount),
			Money.zero(props.currency),
		);

		const totalAmount = props.items.reduce(
			(sum, item) => sum.add(item.totalAmount),
			Money.zero(props.currency),
		);

		return new Invoice(
			props.id,
			props.companyId,
			props.customerId,
			props.series,
			props.correlative,
			props.invoiceNumber,
			props.issueDate,
			props.dueDate,
			props.currency,
			props.exchangeRate,
			props.items,
			subtotal,
			igvAmount,
			totalAmount,
			totalAmount, // balanceDue = total initially
			"DRAFT",
			props.notes,
		);
	}
}
