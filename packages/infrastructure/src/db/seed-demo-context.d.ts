import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@drenyra/persistence/schema";
type SeedDb = PostgresJsDatabase<typeof schema>;
export declare const ADMIN_USER_ID = "00000000-0000-0000-0000-000000000001";
export declare const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000001";
export declare const DEMO_COMPANY_RUC = "20608451231";
export interface DemoSeedContext {
    adminUserId: string;
    companyId: string;
}
export declare function ensureDemoSeedContext(db: SeedDb): Promise<DemoSeedContext>;
export {};
//# sourceMappingURL=seed-demo-context.d.ts.map