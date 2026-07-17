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
		`You are the Drenyra vertical agent for ARKELYTHEX OS.
Core fiscal engine - invoice processing, SUNAT compliance, tax calculation, and fiscal reporting.
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

export function createDrenyraAgent(): OSAgentPort<
	{ command: string },
	{ message: string }
> {
	return {
		id: "drenyra-main",
		name: "Drenyra",
		description:
			"Core fiscal engine - invoice processing, SUNAT compliance, tax calculation, and fiscal reporting",
		vertical: VerticalType.DRENYRA,
		capabilities: [
			"fiscal:invoice",
			"fiscal:tax",
			"fiscal:sunat",
			"fiscal:reporting",
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
						agentId: "drenyra-main",
						errors: [
							"Drenyra agent not available: ANTHROPIC_API_KEY not configured",
						],
					};
				}
				const response = await chain.invoke({ command: task.command });
				return {
					success: true,
					data: { message: String(response) },
					metrics: { duration: Date.now() - startTime, tokensUsed: 0, cost: 0 },
					agentId: "drenyra-main",
				};
			} catch (error) {
				return {
					success: false,
					data: null,
					metrics: { duration: Date.now() - startTime, tokensUsed: 0, cost: 0 },
					agentId: "drenyra-main",
					errors: [
						`Drenyra agent error: ${error instanceof Error ? error.message : String(error)}`,
					],
				};
			}
		},
	};
}
