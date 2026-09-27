import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { createFinding, requireComplianceScope } from "./compliance-utils";
const defaultRequirements = [
    {
        id: "lawful_basis",
        check: (_ctx, payload) => ({
            requirement: "Lawful basis for processing",
            status: payload.lawfulBasis ? "pass" : "fail",
            detail: payload.lawfulBasis
                ? `Lawful basis: ${payload.lawfulBasis}`
                : "No lawful basis specified",
        }),
    },
    {
        id: "data_minimization",
        check: (_ctx, payload) => {
            const fields = (payload.collectedFields ?? []);
            const required = (payload.requiredFields ?? []);
            const excess = fields.filter((f) => !required.includes(f));
            return {
                requirement: "Data minimization (Art. 5(1)(c))",
                status: excess.length === 0 ? "pass" : "partial",
                detail: excess.length > 0
                    ? `${excess.length} unnecessary fields collected: ${excess.join(", ")}`
                    : "Only required fields collected",
            };
        },
    },
    {
        id: "right_to_deletion",
        check: (_ctx, payload) => {
            const hasFiscalEvidence = payload.hasFiscalEvidence ?? false;
            if (hasFiscalEvidence) {
                return {
                    requirement: "Right to deletion / erasure (Art. 17)",
                    status: "exception",
                    detail: "Art. 17(3) exception: fiscal evidence retention overrides deletion request",
                };
            }
            return {
                requirement: "Right to deletion / erasure (Art. 17)",
                status: "pass",
                detail: "No fiscal evidence — standard deletion applies",
            };
        },
    },
    {
        id: "right_of_access",
        check: (_ctx, payload) => ({
            requirement: "Right of access (Art. 15)",
            status: payload.accessMechanism ? "pass" : "fail",
            detail: payload.accessMechanism
                ? `Access mechanism: ${payload.accessMechanism}`
                : "No access mechanism defined",
        }),
    },
    {
        id: "breach_notification",
        check: (_ctx, payload) => ({
            requirement: "Breach notification (Art. 33-34)",
            status: payload.breachProcedure ? "pass" : "fail",
            detail: payload.breachProcedure
                ? `Breach procedure: ${payload.breachProcedure}`
                : "No breach notification procedure defined",
        }),
    },
];
export const gdprCheckerAgent = new Agent({
    id: "gdpr-checker",
    name: "gdpr-checker",
    instructions: "You check GDPR/data protection compliance requirements.",
    model: openai("gpt-4o"),
});
export const gdprCheckerPort = {
    id: "gdpr-checker",
    name: "GDPR Checker",
    description: "GDPR/data protection compliance checks",
    capabilities: ["compliance:gdpr", "compliance:data-protection"],
    priority: 3,
    drenyraSubagent: null,
    execute: async (task, _config) => {
        const context = requireComplianceScope({
            payload: task.payload,
            metadata: task.metadata,
            traceId: task.metadata?.traceId,
        });
        const findings = [];
        const checks = [];
        const violations = [];
        const payload = (task.payload ?? {});
        for (const req of defaultRequirements) {
            const check = req.check(context, payload);
            checks.push(check);
            if (check.status === "fail") {
                violations.push({
                    requirement: check.requirement,
                    severity: "high",
                    detail: check.detail,
                });
                findings.push(createFinding({
                    severity: "high",
                    category: `gdpr.${req.id}`,
                    message: check.detail,
                    recommendedAction: `Implement ${check.requirement}`,
                }));
            }
        }
        const passCount = checks.filter((c) => c.status === "pass" || c.status === "exception").length;
        const score = Math.round((passCount / Math.max(1, checks.length)) * 100);
        const report = { checks, violations, findings, score };
        return {
            success: violations.length === 0,
            data: report,
            metrics: { duration: 0, tokensUsed: 0, cost: 0 },
            agentId: "gdpr-checker",
        };
    },
};
//# sourceMappingURL=gdpr-checker.agent.js.map