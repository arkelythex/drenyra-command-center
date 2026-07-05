/**
 * Tool Bridge Types
 *
 * Types for the Zod-to-OpenRouter tool bridge
 */

export type OpenRouterJsonType =
	| "string"
	| "number"
	| "boolean"
	| "array"
	| "object";

export interface OpenRouterJsonSchemaProperty {
	type: OpenRouterJsonType;
	description: string;
	enum?: unknown[];
	items?: { type: OpenRouterJsonType };
}

export interface OpenRouterJsonObjectSchema {
	type: "object";
	properties: Record<string, OpenRouterJsonSchemaProperty>;
	required: string[];
}

export type ZodIntrospectable = {
	description?: string;
	_def?: {
		description?: string;
		innerType?: unknown;
		type?: unknown;
		typeName?: string;
		values?: readonly unknown[];
	};
};

export type ToolStreamEvent =
	| { type: "token"; content: string }
	| { type: "tool_call_start"; name: string; id: string }
	| { type: "tool_executing"; name: string; args: unknown }
	| { type: "tool_result"; name: string; result: unknown }
	| { type: "tool_error"; name: string; error: string }
	| {
			type: "approval_required";
			name: string;
			args: unknown;
			toolCallId: string;
	  }
	| {
			type: "approval_decision";
			name: string;
			toolCallId: string;
			approved: boolean;
	  }
	| {
			type: "usage";
			usage: {
				prompt_tokens: number;
				completion_tokens: number;
				total_tokens: number;
				cost: number;
			};
	  }
	| { type: "done"; finish_reason: string };

export interface ToolApprovalRequest {
	name: string;
	args: unknown;
	toolCallId: string;
}

/**
 * Tri-state permission effect for tool execution.
 * Used by the granual permission system (P5) to override default approval routing.
 */
export type PermissionEffect = "ALLOW" | "DENY" | "REQUIRE_APPROVAL";

/**
 * Permission check callback type.
 * Takes a tool name and returns the effective permission decision.
 * When provided to streamWithToolExecution, REPLACES the criticalTools set.
 */
export type PermissionCheckFn = (toolName: string) => {
	effect: PermissionEffect;
};
