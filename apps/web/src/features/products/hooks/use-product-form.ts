import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useFinancialHaptics, useHaptics } from "@/hooks/useHaptics";
import type { CreateProductDTO } from "@/lib/schemas/product.schema";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import {
	buildProductDefaultValues,
	createProductSchema,
	type ProductFormData,
	type ProductFormValues,
} from "../components/product-form/constants";

interface UseProductFormOptions {
	defaultValues?: Partial<CreateProductDTO>;
	onSubmit: (data: CreateProductDTO) => void | Promise<void>;
}

export function useProductForm({
	defaultValues,
	onSubmit,
}: UseProductFormOptions) {
	const { trigger } = useHaptics();
	const financialHaptics = useFinancialHaptics();
	const { companyContext } = useActiveCompanyContext();
	const resolvedDefaultValues = useMemo(
		() => buildProductDefaultValues(companyContext.companyId, defaultValues),
		[companyContext.companyId, defaultValues],
	);

	const form = useForm<ProductFormValues, unknown, ProductFormData>({
		resolver: zodResolver(createProductSchema),
		defaultValues: resolvedDefaultValues,
	});

	useEffect(() => {
		if (defaultValues?.companyId) return;
		form.setValue("companyId", companyContext.companyId, {
			shouldDirty: false,
			shouldTouch: false,
			shouldValidate: false,
		});
	}, [companyContext.companyId, defaultValues?.companyId, form]);

	const handleFormSubmit = async (data: ProductFormData): Promise<void> => {
		financialHaptics.onSubmit();
		await onSubmit(data);
	};

	return {
		form,
		trigger,
		handleFormSubmit,
	};
}
