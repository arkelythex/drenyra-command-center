/**
 * Worker Scope Validator — Perimeter security guard for async job handlers.
 *
 * Every worker handler MUST call validateWorkerScope() as its FIRST operation.
 * This enforces that no business logic executes without a validated tenant scope,
 * closing the async attack surface (jobs queued with forged or missing scope data).
 *
 * Scope levels:
 * - "organization": organizationId required
 * - "tenant":        organizationId + companyId required
 * - "fiscal":        organizationId + companyId + period + countryCode required
 *
 * @module workers/scope-validator
 */

export type WorkerScopeLevel = "organization" | "tenant" | "fiscal";

const PERIOD_REGEX = /^\d{4}-\d{2}$/;

/**
 * Validates that a worker job payload includes the required scope fields.
 * Returns the scope object unchanged for chaining.
 *
 * @throws Error if required scope fields are missing or invalid
 */
export function validateWorkerScope<T extends Record<string, unknown>>(
	scope: T,
	level: WorkerScopeLevel,
): T {
	if (scope === null || scope === undefined) {
		throw new Error(
			"Worker scope required: job payload must include a validated scope object",
		);
	}

	const orgId = scope.organizationId;
	if (typeof orgId !== "string" || orgId.length === 0) {
		throw new Error(
			`Worker scope validation failed: organizationId is required (level: ${level})`,
		);
	}

	if (level === "tenant" || level === "fiscal") {
		const companyId = scope.companyId;
		if (typeof companyId !== "string" || companyId.length === 0) {
			throw new Error(
				`Worker scope validation failed: companyId is required (level: ${level})`,
			);
		}
	}

	if (level === "fiscal") {
		const period = scope.period;
		if (typeof period !== "string" || !PERIOD_REGEX.test(period)) {
			throw new Error(
				`Worker scope validation failed: period is required in YYYY-MM format (level: fiscal)`,
			);
		}

		const countryCode = scope.countryCode;
		if (typeof countryCode !== "string" || countryCode.length === 0) {
			throw new Error(
				`Worker scope validation failed: countryCode is required (level: fiscal)`,
			);
		}
	}

	return scope;
}
