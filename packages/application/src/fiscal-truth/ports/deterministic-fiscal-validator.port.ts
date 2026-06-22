import type { DeterministicValidatorResultRecord } from "@arkelythex/domain";

/**
 * Deterministic validator port.
 *
 * Implementations MUST be deterministic for identical inputs and validator versions.
 */
export interface DeterministicFiscalValidatorPort {
	validate(input: unknown): Promise<DeterministicValidatorResultRecord>;
}
