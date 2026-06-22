import { SIRE_LEDGER_REPRO_RUNBOOK } from "../../../../lib/compliance-runbooks";
import { ComplianceService } from "../../../../services/compliance.service";
import { fail, getErrorMessage, ok } from "../../../shared/api-response";
import { resolveYearMonth } from "../../routes/helpers";

export async function getConciliation(query: any, set: any) {
	try {
		const { year, month } = resolveYearMonth(query.period);
		const report = await ComplianceService.verifySireReproducibility({
			companyId: query.companyId,
			year,
			month,
			totalTolerance: query.totalTolerance,
			igvTolerance: query.igvTolerance,
			recordTolerance: query.recordTolerance,
		});

		return ok(report);
	} catch (error: unknown) {
		set.status = 500;
		return fail(getErrorMessage(error), "SIRE_CONCILIATION_ERROR", {
			runbook: SIRE_LEDGER_REPRO_RUNBOOK,
		});
	}
}
