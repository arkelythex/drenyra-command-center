import type { ApprovalGate, ApprovalRequest } from "./types.js";
export declare class ApprovalWorkflow {
    private gates;
    addGate(gate: ApprovalGate): void;
    addGates(gates: ApprovalGate[]): void;
    removeGate(name: string): boolean;
    getGates(): readonly ApprovalGate[];
    taskRequiresApproval(task: string, agentRequiresApproval?: boolean): boolean;
    evaluate(request: ApprovalRequest): Promise<{
        gate: string;
        approved: boolean;
        reason?: string;
    }[]>;
    clear(): void;
}
//# sourceMappingURL=approval.d.ts.map