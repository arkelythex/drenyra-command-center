import { describe, expect, it, vi } from "vitest";
import { Organization } from "@drenyra/domain";
import type { OrganizationRepository } from "@drenyra/domain/repositories/organization.repository";
import { SpyAuditLogger } from "../audit-logger";
import { SuspendOrganizationUseCase } from "../suspend-organization.usecase";
import type { SuspendOrganizationInput, UseCaseContext } from "../types";

function buildContext(overrides?: Partial<UseCaseContext>): UseCaseContext {
	return {
		tenantId: "firm-A",
		actorId: "user-1",
		...overrides,
	};
}

function createMockRepo(overrides?: Partial<OrganizationRepository>): OrganizationRepository {
	return {
		findById: vi.fn().mockResolvedValue(null),
		findAll: vi.fn().mockResolvedValue([]),
		count: vi.fn().mockResolvedValue(0),
		save: vi.fn(),
		update: vi.fn().mockImplementation((org: Organization) => Promise.resolve(org)),
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

function createActiveOrg(tenantId = "firm-A"): Organization {
	return Organization.create({
		id: "org-123",
		name: "Acme Corp",
		ruc: "20123456786",
		slug: "acme-corp",
		status: "ACTIVE",
		settings: { _tenantFirmId: tenantId },
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
	});
}

function createSuspendedOrg(tenantId = "firm-A"): Organization {
	return Organization.create({
		id: "org-456",
		name: "Suspended Corp",
		ruc: "10765432109",
		slug: "suspended-corp",
		status: "SUSPENDED",
		settings: { _tenantFirmId: tenantId },
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
	});
}

describe("SuspendOrganizationUseCase", () => {
	it("suspends an ACTIVE organization with reason", async () => {
		const activeOrg = createActiveOrg();
		const repo = createMockRepo({
			findById: vi.fn().mockResolvedValue(activeOrg),
		});
		const auditLogger = new SpyAuditLogger();
		const useCase = new SuspendOrganizationUseCase(repo, auditLogger);

		const result = await useCase.execute(
			"org-123",
			{ reason: "Non-payment of Q2 invoice" } satisfies SuspendOrganizationInput,
			buildContext(),
		);

		expect(result.status).toBe("SUSPENDED");
		expect(result.id).toBe("org-123");

		expect(repo.update).toHaveBeenCalledTimes(1);

		const events = auditLogger.getEvents();
		expect(events).toHaveLength(1);
		expect(events[0].organizationId).toBe("org-123");
		expect(events[0].fromStatus).toBe("ACTIVE");
		expect(events[0].toStatus).toBe("SUSPENDED");
		expect(events[0].reason).toBe("Non-payment of Q2 invoice");
		expect(events[0].tenantId).toBe("firm-A");
		expect(events[0].actorId).toBe("user-1");
	});

	it("suspends an ACTIVE organization without reason", async () => {
		const activeOrg = createActiveOrg();
		const repo = createMockRepo({
			findById: vi.fn().mockResolvedValue(activeOrg),
		});
		const auditLogger = new SpyAuditLogger();
		const useCase = new SuspendOrganizationUseCase(repo, auditLogger);

		const result = await useCase.execute(
			"org-123",
			{} satisfies SuspendOrganizationInput,
			buildContext(),
		);

		expect(result.status).toBe("SUSPENDED");

		const events = auditLogger.getEvents();
		expect(events).toHaveLength(1);
		expect(events[0].reason).toBeNull();
	});

	it("rejects when organization is not found", async () => {
		const repo = createMockRepo(); // findById returns null
		const auditLogger = new SpyAuditLogger();
		const useCase = new SuspendOrganizationUseCase(repo, auditLogger);

		await expect(
			useCase.execute("org-999", {}, buildContext()),
		).rejects.toThrow("Organization not found");
	});

	it("rejects cross-tenant access", async () => {
		const org = createActiveOrg("firm-B"); // belongs to firm-B
		const repo = createMockRepo({
			findById: vi.fn().mockResolvedValue(org),
		});
		const auditLogger = new SpyAuditLogger();
		const useCase = new SuspendOrganizationUseCase(repo, auditLogger);

		await expect(
			useCase.execute("org-123", {}, buildContext()), // firm-A context
		).rejects.toThrow("Organization does not belong to the firm's tenant scope");
	});

	it("rejects SUSPENDED → SUSPENDED transition", async () => {
		const suspendedOrg = createSuspendedOrg();
		const repo = createMockRepo({
			findById: vi.fn().mockResolvedValue(suspendedOrg),
		});
		const auditLogger = new SpyAuditLogger();
		const useCase = new SuspendOrganizationUseCase(repo, auditLogger);

		await expect(
			useCase.execute("org-456", {}, buildContext()),
		).rejects.toThrow('Cannot transition from "SUSPENDED" to "SUSPENDED"');
	});
});
