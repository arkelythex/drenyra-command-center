export const ACTIVE_FISCAL_PERIOD_STORAGE_KEY =
	"drenyra-active-fiscal-period";

export const ACTIVE_FISCAL_PERIOD_CHANGED_EVENT =
	"drenyra-active-fiscal-period-changed";

/** Generate last N fiscal months as YYYY-MM strings from today. */
export function getAvailableFiscalPeriods(monthsBack: number = 12): string[] {
	const periods: string[] = [];
	const now = new Date();
	for (let i = 0; i < monthsBack; i++) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, "0");
		periods.push(`${y}-${m}`);
	}
	return periods;
}

/** Returns the stored period or null if not set / invalid. Never throws. */
export function getStoredFiscalPeriod(): string | null {
	if (typeof localStorage === "undefined") return null;
	try {
		const value = localStorage.getItem(ACTIVE_FISCAL_PERIOD_STORAGE_KEY);
		if (!value) return null;
		if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null;
		return value;
	} catch {
		return null;
	}
}

/** Write period to localStorage and dispatch change event. */
export function setActiveFiscalPeriod(period: string): void {
	if (typeof localStorage === "undefined") return;
	if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) return;

	localStorage.setItem(ACTIVE_FISCAL_PERIOD_STORAGE_KEY, period);

	if (typeof window !== "undefined") {
		window.dispatchEvent(new Event(ACTIVE_FISCAL_PERIOD_CHANGED_EVENT));
	}
}

/** Remove stored period and dispatch change event. */
export function clearFiscalPeriod(): void {
	if (typeof localStorage === "undefined") return;
	localStorage.removeItem(ACTIVE_FISCAL_PERIOD_STORAGE_KEY);

	if (typeof window !== "undefined") {
		window.dispatchEvent(new Event(ACTIVE_FISCAL_PERIOD_CHANGED_EVENT));
	}
}

/** Returns period label in spanish (e.g. "Julio 2026"). */
export function formatFiscalPeriodLabel(period: string): string {
	const MONTHS = [
		"Enero",
		"Febrero",
		"Marzo",
		"Abril",
		"Mayo",
		"Junio",
		"Julio",
		"Agosto",
		"Septiembre",
		"Octubre",
		"Noviembre",
		"Diciembre",
	];
	const match = period.match(/^(\d{4})-(\d{2})$/);
	if (!match) return period;
	const [, year, month] = match;
	const monthIndex = parseInt(month, 10) - 1;
	return `${MONTHS[monthIndex]} ${year}`;
}

/** Returns the active period or throws if unset. Use for strict contexts. */
export function getActiveFiscalPeriod(): string {
	const value = getStoredFiscalPeriod();
	if (!value) {
		throw new Error(
			"Drenyra requires an explicit selected fiscal period (YYYY-MM)",
		);
	}
	return value;
}
