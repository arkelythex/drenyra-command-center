export type BillStatus = "review" | "approval" | "payment" | "paid";
export type BillApprovalState = "NOT_STARTED" | "PENDING" | "APPROVED";

export interface BillWorkflowEvent {
	at: string;
	from: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
	to: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
	actorId?: string;
	actorName?: string;
	reason?: string;
	approvalState: BillApprovalState;
}

export interface Bill {
	id: string;
	vendor: { name: string; logo?: string; initials: string };
	amount: number;
	invoiceNumber: string;
	dueDate: string;
	status: BillStatus;
	approvers?: { initials: string; color: string; name?: string }[];
	paidDate?: string;
	currency: "PEN" | "USD";
	approvalState?: BillApprovalState;
	workflowEvents?: BillWorkflowEvent[];
	lastEvent?: BillWorkflowEvent;
}

export interface BillsByStatus {
	review: Bill[];
	approval: Bill[];
	payment: Bill[];
	paid: Bill[];
}

export type BillsView = "summary" | "aging";
