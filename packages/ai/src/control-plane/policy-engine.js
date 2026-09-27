import { evaluateFiscalPolicy } from "./fiscal-policy";
import { resolvePolicyDecision, scopeMatches } from "./policy-resolution";
export class PolicyEngine {
    agentRegistry;
    toolRegistry;
    evidenceStore;
    permissionService;
    constructor(agentRegistry, toolRegistry, evidenceStore, permissionService) {
        this.agentRegistry = agentRegistry;
        this.toolRegistry = toolRegistry;
        this.evidenceStore = evidenceStore;
        this.permissionService = permissionService;
    }
    getPermissionService() {
        return this.permissionService;
    }
    async evaluate(input) {
        try {
            return await this.evaluateInternal(input);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "Unknown policy engine error";
            return {
                traceId: input.traceId,
                agentId: input.agentId,
                toolName: input.requestedTool,
                allowed: false,
                riskTier: "T0",
                requiresApproval: false,
                approvalState: "rejected",
                violations: [`PolicyEngine error: ${message}`],
                evidenceRefs: [],
            };
        }
    }
    async evaluateToolAction(input) {
        const scope = {
            tenantId: input.context.tenantId,
            organizationId: input.context.organizationId,
            companyId: input.context.companyId,
            ruc: input.context.ruc,
        };
        return this.evaluate({
            traceId: input.traceId,
            agentId: input.agentId,
            requestedScope: scope,
            requestedCapability: "advisory.review",
            requestedTool: input.toolName,
            action: input.action,
        });
    }
    async evaluateInternal(input) {
        const agent = await this.agentRegistry.getAgent(input.agentId);
        if (!agent) {
            return this.buildDenied(input, [
                `Agent "${input.agentId}" is not registered`,
            ]);
        }
        const tool = await this.toolRegistry.getTool(input.requestedTool);
        if (!tool) {
            return this.buildDenied(input, [
                `Tool "${input.requestedTool}" is not registered in ToolRegistry`,
            ]);
        }
        if (!scopeMatches(agent.tenantScope, input.requestedScope)) {
            return this.buildDenied(input, [
                "Tenant/RUC scope mismatch: requested scope does not match agent's registered scope",
            ]);
        }
        const decision = resolvePolicyDecision({
            traceId: input.traceId,
            registryEntry: agent,
            requestedScope: input.requestedScope,
            requestedCapability: input.requestedCapability,
            requestedTool: input.requestedTool,
        });
        let permissionOverride = null;
        if (this.permissionService) {
            const permResult = this.permissionService.canExecute(input.requestedTool, {
                companyId: input.requestedScope.companyId,
                organizationId: input.requestedScope.organizationId,
            });
            if (permResult.effect === "DENY") {
                return this.buildDenied(input, [
                    permResult.reason ??
                        `Tool "${input.requestedTool}" is denied by permission policy`,
                ]);
            }
            if (permResult.effect === "ALLOW") {
                permissionOverride = "ALLOW";
            }
        }
        const fiscalPolicy = evaluateFiscalPolicy({
            traceId: input.traceId,
            toolName: input.requestedTool,
            action: input.action,
            tenantScope: input.fiscalPolicy?.tenantScope ?? input.requestedScope,
            ...input.fiscalPolicy,
        });
        const violations = [...decision.violations, ...fiscalPolicy.violations];
        const allowed = decision.allowed && fiscalPolicy.allowed;
        const requiresApproval = permissionOverride === "ALLOW"
            ? fiscalPolicy.requiresApproval
            : tool.requiresApproval || fiscalPolicy.requiresApproval;
        await this.persistEvidence(input, decision, fiscalPolicy);
        return {
            traceId: decision.traceId,
            agentId: input.agentId,
            toolName: input.requestedTool,
            allowed,
            riskTier: tool.riskTier,
            requiresApproval,
            approvalState: allowed
                ? fiscalPolicy.requiresApproval
                    ? "proposed"
                    : decision.approvalState
                : "rejected",
            violations,
            evidenceRefs: [
                input.traceId,
                ...(input.fiscalPolicy?.evidenceRefs ?? []),
            ],
            fiscalPolicy,
        };
    }
    async persistEvidence(input, decision, fiscalPolicy) {
        const bundle = {
            traceId: input.traceId,
            tenantScope: input.requestedScope,
            redactionStatus: "redacted",
            toolCalls: [input.requestedTool],
            rationale: this.buildRationale(decision.violations, fiscalPolicy),
            evidence: [],
        };
        this.evidenceStore.save(bundle);
    }
    buildRationale(baseViolations, fiscalPolicy) {
        const violations = [...baseViolations, ...fiscalPolicy.violations];
        const status = violations.length > 0 ? "Policy denied" : "Policy approved";
        return `${status}; fiscalPolicy=${JSON.stringify({
            sunatImpact: fiscalPolicy.sunatImpact,
            approvalLevel: fiscalPolicy.approvalLevel,
            violations: fiscalPolicy.violations,
        })}`;
    }
    buildDenied(input, reasons) {
        return {
            traceId: input.traceId,
            agentId: input.agentId,
            toolName: input.requestedTool,
            allowed: false,
            riskTier: "T0",
            requiresApproval: false,
            approvalState: "rejected",
            violations: reasons,
            evidenceRefs: [],
        };
    }
}
//# sourceMappingURL=policy-engine.js.map