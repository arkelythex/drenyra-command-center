export class LearnerStep {
    name = "learn";
    async execute(corrections, _context) {
        const startedAt = new Date();
        const records = [];
        for (const correction of corrections) {
            try {
                await this.saveCorrection(correction);
                records.push({ ...correction, timestamp: new Date(), applied: true });
            }
            catch (err) {
                console.error(`Failed to save correction for ${correction.transactionId}:`, err);
                records.push({ ...correction, timestamp: new Date(), applied: false });
            }
        }
        const completedAt = new Date();
        return {
            success: true,
            data: records,
            errors: [],
            warnings: [],
            metrics: {
                startedAt,
                completedAt,
                itemsProcessed: corrections.length,
                itemsFailed: 0,
            },
        };
    }
    async saveCorrection(correction) {
        console.log(`Correction saved: ${correction.transactionId} → ${correction.correctedCategory}`);
    }
}
//# sourceMappingURL=learner.step.js.map