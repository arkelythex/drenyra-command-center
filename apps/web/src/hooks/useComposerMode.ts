import type { RouteMatch } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";

export type ComposerMode = "expanded" | "compact" | "hidden";

/**
 * Returns the composer mode based on the current route's meta.
 * Falls back to "compact" when no mode is declared.
 */
export function useComposerMode(): ComposerMode {
	const matches = useRouterState({ select: (s) => s.matches });
	const deepest: RouteMatch | undefined = matches[matches.length - 1];
	const meta = deepest?.route?.meta as Record<string, unknown> | undefined;
	const mode =
		typeof meta?.composerMode === "string" ? meta.composerMode : undefined;

	if (mode === "expanded") return "expanded";
	if (mode === "hidden") return "hidden";
	return "compact";
}
