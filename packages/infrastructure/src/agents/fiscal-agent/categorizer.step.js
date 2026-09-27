import { findBestAccount } from "@drenyra/domain/services/pcge-catalog";
export class CategorizerStep {
    name = "categorize";
    async execute(transactions, _context) {
        const startedAt = new Date();
        const errors = [];
        const categorizations = [];
        for (const tx of transactions) {
            try {
                const { account, confidence } = findBestAccount(tx.description, tx.vendorName);
                categorizations.push({
                    transactionId: tx.id,
                    suggestedAccount: account.code,
                    suggestedAccountName: account.name,
                    confidence: confidence / 100,
                    isException: confidence < 50,
                });
            }
            catch (err) {
                errors.push({
                    code: "CATEGORIZE_FAILED",
                    message: `Failed to categorize ${tx.id}: ${err instanceof Error ? err.message : "Unknown"}`,
                    itemId: tx.id,
                    retryable: true,
                });
            }
        }
        const completedAt = new Date();
        return {
            success: errors.length === 0,
            data: { categorizations },
            errors,
            warnings: [],
            metrics: {
                startedAt,
                completedAt,
                itemsProcessed: transactions.length,
                itemsFailed: errors.length,
            },
        };
    }
}
//# sourceMappingURL=categorizer.step.js.map