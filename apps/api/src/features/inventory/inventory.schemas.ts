import { z } from "zod";

const UuidSchema = z.string().uuid();
const MovementTypeSchema = z.enum(["IN", "OUT", "TRANSFER", "ADJUSTMENT"]);
const DecimalStringSchema = z.string().regex(/^-?\d+(\.\d{1,4})?$/);

export const InventoryListQuerySchema = z.object({
	warehouseId: UuidSchema.optional(),
});

export const CreateMovementBodySchema = z.object({
	productId: UuidSchema,
	warehouseId: UuidSchema.optional(),
	type: MovementTypeSchema,
	quantity: z.number().finite().nonnegative(),
	unitCost: z.number().finite().nonnegative().optional(),
	reference: z.string().min(1).optional(),
	referenceId: UuidSchema.optional(),
	referenceNumber: z.string().min(1).optional(),
	notes: z.string().min(1).optional(),
	reason: z.string().min(1).optional(),
});

export const KardexParamsSchema = z.object({
	productId: UuidSchema,
});

export const KardexQuerySchema = z
	.object({
		startDate: z.coerce.date().optional(),
		endDate: z.coerce.date().optional(),
	})
	.refine(
		(value) =>
			!value.startDate || !value.endDate || value.endDate >= value.startDate,
		{
			path: ["endDate"],
			message: "endDate must be greater than or equal to startDate",
		},
	);

export const CreateWarehouseBodySchema = z.object({
	name: z.string().min(1),
	address: z.string().min(1).optional(),
	isDefault: z.boolean().optional(),
	description: z.string().min(1).optional(),
});

export const InventoryListItemSchema = z.object({
	id: UuidSchema,
	productId: UuidSchema,
	warehouseId: UuidSchema.nullable(),
	quantity: DecimalStringSchema,
	minStock: DecimalStringSchema.nullable(),
	maxStock: DecimalStringSchema.nullable(),
	unitCost: DecimalStringSchema.nullable(),
	totalValue: DecimalStringSchema.nullable(),
	lastUpdated: z.date().nullable(),
	product: z.unknown().nullable(),
	warehouse: z.unknown().nullable(),
});

export const InventoryListResponseSchema = z.array(InventoryListItemSchema);

export const InventoryMovementResponseSchema = z
	.object({
		id: UuidSchema,
		companyId: UuidSchema,
		productId: UuidSchema,
		warehouseId: UuidSchema.nullable().optional(),
		type: MovementTypeSchema,
		quantity: DecimalStringSchema,
		unitCost: DecimalStringSchema.nullable().optional(),
		totalCost: DecimalStringSchema.nullable().optional(),
		createdAt: z.date().nullable().optional(),
	})
	.passthrough();

export const KardexRowSchema = z.object({
	date: z.date().nullable(),
	type: z.string().min(1),
	reference: z.string().nullable(),
	quantityIn: DecimalStringSchema,
	quantityOut: DecimalStringSchema,
	balance: DecimalStringSchema,
	unitCost: DecimalStringSchema,
	totalValue: DecimalStringSchema,
});

export const KardexResponseSchema = z.array(KardexRowSchema);

export const InventorySummaryResponseSchema = z.object({
	totalProducts: z.number().int().nonnegative(),
	totalQuantity: DecimalStringSchema,
	totalValue: DecimalStringSchema,
	lowStockItems: z.number().int().nonnegative(),
	warehouseCount: z.number().int().nonnegative(),
});

export const WarehouseResponseSchema = z
	.object({
		id: UuidSchema,
		companyId: UuidSchema,
		name: z.string().min(1),
	})
	.passthrough();

export const WarehouseListResponseSchema = z.array(WarehouseResponseSchema);

export type CreateMovementBody = z.infer<typeof CreateMovementBodySchema>;
export type CreateWarehouseBody = z.infer<typeof CreateWarehouseBodySchema>;
