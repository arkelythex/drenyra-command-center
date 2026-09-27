export const SIRE_DEADLINE_DAYS = 7;
export const CRITICAL_OVERDUE_DAYS = 30;
export const CDR_CONFIRMED_BOOST = 0.05;
export function createSireFilingStrategy(options = {}) {
    const deadlineDays = options.deadlineDays ?? SIRE_DEADLINE_DAYS;
    const criticalOverdueDays = options.criticalOverdueDays ?? CRITICAL_OVERDUE_DAYS;
    return {
        id: "sire-filing",
        name: "SIRE Filing Compliance",
        description: "Monitors CPE submission deadlines to SUNAT (R.S. 000155-2021/SUNAT). Alerts on overdue invoices past the 7-day filing window.",
        minSeverity: "low",
        execute(data, _context) {
            if (!Array.isArray(data))
                return [];
            const records = data;
            const now = new Date();
            const anomalies = [];
            for (const record of records) {
                const emissionDate = new Date(record.emisionDate);
                if (isNaN(emissionDate.getTime()))
                    continue;
                if (record.filingDate && record.cdrReceived)
                    continue;
                const daysSinceEmission = daysBetween(emissionDate, now);
                const deadlineDate = addDays(emissionDate, deadlineDays);
                const daysOverdue = daysBetween(deadlineDate, now);
                if (daysSinceEmission <= deadlineDays)
                    continue;
                const severity = classifySireSeverity(daysOverdue, criticalOverdueDays);
                const confidence = calculateSireConfidence(daysOverdue, record.cdrReceived, record.filingDate);
                const overdueType = record.filingDate ? "cdr_pending" : "not_filed";
                const reasoning = buildReasoning(record, daysOverdue, overdueType);
                anomalies.push({
                    id: `sire-filing-${record.id}`,
                    timestamp: now.toISOString(),
                    entityType: "cpe",
                    entityId: record.id,
                    metric: "sire_filing_overdue",
                    expectedValue: 0,
                    actualValue: daysOverdue,
                    deviation: daysOverdue,
                    severity,
                    confidence,
                    reasoning,
                    detectionMethod: "sire_filing_deadline",
                    context: {
                        serie: record.serie,
                        numero: record.numero,
                        tipoDocumento: record.tipoDocumento,
                        emisorRuc: record.emisorRuc,
                        emisionDate: record.emisionDate,
                        filingDate: record.filingDate,
                        cdrReceived: record.cdrReceived,
                        daysSinceEmission,
                        daysOverdue,
                        deadlineDays,
                        overdueType,
                        total: record.total,
                        legalReference: "R.S. 000155-2021/SUNAT — Plazo de 7 días para envío de CPE a SUNAT",
                    },
                });
            }
            return anomalies;
        },
    };
}
function daysBetween(from, to) {
    return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
function classifySireSeverity(daysOverdue, criticalThreshold) {
    if (daysOverdue >= criticalThreshold)
        return "critical";
    if (daysOverdue >= 7)
        return "high";
    return "medium";
}
function calculateSireConfidence(daysOverdue, cdrReceived, filingDate) {
    if (filingDate && !cdrReceived) {
        return roundToCentesimos(Math.min(0.7 + daysOverdue * 0.01, 0.92));
    }
    const baseConfidence = Math.min(0.85 + daysOverdue * 0.005, 0.98);
    return roundToCentesimos(baseConfidence);
}
function buildReasoning(record, daysOverdue, overdueType) {
    const docDesc = `${record.tipoDocumento} ${record.serie}-${String(record.numero).padStart(8, "0")}`;
    if (overdueType === "cdr_pending") {
        return (`${docDesc}: Enviado a SUNAT pero sin CDR de recepción (${daysOverdue} días de retraso). ` +
            `El comprobante podría no estar registrado en SUNAT.`);
    }
    return (`${docDesc}: No enviado a SUNAT (${daysOverdue} días de retraso). ` +
        `Venció el plazo de 7 días calendario según R.S. 000155-2021/SUNAT. ` +
        `Monto: S/ ${record.total.toFixed(2)}. Sujeto a multa si supera 30 días.`);
}
function roundToCentesimos(value) {
    return Math.round(value * 100) / 100;
}
//# sourceMappingURL=sire-filing.strategy.js.map