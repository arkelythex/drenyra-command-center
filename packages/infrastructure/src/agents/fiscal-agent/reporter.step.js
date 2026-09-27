export class ReporterStep {
    name = "report";
    async execute(input, _context) {
        const startedAt = new Date();
        const exceptions = [];
        const entries = [];
        for (const cat of input.categorize.categorizations) {
            if (cat.isException || cat.confidence < 0.8) {
                exceptions.push({
                    type: "LOW_CONFIDENCE_CATEGORIZATION",
                    severity: cat.confidence < 0.5 ? "HIGH" : "MEDIUM",
                    transactionId: cat.transactionId,
                    suggestedAction: `Review categorization: suggested ${cat.suggestedAccount} (${cat.suggestedAccountName})`,
                    confidence: cat.confidence,
                    details: { suggestedAccount: cat.suggestedAccount },
                });
            }
        }
        for (const disc of input.reconcile.discrepancies) {
            exceptions.push({
                type: disc.type === "AMOUNT_MISMATCH"
                    ? "AMOUNT_MISMATCH"
                    : "SUNAT_DISCREPANCY",
                severity: disc.severity,
                transactionId: disc.documentKey,
                suggestedAction: `Discrepancy detected: ${disc.type}`,
                details: {
                    localValue: disc.localValue,
                    authorityValue: disc.authorityValue,
                },
            });
        }
        for (const calc of input.calculate.calculations) {
            entries.push({
                transactionId: calc.transactionId,
                debitAccount: "7011.11",
                debitAmount: calc.baseAmount,
                creditAccount: "4011.11",
                creditAmount: calc.taxAmount,
                description: `IGV ${calc.taxType} @ ${calc.taxRate * 100}%`,
                confidence: 0.95,
            });
        }
        const completedAt = new Date();
        return {
            success: true,
            data: {
                summary: {
                    totalTransactions: input.collect.transactions.length,
                    categorized: input.categorize.categorizations.length,
                    exceptions: exceptions.length,
                    discrepancies: input.reconcile.discrepancies.length,
                    completedSteps: [
                        "collect",
                        "categorize",
                        "calculate",
                        "reconcile",
                        "report",
                    ],
                    failedSteps: [],
                    durationMs: completedAt.getTime() - startedAt.getTime(),
                },
                exceptions,
                suggestedJournalEntries: entries,
            },
            errors: [],
            warnings: [],
            metrics: {
                startedAt,
                completedAt,
                itemsProcessed: input.collect.transactions.length,
                itemsFailed: 0,
            },
        };
    }
}
//# sourceMappingURL=reporter.step.js.map