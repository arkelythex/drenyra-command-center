/**
 * @arkelythex/application-civic — Civic CQRS application layer
 *
 * Command and query handlers for election validation, fraud detection,
 * results aggregation, and audit trail queries.
 *
 * Framework-free — depends only on @arkelythex/domain-civic ports.
 */

export type { AddFraudEvidenceInput } from "./command/AddFraudEvidence";
export { AddFraudEvidence } from "./command/AddFraudEvidence";
export type { CreateCivicCaseInput } from "./command/CreateCivicCase";
export { CreateCivicCase } from "./command/CreateCivicCase";
export type {
	AnalysisType,
	DetectFraudPatternInput,
} from "./command/DetectFraudPattern";
export { DetectFraudPattern } from "./command/DetectFraudPattern";
export type { EscalateCivicCaseInput } from "./command/EscalateCivicCase";

export { EscalateCivicCase } from "./command/EscalateCivicCase";
export type {
	EvidenceInput as CommandEvidenceInput,
	ValidateElectoralActInput,
} from "./command/ValidateElectoralAct";
// ─── Commands ──────────────────────────────────────────────────────
export { ValidateElectoralAct } from "./command/ValidateElectoralAct";
export type { AuditTrailEntryDTO } from "./dto/AuditTrailEntry.dto";
export { AuditTrailEntrySchema } from "./dto/AuditTrailEntry.dto";
export type { CivicCaseDTO, FraudIndicatorItemDTO } from "./dto/CivicCase.dto";
export { CivicCaseDTOSchema, CivicCaseStatusSchema } from "./dto/CivicCase.dto";
export type {
	CandidateResultDTO,
	ElectionMetadataDTO,
	ElectionResultsDTO,
} from "./dto/ElectionResults.dto";
export { ElectionResultsSchema } from "./dto/ElectionResults.dto";
export type {
	FraudAnalysisReportDTO,
	FraudAnalysisSummaryDTO,
	FraudIndicatorGroupDTO,
} from "./dto/FraudAnalysisReport.dto";
export { FraudAnalysisReportSchema } from "./dto/FraudAnalysisReport.dto";

// ─── DTOs ──────────────────────────────────────────────────────────
export type {
	EvidenceInput as EvidenceInputDTO,
	FraudIndicatorDTO,
	ValidationOutcome,
	ValidationResultDTO,
	VoterVerificationDTO,
} from "./dto/ValidationResult.dto";
export {
	ValidationOutcomeSchema,
	ValidationResultSchema,
	VoterVerificationSchema,
} from "./dto/ValidationResult.dto";
// ─── Application Ports ─────────────────────────────────────────────
export type {
	IAuditEvidenceStore,
	IDigitalPublicPeruBridge,
	IElectoralRollVerifier,
	IFraudRuleEngine,
} from "./port";
export type { GetAuditTrailInput } from "./query/GetAuditTrail";
export { GetAuditTrail } from "./query/GetAuditTrail";
export type { GetCivicCaseInput } from "./query/GetCivicCase";
export { GetCivicCase } from "./query/GetCivicCase";
export type { GetElectionResultsInput } from "./query/GetElectionResults";
// ─── Queries ───────────────────────────────────────────────────────
export { GetElectionResults } from "./query/GetElectionResults";
export type { GetFraudAnalysisInput } from "./query/GetFraudAnalysis";
export { GetFraudAnalysis } from "./query/GetFraudAnalysis";

// ─── Application Service ───────────────────────────────────────────
export { CivicApplicationService } from "./service/CivicApplicationService";
