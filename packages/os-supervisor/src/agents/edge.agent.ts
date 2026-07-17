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
		`You are the Edge Traz Agro vertical agent for ARKELYTHEX OS.
Supply chain traceability, agricultural lot tracking, and provenance verification.
Respond concisely in Spanish (Peru) unless the user writes in another language.

User input: {traceId}`,
	],
	["human", "{traceId}"],
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

export function createEdgeAgent(): OSAgentPort<
	{ traceId: string },
	{ message: string }
> {
	return {
		id: "edge-main",
		name: "Edge Traz Agro",
		description:
			"Supply chain traceability, agricultural lot tracking, and provenance verification",
		vertical: VerticalType.EDGE_TRAZ_AGRO,
		capabilities: ["trace:event", "trace:lot", "provenance:verify"],
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
						agentId: "edge-main",
						errors: [
							"Edge Traz Agro agent not available: ANTHROPIC_API_KEY not configured",
						],
					};
				}
				const response = await chain.invoke({ traceId: task.traceId });
				return {
					success: true,
					data: { message: String(response) },
					metrics: { duration: Date.now() - startTime, tokensUsed: 0, cost: 0 },
					agentId: "edge-main",
				};
			} catch (error) {
				return {
					success: false,
					data: null,
					metrics: { duration: Date.now() - startTime, tokensUsed: 0, cost: 0 },
					agentId: "edge-main",
					errors: [
						`Edge Traz Agro agent error: ${error instanceof Error ? error.message : String(error)}`,
					],
				};
			}
		},
	};
}
