import { ChatAnthropic } from "@langchain/anthropic";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import type {
	OSAgentContext,
	OSAgentPort,
	OSAgentResult,
} from "../types/agent.types.js";
import { VerticalType } from "../types/vertical.types.js";

const ADMIN_PROMPT_TEMPLATE = ChatPromptTemplate.fromMessages([
	[
		"system",
		`You are the Admin vertical agent for ARKELYTHEX OS.
You handle HR, employee management, contracts, payroll, and internal administration.
Respond concisely in Spanish (Peru) unless the user writes in another language.

Available actions: hr:employee, hr:contract, hr:payroll, admin:settings

User command: {command}`,
	],
	["human", "{command}"],
]);

const PARSER = new StringOutputParser();

let _adminChain: ReturnType<typeof createChain> | null = null;

function createChain() {
	try {
		return ADMIN_PROMPT_TEMPLATE.pipe(
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
	if (!_adminChain) {
		_adminChain = createChain();
	}
	return _adminChain;
}

export function createAdminAgent(): OSAgentPort<
	{ command: string },
	{ message: string }
> {
	return {
		id: "admin-main",
		name: "Admin",
		description:
			"Employee management, contracts, payroll, and internal administration",
		vertical: VerticalType.ADMIN,
		capabilities: [
			"hr:employee",
			"hr:contract",
			"hr:payroll",
			"admin:settings",
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
						agentId: "admin-main",
						errors: [
							"Admin agent not available: ANTHROPIC_API_KEY not configured",
						],
					};
				}
				const response = await chain.invoke({ command: task.command });
				return {
					success: true,
					data: { message: response },
					metrics: { duration: Date.now() - startTime, tokensUsed: 0, cost: 0 },
					agentId: "admin-main",
				};
			} catch (error) {
				return {
					success: false,
					data: null,
					metrics: { duration: Date.now() - startTime, tokensUsed: 0, cost: 0 },
					agentId: "admin-main",
					errors: [
						`Admin agent error: ${error instanceof Error ? error.message : String(error)}`,
					],
				};
			}
		},
	};
}
