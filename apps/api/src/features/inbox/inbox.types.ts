/** Smart Inbox SSE event types — see docs/superpowers/specs/2026-05-23-smart-inbox-design.md */

export type InboxAgentName =
	| "Reader"
	| "Classifier"
	| "Validator"
	| "Debate"
	| "Accounting"
	| "Reporter";

export type InboxAgentStatus = "pending" | "running" | "completed" | "failed";

export interface InboxProcessContext {
	companyId: string;
	batchId: string;
}

export interface InboxInvoiceSeed {
	invoiceId: string;
	filename: string;
	mimeType: string;
}

export interface InboxInvoiceSummary {
	invoiceId: string;
	filename: string;
	status: "ready" | "needs-review" | "error";
	total?: number;
	igv?: number;
	accountingLabel?: string;
	reason?: string;
	error?: string;
}

export interface AgentStatusEvent {
	agent: InboxAgentName;
	status: InboxAgentStatus;
	message: string;
	invoiceId?: string;
}

export interface AgentDebateEvent {
	agents: string[];
	message: string;
	invoiceId: string;
}

export interface InvoiceReadyEvent {
	invoiceId: string;
	summary: InboxInvoiceSummary;
}

export interface InvoiceNeedsReviewEvent {
	invoiceId: string;
	reason: string;
	details: string;
}

export interface InvoiceErrorEvent {
	invoiceId: string;
	error: string;
}

export interface BatchProgressEvent {
	processed: number;
	total: number;
	percent: number;
}

export interface BatchCompleteEvent {
	ready: number;
	needsReview: number;
	errors: number;
	summary: string;
	invoices: InboxInvoiceSummary[];
}

export type InboxSseEvent =
	| { type: "agent:status"; payload: AgentStatusEvent }
	| { type: "agent:debate"; payload: AgentDebateEvent }
	| { type: "invoice:ready"; payload: InvoiceReadyEvent }
	| { type: "invoice:needs-review"; payload: InvoiceNeedsReviewEvent }
	| { type: "invoice:error"; payload: InvoiceErrorEvent }
	| { type: "batch:progress"; payload: BatchProgressEvent }
	| { type: "batch:complete"; payload: BatchCompleteEvent };

export type InboxSseEmitter = (event: InboxSseEvent) => void;
