import { ChatAnthropic } from "@langchain/anthropic";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import type { Runnable } from "@langchain/core/runnables";
import type {
	OSAgentContext,
	OSAgentPort,
	OSAgentResult,
} from "../types/agent.types.js";
import { VerticalType } from "../types/vertical.types.js";

const PROMPT = ChatPromptTemplate.fromMessages([
	[
		"system",
		`You are the Andino Drone Lab vertical agent for ARKELYTHEX OS.
Drone operation management, flight telemetry, crop analysis, and agricultural monitoring.
Respond concisely in Spanish (Peru) unless the user writes in another language.

User input: {command}`,
	],
	["human", "{command}"],
]);

const PARSER = new StringOutputParser();

let _chain: Runnable | null = null;

function createChain() {
	try {
		return PROMPT.pipe(
			new ChatAnthropic({
				model: "claude-sonnet-4-20250514",
				temperature: 0.3,
				maxTokens: 512,
			}),
		).pipe(PARSER);
	} catch {
		return null;
	}
}

function getChain() {
	if (!_chain) {
		_chain = createChain();
	}
	return _chain;
}

export function createAndinoAgent(): OSAgentPort<
	{ command: string },
	{ message: string }
> {
	return {
		id: "andino-main",
		name: "Andino Drone Lab",
		description:
			"Drone operation management, flight telemetry, crop analysis, and agricultural monitoring",
		vertical: VerticalType.ANDINO,
		capabilities: [
			"drone:telemetry",
			"drone:mission",
			"crop:analysis",
			"field:monitoring",
		],
		execute: async (
			task,
			_context: OSAgentContext,
		): Promise<OSAgentResult<{ message: string }>> => {
			const startTime = Date.now();
			try {
				const chain = getChain();
				if (!chain) {
					return {
						success: false,
						data: null,
						metrics: { duration: 0, tokensUsed: 0, cost: 0 },
						agentId: "andino-main",
						errors: [
							"Andino Drone Lab agent not available: ANTHROPIC_API_KEY not configured",
						],
					};
				}
				const response = await chain.invoke({ command: task.command });
				return {
					success: true,
					data: { message: String(response) },
					metrics: { duration: Date.now() - startTime, tokensUsed: 0, cost: 0 },
					agentId: "andino-main",
				};
			} catch (error) {
				return {
					success: false,
					data: null,
					metrics: { duration: Date.now() - startTime, tokensUsed: 0, cost: 0 },
					agentId: "andino-main",
					errors: [
						`Andino Drone Lab agent error: ${error instanceof Error ? error.message : String(error)}`,
					],
				};
			}
		},
	};
}
