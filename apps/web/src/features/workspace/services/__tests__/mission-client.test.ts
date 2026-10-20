import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/runtime-config", () => ({
	runtimeConfig: { apiUrl: "https://api.test" },
}));
vi.mock("@/lib/api-client", () => ({
	resolveRequestHeaders: () => ({
		"x-company-id": "company-1",
		"x-active-company-id": "company-1",
	}),
}));

import { missionFetch } from "../mission-client";

const fetchMock = vi.fn();

function answer(status: number, body: unknown) {
	fetchMock.mockResolvedValue(
		new Response(JSON.stringify(body), {
			status,
			headers: { "Content-Type": "application/json" },
		}),
	);
}

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal("fetch", fetchMock);
	sessionStorage.setItem("drenyra-auth-token", "stale-token");
});

afterEach(() => {
	vi.unstubAllGlobals();
	sessionStorage.clear();
});

describe("missionFetch", () => {
	it("sends the session cookie and the active company, not a Bearer token", async () => {
		answer(200, { success: true, data: { id: "m1" } });
		await missionFetch("/api/v1/missions/m1");

		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		const headers = init.headers as Record<string, string>;
		expect(url).toBe("https://api.test/api/v1/missions/m1");
		expect(init.credentials).toBe("include");
		expect(headers["x-company-id"]).toBe("company-1");
		expect(headers.Authorization).toBeUndefined();
	});

	it("returns the data inside the {success,data} envelope", async () => {
		answer(201, { success: true, data: { id: "m1", version: 1 } });
		await expect(missionFetch("/api/v1/missions")).resolves.toEqual({
			id: "m1",
			version: 1,
		});
	});

	it("throws the API's error code and message", async () => {
		answer(409, {
			success: false,
			error: { code: "VERSION_CONFLICT", message: "stale" },
		});
		await expect(missionFetch("/api/v1/missions/m1/approve")).rejects.toEqual({
			code: "VERSION_CONFLICT",
			message: "stale",
			statusCode: 409,
			isTimeout: false,
		});
	});

	it("treats success:false as an error even with a 200", async () => {
		answer(200, {
			success: false,
			error: { code: "MISSION_NOT_FOUND", message: "Mission not found" },
		});
		await expect(missionFetch("/api/v1/missions/m1")).rejects.toMatchObject({
			code: "MISSION_NOT_FOUND",
		});
	});
});
