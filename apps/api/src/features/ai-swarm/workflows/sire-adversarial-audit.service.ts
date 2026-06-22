import { runSireAdversarialArbiter } from "./sire-adversarial-arbiter.service";
import { runSireCreatorAgent } from "./sire-adversarial-creator.agent";
import { runSireDestructorAgent } from "./sire-adversarial-destructor.agent";
import type {
	SireAdversarialAuditResult,
	SireAdversarialInput,
} from "./sire-adversarial-audit.types";
import { SireReadinessSubagentsService } from "./sire-readiness-subagents.service";

const readinessService = new SireReadinessSubagentsService();

/**
 * SireAdversarialAuditService class.
 *
 * @example
 * ```ts
 * const value = new SireAdversarialAuditService();
 * console.log(value);
 * ```
 */
export class SireAdversarialAuditService {
	async run(input: SireAdversarialInput): Promise<SireAdversarialAuditResult> {
		const startedAt = Date.now();
		const readiness = await readinessService.runFull({
			companyId: input.companyId,
			period: input.period,
			declaredIgvPen: input.declaredIgvPen,
			salesTotalPen: input.salesTotalPen,
			rvieRecords: input.rvieRecords,
			rceRecords: input.rceRecords,
			pleSalesRecords: input.pleSalesRecords,
			plePurchaseRecords: input.plePurchaseRecords,
			detractionAmountPen: input.detractionAmountPen,
			detractionableBasePen: input.detractionableBasePen,
		});

		const creator = runSireCreatorAgent(input);
		const destructor = runSireDestructorAgent(input, readiness.anomalies);
		const arbiter = runSireAdversarialArbiter({
			creator,
			destructor,
			checks: readiness.checks,
			falsePositiveRate: input.falsePositiveRate,
		});

		return {
			companyId: input.companyId,
			period: input.period,
			readinessStatus: readiness.status,
			checks: readiness.checks,
			anomalies: readiness.anomalies,
			creator,
			destructor,
			arbiter,
			execution: {
				durationMs: Date.now() - startedAt,
				mode: "adversarial-audit",
			},
		};
	}
}
