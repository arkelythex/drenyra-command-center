/**
 * createControlPlane — Factory for building a composed ControlPlane instance.
 *
 * Wires together ToolRegistry, AgentRegistry, PolicyEngine, evidence store,
 * and PermissionService (P5 granular permissions).
 *
 * The factory accepts an optional Drizzle client and config options.
 * PermissionService starts empty — PR #3 adds DB loading + migration.
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ToolRegistry } from "./tool-registry";
import { AgentRegistry } from "./agent-registry";
import { PolicyEngine } from "./policy-engine";
import {
	createInMemoryTraceEvidenceStore,
	createPostgresTraceEvidenceStore,
} from "./trace-evidence";
import type { TraceEvidenceStore } from "./trace-evidence";
import { PermissionService } from "../governance/permission-service";
import type { ControlPlane } from "./control-plane";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDb = PostgresJsDatabase<any>;

export interface ControlPlaneConfig {
	evidenceStore?: TraceEvidenceStore;
	/**
	 * When true, use a PostgreSQL-backed evidence store instead of the default
	 * in-memory store. The DB-backed store persists evidence across restarts.
	 *
	 * Note: `evidenceStore` takes precedence over this flag if both are set.
	 * For dual-write during migration, pass a composed store via `evidenceStore`.
	 */
	usePostgresEvidence?: boolean;
	/**
	 * Optional PermissionService instance for granular permission control (P5).
	 * If not provided, an empty PermissionService is created (no entries loaded).
	 * PR #3 will add DB-backed loading via load().
	 */
	permissionService?: PermissionService;
}

export function createControlPlane(
	db: DrizzleDb,
	config: ControlPlaneConfig = {},
): ControlPlane {
	const evidence =
		config.evidenceStore ??
		(config.usePostgresEvidence
			? createPostgresTraceEvidenceStore(db)
			: createInMemoryTraceEvidenceStore());
	const tools = new ToolRegistry(db);
	const agents = new AgentRegistry(db);
	const permissionService = config.permissionService ?? new PermissionService();
	const policy = new PolicyEngine(agents, tools, evidence, permissionService);

	return {
		policy,
		tools,
		agents,
		evidence,
		permissionService,
	};
}
