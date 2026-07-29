/**
 * Secrets Inventory — canonical registry of all secrets in the Drenyra stack.
 *
 * Each entry includes scope, rotation frequency, blast radius, and
 * whether it's required for application startup.
 *
 * @module secrets/inventory
 */

export interface SecretMetadata {
	name: string;
	scope: "dev" | "staging" | "prod" | "all";
	rotation: string;
	blastRadius: string;
	minEntropy?: number;
	required: boolean;
	notes: string;
}

export const SECRETS_INVENTORY: SecretMetadata[] = [
	{
		name: "BETTER_AUTH_SECRET",
		scope: "all",
		rotation: "Quarterly or on suspected compromise",
		blastRadius:
			"All user sessions invalidated; password reset tokens invalidated",
		minEntropy: 128,
		required: true,
		notes: "Used to sign session tokens and MFA JWTs. Minimum 32 chars.",
	},
	{
		name: "DATABASE_URL",
		scope: "all",
		rotation: "Quarterly",
		blastRadius: "Full database access; all data exposed if leaked",
		required: true,
		notes: "PostgreSQL connection string with credentials.",
	},
	{
		name: "SUNAT_CLIENT_ID",
		scope: "prod",
		rotation: "Per SUNAT policy (manual)",
		blastRadius: "SUNAT API access; tax declaration capability",
		required: true,
		notes: "OAuth2 client ID for SUNAT API integration.",
	},
	{
		name: "SUNAT_CLIENT_SECRET",
		scope: "prod",
		rotation: "Per SUNAT policy (manual)",
		blastRadius: "SUNAT API access; tax declaration capability",
		minEntropy: 128,
		required: true,
		notes: "OAuth2 client secret. Rotate with SUNAT_CLIENT_ID.",
	},
	{
		name: "DRENYRA_MASTER_KEY",
		scope: "all",
		rotation:
			"Annually or on suspected compromise; requires data re-encryption",
		blastRadius: "All AES-256-GCM encrypted data; fiscal records, AI context",
		minEntropy: 256,
		required: true,
		notes: "Master encryption key for envelope encryption. 32 bytes base64.",
	},
	{
		name: "LLM_GATEWAY_KEY_PASSPHRASE",
		scope: "all",
		rotation: "Quarterly",
		blastRadius: "AI provider API keys; LLM access for all tenants",
		minEntropy: 128,
		required: true,
		notes: "Passphrase protecting the LLM gateway key store.",
	},
	{
		name: "ARKELYTHEX_AES256_KEY",
		scope: "all",
		rotation: "Annually or on suspected compromise",
		blastRadius: "Legacy encrypted data; journal entries, fiscal records",
		minEntropy: 256,
		required: true,
		notes: "Legacy AES-256 key. Being migrated to DRENYRA_MASTER_KEY envelope.",
	},
	{
		name: "R2_ACCESS_KEY_ID",
		scope: "all",
		rotation: "Quarterly",
		blastRadius: "Object storage access; document uploads and exports",
		required: true,
		notes: "Cloudflare R2 access key ID.",
	},
	{
		name: "R2_SECRET_ACCESS_KEY",
		scope: "all",
		rotation: "Quarterly",
		blastRadius: "Object storage access; document uploads and exports",
		minEntropy: 128,
		required: true,
		notes: "Cloudflare R2 secret access key.",
	},
];
