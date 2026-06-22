import { api } from "@/lib/api";
import { extractOkDataOrPassthrough, unwrap } from "@/lib/api-helpers";
import type {
	CreateProductDTO,
	Product,
	UpdateProductDTO,
} from "@/lib/schemas/product.schema";

interface BackendProduct {
	id: string;
	companyId: string;
	sku: string;
	name: string;
	description: string | null;
	category: string | null;
	unitPrice: string;
	costPrice: string | null;
	taxType: Product["taxType"];
	unit: string;
	stockQuantity: string | null;
	minStock: string | null;
	maxStock: string | null;
	isActive: boolean | null;
	createdAt: string | Date;
	updatedAt: string | Date;
}

interface CreateProductApiPayload {
	companyId: string;
	sku: string;
	name: string;
	description?: string;
	category?: string;
	unitPrice: string;
	costPrice?: string;
	taxType?: Product["taxType"];
	unit?: string;
	stockQuantity?: string;
}

interface UpdateProductApiPayload {
	sku?: string;
	name?: string;
	description?: string;
	category?: string;
	unitPrice?: string;
	costPrice?: string;
	taxType?: Product["taxType"];
	unit?: string;
	stockQuantity?: string;
}

interface ProductListPayload {
	data?: BackendProduct[];
}

function toOptionalString(value: string | undefined): string | undefined {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function toDecimalString(value: number | undefined): string | undefined {
	if (typeof value !== "number") return undefined;
	return value.toFixed(2);
}

function toBackendProduct(product: BackendProduct): Product {
	return {
		id: product.id,
		companyId: product.companyId,
		sku: product.sku,
		name: product.name,
		description: product.description ?? undefined,
		category: product.category ?? undefined,
		unitPrice: Number.parseFloat(product.unitPrice),
		costPrice:
			typeof product.costPrice === "string"
				? Number.parseFloat(product.costPrice)
				: undefined,
		taxType: product.taxType,
		unit: product.unit,
		stockMin:
			typeof product.minStock === "string"
				? Number.parseFloat(product.minStock)
				: undefined,
		stockMax:
			typeof product.maxStock === "string"
				? Number.parseFloat(product.maxStock)
				: undefined,
		currentStock:
			typeof product.stockQuantity === "string"
				? Number.parseFloat(product.stockQuantity)
				: 0,
		status: product.isActive === false ? "inactive" : "active",
		createdAt:
			product.createdAt instanceof Date
				? product.createdAt.toISOString()
				: product.createdAt,
		updatedAt:
			product.updatedAt instanceof Date
				? product.updatedAt.toISOString()
				: product.updatedAt,
	};
}

function isBackendProduct(value: unknown): value is BackendProduct {
	return (
		typeof value === "object" &&
		value !== null &&
		"id" in value &&
		"companyId" in value &&
		"sku" in value &&
		"name" in value
	);
}

function normalizeProductList(
	payload: BackendProduct[] | ProductListPayload | null | undefined,
): Product[] {
	if (Array.isArray(payload)) return payload.map(toBackendProduct);
	return Array.isArray(payload?.data) ? payload.data.map(toBackendProduct) : [];
}

function serializeCreateProductPayload(
	payload: CreateProductDTO,
): CreateProductApiPayload {
	return {
		companyId: payload.companyId,
		sku: payload.sku,
		name: payload.name,
		...(toOptionalString(payload.description) && {
			description: toOptionalString(payload.description),
		}),
		...(toOptionalString(payload.category) && {
			category: toOptionalString(payload.category),
		}),
		unitPrice: payload.unitPrice.toFixed(2),
		...(toDecimalString(payload.costPrice) && {
			costPrice: toDecimalString(payload.costPrice),
		}),
		taxType: payload.taxType,
		unit: payload.unit,
		stockQuantity: payload.currentStock.toFixed(2),
	};
}

function serializeUpdateProductPayload(
	payload: UpdateProductDTO,
): UpdateProductApiPayload {
	return {
		...(payload.sku !== undefined && { sku: payload.sku }),
		...(payload.name !== undefined && { name: payload.name }),
		...(payload.description !== undefined && {
			description: toOptionalString(payload.description),
		}),
		...(payload.category !== undefined && {
			category: toOptionalString(payload.category),
		}),
		...(payload.unitPrice !== undefined && {
			unitPrice: payload.unitPrice.toFixed(2),
		}),
		...(payload.costPrice !== undefined && {
			costPrice: toDecimalString(payload.costPrice),
		}),
		...(payload.taxType !== undefined && { taxType: payload.taxType }),
		...(payload.unit !== undefined && { unit: payload.unit }),
		...(payload.currentStock !== undefined && {
			stockQuantity: payload.currentStock.toFixed(2),
		}),
	};
}

export const productsApi = {
	/**
	 * Listar catálogo de productos
	 */
	list: async (filters: { companyId?: string }): Promise<Product[]> => {
		const body = await unwrap(api.products.get({ query: filters }));
		const payload = extractOkDataOrPassthrough(
			body,
			"products.list",
		) as BackendProduct[];
		return normalizeProductList(payload);
	},

	/**
	 * Crear nuevo producto/servicio
	 */
	create: async (payload: CreateProductDTO): Promise<Product> => {
		const body = await unwrap(
			api.products.post(serializeCreateProductPayload(payload)),
		);
		const record = extractOkDataOrPassthrough(body, "products.create") as unknown;
		if (!isBackendProduct(record)) {
			throw new Error("Invalid product payload received after create");
		}
		return toBackendProduct(record);
	},

	/**
	 * Obtener detalle
	 */
	getById: async (id: string): Promise<Product | null> => {
		const body = await unwrap(api.products({ id }).get());
		const record = extractOkDataOrPassthrough(body, "products.getById") as unknown;
		if (!isBackendProduct(record)) return null;
		return toBackendProduct(record);
	},

	/**
	 * Actualizar precios o stock
	 */
	update: async (id: string, payload: UpdateProductDTO): Promise<Product> => {
		const body = await unwrap(
			api.products({ id }).patch(serializeUpdateProductPayload(payload)),
		);
		const record = extractOkDataOrPassthrough(body, "products.update") as unknown;
		if (!isBackendProduct(record)) {
			throw new Error("Invalid product payload received after update");
		}
		return toBackendProduct(record);
	},

	/**
	 * Eliminar producto
	 */
	delete: async (id: string): Promise<Product> => {
		const body = await unwrap(api.products({ id }).delete());
		const record = extractOkDataOrPassthrough(body, "products.delete") as unknown;
		if (!isBackendProduct(record)) {
			throw new Error("Invalid product payload received after delete");
		}
		return toBackendProduct(record);
	},
};
