/**
 * Taxation Types — Domain
 *
 * Core domain types for tax declarations, IGV summaries, detractions,
 * and tax calendar events.
 */

export type TaxPeriod = "MONTHLY" | "QUARTERLY" | "ANNUAL";
export type DeclarationType =
	| "IGV"
	| "INCOME_TAX"
	| "DETRACTION"
	| "RETENTION";
export type DeclarationStatus =
	| "DRAFT"
	| "SUBMITTED"
	| "ACCEPTED"
	| "REJECTED";

export interface TaxDeclaration {
	id: string;
	companyId: string;
	type: DeclarationType;
	period: string; // YYYY-MM or YYYY
	periodType: TaxPeriod;
	taxableBase: string;
	taxAmount: string;
	status: DeclarationStatus;
	submittedAt?: Date;
	dueDate: Date;
	createdAt: Date;
}

export interface IGVSummary {
	period: string;
	sales: string;
	purchases: string;
	igvSales: string;
	igvPurchases: string;
	igvToPay: string;
	igvToRefund: string;
}

export interface Detraction {
	id: string;
	companyId: string;
	invoiceId: string;
	amount: string;
	percentage: number;
	status: "PENDING" | "PAID" | "EXEMPT";
	dueDate: Date;
}

export interface TaxCalendar {
	month: string;
	declarations: Array<{
		type: DeclarationType;
		dueDate: Date;
		status: DeclarationStatus;
	}>;
}
