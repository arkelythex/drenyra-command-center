/**
 * Arkelythex Agents Module
 *
 * Exports all agents and guardrails for the Arkelythex AI system.
 *
 * @since December 2025 - AI-First Architecture
 */

// Core Agents
// Tools (functions) — migrated to @arkelythex/ai
export {
	calculateDetraction,
	calculateIGV,
	suggestPCGEAccount,
	validateRUC,
} from "@arkelythex/ai";
export {
	type AgentConfig,
	type AgentResult,
	classifierAgent,
	runAgent,
	taxAdvisorAgent,
} from "./agents";
// Elite 2026 Agents
export {
	analyzeDiscrepancy,
	analyzeExpenseCompliance,
	analyzeRepresentationLimits,
	askComplianceAgent,
	type ComplianceAlert,
	type ComplianceAnalysis,
	checkVendorCompliance,
	type ProposedAction,
} from "./compliance-agent";
// Guardrails
export {
	type GuardrailResult,
	type SUNATSubmissionData,
	sunatGuardrail,
	validateIGVCalculation,
	validateRUCModulo11,
	withSunatGuardrail,
} from "./guardrails/sunat.guardrail";
export {
	type AuditFinding,
	AuditFindingSchema,
	type AuditReport,
	AuditReportSchema,
	executePreAudit,
	runNightlyPreAudit,
} from "./pre-audit-job";
export {
	analyzeTreasuryHealth,
	formatAlertNotification,
	generateTreasuryRecommendations,
	type NotificationPayload,
	type TreasuryAlert,
	type TreasuryAlertConfig,
	type TreasuryMetrics,
} from "./treasury-agent";
