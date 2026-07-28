/**
 * CAP-SIRE-01 Phase C.5 — SireRevertService
 *
 * Handles the reversibility window for ACCEPT_SUNAT resolutions.
 * - Validates that the revert window has not expired.
 * - Computes the revert deadline from the company's configured window hours.
 * - Creates evidence nodes for revert audit trail.
 */

export interface RevertWindowValidation {
	withinWindow: boolean;
	reason?: string;
}

export interface ValidateReversibilityInput {
	revertAvailableUntil: string | null;
}

export class SireRevertService {
	/**
	 * Validates whether the current time is within the reversibility window.
	 *
	 * @returns `{ withinWindow: true }` if now < revertAvailableUntil (inclusive).
	 *          `{ withinWindow: false }` otherwise, with a reason.
	 */
	static validateReversibilityWindow(
		input: ValidateReversibilityInput,
	): RevertWindowValidation {
		if (!input.revertAvailableUntil) {
			return {
				withinWindow: false,
				reason: "No reversibility window was set for this resolution.",
			};
		}

		const deadline = new Date(input.revertAvailableUntil);
		const now = new Date();

		if (isNaN(deadline.getTime())) {
			return {
				withinWindow: false,
				reason: "Invalid revert_available_until timestamp.",
			};
		}

		if (now > deadline) {
			return {
				withinWindow: false,
				reason: `Reversibility window expired at ${deadline.toISOString()}.`,
			};
		}

		return { withinWindow: true };
	}

	/**
	 * Computes the revert deadline from a configurable window in hours.
	 *
	 * @param windowHours — hours from now. Defaults to 24 per spec.
	 * @returns Date representing the deadline.
	 */
	static computeRevertDeadline(windowHours = 24): Date {
		return new Date(Date.now() + windowHours * 60 * 60 * 1000);
	}

	/**
	 * Computes the revert_available_until ISO string from the company's configured hours.
	 *
	 * @param windowHours — configured reversibility window in hours.
	 * @returns ISO 8601 timestamp string.
	 */
	static computeRevertAvailableUntil(windowHours = 24): string {
		return SireRevertService.computeRevertDeadline(windowHours).toISOString();
	}
}
