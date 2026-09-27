import type { AuditReport } from "../agents/compliance/audit-logger.agent";
import type { PrivacyReport } from "../agents/compliance/privacy-assessor.agent";
import type { RegulationReport } from "../agents/compliance/regulation-tracker.agent";
export type FiscalMemoryCandidateCategory = "audit_event" | "privacy_assessment" | "regulation_check";
export type FiscalMemoryCandidateSeverity = "low" | "medium" | "high" | "critical";
export interface FiscalMemoryCandidate {
    id: string;
    category: FiscalMemoryCandidateCategory;
    summary: string;
    severity: FiscalMemoryCandidateSeverity;
    timestamp: string;
    data: Record<string, unknown>;
}
export interface AuditMemoryCandidateInput {
    report: AuditReport;
    traceId?: string;
}
export interface PrivacyMemoryCandidateInput {
    report: PrivacyReport;
    traceId?: string;
}
export interface RegulationMemoryCandidateInput {
    report: RegulationReport;
    traceId?: string;
}
export declare function createFiscalMemoryCandidate(input: {
    category: FiscalMemoryCandidateCategory;
    summary: string;
    severity: FiscalMemoryCandidateSeverity;
    data?: Record<string, unknown>;
}): FiscalMemoryCandidate;
export declare function createAuditLoggerMemoryCandidates(input: AuditMemoryCandidateInput): FiscalMemoryCandidate[];
export declare function createPrivacyMemoryCandidates(input: PrivacyMemoryCandidateInput): FiscalMemoryCandidate[];
export declare function createRegulationMemoryCandidates(input: RegulationMemoryCandidateInput): FiscalMemoryCandidate[];
//# sourceMappingURL=fiscal-memory.d.ts.map