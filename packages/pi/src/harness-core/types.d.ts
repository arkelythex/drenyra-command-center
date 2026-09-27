export interface DelegationConfig {
    maxDepth: number;
    allowDynamicSpawn?: boolean;
    strictParentValidation?: boolean;
}
export interface ApprovalConfig {
    approvalActions: string[];
    onApprovalRequired?: (request: ApprovalRequest) => Promise<boolean>;
}
export interface ApprovalRequest {
    agentId: string;
    task: string;
    runId: string;
}
export interface EvidenceConfig {
    backend: string;
    maxRecordsPerRun?: number;
    enableAutoArchive?: boolean;
}
export interface DelegationNode {
    id: string;
    label: string;
    maySpawn: readonly string[];
    requiresApproval?: boolean;
    parent?: string;
    leaf?: boolean;
}
export interface DelegationPath {
    path: string[];
    valid: boolean;
}
export type ApprovalCondition = (task: string) => boolean;
export interface ApprovalGate {
    name: string;
    description: string;
    condition: ApprovalCondition;
    handler?: (request: ApprovalRequest) => Promise<boolean>;
}
export interface EvidenceRecord {
    id: string;
    runId: string;
    type: string;
    content: unknown;
    timestamp: string;
    metadata?: Record<string, unknown>;
}
export interface EvidenceQuery {
    runId?: string;
    type?: string;
    limit?: number;
}
//# sourceMappingURL=types.d.ts.map