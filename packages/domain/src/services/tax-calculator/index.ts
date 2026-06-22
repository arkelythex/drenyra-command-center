import {
	getDetraccionRates,
	getDetraccionRate,
	getPercepcionRates,
	getPercepcionRate,
} from "./rates";

import {
	calculateIGV,
	calculateBaseFromTotal,
	calculateDetraccion,
	calculateRetencion,
	calculatePercepcion,
	calculateInvoiceBreakdown,
} from "./calculator";

import {
	shouldApplyDetraccion,
	shouldApplyRetencion,
	shouldApplyPercepcion,
} from "./validator";

export type {
	TaxType,
	TaxCalculationResult,
	DetraccionRate,
	PercepcionType,
	PercepcionRate,
} from "./types";

export {
	getDetraccionRates,
	getDetraccionRate,
	getPercepcionRates,
	getPercepcionRate,
};

export {
	calculateIGV,
	calculateBaseFromTotal,
	calculateDetraccion,
	calculateRetencion,
	calculatePercepcion,
	calculateInvoiceBreakdown,
};

export {
	shouldApplyDetraccion,
	shouldApplyRetencion,
	shouldApplyPercepcion,
};

// Backward-compatible class wrapper for consumers using TaxCalculator.calculateIGV() pattern
export const TaxCalculator = {
	calculateIGV,
	calculateBaseFromTotal,
	calculateDetraccion,
	calculateRetencion,
	calculatePercepcion,
	calculateInvoiceBreakdown,
	shouldApplyDetraccion,
	shouldApplyRetencion,
	shouldApplyPercepcion,
	getDetraccionRates,
	getDetraccionRate,
	getPercepcionRates,
	getPercepcionRate,
};
