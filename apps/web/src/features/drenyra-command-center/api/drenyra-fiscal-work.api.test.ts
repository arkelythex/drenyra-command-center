const inspectGetMock = vi.hoisted(() => vi.fn());
const fiscalWorkClientMock = vi.hoisted(() => vi.fn());
const organizationIdKey = "__drenyraFiscalWorkOrgId";

function setMockOrganizationId(value: string): void {
	Object.defineProperty(globalThis, organizationIdKey, {
		value,
		writable: true,
		configurable: true,
	});
}

function getMockOrganizationId(): string {
	const state = globalThis as Record<string, unknown>;
	return typeof state[organizationIdKey] === "string" ? state[organizationIdKey] : "org-1";
}

setMockOrganizationId("org-1");

vi.mock("@/lib/api", () => ({
	api: {
		api: {
			drenyra: {
				"fiscal-work": fiscalWorkClientMock,
			},
		},
	},
	getGovernanceAuditHeaders: () => ({
		"x-company-id": "company-1",
		"x-user-id": "user-1",
	}),
	getOrganizationId: () => getMockOrganizationId(),
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

import {
	DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
	inspectFiscalWorkItem,
} from "./drenyra-fiscal-work.api";

describe("drenyra-fiscal-work.api", () => {
	beforeEach(() => {
		inspectGetMock.mockReset();
		fiscalWorkClientMock.mockReset();
		fiscalWorkClientMock.mockReturnValue({ inspect: { get: inspectGetMock } });
		Object.defineProperty(globalThis, "localStorage", {
			value: createLocalStorageMock(),
			configurable: true,
		});
		localStorage.setItem("arkelythex-active-fiscal-period", "2026-05");
		setMockOrganizationId("org-1");
	});

	afterEach(() => {
		localStorage.clear();
		setMockOrganizationId("org-1");
	});

	it("sends explicit scope, source surface and capability headers", async () => {
		inspectGetMock.mockResolvedValueOnce({
			data: {
				status: "success",
				reasonCode: "OK",
				traceId: "trace-web",
				capabilityId: DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
				evidenceRefs: ["ev-1"],
				sourceSurface: "web",
			},
		});

		const envelope = await inspectFiscalWorkItem("case-1");

		expect(fiscalWorkClientMock).toHaveBeenCalledWith({ id: "case-1" });
		expect(inspectGetMock).toHaveBeenCalledWith({
			headers: expect.objectContaining({
				"x-organization-id": "org-1",
				"x-company-id": "company-1",
				"x-company-ruc": "20100070970",
				"x-fiscal-period": "2026-05",
				"x-user-id": "user-1",
				"x-drenyra-capability-grant": DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
				"x-drenyra-source-surface": "web",
			}),
		});
		expect(envelope.status).toBe("success");
		expect(envelope.traceId).toBe("trace-web");
		expect(envelope.evidenceRefs).toEqual(["ev-1"]);
	});

	it("preserves denied envelopes instead of throwing away trace metadata", async () => {
		inspectGetMock.mockResolvedValueOnce({
			data: {
				status: "denied",
				reasonCode: "DRENYRA_CAPABILITY_DENIED",
				traceId: "trace-denied",
				capabilityId: DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
				redactedDetail: "Capability denied",
				sourceSurface: "web",
			},
		});

		const envelope = await inspectFiscalWorkItem("case-1");

		expect(envelope.status).toBe("denied");
		expect(envelope.reasonCode).toBe("DRENYRA_CAPABILITY_DENIED");
		expect(envelope.traceId).toBe("trace-denied");
		expect(envelope.data).toBeUndefined();
	});

	it("does not infer organization or fiscal period silently", async () => {
		inspectGetMock.mockResolvedValue({ data: { status: "success" } });

		setMockOrganizationId("");
		await expect(inspectFiscalWorkItem("case-001")).rejects.toThrow(/organization id/);

		setMockOrganizationId("org-1");
		localStorage.removeItem("arkelythex-active-fiscal-period");
		await expect(inspectFiscalWorkItem("case-001")).rejects.toThrow(/explicit selected fiscal period/);
	});
});
