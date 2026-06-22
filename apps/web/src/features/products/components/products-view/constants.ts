export const PRODUCTS_TABS = [
	{ id: "todos", label: "Todos" },
	{ id: "inventario", label: "Inventario" },
	{ id: "servicios", label: "Servicios" },
] as const;

export type ProductsTab = (typeof PRODUCTS_TABS)[number]["id"];
