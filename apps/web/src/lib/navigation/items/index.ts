import type { NavigationItem } from "../types";
import { AUTOMATIONS_ITEMS } from "./automations";
import { FINANZAS_ITEMS } from "./finanzas";
import { FISCAL_ITEMS } from "./fiscal";
import { INTELLIGENCE_ITEMS } from "./intelligence";
import { OPERACIONES_ITEMS } from "./operaciones";
import { PLUGINS_ITEMS } from "./plugins";
import { SISTEMA_ITEMS } from "./sistema";

export const ALL_NAV_ITEMS: readonly NavigationItem[] = [
	...INTELLIGENCE_ITEMS,
	...FINANZAS_ITEMS,
	...FISCAL_ITEMS,
	...OPERACIONES_ITEMS,
	...SISTEMA_ITEMS,
	...PLUGINS_ITEMS,
	...AUTOMATIONS_ITEMS,
];

export const NAV_ITEMS = buildNavItemsMap(ALL_NAV_ITEMS);

function buildNavItemsMap(
	items: readonly NavigationItem[],
): Readonly<Record<string, NavigationItem>> {
	const map = new Map<string, NavigationItem>();

	for (const item of items) {
		if (map.has(item.id)) {
			throw new Error(`[navigation] Duplicate item id detected: ${item.id}`);
		}
		map.set(item.id, item);
	}

	return Object.fromEntries(map.entries());
}
