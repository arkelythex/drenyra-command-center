import type { DeterministicValidatorResultRecord } from "@arkelythex/domain";
import type { DeterministicFiscalValidatorPort } from "@arkelythex/application/fiscal-truth";
import type { FiscalDeterministicValidationInput } from "./types";

const VALIDATOR_NAME = "sire-reproducibility";
const VALIDATOR_VERSION = "1.0.0";

export class SireReproducibilityValidator
	implements DeterministicFiscalValidatorPort
{
	async validate(input: unknown): Promise<DeterministicValidatorResultRecord> {
		const payload = (input ?? {}) as FiscalDeterministicValidationInput;
		const expected = payload.sire?.expectedDigest ?? "";
		const actual = payload.sire?.actualDigest ?? "";
		const isValid = expected.length > 0 && expected === actual;

		return {
			validatorName: VALIDATOR_NAME,
			validatorVersion: VALIDATOR_VERSION,
			inputHash: `${VALIDATOR_NAME}:${expected}:${actual}`,
			isValid,
			code: isValid ? "SIRE_REPRO_OK" : "SIRE_REPRO_MISMATCH",
			reason: isValid
				? "SIRE digest is reproducible for the same deterministic inputs."
				: "SIRE digest differs; fiscal replay is not reproducible.",
			severity: isValid ? "info" : "blocking",
			observedAt: new Date(0).toISOString(),
			payload: { expectedDigest: expected, actualDigest: actual },
		};
	}
}
