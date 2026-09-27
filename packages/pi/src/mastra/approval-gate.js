export class ApprovalGateEngine {
    store;
    notifyCallback;
    constructor(store, governanceValidator, notifyCallback) {
        this.store = store;
        this.governanceValidator = governanceValidator;
        this.notifyCallback = notifyCallback;
    }
    async executeTool(tool, input, context) {
        const needsApproval = tool.needsApproval?.(input, context) ?? false;
        const isFiscal = tool.approvalLevel === "fiscal_gate";
        const isGate = tool.approvalLevel === "gate";
        if (!needsApproval && !isGate && !isFiscal) {
            try {
                const data = await tool.execute(input, context);
                return { success: true, data };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                };
            }
        }
        const governanceResult = isFiscal
            ? await this.governanceValidator?.(tool.name, input, context)
            : undefined;
        const request = {
            id: crypto.randomUUID(),
            toolName: tool.name,
            input,
            context,
            approvalLevel: tool.approvalLevel,
            state: "proposed",
            proposedAt: new Date(),
            governanceResult,
        };
        this.store.save(request);
        if (isFiscal || isGate) {
            await this.notifyCallback?.(request);
            return {
                success: false,
                error: `Approval required: ${request.id}`,
            };
        }
        try {
            const data = await tool.execute(input, context);
            this.store.update(request.id, {
                state: "approved",
                decidedAt: new Date(),
                reviewerId: "system",
                reviewerRole: "auto-notify",
            });
            await this.notifyCallback?.(request);
            return { success: true, data };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
    async approve(approvalId, reviewerId, reviewerRole) {
        const request = this.store.get(approvalId);
        if (!request) {
            return { success: false, error: `Approval ${approvalId} not found` };
        }
        if (request.state !== "proposed" && request.state !== "validated") {
            return {
                success: false,
                error: `Approval ${approvalId} is in state '${request.state}', cannot approve`,
            };
        }
        this.store.update(approvalId, {
            state: "approved",
            decidedAt: new Date(),
            reviewerId,
            reviewerRole,
        });
        return { success: true, data: this.store.get(approvalId) };
    }
    async reject(approvalId, reviewerId, rationale) {
        const request = this.store.get(approvalId);
        if (!request) {
            return { success: false, error: `Approval ${approvalId} not found` };
        }
        this.store.update(approvalId, {
            state: "rejected",
            decidedAt: new Date(),
            reviewerId,
            rationale,
        });
        return { success: true, data: this.store.get(approvalId) };
    }
    getPendingApprovals(context) {
        const pending = this.store
            .getAll()
            .filter((r) => r.state === "proposed" || r.state === "validated");
        if (!context) {
            return pending;
        }
        return pending.filter((r) => r.context.tenantId === context.tenantId);
    }
}
//# sourceMappingURL=approval-gate.js.map