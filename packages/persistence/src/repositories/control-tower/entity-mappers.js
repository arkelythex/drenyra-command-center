export function fiscalCaseEntityToRow(entity) {
    const json = entity.toJSON();
    return {
        id: json.id,
        companyId: json.scope.companyId,
        companyRuc: json.scope.companyRuc,
        organizationId: json.scope.organizationId,
        period: json.scope.period,
        countryCode: json.scope.countryCode,
        type: json.type,
        status: json.status,
        title: json.title,
        description: json.description,
        riskLevel: json.riskLevel,
        riskScore: json.riskScore,
        autonomyLevel: json.autonomyLevel,
        createdBy: json.createdBy,
        createdAt: new Date(json.createdAt),
        updatedAt: new Date(json.updatedAt),
        metadata: json.metadata,
    };
}
export function evidenceItemEntityToRow(entity) {
    const json = entity.toJSON();
    return {
        id: json.id,
        caseId: json.caseId,
        companyId: json.scope.companyId,
        companyRuc: json.scope.companyRuc,
        organizationId: json.scope.organizationId,
        period: json.scope.period,
        countryCode: json.scope.countryCode,
        type: json.type,
        title: json.title,
        summary: json.summary,
        source: json.source,
        sourceRef: json.sourceRef,
        contentHash: json.contentHash,
        addedBy: json.addedBy,
        createdAt: new Date(json.createdAt),
        metadata: json.metadata,
    };
}
export function agentRunEntityToRow(entity) {
    const json = entity.toJSON();
    return {
        id: json.id,
        caseId: json.caseId,
        companyId: json.scope.companyId,
        companyRuc: json.scope.companyRuc,
        organizationId: json.scope.organizationId,
        period: json.scope.period,
        countryCode: json.scope.countryCode,
        agentType: json.agentType,
        status: json.status,
        startedBy: json.startedBy,
        startedAt: new Date(json.startedAt),
        completedAt: json.completedAt
            ? new Date(json.completedAt)
            : undefined,
        output: json.output,
        metadata: json.metadata,
    };
}
export function approvalRequestEntityToRow(entity) {
    const json = entity.toJSON();
    return {
        id: json.id,
        caseId: json.caseId,
        companyId: json.scope.companyId,
        companyRuc: json.scope.companyRuc,
        organizationId: json.scope.organizationId,
        period: json.scope.period,
        countryCode: json.scope.countryCode,
        status: json.status,
        title: json.title,
        description: json.description,
        autonomyLevel: json.autonomyLevel,
        requestedBy: json.requestedBy,
        requestedAt: new Date(json.requestedAt),
        decidedBy: json.decidedBy,
        decidedAt: json.decidedAt ? new Date(json.decidedAt) : undefined,
        decisionReason: json.decisionReason,
        diff: json.diff,
        metadata: json.metadata,
    };
}
export function auditEventEntityToRow(entity) {
    const json = entity.toJSON();
    return {
        id: json.id,
        caseId: json.caseId,
        companyId: json.scope.companyId,
        companyRuc: json.scope.companyRuc,
        organizationId: json.scope.organizationId,
        period: json.scope.period,
        countryCode: json.scope.countryCode,
        eventType: json.eventType,
        actorId: json.actorId,
        message: json.message,
        occurredAt: new Date(json.occurredAt),
        metadata: json.metadata,
    };
}
//# sourceMappingURL=entity-mappers.js.map