import { describe, expect, it } from "vitest";

import { isApiDocsNavLinkActive } from "@/components/api/api-docs-nav";

describe("api-docs-nav", () => {
	it("marca overview activo sin hash en /api", () => {
		expect(isApiDocsNavLinkActive("#overview", "/api", "")).toBe(true);
		expect(isApiDocsNavLinkActive("#build-paths", "/api", "")).toBe(false);
	});

	it("marca ancla activa cuando coincide el hash", () => {
		expect(isApiDocsNavLinkActive("#sdks", "/api", "#sdks")).toBe(true);
		expect(
			isApiDocsNavLinkActive("#capability-ruc", "/api", "#capability-ruc"),
		).toBe(true);
	});
});
