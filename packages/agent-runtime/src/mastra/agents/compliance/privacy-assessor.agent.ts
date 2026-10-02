import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import type { AgentPort, Task } from "../../../types/agent-core";
import type { ComplianceFinding } from "./compliance.types";
import { createFinding, requireComplianceScope } from "./compliance-utils";

export interface PrivacyReport {
	privacyRiskScore: number;
	classifications: readonly string[];
	recommendations: readonly string[];
	findings: readonly ComplianceFinding[];
}

const riskScores: Record<string, number> = {
	restricted: 100,
	fiscal_sensitive: 85,
	pii: 60,
	financial: 40,
	public: 0,
};

export const privacyAssessorAgent = new Agent({
	id: "privacy-assessor",
	name: "privacy-assessor",
	instructions: "You assess privacy risk for data processing activities.",
	model: openai("gpt-4o"),
});

export const privacyAssessorPort: AgentPort<Task, PrivacyReport> = {
	id: "privacy-assessor",
	name: "Privacy Assessor",
	description: "Privacy risk assessment",
	capabilities: ["compliance:privacy-assessment", "compliance:risk"],
	priority: 4,
	drenyraSubagent: null,

	execute: async (task: Task, _config?) => {
		requireComplianceScope({
			payload: task.payload as Record<string, unknown> | undefined,
			metadata: task.metadata as Record<string, unknown> | undefined,
			traceId: task.metadata?.traceId as string | undefined,
		});

		const findings: ComplianceFinding[] = [];
		const rawClassifications = (task.payload?.classifications ??
			[]) as string[];
		const recommendations: string[] = [];

		const classifications = [
			...new Set(rawClassifications.map((c) => c.toLowerCase())),
		];
		let privacyRiskScore = 0;

		for (const cls of classifications) {
			const score = riskScores[cls] ?? 0;
			if (score > privacyRiskScore) {
				privacyRiskScore = score;
			}
		}

		if (privacyRiskScore >= 100) {
			findings.push(
				createFinding({
					severity: "critical",
					category: "privacy.secret-exposure",
					message:
						"Secrets/credentials detected in data — maximum privacy risk",
					recommendedAction:
						"Immediately rotate exposed secrets and review access controls",
				}),
			);
			recommendations.push("Rotate all exposed credentials immediately");
			recommendations.push("Implement secret scanning in CI/CD pipeline");
		}

		if (privacyRiskScore >= 85) {
			findings.push(
				createFinding({
					severity: "high",
					category: "privacy.pii-financial",
					message:
						"Combined PII and financial data detected — high privacy risk",
					recommendedAction: "Implement data encryption and access controls",
				}),
			);
			recommendations.push(
				"Encrypt PII and financial data at rest and in transit",
			);
		}

		if (privacyRiskScore >= 40 && privacyRiskScore < 85) {
			recommendations.push("Review data retention policies for PII data");
		}

		if (privacyRiskScore === 0) {
			recommendations.push(
				"No privacy-sensitive data detected — standard controls apply",
			);
		}

		recommendations.push("Document data processing activities (Art. 30 GDPR)");

		const report: PrivacyReport = {
			privacyRiskScore,
			classifications,
			recommendations,
			findings,
		};
		return {
			success: privacyRiskScore < 85,
			data: report,
			metrics: { duration: 0, tokensUsed: 0, cost: 0 },
			agentId: "privacy-assessor",
		};
	},
};
