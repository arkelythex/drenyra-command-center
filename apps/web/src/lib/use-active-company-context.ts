import { useSyncExternalStore } from "react";
import {
	ACTIVE_COMPANY_STORAGE_KEY,
	AUTH_STORAGE_KEYS,
	getAvailableCompanyContexts,
	getCompanyContext,
	setActiveCompanyContext,
} from "./company-context";

export const ACTIVE_COMPANY_CHANGED_EVENT = "arkelythex-active-company-changed";

interface ActiveCompanySnapshot {
	companyContext: ReturnType<typeof getCompanyContext>;
	availableCompanies: ReturnType<typeof getAvailableCompanyContexts>;
}

let lastSnapshotSignature: string | null = null;
let lastSnapshotValue: ActiveCompanySnapshot | null = null;

function getStorageSignature(): string {
	if (typeof localStorage === "undefined") return "server";

	return JSON.stringify({
		activeCompany: localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY),
		auth: AUTH_STORAGE_KEYS.map((key) => localStorage.getItem(key)),
	});
}

function getSnapshot(): ActiveCompanySnapshot {
	const signature = getStorageSignature();
	if (lastSnapshotValue && lastSnapshotSignature === signature) {
		return lastSnapshotValue;
	}

	lastSnapshotSignature = signature;
	lastSnapshotValue = {
		companyContext: getCompanyContext(),
		availableCompanies: getAvailableCompanyContexts(),
	};

	return lastSnapshotValue;
}

function subscribe(callback: () => void): () => void {
	if (typeof window === "undefined") return () => {};

	const handleStorage = (event: StorageEvent) => {
		if (event.key && event.key !== ACTIVE_COMPANY_STORAGE_KEY) return;
		callback();
	};

	const handleCompanyChanged = () => callback();

	window.addEventListener("storage", handleStorage);
	window.addEventListener(ACTIVE_COMPANY_CHANGED_EVENT, handleCompanyChanged);

	return () => {
		window.removeEventListener("storage", handleStorage);
		window.removeEventListener(ACTIVE_COMPANY_CHANGED_EVENT, handleCompanyChanged);
	};
}

export function useActiveCompanyContext() {
	const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

	return {
		...snapshot,
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
	};
}
