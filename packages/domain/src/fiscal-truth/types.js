import { RUC } from "../value-objects/RUC";
import { DETERMINISTIC_REASON_CODE, EVIDENCE_NODE_KIND, } from "./constants";
export function isFiscalTruthScope(value) {
    return (value.companyId.trim().length > 0 &&
        RUC.isValid(value.companyRuc) &&
        /^\d{4}-(0[1-9]|1[0-2])$/.test(value.period) &&
        value.countryCode.trim().length > 0);
}
export function canPromoteAuthoritativeTruth(input) {
    const hasEvidenceRoot = (input.evidenceRootNodeId ?? "").trim().length > 0;
    if (!hasEvidenceRoot) {
        return false;
    }
    if (input.evidenceNodeKind === EVIDENCE_NODE_KIND.AI_SUGGESTION) {
        return false;
    }
    return (input.hasDeterministicValidation &&
        input.hasRequiredApproval &&
        input.hasSameScopeGraphLinks === true &&
        input.hasApprovedGovernancePolicyDecision === true &&
        input.hasHumanMaterialApproval === true);
}
export function toReplayFailureResult(failureCode, message) {
    return {
        success: false,
        reproducedEventId: null,
        reproducedOutcomeHash: null,
        failureCode,
        message,
    };
}
function calculateIgvCentsFromBasisPoints(subtotalCents) {
    const igvBasisPoints = 1800;
    const basisPointDenominator = 10000;
    return Math.floor((subtotalCents * igvBasisPoints + basisPointDenominator / 2) /
        basisPointDenominator);
}
export function buildRucIgvDeterministicResult(input) {
    const subtotalCents = input.subtotal.getCents();
    const igvCents = input.igv.getCents();
    const expectedIgvCents = calculateIgvCentsFromBasisPoints(subtotalCents);
    const isRucValid = RUC.isValid(input.ruc.toString());
    if (!isRucValid) {
        return {
            validatorVersion: input.validatorVersion,
            isValid: false,
            code: DETERMINISTIC_REASON_CODE.RUC_INVALID,
            reason: "RUC checksum is invalid for authoritative fiscal promotion.",
            ruc: input.ruc.toString(),
            subtotalCents,
            igvCents,
            expectedIgvCents,
        };
    }
    if (igvCents !== expectedIgvCents) {
        return {
            validatorVersion: input.validatorVersion,
            isValid: false,
            code: DETERMINISTIC_REASON_CODE.IGV_MISMATCH,
            reason: "IGV cents do not match deterministic 18% rule.",
            ruc: input.ruc.toString(),
            subtotalCents,
            igvCents,
            expectedIgvCents,
        };
    }
    return {
        validatorVersion: input.validatorVersion,
        isValid: true,
        code: DETERMINISTIC_REASON_CODE.VALIDATION_OK,
        reason: "RUC and IGV deterministic checks passed.",
        ruc: input.ruc.toString(),
        subtotalCents,
        igvCents,
        expectedIgvCents,
    };
}
//# sourceMappingURL=types.js.map