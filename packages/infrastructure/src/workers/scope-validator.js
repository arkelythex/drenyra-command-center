const PERIOD_REGEX = /^\d{4}-\d{2}$/;
export function validateWorkerScope(scope, level) {
    if (scope === null || scope === undefined) {
        throw new Error("Worker scope required: job payload must include a validated scope object");
    }
    const orgId = scope.organizationId;
    if (typeof orgId !== "string" || orgId.length === 0) {
        throw new Error(`Worker scope validation failed: organizationId is required (level: ${level})`);
    }
    if (level === "tenant" || level === "fiscal") {
        const companyId = scope.companyId;
        if (typeof companyId !== "string" || companyId.length === 0) {
            throw new Error(`Worker scope validation failed: companyId is required (level: ${level})`);
        }
    }
    if (level === "fiscal") {
        const period = scope.period;
        if (typeof period !== "string" || !PERIOD_REGEX.test(period)) {
            throw new Error(`Worker scope validation failed: period is required in YYYY-MM format (level: fiscal)`);
        }
        const countryCode = scope.countryCode;
        if (typeof countryCode !== "string" || countryCode.length === 0) {
            throw new Error(`Worker scope validation failed: countryCode is required (level: fiscal)`);
        }
    }
    return scope;
}
//# sourceMappingURL=scope-validator.js.map