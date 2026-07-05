import type { DeterministicFiscalValidatorPort } from "@drenyra/application/fiscal-truth";
import type { DeterministicValidatorResultRecord } from "@drenyra/domain";
import { RUC } from "@drenyra/domain";
import type { FiscalDeterministicValidationInput } from "./types";

const VALIDATOR_NAME = "ubl-2.1";
const VALIDATOR_VERSION = "1.0.0";

export class Ubl21Validator implements DeterministicFiscalValidatorPort {
	async validate(input: unknown): Promise<DeterministicValidatorResultRecord> {
		const payload = (input ?? {}) as FiscalDeterministicValidationInput;
		const ubl = payload.ublInvoice;
		const hasMinimalFields =
			Boolean(ubl?.invoiceId) &&
			Boolean(ubl?.issueDate) &&
			typeof ubl?.totalAmount === "number";
		const isValid =
			hasMinimalFields &&
			ubl?.ublVersion === "2.1" &&
			RUC.isValid(ubl?.supplierRuc ?? "");

		return {
			validatorName: VALIDATOR_NAME,
			validatorVersion: VALIDATOR_VERSION,
			inputHash: `${VALIDATOR_NAME}:${ubl?.invoiceId ?? ""}`,
			isValid,
			code: isValid ? "UBL_21_OK" : "UBL_21_INVALID",
			reason: isValid
				? "UBL 2.1 mandatory invoice fields are consistent."
				: "UBL 2.1 mandatory invoice fields are missing or invalid.",
			severity: isValid ? "info" : "blocking",
			observedAt: new Date(0).toISOString(),
			payload: { ublVersion: ubl?.ublVersion, supplierRuc: ubl?.supplierRuc },
		};
	}
}
