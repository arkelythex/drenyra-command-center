import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function getConnectionString() {
	const url = process.env.DATABASE_URL;
	if (url && !url.startsWith("$")) return url;
	const isTest =
		process.env.VITEST === "true" || process.env.NODE_ENV === "test";
	if (isTest) {
		console.warn("⚠️ [DB Client] Using mock DATABASE_URL for tests");
		return "postgresql://mock:mock@localhost:5432/mock";
	}
	if (process.env.NEXT_PHASE === "phase-production-build") {
		console.warn(
			"⚠️ [DB Client] Using mock DATABASE_URL for build (static analysis)",
		);
		return "postgresql://mock:mock@localhost:5432/mock";
	}
	throw new Error("DATABASE_URL environment variable is required");
}
const connectionString = getConnectionString();
if (!(process.env.VITEST === "true" || process.env.NODE_ENV === "test")) {
	console.log(
		"📡 [DB Client] Connection String:",
		connectionString.replace(/:[^:@]+@/, ":****@"),
	);
}
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
export { client };

