import { auditLoggerAgent, type AuditReport } from "./audit-logger.agent";
import { consentManagerAgent, type ConsentReport } from "./consent-manager.agent";
import { dataClassifierAgent, type ClassifierReport } from "./data-classifier.agent";
import { dataRetentionAgent, type RetentionReport } from "./data-retention.agent";
import { gdprCheckerAgent, type GDPRReport } from "./gdpr-checker.agent";
import { privacyAssessorAgent, type PrivacyReport } from "./privacy-assessor.agent";
import { regulationTrackerAgent, type RegulationReport } from "./regulation-tracker.agent";
import type { AgentResult, Task } from "../types";
import type { ComplianceFinding } from "./compliance.types";
import { requireComplianceScope, riskScoreFromFindings } from "./compliance-utils";

export interface ComplianceAssessmentResult {
	readonly classifier: AgentResult<ClassifierReport>;
	readonly privacy: AgentResult<PrivacyReport>;
	readonly consent: AgentResult<ConsentReport>;
	readonly retention: AgentResult<RetentionReport>;
	readonly gdpr: AgentResult<GDPRReport>;
	readonly regulation: AgentResult<RegulationReport>;
	readonly audit: AgentResult<AuditReport>;
	readonly findings: readonly ComplianceFinding[];
	readonly riskScore: number;
	readonly advisoryOnly: true;
}

export async function runComplianceAssessment(
	task: Task,
): Promise<ComplianceAssessmentResult> {
	requireComplianceScope({ payload: task.payload, metadata: task.metadata });
	const classifier = await dataClassifierAgent.execute(task);
	const privacy = await privacyAssessorAgent.execute({
		...task,
		payload: {
			...task.payload,
			classifications: classifier.data.classifications,
		},
	});
	const consent = await consentManagerAgent.execute(task);
	const retention = await dataRetentionAgent.execute(task);
	const gdpr = await gdprCheckerAgent.execute(task);
	const regulation = await regulationTrackerAgent.execute(task);
	const audit = await auditLoggerAgent.execute(task);
	const findings = [
		...classifier.data.findings,
		...privacy.data.findings,
		...consent.data.findings,
		...retention.data.findings,
		...gdpr.data.findings,
		...regulation.data.findings,
		...audit.data.findings,
	];

	return {
		classifier,
		privacy,
		consent,
		retention,
		gdpr,
		regulation,
		audit,
		findings,
		riskScore: riskScoreFromFindings(findings),
		advisoryOnly: true,
	};
}
