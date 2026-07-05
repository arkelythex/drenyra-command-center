import { db } from "@drenyra/persistence/client";
import { and, desc, eq, gte, lte, sql } from "@drenyra/persistence/query";
import {
	inventory,
	inventoryMovements,
	products,
	warehouses,
} from "@drenyra/persistence/schema";

type ProductRow = typeof products.$inferSelect;
type WarehouseRow = typeof warehouses.$inferSelect;
type InventoryMovementRow = typeof inventoryMovements.$inferSelect;

export type InventoryMovementType = "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT";

export interface InventoryMovementInput {
	productId: string;
	warehouseId?: string;
	type: InventoryMovementType;
	quantity: number;
	unitCost?: number;
	reference?: string;
	referenceId?: string;
	referenceNumber?: string;
	notes?: string;
	reason?: string;
}

export interface WarehouseCreateInput {
	name: string;
	address?: string;
	isDefault?: boolean;
	description?: string;
}

export interface InventoryListRow {
	id: string;
	productId: string;
	warehouseId: string | null;
	quantity: string;
	minStock: string | null;
	maxStock: string | null;
	unitCost: string | null;
	totalValue: string | null;
	lastUpdated: Date | null;
	product: ProductRow | null;
	warehouse: WarehouseRow | null;
}

export interface InventoryByProductRow {
	id: string;
	productId: string;
	warehouseId: string | null;
	quantity: string;
	unitCost: string | null;
	totalValue: string | null;
	product: ProductRow | null;
}

export interface KardexRow {
	date: Date | null;
	type: string;
	reference: string | null;
	quantityIn: string;
	quantityOut: string;
	balance: string;
	unitCost: string;
	totalValue: string;
}

export interface InventorySummary {
	totalProducts: number;
	totalQuantity: string;
	totalValue: string;
	lowStockItems: number;
	warehouseCount: number;
}

const SCALE = 4;
const SCALE_FACTOR = BigInt(10 ** SCALE);

function parseScaledDecimal(value: string | number | null | undefined): bigint {
	if (value === null || value === undefined) return 0n;

	const raw = typeof value === "number" ? value.toFixed(SCALE) : value.trim();
	const match = raw.match(/^(-?)(\d+)(?:\.(\d+))?$/);

	if (!match) {
		throw new Error(`Invalid decimal value: ${String(value)}`);
	}

	const sign = match[1] === "-" ? -1n : 1n;
	const whole = BigInt(match[2]);
	const fractionRaw = match[3] ?? "";

	if (fractionRaw.length > SCALE) {
		throw new Error(`Invalid decimal scale for value: ${String(value)}`);
	}

	const fraction = BigInt(fractionRaw.padEnd(SCALE, "0") || "0");
	return sign * (whole * SCALE_FACTOR + fraction);
}

function formatScaledDecimal(value: bigint): string {
	const sign = value < 0n ? "-" : "";
	const abs = value < 0n ? -value : value;
	const whole = abs / SCALE_FACTOR;
	const fraction = abs % SCALE_FACTOR;
	return `${sign}${whole.toString()}.${fraction.toString().padStart(SCALE, "0")}`;
}

function multiplyScaledDecimals(a: bigint, b: bigint): bigint {
	const product = a * b;
	const shouldRoundUp =
		product >= 0n
			? product % SCALE_FACTOR >= SCALE_FACTOR / 2n
			: product % SCALE_FACTOR <= -(SCALE_FACTOR / 2n);
	const base = product / SCALE_FACTOR;
	if (!shouldRoundUp) return base;
	return product >= 0n ? base + 1n : base - 1n;
}

function divideScaledDecimals(dividend: bigint, divisor: bigint): bigint {
	if (divisor === 0n) {
		throw new Error("Division by zero");
	}

	const signedNumerator = dividend * SCALE_FACTOR;
	const quotient = signedNumerator / divisor;
	const remainder = signedNumerator % divisor;
	const absRemainder = remainder < 0n ? -remainder : remainder;
	const absDivisor = divisor < 0n ? -divisor : divisor;
	const shouldRoundUp = absRemainder * 2n >= absDivisor;

	if (!shouldRoundUp) return quotient;

	const sameSign =
		(dividend >= 0n && divisor > 0n) || (dividend < 0n && divisor < 0n);
	return sameSign ? quotient + 1n : quotient - 1n;
}

function buildInventoryScope(
	companyId: string,
	productId: string,
	warehouseId?: string,
) {
	if (warehouseId) {
		return and(
			eq(inventory.companyId, companyId),
			eq(inventory.productId, productId),
			eq(inventory.warehouseId, warehouseId),
		);
	}

	return and(
		eq(inventory.companyId, companyId),
		eq(inventory.productId, productId),
		sql`${inventory.warehouseId} IS NULL`,
	);
}

/**
 * Inventory application service (stock, kardex, warehouses).
 */
export class InventoryService {
	/**
	 * Lista inventario por empresa (y opcionalmente por almacén).
	 */
	static async list(
		companyId: string,
		warehouseId?: string,
	): Promise<InventoryListRow[]> {
		const conditions = warehouseId
			? and(
					eq(inventory.companyId, companyId),
					eq(inventory.warehouseId, warehouseId),
				)
			: eq(inventory.companyId, companyId);

		return await db
			.select({
				id: inventory.id,
				productId: inventory.productId,
				warehouseId: inventory.warehouseId,
				quantity: inventory.quantity,
				minStock: inventory.minStock,
				maxStock: inventory.maxStock,
				unitCost: inventory.unitCost,
				totalValue: inventory.totalValue,
				lastUpdated: inventory.lastUpdated,
				product: products,
				warehouse: warehouses,
			})
			.from(inventory)
			.leftJoin(products, eq(inventory.productId, products.id))
			.leftJoin(warehouses, eq(inventory.warehouseId, warehouses.id))
			.where(conditions)
			.orderBy(desc(inventory.quantity));
	}

	/**
	 * Obtiene inventario de un producto.
	 */
	static async getByProduct(
		productId: string,
		warehouseId?: string,
	): Promise<InventoryByProductRow | null> {
		const conditions = warehouseId
			? and(
					eq(inventory.productId, productId),
					eq(inventory.warehouseId, warehouseId),
				)
			: eq(inventory.productId, productId);

		const items = await db
			.select({
				id: inventory.id,
				productId: inventory.productId,
				warehouseId: inventory.warehouseId,
				quantity: inventory.quantity,
				unitCost: inventory.unitCost,
				totalValue: inventory.totalValue,
				product: products,
			})
			.from(inventory)
			.leftJoin(products, eq(inventory.productId, products.id))
			.where(conditions)
			.limit(1);

		return items[0] || null;
	}

	/**
	 * Registra movimiento y actualiza balance de inventario en una sola transacción.
	 */
	static async recordMovement(
		companyId: string,
		data: InventoryMovementInput,
	): Promise<InventoryMovementRow> {
		const { productId, warehouseId, type, quantity, unitCost } = data;

		return await db.transaction(async (tx) => {
			const quantityScaled = parseScaledDecimal(quantity);
			const unitCostScaled =
				unitCost !== undefined ? parseScaledDecimal(unitCost) : undefined;
			const totalCostScaled =
				unitCostScaled !== undefined
					? multiplyScaledDecimals(quantityScaled, unitCostScaled)
					: undefined;

			const [movement] = await tx
				.insert(inventoryMovements)
				.values({
					companyId,
					productId,
					warehouseId,
					type,
					quantity: formatScaledDecimal(quantityScaled),
					unitCost:
						unitCostScaled !== undefined
							? formatScaledDecimal(unitCostScaled)
							: undefined,
					totalCost:
						totalCostScaled !== undefined
							? formatScaledDecimal(totalCostScaled)
							: undefined,
					reference: data.reference,
					referenceId: data.referenceId,
					referenceNumber: data.referenceNumber,
					notes: data.notes,
					reason: data.reason,
					createdAt: new Date(),
				})
				.returning();

			if (!movement) {
				throw new Error("No se pudo registrar el movimiento");
			}

			const scope = buildInventoryScope(companyId, productId, warehouseId);
			const currentRows = await tx
				.select({
					id: inventory.id,
					quantity: inventory.quantity,
					unitCost: inventory.unitCost,
				})
				.from(inventory)
				.where(scope)
				.limit(1);
			const current = currentRows[0];

			const currentQtyScaled = parseScaledDecimal(current?.quantity);
			const currentCostScaled = parseScaledDecimal(current?.unitCost);

			let newQuantityScaled = currentQtyScaled;
			if (type === "IN" || type === "TRANSFER")
				newQuantityScaled += quantityScaled;
			else if (type === "OUT") newQuantityScaled -= quantityScaled;
			else if (type === "ADJUSTMENT") newQuantityScaled = quantityScaled;

			if (newQuantityScaled < 0n) {
				throw new Error("Insufficient stock for movement");
			}

			let newUnitCostScaled = currentCostScaled;
			if (type === "IN" && unitCostScaled !== undefined) {
				const existingValue = multiplyScaledDecimals(
					currentQtyScaled,
					currentCostScaled,
				);
				const incomingValue = multiplyScaledDecimals(
					quantityScaled,
					unitCostScaled,
				);
				const weightedValue = existingValue + incomingValue;
				newUnitCostScaled =
					newQuantityScaled > 0n
						? divideScaledDecimals(weightedValue, newQuantityScaled)
						: unitCostScaled;
			} else if (type === "ADJUSTMENT" && unitCostScaled !== undefined) {
				newUnitCostScaled = unitCostScaled;
			}

			const totalValueScaled = multiplyScaledDecimals(
				newQuantityScaled,
				newUnitCostScaled,
			);

			if (current) {
				await tx
					.update(inventory)
					.set({
						quantity: formatScaledDecimal(newQuantityScaled),
						unitCost: formatScaledDecimal(newUnitCostScaled),
						totalValue: formatScaledDecimal(totalValueScaled),
						lastUpdated: new Date(),
					})
					.where(eq(inventory.id, current.id));
			} else {
				await tx.insert(inventory).values({
					companyId,
					productId,
					warehouseId,
					quantity: formatScaledDecimal(newQuantityScaled),
					unitCost: formatScaledDecimal(unitCostScaled || 0n),
					totalValue: formatScaledDecimal(totalValueScaled),
					lastUpdated: new Date(),
				});
			}

			return movement;
		});
	}

	/**
	 * Devuelve kardex de movimientos de un producto.
	 */
	static async getKardex(
		companyId: string,
		productId: string,
		startDate?: Date,
		endDate?: Date,
	): Promise<KardexRow[]> {
		const conditions = [
			eq(inventoryMovements.productId, productId),
			eq(inventoryMovements.companyId, companyId),
		];
		if (startDate)
			conditions.push(gte(inventoryMovements.createdAt, startDate));
		if (endDate) conditions.push(lte(inventoryMovements.createdAt, endDate));

		const movements = await db.query.inventoryMovements.findMany({
			where: and(...conditions),
			orderBy: [inventoryMovements.createdAt],
		});

		let balanceScaled = 0n;
		return movements.map((movement) => {
			const quantityScaled = parseScaledDecimal(movement.quantity);
			const unitCostScaled = parseScaledDecimal(movement.unitCost);
			let quantityIn = "0";
			let quantityOut = "0";

			if (movement.type === "IN" || movement.type === "TRANSFER") {
				quantityIn = formatScaledDecimal(quantityScaled);
				balanceScaled += quantityScaled;
			} else if (movement.type === "OUT") {
				quantityOut = formatScaledDecimal(quantityScaled);
				balanceScaled -= quantityScaled;
			} else if (movement.type === "ADJUSTMENT") {
				balanceScaled = quantityScaled;
			}

			return {
				date: movement.createdAt,
				type: movement.type,
				reference: movement.referenceNumber || movement.reference,
				quantityIn,
				quantityOut,
				balance: formatScaledDecimal(balanceScaled),
				unitCost: formatScaledDecimal(unitCostScaled),
				totalValue: formatScaledDecimal(
					multiplyScaledDecimals(balanceScaled, unitCostScaled),
				),
			};
		});
	}

	/**
	 * Resumen agregado de inventario por empresa.
	 */
	static async getSummary(companyId: string): Promise<InventorySummary> {
		const items = await db
			.select()
			.from(inventory)
			.where(eq(inventory.companyId, companyId));

		return {
			totalProducts: items.length,
			totalQuantity: formatScaledDecimal(
				items.reduce(
					(sum, item) => sum + parseScaledDecimal(item.quantity),
					0n,
				),
			),
			totalValue: formatScaledDecimal(
				items.reduce(
					(sum, item) => sum + parseScaledDecimal(item.totalValue),
					0n,
				),
			),
			lowStockItems: items.filter((item) => {
				if (!item.minStock) return false;
				return (
					parseScaledDecimal(item.quantity) < parseScaledDecimal(item.minStock)
				);
			}).length,
			warehouseCount:
				(
					await db
						.select({ count: sql<number>`COUNT(DISTINCT ${warehouses.id})` })
						.from(warehouses)
						.where(eq(warehouses.companyId, companyId))
				)[0]?.count || 0,
		};
	}

	/**
	 * Lista almacenes por empresa.
	 */
	static async listWarehouses(companyId: string): Promise<WarehouseRow[]> {
		return await db
			.select()
			.from(warehouses)
			.where(eq(warehouses.companyId, companyId))
			.orderBy(desc(warehouses.isDefault), warehouses.name);
	}

	/**
	 * Crea almacén.
	 */
	static async createWarehouse(
		companyId: string,
		data: WarehouseCreateInput,
	): Promise<WarehouseRow> {
		const [warehouse] = await db
			.insert(warehouses)
			.values({
				companyId,
				...data,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		if (!warehouse) {
			throw new Error("No se pudo crear el almacén");
		}

		return warehouse;
	}
}
