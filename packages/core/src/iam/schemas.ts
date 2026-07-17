import { z } from "zod";

export const CoreUserSchema = z.object({
	id: z.string().min(1),
	email: z.string().email(),
	name: z.string().min(1),
	isActive: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const CoreOrganizationSettingsSchema = z.object({
	language: z.string().min(1),
	timezone: z.string().min(1),
	currency: z.string().min(1),
});

export const CoreOrganizationSchema = z.object({
	id: z.string().min(1),
	ruc: z.string().min(1),
	businessName: z.string().min(1),
	tradeName: z.string().optional(),
	countryCode: z.string().min(1),
	isActive: z.boolean(),
	settings: CoreOrganizationSettingsSchema,
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const CorePermissionSchema = z.object({
	id: z.string().min(1),
	roleId: z.string().min(1),
	domain: z.string().min(1),
	resource: z.string().min(1),
	action: z.enum(["create", "read", "update", "delete", "approve"]),
	conditions: z.record(z.string(), z.unknown()).optional(),
});

export const CoreRoleSchema = z.object({
	id: z.string().min(1),
	organizationId: z.string().min(1),
	name: z.string().min(1),
	description: z.string().optional(),
	isSystem: z.boolean(),
	permissions: z.array(CorePermissionSchema),
	createdAt: z.date(),
});

export const CoreMembershipSchema = z.object({
	userId: z.string().min(1),
	organizationId: z.string().min(1),
	roleId: z.string().min(1),
	isDefault: z.boolean(),
	joinedAt: z.date(),
});
