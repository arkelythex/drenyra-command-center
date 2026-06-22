import { createCrudHooks } from "@/lib/crud-api";
import type {
	CreateProductDTO,
	Product,
	UpdateProductDTO,
} from "@/lib/schemas/product.schema";
import { productsApi } from "../api/products.api";

export const productHooks = createCrudHooks<Product, CreateProductDTO, UpdateProductDTO>({
	key: "products",
	list: (companyId) => productsApi.list({ companyId }),
	getById: (id) => productsApi.getById(id) as Promise<Product>,
	create: (companyId, data) => productsApi.create({ ...data, companyId }),
	update: (id, data) => productsApi.update(id, data),
	delete: async (id) => { await productsApi.delete(id); },
});
