import { useSyncExternalStore } from "react";
import {
	DEMO_COMPANY_ID,
	DEMO_COMPANY_NAME,
	DEMO_COMPANY_RUC,
} from "./company-context";

interface CompanyContext {
	companyId: string;
	companyName: string;
	ruc: string;
	countryCode: string;
}

interface ActiveFiscalSnapshot {
	companyContext: CompanyContext;
	availableCompanies: CompanyContext[];
	fiscalPeriod: string | null;
	availablePeriods: string[];
}

const MOCK_CONTEXT: CompanyContext = {
	companyId: DEMO_COMPANY_ID,
	companyName: DEMO_COMPANY_NAME,
	ruc: DEMO_COMPANY_RUC,
	countryCode: "PE",
};

const MOCK_SNAPSHOT: ActiveFiscalSnapshot = {
	companyContext: MOCK_CONTEXT,
	availableCompanies: [MOCK_CONTEXT],
	fiscalPeriod: "2026-03",
	availablePeriods: ["2026-03", "2026-02", "2026-01"],
};

function getSnapshot(): ActiveFiscalSnapshot {
	return MOCK_SNAPSHOT;
}

function subscribe(_callback: () => void): () => void {
	return () => {};
}

export function useActiveCompanyContext() {
	const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

	return {
		companyContext: snapshot.companyContext,
		availableCompanies: snapshot.availableCompanies,
		fiscalPeriod: snapshot.fiscalPeriod,
		availablePeriods: snapshot.availablePeriods,
		formatFiscalPeriodLabel: (period: string) => period,
		setActiveCompanyById: () => {},
		setActiveFiscalPeriod: () => {},
	};
}
