import { z } from "zod";

const UuidSchema = z.string().uuid();
const MoneyStringSchema = z.string().regex(/^\d+(\.\d{1,2})?$/);
const QuantityStringSchema = z.string().regex(/^\d+(\.\d{1,4})?$/);
const TaxTypeSchema = z.enum(["GRAVADO", "EXONERADO", "INAFECTO"]);

export const ListProductsQuerySchema = z.object({
	companyId: UuidSchema.optional(),
});

export const ProductIdParamsSchema = z.object({
	id: UuidSchema,
});

export const CreateProductBodySchema = z.object({
	companyId: UuidSchema,
	sku: z.string().min(1),
	name: z.string().min(1),
	description: z.string().min(1).optional(),
	category: z.string().min(1).optional(),
	unitPrice: MoneyStringSchema,
	costPrice: MoneyStringSchema.optional(),
	taxType: TaxTypeSchema.optional(),
	unit: z.string().min(1).optional(),
	stockQuantity: QuantityStringSchema.optional(),
});

export const UpdateProductBodySchema = z
	.object({
		sku: z.string().min(1).optional(),
		name: z.string().min(1).optional(),
		description: z.string().min(1).optional(),
		category: z.string().min(1).optional(),
		unitPrice: MoneyStringSchema.optional(),
		costPrice: MoneyStringSchema.optional(),
		taxType: TaxTypeSchema.optional(),
		unit: z.string().min(1).optional(),
		stockQuantity: QuantityStringSchema.optional(),
	})
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one field is required",
	});

export const ProductRecordSchema = z.object({
	id: UuidSchema,
	companyId: UuidSchema,
	sku: z.string().min(1),
	name: z.string().min(1),
	description: z.string().nullable(),
	category: z.string().nullable(),
	unitPrice: MoneyStringSchema,
	costPrice: MoneyStringSchema.nullable(),
	taxType: TaxTypeSchema,
	unit: z.string().min(1),
	stockQuantity: QuantityStringSchema.nullable(),
	minStock: QuantityStringSchema.nullable(),
	maxStock: QuantityStringSchema.nullable(),
	imageUrl: z.string().nullable(),
	isActive: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const ProductListResponseSchema = z.array(ProductRecordSchema);
export const ProductNullableResponseSchema = ProductRecordSchema.nullable();

export type CreateProductBody = z.infer<typeof CreateProductBodySchema>;
export type UpdateProductBody = z.infer<typeof UpdateProductBodySchema>;
