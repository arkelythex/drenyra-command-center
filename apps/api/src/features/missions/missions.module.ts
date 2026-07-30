import { createMissionsRoutes } from "./missions.routes";

export function createMissionsModule(db: any) {
  return createMissionsRoutes(db);
}

// Default module using a placeholder — actual DB is injected at registration time
export const missionsModule = createMissionsRoutes(null as any);
