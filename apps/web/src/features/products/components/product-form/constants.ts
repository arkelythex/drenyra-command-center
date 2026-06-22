import type { z } from "zod";
import {
	type CreateProductDTO,
	productSchema,
} from "@/lib/schemas/product.schema";

export const createProductSchema = productSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export type ProductFormValues = z.input<typeof createProductSchema>;
export type ProductFormData = z.output<typeof createProductSchema>;

export const INPUT_CLASS =
	"h-11 bg-[var(--surface-1)] border-[var(--border-default)] font-mono text-xs placeholder:text-muted-foreground/70";

export function buildProductDefaultValues(
	activeCompanyId: string,
	defaultValues?: Partial<CreateProductDTO>,
): ProductFormValues {
	return {
		companyId: defaultValues?.companyId ?? activeCompanyId,
		sku: "",
		name: "",
		description: "",
		category: "",
		unitPrice: 0,
		costPrice: 0,
		taxType: "GRAVADO",
		stockMin: 0,
		stockMax: 0,
		currentStock: 0,
		unit: "UND",
		status: "active",
		...defaultValues,
	};
}
