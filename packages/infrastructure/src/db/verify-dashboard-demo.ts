import * as schema from "@drenyra/persistence/schema";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { DEMO_COMPANY_ID, DEMO_COMPANY_RUC } from "./seed-demo-context";

const connectionString =
	process.env.DATABASE_URL ||
	"postgresql://user:password@localhost:5436/drenyra";

const client = postgres(connectionString);
const db = drizzle(client, { schema });

const EXPECTED = {
	partners: 6,
	products: 4,
	invoices: 9,
	bills: 4,
	bankAccounts: 2,
	bankTransactions: 8,
	invoiceStatuses: {
		ACCEPTED: 6,
		SUBMITTED: 1,
		REJECTED: 1,
		NULL: 1,
	},
} as const;

async function countOf(table: { companyId: unknown }) {
	const [row] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(table as never)
		.where(eq(table.companyId as never, DEMO_COMPANY_ID));

	return row?.count ?? 0;
}

/**
 * verifyDashboardDemoDatabase operation.
 *
 * @returns Result of verifyDashboardDemoDatabase.
 * @example
 * ```ts
 * const result = await verifyDashboardDemoDatabase();
 * console.log(result);
 * ```
 */
export async function verifyDashboardDemoDatabase() {
	console.log("🔎 Verifying dashboard demo data...");
	console.log(
		"📡 Database URL:",
		connectionString.replace(/:[^:@]+@/, ":****@"),
	);

	const company = await db.query.companies.findFirst({
		where: eq(schema.companies.ruc, DEMO_COMPANY_RUC),
	});

	if (!company) {
		fail(`Company ${DEMO_COMPANY_RUC} not found`);
	}

	const [
		partners,
		products,
		invoices,
		bills,
		bankAccounts,
		bankTransactions,
		statusRows,
	] = await Promise.all([
		countOf(schema.businessPartners),
		countOf(schema.products),
		countOf(schema.invoices),
		countOf(schema.bills),
		countOf(schema.bankAccounts),
		countOf(schema.bankTransactions),
		db
			.select({
				status: sql<string>`coalesce(${schema.invoices.sunatStatus}::text, 'NULL')`,
				count: sql<number>`count(*)::int`,
			})
			.from(schema.invoices)
			.where(sql`${schema.invoices.companyId} = ${DEMO_COMPANY_ID}`)
			.groupBy(sql`coalesce(${schema.invoices.sunatStatus}::text, 'NULL')`),
	]);

	assertEqual("partners", partners, EXPECTED.partners);
	assertEqual("products", products, EXPECTED.products);
	assertEqual("invoices", invoices, EXPECTED.invoices);
	assertEqual("bills", bills, EXPECTED.bills);
	assertEqual("bank_accounts", bankAccounts, EXPECTED.bankAccounts);
	assertEqual("bank_transactions", bankTransactions, EXPECTED.bankTransactions);

	const statusMap = Object.fromEntries(
		statusRows.map((row) => [row.status, row.count]),
	) as Record<string, number>;

	for (const [status, expected] of Object.entries(EXPECTED.invoiceStatuses)) {
		assertEqual(`invoice_status:${status}`, statusMap[status] ?? 0, expected);
	}

	console.log("✅ Dashboard demo dataset verified.");
	console.log(
		JSON.stringify(
			{
				companyId: company.id,
				businessName: company.businessName,
				partners,
				products,
				invoices,
				bills,
				bankAccounts,
				bankTransactions,
				invoiceStatuses: statusMap,
			},
			null,
			2,
		),
	);
}

function assertEqual(label: string, actual: number, expected: number) {
	if (actual !== expected) {
		fail(`${label} mismatch: expected ${expected}, got ${actual}`);
	}
}

function fail(message: string): never {
	console.error(`Dashboard demo verification failed: ${message}`);
	process.exit(1);
}

if (import.meta.main) {
	const shouldExitProcess =
		process.env.VITEST !== "true" && process.env.NODE_ENV !== "test";

	verifyDashboardDemoDatabase()
		.then(async () => {
			await client.end();
			if (shouldExitProcess) {
				process.exit(0);
			}
		})
		.catch(async (error) => {
			console.error(error);
			await client.end();
			if (shouldExitProcess) {
				process.exit(1);
			}
		});
}
