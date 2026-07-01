export type OrganizationStatus = "ACTIVE" | "SUSPENDED" | "INACTIVE";

export interface OrganizationSettings {
	fiscalYearEnd?: string;
	defaultCurrency?: string;
	timezone?: string;
	features?: string[];
	[key: string]: unknown;
}

export interface FirmMetrics {
	totalCompanies: number;
	activeCompanies: number;
	pendingReconciliations: number;
	overdueDocuments: number;
	healthPercentage: number;
}

export interface OrganizationProps {
	id: string;
	name: string;
	ruc: string;
	slug: string;
	settings?: OrganizationSettings;
	status: OrganizationStatus;
	healthScore?: number;
	metrics?: FirmMetrics;
	createdAt: Date;
	updatedAt: Date;
}

export interface OrganizationPrimitiveData {
	id: string;
	name: string;
	ruc: string;
	slug: string;
	settings?: OrganizationSettings;
	status: string;
	healthScore?: number;
	metrics?: FirmMetrics;
	createdAt: string | Date;
	updatedAt: string | Date;
}
