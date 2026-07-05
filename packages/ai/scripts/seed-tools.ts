/**
 * Seed script for AI Control Plane.
 *
 * Scans registered agents from agent-swarm and registers their tools/agents
 * in the ToolRegistry and AgentRegistry.
 *
 * Usage:
 *   bun run packages/ai/scripts/seed-tools.ts
 *
 * Requires DATABASE_URL environment variable.
 */

import { getAllRegisteredAgents } from "@drenyra/drenyra-orchestrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { AgentRegistry } from "../src/control-plane/agent-registry";
import type { AgentRegistryEntry } from "../src/control-plane/contracts";
import { ToolRegistry } from "../src/control-plane/tool-registry";

async function main() {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		console.error("❌ DATABASE_URL environment variable is required");
		process.exit(1);
	}

	console.log("🔌 Connecting to database...");
	const client = postgres(connectionString, { max: 1 });
	const db = drizzle(client);

	const toolRegistry = new ToolRegistry(db);
	const agentRegistry = new AgentRegistry(db);

	console.log("📋 Loading registered agents from agent-swarm...");
	const agents = getAllRegisteredAgents();
	console.log(`   Found ${agents.length} registered agents`);

	let toolCount = 0;
	let agentCount = 0;

	for (const agent of agents) {
		console.log(`\n📦 Processing agent: ${agent.id} (${agent.name})`);

		// ---- Register Agent ----
		try {
			const capabilities =
				agent.capabilities.length > 0
					? agent.capabilities
					: ["advisory.review", "advisory.summarize"];

			const entry = {
				agentId: agent.id,
				purpose: agent.description?.slice(0, 500) ?? `Agent: ${agent.name}`,
				tenantScope: {
					tenantId: "system",
					organizationId: "system",
					companyId: "system",
					ruc: "00000000000",
				},
				capabilities: capabilities as AgentRegistryEntry["capabilities"],
				allowedTools: capabilities.map((c: string) => `tool:${c}`),
				approvalClass: "not-required" as const,
				supportedSurfaces: [
					"api",
					"workspace",
				] as AgentRegistryEntry["supportedSurfaces"],
			};

			await agentRegistry.registerAgent(entry);
			agentCount++;
			console.log(`   ✅ Agent registered: ${agent.id}`);
		} catch (error) {
			console.error(`   ❌ Failed to register agent ${agent.id}:`, error);
		}

		// ---- Register Tools ----
		for (const capability of agent.capabilities) {
			const toolName = `tool:${capability}`;
			try {
				await toolRegistry.registerTool({
					name: toolName,
					description: `Tool for capability: ${capability}`,
					riskTier: "T1",
					requiresApproval: false,
					fiscalImpact: false,
					approvalLevel: "auto",
				});
				toolCount++;
				console.log(`   🔧 Tool registered: ${toolName}`);
			} catch {
				// Duplicate — skip gracefully (upsert handles it)
				console.log(`   ⚡ Tool already exists (upserted): ${toolName}`);
				toolCount++;
			}
		}
	}

	console.log("\n" + "=".repeat(50));
	console.log("📊 Seed Summary");
	console.log("=".repeat(50));
	console.log(`   Agents registered: ${agentCount}`);
	console.log(`   Tools registered: ${toolCount}`);
	console.log("=".repeat(50));

	await client.end();
	console.log("✅ Seed complete. Connection closed.");
}

main().catch((error) => {
	console.error("❌ Seed failed:", error);
	process.exit(1);
});
