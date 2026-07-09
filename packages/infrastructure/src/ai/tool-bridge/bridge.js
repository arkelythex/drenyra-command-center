import { executeGeminiTool, geminiToolDefinitions } from "../gemini-tools";

function asZodIntrospectable(value) {
	return value;
}
function zodToOpenRouterSchema(schema) {
	const shape = schema.shape;
	const properties = {};
	const required = [];
	for (const [key, value] of Object.entries(shape)) {
		const zodType = asZodIntrospectable(value);
		properties[key] = {
			type: inferJsonType(zodType),
			description: zodType.description || zodType._def?.description || "",
		};
		const isOptional =
			zodType._def?.typeName === "ZodOptional" ||
			zodType._def?.typeName === "ZodNullable";
		if (!isOptional) {
			required.push(key);
		}
		if (zodType._def?.typeName === "ZodEnum" && zodType._def.values) {
			properties[key].enum = [...zodType._def.values];
		}
		if (zodType._def?.typeName === "ZodArray") {
			properties[key].items = {
				type: inferJsonType(asZodIntrospectable(zodType._def.type)),
			};
		}
	}
	return {
		type: "object",
		properties,
		required,
	};
}
function inferJsonType(zodType) {
	if (!zodType || !zodType._def) return "string";
	const typeName = zodType._def.typeName;
	if (typeName === "ZodOptional" || typeName === "ZodNullable") {
		return inferJsonType(asZodIntrospectable(zodType._def.innerType));
	}
	switch (typeName) {
		case "ZodString":
			return "string";
		case "ZodNumber":
			return "number";
		case "ZodBoolean":
			return "boolean";
		case "ZodArray":
			return "array";
		case "ZodObject":
			return "object";
		case "ZodEnum":
			return "string";
		default:
			return "string";
	}
}
export function getOpenRouterTools() {
	return geminiToolDefinitions.map((tool) => ({
		type: "function",
		function: {
			name: tool.name,
			description: tool.description,
			parameters: zodToOpenRouterSchema(tool.parameters),
		},
	}));
}
export async function* streamWithToolExecution(service, request, options) {
	const maxIterations = options?.maxToolIterations || 5;
	const criticalTools = options?.criticalTools || new Set();
	const messages = [...request.messages];
	let iteration = 0;
	while (iteration < maxIterations) {
		let hasToolCalls = false;
		const toolCalls = new Map();
		for await (const chunk of service.chatCompletionStream({
			...request,
			messages,
		})) {
			if (chunk.type === "tool_call_start") {
				hasToolCalls = true;
				toolCalls.set(chunk.id, { name: chunk.name, arguments: "" });
				yield { type: "tool_call_start", name: chunk.name, id: chunk.id };
			}
			if (chunk.type === "tool_call_delta") {
				const call = toolCalls.get(chunk.id);
				if (call) call.arguments += chunk.arguments;
			}
			if (chunk.type === "token") {
				yield { type: "token", content: chunk.content };
			}
			if (chunk.type === "usage") {
				yield { type: "usage", usage: chunk.usage };
			}
			if (chunk.type === "done") {
				if (!hasToolCalls) {
					yield { type: "done", finish_reason: chunk.finish_reason };
					return;
				}
			}
		}
		if (hasToolCalls) {
			const assistantMessage = {
				role: "assistant",
				content: "",
				tool_calls: Array.from(toolCalls.entries()).map(([id, call]) => ({
					id,
					type: "function",
					function: { name: call.name, arguments: call.arguments },
				})),
			};
			messages.push(assistantMessage);
			for (const [id, call] of toolCalls.entries()) {
				let args;
				try {
					args = JSON.parse(call.arguments);
				} catch (_error) {
					yield {
						type: "tool_error",
						name: call.name,
						error: "Invalid JSON arguments",
					};
					messages.push({
						role: "tool",
						content: JSON.stringify({ error: "Invalid JSON arguments" }),
					});
					continue;
				}
				if (criticalTools.has(call.name)) {
					yield {
						type: "approval_required",
						name: call.name,
						args,
						toolCallId: id,
					};
					const approved = options?.approvalHandler
						? await options.approvalHandler({
								name: call.name,
								args,
								toolCallId: id,
							})
						: false;
					yield {
						type: "approval_decision",
						name: call.name,
						toolCallId: id,
						approved,
					};
					if (!approved) {
						const deniedError = "Tool execution denied by human approval gate";
						yield { type: "tool_error", name: call.name, error: deniedError };
						messages.push({
							role: "tool",
							content: JSON.stringify({
								error: deniedError,
								code: "APPROVAL_DENIED",
							}),
							tool_call_id: id,
						});
						continue;
					}
				}
				yield { type: "tool_executing", name: call.name, args };
				try {
					const result = await executeGeminiTool(call.name, args);
					yield { type: "tool_result", name: call.name, result };
					messages.push({
						role: "tool",
						content: JSON.stringify(result),
						tool_call_id: id,
					});
				} catch (error) {
					const message =
						error instanceof Error ? error.message : "Tool execution failed";
					yield { type: "tool_error", name: call.name, error: message };
					messages.push({
						role: "tool",
						content: JSON.stringify({ error: message }),
						tool_call_id: id,
					});
				}
			}
			iteration++;
		} else {
			break;
		}
	}
	yield { type: "done", finish_reason: "stop" };
}

