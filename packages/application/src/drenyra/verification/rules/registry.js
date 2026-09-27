import { getFiscalRate, } from "@drenyra/domain/drenyra";
const PE_NUM_RE = /\bS\/\s?[\d,]+(?:\.\d{2})?\b/g;
const PCT_RE = /(\d+(?:\.\d+)?)%/g;
function extractPercentage(text) {
    const matches = [...text.matchAll(PCT_RE)];
    if (matches.length === 0)
        return null;
    return Number.parseFloat(matches[matches.length - 1][1]);
}
function pass(finding, rule, detail) {
    return { finding, status: "pass", rule, detail };
}
function fail(finding, rule, expected, actual, detail) {
    return {
        finding,
        status: "fail",
        rule,
        expected,
        actual,
        detail,
    };
}
function inconclusive(finding, rule, detail) {
    return {
        finding,
        status: "inconclusive",
        rule,
        detail,
    };
}
const igvRateRule = (finding, _riskLevel, context) => {
    if (!finding.toLowerCase().includes("igv"))
        return null;
    const igvRate = getFiscalRate("IGV", `${context.period}-01`);
    if (!igvRate) {
        return inconclusive(finding, "IGV_RATE_CHECK", "No se encontró tasa IGV en el registry para el período.");
    }
    const pct = extractPercentage(finding);
    if (pct === null) {
        return inconclusive(finding, "IGV_RATE_CHECK", "No se pudo extraer porcentaje de IGV del finding.");
    }
    if (Math.abs(pct - igvRate.rate) <= 0.01) {
        return pass(finding, "IGV_RATE_CHECK", `Tasa IGV correcta: ${pct}% (${igvRate.normativeRef}).`);
    }
    return fail(finding, "IGV_RATE_CHECK", `${igvRate.rate}% (${igvRate.normativeRef})`, `${pct}%`, `Tasa IGV incorrecta: se esperaba ${igvRate.rate}%, se encontró ${pct}%.`);
};
const detractionRateRule = (finding, _riskLevel, context) => {
    if (!finding.toLowerCase().includes("detracc"))
        return null;
    const det10 = getFiscalRate("DETRACCION_10", `${context.period}-01`);
    const det12 = getFiscalRate("DETRACCION_12", `${context.period}-01`);
    const validRates = [det10?.rate, det12?.rate].filter(Boolean);
    if (validRates.length === 0) {
        return inconclusive(finding, "DETRACTION_RATE_CHECK", "No se encontraron tasas de detracción en el registry.");
    }
    const pct = extractPercentage(finding);
    if (pct === null) {
        return inconclusive(finding, "DETRACTION_RATE_CHECK", "No se pudo extraer porcentaje de detracción.");
    }
    if (validRates.some((r) => Math.abs(pct - r) <= 0.01)) {
        return pass(finding, "DETRACTION_RATE_CHECK", `Tasa de detracción válida: ${pct}%.`);
    }
    return fail(finding, "DETRACTION_RATE_CHECK", `${validRates.join("% o ")}%`, `${pct}%`, `Tasa de detracción fuera de rango: ${pct}%. Válidas: ${validRates.join("%, ")}%.`);
};
const KNOWN_PCGE_CODES = new Set([
    "10",
    "12",
    "14",
    "16",
    "18",
    "19",
    "20",
    "30",
    "33",
    "37",
    "39",
    "40",
    "401",
    "4011",
    "402",
    "403",
    "404",
    "405",
    "406",
    "407",
    "408",
    "41",
    "411",
    "42",
    "421",
    "4212",
    "44",
    "45",
    "46",
    "48",
    "49",
    "50",
    "55",
    "56",
    "57",
    "58",
    "59",
    "60",
    "601",
    "6011",
    "602",
    "603",
    "604",
    "605",
    "606",
    "607",
    "608",
    "609",
    "61",
    "62",
    "63",
    "64",
    "65",
    "66",
    "67",
    "68",
    "69",
    "70",
    "71",
    "72",
    "73",
    "74",
    "75",
    "76",
    "77",
    "78",
    "79",
    "91",
    "92",
    "93",
    "94",
    "95",
]);
const pcgeCodeRule = (finding, _riskLevel) => {
    const codeMatches = finding.match(/\b(\d{2,4})\b/g);
    if (!codeMatches)
        return null;
    const invalidCodes = codeMatches.filter((code) => !KNOWN_PCGE_CODES.has(code));
    if (invalidCodes.length === 0)
        return null;
    return fail(finding, "PCGE_CODE_VALIDATION", "Códigos PCGE válidos", `Códigos inválidos: ${invalidCodes.join(", ")}`, `Los códigos ${invalidCodes.join(", ")} no pertenecen al catálogo PCGE.`);
};
const debitCreditBalanceRule = (finding, _riskLevel) => {
    if (!finding.toLowerCase().includes("débito") &&
        !finding.toLowerCase().includes("debito") &&
        !finding.toLowerCase().includes("crédito") &&
        !finding.toLowerCase().includes("credito")) {
        return null;
    }
    const amounts = [...finding.matchAll(PE_NUM_RE)].map((m) => Number.parseFloat(m[0].replace(/[S\s/,]/g, "")));
    if (amounts.length < 2) {
        return inconclusive(finding, "DEBIT_CREDIT_BALANCE", "No se pudieron extraer suficientes montos para verificar balance.");
    }
    const debitMatch = finding.match(/d[ée]bito.*?S\/\s?([\d,]+(?:\.\d{2})?)/i);
    const creditMatch = finding.match(/cr[eé]dito.*?S\/\s?([\d,]+(?:\.\d{2})?)/i);
    let debit = debitMatch
        ? Number.parseFloat(debitMatch[1].replace(/,/g, ""))
        : null;
    let credit = creditMatch
        ? Number.parseFloat(creditMatch[1].replace(/,/g, ""))
        : null;
    if (debit === null && credit === null && amounts.length >= 2) {
        debit = amounts[0];
        credit = amounts[amounts.length - 1];
    }
    if (debit === null || credit === null) {
        return inconclusive(finding, "DEBIT_CREDIT_BALANCE", "No se pudieron identificar débito y crédito.");
    }
    const diff = Math.abs(debit - credit);
    if (diff <= 0.01) {
        return pass(finding, "DEBIT_CREDIT_BALANCE", `Débito (${debit}) = Crédito (${credit}) — balance correcto.`);
    }
    return fail(finding, "DEBIT_CREDIT_BALANCE", `Débito = Crédito`, `Diferencia: S/ ${diff.toFixed(2)}`, `El asiento no balancea: débito S/ ${debit.toFixed(2)} ≠ crédito S/ ${credit.toFixed(2)} (diff: S/ ${diff.toFixed(2)}).`);
};
const riskConfidenceConsistencyRule = (finding, riskLevel) => {
    if (!finding.toLowerCase().includes("confianza") &&
        !finding.toLowerCase().includes("riesgo") &&
        !finding.toLowerCase().includes("score")) {
        return null;
    }
    const pcts = [...finding.matchAll(PCT_RE)].map((m) => Number.parseFloat(m[1]));
    if (pcts.length === 0)
        return null;
    const highestScore = Math.max(...pcts);
    const isHighRisk = riskLevel === "HIGH" || riskLevel === "CRITICAL";
    if (isHighRisk && highestScore > 80) {
        return fail(finding, "RISK_CONFIDENCE_CONSISTENCY", `Confianza ≤ 80% para riesgo ${riskLevel}`, `Confianza encontrada: ${highestScore}%`, `Riesgo ${riskLevel} con confianza ${highestScore}% — inconsistente: riesgo alto debería tener confianza ≤ 80%.`);
    }
    return pass(finding, "RISK_CONFIDENCE_CONSISTENCY", `Score ${highestScore}% consistente con nivel de riesgo ${riskLevel}.`);
};
const intentActionConsistencyRule = (finding, _riskLevel, context) => {
    if (!context.summary && !context.recommendedActions?.length)
        return null;
    const narrativeText = [
        context.summary ?? "",
        ...(context.recommendedActions ?? []),
    ]
        .join(" ")
        .toLowerCase();
    const mentionedAccounts = new Set([...narrativeText.matchAll(/\b(\d{2,4})\b/g)].map((m) => m[1]));
    const changedFields = new Set((context.changes ?? []).map((c) => c.field.toLowerCase()));
    if (mentionedAccounts.size === 0 && changedFields.size === 0) {
        return null;
    }
    if (mentionedAccounts.size === 0 && changedFields.size > 0) {
        return null;
    }
    const unmatchedAccounts = [...mentionedAccounts].filter((acc) => ![...changedFields].some((f) => f.includes(acc)));
    if (unmatchedAccounts.length === mentionedAccounts.size) {
        return fail(finding, "INTENT_ACTION_CONSISTENCY", `Todas las cuentas mencionadas (${[...mentionedAccounts].join(", ")}) aparezcan en cambios`, `Ninguna cuenta mencionada aparece en los ${changedFields.size} campos modificados`, `El agente mencionó ${mentionedAccounts.size} cuenta(s) (${[...mentionedAccounts].join(", ")}) pero los cambios afectan campos distintos. Posible alucinación.`);
    }
    if (unmatchedAccounts.length > 0) {
        return fail(finding, "INTENT_ACTION_CONSISTENCY", `Todas las cuentas mencionadas aparezcan en cambios`, `${unmatchedAccounts.length} cuenta(s) sin cambio: ${unmatchedAccounts.join(", ")}`, `El agente mencionó ${mentionedAccounts.size} cuenta(s) pero ${unmatchedAccounts.length} no tiene(n) cambios: ${unmatchedAccounts.join(", ")}. Posible alucinación parcial.`);
    }
    return pass(finding, "INTENT_ACTION_CONSISTENCY", `Todas las ${mentionedAccounts.size} cuenta(s) mencionadas tienen cambios correspondientes: ${[...mentionedAccounts].join(", ")}.`);
};
const VERIFICATION_RULES = [
    igvRateRule,
    detractionRateRule,
    pcgeCodeRule,
    debitCreditBalanceRule,
    riskConfidenceConsistencyRule,
    intentActionConsistencyRule,
];
export function runVerificationRules(findings, riskLevel, context) {
    const results = [];
    for (const finding of findings) {
        let matched = false;
        for (const rule of VERIFICATION_RULES) {
            const result = rule(finding, riskLevel, context);
            if (result !== null) {
                results.push(result);
                matched = true;
            }
        }
        if (!matched) {
            results.push({
                finding,
                status: "inconclusive",
                rule: "NO_RULE_MATCHED",
                detail: "Finding cualitativo sin regla de verificación aplicable. Requiere revisión humana.",
            });
        }
    }
    return results;
}
//# sourceMappingURL=registry.js.map