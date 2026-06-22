import { Money } from "../../value-objects/Money";
import { DETRACCION_RATES } from "./rates";

export function shouldApplyDetraccion(
	totalAmount: Money,
	serviceCode: string,
): boolean {
	const DETRACCION_THRESHOLD = Money.fromAmount(700, "PEN");

	const hasValidCode = serviceCode in DETRACCION_RATES;

	const meetsThreshold =
		totalAmount.getCurrency() === "PEN" &&
		totalAmount.greaterThanOrEqual(DETRACCION_THRESHOLD);

	return hasValidCode && meetsThreshold;
}

export function shouldApplyRetencion(
	baseAmount: Money,
	isAgenteRetencion = false,
): boolean {
	const RETENCION_THRESHOLD = Money.fromAmount(700, "PEN");

	return (
		!isAgenteRetencion &&
		baseAmount.getCurrency() === "PEN" &&
		baseAmount.greaterThan(RETENCION_THRESHOLD)
	);
}

export function shouldApplyPercepcion(totalAmount: Money): boolean {
	const PERCEPCION_THRESHOLD = Money.fromAmount(700, "PEN");

	if (totalAmount.getCurrency() !== "PEN") {
		return false;
	}

	if (!totalAmount.isPositive()) {
		return false;
	}

	return totalAmount.greaterThanOrEqual(PERCEPCION_THRESHOLD);
}
