import type { DeterministicFiscalValidatorPort } from "@drenyra/application/fiscal-truth";
import type { DeterministicValidatorResultRecord } from "@drenyra/domain";
import { Money } from "@drenyra/domain";
import type { FiscalDeterministicValidationInput } from "./types";

const VALIDATOR_NAME = "retention-detraction";
const VALIDATOR_VERSION = "1.0.0";

export class RetentionDetractionValidator
	implements DeterministicFiscalValidatorPort
{
	async validate(input: unknown): Promise<DeterministicValidatorResultRecord> {
		const payload = (input ?? {}) as FiscalDeterministicValidationInput;
		const tax = payload.retentionDetraction;
		const base = Money.fromAmount(tax?.baseAmount ?? 0, "PEN");

		const expectedRetention = base.multiply(tax?.retentionRate ?? 0.03);
		const expectedDetraction = base.multiply(tax?.detractionRate ?? 0.1);

		const actualRetention = Money.fromAmount(tax?.retentionAmount ?? 0, "PEN");
		const actualDetraction = Money.fromAmount(
			tax?.detractionAmount ?? 0,
			"PEN",
		);

		const isValid =
			actualRetention.equals(expectedRetention) &&
			actualDetraction.equals(expectedDetraction);

		return {
			validatorName: VALIDATOR_NAME,
			validatorVersion: VALIDATOR_VERSION,
			inputHash: `${VALIDATOR_NAME}:${base.getCents()}`,
			isValid,
			code: isValid ? "RET_DET_OK" : "RET_DET_MISMATCH",
			reason: isValid
				? "Retention and detraction amounts match deterministic rates."
				: "Retention/detraction amounts do not match deterministic rates.",
			severity: isValid ? "info" : "blocking",
			observedAt: new Date(0).toISOString(),
			payload: {
				expectedRetentionCents: expectedRetention.getCents(),
				expectedDetractionCents: expectedDetraction.getCents(),
			},
		};
	}
}
