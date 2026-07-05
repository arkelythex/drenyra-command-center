import {
	calculateBaseFromTotal,
	calculateDetraccion,
	calculateIGV,
	calculateInvoiceBreakdown,
	calculatePercepcion,
	calculateRetencion,
} from "./calculator";
import {
	getDetraccionRate,
	getDetraccionRates,
	getPercepcionRate,
	getPercepcionRates,
} from "./rates";

import {
	shouldApplyDetraccion,
	shouldApplyPercepcion,
	shouldApplyRetencion,
} from "./validator";

export type {
	DetraccionRate,
	PercepcionRate,
	PercepcionType,
	TaxCalculationResult,
	TaxType,
} from "./types";
export {
	calculateBaseFromTotal,
	calculateDetraccion,
	calculateIGV,
	calculateInvoiceBreakdown,
	calculatePercepcion,
	calculateRetencion,
	getDetraccionRate,
	getDetraccionRates,
	getPercepcionRate,
	getPercepcionRates,
	shouldApplyDetraccion,
	shouldApplyPercepcion,
	shouldApplyRetencion,
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
