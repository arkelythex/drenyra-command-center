import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "../../../auth/auth.config";
import {
	hasUnsafeXmlDeclarations,
	parseStoredExtractedData,
	resolveActorIdFromHeaders,
	sanitizeActorId,
} from "../../security.utils.ts";

describe("documents security utils", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("prioritizes x-auth-user-id over legacy x-user-id", () => {
		const actor = resolveActorIdFromHeaders({
			"x-auth-user-id": "auth-user-7",
			"x-user-id": "11111111-1111-1111-1111-111111111111",
		});
		return expect(actor).resolves.toBe("auth-user-7");
	});

	it("resolves actor id from x-user-id header", () => {
		const actor = resolveActorIdFromHeaders({
			"x-user-id": "usr_123-abc",
		});
		return expect(actor).resolves.toBe("usr_123-abc");
	});

	it("falls back to x-actor-id when x-user-id is missing", () => {
		const actor = resolveActorIdFromHeaders({
			"x-actor-id": "ops-user",
		});
		return expect(actor).resolves.toBe("ops-user");
	});

	it("returns default actor for invalid headers", () => {
		const actor = resolveActorIdFromHeaders({
			"x-user-id": "bad user id with spaces",
		});
		return expect(actor).resolves.toBe("system");
	});

	it("supports Headers instance resolution", () => {
		const headers = new Headers();
		headers.set("x-user-id", "api-user-42");
		return expect(resolveActorIdFromHeaders(headers)).resolves.toBe("api-user-42");
	});

	it("prefers Better Auth session identity when cookie session is present", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			user: {
				id: "auth-user-session",
				legacyUserId: "11111111-1111-1111-1111-111111111111",
			},
		} as never);

		await expect(
			resolveActorIdFromHeaders({
				cookie: "better-auth.session_token=abc123",
				"x-auth-user-id": "spoofed-header-user",
				"x-user-id": "22222222-2222-2222-2222-222222222222",
			}),
		).resolves.toBe("auth-user-session");
	});

	it("sanitizes actor ids with strict charset and max length", () => {
		expect(sanitizeActorId("admin:user-1")).toBe("admin:user-1");
		expect(sanitizeActorId("")).toBe("");
		expect(sanitizeActorId("contains spaces")).toBe("");
		expect(sanitizeActorId("x".repeat(256))).toBe("x".repeat(128));
	});

	it("parses extracted data from object or JSON string", () => {
		expect(parseStoredExtractedData({ total: 123 })).toEqual({ total: 123 });
		expect(parseStoredExtractedData('{"currency":"PEN"}')).toEqual({
			currency: "PEN",
		});
		expect(parseStoredExtractedData("{invalid")).toEqual({});
		expect(parseStoredExtractedData(["not-object"])).toEqual({});
	});

	it("detects unsafe XML declarations", () => {
		expect(hasUnsafeXmlDeclarations("<!DOCTYPE foo><Invoice/>")).toBe(true);
		expect(hasUnsafeXmlDeclarations("<!ENTITY xxe 'abc'><Invoice/>")).toBe(
			true,
		);
		expect(hasUnsafeXmlDeclarations("<Invoice><cbc:ID>F001-1</cbc:ID></Invoice>")).toBe(false);
	});
});
