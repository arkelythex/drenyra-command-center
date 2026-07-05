import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const organizationIdKey = "__drenyraCommandEnvelopeAuditOrgId";

function setMockOrganizationId(value: string): void {
	Object.defineProperty(globalThis, organizationIdKey, {
		value,
		writable: true,
		configurable: true,
	});
}

function getMockOrganizationId(): string {
	const state = globalThis as Record<string, unknown>;
	return typeof state[organizationIdKey] === "string"
		? state[organizationIdKey]
		: "org-1";
}

setMockOrganizationId("org-1");

const { mockApi } = vi.hoisted(() => {
	const auditGet = vi.fn(async () => ({
		data: { success: true, data: { decision: "denied", events: [], count: 0 } },
	}));

	globalThis.__auditGet = auditGet;

	return {
		mockApi: {
			api: {
				drenyra: {
					"command-envelope": {
						audit: { get: auditGet },
					},
				},
			},
		},
	};
});

vi.mock("@/lib/api", () => ({
	getGovernanceAuditHeaders: () => ({
		"x-company-id": "company-1",
		"x-user-id": "user-1",
	}),
	getOrganizationId: () => getMockOrganizationId(),
	api: mockApi,
}));

vi.mock("@/lib/api-helpers", () => ({
	unwrap: async (promise: Promise<unknown>) => promise,
	extractOkData: (data: unknown) => data,
}));

vi.mock("@/lib/company-context", () => ({
	getCompanyContext: () => ({
		companyId: "company-1",
		ruc: "20100070970",
	}),
}));

function createLocalStorageMock() {
	const store = new Map<string, string>();
	return {
		getItem: (key: string) => store.get(key) ?? null,
		setItem: (key: string, value: string) => store.set(key, value),
		removeItem: (key: string) => store.delete(key),
		clear: () => store.clear(),
	};
}

import { listCommandEnvelopeAudit } from "./drenyra-command-envelope-audit.api";

describe("drenyra-command-envelope-audit.api", () => {
	beforeEach(() => {
		Object.defineProperty(globalThis, "localStorage", {
			value: createLocalStorageMock(),
			configurable: true,
		});
		localStorage.setItem("drenyra-active-fiscal-period", "2026-05");
	});

	afterEach(() => {
		localStorage.clear();
		setMockOrganizationId("org-1");
	});

	it("sends scoped audit query headers and filters", async () => {
		const auditGet = (
			globalThis as unknown as { __auditGet: ReturnType<typeof vi.fn> }
		).__auditGet;
		auditGet.mockResolvedValueOnce({
			data: {
				success: true,
				data: { decision: "denied", events: [], count: 0 },
			},
		});

		await listCommandEnvelopeAudit({
			decision: "denied",
			caseId: "case-001",
			limit: 25,
		});

		expect(auditGet).toHaveBeenCalledTimes(1);
		const [config] = auditGet.mock.calls[0] as [
			{ headers: Record<string, string>; query: Record<string, string> },
		];
		expect(config.headers["x-organization-id"]).toBe("org-1");
		expect(config.headers["x-company-id"]).toBe("company-1");
		expect(config.headers["x-company-ruc"]).toBe("20100070970");
		expect(config.headers["x-fiscal-period"]).toBe("2026-05");
		expect(config.headers["x-user-id"]).toBe("user-1");
		expect(config.query).toEqual({
			decision: "denied",
			caseId: "case-001",
			limit: "25",
		});
	});

	it("does not infer organization or period silently", async () => {
		setMockOrganizationId("");
		await expect(listCommandEnvelopeAudit()).rejects.toThrow(/organization id/);

		setMockOrganizationId("org-1");
		localStorage.removeItem("drenyra-active-fiscal-period");
		await expect(listCommandEnvelopeAudit()).rejects.toThrow(
			/explicit selected fiscal period/,
		);
	});
});
