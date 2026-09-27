export class GetEvidenceTimelineHandler {
    evidenceRepository;
    constructor(evidenceRepository) {
        this.evidenceRepository = evidenceRepository;
    }
    async execute(query) {
        const evidence = await this.evidenceRepository.findForOrganization(query.id, query.organizationId);
        if (!evidence) {
            return [];
        }
        const entries = [
            {
                action: "CREATED",
                previousStatus: "NONE",
                newStatus: evidence.status,
                actor: "system",
                timestamp: evidence.createdAt.toISOString(),
                metadata: { filename: evidence.filename, source: evidence.source },
            },
        ];
        if (evidence.validatedAt) {
            entries.push({
                action: "VALIDATED",
                previousStatus: "UPLOADED",
                newStatus: "VALIDATED",
                actor: evidence.validatedBy ?? "system",
                timestamp: evidence.validatedAt.toISOString(),
            });
        }
        if (evidence.errorMessage) {
            entries.push({
                action: "ERROR",
                previousStatus: evidence.status,
                newStatus: "ERROR",
                actor: "system",
                timestamp: evidence.updatedAt.toISOString(),
                metadata: { errorMessage: evidence.errorMessage },
            });
        }
        return entries;
    }
}
//# sourceMappingURL=get-timeline.handler.js.map