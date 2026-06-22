/**
 * PermissionService unit tests
 *
 * Tests the PermissionService class for all three permission effects,
 * company-scoped lookups, fall-through behavior, and bulk operations.
 *
 * Follows existing test patterns in packages/ai/__tests__/ using vitest.
 */

import { describe, it, expect } from "vitest";
import { PermissionService } from "../../src/governance/permission-service";
import type { PermissionEffect, PermissionEntry } from "../../src/control-plane/contracts";

// ============================================================================
// Helpers
// ============================================================================

function makeEntry(
	toolName: string,
	effect: PermissionEffect,
	companyId?: string,
): PermissionEntry {
	return {
		id: crypto.randomUUID(),
		toolName,
		effect,
		companyId: companyId ?? null,
		organizationId: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

// ============================================================================
// Tests
// ============================================================================

describe("PermissionService", () => {
	it("canExecute with ALLOW entry returns ALLOW with source permission_entry", () => {
		const service = new PermissionService();
		service.setPermission("test-tool", "ALLOW");

		const result = service.canExecute("test-tool");

		expect(result.effect).toBe("ALLOW");
		expect(result.source).toBe("permission_entry");
	});

	it("canExecute with DENY entry returns DENY with source permission_entry", () => {
		const service = new PermissionService();
		service.setPermission("test-tool", "DENY");

		const result = service.canExecute("test-tool");

		expect(result.effect).toBe("DENY");
		expect(result.source).toBe("permission_entry");
	});

	it("canExecute with REQUIRE_APPROVAL entry returns REQUIRE_APPROVAL with source permission_entry", () => {
		const service = new PermissionService();
		service.setPermission("test-tool", "REQUIRE_APPROVAL");

		const result = service.canExecute("test-tool");

		expect(result.effect).toBe("REQUIRE_APPROVAL");
		expect(result.source).toBe("permission_entry");
	});

	it("canExecute with no entry returns REQUIRE_APPROVAL with source default (fall-through)", () => {
		const service = new PermissionService();

		const result = service.canExecute("unknown-tool");

		expect(result.effect).toBe("REQUIRE_APPROVAL");
		expect(result.source).toBe("default");
	});

	it("canExecute with company-scoped entry resolves scoped lookup", () => {
		const service = new PermissionService();
		service.setPermission("test-tool", "ALLOW", "company-1");

		// Matching company → ALLOW
		const result = service.canExecute("test-tool", {
			companyId: "company-1",
		});
		expect(result.effect).toBe("ALLOW");

		// Different company → no match → REQUIRE_APPROVAL
		const otherResult = service.canExecute("test-tool", {
			companyId: "company-2",
		});
		expect(otherResult.effect).toBe("REQUIRE_APPROVAL");
	});

	it("canExecute with company-scoped entry falls through to global on no match", () => {
		const service = new PermissionService();
		// Global entry
		service.setPermission("test-tool", "ALLOW");
		// Different company entry
		service.setPermission("test-tool", "DENY", "company-1");

		// company-1 → DENY (company match wins)
		const scopedResult = service.canExecute("test-tool", {
			companyId: "company-1",
		});
		expect(scopedResult.effect).toBe("DENY");

		// company-2 → ALLOW (falls through to global)
		const fallthroughResult = service.canExecute("test-tool", {
			companyId: "company-2",
		});
		expect(fallthroughResult.effect).toBe("ALLOW");

		// No context → ALLOW (global match)
		const globalResult = service.canExecute("test-tool");
		expect(globalResult.effect).toBe("ALLOW");
	});

	it("load() replaces existing permissions", () => {
		const service = new PermissionService();
		service.setPermission("tool-a", "ALLOW");
		service.setPermission("tool-b", "ALLOW");

		// Load replaces everything
		service.load([makeEntry("tool-c", "DENY")]);

		expect(service.canExecute("tool-a").effect).toBe("REQUIRE_APPROVAL");
		expect(service.canExecute("tool-c").effect).toBe("DENY");
	});

	it("getAllPermissions() returns a copy", () => {
		const service = new PermissionService();
		service.setPermission("test-tool", "ALLOW");

		const copy = service.getAllPermissions();
		expect(copy.get("test-tool")).toBe("ALLOW");

		// Mutating the copy should NOT affect the original
		copy.set("test-tool", "DENY");
		expect(service.canExecute("test-tool").effect).toBe("ALLOW");
	});

	it("setPermission() adds entry", () => {
		const service = new PermissionService();
		service.setPermission("tool-a", "DENY");
		service.setPermission("tool-b", "ALLOW", "company-1");

		expect(service.canExecute("tool-a").effect).toBe("DENY");
		expect(
			service.canExecute("tool-b", { companyId: "company-1" }).effect,
		).toBe("ALLOW");
		expect(service.canExecute("tool-b").effect).toBe("REQUIRE_APPROVAL");
	});

	it("PermissionEffect is a union of exactly three values", () => {
		const allow: PermissionEffect = "ALLOW";
		const deny: PermissionEffect = "DENY";
		const requireApproval: PermissionEffect = "REQUIRE_APPROVAL";

		expect([allow, deny, requireApproval]).toContain("ALLOW");
		expect([allow, deny, requireApproval]).toContain("DENY");
		expect([allow, deny, requireApproval]).toContain("REQUIRE_APPROVAL");
	});
});
