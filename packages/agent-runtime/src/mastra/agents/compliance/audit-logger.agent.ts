import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import type { AgentPort, Task } from "../../../types/agent-core";
import type { ComplianceContext, ComplianceFinding } from "./compliance.types";
import { createFinding, requireComplianceScope } from "./compliance-utils";

const materialActions = new Set([
	"invoice.cancel",
	"invoice.void",
	"credit_note.emit",
	"debit_note.emit",
	"payment.reverse",
	"retencion.apply",
	"detraccion.release",
]);

export interface AuditEvent {
	id: string;
	actor: string;
	action: string;
	timestamp: string;
	traceId?: string;
	evidenceRefs?: readonly string[];
	approvalId?: string;
	scope?: string;
	metadata?: Record<string, unknown>;
}

export interface AuditReport {
	events: readonly AuditEvent[];
	findings: readonly ComplianceFinding[];
	tamperProof: boolean;
	coverage: number;
}

export const auditLoggerAgent = new Agent({
	id: "audit-logger",
	name: "audit-logger",
	instructions: "You validate and log audit events for fiscal compliance.",
	model: openai("gpt-4o"),
});

export const auditLoggerPort: AgentPort<Task, AuditReport> = {
	id: "audit-logger",
	name: "Audit Logger",
	description: "Audit event validation and logging",
	capabilities: ["compliance:audit", "compliance:logging"],
	priority: 3,
	drenyraSubagent: null,

	execute: async (task: Task, _config?) => {
		const context: ComplianceContext = requireComplianceScope({
			payload: task.payload as Record<string, unknown> | undefined,
			metadata: task.metadata as Record<string, unknown> | undefined,
			traceId: task.metadata?.traceId as string | undefined,
		});

		const findings: ComplianceFinding[] = [];
		const rawEvents = (task.payload?.events ?? []) as AuditEvent[];
		const validEvents: AuditEvent[] = [];
		let tamperProof = true;

		for (const event of rawEvents) {
			const eventFindings: ComplianceFinding[] = [];

			if (!event.traceId) {
				eventFindings.push(
					createFinding({
						severity: "medium",
						category: "audit.trace",
						message: "Audit event missing traceId",
						evidenceRefs: [event.id],
						recommendedAction: "Ensure all audit events include a traceId",
					}),
				);
				tamperProof = false;
			}

			if (
				event.scope &&
				context.companyId &&
				event.scope !== context.companyId
			) {
				eventFindings.push(
					createFinding({
						severity: "high",
						category: "audit.scope-mismatch",
						message: `Event scope ${event.scope} does not match context ${context.companyId}`,
						evidenceRefs: [event.id],
						recommendedAction: "Verify event originates from correct scope",
					}),
				);
				tamperProof = false;
			}

			if (materialActions.has(event.action) && !event.approvalId) {
				eventFindings.push(
					createFinding({
						severity: "critical",
						category: "audit.unapproved-material",
						message: `Material action ${event.action} lacks approval reference`,
						evidenceRefs: [event.id],
						recommendedAction: `Obtain approval before executing ${event.action}`,
						requiresApproval: true,
					}),
				);
			}

			findings.push(...eventFindings);

			if (
				eventFindings.length === 0 ||
				eventFindings.every((f) => f.severity !== "critical")
			) {
				validEvents.push(event);
			}
		}

		const coverage =
			rawEvents.length > 0
				? Math.round((validEvents.length / rawEvents.length) * 100)
				: 100;

		const report: AuditReport = {
			events: validEvents,
			findings,
			tamperProof,
			coverage,
		};

		return {
			success:
				findings.every((f) => f.severity !== "critical") ||
				findings.length === 0,
			data: report,
			metrics: { duration: 0, tokensUsed: 0, cost: 0 },
			agentId: "audit-logger",
		};
	},
};
