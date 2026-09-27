import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { createFinding, requireComplianceScope } from "./compliance-utils";
export const consentManagerAgent = new Agent({
    id: "consent-manager",
    name: "consent-manager",
    instructions: "You validate data consent for fiscal PII processing.",
    model: openai("gpt-4o"),
});
export const consentManagerPort = {
    id: "consent-manager",
    name: "Consent Manager",
    description: "Data consent validation for fiscal PII processing",
    capabilities: ["compliance:consent", "compliance:privacy"],
    priority: 3,
    drenyraSubagent: null,
    execute: async (task, _config) => {
        requireComplianceScope({
            payload: task.payload,
            metadata: task.metadata,
            traceId: task.metadata?.traceId,
        });
        const findings = [];
        const rawRecords = (task.payload?.consentRecords ?? []);
        let validCount = 0;
        let expiredCount = 0;
        let revokedCount = 0;
        for (const record of rawRecords) {
            if (record.revokedAt) {
                revokedCount++;
                findings.push(createFinding({
                    severity: "high",
                    category: "consent.revoked",
                    message: `Consent revoked for subject ${record.subjectId} at ${record.revokedAt}`,
                    evidenceRefs: [record.subjectId],
                    recommendedAction: "Cease processing PII for this subject",
                }));
                continue;
            }
            if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
                expiredCount++;
                findings.push(createFinding({
                    severity: "medium",
                    category: "consent.expired",
                    message: `Consent expired for subject ${record.subjectId} at ${record.expiresAt}`,
                    evidenceRefs: [record.subjectId],
                    recommendedAction: "Renew consent or cease processing",
                }));
                continue;
            }
            if (record.dataCategories?.some((c) => /pii|personal|financial/i.test(c)) &&
                !record.lawfulBasis) {
                findings.push(createFinding({
                    severity: "high",
                    category: "consent.missing-basis",
                    message: `PII data for ${record.subjectId} lacks lawful basis`,
                    evidenceRefs: [record.subjectId],
                    recommendedAction: "Establish lawful basis for processing (Art. 6 GDPR)",
                }));
            }
            validCount++;
        }
        const report = {
            validCount,
            expiredCount,
            revokedCount,
            findings,
        };
        return {
            success: true,
            data: report,
            metrics: { duration: 0, tokensUsed: 0, cost: 0 },
            agentId: "consent-manager",
        };
    },
};
//# sourceMappingURL=consent-manager.agent.js.map