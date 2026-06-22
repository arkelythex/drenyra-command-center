import { GOVERNANCE_REVIEW_STATUS, PHASE_1_REQUIRED_ADR_IDS, } from "@arkelythex/domain";
export class GovernanceBundleService {
    governancePort;
    constructor(governancePort) {
        this.governancePort = governancePort;
    }
    async isApproved(bundle) {
        if (bundle.reviewStatus !== GOVERNANCE_REVIEW_STATUS.APPROVED) {
            return false;
        }
        if (!this.#hasRequiredAdrIds(bundle.adrIds)) {
            return false;
        }
        return this.governancePort.verify(bundle);
    }
    #hasRequiredAdrIds(adrIds) {
        return PHASE_1_REQUIRED_ADR_IDS.every((required) => adrIds.includes(required));
    }
}
//# sourceMappingURL=governance-bundle.service.js.map