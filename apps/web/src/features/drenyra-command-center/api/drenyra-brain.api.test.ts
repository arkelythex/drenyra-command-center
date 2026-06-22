import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const getGovernanceAuditHeadersMock = vi.fn(() => ({
	"x-company-id": "company-1",
	"x-user-id": "user-1",
}));

const getOrganizationIdMock = vi.fn(() => "org-1");

const getCompanyContextMock = vi.fn(() => ({
	companyId: "company-1",
	ruc: "20601234567",
}));

const { mockApi } = vi.hoisted(() => {
	const brainThreadsFn = vi.fn(() => ({
		turns: { post: vi.fn(async () => ({ data: {} })) },
		items: { get: vi.fn(async () => ({ data: {} })) },
	}));
	brainThreadsFn.get = vi.fn(async () => ({ data: {} }));
	brainThreadsFn.post = vi.fn(async () => ({ data: {} }));

	globalThis.__brainThreadsFn = brainThreadsFn;

	return {
		mockApi: {
			api: { drenyra: { brain: { threads: brainThreadsFn } } },
		},
	};
});

vi.mock("@/lib/api", () => ({
	getGovernanceAuditHeaders: () => getGovernanceAuditHeadersMock(),
	getOrganizationId: () => getOrganizationIdMock(),
	api: mockApi,
}));

vi.mock("@/lib/api-helpers", () => ({
	unwrap: async (promise: Promise<unknown>) => promise,
	extractOkData: (data: unknown) => data,
}));

vi.mock("@/lib/company-context", () => ({
	getCompanyContext: () => getCompanyContextMock(),
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
	createBrainThread,
	listBrainItems,
	listBrainThreads,
	startBrainTurn,
} from "./drenyra-brain.api";

function getBrainThreadsFn() {
	return (globalThis as unknown as { __brainThreadsFn: ReturnType<typeof vi.fn> }).__brainThreadsFn;
}

describe("drenyra-brain.api headers", () => {
	beforeEach(() => {
		Object.defineProperty(globalThis, "localStorage", { value: createLocalStorageMock(), configurable: true });
		localStorage.setItem("arkelythex-active-fiscal-period", "2026-05");
		vi.clearAllMocks();
	});

	afterEach(() => {
		localStorage.clear();
	});

	it("createBrainThread sends required tenant headers and sourceSurface", async () => {
		const brainThreadsFn = getBrainThreadsFn();
		brainThreadsFn.post.mockResolvedValueOnce({ data: { id: "thread-1" } });

		await createBrainThread({ title: "Scope check", sourceSurface: "web" });

		expect(brainThreadsFn.post).toHaveBeenCalledTimes(1);
		const [body, config] = brainThreadsFn.post.mock.calls[0] as [unknown, { headers: Record<string, string> }];
		expect(body).toEqual({ title: "Scope check", sourceSurface: "web" });
		expect(config.headers["x-organization-id"]).toBe("org-1");
		expect(config.headers["x-company-id"]).toBe("company-1");
		expect(config.headers["x-company-ruc"]).toBe("20601234567");
		expect(config.headers["x-fiscal-period"]).toBe("2026-05");
		expect(config.headers["x-user-id"]).toBe("user-1");
	});

	it("listBrainThreads sends required tenant headers", async () => {
		const brainThreadsFn = getBrainThreadsFn();
		brainThreadsFn.get.mockResolvedValueOnce({ data: [] });

		await listBrainThreads();

		expect(brainThreadsFn.get).toHaveBeenCalledTimes(1);
		const [config] = brainThreadsFn.get.mock.calls[0] as [{ headers: Record<string, string> }];
		expect(config.headers["x-organization-id"]).toBe("org-1");
		expect(config.headers["x-company-id"]).toBe("company-1");
		expect(config.headers["x-company-ruc"]).toBe("20601234567");
		expect(config.headers["x-fiscal-period"]).toBe("2026-05");
		expect(config.headers["x-user-id"]).toBe("user-1");
	});

	it("startBrainTurn sends required tenant headers", async () => {
		const brainThreadsFn = getBrainThreadsFn();
		const turnsPost = vi.fn(async () => ({ data: { id: "turn-1" } }));
		brainThreadsFn.mockReturnValue({ turns: { post: turnsPost }, items: { get: vi.fn() } });

		await startBrainTurn("thread-1", {
			prompt: "Review mismatch",
			sourceSurface: "web",
		});

		expect(brainThreadsFn).toHaveBeenCalledWith({ id: "thread-1" });
		expect(turnsPost).toHaveBeenCalledTimes(1);
		const [body, config] = turnsPost.mock.calls[0] as [unknown, { headers: Record<string, string> }];
		expect(body).toEqual({ prompt: "Review mismatch", sourceSurface: "web" });
		expect(config.headers["x-organization-id"]).toBe("org-1");
		expect(config.headers["x-company-id"]).toBe("company-1");
		expect(config.headers["x-company-ruc"]).toBe("20601234567");
		expect(config.headers["x-fiscal-period"]).toBe("2026-05");
		expect(config.headers["x-user-id"]).toBe("user-1");
	});

	it("listBrainItems sends required tenant headers", async () => {
		const brainThreadsFn = getBrainThreadsFn();
		const itemsGet = vi.fn(async () => ({ data: [] }));
		brainThreadsFn.mockReturnValue({ turns: { post: vi.fn() }, items: { get: itemsGet } });

		await listBrainItems("thread-1");

		expect(brainThreadsFn).toHaveBeenCalledWith({ id: "thread-1" });
		expect(itemsGet).toHaveBeenCalledTimes(1);
		const [config] = itemsGet.mock.calls[0] as [{ headers: Record<string, string> }];
		expect(config.headers["x-organization-id"]).toBe("org-1");
		expect(config.headers["x-company-id"]).toBe("company-1");
		expect(config.headers["x-company-ruc"]).toBe("20601234567");
		expect(config.headers["x-fiscal-period"]).toBe("2026-05");
		expect(config.headers["x-user-id"]).toBe("user-1");
	});

	it("does not silently infer fiscal period from the current date", async () => {
		localStorage.removeItem("arkelythex-active-fiscal-period");

		await expect(listBrainThreads()).rejects.toThrow(/explicit selected fiscal period/);
	});
});
