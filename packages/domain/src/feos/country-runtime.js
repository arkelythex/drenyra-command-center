export const DRENYRA_COUNTRY_PACKS = [
    { code: "PE", name: "Perú", taxAuthority: "SUNAT", defaultCurrency: "PEN", locale: "es-PE", timezone: "America/Lima", fiscalYearStart: "01-01", taxIdentifierFormat: "\\d{11}" },
    { code: "CO", name: "Colombia", taxAuthority: "DIAN", defaultCurrency: "COP", locale: "es-CO", timezone: "America/Bogota", fiscalYearStart: "01-01", taxIdentifierFormat: "\\d{9,10}" },
    { code: "CL", name: "Chile", taxAuthority: "SII", defaultCurrency: "CLP", locale: "es-CL", timezone: "America/Santiago", fiscalYearStart: "01-01", taxIdentifierFormat: "\\d{8,9}" },
    { code: "EC", name: "Ecuador", taxAuthority: "SRI", defaultCurrency: "USD", locale: "es-EC", timezone: "America/Guayaquil", fiscalYearStart: "01-01", taxIdentifierFormat: "\\d{13}" },
    { code: "MX", name: "México", taxAuthority: "SAT", defaultCurrency: "MXN", locale: "es-MX", timezone: "America/Mexico_City", fiscalYearStart: "01-01", taxIdentifierFormat: "[A-ZÑ&]{3,4}\\d{6}" },
    { code: "BR", name: "Brasil", taxAuthority: "Receita Federal", defaultCurrency: "BRL", locale: "pt-BR", timezone: "America/Sao_Paulo", fiscalYearStart: "01-01", taxIdentifierFormat: "\\d{14}" },
];
export const PERU_TAX_RULES = [
    { name: "IGV", countryCode: "PE", description: "Impuesto General a la Venta", rate: 18, appliesTo: ["goods", "services"], active: true, validFrom: "2024-01-01" },
    { name: "Renta", countryCode: "PE", description: "Impuesto a la Renta", rate: 29.5, appliesTo: ["corporate_income"], active: true, validFrom: "2024-01-01" },
    { name: "Detraccion", countryCode: "PE", description: "Sistema de Detracciones", rate: 10, appliesTo: ["certain_goods"], active: true, validFrom: "2024-01-01" },
];
export const COLOMBIA_TAX_RULES = [
    { name: "IVA", countryCode: "CO", description: "Impuesto al Valor Agregado", rate: 19, appliesTo: ["goods", "services"], active: true, validFrom: "2024-01-01" },
    { name: "ReteICA", countryCode: "CO", description: "Retención de ICA", rate: 0.966, appliesTo: ["services"], active: true, validFrom: "2024-01-01" },
];
export class CountryRuntime {
    packs = new Map();
    constructor(packs) {
        for (const p of packs ?? DRENYRA_COUNTRY_PACKS) {
            this.packs.set(p.code, p);
        }
    }
    getPack(code) {
        return this.packs.get(code);
    }
    listAvailable() {
        return Array.from(this.packs.values());
    }
    getTaxRules(countryCode, activeOnly = true) {
        const all = countryCode === "PE" ? PERU_TAX_RULES
            : countryCode === "CO" ? COLOMBIA_TAX_RULES
                : [];
        return activeOnly ? all.filter((r) => r.active) : all;
    }
    generatePeriods(year, countryCode) {
        const months = Array.from({ length: 12 }, (_, i) => i + 1);
        return months.map((month) => ({
            year,
            month,
            label: `${String(month).padStart(2, "0")}/${year}`,
            startDate: `${year}-${String(month).padStart(2, "0")}-01`,
            endDate: new Date(year, month, 0).toISOString().split("T")[0],
            taxDeadlines: [],
        }));
    }
}
//# sourceMappingURL=country-runtime.js.map