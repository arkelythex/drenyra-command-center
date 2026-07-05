import { t } from "elysia";

/**
 * Movement type enum schema (IN/OUT/TRANSFER/ADJUSTMENT).
 *
 * @example
 * ```ts
 * const schema = MovementTypeSchema;
 * ```
 */
export const MovementTypeSchema = t.Union([
	t.Literal("IN"),
	t.Literal("OUT"),
	t.Literal("TRANSFER"),
	t.Literal("ADJUSTMENT"),
]);

/**
 * Request body schema for creating a stock movement.
 *
 * @example
 * ```ts
 * const schema = CreateMovementSchema;
 * ```
 */
export const CreateMovementSchema = t.Object({
	productId: t.String({ format: "uuid" }),
	warehouseId: t.Optional(t.String({ format: "uuid" })),
	type: MovementTypeSchema,
	quantity: t.Number({ minimum: 0 }),
	unitCost: t.Optional(t.Number({ minimum: 0 })),
	reference: t.Optional(t.String()),
	referenceId: t.Optional(t.String({ format: "uuid" })),
	referenceNumber: t.Optional(t.String()),
	notes: t.Optional(t.String()),
	reason: t.Optional(t.String()),
});

/**
 * Query string schema for inventory listing.
 *
 * @example
 * ```ts
 * const schema = InventoryQuerySchema;
 * ```
 */
export const InventoryQuerySchema = t.Object({
	warehouseId: t.Optional(t.String({ format: "uuid" })),
});

/**
 * Query string schema for kardex date filters.
 *
 * @example
 * ```ts
 * const schema = KardexQuerySchema;
 * ```
 */
export const KardexQuerySchema = t.Object({
	startDate: t.Optional(t.String()),
	endDate: t.Optional(t.String()),
});

/**
 * Request body schema for creating a warehouse.
 *
 * @example
 * ```ts
 * const schema = CreateWarehouseSchema;
 * ```
 */
export const CreateWarehouseSchema = t.Object({
	name: t.String(),
	address: t.Optional(t.String()),
	isDefault: t.Optional(t.Boolean()),
	description: t.Optional(t.String()),
});
