import { describe, expect, it } from "vitest";
import {
	authorizeArkelythexMcpTool,
	buildArkelythexMcpManifest,
	isArkelythexMcpScope,
	type ArkelythexMcpScope,
} from "./mcp";

const scope: ArkelythexMcpScope = {
	organizationId: "org-001",
	companyId: "company-001",
	companyRuc: "20100070970",
	period: "2026-05",
	countryCode: "PE",
	userId: "user-001",
};

describe("ARKELYTHEX public MCP contract", () => {
	it("publishes a deny-by-default read-only fiscal intelligence manifest", () => {
		const manifest = buildArkelythexMcpManifest();

		expect(manifest.positioning).toBe("fiscal_intelligence_platform_mcp");
		expect(manifest.defaultPolicy).toBe("deny_by_default");
		expect(manifest.tools.every((tool) => tool.mode === "read_only")).toBe(true);
		expect(manifest.requiredScopeHeaders).toContain("x-company-ruc");
		expect(manifest.requiredScopeHeaders).toContain("x-fiscal-period");
	});

	it("validates SUNAT RUC checksum and explicit fiscal period", () => {
		expect(isArkelythexMcpScope(scope)).toBe(true);
		expect(isArkelythexMcpScope({ ...scope, companyRuc: "20100070971" })).toBe(false);
		expect(isArkelythexMcpScope({ ...scope, period: "2026-13" })).toBe(false);
	});

	it("denies unregistered tools and redaction failures", () => {
		expect(
			authorizeArkelythexMcpTool({
				toolName: "fiscal_truth.write_promote",
				scope,
				redactionStatus: "passed",
			}),
		).toEqual({ allowed: false, reason: "TOOL_NOT_REGISTERED" });
		expect(
			authorizeArkelythexMcpTool({
				toolName: "drenyra.brain.list_threads",
				scope,
				redactionStatus: "failed",
			}),
		).toEqual({ allowed: false, reason: "REDACTION_FAILED" });
	});

	it("allows scoped read-only tools after redaction passes", () => {
		expect(
			authorizeArkelythexMcpTool({
				toolName: "fiscal_truth.evidence.read_graph",
				scope,
				redactionStatus: "passed",
			}),
		).toEqual({ allowed: true, reason: "ALLOWED" });
	});
});
