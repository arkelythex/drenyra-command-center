import { z } from "zod";

export const productSchema = z.object({
	id: z.string().optional(),
	companyId: z.string().min(1, "Company ID es requerido"),
	sku: z.string().min(1, "SKU es requerido"),
	name: z.string().min(1, "Nombre es requerido"),
	description: z.string().optional(),
	category: z.string().optional(),
	unitPrice: z.number().min(0, "Precio debe ser mayor o igual a 0"),
	costPrice: z.number().min(0).optional(),
	taxType: z.enum(["GRAVADO", "EXONERADO", "INAFECTO"]).default("GRAVADO"),
	stockMin: z.number().int().min(0).optional(),
	stockMax: z.number().int().min(0).optional(),
	currentStock: z.number().int().min(0).default(0),
	unit: z.string().default("UND"),
	status: z.enum(["active", "inactive"]).default("active"),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional(),
});

export type Product = z.infer<typeof productSchema>;
export type CreateProductDTO = Omit<Product, "id" | "createdAt" | "updatedAt">;
export type UpdateProductDTO = Partial<CreateProductDTO>;

export const TaxType = {
	GRAVADO: "GRAVADO",
	EXONERADO: "EXONERADO",
	INAFECTO: "INAFECTO",
} as const;

export const ProductStatus = {
	ACTIVE: "active",
	INACTIVE: "inactive",
} as const;
