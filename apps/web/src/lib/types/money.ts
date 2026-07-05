import type { Currency } from "@drenyra/domain";

/**
 * Matches backend Money JSON serialization format.
 * Used at API boundaries before deserialization into Money value objects.
 *
 * @design Drenyra Design System Elite — Money Model Pilot
 * @see packages/domain/src/value-objects/Money.ts
 */
export interface MoneyDTO {
	amount: number;
	cents: number;
	currency: Currency;
}
