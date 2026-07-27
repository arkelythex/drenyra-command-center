import { describe, it, expect, beforeEach, vi } from "vitest";
import {
	commandRegistry,
	type Command,
} from "../lib/commands/command-registry";

describe("CommandRegistry", () => {
	beforeEach(() => {
		// Clear registry by unregistering all commands
		for (const cmd of commandRegistry.getAll()) {
			commandRegistry.unregister(cmd.id);
		}
	});

	const navCmd: Command = {
		id: "test-nav",
		label: "Test Navigation",
		description: "A test navigation command",
		category: "navigation",
		execute: () => {},
		keywords: ["test", "nav"],
	};

	const queryCmd: Command = {
		id: "test-query",
		label: "Test Query",
		description: "A test query command",
		category: "query",
		execute: () => {},
	};

	const execCmd: Command = {
		id: "test-exec",
		label: "Test Execution",
		description: "A test execution command R2",
		category: "execution",
		riskLevel: "R2",
		execute: () => {},
		precondition: async () => true,
	};

	it("registers a single command", () => {
		commandRegistry.register(navCmd);
		expect(commandRegistry.size).toBe(1);
		expect(commandRegistry.get("test-nav")).toEqual(navCmd);
	});

	it("registers multiple commands", () => {
		commandRegistry.registerMany([navCmd, queryCmd, execCmd]);
		expect(commandRegistry.size).toBe(3);
	});

	it("unregisters a command", () => {
		commandRegistry.register(navCmd);
		commandRegistry.unregister("test-nav");
		expect(commandRegistry.size).toBe(0);
	});

	it("returns all commands", () => {
		commandRegistry.registerMany([navCmd, queryCmd, execCmd]);
		const all = commandRegistry.getAll();
		expect(all).toHaveLength(3);
	});

	it("filters by category", () => {
		commandRegistry.registerMany([navCmd, queryCmd, execCmd]);
		expect(commandRegistry.getByCategory("navigation")).toHaveLength(1);
		expect(commandRegistry.getByCategory("query")).toHaveLength(1);
		expect(commandRegistry.getByCategory("execution")).toHaveLength(1);
	});

	it("searches by label", () => {
		commandRegistry.registerMany([navCmd, queryCmd, execCmd]);
		const results = commandRegistry.search("navigation");
		expect(results).toHaveLength(1);
		expect(results[0]!.id).toBe("test-nav");
	});

	it("searches by keywords", () => {
		commandRegistry.register(navCmd);
		const results = commandRegistry.search("test");
		expect(results).toHaveLength(1);
	});

	it("returns all commands when query is empty", () => {
		commandRegistry.registerMany([navCmd, queryCmd]);
		expect(commandRegistry.search("")).toHaveLength(2);
	});

	it("sorts results by category priority (navigation first)", () => {
		commandRegistry.registerMany([execCmd, queryCmd, navCmd]);
		const results = commandRegistry.search("");
		expect(results[0]!.category).toBe("navigation");
		expect(results[1]!.category).toBe("query");
		expect(results[2]!.category).toBe("execution");
	});

	it("returns navigation commands", () => {
		commandRegistry.registerMany([navCmd, queryCmd]);
		expect(commandRegistry.getNavigationCommands()).toHaveLength(1);
	});

	it("returns query commands", () => {
		commandRegistry.registerMany([queryCmd, execCmd]);
		expect(commandRegistry.getQueryCommands()).toHaveLength(1);
	});

	it("returns execution commands", () => {
		commandRegistry.registerMany([execCmd, navCmd]);
		expect(commandRegistry.getExecutionCommands()).toHaveLength(1);
	});

	it("checks precondition", async () => {
		commandRegistry.register(execCmd);
		const canExec = await commandRegistry.canExecute("test-exec");
		expect(canExec).toBe(true);
	});

	it("returns false for unknown command in canExecute", async () => {
		const canExec = await commandRegistry.canExecute("unknown");
		expect(canExec).toBe(false);
	});

	it("handles missing precondition", async () => {
		commandRegistry.register(navCmd);
		const canExec = await commandRegistry.canExecute("test-nav");
		expect(canExec).toBe(true);
	});

	it("warns on overwrite", () => {
		const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
		commandRegistry.register(navCmd);
		commandRegistry.register(navCmd);
		expect(spy).toHaveBeenCalled();
		spy.mockRestore();
	});
});
