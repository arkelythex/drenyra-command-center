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
		`You are the Kuse Cowork vertical agent for ARKELYTHEX OS.
Coworking space management, bookings, memberships, and resource scheduling.
Respond concisely in Spanish (Peru) unless the user writes in another language.

User input: {action}`,
	],
	["human", "{action}"],
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

export function createKuseAgent(): OSAgentPort<
	{ action: string },
	{ message: string }
> {
	return {
		id: "kuse-main",
		name: "Kuse Cowork",
		description:
			"Coworking space management, bookings, memberships, and resource scheduling",
		vertical: VerticalType.KUSE,
		capabilities: ["cowork:booking", "cowork:membership", "cowork:space"],
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
						agentId: "kuse-main",
						errors: [
							"Kuse Cowork agent not available: ANTHROPIC_API_KEY not configured",
						],
					};
				}
				const response = await chain.invoke({ action: task.action });
				return {
					success: true,
					data: { message: String(response) },
					metrics: { duration: Date.now() - startTime, tokensUsed: 0, cost: 0 },
					agentId: "kuse-main",
				};
			} catch (error) {
				return {
					success: false,
					data: null,
					metrics: { duration: Date.now() - startTime, tokensUsed: 0, cost: 0 },
					agentId: "kuse-main",
					errors: [
						`Kuse Cowork agent error: ${error instanceof Error ? error.message : String(error)}`,
					],
				};
			}
		},
	};
}
