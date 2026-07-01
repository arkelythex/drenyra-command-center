import { fail, getErrorMessage, ok } from "../shared/api-response";
import { SireComparisonService } from "./infrastructure/compare.service";
import type {
	DiscrepancyResolution,
	DiscrepancyType,
	ReconciliationAction,
} from "./types";

export async function getComparison(
	companyId: string,
	period: string,
	set: { status: number },
) {
	try {
		const result = await SireComparisonService.getComparison(companyId, period);
		return ok(result);
	} catch (error) {
		set.status = 500;
		return fail(getErrorMessage(error), "SIRE_COMPARISON_ERROR");
	}
}

export async function getDiscrepancies(
	companyId: string,
	period: string,
	set: { status: number },
	type?: DiscrepancyType,
	resolutionStatus?: DiscrepancyResolution,
) {
	try {
		const discrepancies = await SireComparisonService.getDiscrepancies(
			companyId,
			period,
			type,
			resolutionStatus,
		);
		return ok(discrepancies);
	} catch (error) {
		set.status = 500;
		return fail(getErrorMessage(error), "SIRE_DISCREPANCIES_ERROR");
	}
}

export async function resolveDiscrepancy(
	id: string,
	action: ReconciliationAction,
	set: { status: number },
	notes?: string,
) {
	try {
		const result = await SireComparisonService.resolveDiscrepancy(
			id,
			action,
			notes,
		);
		return ok(result);
	} catch (error) {
		const message = getErrorMessage(error);
		if (message.includes("not found")) {
			set.status = 404;
			return fail(message, "DISCREPANCY_NOT_FOUND");
		}
		set.status = 500;
		return fail(message, "SIRE_RESOLVE_ERROR");
	}
}

export async function getComparisonReport(
	companyId: string,
	period: string,
	set: { status: number },
) {
	try {
		const result = await SireComparisonService.getReport(companyId, period);
		return ok(result);
	} catch (error) {
		set.status = 500;
		return fail(getErrorMessage(error), "SIRE_REPORT_ERROR");
	}
}

export async function getDashboard(companyId: string, set: { status: number }) {
	try {
		const result = await SireComparisonService.getDashboard(companyId);
		return ok(result);
	} catch (error) {
		set.status = 500;
		return fail(getErrorMessage(error), "SIRE_DASHBOARD_ERROR");
	}
}
