import { Organization } from "@drenyra/domain";
import type { OrganizationRepository } from "@drenyra/domain/repositories/organization.repository";
import { describe, expect, it, vi } from "vitest";
import { SpyAuditLogger } from "../audit-logger";
import { CreateOrganizationUseCase } from "../create-organization.usecase";
import type { CreateOrganizationInput, UseCaseContext } from "../types";

// Valid RUC: 20123456786 (SUNAT checksum verified)
// Invalid RUC for tests: 12345678901 (wrong checksum)
function buildValidInput(
	overrides?: Partial<CreateOrganizationInput>,
): CreateOrganizationInput {
	return {
		name: "Acme Corp",
		ruc: "20123456786",
		slug: "acme-corp",
		...overrides,
	};
}

function buildContext(overrides?: Partial<UseCaseContext>): UseCaseContext {
	return {
		tenantId: "firm-A",
		actorId: "user-1",
		...overrides,
	};
}

function createMockRepo(
	overrides?: Partial<OrganizationRepository>,
): OrganizationRepository {
	return {
		findById: vi.fn().mockResolvedValue(null),
		findAll: vi.fn().mockResolvedValue([]),
		count: vi.fn().mockResolvedValue(0),
		save: vi
			.fn()
			.mockImplementation((org: Organization) => Promise.resolve(org)),
		update: vi.fn(),
		delete: vi.fn(),
		saveForOrganization: vi.fn(),
		findForOrganization: vi.fn().mockResolvedValue([]),
		countForOrganization: vi.fn().mockResolvedValue(0),
		deleteForOrganization: vi.fn(),
		findByRuc: vi.fn().mockResolvedValue(null),
		findBySlug: vi.fn().mockResolvedValue(null),
		findActive: vi.fn().mockResolvedValue([]),
		getFirmMetrics: vi.fn().mockResolvedValue({
			totalCompanies: 0,
			activeCompanies: 0,
			pendingReconciliations: 0,
			overdueDocuments: 0,
			healthPercentage: 0,
		}),
		...overrides,
	};
}

describe("CreateOrganizationUseCase", () => {
	it("creates an organization with valid data and returns ClientDetailResponse", async () => {
		const repo = createMockRepo();
		const auditLogger = new SpyAuditLogger();
		const useCase = new CreateOrganizationUseCase(repo, auditLogger);

		const input = buildValidInput({
			settings: { timezone: "America/Lima", defaultCurrency: "PEN" },
		});
		const context = buildContext();

		const result = await useCase.execute(input, context);

		expect(result.id).toBeTypeOf("string");
		expect(result.name).toBe("Acme Corp");
		expect(result.ruc).toBe("20123456786");
		expect(result.slug).toBe("acme-corp");
		expect(result.status).toBe("ACTIVE");
		expect(result.healthScore).toBeNull();
		expect(result.settings).toEqual({
			timezone: "America/Lima",
			defaultCurrency: "PEN",
			_tenantFirmId: "firm-A",
		});
		expect(result.createdAt).toBeTypeOf("string");
		expect(result.updatedAt).toBeTypeOf("string");

		expect(repo.save).toHaveBeenCalledTimes(1);

		const events = auditLogger.getEvents();
		expect(events).toHaveLength(1);
		expect(events[0].organizationId).toBe(result.id);
		expect(events[0].fromStatus).toBeNull();
		expect(events[0].toStatus).toBe("ACTIVE");
		expect(events[0].reason).toBeNull();
		expect(events[0].tenantId).toBe("firm-A");
		expect(events[0].actorId).toBe("user-1");
	});

	it("rejects invalid RUC checksum", async () => {
		const repo = createMockRepo();
		const auditLogger = new SpyAuditLogger();
		const useCase = new CreateOrganizationUseCase(repo, auditLogger);

		// RUC 12345678901 fails SUNAT checksum (computed check digit ≠ 1)
		await expect(
			useCase.execute(
				buildValidInput({ ruc: "12345678901", slug: "valid-slug" }),
				buildContext(),
			),
		).rejects.toThrow("RUC checksum validation failed");

		expect(repo.save).not.toHaveBeenCalled();
	});

	it("rejects non-11-digit RUC", async () => {
		const repo = createMockRepo();
		const auditLogger = new SpyAuditLogger();
		const useCase = new CreateOrganizationUseCase(repo, auditLogger);

		await expect(
			useCase.execute(
				buildValidInput({ ruc: "123", slug: "valid-slug" }),
				buildContext(),
			),
		).rejects.toThrow("RUC must be exactly 11 digits");

		expect(repo.save).not.toHaveBeenCalled();
	});

	it("rejects empty name", async () => {
		const repo = createMockRepo();
		const auditLogger = new SpyAuditLogger();
		const useCase = new CreateOrganizationUseCase(repo, auditLogger);

		await expect(
			useCase.execute(buildValidInput({ name: "" }), buildContext()),
		).rejects.toThrow("Organization name is required");

		expect(repo.save).not.toHaveBeenCalled();
	});

	it("rejects invalid slug format", async () => {
		const repo = createMockRepo();
		const auditLogger = new SpyAuditLogger();
		const useCase = new CreateOrganizationUseCase(repo, auditLogger);

		await expect(
			useCase.execute(buildValidInput({ slug: "Bad Slug" }), buildContext()),
		).rejects.toThrow("Slug must be in kebab-case format");

		expect(repo.save).not.toHaveBeenCalled();
	});

	it("rejects duplicate RUC within the same tenant", async () => {
		const existingOrg = Organization.create({
			id: "123",
			name: "Existing Corp",
			ruc: "20123456786",
			slug: "existing-corp",
			status: "ACTIVE",
			settings: { _tenantFirmId: "firm-A" },
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const repo = createMockRepo({
			findByRuc: vi.fn().mockResolvedValue(existingOrg),
		});
		const auditLogger = new SpyAuditLogger();
		const useCase = new CreateOrganizationUseCase(repo, auditLogger);

		await expect(
			useCase.execute(
				buildValidInput({ slug: "different-slug" }),
				buildContext(),
			),
		).rejects.toThrow("RUC already exists in this tenant");
	});

	it("rejects duplicate slug within the same tenant", async () => {
		const existingOrg = Organization.create({
			id: "123",
			name: "Existing Corp",
			ruc: "20987654326",
			slug: "acme-corp",
			status: "ACTIVE",
			settings: { _tenantFirmId: "firm-A" },
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const repo = createMockRepo({
			findBySlug: vi.fn().mockResolvedValue(existingOrg),
		});
		const auditLogger = new SpyAuditLogger();
		const useCase = new CreateOrganizationUseCase(repo, auditLogger);

		await expect(
			useCase.execute(buildValidInput({ ruc: "10765432109" }), buildContext()),
		).rejects.toThrow("slug already exists in this tenant");
	});

	it("allows same RUC in a different tenant (tenant-scoped uniqueness)", async () => {
		// RUC exists but in a different firm tenant
		const existingOrg = Organization.create({
			id: "123",
			name: "Other Firm Corp",
			ruc: "20123456786",
			slug: "other-corp",
			status: "ACTIVE",
			settings: { _tenantFirmId: "firm-B" },
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const repo = createMockRepo({
			findByRuc: vi.fn().mockResolvedValue(existingOrg),
		});
		const auditLogger = new SpyAuditLogger();
		const useCase = new CreateOrganizationUseCase(repo, auditLogger);

		const result = await useCase.execute(
			buildValidInput({ slug: "unique-slug" }),
			buildContext(), // firm-A
		);

		expect(result.ruc).toBe("20123456786");
		expect(repo.save).toHaveBeenCalledTimes(1);
	});
});
