import { extractOkData, unwrap } from "@/lib/api-helpers";
import { inventoryTreatyClient } from "./inventory-treaty-client";

export interface InventoryListFilters {
	companyId: string;
	warehouseId?: string;
}

export interface InventoryMovementPayload {
	productId: string;
	type: "IN" | "OUT" | "TRANSFER";
	quantity: number;
	unitCost?: number;
	sourceWarehouseId?: string;
	targetWarehouseId?: string;
	reference?: string;
	notes?: string;
}

export interface InventoryKardexFilters {
	startDate?: string;
	endDate?: string;
}

export interface WarehousePayload {
	name: string;
	code?: string;
	address?: string;
	isPrimary?: boolean;
}

export const inventoryApi = {
	/**
	 * Listar stock actual por almacén
	 */
	list: async (filters: InventoryListFilters): Promise<unknown> => {
		const body = await unwrap(inventoryTreatyClient.get({ query: filters }));
		return extractOkData(body, "inventory.list");
	},

	/**
	 * Registrar un movimiento (Entrada/Salida/Transferencia)
	 */
	recordMovement: async (
		companyId: string,
		payload: InventoryMovementPayload,
	): Promise<unknown> => {
		const body = await unwrap(
			inventoryTreatyClient.movement.post(payload, {
				query: { companyId },
			}),
		);
		return extractOkData(body, "inventory.recordMovement");
	},

	/**
	 * Consultar Kardex SUNAT por producto
	 */
	getKardex: async (
		productId: string,
		filters: InventoryKardexFilters,
	): Promise<unknown> => {
		const body = await unwrap(
			inventoryTreatyClient.kardex({ productId }).get({
				query: filters,
			}),
		);
		return extractOkData(body, "inventory.getKardex");
	},

	/**
	 * Resumen de valoración y stock bajo
	 */
	getSummary: async (companyId: string): Promise<unknown> => {
		const body = await unwrap(
			inventoryTreatyClient.summary.get({ query: { companyId } }),
		);
		return extractOkData(body, "inventory.getSummary");
	},

	/**
	 * Gestión de Almacenes
	 */
	warehouses: {
		list: async (companyId: string): Promise<unknown> => {
			const body = await unwrap(
				inventoryTreatyClient.warehouses.get({ query: { companyId } }),
			);
			return extractOkData(body, "inventory.warehouses.list");
		},
		create: async (
			companyId: string,
			payload: WarehousePayload,
		): Promise<unknown> => {
			const body = await unwrap(
				inventoryTreatyClient.warehouses.post(payload, {
					query: { companyId },
				}),
			);
			return extractOkData(body, "inventory.warehouses.create");
		},
	},
};
