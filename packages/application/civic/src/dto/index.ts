/**
 * Civic Application DTOs — Plain objects with Zod validation
 *
 * DTOs are the I/O contracts for commands and queries.
 * They contain NO domain entity references — only serializable plain objects.
 */

export type { AuditTrailEntryDTO } from "./AuditTrailEntry.dto";
export { AuditTrailEntrySchema } from "./AuditTrailEntry.dto";
export type { CivicCaseDTO, FraudIndicatorItemDTO } from "./CivicCase.dto";
export { CivicCaseDTOSchema, CivicCaseStatusSchema } from "./CivicCase.dto";

export type {
	CandidateResultDTO,
	ElectionMetadataDTO,
	ElectionResultsDTO,
} from "./ElectionResults.dto";
export { ElectionResultsSchema } from "./ElectionResults.dto";
export type {
	FraudAnalysisReportDTO,
	FraudAnalysisSummaryDTO,
	FraudIndicatorGroupDTO,
} from "./FraudAnalysisReport.dto";
export { FraudAnalysisReportSchema } from "./FraudAnalysisReport.dto";
export type {
	EvidenceInput,
	FraudIndicatorDTO,
	ValidationOutcome,
	ValidationResultDTO,
	VoterVerificationDTO,
} from "./ValidationResult.dto";
export {
	ValidationResultSchema,
	VoterVerificationSchema,
} from "./ValidationResult.dto";
