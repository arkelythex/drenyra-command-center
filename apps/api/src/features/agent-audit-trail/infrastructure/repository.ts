/**
 * Agent Decision Log Repository
 * Append-only persistence (immutable)
 */

import { db } from "@arkelythex/persistence/client";
import { and, desc, eq } from "@arkelythex/persistence/query";
import {
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import {
	AgentDecisionLog,
	AgentContext,
	DecisionData,
	HashChain,
} from "../domain";

const agentDecisionLogsTable = pgTable("agent_decision_logs", {
	id: text("id").primaryKey(),
	organizationId: integer("organization_id").notNull(),
	agentName: text("agent_name").notNull(),
	agentVersion: varchar("agent_version", { length: 20 }),
	decisionType: text("decision_type").notNull(),
	reasoning: text("reasoning"),
	inputs: jsonb("inputs").notNull(),
	outputs: jsonb("outputs").notNull(),
	hash: text("hash").notNull(),
	prevHash: text("prev_hash"),
	createdAt: timestamp("created_at").notNull(),
});

/**
 * GetTrailFilters interface.
 *
 * @example
 * ```ts
 * const value: GetTrailFilters = {} as GetTrailFilters;
 * console.log(value);
 * ```
 */
export interface GetTrailFilters {
	organizationId: number;
	agentName?: string;
	decisionType?: string;
	limit?: number;
}

/**
 * AgentDecisionLogRepository class.
 *
 * @example
 * ```ts
 * const value = new AgentDecisionLogRepository();
 * console.log(value);
 * ```
 */
export class AgentDecisionLogRepository {
	async save(log: AgentDecisionLog): Promise<void> {
		await db.insert(agentDecisionLogsTable).values(log.toDatabase());
	}

	async getLastHash(organizationId: number): Promise<string | null> {
		const [lastLog] = await db
			.select({ hash: agentDecisionLogsTable.hash })
			.from(agentDecisionLogsTable)
			.where(eq(agentDecisionLogsTable.organizationId, organizationId))
			.orderBy(desc(agentDecisionLogsTable.createdAt))
			.limit(1);

		return lastLog?.hash ?? null;
	}

	async getTrail(filters: GetTrailFilters): Promise<AgentDecisionLog[]> {
		const conditions = [
			eq(agentDecisionLogsTable.organizationId, filters.organizationId),
		];

		if (filters.agentName) {
			conditions.push(eq(agentDecisionLogsTable.agentName, filters.agentName));
		}

		if (filters.decisionType) {
			conditions.push(
				eq(agentDecisionLogsTable.decisionType, filters.decisionType),
			);
		}

		const rows = await db
			.select()
			.from(agentDecisionLogsTable)
			.where(and(...conditions))
			.orderBy(desc(agentDecisionLogsTable.createdAt))
			.limit(filters.limit ?? 100);

		return rows.map((row) =>
			AgentDecisionLog.reconstitute({
				id: row.id,
				organizationId: row.organizationId,
				agentContext: AgentContext.create({
					name: row.agentName,
					version: row.agentVersion ?? undefined,
				}),
				decisionData: DecisionData.create({
					type: row.decisionType,
					inputs: row.inputs as Record<string, unknown>,
					outputs: row.outputs as Record<string, unknown>,
					reasoning: row.reasoning ?? undefined,
				}),
				hashChain: HashChain.create({
					hash: row.hash,
					prevHash: row.prevHash,
				}),
				createdAt: row.createdAt,
			}),
		);
	}
}
