import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import type { CreateProductDTO } from "@/lib/schemas/product.schema";
import { ProductFormStockSection } from "./ProductFormStockSection";
import { ProductFormBasicInfoSection } from "./product-form/basic-info-section";
import { ProductFormClassificationSection } from "./product-form/classification-section";
import { ProductFormPricingSection } from "./product-form/pricing-section";
import { useProductForm } from "../hooks/use-product-form";

interface ProductFormProps {
	defaultValues?: Partial<CreateProductDTO>;
	onSubmit: (data: CreateProductDTO) => void;
	isLoading?: boolean;
}

export const ProductForm = ({
	defaultValues,
	onSubmit,
	isLoading,
}: ProductFormProps) => {
	const { form, trigger, handleFormSubmit } = useProductForm({
		defaultValues,
		onSubmit,
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
				<ProductFormBasicInfoSection
					form={form}
					onFieldFocus={() => trigger("light")}
				/>

				<ProductFormClassificationSection
					form={form}
					onFieldFocus={() => trigger("light")}
				/>

				<ProductFormPricingSection
					form={form}
					onFieldFocus={() => trigger("light")}
					onTaxTypeSelect={() => trigger("light")}
				/>

				<ProductFormStockSection
					form={form}
					onFieldFocus={() => trigger("light")}
				/>

				<Button
					type="submit"
					disabled={isLoading}
					className="w-full h-11 font-black text-xs bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 active:scale-95 transition-all"
				>
					{isLoading ? "GUARDANDO..." : "GUARDAR PRODUCTO"}
				</Button>
			</form>
		</Form>
	);
};
