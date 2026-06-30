export class GetAuditTrail {
    auditRepo;
    constructor(auditRepo) {
        this.auditRepo = auditRepo;
    }
    async execute(input) {
        const entries = await this.auditRepo.findByAct(input.actId);
        const offset = input.offset ?? 0;
        const limit = input.limit ?? entries.length;
        const paginated = entries.slice(offset, offset + limit);
        return paginated.map((entry) => ({
            id: entry.id,
            actId: entry.actId,
            action: entry.action,
            actor: entry.actor,
            timestamp: entry.timestamp.toISOString(),
            evidence: [...entry.evidence],
            metadata: { ...entry.metadata },
        }));
    }
}
//# sourceMappingURL=GetAuditTrail.js.map