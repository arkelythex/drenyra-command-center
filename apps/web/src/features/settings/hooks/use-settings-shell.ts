import { useEffect, useMemo, useState } from "react";
import { SETTINGS_NAV } from "../components/settings-shell/constants";

interface UseSettingsShellOptions {
	router: {
		preloadRoute: (options: { to: string }) => Promise<unknown>;
	};
}

export function useSettingsShell({ router }: UseSettingsShellOptions) {
	const [query, setQuery] = useState("");
	const normalizedQuery = query.trim().toLowerCase();

	const visibleItems = useMemo(
		() =>
			SETTINGS_NAV.filter((item) => {
				if (!normalizedQuery) return true;
				return (
					item.label.toLowerCase().includes(normalizedQuery) ||
					item.description.toLowerCase().includes(normalizedQuery)
				);
			}),
		[normalizedQuery],
	);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const preload = () => {
			const routesToPreload = SETTINGS_NAV.map((item) => item.to).filter(
				(path) => path !== "/profile",
			);
			for (const to of routesToPreload) {
				router.preloadRoute({ to }).catch(() => {
					// Keep navigation resilient if one preload fails.
				});
			}
		};

		if ("requestIdleCallback" in window) {
			const idleId = window.requestIdleCallback(() => preload(), {
				timeout: 800,
			});
			return () => window.cancelIdleCallback(idleId);
		}

		const timeoutId = globalThis.setTimeout(preload, 120);
		return () => globalThis.clearTimeout(timeoutId);
	}, [router]);

	return {
		query,
		visibleItems,
		setQuery,
	};
}
