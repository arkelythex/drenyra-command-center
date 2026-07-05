import { useSyncExternalStore } from "react";
import {
	ACTIVE_COMPANY_STORAGE_KEY,
	AUTH_STORAGE_KEYS,
	getAvailableCompanyContexts,
	getCompanyContext,
	setActiveCompanyContext,
} from "./company-context";
import {
	ACTIVE_FISCAL_PERIOD_CHANGED_EVENT,
	ACTIVE_FISCAL_PERIOD_STORAGE_KEY,
	formatFiscalPeriodLabel,
	getAvailableFiscalPeriods,
	getStoredFiscalPeriod,
	setActiveFiscalPeriod as setFiscalPeriod,
} from "./fiscal-period";

export const ACTIVE_COMPANY_CHANGED_EVENT = "drenyra-active-company-changed";

interface ActiveFiscalSnapshot {
	companyContext: ReturnType<typeof getCompanyContext>;
	availableCompanies: ReturnType<typeof getAvailableCompanyContexts>;
	fiscalPeriod: string | null;
	availablePeriods: string[];
}

let lastSnapshotSignature: string | null = null;
let lastSnapshotValue: ActiveFiscalSnapshot | null = null;

function getStorageSignature(): string {
	if (typeof localStorage === "undefined") return "server";

	return JSON.stringify({
		activeCompany: localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY),
		activePeriod: localStorage.getItem(ACTIVE_FISCAL_PERIOD_STORAGE_KEY),
		auth: AUTH_STORAGE_KEYS.map((key) => localStorage.getItem(key)),
	});
}

function getCurrentMonth(): string {
	const now = new Date();
	const m = String(now.getMonth() + 1).padStart(2, "0");
	return `${now.getFullYear()}-${m}`;
}

function getSnapshot(): ActiveFiscalSnapshot {
	const signature = getStorageSignature();
	if (lastSnapshotValue && lastSnapshotSignature === signature) {
		return lastSnapshotValue;
	}

	const stored = getStoredFiscalPeriod();

	lastSnapshotSignature = signature;
	lastSnapshotValue = {
		companyContext: getCompanyContext(),
		availableCompanies: getAvailableCompanyContexts(),
		// Fallback al mes actual si no hay periodo almacenado
		fiscalPeriod: stored ?? getCurrentMonth(),
		availablePeriods: getAvailableFiscalPeriods(),
	};

	return lastSnapshotValue;
}

function subscribe(callback: () => void): () => void {
	if (typeof window === "undefined") return () => {};

	const handleStorage = (event: StorageEvent) => {
		if (
			event.key &&
			event.key !== ACTIVE_COMPANY_STORAGE_KEY &&
			event.key !== ACTIVE_FISCAL_PERIOD_STORAGE_KEY
		) {
			return;
		}
		callback();
	};

	const handleCompanyChanged = () => callback();
	const handlePeriodChanged = () => callback();

	window.addEventListener("storage", handleStorage);
	window.addEventListener(ACTIVE_COMPANY_CHANGED_EVENT, handleCompanyChanged);
	window.addEventListener(
		ACTIVE_FISCAL_PERIOD_CHANGED_EVENT,
		handlePeriodChanged,
	);

	return () => {
		window.removeEventListener("storage", handleStorage);
		window.removeEventListener(
			ACTIVE_COMPANY_CHANGED_EVENT,
			handleCompanyChanged,
		);
		window.removeEventListener(
			ACTIVE_FISCAL_PERIOD_CHANGED_EVENT,
			handlePeriodChanged,
		);
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
		setActiveCompanyById: (companyId: string) => {
			const nextCompany = snapshot.availableCompanies.find(
				(company) => company.companyId === companyId,
			);
			if (!nextCompany) return;

			setActiveCompanyContext({
				companyId: nextCompany.companyId,
				companyName: nextCompany.companyName,
				ruc: nextCompany.ruc,
				countryCode: nextCompany.countryCode,
			});
		},
		setActiveFiscalPeriod: (period: string) => {
			setFiscalPeriod(period);
		},
	};
}
