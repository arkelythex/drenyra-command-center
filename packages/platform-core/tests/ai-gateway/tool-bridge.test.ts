import { describe, expect, it } from "vitest";
import type { Tool } from "../../src/ai-gateway/tool-bridge.js";
import { ToolRegistry } from "../../src/ai-gateway/tool-bridge.js";

describe("ToolRegistry", () => {
	const calculatorTool: Tool = {
		name: "calculator",
		description: "Perform basic arithmetic",
		schema: {
			type: "object",
			properties: {
				a: { type: "number" },
				b: { type: "number" },
				operation: { type: "string", enum: ["add", "subtract"] },
			},
			required: ["a", "b", "operation"],
		},
		async execute(args: Record<string, unknown>) {
			const { a, b, operation } = args as {
				a: number;
				b: number;
				operation: string;
			};
			if (operation === "add") return { result: a + b };
			if (operation === "subtract") return { result: a - b };
			throw new Error(`Unknown operation: ${operation}`);
		},
	};

	const lookupTool: Tool = {
		name: "lookup",
		description: "Look up information",
		async execute(args: Record<string, unknown>) {
			const { key } = args as { key: string };
			if (key === "error") throw new Error("Lookup failed");
			return { data: `Found: ${key}` };
		},
	};

	describe("register", () => {
		it("registers a single tool", () => {
			const registry = new ToolRegistry();
			registry.register(calculatorTool);
			expect(registry.get("calculator")).toBeDefined();
		});

		it("registers multiple tools", () => {
			const registry = new ToolRegistry();
			registry.register(calculatorTool);
			registry.register(lookupTool);
			expect(registry.list()).toHaveLength(2);
		});

		it("overwrites an existing tool when registering with the same name", () => {
			const registry = new ToolRegistry();
			registry.register(calculatorTool);
			const updated: Tool = {
				...calculatorTool,
				description: "Updated calculator",
			};
			registry.register(updated);
			expect(registry.get("calculator")!.description).toBe(
				"Updated calculator",
			);
		});
	});

	describe("get", () => {
		it("returns undefined for unknown tool", () => {
			const registry = new ToolRegistry();
			expect(registry.get("non-existent")).toBeUndefined();
		});

		it("returns registered tool by name", () => {
			const registry = new ToolRegistry();
			registry.register(calculatorTool);
			const tool = registry.get("calculator");
			expect(tool).toBeDefined();
			expect(tool!.name).toBe("calculator");
			expect(tool!.description).toBe("Perform basic arithmetic");
		});
	});

	describe("list", () => {
		it("returns empty array when no tools registered", () => {
			const registry = new ToolRegistry();
			expect(registry.list()).toEqual([]);
		});

		it("returns all registered tools", () => {
			const registry = new ToolRegistry();
			registry.register(calculatorTool);
			registry.register(lookupTool);
			const tools = registry.list();
			expect(tools).toHaveLength(2);
			expect(tools.map((t) => t.name)).toContain("calculator");
			expect(tools.map((t) => t.name)).toContain("lookup");
		});
	});

	describe("execute", () => {
		it("executes a registered tool successfully", async () => {
			const registry = new ToolRegistry();
			registry.register(calculatorTool);
			const result = await registry.execute("calculator", {
				a: 2,
				b: 3,
				operation: "add",
			});
			expect(result.success).toBe(true);
			expect(result.data).toEqual({ result: 5 });
		});

		it("returns error result when executing an unknown tool", async () => {
			const registry = new ToolRegistry();
			const result = await registry.execute("non-existent", {});
			expect(result.success).toBe(false);
			expect(result.error).toContain("not found");
		});

		it("returns error result when tool execution throws", async () => {
			const registry = new ToolRegistry();
			registry.register(lookupTool);
			const result = await registry.execute("lookup", { key: "error" });
			expect(result.success).toBe(false);
			expect(result.error).toBe("Lookup failed");
		});

		it("returns success:true and data when tool executes", async () => {
			const registry = new ToolRegistry();
			registry.register(lookupTool);
			const result = await registry.execute("lookup", { key: "test-key" });
			expect(result.success).toBe(true);
			expect(result.data).toEqual({ data: "Found: test-key" });
		});
	});

	describe("remove", () => {
		it("returns false when removing a non-existent tool", () => {
			const registry = new ToolRegistry();
			expect(registry.remove("non-existent")).toBe(false);
		});

		it("removes a registered tool and returns true", () => {
			const registry = new ToolRegistry();
			registry.register(calculatorTool);
			expect(registry.remove("calculator")).toBe(true);
			expect(registry.get("calculator")).toBeUndefined();
			expect(registry.list()).toHaveLength(0);
		});
	});
});
