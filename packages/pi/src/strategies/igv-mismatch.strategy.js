export const IGV_RATE = 0.18;
export const IGV_TOLERANCE_PEN = 1;
export const EXONERATED_TIPOS = [
    "07",
    "08",
    "09",
    "10",
    "20",
    "30",
    "37",
    "40",
];
export function createIgvMismatchStrategy() {
    return {
        id: "igv-mismatch",
        name: "IGV Mismatch Detection",
        description: "Detects invoices where declared IGV does not match 18% of taxable base (Art. 17 TUO IGV)",
        minSeverity: "low",
        execute(data, _context) {
            if (!Array.isArray(data))
                return [];
            const invoices = data;
            const anomalies = [];
            for (const inv of invoices) {
                if (EXONERATED_TIPOS.includes(inv.tipoOperacion))
                    continue;
                const expectedIgv = roundToCentesimos(inv.baseImponible * IGV_RATE);
                const actualIgv = inv.igvCalculado;
                const absDiff = Math.abs(expectedIgv - actualIgv);
                if (absDiff <= IGV_TOLERANCE_PEN)
                    continue;
                const deviationRatio = absDiff / expectedIgv;
                const severity = classifyDeviation(deviationRatio);
                const confidence = calculateConfidence(deviationRatio, absDiff);
                const diffFormatted = absDiff.toLocaleString("es-PE", {
                    style: "currency",
                    currency: "PEN",
                });
                anomalies.push({
                    id: `igv-mismatch-${inv.id}`,
                    timestamp: new Date().toISOString(),
                    entityType: "invoice",
                    entityId: inv.id,
                    metric: "igv_mismatch",
                    expectedValue: expectedIgv,
                    actualValue: actualIgv,
                    deviation: deviationRatio,
                    severity,
                    confidence,
                    reasoning: `IGV declarado S/ ${actualIgv.toFixed(2)} ≠ IGV esperado S/ ${expectedIgv.toFixed(2)} ` +
                        `(base S/ ${inv.baseImponible.toFixed(2)} × 18%). Diferencia: ${diffFormatted}.`,
                    detectionMethod: "igv_mismatch_art17",
                    context: {
                        serie: inv.serie,
                        numero: inv.numero,
                        tipoOperacion: inv.tipoOperacion,
                        baseImponible: inv.baseImponible,
                        emisorRuc: inv.emisorRuc,
                        emisionDate: inv.emisionDate,
                        expectedIgv,
                        actualIgv,
                        absDiff,
                        deviationRatio,
                        legalReference: "Art. 17 TUO IGV (D.S. 055-99-EF)",
                        igvRate: IGV_RATE,
                    },
                });
            }
            return anomalies;
        },
    };
}
function roundToCentesimos(value) {
    return Math.round(value * 100) / 100;
}
function classifyDeviation(deviationRatio) {
    if (deviationRatio > 0.1)
        return "critical";
    if (deviationRatio > 0.05)
        return "high";
    if (deviationRatio > 0.02)
        return "medium";
    return "low";
}
function calculateConfidence(deviationRatio, absDiff) {
    const baseConfidence = Math.min(0.8 + deviationRatio * 0.5, 0.99);
    if (absDiff < 10)
        return roundToCentesimos(baseConfidence * 0.95);
    return roundToCentesimos(baseConfidence);
}
//# sourceMappingURL=igv-mismatch.strategy.js.map