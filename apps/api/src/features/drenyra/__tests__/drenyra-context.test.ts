import { describe, expect, it } from "vitest";
import { resolveAgentContextFromHeaders } from "../drenyra-context";

describe("Drenyra tenant context", () => {
	it("rejects requests without company tenant context", () => {
		const result = resolveAgentContextFromHeaders({ "x-user-id": "user-1" });

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.code).toBe("TENANT_CONTEXT_REQUIRED");
			expect(result.details.missingHeaders).toContain("x-company-id");
		}
	});

	it("rejects requests without user audit context", () => {
		const result = resolveAgentContextFromHeaders({ "x-company-id": "cmp-1" });

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.details.missingHeaders).toContain("x-user-id");
		}
	});

	it("builds tenant-scoped context without unknown fallbacks", () => {
		const result = resolveAgentContextFromHeaders({
			"x-company-id": " cmp-1 ",
			"x-user-id": " user-1 ",
		});

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.context).toMatchObject({
				tenantId: "cmp-1",
				organizationId: "cmp-1",
				companyId: "cmp-1",
				userId: "user-1",
				ruc: "",
			});
			expect(Object.values(result.context)).not.toContain("unknown");
		}
	});
});
