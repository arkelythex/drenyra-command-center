import { PostgresOrganizationRepository } from "@drenyra/persistence";
import type { FirmTenantContext } from "../../../middleware/tenant-context";
import type { ApiFailure, ApiSuccess } from "../../shared/api-response";
import { fail, ok } from "../../shared/api-response";
import { ConsoleAuditLogger } from "./audit-logger";
import { CreateOrganizationUseCase } from "./create-organization.usecase";
import { mapUseCaseError } from "./error-mapper";
import { ReactivateOrganizationUseCase } from "./reactivate-organization.usecase";
import { SuspendOrganizationUseCase } from "./suspend-organization.usecase";
import type {
	ClientDetailResponse,
	CreateOrganizationInput,
	OrganizationSettings,
	SuspendOrganizationInput,
} from "./types";
import { ALLOWED_SETTINGS_KEYS, mapToClientDetail } from "./types";

const repo = new PostgresOrganizationRepository();
const auditLogger = new ConsoleAuditLogger();

const createUseCase = new CreateOrganizationUseCase(repo, auditLogger);
const suspendUseCase = new SuspendOrganizationUseCase(repo, auditLogger);
const reactivateUseCase = new ReactivateOrganizationUseCase(repo, auditLogger);

export async function createOrganization(
	firmTenant: FirmTenantContext,
	body: CreateOrganizationInput,
): Promise<ApiSuccess<ClientDetailResponse> | ApiFailure> {
	try {
		const result = await createUseCase.execute(body, {
			tenantId: firmTenant.organizationId,
			actorId: firmTenant.userId,
		});
		return ok(result);
	} catch (error) {
		const mapped = mapUseCaseError(error);
		return fail(mapped.body.error, mapped.body.code);
	}
}

export async function suspendOrganization(
	firmTenant: FirmTenantContext,
	clientId: string,
	body: SuspendOrganizationInput,
): Promise<ApiSuccess<ClientDetailResponse> | ApiFailure> {
	try {
		const result = await suspendUseCase.execute(clientId, body, {
			tenantId: firmTenant.organizationId,
			actorId: firmTenant.userId,
		});
		return ok(result);
	} catch (error) {
		const mapped = mapUseCaseError(error);
		return fail(mapped.body.error, mapped.body.code);
	}
}

export async function reactivateOrganization(
	firmTenant: FirmTenantContext,
	clientId: string,
): Promise<ApiSuccess<ClientDetailResponse> | ApiFailure> {
	try {
		const result = await reactivateUseCase.execute(clientId, {
			tenantId: firmTenant.organizationId,
			actorId: firmTenant.userId,
		});
		return ok(result);
	} catch (error) {
		const mapped = mapUseCaseError(error);
		return fail(mapped.body.error, mapped.body.code);
	}
}

// ─── Settings Validation Helpers ──────────────────────────────────────

export function validateSettings(
	settings: Record<string, unknown>,
):
	| { valid: true; data: OrganizationSettings }
	| { valid: false; error: string } {
	const unknownKeys = Object.keys(settings).filter(
		(key) => !(ALLOWED_SETTINGS_KEYS as readonly string[]).includes(key),
	);

	if (unknownKeys.length > 0) {
		return {
			valid: false,
			error: `Unknown settings keys: ${unknownKeys.join(", ")}`,
		};
	}

	return { valid: true, data: settings as OrganizationSettings };
}

export async function updateClientSettings(
	firmTenant: FirmTenantContext,
	clientId: string,
	settings: OrganizationSettings,
): Promise<ApiSuccess<ClientDetailResponse> | ApiFailure> {
	try {
		const client = await repo.findById(clientId);
		if (!client) {
			return {
				success: false,
				error: "Client not found",
				code: "CLIENT_NOT_FOUND",
			};
		}

		// Tenant scope check
		const clientSettings = client.settings as
			| Record<string, unknown>
			| undefined;
		if (clientSettings?._tenantFirmId !== firmTenant.organizationId) {
			return {
				success: false,
				error: "Organization does not belong to the firm's tenant scope",
				code: "TENANT_SCOPE_VIOLATION",
			};
		}

		const updated = client.updateSettings({ ...settings });
		const saved = await repo.update(updated);

		return ok(mapToClientDetail(saved));
	} catch (error) {
		const mapped = mapUseCaseError(error);
		return fail(mapped.body.error, mapped.body.code);
	}
}
