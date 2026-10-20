/**
 * Where the monthly close lives: the mission workspace of the active company
 * for one fiscal period. Shared by every entry point (home, sidebar, command
 * bar) so none of them hardcodes a company or a month.
 */

export const MONTHLY_CLOSE_INTENT = "monthly-close";

const FISCAL_PERIOD = /^(\d{4})-(0[1-9]|1[0-2])$/;

export interface CloseWorkspaceParams {
	companyId: string;
	year: string;
	month: string;
	intent: string;
}

/** The period a close normally targets: the month before `today`. */
export function defaultClosePeriod(today: Date = new Date()): string {
	const d = new Date(today.getFullYear(), today.getMonth() - 1, 1);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Route params for the close workspace of `companyId` in `fiscalPeriod` (YYYY-MM). */
export function closeWorkspaceParams(
	companyId: string,
	fiscalPeriod: string | null,
): CloseWorkspaceParams {
	const period =
		fiscalPeriod && FISCAL_PERIOD.test(fiscalPeriod)
			? fiscalPeriod
			: defaultClosePeriod();
	const [year = "", month = ""] = period.split("-");
	return { companyId, year, month, intent: MONTHLY_CLOSE_INTENT };
}

/**
 * The API's fiscal period (YYYY-MM) for the workspace URL, or null when the
 * URL does not name a real month. Old links used an unpadded month ("3").
 */
export function fiscalPeriodFromParams(
	year: string,
	month: string,
): string | null {
	const period = `${year}-${month.padStart(2, "0")}`;
	return FISCAL_PERIOD.test(period) ? period : null;
}
