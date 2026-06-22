import { describe, expect, it } from "vitest";
import {
	getPublicRoutePrefixes,
	isPublicRoute,
} from "@/lib/router/public-routes";

describe("public routes", () => {
	it("matches all configured public route prefixes", () => {
		expect(getPublicRoutePrefixes()).toEqual([
			"/login",
			"/auth",
			"/signup",
			"/forgot-password",
			"/reset-password",
			"/verify-email",
			"/onboarding",
		]);
	});

	it("treats onboarding children as public", () => {
		expect(isPublicRoute("/onboarding")).toBe(true);
		expect(isPublicRoute("/onboarding/demos")).toBe(true);
	});

	it("keeps private routes protected", () => {
		expect(isPublicRoute("/dashboard")).toBe(false);
		expect(isPublicRoute("/customers")).toBe(false);
	});
});
