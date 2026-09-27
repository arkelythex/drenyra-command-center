export const SPOT_MIN_CASH_AMOUNT = 700;
export const SPOT_MIN_AMOUNT = 700;
export const SPOT_DEPOSIT_DAYS = 5;
export const UNKNOWN_OPERATION_CODE = "00";
export const CASH_PAYMENT_TYPES = [
    "CONT",
    "CASH",
    "EFECTIVO",
];
export const SPOT_RATES = new Map([
    ["001", { rate: 10, description: "Azúcar y melaza" }],
    ["002", { rate: 10, description: "Algodón" }],
    ["003", { rate: 15, description: "Caña de azúcar" }],
    ["004", { rate: 9, description: "Aceite de pescado" }],
    ["005", { rate: 10, description: "Harina de pescado" }],
    ["006", { rate: 9, description: "Minerales metálicos no auríferos" }],
    ["007", { rate: 9, description: "Minerales metálicos auríferos" }],
    ["008", { rate: 15, description: "Minerales no metálicos" }],
    ["009", { rate: 10, description: "Maderas" }],
    ["010", { rate: 12, description: "Arenas y piedras" }],
    ["011", { rate: 10, description: "Residuos, subproductos y desechos" }],
    ["012", { rate: 10, description: "Cerveza" }],
    ["013", { rate: 10, description: "Transporte de pasajeros" }],
    ["014", { rate: 12, description: "Transporte de carga" }],
    ["015", { rate: 10, description: "Comisión mercantil" }],
    ["016", { rate: 10, description: "Manufacturas diversas" }],
    ["017", { rate: 10, description: "Servicios profesionales" }],
    ["018", { rate: 10, description: "Servicios de hospedaje" }],
    ["019", { rate: 10, description: "Servicios de juegos de azar" }],
    ["020", { rate: 12, description: "Arrendamiento de bienes muebles" }],
    ["021", { rate: 9, description: "Arrendamiento de bienes inmuebles" }],
    ["022", { rate: 15, description: "Servicios de construcción" }],
    ["023", { rate: 10, description: "Servicios de comisionista" }],
    ["024", { rate: 10, description: "Corretaje de seguros" }],
    ["025", { rate: 10, description: "Servicios de empresa de seguridad" }],
    ["026", { rate: 10, description: "Servicios de intermed. laboral" }],
    ["027", { rate: 9, description: "Servicios de publicidad" }],
    ["028", { rate: 10, description: "Servicios de espectáculos" }],
    ["029", { rate: 10, description: "Servicios de agencia de viajes" }],
    ["030", { rate: 4, description: "Servicios de transporte terrestre" }],
    ["031", { rate: 12, description: "Servicios de servicios múltiples" }],
    ["032", { rate: 15, description: "Venta de combustibles líquidos" }],
    ["033", { rate: 10, description: "Venta de bienes inmuebles" }],
    ["034", { rate: 10, description: "Venta de vehículos" }],
    ["035", { rate: 10, description: "Venta de joyas" }],
    ["036", { rate: 12, description: "Venta de alimentos" }],
    ["037", { rate: 10, description: "Venta de otros bienes" }],
    ["038", { rate: 10, description: "Servicios de restaurante" }],
    ["039", { rate: 10, description: "Servicios de lavandería" }],
    ["040", { rate: 9, description: "Servicios de salud" }],
    ["041", { rate: 12, description: "Servicios de enseñanza" }],
    ["042", { rate: 10, description: "Servicios de telecomunicaciones" }],
]);
export function createDetraccionesStrategy() {
    return {
        id: "detracciones",
        name: "Detracciones (SPOT) Compliance",
        description: "Validates SPOT system compliance (D.S. 155-2007-EF). Detects missing or incorrect detracciones on eligible invoices.",
        minSeverity: "low",
        execute(data, _context) {
            if (!Array.isArray(data))
                return [];
            const invoices = data;
            const now = new Date();
            const anomalies = [];
            for (const inv of invoices) {
                const spotRate = SPOT_RATES.get(inv.operationCode);
                const isCashPayment = CASH_PAYMENT_TYPES.includes(inv.paymentType.toUpperCase());
                const meetsThreshold = inv.totalAmount >=
                    (isCashPayment ? SPOT_MIN_CASH_AMOUNT : SPOT_MIN_AMOUNT);
                if (!meetsThreshold || !spotRate)
                    continue;
                if (inv.detraccionAmount === null || inv.detraccionAmount === 0) {
                    const severity = classifyMissingDetraccion(inv.totalAmount);
                    anomalies.push(createDetAnomaly(inv, {
                        metric: "detraccion_missing",
                        severity,
                        reasoning: `${inv.tipoDocumento} ${inv.serie}-${String(inv.numero).padStart(8, "0")}: ` +
                            `No se aplicó detracción. Operación código ${inv.operationCode} ` +
                            `(${spotRate.description}) requiere ${spotRate.rate}% de detracción. ` +
                            `Monto S/ ${inv.totalAmount.toFixed(2)} > umbral S/ ${SPOT_MIN_AMOUNT}.`,
                        context: {
                            expectedRate: spotRate.rate,
                            expectedAmount: roundToCentesimos(inv.totalAmount * (spotRate.rate / 100)),
                            operationDescription: spotRate.description,
                            legalReference: "D.S. 155-2007-EF — SPOT rates by operation code",
                        },
                    }));
                    continue;
                }
                const expectedAmount = roundToCentesimos(inv.totalAmount * (spotRate.rate / 100));
                const expectedPercentage = spotRate.rate;
                const diffPct = Math.abs(expectedPercentage - (inv.detraccionPercentage ?? 0));
                if (diffPct > 1) {
                    anomalies.push(createDetAnomaly(inv, {
                        metric: "detraccion_wrong_percentage",
                        severity: "medium",
                        reasoning: `${inv.tipoDocumento} ${inv.serie}-${String(inv.numero).padStart(8, "0")}: ` +
                            `Porcentaje de detracción incorrecto. ` +
                            `Aplicado: ${inv.detraccionPercentage}%. Esperado: ${expectedPercentage}% ` +
                            `(código ${inv.operationCode}: ${spotRate.description}). ` +
                            `Monto S/ ${inv.detraccionAmount?.toFixed(2)} ≠ esperado S/ ${expectedAmount.toFixed(2)}.`,
                        context: {
                            expectedRate: expectedPercentage,
                            appliedRate: inv.detraccionPercentage,
                            expectedAmount,
                            appliedAmount: inv.detraccionAmount,
                            operationDescription: spotRate.description,
                        },
                    }));
                    continue;
                }
                if (!inv.detraccionDeposited) {
                    const emissionDate = new Date(inv.emisionDate);
                    const daysSinceEmission = daysBetween(emissionDate, now);
                    const depositDeadline = SPOT_DEPOSIT_DAYS;
                    const daysLate = daysSinceEmission - depositDeadline;
                    if (daysSinceEmission > depositDeadline) {
                        anomalies.push(createDetAnomaly(inv, {
                            metric: "detraccion_not_deposited",
                            severity: daysLate > 15 ? "high" : "low",
                            reasoning: `Detracción aplicada (S/ ${inv.detraccionAmount?.toFixed(2)}) pero no depositada ` +
                                `(${daysLate} días después del plazo de ${depositDeadline} días). ` +
                                `Debe depositarse en cuenta de detracciones de SUNAT.`,
                            context: {
                                detraccionAmount: inv.detraccionAmount,
                                daysLate,
                                depositDeadline,
                                emisionDate: inv.emisionDate,
                            },
                        }));
                    }
                }
            }
            return anomalies;
        },
    };
}
function daysBetween(from, to) {
    return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}
function roundToCentesimos(value) {
    return Math.round(value * 100) / 100;
}
function classifyMissingDetraccion(totalAmount) {
    if (totalAmount >= 50000)
        return "critical";
    return "high";
}
function createDetAnomaly(inv, params) {
    return {
        id: `${params.metric}-${inv.id}`,
        timestamp: new Date().toISOString(),
        entityType: "cpe",
        entityId: inv.id,
        metric: params.metric,
        expectedValue: 0,
        actualValue: inv.totalAmount,
        deviation: 0,
        severity: params.severity,
        confidence: 0.95,
        reasoning: params.reasoning,
        detectionMethod: params.metric,
        context: {
            serie: inv.serie,
            numero: inv.numero,
            tipoDocumento: inv.tipoDocumento,
            emisorRuc: inv.emisorRuc,
            receptorRuc: inv.receptorRuc,
            operationCode: inv.operationCode,
            totalAmount: inv.totalAmount,
            ...params.context,
        },
    };
}
//# sourceMappingURL=detracciones.strategy.js.map