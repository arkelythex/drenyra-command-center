import { stepCountIs, ToolLoopAgent } from "ai";
export async function runToolLoop(config) {
    const { model, system, prompt, tools, maxSteps = 5, maxTokens } = config;
    const steps = [];
    let currentText = "";
    const agent = new ToolLoopAgent({
        model,
        instructions: system,
        tools: tools,
        maxOutputTokens: maxTokens,
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
//# sourceMappingURL=tool-loop-agent.js.map