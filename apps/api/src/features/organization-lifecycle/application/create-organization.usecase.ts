import { Organization } from "@drenyra/domain";
import type { OrganizationRepository } from "@drenyra/domain/repositories/organization.repository";
import type { AuditLogger } from "./types";
import type {
	CreateOrganizationInput,
	ClientDetailResponse,
	UseCaseContext,
} from "./types";
import { mapToClientDetail } from "./types";

export class CreateOrganizationUseCase {
	constructor(
		private readonly repo: OrganizationRepository,
		private readonly auditLogger: AuditLogger,
	) {}

	async execute(
		input: CreateOrganizationInput,
		context: UseCaseContext,
	): Promise<ClientDetailResponse> {
		// Check uniqueness within tenant
		await this.assertRucUnique(input.ruc, context.tenantId);
		await this.assertSlugUnique(input.slug, context.tenantId);

		// Build tenant-aware settings: merge user settings with _tenantFirmId
		const tenantSettings = {
			...input.settings,
			_tenantFirmId: context.tenantId,
		};

		const id = String(Date.now());
		const now = new Date();

		const org = Organization.create({
			id,
			name: input.name,
			ruc: input.ruc,
			slug: input.slug,
			status: "ACTIVE",
			settings: tenantSettings,
			createdAt: now,
			updatedAt: now,
		});

		const saved = await this.repo.save(org);

		this.auditLogger.log({
			organizationId: id,
			tenantId: context.tenantId,
			actorId: context.actorId,
			fromStatus: null,
			toStatus: "ACTIVE",
			reason: null,
			timestamp: now.toISOString(),
		});

		return mapToClientDetail(saved);
	}

	private async assertRucUnique(
		ruc: string,
		tenantId: string,
	): Promise<void> {
		const existing = await this.repo.findByRuc(ruc);
		if (existing) {
			const settings = existing.settings as Record<string, unknown> | undefined;
			if (settings?._tenantFirmId === tenantId) {
				throw new Error("RUC already exists in this tenant");
			}
		}
	}

	private async assertSlugUnique(
		slug: string,
		tenantId: string,
	): Promise<void> {
		const existing = await this.repo.findBySlug(slug);
		if (existing) {
			const settings = existing.settings as Record<string, unknown> | undefined;
			if (settings?._tenantFirmId === tenantId) {
				throw new Error("slug already exists in this tenant");
			}
		}
	}
}
