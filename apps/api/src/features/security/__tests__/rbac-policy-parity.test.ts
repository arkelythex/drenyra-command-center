import { hasPlatformPermission } from "@drenyra/security/rbac";
import { describe, expect, it } from "vitest";
import { ROLE_PERMISSIONS, type SecurityOperation } from "../rbac-policy";

const roles = Object.keys(ROLE_PERMISSIONS);
const operations = [
	...new Set(Object.values(ROLE_PERMISSIONS).flatMap((set) => [...set])),
] as SecurityOperation[];

/**
 * Operations the unified policy grants and the legacy matrix does not. Each
 * entry is a decision still open; a new divergence must fail this test.
 */
const KNOWN_UNIFIED_GRANTS: Record<string, SecurityOperation[]> = {
	viewer: ["audit:trail:export"],
};

describe("legacy and unified RBAC policies agree", () => {
	// authorizeOperation decides with the unified policy, so a role it grants
	// that the legacy matrix denies is access nobody reviewed.
	for (const role of roles) {
		it(`${role} has the same operations in both policies`, () => {
			const legacy = operations.filter((op) => ROLE_PERMISSIONS[role]?.has(op));
			const unified = operations.filter((op) =>
				hasPlatformPermission(role as never, `platform:${op}` as never),
			);
			const expected = [...legacy, ...(KNOWN_UNIFIED_GRANTS[role] ?? [])];
			expect(unified.sort()).toEqual(expected.sort());
		});
	}
});
