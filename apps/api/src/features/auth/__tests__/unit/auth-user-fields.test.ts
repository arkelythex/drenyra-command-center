/**
 * Better Auth refuses to sign anyone up when a declared user field is not a
 * column of the Drizzle `auth_users` schema; and every declared field is
 * returned in the session, so secrets must never be declared.
 */
import { authUsers } from "@drenyra/persistence/schema";
import { describe, expect, it } from "vitest";
import { authOptions } from "../../auth.config";

const declared = Object.keys(authOptions.user?.additionalFields ?? {});

describe("auth user additional fields", () => {
	it("are all columns of the auth_users schema", () => {
		const columns = Object.keys(authUsers);
		expect(declared.filter((field) => !columns.includes(field))).toEqual([]);
	});

	it("never expose MFA secrets in the session", () => {
		for (const secret of [
			"totpSecret",
			"totp_secret",
			"recoveryCodes",
			"recovery_codes",
		]) {
			expect(declared).not.toContain(secret);
		}
	});
});
