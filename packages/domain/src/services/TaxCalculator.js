import { PeruGeneralRegime } from "./tax-regime/peru";
export class TaxCalculator {
    static regime = new PeruGeneralRegime();
    static setRegime(regime) {
        TaxCalculator.regime = regime;
    }
    static getRegime() {
        return TaxCalculator.regime;
    }
    static calculateIGV(baseAmount) {
        const peru = TaxCalculator.ensurePeruRegime();
        return peru.calculateIGV(baseAmount);
    }
    static calculateBaseFromTotal(totalAmount) {
        const peru = TaxCalculator.ensurePeruRegime();
        return peru.calculateBaseFromTotal(totalAmount);
    }
    static calculateDetraccion(totalAmount, serviceCode) {
        const peru = TaxCalculator.ensurePeruRegime();
        return peru.calculateDetraccion(totalAmount, serviceCode);
    }
    static calculateRetencion(baseAmount) {
        const peru = TaxCalculator.ensurePeruRegime();
        return peru.calculateRetencion(baseAmount);
    }
    static calculatePercepcion(totalAmount, percepcionType) {
        const peru = TaxCalculator.ensurePeruRegime();
        return peru.calculatePercepcion(totalAmount, percepcionType);
    }
    static shouldApplyDetraccion(totalAmount, serviceCode) {
        const peru = TaxCalculator.ensurePeruRegime();
        return peru.shouldApplyDetraccion(totalAmount, serviceCode);
    }
    static shouldApplyRetencion(baseAmount, isAgenteRetencion = false) {
        const peru = TaxCalculator.ensurePeruRegime();
        return peru.shouldApplyRetencion(baseAmount, isAgenteRetencion);
    }
    static shouldApplyPercepcion(totalAmount) {
        const peru = TaxCalculator.ensurePeruRegime();
        return peru.shouldApplyPercepcion(totalAmount);
    }
    static getDetraccionRates() {
        const peru = TaxCalculator.ensurePeruRegime();
        return peru.getDetraccionRates();
    }
    static getDetraccionRate(code) {
        const peru = TaxCalculator.ensurePeruRegime();
        return peru.getDetraccionRate(code);
    }
    static getPercepcionRates() {
        const peru = TaxCalculator.ensurePeruRegime();
        return peru.getPercepcionRates();
    }
    static getPercepcionRate(percepcionType) {
        const peru = TaxCalculator.ensurePeruRegime();
        return peru.getPercepcionRate(percepcionType);
    }
    static calculateInvoiceBreakdown(params) {
        const peru = TaxCalculator.ensurePeruRegime();
        return peru.calculateInvoiceBreakdown(params);
    }
    static ensurePeruRegime() {
        if (TaxCalculator.regime instanceof PeruGeneralRegime) {
            return TaxCalculator.regime;
        }
        TaxCalculator.regime = new PeruGeneralRegime();
        return TaxCalculator.regime;
    }
}
//# sourceMappingURL=TaxCalculator.js.map