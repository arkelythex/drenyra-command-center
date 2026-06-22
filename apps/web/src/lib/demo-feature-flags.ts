export type DemoFeatureKey = "payroll" | "scanner" | "economic-groups";

const DISABLED_DEMO_FEATURES = new Set<DemoFeatureKey>([
	"payroll",
	"scanner",
	"economic-groups",
]);

const DISABLED_NAVIGATION_ITEM_IDS = new Set<string>(["payroll", "scanner"]);

const DISABLED_MOBILE_ROUTES = new Set<string>(["/scanner"]);

export function isDemoFeatureEnabled(feature: DemoFeatureKey): boolean {
	return !DISABLED_DEMO_FEATURES.has(feature);
}

export function isNavigationItemEnabledForDemo(itemId: string): boolean {
	return !DISABLED_NAVIGATION_ITEM_IDS.has(itemId);
}

export function isMobileNavigationRouteEnabledForDemo(href: string): boolean {
	return !DISABLED_MOBILE_ROUTES.has(href);
}
