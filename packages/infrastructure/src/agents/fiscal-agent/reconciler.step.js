export class ReconcilerStep {
    name = "reconcile";
    async execute(transactions, _context) {
        const startedAt = new Date();
        const discrepancies = [];
        for (const tx of transactions) {
            if (tx.amount.getAmount() <= 0) {
                discrepancies.push({
                    type: "AMOUNT_MISMATCH",
                    documentKey: tx.id,
                    localValue: `S/ ${tx.amount.getAmount()}`,
                    severity: "MEDIUM",
                });
            }
        }
        const completedAt = new Date();
        return {
            success: true,
            data: {
                discrepancies,
                matchedCount: transactions.length - discrepancies.length,
                unmatchedLocalCount: 0,
                unmatchedSunatCount: 0,
            },
            errors: [],
            warnings: [],
            metrics: {
                startedAt,
                completedAt,
                itemsProcessed: transactions.length,
                itemsFailed: 0,
            },
        };
    }
}
//# sourceMappingURL=reconciler.step.js.map