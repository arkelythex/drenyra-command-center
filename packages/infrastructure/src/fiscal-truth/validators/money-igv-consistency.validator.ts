import type { DeterministicFiscalValidatorPort } from "@drenyra/application/fiscal-truth";
import type { DeterministicValidatorResultRecord } from "@drenyra/domain";
import { Money } from "@drenyra/domain";
import type { FiscalDeterministicValidationInput } from "./types";

const VALIDATOR_NAME = "money-igv-consistency";
const VALIDATOR_VERSION = "1.0.0";

export class MoneyIgvConsistencyValidator
	implements DeterministicFiscalValidatorPort
{
	async validate(input: unknown): Promise<DeterministicValidatorResultRecord> {
		const payload = (input ?? {}) as FiscalDeterministicValidationInput;
		const currency = payload.currency ?? "PEN";
		const subtotal = Money.fromAmount(payload.subtotalAmount ?? 0, currency);
		const igv = Money.fromAmount(payload.igvAmount ?? 0, currency);
		const total = Money.fromAmount(payload.totalAmount ?? 0, currency);
		const expectedIgv = subtotal.multiply(0.18);
		const expectedTotal = subtotal.add(expectedIgv);
		const isValid = igv.equals(expectedIgv) && total.equals(expectedTotal);

		return {
			validatorName: VALIDATOR_NAME,
			validatorVersion: VALIDATOR_VERSION,
			inputHash: `${VALIDATOR_NAME}:${subtotal.getCents()}:${igv.getCents()}:${total.getCents()}`,
			isValid,
			code: isValid ? "MONEY_IGV_OK" : "MONEY_IGV_MISMATCH",
			reason: isValid
				? "Subtotal, IGV, and total match deterministic Money calculation."
				: "Subtotal, IGV, and total violate deterministic Money/IGV invariants.",
			severity: isValid ? "info" : "blocking",
			observedAt: new Date(0).toISOString(),
			payload: {
				subtotalCents: subtotal.getCents(),
				igvCents: igv.getCents(),
				totalCents: total.getCents(),
				expectedIgvCents: expectedIgv.getCents(),
				expectedTotalCents: expectedTotal.getCents(),
			},
		};
	}
}
