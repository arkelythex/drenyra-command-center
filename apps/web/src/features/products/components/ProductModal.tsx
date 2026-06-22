import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { CreateProductDTO, Product } from "@/lib/schemas/product.schema";
import { productHooks } from "../hooks/useProducts";
import { ProductForm } from "./ProductForm";

interface ProductModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	product?: Product | null;
	mode: "create" | "edit";
}

export const ProductModal = ({
	open,
	onOpenChange,
	product,
	mode,
}: ProductModalProps) => {
	const { mutate: createProduct, isPending: isCreating } = productHooks.useCreate();
	const { mutate: updateProduct, isPending: isUpdating } = productHooks.useUpdate();

	const isLoading = isCreating || isUpdating;

	const handleSubmit = (data: CreateProductDTO) => {
		if (mode === "create") {
			createProduct(data, {
				onSuccess: () => {
					onOpenChange(false);
				},
			});
			return;
		}

		if (product?.id) {
			updateProduct(
				{ id: product.id, data },
				{
					onSuccess: () => {
						onOpenChange(false);
					},
				},
			);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-surface-soft border-border">
				<DialogHeader>
					<DialogTitle className="text-2xl font-black text-foreground tracking-tight uppercase">
						{mode === "create" ? "NUEVO PRODUCTO" : "EDITAR PRODUCTO"}
					</DialogTitle>
					{mode === "edit" && product && (
						<p className="text-xs text-muted-foreground font-mono mt-1">
							SKU: {product.sku}
						</p>
					)}
				</DialogHeader>

				<div className="mt-4">
					<ProductForm
						defaultValues={product || undefined}
						onSubmit={handleSubmit}
						isLoading={isLoading}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
};
