import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { authorizeOperation } from "../rbac-guard";
import { hasPermission, type SecurityOperation } from "../rbac-policy";

// Roles a company membership can carry (MembershipRole in @drenyra/domain scope types).
const MEMBERSHIP_ROLES = [
	"owner",
	"admin",
	"accountant",
	"reviewer",
	"approver",
	"viewer",
];

function headersFor(role: string) {
	return {
		"x-user-id": "usr-1",
		"x-user-role": role,
		"x-company-id": "cmp-1",
	};
}

async function allowed(role: string, operation: SecurityOperation) {
	const result = await authorizeOperation({
		headers: headersFor(role),
		operation,
		resource: "/test",
	});
	return result.ok;
}

describe("membership roles in the RBAC policy", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		process.env = { ...originalEnv, SECURITY_ENFORCE_TEST_RBAC: "true" };
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("accountant works like an analyst but cannot resolve approvals", async () => {
		expect(await allowed("accountant", "cognitive:stream")).toBe(true);
		expect(await allowed("accountant", "documents:upload:create")).toBe(true);
		expect(await allowed("accountant", "cognitive:approval:resolve")).toBe(
			false,
		);
		expect(await allowed("accountant", "ai:tool-permissions:manage")).toBe(
			false,
		);
	});

	it("reviewer is read-only", async () => {
		expect(await allowed("reviewer", "cognitive:state:read")).toBe(true);
		expect(await allowed("reviewer", "documents:query:read")).toBe(true);
		expect(await allowed("reviewer", "cognitive:stream")).toBe(false);
		expect(await allowed("reviewer", "cognitive:approval:resolve")).toBe(false);
	});

	it("approver works like an analyst and can resolve approvals", async () => {
		expect(await allowed("approver", "cognitive:stream")).toBe(true);
		expect(await allowed("approver", "cognitive:approval:resolve")).toBe(true);
		expect(await allowed("approver", "ai:tool-permissions:manage")).toBe(false);
	});

	it("decides the same way when the unified guard is switched off", () => {
		process.env.UNIFIED_RBAC_ENABLED = "false";
		expect(hasPermission("accountant", "cognitive:stream")).toBe(true);
		expect(hasPermission("reviewer", "cognitive:stream")).toBe(false);
		expect(hasPermission("approver", "cognitive:approval:resolve")).toBe(true);
	});

	it("leaves no membership role without at least read access", async () => {
		for (const role of MEMBERSHIP_ROLES) {
			expect(await allowed(role, "cognitive:state:read")).toBe(true);
		}
	});

	it("still denies a role that is not a membership role", async () => {
		expect(await allowed("intruder", "cognitive:state:read")).toBe(false);
	});
});
