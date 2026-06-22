import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@arkelythex/persistence/schema";
import { ensureDemoSeedContext } from "./seed-demo-context";
import { seedOperationalDemoData } from "./seed-operational-demo";

const connectionString =
	process.env.DATABASE_URL || "postgresql://user:password@localhost:5436/arkelythex";

const client = postgres(connectionString);
const db = drizzle(client, { schema });

/**
 * seedDashboardDemoDatabase operation.
 *
 * @returns Result of seedDashboardDemoDatabase.
 * @example
 * ```ts
 * const result = await seedDashboardDemoDatabase();
 * console.log(result);
 * ```
 */
export async function seedDashboardDemoDatabase() {
	console.log("🌱 Seeding dashboard demo data...");
	console.log(
		"📡 Database URL:",
		connectionString.replace(/:[^:@]+@/, ":****@"),
	);

	const { companyId } = await ensureDemoSeedContext(db);
	const operationalDemo = await seedOperationalDemoData(db, { companyId });

	console.log("✅ Dashboard demo ready");
	console.log(`   - Company ID: ${companyId}`);
	console.log(`   - Months seeded: ${operationalDemo.monthsSeeded}`);
	console.log(`   - Partners seeded: ${operationalDemo.partnersSeeded}`);
	console.log(`   - Products seeded: ${operationalDemo.productsSeeded}`);
}

if (import.meta.main) {
	const shouldExitProcess =
		process.env.VITEST !== "true" && process.env.NODE_ENV !== "test";

	seedDashboardDemoDatabase()
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
