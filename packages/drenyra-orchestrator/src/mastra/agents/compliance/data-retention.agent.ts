import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import type { AgentPort, AgentResult, Task } from "../../../types/agent-core";
import type { ComplianceContext, ComplianceFinding } from "./compliance.types";
import { createFinding, requireComplianceScope } from "./compliance-utils";

export type RetentionAction =
	| "retain_fiscal_evidence"
	| "archive"
	| "delete"
	| "review";

export interface RetentionPolicy {
	recordId: string;
	action: RetentionAction;
	reason: string;
}

export interface RetentionReport {
	policies: readonly RetentionPolicy[];
	recommendations: readonly string[];
	findings: readonly ComplianceFinding[];
}

const retentionRules: Record<string, { years: number; reason: string }> = {
	cdr: { years: 10, reason: "SUNAT CDR retention (10 years)" },
	fiscal_evidence: {
		years: 10,
		reason: "Fiscal evidence retention (10 years)",
	},
	personal_data: { years: 2, reason: "Personal data retention (2 years)" },
	operational_log: { years: 1, reason: "Operational log retention (1 year)" },
	financial_record: {
		years: 5,
		reason: "Financial record retention (5 years)",
	},
};

export const dataRetentionAgent = new Agent({
	id: "data-retention",
	name: "data-retention",
	instructions: "You evaluate data retention policies for fiscal compliance.",
	model: openai("gpt-4o"),
});

export const dataRetentionPort: AgentPort<Task, RetentionReport> = {
	id: "data-retention",
	name: "Data Retention",
	description: "Data retention policy evaluation",
	capabilities: ["compliance:retention", "compliance:data-governance"],
	priority: 3,
	drenyraSubagent: null,

	execute: async (task: Task, _config?) => {
		requireComplianceScope({
			payload: task.payload as Record<string, unknown> | undefined,
			metadata: task.metadata as Record<string, unknown> | undefined,
			traceId: task.metadata?.traceId as string | undefined,
		});

		const findings: ComplianceFinding[] = [];
		const rawRecords = (task.payload?.records ?? []) as Array<{
			id: string;
			type: string;
			createdAt?: string;
		}>;
		const policies: RetentionPolicy[] = [];
		const recommendations: string[] = [];

		for (const record of rawRecords) {
			const rule = retentionRules[record.type];

			if (!rule) {
				findings.push(
					createFinding({
						severity: "medium",
						category: "retention.unknown-type",
						message: `No retention rule for type: ${record.type}`,
						evidenceRefs: [record.id],
						recommendedAction: `Define retention policy for ${record.type}`,
					}),
				);
				policies.push({
					recordId: record.id,
					action: "review",
					reason: "No matching retention rule",
				});
				continue;
			}

			if (record.createdAt) {
				const created = new Date(record.createdAt);
				const now = new Date();
				const elapsedYears =
					(now.getTime() - created.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

				if (elapsedYears >= rule.years) {
					policies.push({
						recordId: record.id,
						action: "archive",
						reason: `${rule.reason} — retention period of ${rule.years} years elapsed`,
					});
					continue;
				}
			}

			policies.push({
				recordId: record.id,
				action: "retain_fiscal_evidence",
				reason: rule.reason,
			});
		}

		if (findings.length > 0) {
			recommendations.push("Complete retention policies for all record types");
		}

		if (policies.some((p) => p.action === "delete" || p.action === "archive")) {
			recommendations.push(
				"Ensure deletion/archival is logged for audit trail",
			);
		}

		const report: RetentionReport = { policies, recommendations, findings };
		return {
			success: true,
			data: report,
			metrics: { duration: 0, tokensUsed: 0, cost: 0 },
			agentId: "data-retention",
		};
	},
};
