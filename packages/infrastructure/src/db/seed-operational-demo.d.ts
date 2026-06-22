import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@arkelythex/persistence/schema";
type SeedDb = PostgresJsDatabase<typeof schema>;
export declare function seedOperationalDemoData(db: SeedDb, input: {
    companyId: string;
}): Promise<{
    monthsSeeded: number;
    partnersSeeded: 6;
    productsSeeded: 4;
}>;
export {};
//# sourceMappingURL=seed-operational-demo.d.ts.map