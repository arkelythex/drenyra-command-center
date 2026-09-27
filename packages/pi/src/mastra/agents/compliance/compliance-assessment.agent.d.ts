import { Agent } from "@mastra/core/agent";
import type { Task } from "../../../types/agent-core";
import type { AuditReport } from "./audit-logger.agent";
import type { ComplianceFinding } from "./compliance.types";
import type { ConsentReport } from "./consent-manager.agent";
import type { ClassifierReport } from "./data-classifier.agent";
import type { RetentionReport } from "./data-retention.agent";
import type { GDPRReport } from "./gdpr-checker.agent";
import type { PrivacyReport } from "./privacy-assessor.agent";
import type { RegulationReport } from "./regulation-tracker.agent";
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
export declare const complianceAssessmentAgent: Agent<"compliance-assessment", import("@mastra/core/agent").ToolsInput, undefined, unknown, import("@mastra/core/agent").AgentEditorConfig | undefined>;
export declare function runComplianceAssessment(task: Task): Promise<ComplianceAssessmentResult>;
//# sourceMappingURL=compliance-assessment.agent.d.ts.map