import type { Currency } from "@arkelythex/domain";

/**
 * Matches backend Money JSON serialization format.
 * Used at API boundaries before deserialization into Money value objects.
 *
 * @design Arkelythex Design System Elite — Money Model Pilot
 * @see packages/domain/src/value-objects/Money.ts
 */
export interface MoneyDTO {
	amount: number;
	cents: number;
	currency: Currency;
}
