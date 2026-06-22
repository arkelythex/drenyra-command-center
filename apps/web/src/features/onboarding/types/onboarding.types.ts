export interface CompanySetup {
	ruc: string;
	legalName: string;
	address: string;
	taxRegime: string;
	solUser: string;
	solPass: string;
	certificate?: File | null;
	certificatePassword?: string;
	logo?: File | null;
	primaryColor?: string;
}

export interface RucLookupResult {
	legalName: string;
	address: string;
	taxRegime: string;
}

export type CompanySetupDraft = Partial<CompanySetup>;
export type OnboardingStep =
	| "COMPANY"
	| "CERTIFICATE"
	| "BRANDING"
	| "COMPLETE";
