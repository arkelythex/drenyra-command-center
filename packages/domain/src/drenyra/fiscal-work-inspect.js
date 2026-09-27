import { RUC } from "../value-objects/RUC";
export const DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY = "drenyra.fiscal-work.inspect";
export function validateDrenyraFiscalWorkInspectRequest(request) {
    const { scope } = request;
    if (!scope.organizationId.trim() ||
        !scope.companyId.trim() ||
        !scope.companyRuc.trim() ||
        !scope.period.trim() ||
        !scope.actorId.trim() ||
        !request.workItemId.trim()) {
        return "MISSING_SCOPE";
    }
    if (!RUC.isValid(scope.companyRuc) ||
        !/^\d{4}-(0[1-9]|1[0-2])$/.test(scope.period)) {
        return "INVALID_SCOPE";
    }
    if (!request.grantedCapabilities.includes(DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY)) {
        return "CAPABILITY_DENIED";
    }
    return "ALLOWED";
}
//# sourceMappingURL=fiscal-work-inspect.js.map