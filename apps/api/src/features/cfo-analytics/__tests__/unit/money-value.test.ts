import { Money } from "@drenyra/domain";
import { describe, expect, it } from "vitest";
import { toMoneyValue } from "../../cfo-analytics.types";

describe("CFO analytics money values", () => {
	it.each([
		[0, "PEN", "0.00", "PEN"],
		[1234.56, "PEN", "1234.56", "PEN"],
		[25.5, "USD", "25.50", "USD"],
	])("preserves amount and currency for %s %s", (amount, currency, expectedAmount, expectedCurrency) => {
		const value = toMoneyValue(Money.fromAmount(amount, currency as "PEN" | "USD"));

		expect(value.amount).toBe(expectedAmount);
		expect(value.currency).toBe(expectedCurrency);
		expect(value.formatted).toBeTruthy();
	});
});
