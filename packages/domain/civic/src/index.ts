/**
 * @arkelythex/domain-civic — Civic domain package
 *
 * Core entities, value objects, validation rules, and repository ports
 * for the Arkelythex Civic vertical.
 *
 * Framework-free — zero infrastructure dependencies.
 */

export type { AuditTrailProps } from "./entity/AuditTrail";
export { AuditTrail } from "./entity/AuditTrail";
export type { CivicCaseProps } from "./entity/CivicCase";
export { CivicCase, CivicCaseStatus } from "./entity/CivicCase";
export type { ElectionProps } from "./entity/Election";
// ─── Entities ──────────────────────────────────────────────────────
export { Election, ElectionStatus } from "./entity/Election";
export type { ElectoralActProps } from "./entity/ElectoralAct";
export { ElectoralAct, ValidationStatus } from "./entity/ElectoralAct";
export type { PollingStationProps } from "./entity/PollingStation";
export { PollingStation } from "./entity/PollingStation";
// ─── Domain Events ─────────────────────────────────────────────────
export {
	ActValidatedEvent,
	AuditCompletedEvent,
	CaseEscalatedEvent,
	FraudDetectedEvent,
} from "./event/domain-events";
export type { EventEmitter } from "./event/event-emitter";
export type { AuditTrailRepository } from "./port/AuditTrailRepository";
export type { CivicCaseRepository } from "./port/CivicCaseRepository";
// ─── Repository Ports ──────────────────────────────────────────────
export type { ElectionRepository } from "./port/ElectionRepository";
export type { ElectoralActRepository } from "./port/ElectoralActRepository";
export type { FraudIndicatorRepository } from "./port/FraudIndicatorRepository";
export type {
	ActRecord,
	ValidationResult,
} from "./validation/electoralActValidator";

// ─── Validation ────────────────────────────────────────────────────
export {
	validateDigitIntegrity,
	validateUrnSeal,
	validateVoteTally,
} from "./validation/electoralActValidator";
export type {
	AnomalyResult,
	CandidateVotes,
	DigitFatigueInput,
	FatigueResult,
	ManipulationResult,
	StationTurnout,
} from "./validation/fraudDetector";

export {
	detectAnomalousResults,
	detectDigitFatigue,
	detectPatternManipulation,
} from "./validation/fraudDetector";
export type { AuditEvidenceProps } from "./value-object/AuditEvidence";
export { AuditEvidence, AuditEvidenceType } from "./value-object/AuditEvidence";
export type { DNIVerificationProps } from "./value-object/DNIVerification";
export {
	DNIVerification,
	DNIVerificationStatus,
} from "./value-object/DNIVerification";
export type { FraudIndicatorProps } from "./value-object/FraudIndicator";
export {
	FraudIndicator,
	FraudIndicatorType,
	FraudSeverity,
} from "./value-object/FraudIndicator";
export type { VoteTallyProps } from "./value-object/VoteTally";
// ─── Value Objects ─────────────────────────────────────────────────
export { VoteTally } from "./value-object/VoteTally";
