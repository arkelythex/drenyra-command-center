import { ComplianceService } from "../../../../services/compliance.service";
import { FiscalIndicatorsService } from "../../../dashboard/application/services/fiscal-indicators.service";
import { fail, getErrorMessage, ok } from "../../../shared/api-response";
import {
	calculateDeadlineStatus,
	resolveYearMonth,
} from "../../routes/helpers";
import { evaluateSireSubmissionPolicy } from "../../services/sire-policy-2026.service";

export async function getSireDashboard(query: any, set: any) {
	try {
		const { year, month, period } = resolveYearMonth(query.period);
		const [complianceDashboard, issues, reproducibility, taxCalendar] =
			await Promise.all([
				ComplianceService.getDashboard(query.companyId),
				ComplianceService.getIssues(query.companyId),
				ComplianceService.verifySireReproducibility({
					companyId: query.companyId,
					year,
					month,
				}),
				FiscalIndicatorsService.getTaxCalendar(query.companyId, month, year),
			]);

		const sireObligation = taxCalendar.obligations.find(
			(item: any) => item.code === "SIRE",
		);
		const deadline = sireObligation
			? calculateDeadlineStatus(sireObligation.dueDate)
			: null;

		const submissionMode =
			(process.env.SIRE_SUBMISSION_MODE ?? "simulation").toLowerCase() === "api"
				? "api"
				: "simulation";
		const apiConfigured = Boolean((process.env.SIRE_API_TOKEN ?? "").trim());
		const policy = evaluateSireSubmissionPolicy({
			period,
			companyAnnualIncomePen: query.companyAnnualIncomePen,
			isPrico: query.isPrico,
		});

		return ok({
			period,
			submission: {
				mode: submissionMode,
				apiConfigured,
				publicApiDocumented: true,
				endpoint: (
					process.env.SIRE_API_BASE_URL ?? "https://api-sire.sunat.gob.pe"
				).trim(),
				manualFallback: {
					supported: true,
					formats: ["txt", "excel", "csv"],
					recommendedFor:
						"contingencia operativa, carga manual y conciliacion previa a envio",
				},
				policy,
			},
			compliance: complianceDashboard,
			reproducibility,
			deadline,
			openIssues: issues.filter((issue: any) => !issue.resolvedAt),
		});
	} catch (error: unknown) {
		set.status = 500;
		return fail(getErrorMessage(error), "SIRE_DASHBOARD_ERROR");
	}
}
