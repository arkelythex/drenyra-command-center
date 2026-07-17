export interface Tool {
    name: string;
    description: string;
    schema?: Record<string, unknown>;
    execute(args: Record<string, unknown>): Promise<Record<string, unknown>>;
}
export interface ToolResult {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
}
export declare class ToolRegistry {
    private tools;
    register(tool: Tool): void;
    get(name: string): Tool | undefined;
    list(): Tool[];
    execute(name: string, args: Record<string, unknown>): Promise<ToolResult>;
    remove(name: string): boolean;
}
//# sourceMappingURL=tool-bridge.d.ts.map