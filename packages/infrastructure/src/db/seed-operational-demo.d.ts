import * as schema from "@drenyra/persistence/schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

type SeedDb = PostgresJsDatabase<typeof schema>;
export declare function seedOperationalDemoData(
	db: SeedDb,
	input: {
		companyId: string;
	},
): Promise<{
	monthsSeeded: number;
	partnersSeeded: 6;
	productsSeeded: 4;
}>;
//# sourceMappingURL=seed-operational-demo.d.ts.map
