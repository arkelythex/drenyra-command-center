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
	type CDRData,
	CPELog,
	InvalidCPELogError,
	InvalidCPELogTransitionError,
	type SunatStatus,
} from "./cpe-log";

export {
	Detraccion,
	type DetraccionStatus,
	InvalidDetraccionError,
	InvalidDetraccionTransitionError,
	SPOT_CODE_REGISTRY,
	type SpotCode,
} from "./detraccion";
export {
	ExchangeRate,
	InvalidExchangeRateError,
} from "./exchange-rate";
