import { stepCountIs, ToolLoopAgent } from "ai";
export function createAgentUIReadableStream(config) {
    const { model, system, prompt, tools, maxSteps = 5 } = config;
    return new ReadableStream({
        async start(controller) {
            try {
                const agent = new ToolLoopAgent({
                    model,
                    instructions: system,
                    tools: tools,
                    stopWhen: stepCountIs(maxSteps),
                });
                const result = await agent.stream({ prompt });
                const allSteps = await result.steps;
                for (const step of allSteps) {
                    if (step.text) {
                        const chunk = `${JSON.stringify({
                            type: "text-delta",
                            content: step.text,
                            stepNumber: step.stepNumber,
                        })}\n`;
                        controller.enqueue(new TextEncoder().encode(chunk));
                    }
                    const toolCalls = step.toolResults.map((tr) => ({
                        toolName: tr.toolName,
                        input: tr.input,
                        output: tr.output,
                    }));
                    if (toolCalls.length > 0) {
                        const chunk = `${JSON.stringify({
                            type: "step-finish",
                            content: step.text,
                            stepNumber: step.stepNumber,
                            toolCalls,
                        })}\n`;
                        controller.enqueue(new TextEncoder().encode(chunk));
                    }
                }
                const doneChunk = `${JSON.stringify({
                    type: "done",
                    content: allSteps.length > 0 ? allSteps[allSteps.length - 1].text : "",
                })}\n`;
                controller.enqueue(new TextEncoder().encode(doneChunk));
            }
            catch (error) {
                const errorChunk = `${JSON.stringify({
                    type: "error",
                    content: String(error),
                })}\n`;
                controller.enqueue(new TextEncoder().encode(errorChunk));
            }
            finally {
                controller.close();
            }
        },
    });
}
//# sourceMappingURL=agent-ui-stream.js.map