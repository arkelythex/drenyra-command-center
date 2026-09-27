export type FiscalRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export declare const FISCAL_ACTION_STATUS: {
    readonly DETECTED: "DETECTED";
    readonly ANALYZED: "ANALYZED";
    readonly PROPOSED: "PROPOSED";
    readonly VALIDATED: "VALIDATED";
    readonly APPROVED: "APPROVED";
    readonly EXECUTED: "EXECUTED";
    readonly EVIDENCED: "EVIDENCED";
    readonly REJECTED: "REJECTED";
};
export type FiscalActionStatus = (typeof FISCAL_ACTION_STATUS)[keyof typeof FISCAL_ACTION_STATUS];
export declare const FISCAL_ACTION_STATUS_LABELS: Record<FiscalActionStatus, string>;
export declare const FISCAL_ACTION_STATUS_ORDER: readonly FiscalActionStatus[];
export interface FiscalEvidenceItem {
    id: string;
    kind: "CDR" | "UBL" | "SIRE" | "XML" | "PDF" | "HASH" | "SCREENSHOT" | "LOG";
    label: string;
    hash: string;
    verified: boolean;
    attachedAt: string;
    url?: string;
}
export interface FiscalAgentAnalysis {
    agentId: string;
    agentName: string;
    confidence: number;
    proposal: string;
    rationale: string;
    detectedAt: string;
    risks: string[];
}
export interface FiscalActionContext {
    traceId: string;
    summary: string;
    status: FiscalActionStatus;
    riskLevel: FiscalRiskLevel;
    impact: string;
    proposedBy: "agent" | "system" | "contador" | "auditor";
    requiresApproval: boolean;
    module: "facturacion" | "compras" | "ventas" | "sire" | "conciliacion" | "cierre" | "bancos" | "nomina" | "impuestos";
    companyRuc: string;
    createdAt: string;
    agentAnalysis?: FiscalAgentAnalysis;
    evidence: FiscalEvidenceItem[];
    requiredApprovers?: string[];
    approvedBy?: string[];
    rejectedBy?: string;
    rejectionReason?: string;
}
export declare function canAutoApprove(riskLevel: FiscalRiskLevel): boolean;
export declare function requiresDualSignature(riskLevel: FiscalRiskLevel): boolean;
export declare function nextStatus(current: FiscalActionStatus): FiscalActionStatus | null;
export declare const FISCAL_RISK_COLORS: Record<FiscalRiskLevel, string>;
export declare const FISCAL_ACTION_STATUS_COLORS: Record<FiscalActionStatus, string>;
//# sourceMappingURL=fiscal-pipeline.d.ts.map