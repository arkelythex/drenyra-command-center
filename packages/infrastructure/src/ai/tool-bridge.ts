/**
 * Tool Calling Bridge - Adapts gemini-tools.ts Zod schemas to OpenRouter format
 *
 * Single source of truth: gemini-tools.ts
 * This file READS from there, never duplicates.
 *
 * @since Feb 2026
 */

import { z } from 'zod';
import type { OpenRouterTool, OpenRouterService, OpenRouterRequest, OpenRouterMessage } from './openrouter';
import {
  geminiToolDefinitions,
  executeGeminiTool,
  type GeminiToolName,
} from './gemini-tools';

type OpenRouterJsonType = 'string' | 'number' | 'boolean' | 'array' | 'object';

interface OpenRouterJsonSchemaProperty {
  type: OpenRouterJsonType;
  description: string;
  enum?: unknown[];
  items?: { type: OpenRouterJsonType };
}

interface OpenRouterJsonObjectSchema {
  type: 'object';
  properties: Record<string, OpenRouterJsonSchemaProperty>;
  required: string[];
}

type ZodIntrospectable = {
  description?: string;
  _def?: {
    description?: string;
    innerType?: unknown;
    type?: unknown;
    typeName?: string;
    values?: readonly unknown[];
  };
};

function asZodIntrospectable(value: unknown): ZodIntrospectable {
  return value as ZodIntrospectable;
}

/**
 * Convert Zod schema to OpenRouter function parameter schema
 * Simplified version that works with Zod internal types
 */
function zodToOpenRouterSchema(schema: z.ZodObject<z.ZodRawShape>): OpenRouterJsonObjectSchema {
  const shape = schema.shape;
  const properties: Record<string, OpenRouterJsonSchemaProperty> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    const zodType = asZodIntrospectable(value);

    // Basic property definition
    properties[key] = {
      type: inferJsonType(zodType),
      description: zodType.description || zodType._def?.description || '',
    };

    // Check if required (inverse of optional)
    const isOptional = zodType._def?.typeName === 'ZodOptional' ||
                       zodType._def?.typeName === 'ZodNullable';
    if (!isOptional) {
      required.push(key);
    }

    // Handle enums
    if (zodType._def?.typeName === 'ZodEnum' && zodType._def.values) {
      properties[key].enum = [...zodType._def.values];
    }

    // Handle arrays
    if (zodType._def?.typeName === 'ZodArray') {
      properties[key].items = {
        type: inferJsonType(asZodIntrospectable(zodType._def.type)),
      };
    }
  }

  return {
    type: 'object',
    properties,
    required,
  };
}

/**
 * Infer JSON schema type from Zod type (simplified)
 */
function inferJsonType(zodType: ZodIntrospectable): OpenRouterJsonType {
  if (!zodType || !zodType._def) return 'string';

  const typeName = zodType._def.typeName;

  // Handle wrappers
  if (typeName === 'ZodOptional' || typeName === 'ZodNullable') {
    return inferJsonType(asZodIntrospectable(zodType._def.innerType));
  }

  // Base types
  switch (typeName) {
    case 'ZodString':
      return 'string';
    case 'ZodNumber':
      return 'number';
    case 'ZodBoolean':
      return 'boolean';
    case 'ZodArray':
      return 'array';
    case 'ZodObject':
      return 'object';
    case 'ZodEnum':
      return 'string';
    default:
      return 'string';
  }
}

/**
 * Convert gemini-tools.ts definitions to OpenRouter format
 * @returns Result of getOpenRouterTools.
 * @example
 * ```ts
 * const result = getOpenRouterTools();
 * console.log(result);
 * ```
 */

export function getOpenRouterTools(): OpenRouterTool[] {
  return geminiToolDefinitions.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: zodToOpenRouterSchema(tool.parameters as z.ZodObject<z.ZodRawShape>),
    },
  }));
}

/**
 * Stream event types for tool execution
 * @example
 * ```ts
 * const value: ToolStreamEvent = {} as ToolStreamEvent;
 * console.log(value);
 * ```
 */

export type ToolStreamEvent =
  | { type: 'token'; content: string }
  | { type: 'tool_call_start'; name: string; id: string }
  | { type: 'tool_executing'; name: string; args: unknown }
  | { type: 'tool_result'; name: string; result: unknown }
  | { type: 'tool_error'; name: string; error: string }
  | { type: 'approval_required'; name: string; args: unknown; toolCallId: string }
  | { type: 'approval_decision'; name: string; toolCallId: string; approved: boolean }
  | { type: 'usage'; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number; cost: number } }
  | { type: 'done'; finish_reason: string };

/**
 * ToolApprovalRequest interface.
 *
 * @example
 * ```ts
 * const value: ToolApprovalRequest = {} as ToolApprovalRequest;
 * console.log(value);
 * ```
 */
export interface ToolApprovalRequest {
  name: string;
  args: unknown;
  toolCallId: string;
}

/**
 * Stream with automatic tool execution loop
 *
 * Flow:
 * 1. Stream from OpenRouter
 * 2. If tool_calls appear -> execute them
 * 3. Append tool results to messages
 * 4. Re-stream with updated context
 * 5. Repeat until no more tool_calls (max iterations)
 * @param service - Input for service.
 * @param request - Input for request.
 * @param options - Input for options.
 * @returns Result of streamWithToolExecution.
 * @example
 * ```ts
 * const result = await streamWithToolExecution({} as OpenRouterService, {} as OpenRouterRequest, {});
 * console.log(result);
 * ```
 */

export async function* streamWithToolExecution(
  service: OpenRouterService,
  request: OpenRouterRequest,
  options?: {
    maxToolIterations?: number;
    criticalTools?: Set<string>;  // Tools that require approval
    approvalHandler?: (request: ToolApprovalRequest) => Promise<boolean>;
  }
): AsyncGenerator<ToolStreamEvent> {
  const maxIterations = options?.maxToolIterations || 5;
  const criticalTools = options?.criticalTools || new Set();

  const messages = [...request.messages];
  let iteration = 0;

  while (iteration < maxIterations) {
    let hasToolCalls = false;
    const toolCalls: Map<string, { name: string; arguments: string }> = new Map();

    // Stream current turn
    for await (const chunk of service.chatCompletionStream({ ...request, messages })) {
      if (chunk.type === 'tool_call_start') {
        hasToolCalls = true;
        toolCalls.set(chunk.id, { name: chunk.name, arguments: '' });
        yield { type: 'tool_call_start', name: chunk.name, id: chunk.id };
      }

      if (chunk.type === 'tool_call_delta') {
        const call = toolCalls.get(chunk.id);
        if (call) call.arguments += chunk.arguments;
      }

      if (chunk.type === 'token') {
        yield { type: 'token', content: chunk.content };
      }

      if (chunk.type === 'usage') {
        yield { type: 'usage', usage: chunk.usage };
      }

      if (chunk.type === 'done') {
        if (!hasToolCalls) {
          yield { type: 'done', finish_reason: chunk.finish_reason };
          return;
        }
      }
    }

    // Execute tool calls
    if (hasToolCalls) {
      const assistantMessage: OpenRouterMessage = {
        role: 'assistant',
        content: '',
        tool_calls: Array.from(toolCalls.entries()).map(([id, call]) => ({
          id,
          type: 'function' as const,
          function: { name: call.name, arguments: call.arguments },
        })),
      };
      messages.push(assistantMessage);

      for (const [id, call] of toolCalls.entries()) {
        let args: unknown;
        try {
          args = JSON.parse(call.arguments);
        } catch (_error) {
          yield { type: 'tool_error', name: call.name, error: 'Invalid JSON arguments' };
          messages.push({
            role: 'tool',
            content: JSON.stringify({ error: 'Invalid JSON arguments' }),
          });
          continue;
        }

        // Check if critical (needs approval)
        if (criticalTools.has(call.name)) {
          yield {
            type: 'approval_required',
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
            type: 'approval_decision',
            name: call.name,
            toolCallId: id,
            approved,
          };

          if (!approved) {
            const deniedError = 'Tool execution denied by human approval gate';
            yield { type: 'tool_error', name: call.name, error: deniedError };
            messages.push({
              role: 'tool',
              content: JSON.stringify({ error: deniedError, code: 'APPROVAL_DENIED' }),
              tool_call_id: id,
            });
            continue;
          }
        }

        yield { type: 'tool_executing', name: call.name, args };

        try {
          const result = await executeGeminiTool(call.name as GeminiToolName, args);
          yield { type: 'tool_result', name: call.name, result };

          messages.push({
            role: 'tool',
            content: JSON.stringify(result),
            tool_call_id: id,
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Tool execution failed';
          yield { type: 'tool_error', name: call.name, error: message };
          messages.push({
            role: 'tool',
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

  yield { type: 'done', finish_reason: 'stop' };
}
