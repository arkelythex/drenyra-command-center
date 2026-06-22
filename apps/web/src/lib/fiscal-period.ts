export const ACTIVE_FISCAL_PERIOD_STORAGE_KEY = "arkelythex-active-fiscal-period";

export function getActiveFiscalPeriod(): string {
	const value = typeof localStorage === "undefined" ? null : localStorage.getItem(ACTIVE_FISCAL_PERIOD_STORAGE_KEY);
	if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
		throw new Error("Drenyra requires an explicit selected fiscal period (YYYY-MM)");
	}
	return value;
}
