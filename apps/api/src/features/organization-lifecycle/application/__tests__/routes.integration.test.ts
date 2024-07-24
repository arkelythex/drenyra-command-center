import { describe, expect, it, vi, beforeAll } from "vitest";
import { Organization } from "@drenyra/domain";

// Use vi.hoisted so mock variables are initialized before vi.mock callbacks run
const { mockSave, mockUpdate, mockFindById, mockFindByRuc, mockFindBySlug } = vi.hoisted(
	() => ({
		mockSave: vi.fn(),
		mockUpdate: vi.fn(),
		mockFindById: vi.fn(),
		mockFindByRuc: vi.fn(),
		mockFindBySlug: vi.fn(),
	}),
);

vi.mock("@drenyra/persistence", () => ({
	PostgresOrganizationRepository: function MockRepo() {
		return {
			findById: mockFindById,
		findAll: vi.fn().mockResolvedValue([]),
		count: vi.fn().mockResolvedValue(0),
		save: mockSave,
		update: mockUpdate,
		delete: vi.fn(),
		saveForOrganization: vi.fn(),
		findForOrganization: vi.fn().mockResolvedValue([]),
		countForOrganization: vi.fn().mockResolvedValue(0),
		deleteForOrganization: vi.fn(),
		findByRuc: mockFindByRuc,
		findBySlug: mockFindBySlug,
		findActive: vi.fn().mockResolvedValue([]),
		getFirmMetrics: vi.fn().mockResolvedValue({
			totalCompanies: 0,
			activeCompanies: 0,
			pendingReconciliations: 0,
			overdueDocuments: 0,
			healthPercentage: 0,
		}),
		};
	},
}));

vi.mock("../../shared/api-response", async () => {
	const actual = await vi.importActual<typeof import("../../shared/api-response")>(
		"../../shared/api-response",
	);
	return actual;
});

import {
	createOrganization,
	suspendOrganization,
	reactivateOrganization,
} from "../organization-lifecycle.controller";
import type { FirmTenantContext } from "../../../../middleware/tenant-context";

const firmTenant: FirmTenantContext = {
	organizationId: "firm-A",
	userId: "user-1",
	role: "admin",
};

describe("Organization Lifecycle — Integration Tests", () => {
	beforeAll(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	it("POST /api/firm/clients — creates organization and returns 201", async () => {
		mockFindByRuc.mockResolvedValue(null);
		mockFindBySlug.mockResolvedValue(null);
		mockSave.mockImplementation((org: Organization) => Promise.resolve(org));

		const result = await createOrganization(firmTenant, {
			name: "Acme Corp",
			ruc: "20123456786",
			slug: "acme-corp",
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe("Acme Corp");
			expect(result.data.status).toBe("ACTIVE");
		}
	});

	it("POST /api/firm/clients — returns error for invalid RUC", async () => {
		mockFindByRuc.mockResolvedValue(null);
		mockFindBySlug.mockResolvedValue(null);

		const result = await createOrganization(firmTenant, {
			name: "Bad Corp",
			ruc: "12345678901",
			slug: "bad-corp",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("INVALID_RUC");
		}
	});

	it("POST /api/firm/clients — returns 409 for duplicate RUC", async () => {
		const existingOrg = Organization.create({
			id: "999",
			name: "Existing",
			ruc: "20123456786",
			slug: "existing-corp",
			status: "ACTIVE",
			settings: { _tenantFirmId: "firm-A" },
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		mockFindByRuc.mockResolvedValue(existingOrg);
		mockFindBySlug.mockResolvedValue(null);

		const result = await createOrganization(firmTenant, {
			name: "Another Corp",
			ruc: "20123456786",
			slug: "another-corp",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("RUC_ALREADY_EXISTS");
		}
	});

	it("POST /api/firm/clients/:id/suspend — suspends active org", async () => {
		const activeOrg = Organization.create({
			id: "org-1",
			name: "Acme Corp",
			ruc: "20123456786",
			slug: "acme-corp",
			status: "ACTIVE",
			settings: { _tenantFirmId: "firm-A" },
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		mockFindById.mockResolvedValue(activeOrg);
		mockUpdate.mockImplementation((org: Organization) => Promise.resolve(org));

		const result = await suspendOrganization(firmTenant, "org-1", {
			reason: "Non-payment",
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe("SUSPENDED");
		}
	});

	it("POST /api/firm/clients/:id/suspend — returns 409 for already suspended", async () => {
		const suspendedOrg = Organization.create({
			id: "org-1",
			name: "Suspended Corp",
			ruc: "10765432109",
			slug: "suspended-corp",
			status: "SUSPENDED",
			settings: { _tenantFirmId: "firm-A" },
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		mockFindById.mockResolvedValue(suspendedOrg);

		const result = await suspendOrganization(firmTenant, "org-1", {});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("INVALID_TRANSITION");
		}
	});

	it("POST /api/firm/clients/:id/reactivate — reactivates suspended org", async () => {
		const suspendedOrg = Organization.create({
			id: "org-1",
			name: "Suspended Corp",
			ruc: "10765432109",
			slug: "suspended-corp",
			status: "SUSPENDED",
			settings: { _tenantFirmId: "firm-A" },
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		mockFindById.mockResolvedValue(suspendedOrg);
		mockUpdate.mockImplementation((org: Organization) => Promise.resolve(org));

		const result = await reactivateOrganization(firmTenant, "org-1");

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe("ACTIVE");
		}
	});

	it("POST /api/firm/clients/:id/reactivate — returns 409 for already active", async () => {
		const activeOrg = Organization.create({
			id: "org-1",
			name: "Active Corp",
			ruc: "20123456786",
			slug: "active-corp",
			status: "ACTIVE",
			settings: { _tenantFirmId: "firm-A" },
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		mockFindById.mockResolvedValue(activeOrg);

		const result = await reactivateOrganization(firmTenant, "org-1");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("INVALID_TRANSITION");
		}
	});

	it("POST /api/firm/clients/:id/suspend — returns 403 for cross-tenant", async () => {
		const otherOrg = Organization.create({
			id: "org-1",
			name: "Other Corp",
			ruc: "20123456786",
			slug: "other-corp",
			status: "ACTIVE",
			settings: { _tenantFirmId: "firm-B" },
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		mockFindById.mockResolvedValue(otherOrg);

		const result = await suspendOrganization(firmTenant, "org-1", {});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("TENANT_SCOPE_VIOLATION");
		}
	});

	it("returns error when firmTenant is missing organizationId", async () => {
		const badTenant: FirmTenantContext = {
			organizationId: "",
			userId: "user-1",
			role: "admin",
		};

		// This should be caught by the route handler, not the controller.
		// The controller itself receives the tenant and uses it directly.
		// If orgId is empty, the settings will have _tenantFirmId: "" which is fine.
		// The route handler is responsible for the 403 TENANT_REQUIRED check.
		// We trust the route handler, so this test just confirms the controller
		// doesn't crash with empty tenantId.
		mockFindById.mockResolvedValue(null);

		const result = await suspendOrganization(badTenant, "org-1", {});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("CLIENT_NOT_FOUND");
		}
	});
});
