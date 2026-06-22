/**
 * Accounting Domain — Value Objects barrel
 *
 * Exports all accounting value objects and their associated types.
 */

export {
	AccountingPeriod,
	type AccountingPeriodStatus,
	InvalidAccountingPeriodError,
	InvalidAccountingTransitionError,
} from "./accounting-period";

export {
	ExchangeRate,
	InvalidExchangeRateError,
} from "./exchange-rate";

export {
	Detraccion,
	type DetraccionStatus,
	type SpotCode,
	SPOT_CODE_REGISTRY,
	InvalidDetraccionError,
	InvalidDetraccionTransitionError,
} from "./detraccion";

export {
	CPELog,
	type SunatStatus,
	type CDRData,
	InvalidCPELogError,
	InvalidCPELogTransitionError,
} from "./cpe-log";
