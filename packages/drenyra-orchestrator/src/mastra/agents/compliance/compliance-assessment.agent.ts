import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import type { AgentResult, Task } from "../../../types/agent-core";
import type { AuditReport } from "./audit-logger.agent";
import { auditLoggerPort } from "./audit-logger.agent";
import type { ComplianceFinding } from "./compliance.types";
import {
	requireComplianceScope,
	riskScoreFromFindings,
} from "./compliance-utils";
import type { ConsentReport } from "./consent-manager.agent";
import { consentManagerPort } from "./consent-manager.agent";
import type { ClassifierReport } from "./data-classifier.agent";
import { dataClassifierPort } from "./data-classifier.agent";
import type { RetentionReport } from "./data-retention.agent";
import { dataRetentionPort } from "./data-retention.agent";
import type { GDPRReport } from "./gdpr-checker.agent";
import { gdprCheckerPort } from "./gdpr-checker.agent";
import type { PrivacyReport } from "./privacy-assessor.agent";
import { privacyAssessorPort } from "./privacy-assessor.agent";
import type { RegulationReport } from "./regulation-tracker.agent";
import { regulationTrackerPort } from "./regulation-tracker.agent";

export interface ComplianceAssessmentResult {
	classifier: ClassifierReport;
	privacy: PrivacyReport;
	consent: ConsentReport;
	retention: RetentionReport;
	gdpr: GDPRReport;
	regulation: RegulationReport;
	audit: AuditReport;
	findings: readonly ComplianceFinding[];
	riskScore: number;
	advisoryOnly: true;
}

export const complianceAssessmentAgent = new Agent({
	id: "compliance-assessment",
	name: "compliance-assessment",
	instructions:
		"You orchestrate all 7 compliance sub-agents and produce a consolidated compliance assessment.",
	model: openai("gpt-4o"),
});

export async function runComplianceAssessment(
	task: Task,
): Promise<ComplianceAssessmentResult> {
	requireComplianceScope({
		payload: task.payload as Record<string, unknown> | undefined,
		metadata: task.metadata as Record<string, unknown> | undefined,
		traceId: task.metadata?.traceId as string | undefined,
	});

	const classifierResult = await dataClassifierPort.execute(task);
	const classifier = classifierResult.data;

	const privacyTask: Task = {
		...task,
		payload: {
			...task.payload,
			classifications: classifier.classifications.flatMap((c) => c.categories),
		},
	};
	const privacyResult = await privacyAssessorPort.execute(privacyTask);
	const privacy = privacyResult.data;

	const consentTask: Task = { ...task, payload: { ...task.payload } };
	const consentResult = await consentManagerPort.execute(consentTask);
	const consent = consentResult.data;

	const retentionTask: Task = { ...task, payload: { ...task.payload } };
	const retentionResult = await dataRetentionPort.execute(retentionTask);
	const retention = retentionResult.data;

	const gdprTask: Task = {
		...task,
		payload: {
			...task.payload,
			classifications: classifier.classifications.flatMap((c) => c.categories),
		},
	};
	const gdprResult = await gdprCheckerPort.execute(gdprTask);
	const gdpr = gdprResult.data;

	const regulationTask: Task = { ...task, payload: { ...task.payload } };
	const regulationResult = await regulationTrackerPort.execute(regulationTask);
	const regulation = regulationResult.data;

	const auditTask: Task = {
		...task,
		payload: {
			...task.payload,
			events: task.payload?.events ?? [
				{
					id: "assessment-event",
					actor: "compliance-assessment",
					action: "compliance.check",
					timestamp: new Date().toISOString(),
					traceId: task.metadata?.traceId ?? "manual",
					scope: (task.metadata as Record<string, unknown>)?.companyId as
						| string
						| undefined,
				},
			],
		},
	};
	const auditResult = await auditLoggerPort.execute(auditTask);
	const audit = auditResult.data;

	const allFindings: ComplianceFinding[] = [
		...classifier.findings,
		...privacy.findings,
		...consent.findings,
		...retention.findings,
		...gdpr.findings,
		...regulation.findings,
		...audit.findings,
	];

	const riskScore = riskScoreFromFindings(allFindings);

	return {
		classifier,
		privacy,
		consent,
		retention,
		gdpr,
		regulation,
		audit,
		findings: allFindings,
		riskScore,
		advisoryOnly: true,
	};
}
