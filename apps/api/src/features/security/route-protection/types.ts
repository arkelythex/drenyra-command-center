export type RouteAuthMode =
	| "public"
	| "session"
	| "bearer-tenant"
	| "signed-machine"
	| "ai-surface"
	| "legacy-header-fallback";

export type RouteTenantSource =
	| "none"
	| "x-company-id"
	| "x-organization-id"
	| "session"
	| "machine-scope"
	| "mixed";

export type RouteSchemaSystem = "typebox" | "zod" | "mixed" | "none";

export type RouteEnvelopeStyle =
	| "canonical"
	| "custom"
	| "plain-json"
	| "mixed";

export type RouteRateLimitStatus =
	| "documented"
	| "implemented"
	| "missing"
	| "unknown";

export interface RouteProtectionMatrixRow {
	readonly id: string;
	readonly surface: string;
	readonly appCoreExportName: string;
	readonly prefix: string;
	readonly mounted: true;
	readonly authMode: RouteAuthMode;
	readonly tenantSource: RouteTenantSource;
	readonly schemaSystem: RouteSchemaSystem;
	readonly envelope: RouteEnvelopeStyle;
	readonly rateLimit: RouteRateLimitStatus;
	readonly notes: string;
	/** Phase 2: requires MFA step-up verification for this route */
	readonly requireMfa?: boolean;
}
