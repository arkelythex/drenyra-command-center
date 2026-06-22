import type { FiscalRiskLevel } from "@arkelythex/domain";

export interface ApprovalItem {
	id: string;
	summary: string;
	module: string;
	companyRuc: string;
	companyName: string;
	riskLevel: FiscalRiskLevel;
	status: "PENDING" | "APPROVED" | "REJECTED";
	proposedBy: string;
	createdAt: string;
	approvedBy?: string;
	approvedAt?: string;
	rejectedBy?: string;
	rejectionReason?: string;
	urgency: "LOW" | "NORMAL" | "URGENT";
}
