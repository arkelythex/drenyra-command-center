export const ALERT_DAYS = {
    critical: 0,
    high: 3,
    medium: 7,
    low: 15,
};
const MONTHS_ES = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "setiembre",
    "octubre",
    "noviembre",
    "diciembre",
];
export function createTaxCalendarStrategy() {
    return {
        id: "tax-calendar",
        name: "Tax Obligation Calendar",
        description: "Monitors upcoming SUNAT tax obligation deadlines and alerts based on the tenant's tax profile and regime.",
        minSeverity: "low",
        execute(data, _context) {
            if (!data || typeof data !== "object")
                return [];
            const input = data;
            if (!input.obligations?.length)
                return [];
            const now = new Date();
            const anomalies = [];
            for (const obligation of input.obligations) {
                if (obligation.status === "filed" || obligation.status === "exempt")
                    continue;
                const dueDate = new Date(obligation.dueDate);
                if (isNaN(dueDate.getTime()))
                    continue;
                const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                if (daysUntilDue > ALERT_DAYS.low)
                    continue;
                const severity = classifyCalendarSeverity(daysUntilDue);
                anomalies.push({
                    id: `tax-calendar-${obligation.id}`,
                    timestamp: now.toISOString(),
                    entityType: "tax_obligation",
                    entityId: obligation.id,
                    metric: "tax_deadline_approaching",
                    expectedValue: 0,
                    actualValue: daysUntilDue,
                    deviation: -daysUntilDue,
                    severity,
                    confidence: calculateCalendarConfidence(daysUntilDue),
                    reasoning: buildCalendarReasoning(obligation, daysUntilDue),
                    detectionMethod: "tax_obligation_calendar",
                    context: {
                        obligationCode: obligation.code,
                        obligationName: obligation.name,
                        dueDate: obligation.dueDate,
                        daysUntilDue,
                        period: obligation.period,
                        amount: obligation.amount,
                        tenantRuc: input.tenantRuc,
                        taxRegime: input.taxRegime,
                        rucType: input.rucType,
                        legalReference: obligation.legalReference,
                    },
                });
            }
            const missingStandard = detectMissingObligations(input);
            for (const missing of missingStandard) {
                anomalies.push({
                    id: `tax-calendar-missing-${missing.code}`,
                    timestamp: now.toISOString(),
                    entityType: "tax_obligation",
                    entityId: missing.code,
                    metric: "tax_obligation_missing",
                    expectedValue: 1,
                    actualValue: 0,
                    deviation: -1,
                    severity: "medium",
                    confidence: 0.85,
                    reasoning: `Obligación ${missing.code} (${missing.name}) no encontrada en el calendario. ` +
                        `Es obligatoria para régimen ${input.taxRegime} según SUNAT. Verificar si fue registrada.`,
                    detectionMethod: "tax_obligation_missing",
                    context: {
                        obligationCode: missing.code,
                        obligationName: missing.name,
                        tenantRuc: input.tenantRuc,
                        taxRegime: input.taxRegime,
                        legalReference: missing.legalReference,
                    },
                });
            }
            return anomalies;
        },
    };
}
const REGIME_OBLIGATIONS = {
    general: [
        {
            code: "0601",
            name: "PLAME — Declaración Mensual de Remuneraciones",
            legalReference: "R.S. 245-2016/SUNAT",
        },
        {
            code: "0621",
            name: "IGV — Declaración Mensual (Formulario 621)",
            legalReference: "Art. 65 TUO IGV",
        },
        {
            code: "0616",
            name: "Renta Mensual — Retenciones 1ra/2da categoría",
            legalReference: "Ley del Impuesto a la Renta Art. 71",
        },
        {
            code: "0710",
            name: "DJ Anual — Declaración Jurada Anual del Impuesto a la Renta",
            legalReference: "Ley del Impuesto a la Renta Art. 77",
        },
    ],
    mype: [
        {
            code: "0621",
            name: "IGV — Declaración Mensual (Formulario 621)",
            legalReference: "Art. 65 TUO IGV",
        },
        {
            code: "0601",
            name: "PLAME — Declaración Mensual de Remuneraciones",
            legalReference: "R.S. 245-2016/SUNAT",
        },
        {
            code: "0710",
            name: "DJ Anual — Declaración Jurada Anual del Impuesto a la Renta",
            legalReference: "Ley del Impuesto a la Renta Art. 77",
        },
    ],
    ruta: [
        {
            code: "0621",
            name: "IGV — Declaración Mensual (Formulario 621)",
            legalReference: "Art. 65 TUO IGV",
        },
    ],
    especial: [
        {
            code: "0621",
            name: "IGV — Declaración Mensual (Formulario 621)",
            legalReference: "Art. 65 TUO IGV",
        },
        {
            code: "0601",
            name: "PLAME — Declaración Mensual de Remuneraciones",
            legalReference: "R.S. 245-2016/SUNAT",
        },
    ],
};
function detectMissingObligations(input) {
    const existingCodes = new Set(input.obligations.map((o) => o.code));
    const standard = REGIME_OBLIGATIONS[input.taxRegime] ?? [];
    return standard.filter((s) => !existingCodes.has(s.code));
}
function classifyCalendarSeverity(daysUntilDue) {
    if (daysUntilDue <= 0)
        return "critical";
    if (daysUntilDue <= ALERT_DAYS.high)
        return "high";
    if (daysUntilDue <= ALERT_DAYS.medium)
        return "medium";
    return "low";
}
function calculateCalendarConfidence(daysUntilDue) {
    if (daysUntilDue <= 0)
        return 0.99;
    if (daysUntilDue <= 3)
        return 0.95;
    if (daysUntilDue <= 7)
        return 0.9;
    return 0.8;
}
function buildCalendarReasoning(obligation, daysUntilDue) {
    const period = obligation.period ?? "período no especificado";
    const amountStr = obligation.amount
        ? `S/ ${obligation.amount.toFixed(2)}`
        : "monto no definido";
    if (daysUntilDue < 0) {
        const overdue = Math.abs(daysUntilDue);
        return (`${obligation.name}: VENCIDA hace ${overdue} día(s) (período ${period}). ` +
            `Monto estimado: ${amountStr}. Regularizar inmediatamente para evitar multas e intereses. ` +
            `Ref: ${obligation.legalReference}`);
    }
    if (daysUntilDue === 0) {
        return (`${obligation.name}: VENCE HOY (período ${period}). ` +
            `Monto estimado: ${amountStr}. Realizar declaración antes del cierre de operaciones. ` +
            `Ref: ${obligation.legalReference}`);
    }
    const monthName = MONTHS_ES[new Date(obligation.dueDate).getMonth()] ?? "";
    return (`${obligation.name}: Vence en ${daysUntilDue} día(s) ` +
        `(${new Date(obligation.dueDate).getDate()} de ${monthName}, período ${period}). ` +
        `Monto estimado: ${amountStr}. Preparar declaración. ` +
        `Ref: ${obligation.legalReference}`);
}
//# sourceMappingURL=tax-calendar.strategy.js.map