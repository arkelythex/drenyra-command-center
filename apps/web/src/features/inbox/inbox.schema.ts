import { z } from "zod";

export const inboxAgentNameSchema = z.enum([
	"Reader",
	"Classifier",
	"Validator",
	"Debate",
	"Accounting",
	"Reporter",
]);

export const inboxAgentStatusSchema = z.enum([
	"pending",
	"running",
	"completed",
	"failed",
]);

export const agentStatusEventSchema = z.object({
	agent: inboxAgentNameSchema,
	status: inboxAgentStatusSchema,
	message: z.string(),
	invoiceId: z.string().optional(),
});

export const agentDebateEventSchema = z.object({
	agents: z.array(z.string()),
	message: z.string(),
	invoiceId: z.string(),
});

export const inboxInvoiceSummarySchema = z.object({
	invoiceId: z.string(),
	filename: z.string(),
	status: z.enum(["ready", "needs-review", "error"]),
	total: z.number().optional(),
	igv: z.number().optional(),
	accountingLabel: z.string().optional(),
	reason: z.string().optional(),
	error: z.string().optional(),
});

export const batchCompleteEventSchema = z.object({
	ready: z.number(),
	needsReview: z.number(),
	errors: z.number(),
	summary: z.string(),
	invoices: z.array(inboxInvoiceSummarySchema),
});

export type InboxAgentName = z.infer<typeof inboxAgentNameSchema>;
export type AgentStatusEvent = z.infer<typeof agentStatusEventSchema>;
export type AgentDebateEvent = z.infer<typeof agentDebateEventSchema>;
export type InboxInvoiceSummary = z.infer<typeof inboxInvoiceSummarySchema>;
export type BatchCompleteEvent = z.infer<typeof batchCompleteEventSchema>;

export type InboxUiPhase =
	| "idle"
	| "uploading"
	| "processing"
	| "complete"
	| "error";

export type InboxStreamEvent =
	| { type: "agent:status"; payload: AgentStatusEvent }
	| { type: "agent:debate"; payload: AgentDebateEvent }
	| { type: "invoice:ready"; payload: { invoiceId: string; summary: InboxInvoiceSummary } }
	| {
			type: "invoice:needs-review";
			payload: { invoiceId: string; reason: string; details: string };
	  }
	| { type: "invoice:error"; payload: { invoiceId: string; error: string } }
	| { type: "batch:progress"; payload: { processed: number; total: number; percent: number } }
	| { type: "batch:complete"; payload: BatchCompleteEvent };
