import { z } from "zod";

export const CoreClientSchema = z.object({
	id: z.string().min(1),
	organizationId: z.string().min(1),
	documentType: z.enum(["ruc", "dni", "ce", "passport"]),
	documentNumber: z.string().min(1),
	businessName: z.string().min(1),
	tradeName: z.string().optional(),
	address: z.string().optional(),
	email: z.string().email().optional().or(z.literal("")),
	phone: z.string().optional(),
	isActive: z.boolean(),
	tags: z.array(z.string()),
	metadata: z.record(z.string(), z.unknown()),
	createdBy: z.string().min(1),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const CoreProductSchema = z.object({
	id: z.string().min(1),
	organizationId: z.string().min(1),
	name: z.string().min(1),
	description: z.string().optional(),
	category: z.string().min(1),
	unitType: z.enum(["unit", "kg", "m2", "m3", "hour", "service", "other"]),
	unitPrice: z.number().optional(),
	currency: z.string().min(1),
	isActive: z.boolean(),
	metadata: z.record(z.string(), z.unknown()),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const CoreLocationCoordinatesSchema = z.object({
	latitude: z.number(),
	longitude: z.number(),
});

export const CoreLocationSchema = z.object({
	id: z.string().min(1),
	organizationId: z.string().min(1),
	name: z.string().min(1),
	type: z.enum(["address", "farm", "warehouse", "clinic", "airspace", "other"]),
	countryCode: z.string().min(1),
	region: z.string().optional(),
	city: z.string().optional(),
	address: z.string().optional(),
	coordinates: CoreLocationCoordinatesSchema.optional(),
	isActive: z.boolean(),
	metadata: z.record(z.string(), z.unknown()),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const CoreContractSchema = z.object({
	id: z.string().min(1),
	organizationId: z.string().min(1),
	clientId: z.string().min(1),
	contractType: z.enum([
		"service",
		"sale",
		"lease",
		"loan",
		"employment",
		"other",
	]),
	status: z.enum(["draft", "active", "completed", "cancelled"]),
	startDate: z.date(),
	endDate: z.date().optional(),
	value: z.number().optional(),
	currency: z.string().min(1),
	terms: z.string().optional(),
	metadata: z.record(z.string(), z.unknown()),
	createdAt: z.date(),
	updatedAt: z.date(),
});
