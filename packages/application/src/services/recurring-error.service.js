const SEVERITY_RANK = {
    info: 0,
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
};
const severityFromRank = (rank) => {
    if (rank >= SEVERITY_RANK.critical)
        return "critical";
    if (rank >= SEVERITY_RANK.high)
        return "high";
    if (rank >= SEVERITY_RANK.medium)
        return "medium";
    if (rank >= SEVERITY_RANK.low)
        return "low";
    return "info";
};
const memoryMatchesError = (memory, errorCode) => {
    const normalized = errorCode.trim();
    return memory.tags.some((tag) => tag === normalized ||
        tag === `error:${normalized}` ||
        tag === `errorCode:${normalized}`);
};
export class RecurringErrorService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async evaluate(input) {
        const matching = [];
        for (const period of input.periods) {
            const memories = await this.repository.findByPeriod(input.scope, period);
            matching.push(...memories.filter((memory) => memoryMatchesError(memory, input.errorCode)));
        }
        const periods = [...new Set(matching.map((memory) => memory.period))].sort();
        const maxSeverityRank = matching.reduce((max, memory) => Math.max(max, SEVERITY_RANK[memory.severity]), SEVERITY_RANK.info);
        const recurrenceCount = periods.length;
        return {
            errorCode: input.errorCode,
            recurrenceCount,
            periods,
            severity: recurrenceCount >= 3 ? "high" : severityFromRank(maxSeverityRank),
            recommendedAction: recurrenceCount >= 3 ? "escalate" : recurrenceCount > 0 ? "review" : "monitor",
        };
    }
}
//# sourceMappingURL=recurring-error.service.js.map