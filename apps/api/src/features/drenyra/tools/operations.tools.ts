import type { AgentContext, AgentTool } from "@drenyra/pi";
import { z } from "zod";

/**
 * createCustomerTool const.
 *
 * @example
 * ```ts
 * console.log(createCustomerTool);
 * ```
 */
export const createCustomerTool: AgentTool = {
	name: "create_customer",
	description:
		"Crea un nuevo cliente. Valida RUC con Módulo 11 SUNAT automáticamente.",
	inputSchema: z.object({
		legalName: z.string().min(2),
		taxId: z.string().length(11),
		email: z.string().email().optional(),
		phone: z.string().optional(),
		address: z.string().optional(),
		creditDays: z.number().int().min(0).default(30),
		creditLimit: z.number().min(0).default(0),
	}),
	outputSchema: z.object({
		id: z.string(),
		legalName: z.string(),
		taxId: z.string(),
	}),
	approvalLevel: "auto",
	async execute(input: unknown, context: AgentContext) {
		const inp = input as {
			legalName: string;
			taxId: string;
			email?: string;
			phone?: string;
			address?: string;
			creditDays: number;
			creditLimit: number;
		};
		const { CreateCustomerCommand } = await import("../../customers");
		const cmd = new CreateCustomerCommand();
		const customer = await cmd.execute({
			companyId: context.companyId,
			legalName: inp.legalName,
			taxId: inp.taxId,
			email: inp.email,
			phone: inp.phone,
			address: inp.address,
			creditDays: inp.creditDays,
			creditLimit: inp.creditLimit,
		});
		return {
			id: customer.id,
			legalName: customer.legalName,
			taxId: customer.taxId,
		};
	},
};

/**
 * listCustomersTool const.
 *
 * @example
 * ```ts
 * console.log(listCustomersTool);
 * ```
 */
export const listCustomersTool: AgentTool = {
	name: "list_customers",
	description: "Lista los clientes registrados de la empresa.",
	inputSchema: z.object({ search: z.string().optional() }),
	outputSchema: z.object({
		customers: z.array(
			z.object({ id: z.string(), legalName: z.string(), taxId: z.string() }),
		),
	}),
	approvalLevel: "auto",
	async execute(_input: unknown, context: AgentContext) {
		const { ListCustomersQuery } = await import("../../customers");
		const q = new ListCustomersQuery();
		const customers = await q.execute({
			companyId: context.companyId,
		});
		const rows = Array.isArray(customers) ? customers : [];
		return {
			customers: rows.map((c) => ({
				id: (
					c as {
						id: string;
						legalName?: string;
						businessName?: string;
						taxId?: string;
						ruc?: string;
					}
				).id,
				legalName:
					(c as { legalName?: string; businessName?: string }).legalName ??
					(c as { businessName?: string }).businessName,
				taxId:
					(c as { taxId?: string; ruc?: string }).taxId ??
					(c as { ruc?: string }).ruc,
			})),
		};
	},
};

/**
 * createVendorTool const.
 *
 * @example
 * ```ts
 * console.log(createVendorTool);
 * ```
 */
export const createVendorTool: AgentTool = {
	name: "create_vendor",
	description: "Crea un nuevo proveedor en el sistema.",
	inputSchema: z.object({
		legalName: z.string().min(2),
		taxId: z.string().length(11),
		email: z.string().email().optional(),
		phone: z.string().optional(),
		address: z.string().optional(),
	}),
	outputSchema: z.object({
		id: z.string(),
		legalName: z.string(),
		taxId: z.string(),
	}),
	approvalLevel: "auto",
	async execute(input: unknown, context: AgentContext) {
		const inp = input as { legalName: string; taxId: string; email?: string };
		const { createVendor } = await import("../../vendors");
		const vendor = await createVendor({
			companyId: context.companyId,
			legalName: inp.legalName,
			taxId: inp.taxId,
			email: inp.email,
		});
		return { id: vendor.id, legalName: vendor.legalName, taxId: vendor.taxId };
	},
};

/**
 * checkStockTool const.
 *
 * @example
 * ```ts
 * console.log(checkStockTool);
 * ```
 */
export const checkStockTool: AgentTool = {
	name: "check_stock",
	description: "Consulta el stock actual de un producto en el inventario.",
	inputSchema: z.object({
		productId: z.string().optional(),
		warehouseId: z.string().optional(),
	}),
	outputSchema: z.object({ items: z.array(z.any()) }),
	approvalLevel: "auto",
	async execute(input: unknown, context: AgentContext) {
		const inp = input as { productId?: string; warehouseId?: string };
		const { InventoryService } = await import(
			"../../inventory/inventory.service"
		);
		if (inp.productId) {
			const result = await InventoryService.getByProduct(
				inp.productId,
				inp.warehouseId,
			);
			return { items: Array.isArray(result) ? result : [result] };
		}
		const result = await InventoryService.list(context.companyId);
		return { items: Array.isArray(result) ? result : [] };
	},
};

/**
 * createProductTool const.
 *
 * @example
 * ```ts
 * console.log(createProductTool);
 * ```
 */
export const createProductTool: AgentTool = {
	name: "create_product",
	description: "Crea un nuevo producto en el catálogo.",
	inputSchema: z.object({
		name: z.string().min(2),
		sku: z.string().min(1),
		unitPrice: z.number().min(0),
		category: z.string().optional(),
	}),
	outputSchema: z.object({ id: z.string(), name: z.string(), sku: z.string() }),
	approvalLevel: "auto",
	async execute(input: unknown, context: AgentContext) {
		const inp = input as {
			name: string;
			sku: string;
			unitPrice: number;
			category?: string;
		};
		const { ProductsService } = await import("../../products/products.service");
		const product = await ProductsService.create({
			companyId: context.companyId,
			name: inp.name,
			sku: inp.sku,
			unitPrice: String(inp.unitPrice),
			category: inp.category,
		});
		return { id: product.id, name: product.name, sku: String(product.sku) };
	},
};

/**
 * listProductsTool const.
 *
 * @example
 * ```ts
 * console.log(listProductsTool);
 * ```
 */
export const listProductsTool: AgentTool = {
	name: "list_products",
	description: "Lista los productos del catálogo.",
	inputSchema: z.object({ search: z.string().optional() }),
	outputSchema: z.object({
		products: z.array(
			z.object({ id: z.string(), name: z.string(), sku: z.string() }),
		),
	}),
	approvalLevel: "auto",
	async execute(_input: unknown, context: AgentContext) {
		const { ProductsService } = await import("../../products/products.service");
		const products = await ProductsService.list(context.companyId);
		const rows = Array.isArray(products) ? products : [];
		return {
			products: rows.map((p) => ({
				id: (p as { id: string }).id,
				name: (p as { name: string }).name,
				sku: (p as { sku: string }).sku,
			})),
		};
	},
};

/**
 * operationsTools const.
 *
 * @example
 * ```ts
 * console.log(operationsTools);
 * ```
 */
export const operationsTools: AgentTool[] = [
	createCustomerTool,
	listCustomersTool,
	createVendorTool,
	checkStockTool,
	createProductTool,
	listProductsTool,
];
