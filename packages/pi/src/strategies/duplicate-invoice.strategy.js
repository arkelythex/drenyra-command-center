const RAPID_REEMISSION_WINDOW_MS = 2 * 60 * 60 * 1000;
const SUSPICIOUS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export function createDuplicateInvoiceStrategy() {
    return {
        id: "duplicate-invoice",
        name: "Duplicate Invoice Detection",
        description: "Detects definitively duplicate invoices (same serie+numero+emisor) and suspicious duplicates (same amount+emisor within time window)",
        minSeverity: "medium",
        execute(data, _context) {
            if (!Array.isArray(data))
                return [];
            const invoices = data;
            if (invoices.length < 2)
                return [];
            const anomalies = [];
            const seen = new Map();
            for (const inv of invoices) {
                checkDefinitiveDuplicate(inv, seen, anomalies);
                if (seen.has(makeKey(inv)))
                    continue;
                seen.set(makeKey(inv), inv);
            }
            const allInvs = Array.from(seen.values());
            for (let i = 0; i < allInvs.length; i++) {
                for (let j = i + 1; j < allInvs.length; j++) {
                    checkSuspiciousPair(allInvs[i], allInvs[j], anomalies);
                }
            }
            return anomalies;
        },
    };
}
function makeKey(inv) {
    return `${inv.emisorRuc}:${inv.serie}:${inv.numero}`;
}
function checkDefinitiveDuplicate(inv, seen, anomalies) {
    const key = makeKey(inv);
    const existing = seen.get(key);
    if (!existing)
        return;
    const isCreditNote = inv.tipoNota === "07" || inv.tipoNota === "08";
    anomalies.push({
        id: `dup-definitive-${inv.id}`,
        timestamp: new Date().toISOString(),
        entityType: "invoice",
        entityId: inv.id,
        metric: "definitive_duplicate",
        expectedValue: 1,
        actualValue: 2,
        deviation: 1,
        severity: "critical",
        confidence: 0.99,
        reasoning: `Duplicate invoice detected: ${existing.serie}-${existing.numero} ` +
            `from RUC ${inv.emisorRuc}. Both invoices share the same serie+numero+emisor. ` +
            `First: ${existing.id}, duplicate: ${inv.id}.`,
        detectionMethod: "definitive_duplicate_serie_numero",
        context: {
            firstInvoiceId: existing.id,
            duplicateInvoiceId: inv.id,
            serie: inv.serie,
            numero: inv.numero,
            emisorRuc: inv.emisorRuc,
            isCreditNote,
            firstEmisionDate: existing.emisionDate,
            duplicateEmisionDate: inv.emisionDate,
        },
    });
}
function checkSuspiciousPair(a, b, anomalies) {
    if (a.emisorRuc !== b.emisorRuc)
        return;
    if (Math.abs(a.total - b.total) > 1)
        return;
    const aDate = new Date(a.emisionDate).getTime();
    const bDate = new Date(b.emisionDate).getTime();
    if (Number.isNaN(aDate) || Number.isNaN(bDate))
        return;
    const timeDiff = Math.abs(aDate - bDate);
    if (timeDiff > SUSPICIOUS_WINDOW_MS)
        return;
    const isRapid = timeDiff <= RAPID_REEMISSION_WINDOW_MS;
    const severity = isRapid ? "high" : "medium";
    const confidence = isRapid ? 0.85 : 0.65;
    const hoursDiff = (timeDiff / (1000 * 60 * 60)).toFixed(1);
    const later = aDate >= bDate ? a : b;
    const earlier = aDate >= bDate ? b : a;
    anomalies.push({
        id: `dup-suspicious-${later.id}-${earlier.id}`,
        timestamp: new Date().toISOString(),
        entityType: "invoice",
        entityId: later.id,
        metric: "suspicious_duplicate",
        expectedValue: 1,
        actualValue: 2,
        deviation: 1,
        severity,
        confidence,
        reasoning: `Suspicious duplicate: ${later.serie}-${later.numero} (${later.id}) has ` +
            `same total S/ ${later.total.toFixed(2)} as invoice ${earlier.serie}-${earlier.numero} ` +
            `(${earlier.id}) from same emisor RUC ${a.emisorRuc}, ` +
            `${hoursDiff}h apart.`,
        detectionMethod: isRapid
            ? "suspicious_duplicate_rapid_reemission"
            : "suspicious_duplicate_same_amount",
        context: {
            firstInvoiceId: earlier.id,
            secondInvoiceId: later.id,
            firstSerie: earlier.serie,
            firstNumero: earlier.numero,
            secondSerie: later.serie,
            secondNumero: later.numero,
            emisorRuc: a.emisorRuc,
            total: later.total,
            timeDiffHours: parseFloat(hoursDiff),
            isRapidReemission: isRapid,
        },
    });
}
//# sourceMappingURL=duplicate-invoice.strategy.js.map