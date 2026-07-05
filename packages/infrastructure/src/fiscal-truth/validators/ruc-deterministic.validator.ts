import type { DeterministicValidatorResultRecord } from "@drenyra/domain";
import { RUC } from "@drenyra/domain";
import type { DeterministicFiscalValidatorPort } from "@drenyra/application/fiscal-truth";
import type { FiscalDeterministicValidationInput } from "./types";

const VALIDATOR_NAME = "ruc-deterministic";
const VALIDATOR_VERSION = "1.0.0";

export class RucDeterministicValidator
	implements DeterministicFiscalValidatorPort
{
	async validate(input: unknown): Promise<DeterministicValidatorResultRecord> {
		const payload = (input ?? {}) as FiscalDeterministicValidationInput;
		const ruc = payload.ruc?.trim() ?? "";
		const isValid = RUC.isValid(ruc);

		return {
			validatorName: VALIDATOR_NAME,
			validatorVersion: VALIDATOR_VERSION,
			inputHash: `${VALIDATOR_NAME}:${ruc}`,
			isValid,
			code: isValid ? "RUC_VALID" : "RUC_INVALID",
			reason: isValid
				? "RUC checksum is valid under modulo-11."
				: "RUC checksum failed modulo-11 validation.",
			severity: isValid ? "info" : "blocking",
			observedAt: new Date(0).toISOString(),
			payload: { ruc },
		};
	}
}
