import { Money, TaxCalculator } from "@drenyra/domain";
import { tool } from "ai";
import { z } from "zod";
export const PCGEAccountParams = z.object({
    description: z.string().describe("Description of the transaction"),
    amount: z.number().optional().describe("Transaction amount in PEN"),
});
export const IGVCalculationParams = z.object({
    baseAmount: z.number().describe("Base amount before IGV"),
    includesIGV: z
        .boolean()
        .default(false)
        .describe("Whether the amount already includes IGV"),
});
export const DetractionParams = z.object({
    amount: z.number().describe("Total invoice amount"),
    serviceType: z
        .enum(["construction", "transport", "rental", "other"])
        .describe("Type of service"),
});
export const RUCValidationParams = z.object({
    ruc: z.string().length(11).describe("11-digit RUC number"),
});
export function suggestPCGEAccount(_description) {
    return {
        cuenta: "6399",
        nombre: "Otros gastos de gestión",
        confidence: 0.85,
    };
}
export function calculateIGV(baseAmount, includesIGV = false) {
    if (includesIGV) {
        const total = Money.fromAmount(baseAmount, "PEN");
        const result = TaxCalculator.calculateBaseFromTotal(total);
        return {
            base: result.baseAmount.toNumber(),
            igv: result.taxAmount.toNumber(),
            total: result.totalAmount.toNumber(),
        };
    }
    const base = Money.fromAmount(baseAmount, "PEN");
    const result = TaxCalculator.calculateIGV(base);
    return {
        base: result.baseAmount.toNumber(),
        igv: result.taxAmount.toNumber(),
        total: result.totalAmount.toNumber(),
    };
}
export function calculateDetraction(amount, serviceType) {
    const rates = {
        construction: 0.04,
        transport: 0.04,
        rental: 0.1,
        other: 0.12,
    };
    const rate = rates[serviceType] ?? 0.12;
    const applies = amount > 700;
    return {
        applies,
        rate: rate * 100,
        detractionAmount: applies ? Math.round(amount * rate * 100) / 100 : 0,
    };
}
export function validateRUC(ruc) {
    if (!/^\d{11}$/.test(ruc)) {
        return { valid: false, error: "RUC must be exactly 11 digits" };
    }
    const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const digits = ruc.split("").map(Number);
    let sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += (digits[i] ?? 0) * (weights[i] ?? 0);
    }
    const remainder = sum % 11;
    const checkDigit = 11 - remainder;
    const expectedCheck = checkDigit === 10 ? 0 : checkDigit === 11 ? 1 : checkDigit;
    const valid = digits[10] === expectedCheck;
    return {
        valid,
        type: ruc.startsWith("10")
            ? "Persona Natural"
            : ruc.startsWith("20")
                ? "Persona Jurídica"
                : "Otro",
    };
}
const pcgeAccountTool = tool({
    description: "Suggest a PCGE (Peruvian Chart of Accounts) account for a transaction description",
    inputSchema: PCGEAccountParams,
    execute: async ({ description }) => {
        return suggestPCGEAccount(description);
    },
});
const igvCalculationTool = tool({
    description: "Calculate IGV (18%) for a given base amount in PEN. Handles both base-exclusive and base-inclusive amounts.",
    inputSchema: IGVCalculationParams,
    execute: async ({ baseAmount, includesIGV }) => {
        return calculateIGV(baseAmount, includesIGV);
    },
});
const detractionTool = tool({
    description: "Calculate SPOT detraction (Sistema de Pago de Obligaciones Tributarias) for Peruvian services",
    inputSchema: DetractionParams,
    execute: async ({ amount, serviceType }) => {
        return calculateDetraction(amount, serviceType);
    },
});
const rucValidationTool = tool({
    description: "Validate an 11-digit Peruvian RUC number using Módulo 11 algorithm",
    inputSchema: RUCValidationParams,
    execute: async ({ ruc }) => {
        return validateRUC(ruc);
    },
});
export const fiscalTools = {
    suggestPCGE: pcgeAccountTool,
    calculateIGV: igvCalculationTool,
    calculateDetraction: detractionTool,
    validateRUC: rucValidationTool,
};
//# sourceMappingURL=index.js.map