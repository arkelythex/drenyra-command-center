import type { ApprovalRequest } from "../types/approval-gate";
export declare class ApprovalStore {
    private readonly requests;
    save(request: ApprovalRequest): void;
    get(id: string): ApprovalRequest | undefined;
    update(id: string, partial: Partial<ApprovalRequest>): void;
    listByState(state: string): ApprovalRequest[];
    listByContext(context: {
        tenantId: string;
    }): ApprovalRequest[];
    getAll(): ApprovalRequest[];
}
//# sourceMappingURL=approval-store.d.ts.map