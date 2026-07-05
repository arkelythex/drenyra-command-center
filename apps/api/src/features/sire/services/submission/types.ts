export interface SireAuditOptions {
	createdBy?: string;
	governanceTrace?: unknown;
}

export type SunatAuditTrace = {
	companyId: string;
	resolvedRuc?: string;
	credentialFingerprint?: string;
	decision: "allowed" | "refused";
	outcome?: string;
	reason?: string;
	suppliedRuc?: string;
	comparedRuc?: string;
};
