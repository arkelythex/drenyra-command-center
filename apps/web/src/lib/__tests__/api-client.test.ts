import { beforeEach, describe, expect, it, vi } from "vitest";

const { treatyMock } = vi.hoisted(() => ({
	treatyMock: vi.fn(() => ({ api: {} })),
}));

vi.mock("@elysiajs/eden", () => ({ treaty: treatyMock }));

import { api, resolveRequestHeaders } from "../api-client";
import { ACTIVE_COMPANY_STORAGE_KEY } from "../company-context";
import { runtimeConfig } from "../runtime-config";

describe("api client", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("is a real Eden Treaty client on the configured API origin with session cookies", () => {
		expect(treatyMock).toHaveBeenCalledTimes(1);
		const [domain, config] = treatyMock.mock.calls[0] as unknown as [
			string,
			{ fetch: RequestInit; headers: unknown },
		];
		expect(domain).toBe(runtimeConfig.apiUrl);
		expect(config.fetch.credentials).toBe("include");
		expect(config.headers).toBe(resolveRequestHeaders);
		expect(api).toEqual({ api: {} });
	});

	it("sends no tenant headers before a company is active", () => {
		expect(resolveRequestHeaders()).toEqual({});
	});

	it("scopes every request to the active company", () => {
		localStorage.setItem(
			ACTIVE_COMPANY_STORAGE_KEY,
			JSON.stringify({
				active: {
					companyId: "cmp-42",
					companyName: "Empresa 42 SAC",
					ruc: "20100000042",
					countryCode: "PE",
				},
				available: [],
			}),
		);

		expect(resolveRequestHeaders()).toEqual({
			"x-company-id": "cmp-42",
			"x-active-company-id": "cmp-42",
		});
	});
});
