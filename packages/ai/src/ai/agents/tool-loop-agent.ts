import type { LanguageModel } from "ai";
import { stepCountIs, ToolLoopAgent } from "ai";

export interface ToolLoopAgentConfig {
	model: LanguageModel;
	system: string;
	prompt: string;
	tools: Record<string, unknown>;
	maxSteps?: number;
	maxTokens?: number;
}

export interface ToolLoopResult {
	text: string;
	steps: Array<{
		stepNumber: number;
		toolCalls: Array<{
			toolName: string;
			input: unknown;
			output: unknown;
		}>;
		text: string;
	}>;
	totalSteps: number;
}

export async function runToolLoop(
	config: ToolLoopAgentConfig,
): Promise<ToolLoopResult> {
	const { model, system, prompt, tools, maxSteps = 5, maxTokens } = config;

	const steps: ToolLoopResult["steps"] = [];
	let currentText = "";

	const agent = new ToolLoopAgent({
		model,
		instructions: system,
		tools: tools as Record<string, any>,
		...(maxTokens !== undefined ? { maxOutputTokens: maxTokens } : {}),
		stopWhen: stepCountIs(maxSteps),
		onStepFinish: (step) => {
			steps.push({
				stepNumber: step.stepNumber,
				toolCalls: step.toolResults.map((tr) => ({
					toolName: tr.toolName,
					input: tr.input,
					output: tr.output,
				})),
				text: step.text,
			});
			currentText = step.text;
		},
	});

	const result = await agent.generate({ prompt });

	return {
		text: result.text ?? currentText,
		steps,
		totalSteps: steps.length,
	};
}
