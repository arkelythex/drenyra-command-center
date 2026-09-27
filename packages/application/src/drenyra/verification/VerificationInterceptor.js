import { runVerificationRules } from "./rules/registry";
function newId(prefix) {
    return `${prefix}_${crypto.randomUUID()}`;
}
function nowIso() {
    return new Date().toISOString();
}
function computeAdjustedConfidence(originalConfidence, integrityScore, hasFailures) {
    let adjusted = originalConfidence;
    if (integrityScore >= 90) {
        adjusted = Math.max(adjusted, originalConfidence);
    }
    else if (integrityScore >= 70) {
        adjusted = originalConfidence * 0.9;
    }
    else {
        adjusted = originalConfidence * 0.75;
    }
    if (hasFailures) {
        adjusted = Math.min(adjusted, 50);
    }
    return Math.round(Math.max(0, Math.min(100, adjusted)));
}
function computeMetrics(findings, integrityScore) {
    const passed = findings.filter((f) => f.status === "pass").length;
    const failed = findings.filter((f) => f.status === "fail").length;
    const inconclusive = findings.filter((f) => f.status === "inconclusive").length;
    const bypassed = findings.filter((f) => f.status === "bypassed").length;
    const perRuleMetrics = {};
    for (const f of findings) {
        if (!perRuleMetrics[f.rule]) {
            perRuleMetrics[f.rule] = {
                passed: 0,
                failed: 0,
                inconclusive: 0,
                total: 0,
            };
        }
        perRuleMetrics[f.rule].total++;
        if (f.status === "pass")
            perRuleMetrics[f.rule].passed++;
        else if (f.status === "fail")
            perRuleMetrics[f.rule].failed++;
        else if (f.status === "inconclusive")
            perRuleMetrics[f.rule].inconclusive++;
    }
    return {
        totalFindings: findings.length,
        passed,
        failed,
        inconclusive,
        bypassed,
        integrityScore,
        perRuleMetrics,
    };
}
function buildSummary(findings, integrityScore) {
    const passed = findings.filter((f) => f.status === "pass").length;
    const failed = findings.filter((f) => f.status === "fail").length;
    const total = findings.length;
    if (total === 0)
        return "No se ejecutaron verificaciones.";
    const parts = [];
    parts.push(`${passed}/${total} verificaciones pasaron (${integrityScore}% integridad).`);
    if (failed > 0)
        parts.push(`${failed} discrepancia(s) encontrada(s) — se requiere revisión humana.`);
    const inconclusive = findings.filter((f) => f.status === "inconclusive").length;
    if (inconclusive > 0)
        parts.push(`${inconclusive} verificación(es) inconclusa(s) por datos insuficientes.`);
    return parts.join(" ");
}
export function verifyAgentRunOutput(output, context) {
    const findings = runVerificationRules(output.findings, output.riskLevel, {
        ...context,
        summary: context.summary ?? output.summary,
        recommendedActions: context.recommendedActions ?? output.recommendedActions,
    });
    const passed = findings.filter((f) => f.status === "pass").length;
    const failed = findings.filter((f) => f.status === "fail").length;
    const total = findings.length;
    const integrityScore = total > 0 ? Math.round((passed / total) * 100) : 100;
    const adjustedConfidence = computeAdjustedConfidence(output.confidence * 100, integrityScore, failed > 0);
    const auditEvents = findings
        .filter((f) => f.status === "bypassed")
        .map((f) => ({
        eventType: "VERIFICATION_BYPASSED",
        finding: f.finding,
        rule: f.rule,
        reason: `Finding cualitativo sin regla aplicable (${f.bypassReason})`,
        actorId: f.authorizedBy.userId,
        occurredAt: nowIso(),
        detail: f.detail,
    }));
    return {
        id: newId("verification"),
        verifiedAt: nowIso(),
        adjustedConfidence,
        findings,
        auditEvents,
        integrityScore,
        summary: buildSummary(findings, integrityScore),
        metrics: computeMetrics(findings, integrityScore),
    };
}
//# sourceMappingURL=VerificationInterceptor.js.map