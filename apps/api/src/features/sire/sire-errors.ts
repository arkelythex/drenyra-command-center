/**
 * SIRE-specific error types.
 *
 * SireTimeoutError: thrown when a SUNAT API request times out (AbortError).
 * The caller (submission audit service) must transition to UNKNOWN, not FAILED.
 *
 * @see REQ-D-001 — Timeout → UNKNOWN
 */
export class SireTimeoutError extends Error {
	public readonly code = "SIRE_TIMEOUT" as const;

	constructor(message: string) {
		super(message);
		this.name = "SireTimeoutError";
	}
}
