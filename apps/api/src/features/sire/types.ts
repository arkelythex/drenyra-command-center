/**
 * SIRE Submission types and interfaces.
 */
import type { SireSubmissionPolicyDecision } from "./services/sire-policy-2026.service";

/**
 * SIRE ledger book kind.
 * @example "ventas"
 * @example "compras"
 */
export type SireLedgerType = "ventas" | "compras";

/**
 * Accepted SIRE payload serialization format.
 * @example "txt"
 * @example "xml"
 */
export type SirePayloadFormat = "txt" | "csv" | "json" | "xml";

/**
 * SIRE authentication strategy selected by configuration.
 * @example "oauth-sol"
 * @example "token"
 */
export type SireAuthMode = "auto" | "token" | "oauth-sol";

/**
 * SIRE upload transport encoding.
 * @example "json-base64"
 * @example "multipart-zip"
 */
export type SireUploadMode = "json-base64" | "multipart-zip";

/**
 * Logical SUNAT credential usage scope.
 * @example "sire.submit"
 * @example "sire.live-summary"
 */
export type SunatCredentialScope = "sire.submit" | "sire.live-summary";

/**
 * No-secret credential identity bound to one SUNAT RUC and scope.
 * @example
 * ```ts
 * const credential: SunatCredentialIdentity = {
 *   clientId: "client-20123456786",
 *   fingerprint: "sha256:abc123",
 *   ruc: "20123456786",
 *   scope: "sire.submit",
 * };
 * ```
 * @example credential.fingerprint
 */
export interface SunatCredentialIdentity {
	clientId: string;
	fingerprint: string;
	ruc: string;
	scope: SunatCredentialScope;
}

/**
 * Tenant-resolved context used by outbound SUNAT/SIRE operations.
 * @example
 * ```ts
 * const context: TenantSunatContext = {
 *   companyId: "company-id",
 *   ruc: "20123456786",
 *   credential,
 * };
 * ```
 * @example context.ruc
 */
export interface TenantSunatContext {
	companyId: string;
	ruc: string;
	credential: SunatCredentialIdentity;
}

/**
 * OAuth token cache identity components; never include token or secret material.
 * @example
 * ```ts
 * const key: SunatCredentialCacheKey = {
 *   ruc: "20123456786",
 *   clientFingerprint: "sha256:abc123",
 *   scope: "sire.submit",
 * };
 * ```
 * @example key.scope
 */
export interface SunatCredentialCacheKey {
	ruc: string;
	clientFingerprint: string;
	scope: SunatCredentialScope;
}

/**
 * SIRE submission command payload.
 * @example
 * ```ts
 * const input: SubmitSireInput = {
 *   companyId: "company-id",
 *   period: "2026-02",
 *   ledgerType: "ventas",
 *   payloadFormat: "txt",
 *   payloadBase64: "dGVzdA==",
 * };
 * ```
 * @example input.companyId
 */
export interface SubmitSireInput {
	companyId: string;
	period: string;
	ledgerType: SireLedgerType;
	payloadFormat: SirePayloadFormat;
	payloadBase64: string;
	/** Optional RUC supplied by the SIRE payload/document; must match authenticated tenant RUC when present. */
	ruc?: string;
	idempotencyKey?: string;
	dryRun?: boolean;
	companyAnnualIncomePen?: number;
	isPrico?: boolean;
}

/**
 * SIRE submission result returned to API callers.
 * @example
 * ```ts
 * const result: SireSubmissionResult = {
 *   submissionId: "SIM-1",
 *   status: "SIMULATED",
 *   provider: "simulation",
 *   submittedAt: new Date().toISOString(),
 *   period: "2026-02",
 *   ledgerType: "ventas",
 *   dryRun: false,
 *   message: "Simulated",
 * };
 * ```
 * @example result.status
 */
export interface SireSubmissionResult {
	submissionId: string;
	status: "ACCEPTED" | "RECEIVED" | "REJECTED" | "SIMULATED";
	provider: "sunat-api" | "simulation";
	submittedAt: string;
	period: string;
	ledgerType: SireLedgerType;
	dryRun: boolean;
	message: string;
	trackingId?: string;
	sunatTicket?: string;
	policy?: SireSubmissionPolicyDecision;
}

/**
 * Runtime SIRE configuration read from environment variables.
 * @example
 * ```ts
 * const mode: SireSubmissionConfig["mode"] = "simulation";
 * ```
 * @example config.authMode
 */
export interface SireSubmissionConfig {
	mode: "api" | "simulation";
	baseUrl: string;
	salesSubmissionPath: string;
	purchasesSubmissionPath: string;
	apiToken: string;
	authMode: SireAuthMode;
	uploadMode: SireUploadMode;
	uploadFieldName: string;
	allowSimulationFallbackInApiMode: boolean;
	timeoutMs: number;
	/** Deprecated compatibility RUC. TenantSunatContext.ruc is authoritative for outbound API calls. */
	companyRuc: string;
	/** Deprecated compatibility RUC used only to validate tenant context boundaries. */
	deprecatedCompanyRuc: string;
	oauth: {
		baseUrl: string;
		tokenPathTemplate: string;
		scope: string;
		clientId: string;
		clientSecret: string;
		solUsername: string;
		solPassword: string;
	};
}
