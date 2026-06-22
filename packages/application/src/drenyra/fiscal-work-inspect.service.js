import { DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY, validateDrenyraFiscalWorkInspectRequest, } from "@arkelythex/domain/drenyra";
function defaultTraceId() {
    return `trace_drenyra_inspect_${crypto.randomUUID()}`;
}
function toScopeGuard(request) {
    return {
        organizationId: request.scope.organizationId,
        companyId: request.scope.companyId,
        companyRuc: request.scope.companyRuc,
        period: request.scope.period,
    };
}
export class DrenyraFiscalWorkInspectService {
    repository;
    createTraceId;
    constructor(repository, createTraceId = defaultTraceId) {
        this.repository = repository;
        this.createTraceId = createTraceId;
    }
    async inspect(request) {
        const traceId = this.createTraceId();
        const reason = validateDrenyraFiscalWorkInspectRequest(request);
        if (reason !== "ALLOWED") {
            return {
                status: "denied",
                reason,
                traceId,
                capability: DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
                redactedDetail: "Fiscal work inspection denied before data access.",
            };
        }
        const scope = toScopeGuard(request);
        const fiscalCase = await this.repository.getFiscalCaseById(request.workItemId, scope);
        if (!fiscalCase) {
            return {
                status: "not_found",
                reason: "WORK_ITEM_NOT_FOUND_OR_OUT_OF_SCOPE",
                traceId,
                capability: DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
                workItemId: request.workItemId,
                redactedDetail: "Fiscal work item was not found in the requested scope.",
            };
        }
        const [evidence, approvals] = await Promise.all([
            this.repository.listEvidence(fiscalCase.id, scope),
            this.repository.listApprovalRequests(fiscalCase.id, scope),
        ]);
        return {
            status: "success",
            reason: "ALLOWED",
            traceId,
            capability: DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
            workItemId: fiscalCase.id,
            data: {
                workItemId: fiscalCase.id,
                workItemStatus: fiscalCase.status,
                riskLevel: fiscalCase.riskLevel,
                evidenceRefs: evidence.map((item) => item.id),
                proposalOrApprovalState: approvals[0]?.status,
                accountantSummary: `${fiscalCase.title}: ${fiscalCase.description}`,
            },
            redactedDetail: "Fiscal work item inspected through backend authority.",
        };
    }
}
//# sourceMappingURL=fiscal-work-inspect.service.js.map