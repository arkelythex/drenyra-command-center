import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import type { AgentPort, Task } from "../../../types/agent-core";
import type { ComplianceContext, ComplianceFinding } from "./compliance.types";
import { createFinding, requireComplianceScope } from "./compliance-utils";

export type GDPRStatus = "pass" | "partial" | "fail" | "exception";
export type GDPRSeverity = "low" | "medium" | "high" | "critical";

export interface GDPRCheck {
	requirement: string;
	status: GDPRStatus;
	detail: string;
}

export interface GDPRViolation {
	requirement: string;
	severity: GDPRSeverity;
	detail: string;
}

export interface GDPRReport {
	checks: readonly GDPRCheck[];
	violations: readonly GDPRViolation[];
	findings: readonly ComplianceFinding[];
	score: number;
}

const defaultRequirements: ReadonlyArray<{
	id: string;
	check: (
		context: ComplianceContext,
		payload: Record<string, unknown>,
	) => GDPRCheck;
}> = [
	{
		id: "lawful_basis",
		check: (_ctx, payload) => ({
			requirement: "Lawful basis for processing",
			status: (payload.lawfulBasis as string) ? "pass" : "fail",
			detail: (payload.lawfulBasis as string)
				? `Lawful basis: ${payload.lawfulBasis}`
				: "No lawful basis specified",
		}),
	},
	{
		id: "data_minimization",
		check: (_ctx, payload) => {
			const fields = (payload.collectedFields ?? []) as string[];
			const required = (payload.requiredFields ?? []) as string[];
			const excess = fields.filter((f) => !required.includes(f));
			return {
				requirement: "Data minimization (Art. 5(1)(c))",
				status: excess.length === 0 ? "pass" : ("partial" as GDPRStatus),
				detail:
					excess.length > 0
						? `${excess.length} unnecessary fields collected: ${excess.join(", ")}`
						: "Only required fields collected",
			};
		},
	},
	{
		id: "right_to_deletion",
		check: (_ctx, payload) => {
			const hasFiscalEvidence = (payload.hasFiscalEvidence as boolean) ?? false;
			if (hasFiscalEvidence) {
				return {
					requirement: "Right to deletion / erasure (Art. 17)",
					status: "exception",
					detail:
						"Art. 17(3) exception: fiscal evidence retention overrides deletion request",
				};
			}
			return {
				requirement: "Right to deletion / erasure (Art. 17)",
				status: "pass",
				detail: "No fiscal evidence — standard deletion applies",
			};
		},
	},
	{
		id: "right_of_access",
		check: (_ctx, payload) => ({
			requirement: "Right of access (Art. 15)",
			status: (payload.accessMechanism as string) ? "pass" : "fail",
			detail: (payload.accessMechanism as string)
				? `Access mechanism: ${payload.accessMechanism}`
				: "No access mechanism defined",
		}),
	},
	{
		id: "breach_notification",
		check: (_ctx, payload) => ({
			requirement: "Breach notification (Art. 33-34)",
			status: (payload.breachProcedure as string) ? "pass" : "fail",
			detail: (payload.breachProcedure as string)
				? `Breach procedure: ${payload.breachProcedure}`
				: "No breach notification procedure defined",
		}),
	},
];

export const gdprCheckerAgent = new Agent({
	id: "gdpr-checker",
	name: "gdpr-checker",
	instructions: "You check GDPR/data protection compliance requirements.",
	model: openai("gpt-4o"),
});

export const gdprCheckerPort: AgentPort<Task, GDPRReport> = {
	id: "gdpr-checker",
	name: "GDPR Checker",
	description: "GDPR/data protection compliance checks",
	capabilities: ["compliance:gdpr", "compliance:data-protection"],
	priority: 3,
	drenyraSubagent: null,

	execute: async (task: Task, _config?) => {
		const context: ComplianceContext = requireComplianceScope({
			payload: task.payload as Record<string, unknown> | undefined,
			metadata: task.metadata as Record<string, unknown> | undefined,
			traceId: task.metadata?.traceId as string | undefined,
		});

		const findings: ComplianceFinding[] = [];
		const checks: GDPRCheck[] = [];
		const violations: GDPRViolation[] = [];
		const payload = (task.payload ?? {}) as Record<string, unknown>;

		for (const req of defaultRequirements) {
			const check = req.check(context, payload);
			checks.push(check);

			if (check.status === "fail") {
				violations.push({
					requirement: check.requirement,
					severity: "high",
					detail: check.detail,
				});
				findings.push(
					createFinding({
						severity: "high",
						category: `gdpr.${req.id}`,
						message: check.detail,
						recommendedAction: `Implement ${check.requirement}`,
					}),
				);
			}
		}

		const passCount = checks.filter(
			(c) => c.status === "pass" || c.status === "exception",
		).length;
		const score = Math.round((passCount / Math.max(1, checks.length)) * 100);

		const report: GDPRReport = { checks, violations, findings, score };
		return {
			success: violations.length === 0,
			data: report,
			metrics: { duration: 0, tokensUsed: 0, cost: 0 },
			agentId: "gdpr-checker",
		};
	},
};
