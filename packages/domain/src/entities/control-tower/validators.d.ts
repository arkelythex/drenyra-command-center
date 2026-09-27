import type { AgentRunProps, ApprovalRequestProps, AuditEventProps, EvidenceItemProps, FiscalCaseProps } from "./types";
export declare function validateFiscalCaseProps(props: FiscalCaseProps): void;
export declare function validateEvidenceItemProps(props: EvidenceItemProps): void;
export declare function validateAgentRunProps(props: AgentRunProps): void;
export declare function validateApprovalRequestProps(props: ApprovalRequestProps): void;
export declare function validateAuditEventProps(props: AuditEventProps): void;
export declare function validateFiscalCaseTransition(currentStatus: string, newStatus: string): void;
export declare function validateApprovalDecision(currentStatus: string, newStatus: string): void;
//# sourceMappingURL=validators.d.ts.map