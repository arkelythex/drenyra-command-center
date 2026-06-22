/**
 * resolveYearMonth operation.
 *
 * @param period - Input for period.
 * @returns Result of resolveYearMonth.
 * @example
 * ```ts
 * const result = resolveYearMonth("");
 * console.log(result);
 * ```
 */
export function resolveYearMonth(period?: string): {
	year: number;
	month: number;
	period: string;
} {
	if (!period) {
		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth() + 1;
		return {
			year,
			month,
			period: `${year}-${month.toString().padStart(2, "0")}`,
		};
	}

	const [yearText, monthText] = period.split("-");
	const year = Number(yearText);
	const month = Number(monthText);
	return { year, month, period };
}

/**
 * calculateDeadlineStatus operation.
 *
 * @param dueDateIso - Input for dueDateIso.
 * @returns Result of calculateDeadlineStatus.
 * @example
 * ```ts
 * const result = calculateDeadlineStatus("");
 * console.log(result);
 * ```
 */
export function calculateDeadlineStatus(dueDateIso: string): {
	dueDate: string;
	daysRemaining: number;
	status: "OVERDUE" | "DUE_SOON" | "ON_TRACK";
} {
	const now = new Date();
	const dueDate = new Date(`${dueDateIso}T23:59:59.999Z`);
	const millis = dueDate.getTime() - now.getTime();
	const daysRemaining = Math.ceil(millis / (1000 * 60 * 60 * 24));

	if (daysRemaining < 0) {
		return { dueDate: dueDateIso, daysRemaining, status: "OVERDUE" };
	}
	if (daysRemaining <= 5) {
		return { dueDate: dueDateIso, daysRemaining, status: "DUE_SOON" };
	}
	return { dueDate: dueDateIso, daysRemaining, status: "ON_TRACK" };
}
