/**
 * ToolRegistry — DB-backed registry for AI tools with L1 cache.
 *
 * Provides CRUD operations on the ai_tools table with an in-memory Map cache
 * that is populated on first read and invalidated on mutations.
 */

import { aiTools, type NewAiTool } from "@drenyra/persistence/schema";
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { zodToolSchema } from "../tools/json-schema";
import {
	type RiskTier,
	type ToolDefinition,
	type ToolRegistration,
	ToolRegistrationSchema,
	type ToolScope,
} from "./contracts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDb = PostgresJsDatabase<any>;

export class ToolRegistry {
	private cache: Map<string, ToolDefinition> = new Map();
	private hydrated = false;

	constructor(private db: DrizzleDb) {}

	// ======================================================================
	// PUBLIC API
	// ======================================================================

	/**
	 * Register a new tool or update an existing one (upsert by name).
	 */
	async registerTool(def: ToolRegistration): Promise<ToolDefinition> {
		const parsed = ToolRegistrationSchema.parse(def);

		// Auto-convert Zod schema to JSON Schema if provided.
		// zodSchema takes precedence over raw inputSchema.
		let resolvedInputSchema: Record<string, unknown> | null = null;

		if (parsed.zodSchema !== undefined) {
			resolvedInputSchema = zodToolSchema(parsed.zodSchema) as Record<
				string,
				unknown
			>;
		} else if (parsed.inputSchema !== undefined) {
			resolvedInputSchema = parsed.inputSchema as Record<string, unknown>;
		}

		const values: NewAiTool = {
			name: parsed.name,
			description: parsed.description ?? null,
			riskTier: parsed.riskTier,
			inputSchema: resolvedInputSchema,
			outputSchema: (parsed.outputSchema as Record<string, unknown>) ?? null,
			requiresApproval: parsed.requiresApproval ?? false,
			fiscalImpact: parsed.fiscalImpact ?? false,
			approvalLevel: parsed.approvalLevel ?? "auto",
		};

		const [row] = await this.db
			.insert(aiTools)
			.values(values)
			.onConflictDoUpdate({
				target: aiTools.name,
				set: {
					description: values.description,
					riskTier: values.riskTier,
					inputSchema: values.inputSchema,
					outputSchema: values.outputSchema,
					requiresApproval: values.requiresApproval,
					fiscalImpact: values.fiscalImpact,
					approvalLevel: values.approvalLevel,
					updatedAt: new Date(),
				},
			})
			.returning();

		const tool = this.mapRow(row);
		this.cache.set(tool.name, tool);
		return tool;
	}

	/**
	 * Get a tool by name — checks L1 cache first, then DB.
	 */
	async getTool(name: string): Promise<ToolDefinition | null> {
		if (this.cache.has(name)) {
			return this.cache.get(name) ?? null;
		}

		await this.hydrateCache();
		return this.cache.get(name) ?? null;
	}

	/**
	 * List tools by risk tier.
	 */
	async listToolsByRiskTier(tier: RiskTier): Promise<ToolDefinition[]> {
		const rows = await this.db
			.select()
			.from(aiTools)
			.where(eq(aiTools.riskTier, tier));

		const tools = rows.map(this.mapRow);
		return tools;
	}

	/**
	 * List tools by scope (partial tenant scope).
	 *
	 * Note: ai_tools is a global table without tenant scope columns.
	 * This method currently returns all tools. Future enhancements may filter
	 * by metadata or add scope columns to the table.
	 */
	async listToolsByScope(_scope: ToolScope): Promise<ToolDefinition[]> {
		// Tools are global — return all. Expand if scope columns are added.
		return this.getAllTools();
	}

	/**
	 * Get all registered tools.
	 */
	async getAllTools(): Promise<ToolDefinition[]> {
		const rows = await this.db.select().from(aiTools);
		return rows.map(this.mapRow);
	}

	/**
	 * Partially update a tool by name.
	 */
	async updateTool(
		name: string,
		partial: Partial<ToolRegistration>,
	): Promise<void> {
		const setData: Partial<NewAiTool> & { updatedAt?: Date } = {};

		if (partial.description !== undefined) {
			setData.description = partial.description;
		}
		if (partial.riskTier !== undefined) {
			setData.riskTier = partial.riskTier;
		}
		if (partial.inputSchema !== undefined) {
			setData.inputSchema = partial.inputSchema as Record<string, unknown>;
		}
		if (partial.outputSchema !== undefined) {
			setData.outputSchema = partial.outputSchema as Record<string, unknown>;
		}
		if (partial.requiresApproval !== undefined) {
			setData.requiresApproval = partial.requiresApproval;
		}
		if (partial.fiscalImpact !== undefined) {
			setData.fiscalImpact = partial.fiscalImpact;
		}
		if (partial.approvalLevel !== undefined) {
			setData.approvalLevel = partial.approvalLevel;
		}

		setData.updatedAt = new Date();

		await this.db.update(aiTools).set(setData).where(eq(aiTools.name, name));

		this.invalidateCache(name);
	}

	/**
	 * Delete a tool by name.
	 */
	async deleteTool(name: string): Promise<void> {
		await this.db.delete(aiTools).where(eq(aiTools.name, name));
		this.invalidateCache(name);
	}

	// ======================================================================
	// PRIVATE HELPERS
	// ======================================================================

	private invalidateCache(name: string): void {
		this.cache.delete(name);
	}

	private async hydrateCache(): Promise<void> {
		if (this.hydrated) {
			return;
		}

		const rows = await this.db.select().from(aiTools);
		for (const row of rows) {
			this.cache.set(row.name, this.mapRow(row));
		}
		this.hydrated = true;
	}

	private mapRow(row: {
		id: number;
		name: string;
		description: string | null;
		riskTier: string;
		inputSchema: unknown;
		outputSchema: unknown;
		requiresApproval: boolean;
		fiscalImpact: boolean;
		approvalLevel: string | null;
		metadata: unknown;
		createdAt: Date;
		updatedAt: Date;
	}): ToolDefinition {
		return {
			id: row.id,
			name: row.name,
			description: row.description,
			riskTier: row.riskTier as RiskTier,
			inputSchema: row.inputSchema as
				| Record<string, unknown>
				| null
				| undefined,
			outputSchema: row.outputSchema as
				| Record<string, unknown>
				| null
				| undefined,
			requiresApproval: row.requiresApproval,
			fiscalImpact: row.fiscalImpact,
			approvalLevel: row.approvalLevel,
			metadata: row.metadata as Record<string, unknown> | null | undefined,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		};
	}
}
