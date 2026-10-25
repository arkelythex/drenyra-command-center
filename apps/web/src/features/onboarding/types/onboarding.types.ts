export interface CompanySetup {
	ruc: string;
	legalName: string;
	address: string;
}

/** What SUNAT returned for a RUC; either field can be missing. */
export interface RucLookupResult {
	legalName?: string | undefined;
	address?: string | undefined;
}

export type CompanySetupDraft = Partial<CompanySetup>;
