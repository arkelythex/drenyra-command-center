import { Elysia } from "elysia";
import { createMissionsRoutes } from "./missions.routes";
import { capabilitiesRoutes } from "./capabilities.routes";

export function createMissionsModule(db: any) {
	return new Elysia().use(createMissionsRoutes(db)).use(capabilitiesRoutes);
}

// Default module using a placeholder — actual DB is injected at registration time
export const missionsModule = new Elysia()
	.use(createMissionsRoutes(null as any))
	.use(capabilitiesRoutes);
