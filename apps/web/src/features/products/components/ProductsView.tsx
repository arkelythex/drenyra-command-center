import { MobileTabNavigation } from "@/components/layout/MobileTabNavigation";
import { useDesignTokens } from "@/lib/design-tokens";
import { useProductsView } from "../hooks/use-products-view";
import { ProductModal } from "./ProductModal";
import type { ProductsTab } from "./products-view/constants";
import { PRODUCTS_TABS } from "./products-view/constants";
import { ProductsDesktopHeader } from "./products-view/desktop-header";
import { ProductsMobileToolbar } from "./products-view/mobile-toolbar";
import { ProductsGrid } from "./products-view/products-grid";

function isProductsTab(value: string): value is ProductsTab {
	return PRODUCTS_TABS.some((tab) => tab.id === value);
}

export const ProductsView = () => {
	const {
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
	} = useProductsView();

	const { borderRadius, zIndex, backdropBlur } = useDesignTokens();

	const handleTabChange = (tabId: string): void => {
		if (!isProductsTab(tabId)) return;
		setActiveTab(tabId);
	};

	return (
		<div className="flex flex-col h-full w-full bg-background overflow-hidden font-sans text-foreground relative">
			<MobileTabNavigation
				tabs={PRODUCTS_TABS}
				activeTab={activeTab}
				onTabChange={handleTabChange}
				className="left-auto right-4 top-4"
			/>

			<ProductsMobileToolbar
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				onCreate={handleNewProduct}
			/>

			<ProductsDesktopHeader
				backdropClassName={backdropBlur.glass}
				stickyZIndex={zIndex.sticky}
				iconBorderRadius={borderRadius.icon}
				searchQuery={searchQuery}
				filteredCount={filteredProducts.length}
				onSearchChange={setSearchQuery}
				onCreate={handleNewProduct}
			/>

			<ProductsGrid
				products={filteredProducts}
				searchQuery={searchQuery}
				backdropClassName={backdropBlur.glass}
				hoverOverlayClassName="bg-gradient-to-br from-primary/6 via-transparent to-transparent"
				onSelectProduct={handleEditProduct}
			/>

			<ProductModal
				open={isModalOpen}
				onOpenChange={setIsModalOpen}
				product={selectedProduct}
				mode={modalMode}
			/>
		</div>
	);
};
