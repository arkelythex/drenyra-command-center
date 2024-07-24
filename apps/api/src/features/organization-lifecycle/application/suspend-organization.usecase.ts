import type { OrganizationRepository } from "@drenyra/domain/repositories/organization.repository";
import { assertTenantScope } from "./tenant-scope";
import type { AuditLogger } from "./types";
import type {
	ClientDetailResponse,
	SuspendOrganizationInput,
	UseCaseContext,
} from "./types";
import { mapToClientDetail } from "./types";

export class SuspendOrganizationUseCase {
	constructor(
		private readonly repo: OrganizationRepository,
		private readonly auditLogger: AuditLogger,
	) {}

	async execute(
		organizationId: string,
		input: SuspendOrganizationInput,
		context: UseCaseContext,
	): Promise<ClientDetailResponse> {
		const org = await this.repo.findById(organizationId);
		if (!org) {
			throw new Error("Organization not found");
		}

		assertTenantScope(org, context.tenantId);

		const suspended = org.suspend(input.reason);
		const saved = await this.repo.update(suspended);

		this.auditLogger.log({
			organizationId,
			tenantId: context.tenantId,
			actorId: context.actorId,
			fromStatus: "ACTIVE",
			toStatus: "SUSPENDED",
			reason: input.reason ?? null,
			timestamp: new Date().toISOString(),
		});

		return mapToClientDetail(saved);
	}

}
