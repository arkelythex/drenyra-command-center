import { db } from "@drenyra/persistence/client";
import { Elysia } from "elysia";
import { capabilitiesRoutes } from "./capabilities.routes";
import { createMissionsRoutes } from "./missions.routes";

export function createMissionsModule(database: any) {
	return new Elysia()
		.use(createMissionsRoutes(database))
		.use(capabilitiesRoutes);
}

// Mounted by app-core on the shared Postgres client. It used to receive
// `null`, so every mission call failed and answered 200 with success:false.
export const missionsModule = createMissionsModule(db);
