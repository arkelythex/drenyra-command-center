/**
 * Customer - Domain Entity
 *
 * Represents a customer (client) in the system.
 * Wraps businessPartners table with customer-specific behavior.
 *
 * @module customer/domain
 */

import { RUC } from "@arkelythex/domain";
import type { CustomerSegment } from "./customer.repository.interface";

/**
 * CustomerData interface.
 *
 * @example
 * ```ts
 * const value: CustomerData = {} as CustomerData;
 * console.log(value);
 * ```
 */
export interface CustomerData {
	id: string;
	companyId: string;
	taxId: string; // RUC
	legalName: string;
	email?: string;
	address?: string;
	phone?: string;
	creditLimit: number;
	creditDays: number;
	customerSegment: CustomerSegment;
	paymentBehaviorScore: number;
	lastPurchaseDate?: Date;
	totalPurchases: number;
	complianceScore: number;
	sunatCondition: string;
	logoUrl?: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Customer Entity
 *
 * Rich domain model with business logic.
 * @example
 * ```ts
 * const value = new Customer();
 * console.log(value);
 * ```
 */

export class Customer {
	constructor(private data: CustomerData) {}

	// Getters
	get id(): string {
		return this.data.id;
	}

	get companyId(): string {
		return this.data.companyId;
	}

	get taxId(): string {
		return this.data.taxId;
	}

	get legalName(): string {
		return this.data.legalName;
	}

	get email(): string | undefined {
		return this.data.email;
	}

	get address(): string | undefined {
		return this.data.address;
	}

	get phone(): string | undefined {
		return this.data.phone;
	}

	get creditLimit(): number {
		return this.data.creditLimit;
	}

	get creditDays(): number {
		return this.data.creditDays;
	}

	get customerSegment(): CustomerSegment {
		return this.data.customerSegment;
	}

	get paymentBehaviorScore(): number {
		return this.data.paymentBehaviorScore;
	}

	get lastPurchaseDate(): Date | undefined {
		return this.data.lastPurchaseDate;
	}

	get totalPurchases(): number {
		return this.data.totalPurchases;
	}

	get complianceScore(): number {
		return this.data.complianceScore;
	}

	get sunatCondition(): string {
		return this.data.sunatCondition;
	}

	get logoUrl(): string | undefined {
		return this.data.logoUrl;
	}

	get createdAt(): Date {
		return this.data.createdAt;
	}

	get updatedAt(): Date {
		return this.data.updatedAt;
	}

	/**
	 * Validate RUC using SUNAT Módulo 11 algorithm
	 */
	static isValidRUC(ruc: string): boolean {
		return RUC.isValid(ruc);
	}

	/**
	 * Check if customer is active (HABIDO)
	 */
	get isActive(): boolean {
		return this.data.sunatCondition === "HABIDO";
	}

	/**
	 * Check if customer is inactive
	 */
	get isInactive(): boolean {
		return this.data.sunatCondition === "INACTIVO";
	}

	/**
	 * Check if customer has good compliance
	 */
	get hasGoodCompliance(): boolean {
		return this.data.complianceScore >= 80;
	}

	/**
	 * Check if customer has credit available
	 */
	hasCreditAvailable(currentDebt: number): boolean {
		if (this.data.creditLimit <= 0) return true; // No limit
		return currentDebt < this.data.creditLimit;
	}

	/**
	 * Calculate remaining credit
	 */
	getRemainingCredit(currentDebt: number): number {
		if (this.data.creditLimit <= 0) return Infinity;
		return Math.max(0, this.data.creditLimit - currentDebt);
	}

	/**
	 * Business Rule: customer has good payment behavior if score >= 80.
	 */
	hasGoodPaymentBehavior(): boolean {
		return this.data.paymentBehaviorScore >= 80;
	}

	/**
	 * Business Rule: check if customer can make purchase given amount.
	 */
	canPurchase(amount: number): boolean {
		if (amount <= 0) return true;
		if (this.data.creditLimit <= 0) return true;
		return this.data.totalPurchases + amount <= this.data.creditLimit;
	}

	/**
	 * Business Rule: invoice is overdue if today > invoiceDate + creditDays.
	 */
	isInvoiceOverdue(invoiceDate: Date, asOf: Date = new Date()): boolean {
		if (this.data.creditDays <= 0)
			return asOf.getTime() > invoiceDate.getTime();
		const due = new Date(invoiceDate);
		due.setDate(due.getDate() + this.data.creditDays);
		return asOf.getTime() > due.getTime();
	}

	/**
	 * Convert to plain object for serialization
	 */
	toJSON() {
		return {
			id: this.id,
			companyId: this.companyId,
			taxId: this.taxId,
			legalName: this.legalName,
			email: this.email,
			address: this.address,
			phone: this.phone,
			creditLimit: this.creditLimit,
			creditDays: this.creditDays,
			customerSegment: this.customerSegment,
			paymentBehaviorScore: this.paymentBehaviorScore,
			hasGoodPaymentBehavior: this.hasGoodPaymentBehavior(),
			lastPurchaseDate: this.lastPurchaseDate,
			totalPurchases: this.totalPurchases,
			complianceScore: this.complianceScore,
			sunatCondition: this.sunatCondition,
			isActive: this.isActive,
			hasGoodCompliance: this.hasGoodCompliance,
			logoUrl: this.logoUrl,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}
}
