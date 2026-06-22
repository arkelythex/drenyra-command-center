/**
 * ExchangeRate Value Object
 *
 * Represents a currency exchange rate for a given date.
 * All rates are positive numbers using integer representation with 4 decimal places
 * (e.g., 37250 = 3.7250 PEN per USD).
 *
 * Immutable — once created, it cannot be modified.
 */

const ISO_CURRENCY_PATTERN = /^[A-Z]{3}$/;

export class ExchangeRate {
	private constructor(
		private readonly _date: Date,
		private readonly _currencyFrom: string,
		private readonly _currencyTo: string,
		private readonly _buy: number,
		private readonly _sell: number,
		private readonly _sunatReference: number | null,
	) {
		Object.freeze(this);
	}

	static create(
		date: Date,
		currencyFrom: string,
		currencyTo: string,
		buy: number,
		sell: number,
		sunatReference: number | null = null,
	): ExchangeRate {
		if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
			throw new InvalidExchangeRateError(
				currencyFrom,
				currencyTo,
				"Invalid date",
			);
		}

		const normalizedFrom = currencyFrom.toUpperCase();
		const normalizedTo = currencyTo.toUpperCase();

		if (!ISO_CURRENCY_PATTERN.test(normalizedFrom)) {
			throw new InvalidExchangeRateError(
				currencyFrom,
				currencyTo,
				`Invalid source currency code: ${currencyFrom}`,
			);
		}

		if (!ISO_CURRENCY_PATTERN.test(normalizedTo)) {
			throw new InvalidExchangeRateError(
				currencyFrom,
				currencyTo,
				`Invalid target currency code: ${currencyTo}`,
			);
		}

		if (normalizedFrom === normalizedTo) {
			throw new InvalidExchangeRateError(
				currencyFrom,
				currencyTo,
				"Source and target currencies must be different",
			);
		}

		if (!Number.isFinite(buy) || buy <= 0) {
			throw new InvalidExchangeRateError(
				currencyFrom,
				currencyTo,
				`Buy rate must be positive: ${buy}`,
			);
		}

		if (!Number.isFinite(sell) || sell <= 0) {
			throw new InvalidExchangeRateError(
				currencyFrom,
				currencyTo,
				`Sell rate must be positive: ${sell}`,
			);
		}

		if (
			sunatReference !== null &&
			(!Number.isFinite(sunatReference) || sunatReference <= 0)
		) {
			throw new InvalidExchangeRateError(
				currencyFrom,
				currencyTo,
				`SUNAT reference rate must be positive: ${sunatReference}`,
			);
		}

		return new ExchangeRate(
			date,
			normalizedFrom,
			normalizedTo,
			buy,
			sell,
			sunatReference,
		);
	}

	// --- Getters ---

	get date(): Date {
		return new Date(this._date.getTime());
	}

	get currencyFrom(): string {
		return this._currencyFrom;
	}

	get currencyTo(): string {
		return this._currencyTo;
	}

	get buy(): number {
		return this._buy;
	}

	get sell(): number {
		return this._sell;
	}

	get sunatReference(): number | null {
		return this._sunatReference;
	}

	/**
	 * Returns the rate to use for conversion.
	 * Prefers SUNAT reference rate, falls back to buy rate.
	 */
	getRateForConversion(): number {
		return this._sunatReference ?? this._buy;
	}

	/**
	 * Converts an amount from the source currency to the target currency.
	 */
	convert(sourceValue: number): number {
		if (!Number.isFinite(sourceValue) || sourceValue < 0) {
			throw new InvalidExchangeRateError(
				this._currencyFrom,
				this._currencyTo,
				`Amount must be non-negative: ${sourceValue}`,
			);
		}
		return sourceValue * this.getRateForConversion();
	}

	// --- Equality & Serialization ---

	equals(other: ExchangeRate | null | undefined): boolean {
		if (!other) return false;
		return (
			this._date.getTime() === other._date.getTime() &&
			this._currencyFrom === other._currencyFrom &&
			this._currencyTo === other._currencyTo &&
			this._buy === other._buy &&
			this._sell === other._sell &&
			this._sunatReference === other._sunatReference
		);
	}

	toString(): string {
		return `ExchangeRate(${this._currencyFrom}/${this._currencyTo} @ ${this._buy}/${this._sell})`;
	}

	toJSON(): {
		date: string;
		currencyFrom: string;
		currencyTo: string;
		buy: number;
		sell: number;
		sunatReference: number | null;
	} {
		return {
			date: this._date.toISOString(),
			currencyFrom: this._currencyFrom,
			currencyTo: this._currencyTo,
			buy: this._buy,
			sell: this._sell,
			sunatReference: this._sunatReference,
		};
	}

	static fromJSON(json: {
		date: string;
		currencyFrom: string;
		currencyTo: string;
		buy: number;
		sell: number;
		sunatReference?: number | null;
	}): ExchangeRate {
		return ExchangeRate.create(
			new Date(json.date),
			json.currencyFrom,
			json.currencyTo,
			json.buy,
			json.sell,
			json.sunatReference ?? null,
		);
	}
}

// --- Errors ---

export class InvalidExchangeRateError extends Error {
	constructor(
		public readonly currencyFrom: string,
		public readonly currencyTo: string,
		message?: string,
	) {
		super(message || `Invalid exchange rate: ${currencyFrom}/${currencyTo}`);
		this.name = "InvalidExchangeRateError";
		Object.setPrototypeOf(this, InvalidExchangeRateError.prototype);
	}

	toJSON(): Record<string, unknown> {
		return {
			name: this.name,
			message: this.message,
			currencyFrom: this.currencyFrom,
			currencyTo: this.currencyTo,
			code: "INVALID_EXCHANGE_RATE",
		};
	}
}
