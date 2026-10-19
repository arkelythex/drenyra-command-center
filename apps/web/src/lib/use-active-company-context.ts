import { useSyncExternalStore } from "react";
import {
	ACTIVE_COMPANY_CHANGED_EVENT,
	ACTIVE_COMPANY_STORAGE_KEY,
	type CompanyContext,
	DEMO_COMPANY_ID,
	DEMO_COMPANY_NAME,
	DEMO_COMPANY_RUC,
	readActiveCompanyRaw,
	readActiveCompanyState,
	setActiveCompanyById,
} from "./company-context";
import {
	ACTIVE_FISCAL_PERIOD_CHANGED_EVENT,
	ACTIVE_FISCAL_PERIOD_STORAGE_KEY,
	formatFiscalPeriodLabel,
	getAvailableFiscalPeriods,
	getStoredFiscalPeriod,
	setActiveFiscalPeriod,
} from "./fiscal-period";

interface ActiveFiscalSnapshot {
	companyContext: CompanyContext;
	availableCompanies: CompanyContext[];
	fiscalPeriod: string | null;
	availablePeriods: string[];
}

/** Used until a session sets the active company (demo / signed-out). */
const DEMO_CONTEXT: CompanyContext = {
	companyId: DEMO_COMPANY_ID,
	companyName: DEMO_COMPANY_NAME,
	ruc: DEMO_COMPANY_RUC,
	countryCode: "PE",
};
const DEMO_PERIODS = ["2026-03", "2026-02", "2026-01"];

const STORAGE_KEYS = new Set<string | null>([
	ACTIVE_COMPANY_STORAGE_KEY,
	ACTIVE_FISCAL_PERIOD_STORAGE_KEY,
]);

let cache: { key: string; snapshot: ActiveFiscalSnapshot } | null = null;

function buildSnapshot(): ActiveFiscalSnapshot {
	const stored = readActiveCompanyState();
	const storedPeriod = getStoredFiscalPeriod();
	const isDemo = !stored;
	const availablePeriods = isDemo
		? DEMO_PERIODS
		: getAvailableFiscalPeriods(12);
	return {
		companyContext: stored?.active ?? DEMO_CONTEXT,
		availableCompanies: stored?.available ?? [DEMO_CONTEXT],
		fiscalPeriod: storedPeriod ?? availablePeriods[0] ?? null,
		availablePeriods,
	};
}

/** Referentially stable between changes, as `useSyncExternalStore` requires. */
function getSnapshot(): ActiveFiscalSnapshot {
	const key = `${readActiveCompanyRaw()}|${getStoredFiscalPeriod()}`;
	if (!cache || cache.key !== key) {
		cache = { key, snapshot: buildSnapshot() };
	}
	return cache.snapshot;
}

function subscribe(callback: () => void): () => void {
	const onStorage = (event: StorageEvent) => {
		if (STORAGE_KEYS.has(event.key)) callback();
	};
	window.addEventListener(ACTIVE_COMPANY_CHANGED_EVENT, callback);
	window.addEventListener(ACTIVE_FISCAL_PERIOD_CHANGED_EVENT, callback);
	window.addEventListener("storage", onStorage);
	return () => {
		window.removeEventListener(ACTIVE_COMPANY_CHANGED_EVENT, callback);
		window.removeEventListener(ACTIVE_FISCAL_PERIOD_CHANGED_EVENT, callback);
		window.removeEventListener("storage", onStorage);
	};
}

export function useActiveCompanyContext() {
	const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

	return {
		companyContext: snapshot.companyContext,
		availableCompanies: snapshot.availableCompanies,
		fiscalPeriod: snapshot.fiscalPeriod,
		availablePeriods: snapshot.availablePeriods,
		formatFiscalPeriodLabel,
		setActiveCompanyById,
		setActiveFiscalPeriod,
	};
}
