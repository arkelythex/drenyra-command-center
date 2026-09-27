export const FISCAL_RATES = [
    {
        rateId: "IGV",
        rate: 18,
        effectiveFrom: "2011-03-01",
        effectiveTo: null,
        normativeRef: "Ley IGV DS 055-99-EF (tasa 18% desde 2011)",
        description: "Impuesto General a las Ventas — 18% (16% + 2% IPM)",
    },
    {
        rateId: "DETRACCION_10",
        rate: 10,
        effectiveFrom: "2024-01-01",
        effectiveTo: null,
        normativeRef: "Resolución SUNAT Nº 183-2023",
        description: "Detracción 10% — bienes y servicios generales",
    },
    {
        rateId: "DETRACCION_12",
        rate: 12,
        effectiveFrom: "2024-01-01",
        effectiveTo: null,
        normativeRef: "Resolución SUNAT Nº 183-2023",
        description: "Detracción 12% — servicios de transporte de carga",
    },
    {
        rateId: "ITF",
        rate: 0.005,
        effectiveFrom: "2024-01-01",
        effectiveTo: null,
        normativeRef: "Ley 29667",
        description: "Impuesto a las Transacciones Financieras — 0.005%",
    },
];
export function getFiscalRate(rateId, asOf = new Date().toISOString()) {
    const applicable = FISCAL_RATES.filter((entry) => {
        if (entry.rateId !== rateId)
            return false;
        if (entry.effectiveFrom > asOf)
            return false;
        if (entry.effectiveTo !== null && entry.effectiveTo < asOf)
            return false;
        return true;
    });
    if (applicable.length === 0)
        return null;
    applicable.sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
    return applicable[0];
}
export function getFiscalRateHistory(rateId) {
    return FISCAL_RATES.filter((entry) => entry.rateId === rateId).sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
}
//# sourceMappingURL=fiscal-rates-registry.js.map