import {
	isMobileNavigationRouteEnabledForDemo,
	isNavigationItemEnabledForDemo,
} from "./demo-feature-flags";
import { ALL_NAV_ITEMS } from "./navigation/items";
import { MOBILE_NAV_ITEMS as MOBILE_NAV_ITEMS_SOURCE } from "./navigation/items/mobile";
import type {
	MobileNavigationItem,
	NavigationGroup,
	NavigationItem,
	NavigationSectionId,
} from "./navigation/types";
import { GROUP_METADATA, SIDEBAR_GROUP_ORDER } from "./navigation/types";

export type {
	MobileNavigationItem,
	NavigationGroup,
	NavigationItem,
	NavigationSectionId,
} from "./navigation/types";

const PRIMARY_NAV_ITEM_IDS = [
	"dashboard",
	"banking",
	"ledger",
	"invoices",
	"bills",
	"cashflow",
	"reconciliations",
	"drenyra",
	"expedientes",
	"approvals",
	"compliance",
	"financials",
	"reports",
	"audit",
	"taxation",
] as const;

const PRIMARY_NAV_ITEM_ID_SET = new Set<string>(PRIMARY_NAV_ITEM_IDS);

const VISIBLE_NAV_ITEMS = ALL_NAV_ITEMS.filter((item) =>
	isNavigationItemEnabledForDemo(item.id),
);

const NAV_ITEMS_BY_ID = buildNavItemsById(VISIBLE_NAV_ITEMS);

function getItemsBySection(section: NavigationSectionId): NavigationItem[] {
	return dedupeByRoute(
		VISIBLE_NAV_ITEMS.filter(
			(item) =>
				item.section === section &&
				item.showInSidebar !== false &&
				!item.moduleGroup &&
				!PRIMARY_NAV_ITEM_ID_SET.has(item.id),
		),
	);
}

function getModuleItemsBySection(
	section: NavigationSectionId,
): NavigationItem[] {
	return dedupeByRoute(
		VISIBLE_NAV_ITEMS.filter(
			(item) =>
				item.section === section &&
				item.showInCommandPalette !== false &&
				!PRIMARY_NAV_ITEM_ID_SET.has(item.id) &&
				(item.moduleGroup === section ||
					(item.showInSidebar === false && !item.moduleGroup)),
		),
	);
}

function buildNavItemsById(
	items: readonly NavigationItem[],
): ReadonlyMap<string, NavigationItem> {
	const map = new Map<string, NavigationItem>();

	for (const item of items) {
		if (!map.has(item.id)) {
			map.set(item.id, item);
		}
	}

	return map;
}

function dedupeByRoute(items: readonly NavigationItem[]): NavigationItem[] {
	const map = new Map<string, NavigationItem>();

	for (const item of items) {
		if (!map.has(item.to)) {
			map.set(item.to, item);
		}
	}

	return Array.from(map.values());
}

export const SIDEBAR_NAV_GROUPS: readonly NavigationGroup[] =
	SIDEBAR_GROUP_ORDER.map((section) => ({
		id: section,
		title: GROUP_METADATA[section].title,
		items: getItemsBySection(section),
	}));

export const AGENTS_PRIMARY_NAV_ITEMS: readonly NavigationItem[] =
	PRIMARY_NAV_ITEM_IDS.map((id) => NAV_ITEMS_BY_ID.get(id)).filter(
		(item): item is NavigationItem => Boolean(item),
	);

export const MODULE_NAV_GROUPS: readonly NavigationGroup[] =
	SIDEBAR_GROUP_ORDER.map((section) => ({
		id: section,
		title: GROUP_METADATA[section].title,
		items: getModuleItemsBySection(section),
	})).filter((group) => group.items.length > 0);

export const PLUGINS_NAV_ITEMS: readonly NavigationItem[] =
	VISIBLE_NAV_ITEMS.filter(
		(item) => item.section === "plugins" && item.showInSidebar !== false,
	);

export const AUTOMATIONS_NAV_ITEMS: readonly NavigationItem[] =
	VISIBLE_NAV_ITEMS.filter(
		(item) => item.section === "automations" && item.showInSidebar !== false,
	);

export const NAVIGATION_ITEMS_BY_ID: ReadonlyMap<string, NavigationItem> =
	NAV_ITEMS_BY_ID;

export const COMMAND_PALETTE_ITEMS: readonly NavigationItem[] =
	VISIBLE_NAV_ITEMS.filter((item) => item.showInCommandPalette !== false);

export const MOBILE_NAV_ITEMS_VIEW: readonly MobileNavigationItem[] =
	MOBILE_NAV_ITEMS_SOURCE.filter((item) =>
		isMobileNavigationRouteEnabledForDemo(item.href),
	);

// Keep legacy export name to avoid migration churn.
export const MOBILE_NAV_ITEMS = MOBILE_NAV_ITEMS_VIEW;

export function isNavigationItemActive(
	pathname: string,
	item: NavigationItem,
): boolean {
	const matchMode = item.activeMatch ?? (item.to === "/" ? "exact" : "prefix");

	if (matchMode === "exact") {
		return pathname === item.to;
	}

	if (pathname === item.to) {
		return true;
	}

	return pathname.startsWith(`${item.to}/`);
}
