import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { loggerWarn } = vi.hoisted(() => ({
	loggerWarn: vi.fn(),
}));

vi.mock("../../../../lib/logger", () => ({
	createLogger: vi.fn(() => ({
		warn: loggerWarn,
	})),
}));

import { resolveSocialProvidersFromEnv } from "../../lib/resolve-social-providers";

describe("resolveSocialProvidersFromEnv", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.clearAllMocks();
		process.env = { ...originalEnv };
		delete process.env.GOOGLE_CLIENT_ID;
		delete process.env.GOOGLE_CLIENT_SECRET;
		delete process.env.GITHUB_CLIENT_ID;
		delete process.env.GITHUB_CLIENT_SECRET;
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("returns google provider when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are both set", () => {
		process.env.GOOGLE_CLIENT_ID = "google-client-id";
		process.env.GOOGLE_CLIENT_SECRET = "google-client-secret";

		const result = resolveSocialProvidersFromEnv();

		expect(result.google).toBeDefined();
		expect(result.google).toEqual({
			clientId: "google-client-id",
			clientSecret: "google-client-secret",
		});
	});

	it("returns github provider when GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are both set", () => {
		process.env.GITHUB_CLIENT_ID = "github-client-id";
		process.env.GITHUB_CLIENT_SECRET = "github-client-secret";

		const result = resolveSocialProvidersFromEnv();

		expect(result.github).toBeDefined();
		expect(result.github).toEqual({
			clientId: "github-client-id",
			clientSecret: "github-client-secret",
		});
	});

	it("returns both providers when all four env vars are set", () => {
		process.env.GOOGLE_CLIENT_ID = "google-client-id";
		process.env.GOOGLE_CLIENT_SECRET = "google-client-secret";
		process.env.GITHUB_CLIENT_ID = "github-client-id";
		process.env.GITHUB_CLIENT_SECRET = "github-client-secret";

		const result = resolveSocialProvidersFromEnv();

		expect(result.google).toBeDefined();
		expect(result.github).toBeDefined();
		expect(loggerWarn).not.toHaveBeenCalled();
	});

	it("omits google provider when GOOGLE_CLIENT_ID is missing", () => {
		process.env.GOOGLE_CLIENT_SECRET = "google-client-secret";

		const result = resolveSocialProvidersFromEnv();

		expect(result.google).toBeUndefined();
	});

	it("omits github provider when GITHUB_CLIENT_ID is missing", () => {
		process.env.GITHUB_CLIENT_SECRET = "github-client-secret";

		const result = resolveSocialProvidersFromEnv();

		expect(result.github).toBeUndefined();
	});

	it("returns empty object when no OAuth env vars are set", () => {
		const result = resolveSocialProvidersFromEnv();

		expect(result.google).toBeUndefined();
		expect(result.github).toBeUndefined();
		expect(result).toEqual({});
	});

	it("omits google provider and warns when GOOGLE_CLIENT_ID is set but GOOGLE_CLIENT_SECRET is missing", () => {
		process.env.GOOGLE_CLIENT_ID = "google-client-id";

		const result = resolveSocialProvidersFromEnv();

		expect(result.google).toBeUndefined();
		expect(loggerWarn).toHaveBeenCalledWith(
			expect.objectContaining({
				provider: "google",
			}),
			expect.stringContaining("Google"),
		);
	});

	it("omits github provider and warns when GITHUB_CLIENT_ID is set but GITHUB_CLIENT_SECRET is missing", () => {
		process.env.GITHUB_CLIENT_ID = "github-client-id";

		const result = resolveSocialProvidersFromEnv();

		expect(result.github).toBeUndefined();
		expect(loggerWarn).toHaveBeenCalledWith(
			expect.objectContaining({
				provider: "github",
			}),
			expect.stringContaining("GitHub"),
		);
	});

	it("does not warn when provider env vars are completely absent", () => {
		resolveSocialProvidersFromEnv();

		expect(loggerWarn).not.toHaveBeenCalled();
	});
});
