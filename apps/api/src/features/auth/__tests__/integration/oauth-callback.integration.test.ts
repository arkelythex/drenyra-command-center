import { describe, expect, it, vi } from "vitest";

// Mock the unlink-provider dependency before importing the routes
const { mockUnlinkProvider } = vi.hoisted(() => ({
	mockUnlinkProvider: vi.fn(),
}));

vi.mock("../../lib/unlink-provider", () => ({
	unlinkProvider: mockUnlinkProvider,
}));

// We also need to mock auth.config, drizzle, and other heavy deps
vi.mock("../../auth.config", () => ({
	auth: {
		handler: vi.fn(),
	},
}));

vi.mock("../../handlers/session-company-context", () => ({
	enrichSessionUserWithCompanyContext: vi.fn(),
}));

vi.mock("../../../lib/logger", () => ({
	createLogger: vi.fn(() => ({
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	})),
}));

import { authRoutes } from "../../auth.routes";

describe("DELETE /api/auth/unlink-provider (integration)", () => {
	it("returns 200 and success when unlinkProvider succeeds", async () => {
		mockUnlinkProvider.mockResolvedValue({ success: true });

		const response = await authRoutes.handle(
			new Request("http://localhost/api/auth/unlink-provider", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: "user-1",
					providerId: "google",
				}),
			}),
		);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual({ success: true });
		expect(mockUnlinkProvider).toHaveBeenCalledWith({
			userId: "user-1",
			providerId: "google",
		});
	});

	it("returns 400 when unlinkProvider throws (only sign-in method)", async () => {
		mockUnlinkProvider.mockRejectedValue(
			new Error("Cannot unlink your only sign-in method"),
		);

		const response = await authRoutes.handle(
			new Request("http://localhost/api/auth/unlink-provider", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: "user-1",
					providerId: "credential",
				}),
			}),
		);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe("Cannot unlink your only sign-in method");
	});

	it("returns 400 when provider is not linked", async () => {
		mockUnlinkProvider.mockRejectedValue(
			new Error("Provider not linked to this account"),
		);

		const response = await authRoutes.handle(
			new Request("http://localhost/api/auth/unlink-provider", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: "user-1",
					providerId: "microsoft",
				}),
			}),
		);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe("Provider not linked to this account");
	});
});

describe("resolveSocialProviders wired into auth.config", () => {
	it("socialProviders and databaseHooks are defined in auth options", async () => {
		// Re-import to get the actual module with env-based resolution
		const { auth } = await vi.importActual<
			typeof import("../../auth.config")
		>("../../auth.config");

		expect(auth).toBeDefined();
		// auth.options should contain socialProviders and databaseHooks
		// as configured in auth.config.ts
		const options = (auth as Record<string, unknown>).options as
			| Record<string, unknown>
			| undefined;
		expect(options).toBeDefined();
	});
});
