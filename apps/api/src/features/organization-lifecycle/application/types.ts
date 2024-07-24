import type { Organization } from "@drenyra/domain";

// ─── API-level OrganizationSettings (no index signature) ──────────────

export interface OrganizationSettings {
	fiscalYearEnd?: string;
	defaultCurrency?: string;
	timezone?: string;
	features?: string[];
}

export const ALLOWED_SETTINGS_KEYS = [
	"fiscalYearEnd",
	"defaultCurrency",
	"timezone",
	"features",
] as const;

// ─── Input DTOs ───────────────────────────────────────────────────────

export interface CreateOrganizationInput {
	name: string;
	ruc: string;
	slug: string;
	settings?: OrganizationSettings;
}

export interface SuspendOrganizationInput {
	reason?: string;
}

// Reactivate has no request body — explicit empty type for clarity
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ReactivateOrganizationInput {}

export interface UpdateSettingsInput {
	settings: OrganizationSettings;
}

// ─── Response DTO ─────────────────────────────────────────────────────

export interface ClientDetailResponse {
	id: string;
	name: string;
	ruc: string;
	slug: string;
	status: string;
	healthScore: number | null;
	settings: Record<string, unknown> | null;
	createdAt: string;
	updatedAt: string;
}

// ─── Audit ────────────────────────────────────────────────────────────

export interface AuditEvent {
	organizationId: string;
	tenantId: string;
	actorId: string;
	fromStatus: string | null;
	toStatus: string;
	reason: string | null;
	timestamp: string;
}

export interface AuditLogger {
	log(event: AuditEvent): void;
}

// ─── Use Case Context ─────────────────────────────────────────────────

export interface UseCaseContext {
	tenantId: string;
	actorId: string;
}

// ─── Mapper helpers ───────────────────────────────────────────────────

export function mapToClientDetail(org: Organization): ClientDetailResponse {
	const json = org.toJSON();
	return {
		id: json.id as string,
		name: json.name as string,
		ruc: json.ruc as string,
		slug: json.slug as string,
		status: json.status as string,
		healthScore: (json.healthScore as number | undefined) ?? null,
		settings: (json.settings as Record<string, unknown> | undefined) ?? null,
		createdAt: json.createdAt as string,
		updatedAt: json.updatedAt as string,
	};
}
