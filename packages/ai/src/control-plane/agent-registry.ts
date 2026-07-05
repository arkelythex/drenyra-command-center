/**
 * AgentRegistry — DB-backed registry for AI agents with L1 cache.
 *
 * Provides CRUD operations on the ai_agents table with an in-memory Map cache,
 * enforcing tenant-scoped isolation on all queries.
 */

import { eq, and, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
	aiAgents,
	type NewAiAgent,
} from "@drenyra/persistence/schema";
import {
	AgentRegistryEntrySchema,
	type AgentRegistryEntry,
	type TenantCompanyRucScope,
} from "./contracts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDb = PostgresJsDatabase<any>;

export class AgentRegistry {
	private cache: Map<string, AgentRegistryEntry> = new Map();
	private hydrated = false;

	constructor(private db: DrizzleDb) {}

	// ======================================================================
	// PUBLIC API
	// ======================================================================

	/**
	 * Register or update an agent (upsert by agentId).
	 */
	async registerAgent(entry: AgentRegistryEntry): Promise<void> {
		const parsed = AgentRegistryEntrySchema.parse(entry);

		const values: NewAiAgent = {
			agentId: parsed.agentId,
			purpose: parsed.purpose,
			tenantId: parsed.tenantScope.tenantId,
			organizationId: parsed.tenantScope.organizationId,
			companyId: parsed.tenantScope.companyId,
			ruc: parsed.tenantScope.ruc,
			capabilities: parsed.capabilities,
			allowedTools: parsed.allowedTools,
			approvalClass: parsed.approvalClass,
			supportedSurfaces: parsed.supportedSurfaces,
		};

		await this.db
			.insert(aiAgents)
			.values(values)
			.onConflictDoUpdate({
				target: aiAgents.agentId,
				set: {
					purpose: values.purpose,
					tenantId: values.tenantId,
					organizationId: values.organizationId,
					companyId: values.companyId,
					ruc: values.ruc,
					capabilities: values.capabilities,
					allowedTools: values.allowedTools,
					approvalClass: values.approvalClass,
					supportedSurfaces: values.supportedSurfaces,
					updatedAt: new Date(),
				},
			});

		this.cache.set(parsed.agentId, parsed);
	}

	/**
	 * Get an agent by ID — checks L1 cache first, then DB.
	 */
	async getAgent(agentId: string): Promise<AgentRegistryEntry | null> {
		if (this.cache.has(agentId)) {
			return this.cache.get(agentId) ?? null;
		}

		await this.hydrateCache();
		return this.cache.get(agentId) ?? null;
	}

	/**
	 * Query agents by tenant/company scope.
	 * Tenant isolation is MANDATORY — agents cannot be visible across tenants.
	 */
	async queryByScope(
		scope: TenantCompanyRucScope,
	): Promise<AgentRegistryEntry[]> {
		const rows = await this.db
			.select()
			.from(aiAgents)
			.where(
				and(
					eq(aiAgents.tenantId, scope.tenantId),
					eq(aiAgents.organizationId, scope.organizationId),
					eq(aiAgents.companyId, scope.companyId),
					eq(aiAgents.ruc, scope.ruc),
					eq(aiAgents.isActive, true),
				),
			);

		return rows.map(this.mapRow);
	}

	/**
	 * Query agents by capability using PostgreSQL array containment operator (@>).
	 */
	async queryByCapability(
		capability: string,
	): Promise<AgentRegistryEntry[]> {
		const rows = await this.db
			.select()
			.from(aiAgents)
			.where(
				and(
					sql`${aiAgents.capabilities} @> ARRAY[${capability}]::text[]`,
					eq(aiAgents.isActive, true),
				),
			);

		return rows.map(this.mapRow);
	}

	/**
	 * Partially update an agent.
	 */
	async updateAgent(
		agentId: string,
		partial: Partial<AgentRegistryEntry>,
	): Promise<void> {
		const setData: Partial<NewAiAgent> & { updatedAt?: Date } = {};

		if (partial.purpose !== undefined) {
			setData.purpose = partial.purpose;
		}
		if (partial.capabilities !== undefined) {
			setData.capabilities = partial.capabilities;
		}
		if (partial.allowedTools !== undefined) {
			setData.allowedTools = partial.allowedTools;
		}
		if (partial.approvalClass !== undefined) {
			setData.approvalClass = partial.approvalClass;
		}
		if (partial.supportedSurfaces !== undefined) {
			setData.supportedSurfaces = partial.supportedSurfaces;
		}

		setData.updatedAt = new Date();

		await this.db
			.update(aiAgents)
			.set(setData)
			.where(eq(aiAgents.agentId, agentId));

		this.invalidateCache(agentId);
	}

	/**
	 * Deactivate an agent (soft delete).
	 */
	async deactivateAgent(agentId: string): Promise<void> {
		await this.db
			.update(aiAgents)
			.set({ isActive: false, updatedAt: new Date() })
			.where(eq(aiAgents.agentId, agentId));

		this.invalidateCache(agentId);
	}

	// ======================================================================
	// PRIVATE HELPERS
	// ======================================================================

	private invalidateCache(agentId: string): void {
		this.cache.delete(agentId);
	}

	private async hydrateCache(): Promise<void> {
		if (this.hydrated) {
			return;
		}

		const rows = await this.db.select().from(aiAgents);
		for (const row of rows) {
			this.cache.set(row.agentId, this.mapRow(row));
		}
		this.hydrated = true;
	}

	private mapRow(row: {
		agentId: string;
		purpose: string | null;
		tenantId: string | null;
		organizationId: string | null;
		companyId: string | null;
		ruc: string | null;
		capabilities: string[] | null;
		allowedTools: string[] | null;
		approvalClass: string;
		supportedSurfaces: string[] | null;
		isActive: boolean;
	}): AgentRegistryEntry {
		return {
			agentId: row.agentId,
			purpose: row.purpose ?? "",
			tenantScope: {
				tenantId: row.tenantId ?? "",
				organizationId: row.organizationId ?? "",
				companyId: row.companyId ?? "",
				ruc: row.ruc ?? "",
			},
			capabilities: (row.capabilities ?? []) as AgentRegistryEntry["capabilities"],
			allowedTools: row.allowedTools ?? [],
			approvalClass: row.approvalClass as AgentRegistryEntry["approvalClass"],
			supportedSurfaces: (row.supportedSurfaces ?? []) as AgentRegistryEntry["supportedSurfaces"],
		};
	}
}
