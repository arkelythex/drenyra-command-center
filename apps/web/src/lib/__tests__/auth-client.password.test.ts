import { afterEach, describe, expect, it, vi } from "vitest";
import { authClient } from "../auth-client";

const respond = (ok: boolean, body: unknown = {}) =>
	vi.fn().mockResolvedValue({ ok, json: async () => body });

afterEach(() => vi.unstubAllGlobals());

describe("authClient password reset", () => {
	it("requests a reset link through the auth API", async () => {
		const fetchMock = respond(true);
		vi.stubGlobal("fetch", fetchMock);

		const result = await authClient.requestPasswordReset({
			email: "a@b.pe",
			redirectTo: "https://app.test/reset-password",
		});

		expect(result.error).toBeNull();
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/auth/forget-password",
			expect.objectContaining({ method: "POST" }),
		);
		const sent = JSON.parse(fetchMock.mock.calls[0]?.[1].body);
		expect(sent).toEqual({
			email: "a@b.pe",
			redirectTo: "https://app.test/reset-password",
		});
	});

	it("resets the password with the token", async () => {
		const fetchMock = respond(true);
		vi.stubGlobal("fetch", fetchMock);

		const result = await authClient.resetPassword({
			newPassword: "Nueva-clave-123",
			token: "tok",
		});

		expect(result.error).toBeNull();
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/auth/reset-password",
			expect.objectContaining({ method: "POST" }),
		);
	});

	it("returns the server message as an error when the call fails", async () => {
		vi.stubGlobal("fetch", respond(false, { message: "Token expired" }));
		const result = await authClient.resetPassword({
			newPassword: "x",
			token: "old",
		});
		expect(result.error?.message).toBe("Token expired");
	});

	it("turns a network failure into an error instead of throwing", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
		const result = await authClient.requestPasswordReset({
			email: "a@b.pe",
			redirectTo: "x",
		});
		expect(result.error?.message).toBe("offline");
	});
});

describe("authClient email verification", () => {
	it("verifies the email with the token as a GET query", async () => {
		const fetchMock = respond(true);
		vi.stubGlobal("fetch", fetchMock);

		const result = await authClient.verifyEmail({ query: { token: "a b" } });

		expect(result.error).toBeNull();
		expect(fetchMock.mock.calls[0]?.[0]).toBe(
			"/api/auth/verify-email?token=a%20b",
		);
		expect(fetchMock.mock.calls[0]?.[1]?.method ?? "GET").toBe("GET");
	});

	it("asks for another verification email", async () => {
		const fetchMock = respond(true);
		vi.stubGlobal("fetch", fetchMock);

		const result = await authClient.sendVerificationEmail({
			email: "a@b.pe",
			callbackURL: "https://app.test/verify-email",
		});

		expect(result.error).toBeNull();
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/auth/send-verification-email",
			expect.objectContaining({ method: "POST" }),
		);
	});
});
