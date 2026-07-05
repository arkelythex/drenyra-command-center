import { t } from "elysia";

/**
 * Request body schema for creating a product.
 *
 * @example
 * ```ts
 * const schema = CreateProductSchema;
 * ```
 */
export const CreateProductSchema = t.Object({
	companyId: t.String({ description: "ID de la empresa" }),
	sku: t.String({ description: "Código de unidad de stock (SKU)" }),
	name: t.String({ description: "Nombre del producto" }),
	description: t.Optional(t.String({ description: "Descripción detallada" })),
	category: t.Optional(t.String({ description: "Categoría del producto" })),
	unitPrice: t.String({ description: "Precio unitario" }),
	costPrice: t.Optional(t.String({ description: "Costo unitario" })),
	taxType: t.Optional(
		t.Union(
			[t.Literal("GRAVADO"), t.Literal("EXONERADO"), t.Literal("INAFECTO")],
			{ description: "Tipo de afectación tributaria" },
		),
	),
	unit: t.Optional(
		t.String({
			description: "Unidad de medida (ej. NIU, KGM)",
			default: "NIU",
		}),
	),
	stockQuantity: t.Optional(
		t.String({ description: "Cantidad en stock", default: "0" }),
	),
});

/**
 * Request body schema for updating a product.
 *
 * @example
 * ```ts
 * const schema = UpdateProductSchema;
 * ```
 */
export const UpdateProductSchema = t.Object({
	sku: t.Optional(t.String()),
	name: t.Optional(t.String()),
	description: t.Optional(t.String()),
	category: t.Optional(t.String()),
	unitPrice: t.Optional(t.String()),
	costPrice: t.Optional(t.String()),
	taxType: t.Optional(
		t.Union([
			t.Literal("GRAVADO"),
			t.Literal("EXONERADO"),
			t.Literal("INAFECTO"),
		]),
	),
	unit: t.Optional(t.String()),
	stockQuantity: t.Optional(t.String()),
});

/**
 * Query string schema for listing products.
 *
 * @example
 * ```ts
 * const schema = ListProductsQuerySchema;
 * ```
 */
export const ListProductsQuerySchema = t.Object({
	companyId: t.Optional(t.String()),
});

/**
 * Params schema for product id routes.
 *
 * @example
 * ```ts
 * const schema = ProductIdParamsSchema;
 * ```
 */
export const ProductIdParamsSchema = t.Object({
	id: t.String(),
});
