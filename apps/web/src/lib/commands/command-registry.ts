/**
 * CommandRegistry — central registry for the universal command palette.
 *
 * Three command categories:
 * - navigation: route changes, company/period switches (instant)
 * - query: searches, explanations, comparisons (opens result)
 * - execution: actions that change state (R1 undo, R2 preview, R3 auth)
 */

export type CommandCategory = "navigation" | "query" | "execution";
export type RiskLevel = "R0" | "R1" | "R2" | "R3";

export interface Command {
	id: string;
	label: string;
	description: string;
	category: CommandCategory;
	icon?: string;
	shortcut?: string;
	riskLevel?: RiskLevel;
	keywords?: string[];
	execute: () => void | Promise<void>;
	precondition?: () => boolean | Promise<boolean>;
}

type CommandMap = Map<string, Command>;

/**
 * Simple character-level fuzzy matcher.
 * Returns true if all characters in `query` appear in `text` in order.
 * More intuitive than substring matching for typos.
 */
function fuzzyMatch(text: string, query: string): boolean {
	const lower = text.toLowerCase();
	const q = query.toLowerCase();
	let qi = 0;
	for (let ti = 0; ti < lower.length && qi < q.length; ti++) {
		if (lower[ti] === q[qi]) qi++;
	}
	return qi === q.length;
}

class CommandRegistry {
	private commands: CommandMap = new Map();
	private groupPrefixes: Map<string, Set<string>> = new Map();

	register(command: Command, group?: string): void {
		if (this.commands.has(command.id)) {
			console.warn(
				`[CommandRegistry] Overwriting existing command: ${command.id}`,
			);
		}
		this.commands.set(command.id, command);
		if (group) {
			const existing = this.groupPrefixes.get(group) ?? new Set();
			existing.add(command.id);
			this.groupPrefixes.set(group, existing);
		}
	}

	registerMany(commands: Command[], group?: string): void {
		for (const cmd of commands) {
			this.register(cmd, group);
		}
	}

	/** Unregister all commands in a group (e.g., when workspace changes). */
	unregisterGroup(group: string): void {
		const ids = this.groupPrefixes.get(group);
		if (!ids) return;
		for (const id of ids) {
			this.commands.delete(id);
		}
		this.groupPrefixes.delete(group);
	}

	unregister(id: string): void {
		this.commands.delete(id);
		// Clean up any group reference
		for (const [group, ids] of this.groupPrefixes.entries()) {
			if (ids.has(id)) {
				ids.delete(id);
				if (ids.size === 0) this.groupPrefixes.delete(group);
				break;
			}
		}
	}

	clear(): void {
		this.commands.clear();
		this.groupPrefixes.clear();
	}

	get(id: string): Command | undefined {
		return this.commands.get(id);
	}

	getAll(): Command[] {
		return Array.from(this.commands.values());
	}

	/**
	 * Search commands by label, description, and keywords.
	 * Uses fuzzy matching for typos.
	 * Results sorted by category priority: navigation → query → execution.
	 */
	search(query: string): Command[] {
		const q = query.toLowerCase().trim();
		const results = Array.from(this.commands.values());

		if (!q) {
			return results.sort((a, b) => categoryPriority(a) - categoryPriority(b));
		}

		return results
			.filter((cmd) => {
				const searchText = [
					cmd.label,
					cmd.description,
					...(cmd.keywords ?? []),
				].join(" ");
				return fuzzyMatch(searchText, q);
			})
			.sort((a, b) => {
				const catDiff = categoryPriority(a) - categoryPriority(b);
				if (catDiff !== 0) return catDiff;

				// Within same category, prefer exact match on label
				const aExact = a.label.toLowerCase().includes(q) ? 0 : 1;
				const bExact = b.label.toLowerCase().includes(q) ? 0 : 1;
				return aExact - bExact;
			});
	}

	getByCategory(category: CommandCategory): Command[] {
		return Array.from(this.commands.values()).filter(
			(c) => c.category === category,
		);
	}

	getNavigationCommands(): Command[] {
		return this.getByCategory("navigation");
	}

	getQueryCommands(): Command[] {
		return this.getByCategory("query");
	}

	getExecutionCommands(): Command[] {
		return this.getByCategory("execution");
	}

	async canExecute(id: string): Promise<boolean> {
		const cmd = this.commands.get(id);
		if (!cmd) return false;
		if (!cmd.precondition) return true;
		try {
			return await cmd.precondition();
		} catch {
			return false;
		}
	}

	get size(): number {
		return this.commands.size;
	}
}

function categoryPriority(cmd: Command): number {
	const prio: Record<CommandCategory, number> = {
		navigation: 0,
		query: 1,
		execution: 2,
	};
	return prio[cmd.category] ?? 99;
}

// Singleton
export const commandRegistry = new CommandRegistry();
