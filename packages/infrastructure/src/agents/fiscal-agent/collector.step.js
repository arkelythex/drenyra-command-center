import { createTaxAuthority } from "@drenyra/infrastructure/tax-authority";
export class CollectorStep {
    name = "collect";
    async execute(_input, context) {
        const startedAt = new Date();
        const errors = [];
        const warnings = [];
        try {
            const transactions = await this.fetchLocalTransactions(context);
            let sireRecords = [];
            try {
                const taxAuthority = await createTaxAuthority(context.countryCode, context.organizationId);
                if (taxAuthority) {
                    const syncResult = await taxAuthority.fullRegisterSync({
                        taxId: "",
                        period: context.period,
                        registerType: "PURCHASES",
                        countryCode: context.countryCode,
                    }, []);
                    sireRecords = [
                        {
                            period: context.period,
                            totalRecords: syncResult.totalRecords ?? 0,
                            discrepancies: syncResult.discrepancies?.length ?? 0,
                        },
                    ];
                }
            }
            catch (err) {
                warnings.push(`SIRE sync failed: ${err instanceof Error ? err.message : "Unknown"}`);
            }
            const completedAt = new Date();
            return {
                success: true,
                data: { transactions, sireRecords },
                errors,
                warnings,
                metrics: {
                    startedAt,
                    completedAt,
                    itemsProcessed: transactions.length,
                    itemsFailed: 0,
                },
            };
        }
        catch (error) {
            const completedAt = new Date();
            return {
                success: false,
                errors: [
                    {
                        code: "COLLECT_FAILED",
                        message: error instanceof Error ? error.message : "Collect step failed",
                        retryable: true,
                    },
                ],
                warnings,
                metrics: {
                    startedAt,
                    completedAt,
                    itemsProcessed: 0,
                    itemsFailed: 1,
                },
            };
        }
    }
    async fetchLocalTransactions(_context) {
        return [];
    }
}
//# sourceMappingURL=collector.step.js.map