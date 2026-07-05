/**
 * Bill Entity - Domain Layer
 * Pure business logic without external dependencies
 *
 * 2026 Best Practices:
 * - Rich domain models (not just data bags)
 * - Immutable value objects
 * - Business rules enforced in domain
 * - No framework dependencies
 */

import { Money } from "@drenyra/domain";

/**
 * Bill status lifecycle.
 *
 * @example
 * ```ts
 * const status: BillStatus = 'DRAFT';
 * ```
 */
export type BillStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";

/**
 * Supported bill currencies (ISO 4217 subset).
 *
 * @example
 * ```ts
 * const currency: Currency = 'PEN';
 * ```
 */
export type Currency = import("@drenyra/domain").Currency;

/**
 * Bill line item.
 *
 * @example
 * ```ts
 * const item = { id: 'item_1', description: 'Servicio', quantity: 1 } as BillItem;
 * ```
 */
export interface BillItem {
	readonly id: string;
	readonly productId?: string;
	readonly description: string;
	readonly quantity: number;
	readonly unitPrice: Money;
	readonly total: Money;
}

/**
 * Bill aggregate root.
 *
 * @example
 * ```ts
 * const bill = Bill.create({
 *   id: 'bill_123',
 *   companyId: 'cmp_123',
 *   vendorId: 'ven_123',
 *   billNumber: 'B001-0001',
 *   issueDate: new Date(),
 *   dueDate: new Date(),
 *   currency: 'PEN',
 *   exchangeRate: 1,
 *   items: [],
 * });
 * ```
 */
export class Bill {
	constructor(
		public readonly id: string,
		public readonly companyId: string,
		public readonly vendorId: string,
		public readonly billNumber: string,
		public readonly issueDate: Date,
		public readonly dueDate: Date,
		public readonly currency: Currency,
		public readonly exchangeRate: number,
		public readonly items: BillItem[],
		public readonly subtotal: Money,
		public readonly igvAmount: Money,
		public readonly totalAmount: Money,
		public readonly balanceDue: Money,
		public readonly status: BillStatus,
		public readonly notes?: string,
		public readonly tags?: string[],
		public readonly createdAt: Date = new Date(),
		public readonly updatedAt: Date = new Date(),
	) {}

	/**
	 * Business Rule: Can only edit draft bills
	 */
	canEdit(): boolean {
		return this.status === "DRAFT";
	}

	/**
	 * Business Rule: Check if bill is overdue
	 */
	isOverdue(): boolean {
		if (this.status === "OVERDUE") return true;
		if (this.status !== "SENT") return false;
		return new Date() > this.dueDate;
	}

	/**
	 * Business Rule: Calculate remaining balance
	 */
	getRemainingBalance(): Money {
		return this.balanceDue;
	}

	/**
	 * Business Rule: Check if fully paid
	 */
	isFullyPaid(): boolean {
		return this.balanceDue.isZero();
	}

	/**
	 * Business Rule: Apply payment
	 */
	applyPayment(amount: Money): Bill {
		if (this.status === "CANCELLED") {
			throw new Error("Cannot apply payment to CANCELLED bill");
		}

		if (this.status === "PAID") {
			throw new Error("Bill is already PAID");
		}

		if (amount.isNegative()) {
			throw new Error("Payment amount must be non-negative");
		}

		if (amount.greaterThan(this.balanceDue)) {
			throw new Error(
				`Payment amount ${amount.toString()} exceeds remaining balance ${this.balanceDue.toString()}`,
			);
		}

		const newBalance = this.balanceDue.subtract(amount);
		const newStatus: BillStatus = newBalance.isZero() ? "PAID" : this.status;

		return new Bill(
			this.id,
			this.companyId,
			this.vendorId,
			this.billNumber,
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
			this.tags,
			this.createdAt,
			new Date(), // updatedAt
		);
	}

	/**
	 * Business Rule: Mark bill as SENT (posted).
	 */
	markAsSent(): Bill {
		if (this.status !== "DRAFT") return this;

		return new Bill(
			this.id,
			this.companyId,
			this.vendorId,
			this.billNumber,
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
			this.tags,
			this.createdAt,
			new Date(),
		);
	}

	/**
	 * Business Rule: Mark bill as PAID (fully paid).
	 */
	markAsPaid(): Bill {
		if (this.status === "CANCELLED") {
			throw new Error("Cannot mark CANCELLED bill as PAID");
		}

		const zero = Money.zero(this.currency);

		return new Bill(
			this.id,
			this.companyId,
			this.vendorId,
			this.billNumber,
			this.issueDate,
			this.dueDate,
			this.currency,
			this.exchangeRate,
			this.items,
			this.subtotal,
			this.igvAmount,
			this.totalAmount,
			zero,
			"PAID",
			this.notes,
			this.tags,
			this.createdAt,
			new Date(),
		);
	}

	/**
	 * Business Rule: Mark as cancelled
	 */
	markAsCancelled(): Bill {
		return new Bill(
			this.id,
			this.companyId,
			this.vendorId,
			this.billNumber,
			this.issueDate,
			this.dueDate,
			this.currency,
			this.exchangeRate,
			this.items,
			this.subtotal,
			this.igvAmount,
			this.totalAmount,
			this.balanceDue,
			"CANCELLED",
			this.notes,
			this.tags,
			this.createdAt,
			new Date(),
		);
	}

	/**
	 * Factory: Create new bill with validation
	 */
	static create(props: {
		id: string;
		companyId: string;
		vendorId: string;
		billNumber: string;
		issueDate: Date;
		dueDate: Date;
		currency: Currency;
		exchangeRate: number;
		items: BillItem[];
		notes?: string;
		tags?: string[];
	}): Bill {
		if (props.items.length === 0) {
			throw new Error("Bill must have at least one item");
		}

		if (props.dueDate < props.issueDate) {
			throw new Error("Due date must be after issue date");
		}

		// Calculate subtotal (sum of all item totals)
		const subtotal = props.items.reduce(
			(sum, item) => sum.add(item.total),
			Money.zero(props.currency),
		);

		// Calculate IGV (18% of subtotal)
		const igvAmount = subtotal.multiply(0.18);

		// Total = subtotal + IGV
		const totalAmount = subtotal.add(igvAmount);

		return new Bill(
			props.id,
			props.companyId,
			props.vendorId,
			props.billNumber,
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
			props.tags,
		);
	}
}
