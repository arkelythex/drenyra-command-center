import type { OrganizationRepository } from "@drenyra/domain/repositories/organization.repository";
import { assertTenantScope } from "./tenant-scope";
import type {
	AuditLogger,
	ClientDetailResponse,
	UseCaseContext,
} from "./types";
import { mapToClientDetail } from "./types";

export class ReactivateOrganizationUseCase {
	constructor(
		private readonly repo: OrganizationRepository,
		private readonly auditLogger: AuditLogger,
	) {}

	async execute(
		organizationId: string,
		context: UseCaseContext,
	): Promise<ClientDetailResponse> {
		const org = await this.repo.findById(organizationId);
		if (!org) {
			throw new Error("Organization not found");
		}

		assertTenantScope(org, context.tenantId);

		const reactivated = org.reactivate();
		const saved = await this.repo.update(reactivated);

		this.auditLogger.log({
			organizationId,
			tenantId: context.tenantId,
			actorId: context.actorId,
			fromStatus: "SUSPENDED",
			toStatus: "ACTIVE",
			reason: null,
			timestamp: new Date().toISOString(),
		});

		return mapToClientDetail(saved);
	}
}
