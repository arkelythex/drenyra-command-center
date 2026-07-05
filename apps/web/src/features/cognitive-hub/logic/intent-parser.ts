/**
 * @fileoverview Parser de intenciones extendido con navegación
 * @module features/cognitive-hub/logic/intent-parser
 */

import { NAVIGATION_PATTERNS } from "./intent-parser/navigation-patterns";
import { SLASH_COMMANDS } from "./intent-parser/slash-commands";
import { TASK_HINTS } from "./intent-parser/task-hints";
import type { HubIntent, NavigationIntent } from "./intent-parser/types";

function wordCount(input: string): number {
	return input.trim().split(/\s+/).filter(Boolean).length;
}

function resolveSlashCommand(input: string): string | null {
	if (!input.startsWith("/")) return null;
	return input.split(" ")[0] ?? null;
}

function looksLikeNaturalLanguageQuestion(input: string): boolean {
	return (
		/[?¿]/.test(input) ||
		/^(cómo|como|qué|que|cuándo|cuando|dónde|donde|por qué|porque)\b/i.test(
			input,
		)
	);
}

export type { HubIntent, NavigationIntent };
export { SLASH_COMMANDS };

export function parseIntent(input: string): HubIntent {
	const normalized = input.trim().toLowerCase();
	if (!normalized) return "query";

	const slashCommand = resolveSlashCommand(normalized);
	if (slashCommand) {
		return SLASH_COMMANDS[slashCommand] ? "navigation" : "command";
	}

	if (TASK_HINTS.some((hint) => normalized.includes(hint))) return "task";
	if (looksLikeNaturalLanguageQuestion(normalized)) return "query";

	const isNavigation = NAVIGATION_PATTERNS.some(({ patterns }) =>
		patterns.some((pattern) => pattern.test(normalized)),
	);
	if (isNavigation) return "navigation";

	if (wordCount(normalized) <= 2) return "command";
	return "query";
}

export function extractNavigationIntent(
	input: string,
): NavigationIntent | null {
	const normalized = input.trim().toLowerCase();
	const slashCommand = resolveSlashCommand(normalized);

	if (slashCommand) {
		const config = SLASH_COMMANDS[slashCommand];
		if (!config) return null;
		return {
			type: "navigation",
			target: config.path,
			title: config.title,
		};
	}

	for (const patternConfig of NAVIGATION_PATTERNS) {
		if (!patternConfig.patterns.some((pattern) => pattern.test(normalized)))
			continue;

		return {
			type: "navigation",
			target: patternConfig.target,
			title: patternConfig.title,
			params: patternConfig.extractParams?.(normalized),
		};
	}

	return null;
}

export function getCommandSuggestions(
	input: string,
): Array<{ command: string; title: string; description: string }> {
	const normalized = input.toLowerCase().trim();
	if (!normalized.startsWith("/")) return [];

	return Object.entries(SLASH_COMMANDS)
		.filter(([command]) => command.startsWith(normalized))
		.map(([command, config]) => ({
			command,
			title: config.title,
			description: config.description,
		}))
		.slice(0, 5);
}

export function getNavigationSuggestions(
	input: string,
): Array<{ target: string; title: string; confidence: number }> {
	const normalized = input.toLowerCase().trim();
	if (normalized.length < 3) return [];

	const suggestions = NAVIGATION_PATTERNS.map(({ patterns, target, title }) => {
		const matches = patterns.filter((pattern) =>
			pattern.test(normalized),
		).length;
		return { target, title, confidence: matches / patterns.length, matches };
	})
		.filter((suggestion) => suggestion.matches > 0)
		.map(({ target, title, confidence }) => ({ target, title, confidence }));

	return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

export default parseIntent;
