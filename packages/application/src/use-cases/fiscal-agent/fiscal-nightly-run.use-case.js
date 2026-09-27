import { CalculatorStep, CategorizerStep, CollectorStep, LearnerStep, ReconcilerStep, ReporterStep, } from "@drenyra/infrastructure/agents/fiscal-agent";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
export class FiscalNightlyRunUseCase {
    async execute(params) {
        const runId = crypto.randomUUID();
        const context = {
            organizationId: params.organizationId,
            companyId: params.companyId,
            countryCode: params.countryCode,
            period: params.period,
            runId,
            userId: params.userId ?? "system",
        };
        const startedAt = new Date();
        const stepResults = [];
        const collect = await this.runStep(new CollectorStep(), undefined, context, stepResults);
        const categorize = collect.success
            ? await this.runStep(new CategorizerStep(), collect.data?.transactions ?? [], context, stepResults)
            : { success: false };
        const calculate = categorize.success && collect.data
            ? await this.runStep(new CalculatorStep(), {
                transactions: collect.data.transactions,
                categorizations: categorize.data?.categorizations ?? [],
            }, context, stepResults)
            : { success: false };
        const reconcile = collect.data
            ? await this.runStep(new ReconcilerStep(), collect.data.transactions, context, stepResults)
            : { success: false };
        const report = await this.runStep(new ReporterStep(), {
            collect: collect.data ?? { transactions: [], sireRecords: [] },
            categorize: categorize.data ?? { categorizations: [] },
            calculate: calculate.data ?? { calculations: [] },
            reconcile: reconcile.data ?? {
                discrepancies: [],
                matchedCount: 0,
                unmatchedLocalCount: 0,
                unmatchedSunatCount: 0,
            },
        }, context, stepResults);
        const completedAt = new Date();
        const allSuccess = stepResults.every((s) => s.success);
        return {
            runId,
            organizationId: params.organizationId,
            companyId: params.companyId,
            period: params.period,
            status: allSuccess
                ? "SUCCESS"
                : stepResults.some((s) => s.success)
                    ? "PARTIAL"
                    : "FAILED",
            steps: stepResults,
            summary: report.data?.summary ?? {
                totalTransactions: 0,
                categorized: 0,
                exceptions: 0,
                discrepancies: 0,
                completedSteps: [],
                failedSteps: [],
                durationMs: completedAt.getTime() - startedAt.getTime(),
            },
            createdAt: completedAt,
        };
    }
    async runStep(step, input, context, results) {
        let lastError = null;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const result = await step.execute(input, context);
                results.push({
                    name: step.name,
                    success: result.success,
                    metrics: result.metrics,
                    errors: result.errors,
                });
                return result;
            }
            catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err));
                if (attempt < MAX_RETRIES) {
                    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
                }
            }
        }
        const failed = {
            success: false,
            errors: [
                {
                    code: "STEP_FAILED",
                    message: lastError?.message ?? "Step failed after retries",
                    retryable: false,
                },
            ],
            warnings: [],
            metrics: {
                startedAt: new Date(),
                completedAt: new Date(),
                itemsProcessed: 0,
                itemsFailed: 1,
            },
        };
        results.push({
            name: step.name,
            success: false,
            metrics: failed.metrics,
            errors: failed.errors,
        });
        return failed;
    }
}
export class CorrectionUseCase {
    async execute(corrections) {
        const learner = new LearnerStep();
        const result = await learner.execute(corrections, {
            organizationId: 0,
            companyId: "",
            countryCode: "PE",
            period: "",
            runId: crypto.randomUUID(),
            userId: corrections[0]?.userId ?? "unknown",
        });
        const applied = result.data?.filter((r) => r.applied).length ?? 0;
        return { applied, failed: corrections.length - applied };
    }
}
//# sourceMappingURL=fiscal-nightly-run.use-case.js.map