export class ListPendingClassificationHandler {
    evidenceRepository;
    constructor(evidenceRepository) {
        this.evidenceRepository = evidenceRepository;
    }
    async execute(query) {
        const items = await this.evidenceRepository.findPendingClassification(query.limit);
        return items
            .filter((e) => e.organizationId === String(query.organizationId))
            .map((evidence) => ({
            id: evidence.id,
            organizationId: evidence.organizationId,
            companyId: evidence.companyId,
            filename: evidence.filename,
            mimeType: evidence.mimeType,
            sizeBytes: evidence.sizeBytes,
            hash: evidence.hash,
            evidenceType: evidence.evidenceType,
            source: evidence.source,
            status: evidence.status,
            metadata: evidence.metadata,
            extractedData: evidence.extractedData,
            classifierResult: evidence.classifierResult,
            validatedAt: evidence.validatedAt?.toISOString(),
            validatedBy: evidence.validatedBy,
            errorMessage: evidence.errorMessage,
            tags: evidence.tags ? [...evidence.tags] : undefined,
            createdAt: evidence.createdAt.toISOString(),
            updatedAt: evidence.updatedAt.toISOString(),
        }));
    }
}
//# sourceMappingURL=list-pending.handler.js.map