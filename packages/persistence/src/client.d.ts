import postgres from "postgres";
import * as schema from "./schema";
declare const client: postgres.Sql<{}>;
export declare const db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
    $client: postgres.Sql<{}>;
};
export { client };
//# sourceMappingURL=client.d.ts.map