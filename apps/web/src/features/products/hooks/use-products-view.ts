import { useMemo, useState } from "react";
import type { Product } from "@/lib/schemas/product.schema";
import { MOCK_PRODUCTS } from "../components/products.mock";
import type { ProductsTab } from "../components/products-view/constants";

export function useProductsView() {
	const [products] = useState<Product[]>(MOCK_PRODUCTS);
	const [searchQuery, setSearchQuery] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [modalMode, setModalMode] = useState<"create" | "edit">("create");
	const [activeTab, setActiveTab] = useState<ProductsTab>("todos");

	const filteredProducts = useMemo(
		() =>
			products.filter(
				(product) =>
					product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
					product.category?.toLowerCase().includes(searchQuery.toLowerCase()),
			),
		[products, searchQuery],
	);

	const handleNewProduct = () => {
		setSelectedProduct(null);
		setModalMode("create");
		setIsModalOpen(true);
	};

	const handleEditProduct = (product: Product) => {
		setSelectedProduct(product);
		setModalMode("edit");
		setIsModalOpen(true);
	};

	return {
		searchQuery,
		isModalOpen,
		selectedProduct,
		modalMode,
		activeTab,
		filteredProducts,
		handleNewProduct,
		handleEditProduct,
		setSearchQuery,
		setIsModalOpen,
		setActiveTab,
	};
}
