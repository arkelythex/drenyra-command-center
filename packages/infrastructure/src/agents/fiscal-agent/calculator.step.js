import { PeruGeneralRegime } from "@drenyra/domain/services/tax-regime/peru";
export class CalculatorStep {
    name = "calculate";
    regime = new PeruGeneralRegime();
    async execute(input, _context) {
        const startedAt = new Date();
        const errors = [];
        const calculations = [];
        for (const tx of input.transactions) {
            try {
                const calc = this.calculateOne(tx);
                calculations.push(calc);
            }
            catch (err) {
                errors.push({
                    code: "CALCULATE_FAILED",
                    message: `Failed to calculate tax for ${tx.id}: ${err instanceof Error ? err.message : "Unknown"}`,
                    itemId: tx.id,
                    retryable: false,
                });
            }
        }
        const completedAt = new Date();
        return {
            success: errors.length === 0,
            data: { calculations },
            errors,
            warnings: [],
            metrics: {
                startedAt,
                completedAt,
                itemsProcessed: input.transactions.length,
                itemsFailed: errors.length,
            },
        };
    }
    calculateOne(tx) {
        const result = this.regime.calculateIGV(tx.amount);
        return {
            transactionId: tx.id,
            taxType: "IGV",
            taxRate: 0.18,
            taxAmount: result.taxAmount,
            baseAmount: result.baseAmount,
            totalAmount: result.totalAmount,
            anomalies: [],
        };
    }
}
//# sourceMappingURL=calculator.step.js.map