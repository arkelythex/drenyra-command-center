import { describe, expect, it } from "vitest";
import {
	CoreMembershipSchema,
	CoreOrganizationSchema,
	CorePermissionSchema,
	CoreRoleSchema,
	CoreUserSchema,
} from "../schemas";

const validUser = {
	id: "user_01",
	email: "test@example.com",
	name: "Test User",
	isActive: true,
	createdAt: new Date("2026-01-01"),
	updatedAt: new Date("2026-01-01"),
};

const validOrganization = {
	id: "org_01",
	ruc: "20123456789",
	businessName: "Test Corp",
	countryCode: "PE",
	isActive: true,
	settings: { language: "es", timezone: "America/Lima", currency: "PEN" },
	createdAt: new Date("2026-01-01"),
	updatedAt: new Date("2026-01-01"),
};

const validPermission = {
	id: "perm_01",
	roleId: "role_01",
	domain: "invoicing",
	resource: "invoice",
	action: "create" as const,
};

const validRole = {
	id: "role_01",
	organizationId: "org_01",
	name: "Admin",
	isSystem: true,
	permissions: [{ ...validPermission, roleId: "role_01" }],
	createdAt: new Date("2026-01-01"),
};

const validMembership = {
	userId: "user_01",
	organizationId: "org_01",
	roleId: "role_01",
	isDefault: true,
	joinedAt: new Date("2026-01-01"),
};

describe("CoreUserSchema", () => {
	it("parses a valid user", () => {
		const result = CoreUserSchema.safeParse(validUser);
		expect(result.success).toBe(true);
	});

	it("rejects missing email", () => {
		const { email, ...rest } = validUser;
		const result = CoreUserSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it("rejects invalid email", () => {
		const result = CoreUserSchema.safeParse({
			...validUser,
			email: "not-an-email",
		});
		expect(result.success).toBe(false);
	});

	it("rejects missing name", () => {
		const result = CoreUserSchema.safeParse({ ...validUser, name: "" });
		expect(result.success).toBe(false);
	});
});

describe("CoreOrganizationSchema", () => {
	it("parses a valid organization", () => {
		const result = CoreOrganizationSchema.safeParse(validOrganization);
		expect(result.success).toBe(true);
	});

	it("accepts optional tradeName", () => {
		const result = CoreOrganizationSchema.safeParse({
			...validOrganization,
			tradeName: "Test",
		});
		expect(result.success).toBe(true);
	});

	it("rejects missing businessName", () => {
		const result = CoreOrganizationSchema.safeParse({
			...validOrganization,
			businessName: "",
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid settings", () => {
		const result = CoreOrganizationSchema.safeParse({
			...validOrganization,
			settings: { language: "es" },
		});
		expect(result.success).toBe(false);
	});
});

describe("CorePermissionSchema", () => {
	it("parses a valid permission", () => {
		const result = CorePermissionSchema.safeParse(validPermission);
		expect(result.success).toBe(true);
	});

	it("rejects invalid action", () => {
		const result = CorePermissionSchema.safeParse({
			...validPermission,
			action: "sudo",
		});
		expect(result.success).toBe(false);
	});

	it("accepts optional conditions", () => {
		const result = CorePermissionSchema.safeParse({
			...validPermission,
			conditions: { departmentId: "dept_01" },
		});
		expect(result.success).toBe(true);
	});
});

describe("CoreRoleSchema", () => {
	it("parses a valid role", () => {
		const result = CoreRoleSchema.safeParse(validRole);
		expect(result.success).toBe(true);
	});

	it("rejects empty permissions", () => {
		const result = CoreRoleSchema.safeParse({ ...validRole, permissions: [] });
		expect(result.success).toBe(true);
	});

	it("accepts optional description", () => {
		const result = CoreRoleSchema.safeParse({
			...validRole,
			description: "Administrator role",
		});
		expect(result.success).toBe(true);
	});
});

describe("CoreMembershipSchema", () => {
	it("parses a valid membership", () => {
		const result = CoreMembershipSchema.safeParse(validMembership);
		expect(result.success).toBe(true);
	});

	it("rejects missing userId", () => {
		const result = CoreMembershipSchema.safeParse({
			...validMembership,
			userId: "",
		});
		expect(result.success).toBe(false);
	});
});
