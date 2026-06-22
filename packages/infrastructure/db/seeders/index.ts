/**
 * Database Seeders
 * Realistic seed data for demo/development
 */

import { Money } from "@arkelythex/domain";
import {
	bills,
	companies,
	customers,
	db,
	invoiceItems,
	invoices,
	payments,
	products,
	vendors,
} from "@arkelythex/infrastructure";

export class DatabaseSeeder {
	/**
	 * Run all seeders
	 */
	static async run() {
		console.log("🌱 Starting database seeding...");

		try {
			await DatabaseSeeder.seedCompanies();
			await DatabaseSeeder.seedCustomers();
			await DatabaseSeeder.seedVendors();
			await DatabaseSeeder.seedProducts();
			await DatabaseSeeder.seedInvoices();
			await DatabaseSeeder.seedBills();
			await DatabaseSeeder.seedPayments();

			console.log("✅ Database seeding completed!");
		} catch (error) {
			console.error("❌ Seeding failed:", error);
			throw error;
		}
	}

	/**
	 * Seed companies
	 */
	static async seedCompanies() {
		console.log("📦 Seeding companies...");

		const company = await db
			.insert(companies)
			.values({
				id: "00000000-0000-0000-0000-000000000001",
				legalName: "ARKELYTHEX PERU SAC",
				taxId: "20123456789",
				email: "contacto@arkelythexfounders.com",
				sunatCondition: "ACTIVO",
				complianceScore: 95,
			})
			.returning();

		console.log(`✓ Created company: ${company[0].legalName}`);
	}

	/**
	 * Seed customers
	 */
	static async seedCustomers() {
		console.log("👥 Seeding customers...");

		const customersData = [
			{
				companyId: "00000000-0000-0000-0000-000000000001",
				legalName: "CORPORACION WONG SA",
				taxId: "20100070970",
				email: "compras@wong.pe",
				sunatCondition: "ACTIVO",
			},
			{
				companyId: "00000000-0000-0000-0000-000000000001",
				legalName: "SUPERMERCADOS PERUANOS SA",
				taxId: "20100128056",
				email: "proveedores@spsa.pe",
				sunatCondition: "ACTIVO",
			},
			{
				companyId: "00000000-0000-0000-0000-000000000001",
				legalName: "GLORIA SA",
				taxId: "20100190797",
				email: "logistica@gloria.com.pe",
				sunatCondition: "ACTIVO",
			},
			{
				companyId: "00000000-0000-0000-0000-000000000001",
				legalName: "BACKUS Y JOHNSTON SAA",
				taxId: "20100113610",
				email: "compras@backus.sabmiller.com",
				sunatCondition: "ACTIVO",
			},
			{
				companyId: "00000000-0000-0000-0000-000000000001",
				legalName: "ALICORP SAA",
				taxId: "20100055237",
				email: "proveedores@alicorp.com.pe",
				sunatCondition: "ACTIVO",
			},
		];

		await db.insert(customers).values(customersData);
		console.log(`✓ Created ${customersData.length} customers`);
	}

	/**
	 * Seed vendors
	 */
	static async seedVendors() {
		console.log("🏭 Seeding vendors...");

		const vendorsData = [
			{
				companyId: "00000000-0000-0000-0000-000000000001",
				legalName: "TECNOLOGIA Y SERVICIOS SAC",
				taxId: "20987654321",
				email: "ventas@tecnoserv.pe",
			},
			{
				companyId: "00000000-0000-0000-0000-000000000001",
				legalName: "DISTRIBUIDORA LIMA SRL",
				taxId: "20876543210",
				email: "contacto@distrilima.pe",
			},
		];

		await db.insert(vendors).values(vendorsData);
		console.log(`✓ Created ${vendorsData.length} vendors`);
	}

	/**
	 * Seed products
	 */
	static async seedProducts() {
		console.log("📦 Seeding products...");

		const productsData = [
			{
				companyId: "00000000-0000-0000-0000-000000000001",
				name: "Servicio de Consultoría Empresarial",
				sku: "CONS-001",
				description: "Consultoría estratégica y optimización de procesos",
				unit: "HORA",
				unitPrice: "250.00",
				currency: "PEN" as const,
			},
			{
				companyId: "00000000-0000-0000-0000-000000000001",
				name: "Desarrollo de Software a Medida",
				sku: "DEV-001",
				description: "Desarrollo de aplicaciones web y móviles",
				unit: "HORA",
				unitPrice: "180.00",
				currency: "PEN" as const,
			},
			{
				companyId: "00000000-0000-0000-0000-000000000001",
				name: "Soporte Técnico Mensual",
				sku: "SUPP-001",
				description: "Soporte técnico 24/7",
				unit: "MES",
				unitPrice: "1500.00",
				currency: "PEN" as const,
			},
			{
				companyId: "00000000-0000-0000-0000-000000000001",
				name: "Licencia Software ERP",
				sku: "LIC-ERP-001",
				description: "Licencia anual ERP empresarial",
				unit: "UNIDAD",
				unitPrice: "12000.00",
				currency: "PEN" as const,
			},
			{
				companyId: "00000000-0000-0000-0000-000000000001",
				name: "Capacitación Corporativa",
				sku: "TRAIN-001",
				description: "Capacitación en tecnologías empresariales",
				unit: "DIA",
				unitPrice: "2500.00",
				currency: "PEN" as const,
			},
		];

		await db.insert(products).values(productsData);
		console.log(`✓ Created ${productsData.length} products`);
	}

	/**
	 * Seed invoices
	 */
	static async seedInvoices() {
		console.log("🧾 Seeding invoices...");

		// Get customers and products
		const customersList = await db.select().from(customers).limit(5);
		const productsList = await db.select().from(products).limit(5);

		const invoicesData = [];
		const invoiceItemsData = [];

		// Create 20 invoices
		for (let i = 1; i <= 20; i++) {
			const customer = customersList[i % customersList.length];
			const product = productsList[i % productsList.length];

			const quantity = Math.floor(Math.random() * 10) + 1;
			const unitPrice = Money.fromAmount(product.unitPrice, "PEN");
			const subtotal = unitPrice.multiply(quantity);
			const igv = subtotal.multiply(0.18);
			const total = subtotal.add(igv);

			const issueDate = new Date(2026, 0, i); // January 2026
			const dueDate = new Date(2026, 0, i + 30);

			const invoiceId = `invoice-${i.toString().padStart(3, "0")}`;

			invoicesData.push({
				id: invoiceId,
				companyId: "00000000-0000-0000-0000-000000000001",
				customerId: customer.id,
				series: "F001",
				invoiceNumber: `F001-${i.toString().padStart(8, "0")}`,
				issueDate,
				dueDate,
				currency: "PEN" as const,
				exchangeRate: "1.00",
				subtotal: subtotal.toString(),
				igvAmount: igv.toString(),
				totalAmount: total.toString(),
				status: i <= 15 ? "PAID" : i <= 18 ? "SENT" : "OVERDUE",
				sunatStatus: i <= 15 ? "ACCEPTED" : null,
			});

			invoiceItemsData.push({
				invoiceId,
				productId: product.id,
				description: product.name,
				quantity: quantity.toString(),
				unitPrice: product.unitPrice,
				subtotal: subtotal.toString(),
				igv: igv.toString(),
				total: total.toString(),
			});
		}

		await db.insert(invoices).values(invoicesData);
		await db.insert(invoiceItems).values(invoiceItemsData);

		console.log(`✓ Created ${invoicesData.length} invoices with items`);
	}

	/**
	 * Seed bills
	 */
	static async seedBills() {
		console.log("📄 Seeding bills...");

		const vendorsList = await db.select().from(vendors).limit(2);

		const billsData = [];

		for (let i = 1; i <= 10; i++) {
			const vendor = vendorsList[i % vendorsList.length];

			const subtotal = new Money(
				Math.floor(Math.random() * 5000) + 1000,
				"PEN",
			);
			const igv = subtotal.multiply(0.18);
			const total = subtotal.add(igv);

			const issueDate = new Date(2026, 0, i);
			const dueDate = new Date(2026, 0, i + 30);

			billsData.push({
				companyId: "00000000-0000-0000-0000-000000000001",
				vendorId: vendor.id,
				billNumber: `B001-${i.toString().padStart(8, "0")}`,
				issueDate,
				dueDate,
				currency: "PEN" as const,
				subtotal: subtotal.toString(),
				igv: igv.toString(),
				totalAmount: total.toString(),
				status: i <= 7 ? "PAID" : "PENDING",
			});
		}

		await db.insert(bills).values(billsData);
		console.log(`✓ Created ${billsData.length} bills`);
	}

	/**
	 * Seed payments
	 */
	static async seedPayments() {
		console.log("💰 Seeding payments...");

		const paidInvoices = await db
			.select()
			.from(invoices)
			.where(eq(invoices.status, "PAID"))
			.limit(15);

		const paymentsData = paidInvoices.map((invoice, i) => ({
			companyId: "00000000-0000-0000-0000-000000000001",
			invoiceId: invoice.id,
			amount: invoice.totalAmount,
			paymentDate: new Date(2026, 0, i + 5),
			paymentMethod: i % 3 === 0 ? "TRANSFER" : i % 3 === 1 ? "CHECK" : "CASH",
			reference: `PAY-${(i + 1).toString().padStart(6, "0")}`,
		}));

		await db.insert(payments).values(paymentsData);
		console.log(`✓ Created ${paymentsData.length} payments`);
	}
}

// Run seeders if executed directly
if (import.meta.main) {
	DatabaseSeeder.run()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}
