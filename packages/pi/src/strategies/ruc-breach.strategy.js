export const RUC_BREACH_THRESHOLD_PEN = 5_000;
export function detectRucBreachAnomalies(transactions, thresholdPen = RUC_BREACH_THRESHOLD_PEN) {
    const anomalies = [];
    for (const txn of transactions) {
        if (txn.declaredRuc === txn.paymentRuc)
            continue;
        const exceedsThreshold = txn.amount > thresholdPen;
        const exceedsCritical = txn.amount > thresholdPen * 2;
        const severity = exceedsCritical
            ? "critical"
            : exceedsThreshold
                ? "high"
                : "medium";
        const boundaryRatio = Math.min(txn.amount / thresholdPen, 1);
        const confidence = exceedsThreshold
            ? Math.min(0.95 + boundaryRatio * 0.02, 0.99)
            : 0.72;
        const amountFormatted = txn.amount.toLocaleString("es-PE", {
            style: "currency",
            currency: "PEN",
        });
        const thresholdFormatted = thresholdPen.toLocaleString("es-PE", {
            style: "currency",
            currency: "PEN",
        });
        anomalies.push({
            id: `ruc-breach-${txn.id}`,
            timestamp: new Date().toISOString(),
            entityType: "invoice",
            entityId: txn.id,
            metric: "ruc_mismatch",
            expectedValue: thresholdPen,
            actualValue: txn.amount,
            deviation: txn.amount / thresholdPen,
            severity,
            confidence,
            reasoning: `RUC declarado ${txn.declaredRuc} ≠ RUC pagador ${txn.paymentRuc}. ` +
                `Monto ${amountFormatted} ${exceedsThreshold ? "SUPERA" : "no supera"} ` +
                `umbral SUNAT ${thresholdFormatted} (Art. 12 TUO IGV).`,
            detectionMethod: "ruc_breach_sunat_art12",
            context: {
                declaredRuc: txn.declaredRuc,
                paymentRuc: txn.paymentRuc,
                serie: txn.serie,
                numero: txn.numero,
                emisionDate: txn.emisionDate,
                legalReference: "Art. 12 TUO IGV (D.S. 055-99-EF)",
                sunatThresholdPen: thresholdPen,
                requiresOseValidation: exceedsCritical,
            },
        });
    }
    return anomalies;
}
//# sourceMappingURL=ruc-breach.strategy.js.map