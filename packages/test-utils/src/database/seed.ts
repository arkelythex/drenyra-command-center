/**
 * E2E Test Data Seeding Utilities
 *
 * Provides functions to seed test data for E2E and integration tests.
 * Supports seeding users, companies, products, and initial catalog data.
 */
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

/**
 * Seed data payload for E2E tests.
 */
export interface SeedData {
	users?: Array<{
		email: string;
		password: string;
		role: "admin" | "accountant" | "viewer";
		tenantId?: string;
	}>;
	companies?: Array<{
		name: string;
		ruc: string;
		subscriptionTier: "free" | "pro" | "enterprise";
	}>;
	products?: Array<{
		name: string;
		sku: string;
		price: number;
		currency?: string;
	}>;
	/** Raw SQL statements to execute for custom seeding. */
	rawSql?: string[];
}

/**
 * Seed the database with test data.
 *
 * @param db - Database instance (transaction-scoped recommended)
 * @param data - Seed data payload
 */
export async function seedTestData(
	db: PostgresJsDatabase,
	data: SeedData,
): Promise<void> {
	// Seed companies first (users reference companies)
	if (data.companies && data.companies.length > 0) {
		await seedCompanies(db, data.companies);
	}

	// Seed users
	if (data.users && data.users.length > 0) {
		await seedUsers(db, data.users);
	}

	// Seed products
	if (data.products && data.products.length > 0) {
		await seedProducts(db, data.products);
	}

	// Execute raw SQL if provided
	if (data.rawSql && data.rawSql.length > 0) {
		for (const sql of data.rawSql) {
			await db.execute(sql);
		}
	}
}

/**
 * Seed test companies.
 */
async function seedCompanies(
	db: PostgresJsDatabase,
	companies: SeedData["companies"],
): Promise<void> {
	if (!companies) return;

	for (const company of companies) {
		await db.execute(
			`INSERT INTO companies (name, ruc, subscription_tier, created_at)
       VALUES ('${company.name}', '${company.ruc}', '${company.subscriptionTier}', NOW())
       ON CONFLICT (ruc) DO NOTHING`,
		);
	}
}

/**
 * Seed test users.
 */
async function seedUsers(
	db: PostgresJsDatabase,
	users: SeedData["users"],
): Promise<void> {
	if (!users) return;

	for (const user of users) {
		await db.execute(
			`INSERT INTO users (email, password_hash, role, created_at)
       VALUES ('${user.email}', '${user.password}', '${user.role}', NOW())
       ON CONFLICT (email) DO NOTHING`,
		);
	}
}

/**
 * Seed test products.
 */
async function seedProducts(
	db: PostgresJsDatabase,
	products: SeedData["products"],
): Promise<void> {
	if (!products) return;

	for (const product of products) {
		const currency = product.currency || "PEN";
		const priceCents = Math.round(product.price * 100);

		await db.execute(
			`INSERT INTO products (name, sku, price_cents, currency, created_at)
       VALUES ('${product.name}', '${product.sku}', ${priceCents}, '${currency}', NOW())
       ON CONFLICT (sku) DO NOTHING`,
		);
	}
}

/**
 * Pre-built seed scenarios for common E2E test setups.
 */
export const seedScenarios = {
	/** Minimal setup: one admin user, one free-tier company. */
	minimal: {
		users: [
			{
				email: "admin@test.drenyrafounders.com",
				password: "hashed_test_password_123",
				role: "admin" as const,
			},
		],
		companies: [
			{
				name: "Test Company SAC",
				ruc: "20601234567",
				subscriptionTier: "free" as const,
			},
		],
	},

	/** Full setup: admin + accountant, pro-tier company, sample products. */
	full: {
		users: [
			{
				email: "admin@test.drenyrafounders.com",
				password: "hashed_test_password_123",
				role: "admin" as const,
			},
			{
				email: "accountant@test.drenyrafounders.com",
				password: "hashed_test_password_456",
				role: "accountant" as const,
			},
		],
		companies: [
			{
				name: "Test Company SAC",
				ruc: "20601234567",
				subscriptionTier: "pro" as const,
			},
		],
		products: [
			{
				name: "Producto de prueba",
				sku: "TEST-001",
				price: 100.0,
				currency: "PEN",
			},
			{
				name: "Servicio de prueba",
				sku: "TEST-002",
				price: 250.5,
				currency: "PEN",
			},
		],
	},

	/** Multi-tenant setup: two companies with different tiers. */
	multiTenant: {
		users: [
			{
				email: "admin-a@test.drenyrafounders.com",
				password: "hashed_test_password_a",
				role: "admin" as const,
			},
			{
				email: "admin-b@test.drenyrafounders.com",
				password: "hashed_test_password_b",
				role: "admin" as const,
			},
		],
		companies: [
			{
				name: "Tenant A SAC",
				ruc: "20601234567",
				subscriptionTier: "free" as const,
			},
			{
				name: "Tenant B SAC",
				ruc: "20609876543",
				subscriptionTier: "enterprise" as const,
			},
		],
	},
} as const;
