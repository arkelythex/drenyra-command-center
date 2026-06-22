/**
 * Tool Bridge — Domain-Agnostic Tool Registry and Execution.
 *
 * Manages a registry of tools that AI models can invoke, with error-safe
 * execution and result wrapping.
 *
 * Zero fiscal imports — tool inputs and outputs are Record<string, unknown>
 * and schemas are plain JSON Schema objects.
 *
 * @module @arkelythex/platform-core/ai-gateway
 */

// ──────────────────────────────────────────────
// Tool Types
// ──────────────────────────────────────────────

/**
 * A callable tool that an AI model can invoke.
 */
export interface Tool {
  /** Unique tool name */
  name: string;
  /** Human-readable description of what the tool does */
  description: string;
  /** Optional JSON Schema for tool parameters */
  schema?: Record<string, unknown>;
  /** Execute the tool with the given arguments */
  execute(args: Record<string, unknown>): Promise<Record<string, unknown>>;
}

/**
 * The result of a tool execution.
 */
export interface ToolResult {
  /** Whether execution succeeded */
  success: boolean;
  /** Output data (present on success) */
  data?: Record<string, unknown>;
  /** Error message (present on failure) */
  error?: string;
}

// ──────────────────────────────────────────────
// Tool Registry
// ──────────────────────────────────────────────

/**
 * A registry for managing and executing callable tools.
 *
 * @example
 * ```ts
 * const registry = new ToolRegistry();
 * registry.register({
 *   name: "calculator",
 *   description: "Perform basic arithmetic",
 *   async execute(args) {
 *     const { a, b, operation } = args as any;
 *     if (operation === "add") return { result: a + b };
 *     throw new Error(`Unknown operation: ${operation}`);
 *   },
 * });
 *
 * const result = await registry.execute("calculator", { a: 2, b: 3, operation: "add" });
 * // { success: true, data: { result: 5 } }
 * ```
 */
export class ToolRegistry {
  private tools = new Map<string, Tool>();

  /**
   * Register a tool. Overwrites if a tool with the same name exists.
   */
  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a registered tool by name. Returns undefined if not found.
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * List all registered tools.
   */
  list(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Execute a tool by name with the given arguments.
   * Always returns a ToolResult — never throws.
   */
  async execute(
    name: string,
    args: Record<string, unknown>,
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return { success: false, error: `Tool not found: ${name}` };
    }

    try {
      const data = await tool.execute(args);
      return { success: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  /**
   * Remove a registered tool. Returns true if removed, false if not found.
   */
  remove(name: string): boolean {
    return this.tools.delete(name);
  }
}
