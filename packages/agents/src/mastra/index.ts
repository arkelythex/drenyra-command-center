// Drenyra Mastra — Mastra-based implementations of agent-swarm primitives
//
// These replace the 63K-line agent-swarm package with clean,
// Mastra-compatible implementations while maintaining the same
// public API for backward compatibility.

export type {
	AuditEvent,
	AuditReport,
} from "./agents/compliance/audit-logger.agent";
export {
	auditLoggerAgent,
	auditLoggerPort,
} from "./agents/compliance/audit-logger.agent";
// ─── Compliance Sub-Agents ──────────────────────────────────────────
export type {
	ComplianceContext,
	ComplianceEvidenceRef,
	ComplianceFinding,
	ComplianceReportBase,
	ComplianceSeverity,
} from "./agents/compliance/compliance.types";
// ─── Compliance Assessment ───────────────────────────────────────────
export type { ComplianceAssessmentResult } from "./agents/compliance/compliance-assessment.agent";
export {
	complianceAssessmentAgent,
	runComplianceAssessment,
} from "./agents/compliance/compliance-assessment.agent";
export { redactSensitiveFields } from "./agents/compliance/compliance-redaction";
export {
	assertScopedContext,
	createFinding,
	pickComplianceContext,
	readRecord,
	readString,
	readStringArray,
	requireComplianceScope,
	riskScoreFromFindings,
	stableHash,
} from "./agents/compliance/compliance-utils";
export type {
	ConsentRecord,
	ConsentReport,
} from "./agents/compliance/consent-manager.agent";
export {
	consentManagerAgent,
	consentManagerPort,
} from "./agents/compliance/consent-manager.agent";
export type {
	Classification,
	ClassificationRisk,
	ClassifierReport,
	DataCategory,
} from "./agents/compliance/data-classifier.agent";
export {
	dataClassifierAgent,
	dataClassifierPort,
} from "./agents/compliance/data-classifier.agent";
export type {
	RetentionAction,
	RetentionPolicy,
	RetentionReport,
} from "./agents/compliance/data-retention.agent";
export {
	dataRetentionAgent,
	dataRetentionPort,
} from "./agents/compliance/data-retention.agent";
export type {
	GDPRCheck,
	GDPRReport,
	GDPRSeverity,
	GDPRStatus,
	GDPRViolation,
} from "./agents/compliance/gdpr-checker.agent";
export {
	gdprCheckerAgent,
	gdprCheckerPort,
} from "./agents/compliance/gdpr-checker.agent";
export type { PrivacyReport } from "./agents/compliance/privacy-assessor.agent";
export {
	privacyAssessorAgent,
	privacyAssessorPort,
} from "./agents/compliance/privacy-assessor.agent";
export type {
	Regulation,
	RegulationReport,
	RegulationStatus,
} from "./agents/compliance/regulation-tracker.agent";
export {
	regulationTrackerAgent,
	regulationTrackerPort,
} from "./agents/compliance/regulation-tracker.agent";
export { ApprovalGateEngine } from "./approval-gate";
export { ApprovalStore } from "./approval-store";
export type {
	ApprovalResult,
	DomainAgentConfig,
	DomainResult,
	EscalationContext,
	EscalationResolution,
	MaterialAction,
	SubAgentResult,
	SubSwarmTask,
} from "./domain-agent";
export { DomainAgent } from "./domain-agent";
export type {
	FiscalEvent,
	FiscalEventHandler,
	FiscalEventType,
} from "./event-bus";
export { AgentEventBus } from "./event-bus";
export type { IntentHandler, IntentRule } from "./intent-detector";
export { IntentDetector } from "./intent-detector";
export type { LatinOrchestrationResult } from "./latin-orchestrator";
export { LatinModernoOrchestrator } from "./latin-orchestrator";
// ─── Fiscal Memory ──────────────────────────────────────────────────
export type {
	AuditMemoryCandidateInput,
	FiscalMemoryCandidate,
	FiscalMemoryCandidateCategory,
	FiscalMemoryCandidateSeverity,
	PrivacyMemoryCandidateInput,
	RegulationMemoryCandidateInput,
} from "./memory/fiscal-memory";
export {
	createAuditLoggerMemoryCandidates,
	createFiscalMemoryCandidate,
	createPrivacyMemoryCandidates,
	createRegulationMemoryCandidates,
} from "./memory/fiscal-memory";
export type { OrchestrationResult } from "./orchestrator";
export { createDrenyraOrchestrator, DrenyraOrchestrator } from "./orchestrator";
export type { Conflict, MergeResult } from "./result-merger";
export { ResultMerger } from "./result-merger";
export type { AgentSession } from "./session-manager";
export { SessionManager } from "./session-manager";
export type { PhaseTiming, SwarmMode } from "./supervisor";
export { Supervisor } from "./supervisor";
export type { TaskDecompositionResult, TaskStep } from "./task-decomposer";
export { TaskDecomposer } from "./task-decomposer";
// ─── Compliance Tools ───────────────────────────────────────────────
export {
	createFindingTool,
	redactTool,
	riskScoreTool,
} from "./tools/compliance-tools";
// ─── Workflows ──────────────────────────────────────────────────────
export { complianceCheckWorkflow } from "./workflows/compliance-check";
