const ISO_CURRENCY_PATTERN = /^[A-Z]{3}$/;
export class ExchangeRate {
    _date;
    _currencyFrom;
    _currencyTo;
    _buy;
    _sell;
    _sunatReference;
    constructor(_date, _currencyFrom, _currencyTo, _buy, _sell, _sunatReference) {
        this._date = _date;
        this._currencyFrom = _currencyFrom;
        this._currencyTo = _currencyTo;
        this._buy = _buy;
        this._sell = _sell;
        this._sunatReference = _sunatReference;
        Object.freeze(this);
    }
    static create(date, currencyFrom, currencyTo, buy, sell, sunatReference = null) {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
            throw new InvalidExchangeRateError(currencyFrom, currencyTo, "Invalid date");
        }
        const normalizedFrom = currencyFrom.toUpperCase();
        const normalizedTo = currencyTo.toUpperCase();
        if (!ISO_CURRENCY_PATTERN.test(normalizedFrom)) {
            throw new InvalidExchangeRateError(currencyFrom, currencyTo, `Invalid source currency code: ${currencyFrom}`);
        }
        if (!ISO_CURRENCY_PATTERN.test(normalizedTo)) {
            throw new InvalidExchangeRateError(currencyFrom, currencyTo, `Invalid target currency code: ${currencyTo}`);
        }
        if (normalizedFrom === normalizedTo) {
            throw new InvalidExchangeRateError(currencyFrom, currencyTo, "Source and target currencies must be different");
        }
        if (!Number.isFinite(buy) || buy <= 0) {
            throw new InvalidExchangeRateError(currencyFrom, currencyTo, `Buy rate must be positive: ${buy}`);
        }
        if (!Number.isFinite(sell) || sell <= 0) {
            throw new InvalidExchangeRateError(currencyFrom, currencyTo, `Sell rate must be positive: ${sell}`);
        }
        if (sunatReference !== null &&
            (!Number.isFinite(sunatReference) || sunatReference <= 0)) {
            throw new InvalidExchangeRateError(currencyFrom, currencyTo, `SUNAT reference rate must be positive: ${sunatReference}`);
        }
        return new ExchangeRate(date, normalizedFrom, normalizedTo, buy, sell, sunatReference);
    }
    get date() {
        return new Date(this._date.getTime());
    }
    get currencyFrom() {
        return this._currencyFrom;
    }
    get currencyTo() {
        return this._currencyTo;
    }
    get buy() {
        return this._buy;
    }
    get sell() {
        return this._sell;
    }
    get sunatReference() {
        return this._sunatReference;
    }
    getRateForConversion() {
        return this._sunatReference ?? this._buy;
    }
    convert(sourceValue) {
        if (!Number.isFinite(sourceValue) || sourceValue < 0) {
            throw new InvalidExchangeRateError(this._currencyFrom, this._currencyTo, `Amount must be non-negative: ${sourceValue}`);
        }
        return sourceValue * this.getRateForConversion();
    }
    equals(other) {
        if (!other)
            return false;
        return (this._date.getTime() === other._date.getTime() &&
            this._currencyFrom === other._currencyFrom &&
            this._currencyTo === other._currencyTo &&
            this._buy === other._buy &&
            this._sell === other._sell &&
            this._sunatReference === other._sunatReference);
    }
    toString() {
        return `ExchangeRate(${this._currencyFrom}/${this._currencyTo} @ ${this._buy}/${this._sell})`;
    }
    toJSON() {
        return {
            date: this._date.toISOString(),
            currencyFrom: this._currencyFrom,
            currencyTo: this._currencyTo,
            buy: this._buy,
            sell: this._sell,
            sunatReference: this._sunatReference,
        };
    }
    static fromJSON(json) {
        return ExchangeRate.create(new Date(json.date), json.currencyFrom, json.currencyTo, json.buy, json.sell, json.sunatReference ?? null);
    }
}
export class InvalidExchangeRateError extends Error {
    currencyFrom;
    currencyTo;
    constructor(currencyFrom, currencyTo, message) {
        super(message || `Invalid exchange rate: ${currencyFrom}/${currencyTo}`);
        this.currencyFrom = currencyFrom;
        this.currencyTo = currencyTo;
        this.name = "InvalidExchangeRateError";
        Object.setPrototypeOf(this, InvalidExchangeRateError.prototype);
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            currencyFrom: this.currencyFrom,
            currencyTo: this.currencyTo,
            code: "INVALID_EXCHANGE_RATE",
        };
    }
}
//# sourceMappingURL=exchange-rate.js.map