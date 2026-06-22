import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@arkelythex/persistence/schema";

type SeedDb = PostgresJsDatabase<typeof schema>;

const DEFAULT_VISIBLE_MONTHS = 6;
const IGV_RATE = 0.18;

const DEMO_PARTNERS = [
	{
		key: "customer_anchor",
		taxId: "20614567891",
		legalName: "DISTRIBUCIONES NEBULA RETAIL S.A.C.",
		email: "tesoreria@nebularetail.demo.pe",
	},
	{
		key: "customer_industrial",
		taxId: "20614567892",
		legalName: "CONSTRUCTORA COSTA VERDE INGENIERIA S.A.C.",
		email: "pagos@costaverde.demo.pe",
	},
	{
		key: "customer_food",
		taxId: "20614567893",
		legalName: "ALIMENTOS PACIFICO SUR S.A.C.",
		email: "facturacion@pacificosur.demo.pe",
	},
	{
		key: "vendor_fleet",
		taxId: "20614567901",
		legalName: "SERVICIOS DE FLOTA ANDINA S.A.C.",
		email: "cobranza@flotaandina.demo.pe",
	},
	{
		key: "vendor_energy",
		taxId: "20614567902",
		legalName: "ENERGIA Y SOPORTE LIMA CENTRO S.A.C.",
		email: "facturas@energialc.demo.pe",
	},
	{
		key: "vendor_software",
		taxId: "20614567903",
		legalName: "TECNOLOGIA OPERATIVA DEL PACIFICO S.A.C.",
		email: "cuentas@topacifico.demo.pe",
	},
] as const;

const DEMO_PRODUCTS = [
	{
		key: "route",
		sku: "LOG-001",
		name: "Servicio de distribucion urbana",
		unitPrice: 4200,
		costPrice: 2550,
		unit: "UND",
	},
	{
		key: "fleet",
		sku: "LOG-002",
		name: "Mantenimiento preventivo de flota",
		unitPrice: 1800,
		costPrice: 980,
		unit: "UND",
	},
	{
		key: "tms",
		sku: "LOG-003",
		name: "Licencia TMS mensual",
		unitPrice: 950,
		costPrice: 310,
		unit: "MES",
	},
	{
		key: "scanner",
		sku: "LOG-004",
		name: "Scanner handheld Zebra TC22",
		unitPrice: 1650,
		costPrice: 1190,
		unit: "UND",
	},
] as const;

function money(value: number): string {
	return value.toFixed(2);
}

function monthDate(baseDate: Date, monthOffset: number, day: number): Date {
	return new Date(
		baseDate.getFullYear(),
		baseDate.getMonth() + monthOffset,
		day,
		10,
		0,
		0,
		0,
	);
}

function totalsFromSubtotal(subtotal: number) {
	const igvAmount = Number((subtotal * IGV_RATE).toFixed(2));
	const totalAmount = Number((subtotal + igvAmount).toFixed(2));

	return {
		subtotal: money(subtotal),
		igvAmount: money(igvAmount),
		totalAmount: money(totalAmount),
	};
}

function buildInvoiceNumber(correlative: number) {
	return `F001-${String(correlative).padStart(8, "0")}`;
}

/**
 * seedOperationalDemoData operation.
 *
 * @param db - Input for db.
 * @param input - Input for input.
 * @returns Result of seedOperationalDemoData.
 * @example
 * ```ts
 * const result = await seedOperationalDemoData({} as SeedDb, {});
 * console.log(result);
 * ```
 */
export async function seedOperationalDemoData(
	db: SeedDb,
	input: { companyId: string },
) {
	const { companyId } = input;
	const now = new Date();

	await db.transaction(async (tx) => {
		await tx
			.delete(schema.bankTransactions)
			.where(eq(schema.bankTransactions.companyId, companyId));
		await tx
			.delete(schema.bankReconciliations)
			.where(eq(schema.bankReconciliations.companyId, companyId));
		await tx
			.delete(schema.bankAccounts)
			.where(eq(schema.bankAccounts.companyId, companyId));
		await tx
			.delete(schema.payments)
			.where(eq(schema.payments.companyId, companyId));
		await tx
			.delete(schema.transactions)
			.where(eq(schema.transactions.companyId, companyId));
		await tx
			.delete(schema.invoices)
			.where(eq(schema.invoices.companyId, companyId));
		await tx.delete(schema.bills).where(eq(schema.bills.companyId, companyId));
		await tx
			.delete(schema.inventoryMovements)
			.where(eq(schema.inventoryMovements.companyId, companyId));
		await tx
			.delete(schema.inventory)
			.where(eq(schema.inventory.companyId, companyId));
		await tx
			.delete(schema.warehouses)
			.where(eq(schema.warehouses.companyId, companyId));
		await tx
			.delete(schema.products)
			.where(eq(schema.products.companyId, companyId));
		await tx
			.delete(schema.businessPartners)
			.where(eq(schema.businessPartners.companyId, companyId));

		const partners = await tx
			.insert(schema.businessPartners)
			.values(
				DEMO_PARTNERS.map((partner) => ({
					companyId,
					taxId: partner.taxId,
					legalName: partner.legalName,
					email: partner.email,
					sunatCondition: "HABIDO",
					complianceScore: 96,
				})),
			)
			.returning();

		const partnerByKey = Object.fromEntries(
			DEMO_PARTNERS.map((partner, index) => [partner.key, partners[index]]),
		);

		const products = await tx
			.insert(schema.products)
			.values(
				DEMO_PRODUCTS.map((product) => ({
					companyId,
					sku: product.sku,
					name: product.name,
					description: `${product.name} para operacion demo del dashboard`,
					category: "Logistica",
					unitPrice: money(product.unitPrice),
					costPrice: money(product.costPrice),
					taxType: "GRAVADO" as const,
					unit: product.unit,
					stockQuantity: "24",
					minStock: "6",
					maxStock: "48",
					isActive: true,
				})),
			)
			.returning();

		const productByKey = Object.fromEntries(
			DEMO_PRODUCTS.map((product, index) => [product.key, products[index]]),
		);

		const warehouses = await tx
			.insert(schema.warehouses)
			.values([
				{
					companyId,
					name: "Centro Operativo San Isidro",
					code: "CO-001",
					address: "Av. Javier Prado Este 1021, San Isidro",
					city: "Lima",
					country: "PE",
					phone: "+51 1 555-0101",
					manager: "Lucia Alvarado",
					isActive: true,
					isDefault: true,
				},
				{
					companyId,
					name: "Hub Callao Ultima Milla",
					code: "CO-002",
					address: "Av. Argentina 2140, Callao",
					city: "Callao",
					country: "PE",
					phone: "+51 1 555-0102",
					manager: "Diego Paredes",
					isActive: true,
					isDefault: false,
				},
			])
			.returning();

		await tx.insert(schema.inventory).values(
			products.map((product) => ({
				companyId,
				productId: product.id,
				warehouseId: warehouses[0].id,
				quantity: product.stockQuantity ?? "0",
				minStock: product.minStock ?? "6",
				maxStock: product.maxStock ?? "48",
				unitCost: product.costPrice ?? "0",
				totalValue: money(
					Number(product.costPrice ?? "0") *
						Number(product.stockQuantity ?? "0"),
				),
			})),
		);

		await tx.insert(schema.inventoryMovements).values([
			{
				companyId,
				productId: productByKey.scanner.id,
				warehouseId: warehouses[0].id,
				type: "IN",
				quantity: "24",
				unitCost: "1190.00",
				totalCost: "28560.00",
				reference: "PURCHASE",
				referenceNumber: "PO-2026-DEMO-01",
				reason: "Carga inicial de stock demo",
				notes: "Seed deterministico para Neural Dashboard",
			},
			{
				companyId,
				productId: productByKey.scanner.id,
				warehouseId: warehouses[1].id,
				type: "OUT",
				quantity: "4",
				unitCost: "1190.00",
				totalCost: "4760.00",
				reference: "TRANSFER",
				referenceNumber: "TR-2026-DEMO-01",
				reason: "Redistribucion a hub de ultima milla",
				notes: "Movimiento interno para demo",
			},
		]);

		const invoiceBlueprints = [
			{
				correlative: 201,
				monthOffset: -5,
				day: 7,
				subtotal: 12200,
				status: "PAID",
				sunatStatus: "ACCEPTED",
				customerKey: "customer_anchor",
				productKey: "route",
			},
			{
				correlative: 202,
				monthOffset: -4,
				day: 9,
				subtotal: 14800,
				status: "PAID",
				sunatStatus: "ACCEPTED",
				customerKey: "customer_food",
				productKey: "route",
			},
			{
				correlative: 203,
				monthOffset: -3,
				day: 11,
				subtotal: 9800,
				status: "PAID",
				sunatStatus: "ACCEPTED",
				customerKey: "customer_industrial",
				productKey: "tms",
			},
			{
				correlative: 204,
				monthOffset: -2,
				day: 8,
				subtotal: 13200,
				status: "PAID",
				sunatStatus: "ACCEPTED",
				customerKey: "customer_anchor",
				productKey: "fleet",
			},
			{
				correlative: 205,
				monthOffset: -1,
				day: 14,
				subtotal: 16400,
				status: "SENT",
				sunatStatus: "ACCEPTED",
				customerKey: "customer_industrial",
				productKey: "route",
			},
			{
				correlative: 206,
				monthOffset: 0,
				day: 3,
				subtotal: 18400,
				status: "PAID",
				sunatStatus: "ACCEPTED",
				customerKey: "customer_anchor",
				productKey: "route",
			},
			{
				correlative: 207,
				monthOffset: 0,
				day: 9,
				subtotal: 9100,
				status: "SENT",
				sunatStatus: "SUBMITTED",
				customerKey: "customer_food",
				productKey: "tms",
			},
			{
				correlative: 208,
				monthOffset: 0,
				day: 15,
				subtotal: 7600,
				status: "OVERDUE",
				sunatStatus: "REJECTED",
				customerKey: "customer_industrial",
				productKey: "fleet",
			},
			{
				correlative: 209,
				monthOffset: 0,
				day: 21,
				subtotal: 5400,
				status: "DRAFT",
				sunatStatus: null,
				customerKey: "customer_anchor",
				productKey: "scanner",
			},
		] as const;

		const invoices = await tx
			.insert(schema.invoices)
			.values(
				invoiceBlueprints.map((invoice) => {
					const issueDate = monthDate(now, invoice.monthOffset, invoice.day);
					const totals = totalsFromSubtotal(invoice.subtotal);
					const isPaid = invoice.status === "PAID";

					return {
						companyId,
						customerId: partnerByKey[invoice.customerKey].id,
						invoiceNumber: buildInvoiceNumber(invoice.correlative),
						series: "F001",
						correlative: invoice.correlative,
						issueDate,
						dueDate: monthDate(now, invoice.monthOffset, invoice.day + 15),
						currency: "PEN" as const,
						exchangeRate: "1.0000",
						subtotal: totals.subtotal,
						igvAmount: totals.igvAmount,
						totalAmount: totals.totalAmount,
						status: invoice.status,
						sunatStatus: invoice.sunatStatus,
						paidAmount: isPaid ? totals.totalAmount : "0.00",
						balanceDue: isPaid ? "0.00" : totals.totalAmount,
						paidDate: isPaid
							? monthDate(now, invoice.monthOffset, invoice.day + 2)
							: null,
						sunatTicket:
							invoice.sunatStatus === "ACCEPTED"
								? `TKT-${invoice.correlative}`
								: null,
						notes: "Factura demo para dashboard operativo",
						tags: {
							source: "operational-demo",
							kind: "invoice",
						},
					};
				}),
			)
			.returning();

		await tx.insert(schema.invoiceItems).values(
			invoices.map((invoice, index) => {
				const blueprint = invoiceBlueprints[index];
				const product = productByKey[blueprint.productKey];
				const totals = totalsFromSubtotal(blueprint.subtotal);

				return {
					invoiceId: invoice.id,
					productId: product.id,
					description: product.name,
					quantity: "1.00",
					unitPrice: money(blueprint.subtotal),
					taxType: "GRAVADO" as const,
					igvRate: "18.00",
					subtotal: totals.subtotal,
					igvAmount: totals.igvAmount,
					totalAmount: totals.totalAmount,
				};
			}),
		);

		await tx.insert(schema.transactions).values(
			invoiceBlueprints.map((invoice) => {
				const issueDate = monthDate(now, invoice.monthOffset, invoice.day);
				const dueDate = monthDate(now, invoice.monthOffset, invoice.day + 15);
				const totals = totalsFromSubtotal(invoice.subtotal);
				type TransactionInsert = typeof schema.transactions.$inferInsert;
				const status: TransactionInsert["status"] =
					invoice.sunatStatus ?? "DRAFT";

				const transaction: TransactionInsert = {
					companyId,
					partnerId: partnerByKey[invoice.customerKey].id,
					type: "INCOME" as const,
					documentType: "FACTURA" as const,
					series: "F001",
					number: String(invoice.correlative).padStart(8, "0"),
					issueDate,
					dueDate,
					currency: "PEN" as const,
					exchangeRate: "1.000",
					subtotal: totals.subtotal,
					igvAmount: totals.igvAmount,
					totalAmount: totals.totalAmount,
					status,
					notes: "Transaccion demo derivada de factura operativa",
					tags: {
						source: "operational-demo",
						kind: "invoice-ledger",
					},
				};

				return transaction;
			}),
		);

		const billBlueprints = [
			{
				billNumber: "B001-00003011",
				monthOffset: -1,
				day: 6,
				subtotal: 6200,
				status: "PAID",
				vendorKey: "vendor_fleet",
				productKey: "fleet",
			},
			{
				billNumber: "B001-00003012",
				monthOffset: 0,
				day: 4,
				subtotal: 4100,
				status: "PAID",
				vendorKey: "vendor_energy",
				productKey: "scanner",
			},
			{
				billNumber: "B001-00003013",
				monthOffset: 0,
				day: 12,
				subtotal: 2800,
				status: "SENT",
				vendorKey: "vendor_software",
				productKey: "tms",
			},
			{
				billNumber: "B001-00003014",
				monthOffset: 0,
				day: 18,
				subtotal: 1900,
				status: "DRAFT",
				vendorKey: "vendor_energy",
				productKey: "fleet",
			},
		] as const;

		const bills = await tx
			.insert(schema.bills)
			.values(
				billBlueprints.map((bill) => {
					const issueDate = monthDate(now, bill.monthOffset, bill.day);
					const totals = totalsFromSubtotal(bill.subtotal);

					return {
						companyId,
						vendorId: partnerByKey[bill.vendorKey].id,
						billNumber: bill.billNumber,
						issueDate,
						dueDate: monthDate(now, bill.monthOffset, bill.day + 10),
						currency: "PEN" as const,
						exchangeRate: "1.0000",
						subtotalAmount: totals.subtotal,
						igvAmount: totals.igvAmount,
						totalAmount: totals.totalAmount,
						status: bill.status,
						notes: "Gasto demo para dashboard operativo",
					};
				}),
			)
			.returning();

		await tx.insert(schema.billItems).values(
			bills.map((bill, index) => {
				const blueprint = billBlueprints[index];
				const product = productByKey[blueprint.productKey];
				const totals = totalsFromSubtotal(blueprint.subtotal);

				return {
					billId: bill.id,
					productId: product.id,
					description: product.name,
					quantity: "1.00",
					unitPrice: totals.totalAmount,
					total: totals.totalAmount,
				};
			}),
		);

		const mainAccount = await tx
			.insert(schema.bankAccounts)
			.values({
				companyId,
				accountName: "Cuenta Operativa BCP",
				accountNumber: "191-84561234-0-18",
				accountType: "CHECKING",
				bankName: "BCP",
				bankCode: "002",
				branch: "San Isidro",
				currency: "PEN",
				currentBalance: "124580.40",
				availableBalance: "121380.40",
				isActive: true,
				isDefault: true,
			})
			.returning();

		await tx.insert(schema.bankAccounts).values({
			companyId,
			accountName: "Cuenta Recaudadora Interbank",
			accountNumber: "898-0023411120",
			accountType: "CHECKING",
			bankName: "Interbank",
			bankCode: "003",
			branch: "Miraflores",
			currency: "PEN",
			currentBalance: "28640.90",
			availableBalance: "28640.90",
			isActive: true,
			isDefault: false,
		});

		const primaryAccountId = mainAccount[0].id;
		let runningBalance = 92400.4;
		const bankTransactionBlueprints = [
			{
				monthOffset: -5,
				day: 8,
				type: "CREDIT",
				amount: 14396,
				description: "Cobro factura F001-00000201",
				invoiceIndex: 0,
			},
			{
				monthOffset: -4,
				day: 11,
				type: "CREDIT",
				amount: 17464,
				description: "Cobro factura F001-00000202",
				invoiceIndex: 1,
			},
			{
				monthOffset: -3,
				day: 12,
				type: "DEBIT",
				amount: 7316,
				description: "Pago proveedor mantenimiento",
				billIndex: 0,
			},
			{
				monthOffset: -2,
				day: 9,
				type: "CREDIT",
				amount: 15576,
				description: "Cobro factura F001-00000204",
				invoiceIndex: 3,
			},
			{
				monthOffset: -1,
				day: 15,
				type: "DEBIT",
				amount: 4838,
				description: "Pago energia operativa",
				billIndex: 1,
			},
			{
				monthOffset: 0,
				day: 5,
				type: "CREDIT",
				amount: 21712,
				description: "Cobro factura F001-00000206",
				invoiceIndex: 5,
			},
			{
				monthOffset: 0,
				day: 10,
				type: "DEBIT",
				amount: 3304,
				description: "Pago licencia TMS",
				billIndex: 2,
			},
			{
				monthOffset: 0,
				day: 20,
				type: "DEBIT",
				amount: 2750,
				description: "Pago combustible y peajes",
				billIndex: null,
			},
		] as const;

		await tx.insert(schema.bankTransactions).values(
			bankTransactionBlueprints.map((entry) => {
				runningBalance +=
					entry.type === "CREDIT" ? entry.amount : -entry.amount;
				const invoiceId =
					"invoiceIndex" in entry && entry.invoiceIndex !== null
						? invoices[entry.invoiceIndex].id
						: null;
				const billId =
					"billIndex" in entry && entry.billIndex !== null
						? bills[entry.billIndex].id
						: null;

				return {
					companyId,
					accountId: primaryAccountId,
					transactionDate: monthDate(now, entry.monthOffset, entry.day)
						.toISOString()
						.split("T")[0],
					description: entry.description,
					reference: `BTX-${entry.day}-${entry.type}`,
					type: entry.type,
					amount: money(entry.amount),
					balance: money(runningBalance),
					category: entry.type === "CREDIT" ? "COBRO" : "PAGO",
					tags: JSON.stringify(["demo", "dashboard", entry.type.toLowerCase()]),
					isReconciled: true,
					importedFrom: "MANUAL",
					invoiceId,
					billId,
				};
			}),
		);
	});

	return {
		monthsSeeded: DEFAULT_VISIBLE_MONTHS,
		partnersSeeded: DEMO_PARTNERS.length,
		productsSeeded: DEMO_PRODUCTS.length,
	};
}
