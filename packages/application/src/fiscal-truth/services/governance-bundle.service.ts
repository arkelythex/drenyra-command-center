import type { GovernanceBundleReference } from "@arkelythex/domain";
import {
	GOVERNANCE_REVIEW_STATUS,
	PHASE_1_REQUIRED_ADR_IDS,
} from "@arkelythex/domain";
import type { GovernanceBundlePort } from "../ports/governance-bundle.port";

/**
 * Validates governance bundle eligibility for authoritative promotion.
 */
export class GovernanceBundleService {
	constructor(private readonly governancePort: GovernanceBundlePort) {}

	async isApproved(bundle: GovernanceBundleReference): Promise<boolean> {
		if (bundle.reviewStatus !== GOVERNANCE_REVIEW_STATUS.APPROVED) {
			return false;
		}

		if (!this.#hasRequiredAdrIds(bundle.adrIds)) {
			return false;
		}

		return this.governancePort.verify(bundle);
	}

	/**
	 * Validates that the governance bundle references all Phase 1 required ADRs.
	 */
	#hasRequiredAdrIds(adrIds: string[]): boolean {
		return PHASE_1_REQUIRED_ADR_IDS.every((required) =>
			adrIds.includes(required),
		);
	}
}
