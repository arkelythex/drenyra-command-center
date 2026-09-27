import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { PermissionService } from "../governance/permission-service";
import type { ControlPlane } from "./control-plane";
import type { TraceEvidenceStore } from "./trace-evidence";
type DrizzleDb = PostgresJsDatabase<any>;
export interface ControlPlaneConfig {
    evidenceStore?: TraceEvidenceStore;
    usePostgresEvidence?: boolean;
    permissionService?: PermissionService;
}
export declare function createControlPlane(db: DrizzleDb, config?: ControlPlaneConfig): ControlPlane;
export {};
//# sourceMappingURL=factory.d.ts.map