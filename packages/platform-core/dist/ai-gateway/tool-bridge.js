export class ToolRegistry {
    tools = new Map();
    register(tool) {
        this.tools.set(tool.name, tool);
    }
    get(name) {
        return this.tools.get(name);
    }
    list() {
        return Array.from(this.tools.values());
    }
    async execute(name, args) {
        const tool = this.tools.get(name);
        if (!tool) {
            return { success: false, error: `Tool not found: ${name}` };
        }
        try {
            const data = await tool.execute(args);
            return { success: true, data };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    }
    remove(name) {
        return this.tools.delete(name);
    }
}
//# sourceMappingURL=tool-bridge.js.map