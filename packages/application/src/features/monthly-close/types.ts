/**
 * Monthly Close — DTO types for frontend consumption.
 *
 * @module application/features/monthly-close
 */

// ─── Status Enums ────────────────────────────────────────────────

export type ChecklistStatus =
	| "PENDING"
	| "IN_PROGRESS"
	| "COMPLETED"
	| "VERIFIED"
	| "LOCKED";
export type ItemStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "WAIVED";
export type GateStatus = "PASSED" | "FAILED" | "WAIVED";
export type ItemCategory =
	| "bank_reconciliation"
	| "depreciation"
	| "tax_provision"
	| "accrual"
	| "deferral"
	| "inventory"
	| "intercompany"
	| "other";

// ─── DTOs ────────────────────────────────────────────────────────

export interface ChecklistDTO {
	id: string;
	companyId: string;
	period: string;
	name: string;
	status: ChecklistStatus;
	assignedToId: string | null;
	dueDate: string | null;
	notes: string | null;
	items?: ChecklistItemDTO[];
	createdAt: string;
	updatedAt: string;
}

export interface ChecklistItemDTO {
	id: string;
	checklistId: string;
	name: string;
	description: string | null;
	category: ItemCategory;
	status: ItemStatus;
	assignedToId: string | null;
	sortOrder: number;
	evidenceIds?: string[];
	notes: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface GateDTO {
	id: string;
	companyId: string;
	period: string;
	status: GateStatus;
	resolution: string | null;
	overrideById: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CloseDashboardDTO {
	overallProgress: number;
	gates: GateDTO[];
	checklistProgress: Array<{
		checklistId: string;
		name: string;
		completedItems: number;
		totalItems: number;
		status: ChecklistStatus;
	}>;
}
