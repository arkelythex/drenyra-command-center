/**
 * SIRE Submission config builder.
 * Reads environment variables and builds submission configuration.
 */
import type {
	SireAuthMode,
	SireSubmissionConfig,
	SireUploadMode,
} from "../types";

export function buildSireConfig(): SireSubmissionConfig {
	const mode =
		(process.env.SIRE_SUBMISSION_MODE ?? "simulation").toLowerCase() === "api"
			? "api"
			: "simulation";
	const baseUrl = readEnv(
		process.env.SIRE_API_BASE_URL,
		"https://api-sire.sunat.gob.pe",
	);
	const legacySubmissionPath = readEnv(process.env.SIRE_API_SUBMISSION_PATH);
	const salesSubmissionPath = (
		readEnv(process.env.SIRE_API_SALES_SUBMISSION_PATH) ||
		legacySubmissionPath ||
		"/v1/contribuyente/migeigv/libros/rvierce/receptorpreliminar/web/preliminar/upload"
	).trim();
	const purchasesSubmissionPath = (
		readEnv(process.env.SIRE_API_PURCHASES_SUBMISSION_PATH) ||
		legacySubmissionPath ||
		"/v1/contribuyente/migeigv/libros/rvierce/receptorpreliminar/web/preliminar/upload"
	).trim();
	const apiToken = (process.env.SIRE_API_TOKEN ?? "").trim();
	const authMode = parseAuthMode(process.env.SIRE_AUTH_MODE);
	const uploadMode = parseUploadMode(process.env.SIRE_API_UPLOAD_MODE);
	const uploadFieldName =
		(process.env.SIRE_API_UPLOAD_FIELD_NAME ?? "archivo").trim() || "archivo";
	const allowSimulationFallbackInApiMode = parseBoolean(
		process.env.SIRE_ALLOW_API_SIMULATION_FALLBACK,
		true,
	);
	const companyRuc = (process.env.COMPANY_RUC ?? "").trim();
	const timeoutMs = parsePositiveInt(process.env.SIRE_API_TIMEOUT_MS, 15000);

	return {
		mode,
		baseUrl,
		salesSubmissionPath,
		purchasesSubmissionPath,
		apiToken,
		authMode,
		uploadMode,
		uploadFieldName,
		allowSimulationFallbackInApiMode,
		timeoutMs,
		companyRuc,
		deprecatedCompanyRuc: companyRuc,
		oauth: {
			baseUrl: readEnv(
				process.env.SUNAT_OAUTH_BASE_URL,
				"https://api-seguridad.sunat.gob.pe",
			),
			tokenPathTemplate: readEnv(
				process.env.SUNAT_OAUTH_TOKEN_PATH_TEMPLATE,
				"/v1/clientessol/{clientId}/oauth2/token/",
			),
			scope: readEnv(
				process.env.SUNAT_OAUTH_SCOPE,
				"https://api-sire.sunat.gob.pe",
			),
			clientId: (process.env.SUNAT_CLIENT_ID ?? "").trim(),
			clientSecret: (process.env.SUNAT_CLIENT_SECRET ?? "").trim(),
			solUsername: (process.env.SUNAT_SOL_USERNAME ?? "").trim(),
			solPassword: (process.env.SUNAT_SOL_PASSWORD ?? "").trim(),
		},
	};
}

function parseAuthMode(value: string | undefined): SireAuthMode {
	const normalized = (value ?? "auto").trim().toLowerCase();
	switch (normalized) {
		case "token":
		case "oauth-sol":
		case "auto":
			return normalized as SireAuthMode;
		default:
			return "auto";
	}
}

function parseUploadMode(value: string | undefined): SireUploadMode {
	const normalized = (value ?? "json-base64").trim().toLowerCase();
	return normalized === "multipart-zip" ? "multipart-zip" : "json-base64";
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
	if (!value) return fallback;
	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
	return parsed;
}

function readEnv(value: string | undefined, fallback = ""): string {
	const trimmed = (value ?? "").trim();
	if (!trimmed) return fallback;
	if (trimmed.toLowerCase() === "undefined") return fallback;
	if (trimmed.toLowerCase() === "null") return fallback;
	return trimmed;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
	if (!value) return fallback;
	const normalized = value.trim().toLowerCase();
	if (normalized === "1" || normalized === "true" || normalized === "yes")
		return true;
	if (normalized === "0" || normalized === "false" || normalized === "no")
		return false;
	return fallback;
}
